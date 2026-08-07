import { Image } from "@/components/ui/image";
import RatingBadge from "@/components/radar/RatingBadge";
import { MapPin, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function FindCard({ find, onDelete }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.02] overflow-hidden transition-all duration-500 hover:border-white/15">
      {find.photo_url && (
        <Image src={find.photo_url} alt={find.species_name} className="w-full h-44 object-cover" />
      )}
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-heading text-base text-stone-50">{find.species_name || "Unidentified"}</h3>
            <p className="text-xs text-stone-500">{find.found_date}{find.quantity ? ` · ${find.quantity} found` : ""}</p>
          </div>
          <RatingBadge rating={find.rating_at_find} />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-stone-400">
          <span>{find.elevation_ft ? `${Math.round(find.elevation_ft).toLocaleString()} ft` : "—"}</span>
          <span>{find.aspect ? `${find.aspect}-facing` : "—"}</span>
          <span>{find.soil_temp_f != null ? `Soil ${find.soil_temp_f.toFixed(0)}°F` : "—"}</span>
          <span>{find.rain_7d_in != null ? `${find.rain_7d_in.toFixed(2)}" rain 7d` : "—"}</span>
        </div>
        {find.notes && <p className="mt-3 text-[13px] text-stone-400 leading-relaxed">{find.notes}</p>}
        <div className="mt-4 flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-[11px] text-stone-500">
            <MapPin className="w-3 h-3" /> {find.lat.toFixed(4)}, {find.lng.toFixed(4)}
          </span>
          <Button variant="ghost" size="sm" onClick={() => onDelete(find)} className="text-stone-500 hover:text-rose-400">
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}