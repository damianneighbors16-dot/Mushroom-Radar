import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import PatternsMap, { colorForSpecies } from "@/components/map/PatternsMap";
import { Mountain, Compass, Leaf } from "lucide-react";

export default function Patterns() {
  const [finds, setFinds] = useState([]);

  useEffect(() => {
    base44.entities.Find.list("-found_date", 500).then(setFinds);
  }, []);

  const center = useMemo(() => {
    if (!finds.length) return [39.64, -105.87];
    const lat = finds.reduce((s, f) => s + f.lat, 0) / finds.length;
    const lng = finds.reduce((s, f) => s + f.lng, 0) / finds.length;
    return [lat, lng];
  }, [finds]);

  const elevStats = useMemo(() => {
    const e = finds.map((f) => f.elevation_ft).filter((v) => v != null).sort((a, b) => a - b);
    if (!e.length) return null;
    return { min: e[0], med: e[Math.floor(e.length / 2)], max: e[e.length - 1] };
  }, [finds]);

  const aspectDist = useMemo(() => {
    const counts = {};
    finds.forEach((f) => {
      if (f.aspect) counts[f.aspect] = (counts[f.aspect] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [finds]);

  const topSpecies = useMemo(() => {
    const counts = {};
    finds.forEach((f) => {
      if (f.species_name) counts[f.species_name] = (counts[f.species_name] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [finds]);

  const maxAspect = aspectDist.length ? aspectDist[0][1] : 1;

  return (
    <div className="mx-auto max-w-7xl px-5 py-14">
      <h1 className="font-heading text-3xl sm:text-4xl tracking-tight text-stone-50">Habitat patterns</h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-stone-400">
        Every find is plotted over elevation relief and forest canopy. Dot color encodes species, size encodes quantity —
        click any marker for the full habitat record. Use the layer switcher (top-right) to toggle satellite canopy,
        hillshade terrain, and streams to read the patterns your finds cluster around.
      </p>

      {finds.length === 0 ? (
        <div className="mt-12 rounded-2xl border border-white/8 bg-white/[0.015] p-10 text-center">
          <Leaf className="w-6 h-6 text-emerald-400/70 mx-auto" />
          <p className="mt-3 text-sm text-stone-300">No finds to map yet.</p>
          <p className="mt-1 text-xs text-stone-500">
            Log finds on the{" "}
            <Link to="/" className="text-emerald-300 underline underline-offset-2">Radar</Link>{" "}
            to start visualizing where they cluster.
          </p>
        </div>
      ) : (
        <div className="mt-8 flex flex-col lg:flex-row gap-5">
          <div className="relative flex-1 min-h-[55vh] rounded-2xl overflow-hidden border border-white/8">
            <PatternsMap finds={finds} center={center} />
          </div>

          <aside className="w-full lg:w-80 shrink-0 space-y-4">
            <div className="rounded-2xl border border-white/8 bg-white/[0.015] p-4">
              <div className="flex items-center gap-2 text-stone-300">
                <Mountain className="w-4 h-4 text-emerald-400" />
                <span className="text-[11px] uppercase tracking-[0.16em]">Elevation band</span>
              </div>
              {elevStats ? (
                <div className="mt-3 flex items-end justify-between text-xs">
                  <div>
                    <div className="text-stone-500">min</div>
                    <div className="text-stone-200 font-medium">{Math.round(elevStats.min).toLocaleString()}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-stone-500">median</div>
                    <div className="text-emerald-300 font-medium">{Math.round(elevStats.med).toLocaleString()}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-stone-500">max</div>
                    <div className="text-stone-200 font-medium">{Math.round(elevStats.max).toLocaleString()}</div>
                  </div>
                  <div className="text-right text-stone-500">ft</div>
                </div>
              ) : (
                <p className="mt-2 text-xs text-stone-500">No elevation data recorded on finds.</p>
              )}
            </div>

            <div className="rounded-2xl border border-white/8 bg-white/[0.015] p-4">
              <div className="flex items-center gap-2 text-stone-300">
                <Compass className="w-4 h-4 text-emerald-400" />
                <span className="text-[11px] uppercase tracking-[0.16em]">Aspect mix</span>
              </div>
              <div className="mt-3 space-y-1.5">
                {aspectDist.length ? aspectDist.map(([asp, n]) => (
                  <div key={asp} className="flex items-center gap-2 text-xs">
                    <span className="w-7 text-stone-400">{asp}</span>
                    <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
                      <div className="h-full bg-amber-400/70" style={{ width: `${(n / maxAspect) * 100}%` }} />
                    </div>
                    <span className="w-5 text-right text-stone-500">{n}</span>
                  </div>
                )) : <p className="text-xs text-stone-500">No aspect data recorded.</p>}
              </div>
            </div>

            <div className="rounded-2xl border border-white/8 bg-white/[0.015] p-4">
              <div className="flex items-center gap-2 text-stone-300">
                <Leaf className="w-4 h-4 text-emerald-400" />
                <span className="text-[11px] uppercase tracking-[0.16em]">Top species</span>
              </div>
              <div className="mt-3 space-y-1.5">
                {topSpecies.map(([name, n]) => (
                  <div key={name} className="flex items-center gap-2 text-xs">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: colorForSpecies(name) }} />
                    <span className="flex-1 text-stone-200 truncate">{name}</span>
                    <span className="text-stone-500">{n}</span>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}