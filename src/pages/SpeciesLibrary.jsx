import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import SpeciesCard from "@/components/species/SpeciesCard";

export default function SpeciesLibrary() {
  const [species, setSpecies] = useState([]);

  useEffect(() => {
    base44.entities.Species.list("common_name").then(setSpecies);
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-5 py-14">
      <h1 className="font-heading text-3xl sm:text-4xl tracking-tight text-stone-50">Species playbooks</h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-stone-400">
        Every rating on the radar comes from these habitat rules — host trees, soil temperature bands, elevation, aspect
        and rain lag. No guesses, no black boxes.
      </p>
      <div className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {species.map((s) => (
          <SpeciesCard key={s.id} s={s} />
        ))}
      </div>
      {!species.length && <p className="mt-10 text-sm text-stone-500">Loading playbooks…</p>}
    </div>
  );
}