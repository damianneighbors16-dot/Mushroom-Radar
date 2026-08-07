// Layered soil temperature model with thermal memory.
// Estimates 2", 4" and 8" soil temperatures from weather history + terrain.
// Never: soilTemp = airTemp. Soil has memory and changes slowly.

// Layer response rates (fraction of air-heat gap closed per day, before damping)
// 2" reacts fast, 4" moderate, 8" slow.
const LAYER_PARAMS = {
  t2: { depth: 2, response: 0.34 },   // up to ~+/-2°F/day
  t4: { depth: 4, response: 0.17 },    // up to ~+/-1°F/day
  t8: { depth: 8, response: 0.085 },   // up to ~+/-0.5°F/day
};

// Elevation lapse rate: ~3.3°F per 1000 ft cooling with altitude.
const LAPSE_PER_FT = 0.0033;

// Daily solar gain (deg F) on open south aspect at mid-latitude during day.
// Scaled by day length proxy (month) and reduced by cloud cover (rain/humidity).
function solarGain(day, opts) {
  const month = new Date(day.date).getUTCMonth() + 1;
  const dayLen = 0.5 + 0.5 * Math.sin(((month - 4) / 12) * Math.PI * 2); // peak ~June
  const base = 4.5 * (0.45 + dayLen);
  const cloud = Math.min(1, (day.rainIn || 0) * 0.4 + (100 - (day.humidityPct || 70)) / 200);
  return base * (1 - 0.55 * cloud);
}

// Simple snow accumulation/melt. Tracks snow water equivalent (inches).
function snowState(days) {
  let swe = 0;
  let snowDepth = 0; // inches
  let cover = false;
  const out = [];
  for (const d of days) {
    const tMax = d.tempMaxF ?? 60;
    const tMin = d.tempMinF ?? 40;
    const mean = (tMax + tMin) / 2;
    const rain = d.rainIn || 0;
    if (mean < 32) {
      // snowfall
      swe += rain;
    } else if (mean < 36 && tMin < 32) {
      swe += rain * 0.6;
    } else if (swe > 0) {
      // melt
      swe = Math.max(0, swe - (mean - 32) * 0.06 - rain * 0.05);
    }
    snowDepth = swe * 10; // rough 10:1 ratio
    cover = snowDepth > 0.5;
    out.push({ date: d.date, snowCover: cover, snowDepthIn: snowDepth });
  }
  return { series: out, cover: out[out.length - 1]?.snowCover || false };
}

/**
 * simulateSoil(days, opts)
 * days: [{ date, tempMaxF, tempMinF, rainIn, humidityPct }] oldest -> newest
 * opts: { canopy (0..1), slopeDeg, aspectDeg, elevationFt, stationElevationFt, startSoilTempF }
 * returns { t2, t4, t8, soilMoisture, trend, confidence, series, snow }
 */
