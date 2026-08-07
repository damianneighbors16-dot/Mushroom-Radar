import { Link } from "react-router-dom";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-4 py-1.5 border-b border-white/5 last:border-0">
      <span className="text-[11px] uppercase tracking-[0.12em] text-stone-500">{label}</span>
      <span className="text-xs text-stone-200 text-right">{value}</span>
    </div>
  );
}

export default function SpeciesCard({ s }) {
  const season =
    s.season_start_month && s.season_end_month
      ? `${MONTHS[s.season_start_month - 1]} – ${MONTHS[s.season_end_month - 1]}`
      : "—";
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-6 transition-all duration-500 hover:border-emerald-400/30 hover:bg-white/[0.04]">
      <div className="flex items-start gap-3">
        <span className="text-2xl">{s.emoji || "🍄"}</span>
        <div>
          <h3 className="font-heading text-lg text-stone-50 leading-tight">{s.common_name}</h3>
          <p className="text-xs italic text-stone-500">{s.latin_name}</p>
        </div>
      </div>
      <p className="mt-4 text-[13px] leading-relaxed text-stone-400">{s.summary}</p>
      <div className="mt-5">
        <Row label="Host trees" value={(s.host_trees || []).join(", ") || "—"} />
        <Row label="Soil temp" value={s.soil_temp_min_f != null && s.soil_temp_max_f != null ? `${s.soil_temp_min_f}–${s.soil_temp_max_f}°F` : "—"} />
        <Row label="Elevation" value={`${(s.elevation_min_ft || 0).toLocaleString()}–${(s.elevation_max_ft || 0).toLocaleString()} ft`} />
        <Row label="Aspect" value={(s.preferred_aspects || []).join(" / ")} />
        <Row label="Rain lag" value={s.rain_lag_days_min != null && s.rain_lag_days_max != null ? `${s.rain_lag_days_min}–${s.rain_lag_days_max} days after ≥${s.rain_min_inches ?? 0}"` : "—"} />
        <Row label="Canopy" value={s.canopy_preference} />
        <Row label="Season" value={season} />
      </div>
      {s.notes && <p className="mt-4 text-[12px] text-stone-500 leading-relaxed">{s.notes}</p>}
      <Link to="/" className="mt-5 inline-block text-xs tracking-[0.14em] uppercase text-emerald-400 hover:text-emerald-300">
        Scout for this →
      </Link>
    </div>
  );
}