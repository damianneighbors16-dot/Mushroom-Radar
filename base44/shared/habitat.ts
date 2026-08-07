// Explainable habitat scoring. Pure functions — no AI, no random numbers.

export const ASPECTS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];

export function aspectFromDegrees(deg) {
  const d = ((deg % 360) + 360) % 360;
  return ASPECTS[Math.round(d / 45) % 8];
}

// Slope/aspect from a 4-neighbour elevation sample (meters), spacing in meters.
export function terrainFromGrid({ north, south, east, west }, spacing) {
  const dzdx = (east - west) / (2 * spacing);
  const dzdy = (north - south) / (2 * spacing);
  const slopeDeg = Math.atan(Math.sqrt(dzdx * dzdx + dzdy * dzdy)) * (180 / Math.PI);
  let aspectDeg = (Math.atan2(dzdy, -dzdx) * 180) / Math.PI;
  aspectDeg = (450 - aspectDeg) % 360; // convert to compass bearing of downslope
  return { slopeDeg, aspectDeg, aspect: aspectFromDegrees(aspectDeg) };
}

function band(value, min, max, tolerance) {
  if (value == null) return 0.5;
  if (value >= min && value <= max) return 1;
  const dist = value < min ? min - value : value - max;
  return Math.max(0, 1 - dist / tolerance);
}

function inSeason(month, start, end) {
  if (!start || !end) return true;
  return start <= end ? month >= start && month <= end : month >= start || month <= end;
}

export function ratingFromScore(score) {
  if (score >= 0.78) return "Excellent";
  if (score >= 0.6) return "Good";
  if (score >= 0.4) return "Fair";
  return "Poor";
}

/**
 * conditions: { soilTempF, soilMoisture, humidityPct, rain7dIn, rain14dIn, daysSinceRain,
 *               elevationFt, slopeDeg, aspect, airTempF, month }
 * species: Species record (may be null for a generic read)
 */
