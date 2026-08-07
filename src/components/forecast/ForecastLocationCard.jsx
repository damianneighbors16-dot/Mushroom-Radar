import SpeciesSuggestion from "./SpeciesSuggestion";

function Stat({ label, value, accent }) {
  return (
    <div className="rounded-lg bg-white/[0.02] border border-white/5 px-2.5 py-2">
      <div className="text-[9px] uppercase tracking-[0.12em] text-stone-500">{label}</div>
      <div className={`text-[13px] font-medium mt-0.5 ${accent || "text-stone-200"}`}>{value}</div>
    </div>
  );
}

export default function ForecastLocationCard({ loc }) {
  if (loc.error) {
    return (
      <div className="rounded-2xl border border-rose-400/20 bg-rose-400/[0.04] p-5">
        <div className="text-sm text-rose-300">{loc.label}</div>
        <div className="text-xs text-stone-400 mt-1">{loc.error}</div>
      </div>
    );
  }
  const c = loc.conditions || {};
  const fc = loc.soil?.forecast || [];
  const fcStart = fc[0]?.t4;
  const fcEnd = fc[fc.length - 1]?.t4;
  const arrow = fcEnd != null && fcStart != null ? (fcEnd > fcStart ? "↘ cooling" : fcEnd < fcStart ? "↗ warming" : "→ steady") : "";

  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.015] p-5 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-sm text-stone-100 font-medium truncate">{loc.label}</div>
          <div className="text-[11px] text-stone-500">
            {loc.findCount} find{loc.findCount === 1 ? "" : "s"} · {loc.lat.toFixed(3)}, {loc.lng.toFixed(3)}
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-[9px] uppercase tracking-[0.12em] text-stone-500">4" soil</div>
          <div className="text-emerald-300 font-medium leading-tight">{loc.soil?.t4?.toFixed(0)}°F</div>
          <div className="text-[10px] text-stone-500 capitalize">{loc.soil?.trend} · {arrow}</div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        <Stat label="Moisture" value={c.soilMoisture != null ? `${(c.soilMoisture * 100).toFixed(0)}%` : "—"} />
        <Stat label="Rain 14d" value={`${(c.rain14dIn || 0).toFixed(1)}"`} />
        <Stat label="Elevation" value={c.elevationFt ? `${Math.round(c.elevationFt).toLocaleString()} ft` : "—"} />
        <Stat label="Aspect" value={c.aspect || "—"} accent="text-amber-300" />
      </div>

      <div className="space-y-2 pt-1">
        {loc.suggestions?.map((s) => (
          <SpeciesSuggestion key={s.species_id || s.common_name} s={s} />
        ))}
      </div>
    </div>
  );
}