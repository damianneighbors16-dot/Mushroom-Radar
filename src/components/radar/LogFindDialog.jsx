import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, NotebookPen } from "lucide-react";

export default function LogFindDialog({ result, speciesName, onSaved }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    species_name: speciesName || "",
    quantity: "",
    notes: "",
    found_date: new Date().toISOString().slice(0, 10),
  });
  const [file, setFile] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    if (speciesName) setForm((f) => (f.species_name ? f : { ...f, species_name: speciesName }));
  }, [speciesName]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = async () => {
    setSaving(true);
    setErr(null);
    try {
      let photo_url;
      if (file) {
        const up = await base44.integrations.Core.UploadFile({ file });
        photo_url = up.file_url;
      }
      const c = result.conditions;
      await base44.entities.Find.create({
        species_name: form.species_name,
        quantity: form.quantity ? Number(form.quantity) : undefined,
        notes: form.notes,
        found_date: form.found_date,
        lat: result.lat,
        lng: result.lng,
        photo_url,
        elevation_ft: c.elevationFt,
        aspect: c.aspect,
        slope_deg: c.slopeDeg,
        soil_temp_f: c.soilTempF,
        soil_moisture: c.soilMoisture,
        rain_7d_in: c.rain7dIn,
        rating_at_find: result.analysis.rating,
      });
      setFile(null);
      setOpen(false);
      onSaved?.();
    } catch (e) {
      setErr(e.message || "Could not save find");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full bg-white/5 border-white/10 hover:bg-white/10 text-stone-100">
          <NotebookPen className="w-4 h-4 mr-2" /> Log a find here
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#121614] border-white/10 text-stone-100">
        <DialogHeader>
          <DialogTitle className="font-heading tracking-wide">Log a find</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs text-stone-400">Species</Label>
            <Input value={form.species_name} onChange={set("species_name")} className="bg-white/5 border-white/10" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-stone-400">Date</Label>
              <Input type="date" value={form.found_date} onChange={set("found_date")} className="bg-white/5 border-white/10" />
            </div>
            <div>
              <Label className="text-xs text-stone-400">Quantity</Label>
              <Input type="number" value={form.quantity} onChange={set("quantity")} className="bg-white/5 border-white/10" />
            </div>
          </div>
          <div>
            <Label className="text-xs text-stone-400">Notes</Label>
            <Textarea value={form.notes} onChange={set("notes")} className="bg-white/5 border-white/10" rows={3} />
          </div>
          <div>
            <Label className="text-xs text-stone-400">Photo</Label>
            <Input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} className="bg-white/5 border-white/10" />
          </div>
          <p className="text-[11px] text-stone-500">
            Conditions at this point ({result.analysis.rating}, {Math.round(result.conditions.elevationFt || 0).toLocaleString()} ft, {result.conditions.aspect}-facing) are saved with the find.
          </p>
          {err && <p className="text-[11px] text-rose-300">{err}</p>}
          <Button onClick={save} disabled={saving} className="w-full bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-semibold">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save find"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}