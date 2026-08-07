import { scoreHabitat } from "../../shared/habitat.ts";
import { buildConditions, flushStatusForSpecies } from "../../shared/analyze.ts";

// Forecasts which species are likely fruiting at each of the user's saved
// (find) locations. Client passes deduped locations + the species library;
// we run the soil model per location and score every species against it.
export default async function (req) {
  try {
    const body = await req.json();
    const locations = Array.isArray(body.locations) ? body.locations : [];
    const speciesList = Array.isArray(body.species) ? body.species : [];
    if (!locations.length) return Response.json({ locations: [] });
    if (!speciesList.length) return Response.json({ error: "No species provided" }, { status: 400 });

    // Cap to keep runtime + external API calls bounded.
    const capped = locations.slice(0, 12);

    const results = await Promise.all(
      capped.map(async (loc) => {
        const lat = Number(loc.lat);
        const lng = Number(loc.lng);
        if (!isFinite(lat) || !isFinite(lng)) return null;
        try {
          const ctx = await buildConditions(lat, lng, 0.6);
          const suggestions = speciesList
            .map((sp) => {
              const analysis = scoreHabitat(ctx.conditions, sp);
              const fs = flushStatusForSpecies(sp, ctx.soil.t4, ctx.soil.forecast) || {};
              let status = "Low";
              if (fs.inWindowNow) status = "Fruiting now";
              else if (fs.willEnter) status = "Approaching";
              else if (analysis.score >= 0.6) status = "Good";
              else if (analysis.score >= 0.4) status = "Marginal";
              return {
                species_id: sp.id,
                common_name: sp.common_name,
                emoji: sp.emoji || "🍄",
                score: Number(analysis.score.toFixed(2)),
                rating: analysis.rating,
                status,
                keyFactor: analysis.limitingFactor,
                enterDay: fs.enterIdx ?? null,
              };
            })
            .sort((a, b) => b.score - a.score);

          return {
            lat,
            lng,
            label: loc.label || `${lat.toFixed(3)}, ${lng.toFixed(3)}`,
            findCount: loc.findCount || 0,
            conditions: ctx.conditions,
            soil: {
              t4: ctx.soil.t4,
              t2: ctx.soil.t2,
              t8: ctx.soil.t8,
              moisture: ctx.soil.moisture,
              trend: ctx.soil.trend,
              forecast: ctx.soil.forecast,
            },
            suggestions: suggestions.slice(0, 6),
          };
        } catch (e) {
          return { lat, lng, label: loc.label, findCount: loc.findCount || 0, error: e.message };
        }
      })
    );

    return Response.json({
      locations: results.filter(Boolean),
      generated_at: new Date().toISOString(),
      sources: ["NOAA weather", "USGS elevation grid", "MushroomRadar layered soil model"],
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}