import { scoreHabitat } from "../../shared/habitat.ts";
import { buildConditions, flushStatusForSpecies } from "../../shared/analyze.ts";

export default async function (req) {
  try {
    const body = await req.json();
    const lat = Number(body.lat);
    const lng = Number(body.lng);
    const species = body.species || null;
    const canopy = body.canopy != null ? Number(body.canopy) : 0.6;
    if (!isFinite(lat) || !isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
      return Response.json({ error: "Invalid coordinates" }, { status: 400 });
    }

    const ctx = await buildConditions(lat, lng, canopy);
    const analysis = scoreHabitat(ctx.conditions, species);

    // Flush alert from the 7-day soil forecast.
    let flushAlert = null;
    const fs = flushStatusForSpecies(species, ctx.soil.t4, ctx.soil.forecast);
    if (fs && ctx.forecastDays.length) {
      const min = species.soil_temp_min_f;
      const max = species.soil_temp_max_f;
      const fc = ctx.soil.forecast;
      const rising = fc.length > 1 && fc[fc.length - 1].t4 > fc[0].t4;
      const rain = ctx.forecastDays.slice(0, 5).reduce((s, d) => s + (d.rainIn || 0), 0) >= 0.5;
      if (!fs.inWindowNow && fs.willEnter && (rising || rain)) {
        flushAlert = {
          type: "approaching",
          message: `${species.common_name || "Target"} flush approaching — 4" soil enters the ${min}–${max}°F window in the next ${fs.enterIdx} day(s).`,
        };
      } else if (fs.inWindowNow && (rising || rain)) {
        flushAlert = {
          type: "active",
          message: `Active ${species.common_name || "target"} window — 4" soil is inside ${min}–${max}°F${rain ? " and rain is forecast" : ""}.`,
        };
      } else if (fs.inWindowNow && !rising && !rain) {
        flushAlert = { type: "ending", message: `Soil warming out of the ${species.common_name || "target"} window; flush may be ending.` };
      }
    }

    return Response.json({
      lat,
      lng,
      conditions: ctx.conditions,
      terrain: { ...ctx.terrain, elevationFt: ctx.conditions.elevationFt, hasTerrainGrid: ctx.hasTerrainGrid },
      soil: ctx.soil,
      flushAlert,
      dailyWeather: ctx.dailyWeather,
      analysis,
      generated_at: new Date().toISOString(),
      sources: ctx.sources,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}