export function simulateSoil(days, opts = {}) {
  if (!days?.length) {
    return { t2: null, t4: null, t8: null, soilMoisture: null, trend: null, confidence: "Low", series: [], snow: false };
  }

  const canopy = opts.canopy ?? 0.6;
  const slopeDeg = opts.slopeDeg ?? 5;
  const aspectDeg = opts.aspectDeg ?? 0; // compass bearing of downslope
  const elevationFt = opts.elevationFt ?? null;
  const stationElevationFt = opts.stationElevationFt ?? elevationFt;

  // Elevation correction: cooling vs reference station.
  const elevOffset = elevationFt != null && stationElevationFt != null
    ? -(elevationFt - stationElevationFt) * LAPSE_PER_FT
    : 0;

  // Aspect solar correction (south = +, north = -), reduced on steep slopes.
  const aspectRad = (((aspectDeg % 360) + 360) % 360) * Math.PI / 180;
  // south = 180deg. cos(aspect - 180) ranges -1 (north) .. +1 (south)
  const aspectFactor = Math.cos(aspectRad - Math.PI);
  const aspectAdj = aspectFactor * 3.0 * Math.min(1, slopeDeg / 20); // ±3°F on steep, ~0 on flat

  // Canopy correction: dense forest cools soil (shade), open meadow warms.
  // canopy 0 (open) => +3, canopy 1 (dense) => -6
  const canopyAdj = 3 - canopy * 9;

  // Slope drainage: steep slopes dry/warm faster in sun, flats hold moisture/cooler.
  const slopeAdj = slopeDeg > 20 ? 0.6 : slopeDeg < 3 ? -0.4 : 0;

  // Snow insulation: if snow cover present, soil pins near 32°F.
  const snow = snowState(days);

  let t2 = opts.startSoilTempF ?? null;
  let t4 = opts.startSoilTempF ?? null;
  let t8 = opts.startSoilTempF ?? null;
  let moisture = opts.startMoisture ?? 0.22;
  const series = [];

  for (let i = 0; i < days.length; i++) {
    const d = days[i];
    const airMean = ((d.tempMaxF ?? 60) + (d.tempMinF ?? 40)) / 2 + elevOffset;
    if (t4 == null) { t2 = airMean; t4 = airMean; t8 = airMean; }

    const snowDay = snow.series[i]?.snowCover;
    if (snowDay) {
      // Pin soil near freezing; small drift toward 32.
      t2 = t2 + (32 - t2) * 0.4;
      t4 = t4 + (32 - t4) * 0.2;
      t8 = t8 + (32 - t8) * 0.08;
    } else {
      const solar = solarGain(d, opts) * (1 - 0.8 * canopy); // canopy kills solar gain
      const corrections = canopyAdj + aspectAdj + slopeAdj;

      // Moisture damping: wet soil responds slower.
      const damp = moisture > 0.3 ? 0.65 : moisture < 0.15 ? 1.15 : 1.0;

      const step = (layer) => {
        const r = layer.response * damp;
        const fromAir = (airMean - layer.temp) * r;
        const fromSolar = solar * (layer.response / LAYER_PARAMS.t4.response) * 0.5;
        const delta = fromAir + fromSolar + corrections * (layer.response / LAYER_PARAMS.t4.response);
        // Clamp daily change to physically realistic bounds per layer.
        const maxDelta = layer.response * 6; // 2"->2°F, 4"->1°F, 8"->0.5°F
        return Math.max(-maxDelta, Math.min(maxDelta, delta));
      };

      t2 = t2 + step({ depth: 2, response: LAYER_PARAMS.t2.response, temp: t2 });
      t4 = t4 + step({ depth: 4, response: LAYER_PARAMS.t4.response, temp: t4 });
      t8 = t8 + step({ depth: 8, response: LAYER_PARAMS.t8.response, temp: t8 });
    }

    // Moisture bucket (unchanged physics)
    const rainToSoil = (d.rainIn || 0) * 0.0254 * (1 - 0.25 * Math.min(1, slopeDeg / 35));
    moisture += rainToSoil / 0.15;
    const dryness = Math.max(0, (100 - (d.humidityPct ?? 60)) / 100);
    const et = 0.012 * dryness * (1 - 0.4 * canopy) * Math.max(0.2, (airMean - 32) / 50);
    const drainage = Math.max(0, moisture - 0.34) * 0.5 + moisture * 0.01 * Math.min(1, slopeDeg / 20);
    moisture = Math.min(0.45, Math.max(0.05, moisture - et - drainage));

    series.push({ date: d.date, t2, t4, t8, soilMoisture: moisture, snowCover: !!snowDay });
  }

  const last = series[series.length - 1];

  // Trend: slope of 4" temp over last 5 days.
  const recent = series.slice(-5);
  let trend = null;
  if (recent.length >= 2) {
    const slope = (recent[recent.length - 1].t4 - recent[0].t4) / (recent.length - 1);
    if (slope > 0.6) trend = "Warming";
    else if (slope > 0.15) trend = "Slow warming";
    else if (slope < -0.6) trend = "Cooling";
    else if (slope < -0.15) trend = "Slow cooling";
    else trend = "Steady";
  }

  // Confidence: based on history length + terrain data availability.
  let confidence = "Low";
  if (days.length >= 14 && elevationFt != null && opts.aspectDeg != null) confidence = "Medium";
  if (days.length >= 25 && elevationFt != null && opts.aspectDeg != null && !snow.cover) confidence = "High";

  return {
    t2: last.t2,
    t4: last.t4,
    t8: last.t8,
    soilMoisture: last.soilMoisture,
    trend,
    confidence,
    series: series.slice(-14),
    snow: snow.cover,
  };
}