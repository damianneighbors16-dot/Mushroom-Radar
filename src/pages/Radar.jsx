import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import MapCanvas, { fmtMi } from "@/components/map/MapCanvas";
import MeasureToolbar from "@/components/map/MeasureToolbar";
import AnalysisPanel from "@/components/radar/AnalysisPanel";
import SpeciesSelect from "@/components/radar/SpeciesSelect";
import { Button } from "@/components/ui/button";
import { LocateFixed } from "lucide-react";

const toRad = (d) => (d * Math.PI) / 180;
function haversineMi(lat1, lng1, lat2, lng2) {
  const R = 3958.8;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export default function Radar() {
  const [species, setSpecies] = useState([]);
  const [speciesId, setSpeciesId] = useState("generic");
  const [finds, setFinds] = useState([]);
  const [target, setTarget] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [center, setCenter] = useState([39.64, -105.87]);
  const [measureMode, setMeasureMode] = useState(null);
  const [measurePts, setMeasurePts] = useState([]);
  const [area, setArea] = useState(null);
  const [areaStats, setAreaStats] = useState(null);

  const loadFinds = async () => setFinds(await base44.entities.Find.list("-found_date", 200));

  useEffect(() => {
    base44.entities.Species.list("common_name").then(setSpecies);
    loadFinds();
  }, []);

  const analyze = async (lat, lng, sid = speciesId) => {
    setTarget({ lat, lng });
    setLoading(true);
    setError(null);
    setResult(null);
    const chosen = species.find((s) => s.id === sid) || null;
    const res = await base44.functions.invoke("analyzeHabitat", { lat, lng, species: chosen });
    setLoading(false);
    if (res.data?.error) setError(res.data.error);
    else setResult(res.data);
  };

  const onSpeciesChange = (sid) => {
    setSpeciesId(sid);
    if (target) analyze(target.lat, target.lng, sid);
  };

  const locate = () => {
    navigator.geolocation?.getCurrentPosition((pos) => {
      const { latitude, longitude } = pos.coords;
      setCenter([latitude, longitude]);
      analyze(latitude, longitude);
    });
  };

  const onMeasureClick = (latlng) => {
    if (measureMode === "distance") {
      setMeasurePts((p) => [...p, latlng]);
    } else if (measureMode === "area") {
      // First click = center, second click = radius edge.
      setArea((prev) => {
        if (prev) {
          const r = haversineMi(prev.lat, prev.lng, latlng.lat, latlng.lng) * 1609.34;
          const next = { ...prev, radiusM: r };
          sampleArea(next);
          return next;
        }
        return { lat: latlng.lat, lng: latlng.lng, radiusM: 200 };
      });
    }
  };

  const sampleArea = async (a) => {
    try {
      const res = await base44.functions.invoke("analyzeHabitat", { lat: a.lat, lng: a.lng });
      setAreaStats({
        radiusMi: a.radiusM / 1609.34,
        centerElevFt: res.data?.conditions?.elevationFt ?? null,
        centerAspect: res.data?.conditions?.aspect ?? "—",
        rating: res.data?.analysis?.rating ?? "—",
      });
    } catch (_e) {
      setAreaStats(null);
    }
  };

  const totalDist = measurePts.reduce((s, p, i) => (i === 0 ? 0 : s + haversineMi(measurePts[i - 1].lat, measurePts[i - 1].lng, p.lat, p.lng)), 0);

  const chosen = species.find((s) => s.id === speciesId);
  const chosenName = chosen?.common_name;
  const speciesWindow = chosen?.soil_temp_min_f != null && chosen?.soil_temp_max_f != null
    ? [chosen.soil_temp_min_f, chosen.soil_temp_max_f]
    : null;

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-3.5rem)]">
      <div className="relative flex-1 min-h-[45vh]">
        <MapCanvas
          center={center}
          target={target}
          finds={finds}
          onPick={(lat, lng) => analyze(lat, lng)}
          mode={measureMode}
          measurePts={measurePts}
          onMeasureClick={onMeasureClick}
          area={area}
        />
        <div className="absolute top-4 left-4 z-[500] w-64 space-y-2">
          <SpeciesSelect species={species} value={speciesId} onChange={onSpeciesChange} />
          <Button onClick={locate} className="w-full h-10 bg-[#121614]/90 backdrop-blur border border-white/10 text-stone-200 hover:bg-[#1a1f1c]">
            <LocateFixed className="w-4 h-4 mr-2" /> Analyze my location
          </Button>
          <MeasureToolbar mode={measureMode} setMode={(m) => { setMeasureMode(m); setMeasurePts([]); setArea(null); setAreaStats(null); }} />
          {measureMode === "distance" && measurePts.length > 1 && (
            <div className="rounded-xl bg-[#121614]/90 backdrop-blur border border-white/10 px-3 py-2 text-xs text-stone-200">
              Total distance: <span className="text-emerald-300 font-medium">{fmtMi(totalDist * 1609.34)}</span> · {measurePts.length} pts
            </div>
          )}
          {measureMode === "area" && areaStats && (
            <div className="rounded-xl bg-[#121614]/90 backdrop-blur border border-white/10 px-3 py-2 text-xs text-stone-200 space-y-0.5">
              <div>Honey-hole radius: <span className="text-amber-300 font-medium">{areaStats.radiusMi.toFixed(2)} mi</span></div>
              <div>Center elevation: {areaStats.centerElevFt ? `${Math.round(areaStats.centerElevFt).toLocaleString()} ft` : "—"}</div>
              <div>Center habitat: <span className="text-emerald-300">{areaStats.rating}</span> ({areaStats.centerAspect})</div>
            </div>
          )}
        </div>
      </div>
      <aside className="w-full lg:w-[400px] shrink-0 border-t lg:border-t-0 lg:border-l border-white/8 bg-[#0f1311] overflow-y-auto">
        <AnalysisPanel loading={loading} error={error} result={result} target={target} speciesName={chosenName} speciesWindow={speciesWindow} onSaved={loadFinds} />
      </aside>
    </div>
  );
}