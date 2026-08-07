import { motion } from "framer-motion";
import RatingBadge from "./RatingBadge";
import FactorRow from "./FactorRow";
import ConditionGrid from "./ConditionGrid";
import SoilTrendChart from "./SoilTrendChart";
import BearingCompass from "./BearingCompass";
import LogFindDialog from "./LogFindDialog";
import { Loader2, Crosshair, Bell, Flame } from "lucide-react";

const flushStyle = {
  approaching: { color: "text-emerald-300", ring: "border-emerald-400/30 bg-emerald-400/[0.06]", Icon: Bell },
  active: { color: "text-emerald-300", ring: "border-emerald-400/30 bg-emerald-400/[0.06]", Icon: Flame },
  ending: { color: "text-amber-300", ring: "border-amber-400/30 bg-amber-400/[0.06]", Icon: Bell },
};

export default function AnalysisPanel({ loading, error, result, target, speciesName, speciesWindow, onSaved }) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-stone-400 gap-3">
        <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
        <p className="text-xs tracking-[0.14em] uppercase">Reading stations, terrain &amp; soil</p>
      </div>
    );
  }
  if (error) {
    return <p className="py-16 text-center text-sm text-rose-300">{error}</p>;
  }
  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center gap-3 px-6">
        <Crosshair className="w-6 h-6 text-emerald-400/70" />
        <p className="text-sm text-stone-300">Tap anywhere on the map</p>
        <p className="text-xs text-stone-500 leading-relaxed max-w-xs">
          MushroomRadar pulls the nearest weather stations, builds a 14-day soil model and measures the slope, aspect and
          elevation of that exact hillside — then explains its verdict.
        </p>
      </div>
    );
  }

  const { analysis, conditions, soil, flushAlert, sources } = result;
  const flush = flushAlert ? flushStyle[flushAlert.type] : null;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="p-5 space-y-5">
      <div>
        <div className="flex items-center justify-between gap-3">
          <RatingBadge rating={analysis.rating} size="lg" />
          <span className="text-[11px] text-stone-500">{result.lat.toFixed(4)}, {result.lng.toFixed(4)}</span>
        </div>
        <p className="mt-3 text-[13px] text-stone-300 leading-relaxed">
          <span className="text-stone-100 font-medium">{analysis.rating}</span> for {speciesName || "general fruiting"} here.
          {analysis.limitingFactor ? ` Limiting factor: ${analysis.limitingFactor.toLowerCase()}.` : ""}
        </p>
      </div>

      {flush && flushAlert && (
        <div className={`rounded-xl border px-3 py-2.5 ${flush.ring} flex gap-2.5`}>
          <flush.Icon className={`w-4 h-4 mt-0.5 shrink-0 ${flush.color}`} />
          <p className="text-[12px] leading-relaxed text-stone-200">{flushAlert.message}</p>
        </div>
      )}

      <ConditionGrid c={conditions} soil={soil} />

      {soil?.series?.length > 1 && (
        <SoilTrendChart series={soil.series} forecast={soil.forecast || []} window={speciesWindow} />
      )}

      {target && <BearingCompass target={target} />}

      <div>
        <h4 className="text-[11px] uppercase tracking-[0.18em] text-stone-500 mb-1">Why this rating</h4>
        {analysis.factors.map((f) => (
          <FactorRow key={f.label} factor={f} />
        ))}
      </div>

      <LogFindDialog result={result} speciesName={speciesName} onSaved={onSaved} />

      <div className="rounded-xl bg-white/[0.02] border border-white/5 px-3 py-2.5">
        <div className="text-[10px] uppercase tracking-[0.14em] text-stone-500 mb-1.5">Based on</div>
        <div className="text-[11px] text-stone-400 leading-relaxed space-y-0.5">
          <div>✓ NOAA weather station data</div>
          <div>✓ Elevation lapse correction</div>
          <div>✓ Forest canopy shading</div>
          <div>✓ Slope aspect solar gain</div>
          <div>✓ 14-day weather history</div>
          <div>✓ Layered soil &amp; snow model</div>
          <div>✓ Wind / humidity drying stress</div>
        </div>
      </div>
      <p className="text-[10px] text-stone-600 leading-relaxed">Sources: {sources.join(" · ")}</p>
    </motion.div>
  );
}