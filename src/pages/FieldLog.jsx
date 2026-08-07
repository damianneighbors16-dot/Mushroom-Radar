import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import FindCard from "@/components/finds/FindCard";

export default function FieldLog() {
  const [finds, setFinds] = useState([]);

  const load = async () => setFinds(await base44.entities.Find.list("-found_date", 200));
  useEffect(() => { load(); }, []);

  const remove = async (find) => {
    await base44.entities.Find.delete(find.id);
    load();
  };

  return (
    <div className="mx-auto max-w-7xl px-5 py-14">
      <h1 className="font-heading text-3xl sm:text-4xl tracking-tight text-stone-50">Field log</h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-stone-400">
        Each find is stored with the exact habitat conditions of the day — the record you compare future predictions against.
      </p>
      {finds.length === 0 ? (
        <p className="mt-12 text-sm text-stone-500">No finds logged yet. Analyze a spot on the radar and log it from there.</p>
      ) : (
        <div className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {finds.map((f) => (
            <FindCard key={f.id} find={f} onDelete={remove} />
          ))}
        </div>
      )}
    </div>
  );
}