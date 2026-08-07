// Weather + elevation acquisition with source fallback.
const UA = { "User-Agent": "MushroomRadar/1.0 (habitat analysis)", Accept: "application/geo+json" };
const cToF = (c) => (c * 9) / 5 + 32;

export async function fetchElevations(points) {
  // points: [[lat,lng], ...] -> meters (null when unavailable)
  const lats = points.map((p) => p[0].toFixed(5)).join(",");
  const lngs = points.map((p) => p[1].toFixed(5)).join(",");
  try {
    const r = await fetch(`https://api.open-meteo.com/v1/elevation?latitude=${lats}&longitude=${lngs}`);
    if (r.ok) {
      const j = await r.json();
      if (Array.isArray(j.elevation) && j.elevation.length === points.length) return j.elevation;
    }
  } catch (_e) { /* fall through */ }

  const results = await Promise.all(
    points.map(async (p) => {
      try {
        const r = await fetch(`https://epqs.nationalmap.gov/v1/json?x=${p[1]}&y=${p[0]}&units=Meters&wkid=4326&includeDate=false`);
        if (!r.ok) return null;
        const j = await r.json();
        const v = Number(j?.value);
        return isFinite(v) ? v : null;
      } catch (_e) { return null; }
    })
  );
  return results;
}

function summarizeOpenMeteo(wx) {
  const h = wx.hourly || {};
  const times = h.time || [];
  const nowIdx = Math.max(0, times.length - 25);
  const slice = (arr, count) => (arr || []).slice(Math.max(0, nowIdx - count + 1), nowIdx + 1).filter((v) => v != null);
  const avg = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : null);
  const dailyRain = (wx.daily?.precipitation_sum || []).map((v) => v ?? 0);
  const dailyMax = wx.daily?.temperature_2m_max || [];
  const dailyMin = wx.daily?.temperature_2m_min || [];
  const dates = wx.daily?.time || [];
  const days = dates.slice(0, Math.max(0, dates.length - 1)).map((d, i) => ({
    date: d,
    rainIn: dailyRain[i] ?? 0,
    tempMaxF: dailyMax[i] ?? 60,
    tempMinF: dailyMin[i] ?? 40,
    humidityPct: null,
  }));
  const humidityPct = avg(slice(h.relative_humidity_2m, 72));
  for (const d of days) d.humidityPct = humidityPct ?? 65;
  return {
    source: "Open-Meteo (ECMWF/GFS reanalysis)",
    days,
    airTempF: (h.temperature_2m || [])[nowIdx] ?? null,
    humidityPct,
    measuredSoilTempF: avg(slice(h.soil_temperature_6cm, 72)),
    measuredSoilMoisture: avg(slice(h.soil_moisture_3_to_9cm, 24)),
  };
}

async function fetchOpenMeteo(lat, lng) {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(4)}&longitude=${lng.toFixed(4)}` +
    `&hourly=temperature_2m,relative_humidity_2m,soil_temperature_6cm,soil_moisture_3_to_9cm` +
    `&daily=precipitation_sum,temperature_2m_max,temperature_2m_min&past_days=14&forecast_days=1` +
    `&temperature_unit=fahrenheit&precipitation_unit=inch&timezone=auto`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`open-meteo ${r.status}`);
  return summarizeOpenMeteo(await r.json());
}

async function fetchNws(lat, lng) {
  const pr = await fetch(`https://api.weather.gov/points/${lat.toFixed(4)},${lng.toFixed(4)}`, { headers: UA });
  if (!pr.ok) throw new Error(`nws points ${pr.status}`);
  const point = await pr.json();
  const stationsUrl = point?.properties?.observationStations;
  if (!stationsUrl) throw new Error("no observation stations");
  const sr = await fetch(stationsUrl, { headers: UA });
  if (!sr.ok) throw new Error(`nws stations ${sr.status}`);
  const stations = await sr.json();
  const ids = (stations.features || []).slice(0, 3).map((f) => ({
    id: f.properties.stationIdentifier,
    name: f.properties.name,
    elevationM: f.properties?.elevation?.value ?? null,
  }));
  const start = new Date(Date.now() - 14 * 86400000).toISOString();

  const buckets = new Map();
  const used = [];
  for (const st of ids) {
    try {
      const or = await fetch(`https://api.weather.gov/stations/${st.id}/observations?start=${start}`, { headers: UA });
      if (!or.ok) continue;
      const obs = await or.json();
      const feats = obs.features || [];
      if (feats.length < 24) continue;
      used.push(st);
      for (const f of feats) {
        const p = f.properties || {};
        const day = (p.timestamp || "").slice(0, 10);
        if (!day) continue;
        const b = buckets.get(day) || { temps: [], hums: [], rain: 0, winds: [] };
        if (p.temperature?.value != null) b.temps.push(cToF(p.temperature.value));
        if (p.relativeHumidity?.value != null) b.hums.push(p.relativeHumidity.value);
        if (p.precipitationLastHour?.value != null) b.rain += p.precipitationLastHour.value / 25.4;
        if (p.windSpeed?.value != null) b.winds.push(p.windSpeed.value * 0.621371); // km/h -> mph
        buckets.set(day, b);
      }
      if (used.length >= 2) break;
    } catch (_e) { /* try next station */ }
  }
  if (!buckets.size) throw new Error("no station observations");

  const dayKeys = [...buckets.keys()].sort();
  const days = dayKeys.map((d) => {
    const b = buckets.get(d);
    const temps = b.temps.length ? b.temps : [55];
    return {
      date: d,
      tempMaxF: Math.max(...temps),
      tempMinF: Math.min(...temps),
      rainIn: b.rain / Math.max(1, used.length),
      humidityPct: b.hums.length ? b.hums.reduce((x, y) => x + y, 0) / b.hums.length : 65,
      windMph: b.winds.length ? b.winds.reduce((x, y) => x + y, 0) / b.winds.length : null,
    };
  });
  const recent = days.slice(-3);
  return {
    source: `NOAA/NWS stations ${used.map((u) => u.id).join(", ")}`,
    stations: used,
    days,
    airTempF: days[days.length - 1]?.tempMaxF ?? null,
    humidityPct: recent.length ? recent.reduce((s, d) => s + d.humidityPct, 0) / recent.length : null,
    windMph: recent.flatMap((d) => (d.windMph != null ? [d.windMph] : [])).reduce((x, y, _i, arr) => x + y, 0) / Math.max(1, recent.flatMap((d) => (d.windMph != null ? [d.windMph] : [])).length) || null,
    measuredSoilTempF: null,
    measuredSoilMoisture: null,
  };
}