export function scoreHabitat(conditions, species) {
  const c = conditions;
  const factors = [];
  const add = (label, weight, score, detail) => factors.push({ label, weight, score, detail });

  const soilMin = species?.soil_temp_min_f ?? 50;
  const soilMax = species?.soil_temp_max_f ?? 68;
  add(
    "Soil temperature",
    1.2,
    band(c.soilTempF, soilMin, soilMax, 10),
    `${c.soilTempF?.toFixed(0) ?? "—"}°F estimated at 2–3\" depth (target ${soilMin}–${soilMax}°F)`
  );

  const moistMin = species?.soil_moisture_min ?? 0.22;
  add(
    "Soil moisture",
    1.3,
    c.soilMoisture == null ? 0.5 : Math.min(1, Math.max(0, (c.soilMoisture - (moistMin - 0.12)) / 0.14)),
    `${c.soilMoisture != null ? (c.soilMoisture * 100).toFixed(0) + "% volumetric" : "—"} (needs ≥ ${(moistMin * 100).toFixed(0)}%)`
  );

  const rainMin = species?.rain_min_inches ?? 0.8;
  add(
    "Recent rainfall",
    1.4,
    Math.min(1, (c.rain14dIn ?? 0) / (rainMin * 1.5)),
    `${(c.rain14dIn ?? 0).toFixed(2)}" over 14 days, ${(c.rain7dIn ?? 0).toFixed(2)}" over 7 days (needs ≥ ${rainMin}")`
  );

  const lagMin = species?.rain_lag_days_min ?? 3;
  const lagMax = species?.rain_lag_days_max ?? 10;
  add(
    "Rain timing",
    1.1,
    c.daysSinceRain == null ? 0.5 : band(c.daysSinceRain, lagMin, lagMax, 6),
    c.daysSinceRain == null
      ? "no measurable rain in the archive window"
      : `${c.daysSinceRain} days since last soaking rain (fruiting lag ${lagMin}–${lagMax} days)`
  );

  const humMin = species?.humidity_min_pct ?? 70;
  add(
    "Humidity",
    0.9,
    c.humidityPct == null ? 0.5 : Math.min(1, Math.max(0, (c.humidityPct - (humMin - 20)) / 22)),
    `${c.humidityPct?.toFixed(0) ?? "—"}% average over the last 3 days (needs ≥ ${humMin}%)`
  );

  const elMin = species?.elevation_min_ft ?? 0;
  const elMax = species?.elevation_max_ft ?? 12000;
  add(
    "Elevation",
    1.0,
    band(c.elevationFt, elMin, elMax, 1200),
    `${Math.round(c.elevationFt ?? 0).toLocaleString()} ft (band ${elMin.toLocaleString()}–${elMax.toLocaleString()} ft)`
  );

  const prefAspects = species?.preferred_aspects?.length ? species.preferred_aspects : ["any"];
  const aspectOk = prefAspects.includes("any") || prefAspects.includes(c.aspect);
  const neighbours = { N: ["NW", "NE"], NE: ["N", "E"], E: ["NE", "SE"], SE: ["E", "S"], S: ["SE", "SW"], SW: ["S", "W"], W: ["SW", "NW"], NW: ["W", "N"] };
  const adjacent = !aspectOk && (neighbours[c.aspect] || []).some((a) => prefAspects.includes(a));
  add(
    "Slope aspect",
    0.9,
    aspectOk ? 1 : adjacent ? 0.7 : 0.35,
    `${c.aspect}-facing (prefers ${prefAspects.join("/")}) — ${c.aspect === "N" || c.aspect === "NE" || c.aspect === "NW" ? "cooler, holds moisture longer" : "warms and dries faster"}`
  );

  add(
    "Slope steepness",
    0.5,
    band(c.slopeDeg, species?.slope_min_deg ?? 0, species?.slope_max_deg ?? 40, 15),
    `${(c.slopeDeg ?? 0).toFixed(1)}° — ${(c.slopeDeg ?? 0) < 3 ? "flat, water pools and drains slowly" : (c.slopeDeg ?? 0) > 25 ? "steep, drains fast" : "moderate drainage"}`
  );

  const seasonOk = inSeason(c.month, species?.season_start_month, species?.season_end_month);
  add(
    "Season window",
    1.3,
    seasonOk ? 1 : 0.15,
    seasonOk ? "inside the documented fruiting window" : "outside the documented fruiting window"
  );

  if (c.airTempF != null) {
    add(
      "Air temperature",
      0.6,
      band(c.airTempF, 45, 78, 18),
      `${c.airTempF.toFixed(0)}°F now`
    );
  }

  // Drying stress: high wind + low humidity desiccates soil and pins.
  if (c.windMph != null || c.humidityPct != null) {
    const wind = c.windMph ?? 0;
    const hum = c.humidityPct ?? 70;
    let drying = 1;
    if (wind > 15 && hum < 30) drying = 0.45;
    else if (wind > 10 && hum < 40) drying = 0.7;
    else if (hum < 25) drying = 0.6;
    add(
      "Drying stress",
      0.8,
      drying,
      drying >= 0.9
        ? "sheltered from wind, humid air — surface stays moist"
        : `wind ${wind.toFixed(0)} mph, humidity ${hum.toFixed(0)}% — soil surface drying ${drying < 0.5 ? "fast" : "moderately"}`
    );
  }

  const totalWeight = factors.reduce((s, f) => s + f.weight, 0);
  const score = factors.reduce((s, f) => s + f.weight * f.score, 0) / totalWeight;
  const limiter = [...factors].sort((a, b) => a.score * a.weight - b.score * b.weight)[0];

  return {
    score,
    rating: ratingFromScore(score),
    factors: factors.map((f) => ({
      label: f.label,
      detail: f.detail,
      strength: f.score >= 0.8 ? "strong" : f.score >= 0.5 ? "partial" : "weak",
      score: Number(f.score.toFixed(2)),
    })),
    limitingFactor: limiter ? limiter.label : null,
  };
}