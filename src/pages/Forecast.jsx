import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import ForecastLocationCard from "@/components/forecast/ForecastLocationCard";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, Sprout, MapPin } from "lucide-react";

export default function Forecast() {
  const [finds, setFinds] = useState([]);
  const [species, setSpecies] = useState([]);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    base44.entities.Find.list("-found_date", 200).then(setFinds);
    base44.entities.Species.list("common_name").then(setSpecies);
  }, []);

  const locations = useMemo(() => {
    const map = new Map();
    finds.forEach((f) => {
      if (f.lat == null || f.lng == null) return;
      const key = `${f.lat.toFixed(3)},${f.lng.toFixed(3)}`;
      if (!map.has(key)) {
        map.set(key, {
          lat: f.lat,
          lng: f.lng,
          label: `${f.species_name || "Find"} · ${f.lat.toFixed(2)}, ${f.lng.toFixed(2)}`,
          findCount: 0,
        });
      }
      map.get(key).findCount++;
    });
    return [...map.values()];
  }, [finds]);

  const run = async () => {
    if (!locations.length || !species.length) return;
    setLoading(true);
    setError(null);
    setResults(null);
    try {
      const res = await base44.functions.invoke("forecastLocations", { locations, species });
      if (res.data?.error) setError(res.data.error);
      else setResults(res.data);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  // Auto-run once finds + species are both loaded.
  useEffect(() => {
    if (locations.length && species.length && !results && !loading) run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locations, species]);

  const ready = finds.length && species.length;

  return (
    <div className="mx-auto max-w-7xl px-5 py-14">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-heading text-3xl sm:text-4xl tracking-tight text-stone-50 flex items-center gap-2.5">
            <Sprout className="w-7 h-7 text-emerald-400" /> Forecast
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-stone-400">
            Your saved find spots are re-analyzed with live soil temperature &amp; moisture models. Each location is scored
            against every species in the library to show what's likely fruiting now and what's approaching.
          </p>
        </div>
        {ready ? (
          <Button onClick={run} disabled={loading} className="bg-emerald-500 text-emerald-950 hover:bg-emerald-400">
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
            {loading ? "Analyzing…" : "Refresh forecast"}
          </Button>
        ) : null}
      </div>

      {!ready ? (
        <div className="mt-12 rounded-2xl border border-white/8 bg-white/[0.015] p-10 text-center">
          <MapPin className="w-6 h-6 text-emerald-400/70 mx-auto" />
          <p className="mt-3 text-sm text-stone-300">No saved locations yet.</p>
          <p className="mt-1 text-xs text-stone-500">
            Log a find on the{" "}
            <Link to="/" className="text-emerald-300 underline underline-offset-2">Radar</Link>{" "}
            and it'll show up here for forecasting.
          </p>
        </div>
      ) : loading ? (
        <div className="mt-10 flex flex-col items-center gap-3 py-16 text-stone-400">
          <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
          <p className="text-xs tracking-[0.14em] uppercase">
            Modeling soil &amp; ranking {species.length} species across {locations.length} location{locations.length === 1 ? "" : "s"}…
          </p>
        </div>
      ) : error ? (
        <p className="mt-10 text-sm text-rose-300">{error}</p>
      ) : results ? (
        <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {results.locations.map((loc, i) => (
            <ForecastLocationCard key={`${loc.lat},${loc.lng}` || i} loc={loc} />
          ))}
        </div>
      ) : null}
    </div>
  );
}