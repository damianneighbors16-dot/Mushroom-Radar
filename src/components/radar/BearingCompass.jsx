import { useEffect, useState } from "react";
import { Navigation2, LocateFixed } from "lucide-react";

const toRad = (d) => (d * Math.PI) / 180;
const toDeg = (r) => (r * 180) / Math.PI;

function bearing(lat1, lng1, lat2, lng2) {
  const dLng = toRad(lng2 - lng1);
  const y = Math.sin(dLng) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLng);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

function haversineMi(lat1, lng1, lat2, lng2) {
  const R = 3958.8;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

const compassDirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
const dir = (b) => compassDirs[Math.round(b / 45) % 8];

export default function BearingCompass({ target }) {
  const [here, setHere] = useState(null);

  useEffect(() => {
    if (!target) return;
    const id = navigator.geolocation?.watchPosition(
      (pos) => setHere({ lat: pos.coords.latitude, lng: pos.coords.longitude, heading: pos.coords.heading }),
      () => setHere(null),
      { enableHighAccuracy: true, maximumAge: 5000 }
    );
    return () => id && navigator.geolocation?.clearWatch(id);
  }, [target]);

  if (!target) return null;
  if (!here) {
    return (
      <div className="rounded-xl bg-white/[0.03] px-3 py-2.5 flex items-center gap-2 text-xs text-stone-400">
        <LocateFixed className="w-3.5 h-3.5" />
        Enable GPS for bearing &amp; distance to pin
      </div>
    );
  }

  const b = bearing(here.lat, here.lng, target.lat, target.lng);
  const dist = haversineMi(here.lat, here.lng, target.lat, target.lng);
  const distLabel = dist < 0.1 ? `${Math.round(dist * 5280)} ft` : `${dist.toFixed(2)} mi`;

  return (
    <div className="rounded-xl bg-emerald-400/[0.04] border border-emerald-400/15 px-3 py-3">
      <div className="flex items-center gap-3">
        <div className="relative w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
          <div style={{ transform: `rotate(${b}deg)` }} className="transition-transform duration-300">
            <Navigation2 className="w-6 h-6 text-emerald-300" strokeWidth={2.5} />
          </div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-[0.14em] text-stone-500">Back to the pin</div>
          <div className="text-lg font-heading text-stone-50 leading-none mt-0.5">
            {distLabel} <span className="text-emerald-300">· {Math.round(b)}° {dir(b)}</span>
          </div>
          <div className="text-[11px] text-stone-500 mt-0.5">Heading from your location to target</div>
        </div>
      </div>
    </div>
  );
}