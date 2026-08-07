import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Ruler, Circle, X } from "lucide-react";

export default function MeasureToolbar({ mode, setMode }) {
  return (
    <div className="flex items-center gap-1 rounded-full bg-[#121614]/90 backdrop-blur border border-white/10 p-1">
      <Button
        size="sm"
        variant={mode === "distance" ? "default" : "ghost"}
        onClick={() => setMode(mode === "distance" ? null : "distance")}
        className={`h-8 px-3 text-xs ${mode === "distance" ? "bg-emerald-500 text-emerald-950" : "text-stone-300 hover:bg-white/10"}`}
      >
        <Ruler className="w-3.5 h-3.5 mr-1.5" /> Distance
      </Button>
      <Button
        size="sm"
        variant={mode === "area" ? "default" : "ghost"}
        onClick={() => setMode(mode === "area" ? null : "area")}
        className={`h-8 px-3 text-xs ${mode === "area" ? "bg-emerald-500 text-emerald-950" : "text-stone-300 hover:bg-white/10"}`}
      >
        <Circle className="w-3.5 h-3.5 mr-1.5" /> Honey Hole
      </Button>
      {mode && (
        <Button size="sm" variant="ghost" onClick={() => setMode(null)} className="h-8 px-2 text-stone-400 hover:text-rose-300">
          <X className="w-3.5 h-3.5" />
        </Button>
      )}
    </div>
  );
}