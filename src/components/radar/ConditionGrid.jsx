function Cell({ label, value, accent }) {
  return (
    <div className="rounded-xl bg-white/[0.03] px-3 py-2.5">
      <div className="text-[10px] uppercase tracking-[0.14em] text-stone-500">{label}</div>
      <div className={`text-sm mt-1 font-medium ${accent || "text-stone-100"}`}>{value}</div>
    </div>
  );
}

const trendColor = {
  Warming: "text-amber-300",
  "Slow warming": "text-amber-300",
  Cooling: "text-sky-300",
  "Slow cooling": "text-sky-300",
  Steady: "text-stone-300",
};

export default function ConditionGrid({ c, soil }) {
  const n = (v, d = 0) => (v == null ? "—" : v.toFixed(d));
  return (
    <div className="space-y-2">
      {soil && (
        <div className="rounded-2xl bg-emerald-400/[0.04] border border-emerald-400/15 p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase tracking-[0.16em] text-emerald-300/80">Estimated soil temperature</span>
            {soil.snowCover && <span className="text-[10px] text-sky-300">snow cover</span>}
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Cell label="2 inch" value={`${n(soil.t2)}°F`} accent="text-emerald-200" />
            <Cell label="4 inch" value={`${n(soil.t4)}°F`} accent="text-emerald-200" />
            <Cell label="8 inch" value={`${n(soil.t8)}°F`} accent="text-emerald-200" />
          </div>
          <div className="flex items-center justify-between mt-2 px-1 text-[11px]">
            <span className="text-stone-400">
              Trend: <span className={trendColor[soil.trend] || "text-stone-300"}>{soil.trend || "—"}</span>
            </span>
            <span className="text-stone-400">Confidence: <span className="text-stone-200">{soil.confidence}</span></span>
          </div>
        </div>
      )}
      <div className="grid grid-cols-2 gap-2">
        <Cell label="Soil moisture" value={c.soilMoisture == null ? "—" : `${(c.soilMoisture * 100).toFixed(0)}%`} />
        <Cell label="Rain 14d" value={`${n(c.rain14dIn, 2)}"`} />
        <Cell label="Last soaking rain" value={c.daysSinceRain == null ? "none" : `${c.daysSinceRain} d ago`} />
        <Cell label="Humidity" value={`${n(c.humidityPct)}%`} />
        <Cell label="Air temp" value={`${n(c.airTempF)}°F`} />
        <Cell label="Elevation" value={c.elevationFt == null ? "—" : `${Math.round(c.elevationFt).toLocaleString()} ft`} />
        <Cell label="Slope / aspect" value={`${n(c.slopeDeg, 1)}° ${c.aspect}`} />
        <Cell label="Canopy" value={c.canopy >= 0.75 ? "Dense" : c.canopy >= 0.4 ? "Moderate" : "Open"} />
      </div>
    </div>
  );
}