// Best-effort 7-day forecast (daily max/min temp + precip). Returns [] on failure.
export async function fetchForecast(lat, lng) {
  // 1) NWS forecast grid (structured)
  try {
    const pr = await fetch(`https://api.weather.gov/points/${lat.toFixed(4)},${lng.toFixed(4)}`, { headers: UA });
    if (!pr.ok) throw new Error(`points ${pr.status}`);
    const fgUrl = (await pr.json()).properties?.forecastGridData;
    if (!fgUrl) throw new Error("no grid");
    const gr = await fetch(fgUrl, { headers: UA });
    if (!gr.ok) throw new Error(`grid ${gr.status}`);
    const grid = (await gr.json()).properties || {};
    const expand = (series) => {
      // series: [{validTime:"ISO/PTxH", value}] -> Map(date-> values[])
      const out = new Map();
      for (const seg of series || []) {
        const [iso, dur] = (seg.validTime || "").split("/");
        const start = new Date(iso);
        const hours = dur ? parseInt(dur.replace("PT", "").replace("H", "")) || 1 : 1;
        for (let i = 0; i < hours; i++) {
          const t = new Date(start.getTime() + i * 3600000);
          const key = t.toISOString().slice(0, 10);
          if (new Date() - t > 0) continue; // future only
          (out.get(key) || out.set(key, []).get(key)).push(seg.value);
        }
      }
      return out;
    };
    const temp = expand(grid.temperature?.values);
    const precip = expand(grid.quantitativePrecipitation?.values);
    const keys = [...temp.keys()].sort().slice(0, 7);
    return keys.map((d) => {
      const ts = temp.get(d) || [];
      const ps = precip.get(d) || [];
      const toF = (v) => (v == null ? null : (v * 9) / 5 + 32);
      return {
        date: d,
        tempMaxF: toF(Math.max(...ts.filter((v) => v != null))) ?? 60,
        tempMinF: toF(Math.min(...ts.filter((v) => v != null))) ?? 40,
        rainIn: (ps.reduce((s, v) => s + (v || 0), 0) || 0) / 25.4,
        humidityPct: 65,
      };
    });
  } catch (_e) { /* fall through */ }

  // 2) Open-Meteo forecast (best effort)
  try {
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(4)}&longitude=${lng.toFixed(4)}` +
      `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&forecast_days=7` +
      `&temperature_unit=fahrenheit&precipitation_unit=inch&timezone=auto`;
    const r = await fetch(url);
    if (!r.ok) return [];
    const j = await r.json();
    const d = j.daily || {};
    return (d.time || []).slice(0, 7).map((date, i) => ({
      date,
      tempMaxF: d.temperature_2m_max?.[i] ?? 60,
      tempMinF: d.temperature_2m_min?.[i] ?? 40,
      rainIn: d.precipitation_sum?.[i] ?? 0,
      humidityPct: 65,
    }));
  } catch (_e) { return []; }
}

export async function fetchWeather(lat, lng) {
  const errors = [];
  for (const fn of [fetchNws, fetchOpenMeteo]) {
    try {
      const out = await fn(lat, lng);
      if (out.days?.length) return { ...out, errors };
    } catch (e) {
      errors.push(e.message);
    }
  }
  throw new Error(`No weather source available (${errors.join("; ")})`);
}