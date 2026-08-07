// Shared condition-building core used by both analyzeHabitat and forecastLocations.
// Pulls elevation grid + weather history, runs the layered soil model, and
// projects a 7-day soil forecast. Pure data assembly — no species scoring here.

import { terrainFromGrid } from "./habitat.ts";
import { fetchWeather, fetchElevations, fetchForecast } from "./weather.ts";
import { simulateSoil } from "./soil.ts";

const SPACING_M = 120;

function offset(lat, lng, dNorthM, dEastM) {
  const dLat = dNorthM / 111320;
  const dLng = dEastM / (111320 * Math.cos((lat * Math.PI) / 180));
  return [lat + dLat, lng + dLng];
}

export async function buildConditions(lat, lng, canopy = 0.6) {
  const points = [
    [lat, lng],
    offset(lat, lng, SPACING_M, 0),
    offset(lat, lng, -SPACING_M, 0),
    offset(lat, lng, 0, SPACING_M),
    offset(lat, lng, 0, -SPACING_M),
  ];

  const [elevs, wx] = await Promise.all([fetchElevations(points), fetchWeather(lat, lng)]);

  const centerM = elevs[0];
  const haveGrid = elevs.every((v) => v != null);
  const terrain = haveGrid
    ? terrainFromGrid({ north: elevs[1], south: elevs[2], east: elevs[3], west: elevs[4] }, SPACING_M)
    : { slopeDeg: 0, aspectDeg: 0, aspect: "N" };

  const soil = simulateSoil(wx.days, {
    canopy,
    slopeDeg: terrain.slopeDeg,
    aspectDeg: terrain.aspectDeg,
    elevationFt: centerM != null ? centerM * 3.28084 : null,
    stationElevationFt: wx.stations?.[0]?.elevationM != null ? wx.stations[0].elevationM * 3.28084 : null,
  });

  const soilTempF = wx.measuredSoilTempF ?? soil.t4;
  const soilMoisture = wx.measuredSoilMoisture ?? soil.soilMoisture;
  const soilLayers = wx.measuredSoilTempF != null
    ? { t2: soil.t2, t4: wx.measuredSoilTempF, t8: soil.t8, source: "reanalysis + simulation" }
    : { t2: soil.t2, t4: soil.t4, t8: soil.t8, source: "MushroomRadar layered soil model" };

  const past = wx.days;
  const rain14dIn = past.reduce((s, d) => s + (d.rainIn || 0), 0);
  const rain7dIn = past.slice(-7).reduce((s, d) => s + (d.rainIn || 0), 0);
  let daysSinceRain = null;
  for (let i = past.length - 1; i >= 0; i--) {
    if ((past[i].rainIn || 0) >= 0.15) { daysSinceRain = past.length - 1 - i; break; }
  }

  const conditions = {
    soilTempF,
    soilMoisture,
    humidityPct: wx.humidityPct,
    airTempF: wx.airTempF,
    windMph: wx.windMph ?? null,
    rain7dIn,
    rain14dIn,
    daysSinceRain,
    elevationFt: centerM != null ? centerM * 3.28084 : null,
    slopeDeg: terrain.slopeDeg,
    aspect: terrain.aspect,
    month: new Date().getMonth() + 1,
    canopy,
  };

  // 7-day soil forecast projection (best-effort).
  let soilForecast = [];
  let forecastDays = [];
  try {
    forecastDays = await fetchForecast(lat, lng);
    if (forecastDays.length) {
      const full = [...past, ...forecastDays];
      const proj = simulateSoil(full, {
        canopy,
        slopeDeg: terrain.slopeDeg,
        aspectDeg: terrain.aspectDeg,
        elevationFt: centerM != null ? centerM * 3.28084 : null,
      });
      soilForecast = proj.series.slice(-forecastDays.length).map((s) => ({
        date: s.date,
        t4: Number(s.t4.toFixed(1)),
        moisture: Number((s.soilMoisture ?? 0).toFixed(3)),
      }));
    }
  } catch (_e) { /* forecast optional */ }

  return {
    conditions,
    terrain,
    hasTerrainGrid: haveGrid,
    soil: {
      t2: soilLayers.t2,
      t4: soilLayers.t4,
      t8: soilLayers.t8,
      moisture: soilMoisture,
      trend: soil.trend,
      confidence: soil.confidence,
      snowCover: soil.snow,
      series: soil.series,
      forecast: soilForecast,
    },
    dailyWeather: past.slice(-14),
    forecastDays,
    sources: [
      wx.source,
      haveGrid ? "USGS 3DEP / Copernicus DEM elevation grid" : "elevation unavailable",
      soilLayers.source,
    ],
  };
}

// Flush window status for a species given current 4" soil temp and its forecast.
export function flushStatusForSpecies(species, soilT4, soilForecast) {
  if (!species?.soil_temp_min_f || !species?.soil_temp_max_f) return null;
  const min = species.soil_temp_min_f;
  const max = species.soil_temp_max_f;
  const inWindowNow = soilT4 >= min && soilT4 <= max;
  const enterIdx = soilForecast.findIndex((s) => s.t4 >= min && s.t4 <= max);
  const willEnter = !inWindowNow && enterIdx >= 0;
  return { inWindowNow, willEnter, enterIdx: enterIdx >= 0 ? enterIdx + 1 : null };
}