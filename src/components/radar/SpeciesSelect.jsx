import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function SpeciesSelect({ species, value, onChange }) {
  return (
    <Select value={value || "generic"} onValueChange={onChange}>
      <SelectTrigger className="h-10 bg-white/5 border-white/10 text-stone-100 text-sm">
        <SelectValue placeholder="Any mushroom" />
      </SelectTrigger>
      <SelectContent className="bg-[#121614] border-white/10 text-stone-100">
        <SelectItem value="generic">Any mushroom (general habitat)</SelectItem>
        {species.map((s) => (
          <SelectItem key={s.id} value={s.id}>
            {s.emoji} {s.common_name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}