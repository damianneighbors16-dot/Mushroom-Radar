const statusStyle = {
  "Fruiting now": "bg-emerald-400/15 text-emerald-300 border-emerald-400/30",
  Approaching: "bg-amber-400/15 text-amber-300 border-amber-400/30",
  Good: "bg-sky-400/15 text-sky-300 border-sky-400/30",
  Marginal: "bg-stone-400/10 text-stone-300 border-stone-400/20",
  Low: "bg-zinc-400/5 text-zinc-400 border-zinc-400/10",
};

export default function SpeciesSuggestion({ s }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-white/[0.02] border border-white/5 px-3 py-2.5">
      <span className="text-lg leading-none">{s.emoji}</span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-[13px] text-stone-100 font-medium truncate">{s.common_name}</span>
          <span className={`text-[9px] uppercase tracking-[0.08em] px-1.5 py-0.5 rounded-full border whitespace-nowrap ${statusStyle[s.status] || statusStyle.Low}`}>
            {s.status}
          </span>
        </div>
        <div className="text-[11px] text-stone-500 mt-0.5 truncate">
          {s.keyFactor ? `limiting: ${s.keyFactor.toLowerCase()}` : "no limiter"}
          {s.enterDay ? ` · enters window day ${s.enterDay}` : ""}
        </div>
      </div>
      <div className="text-right shrink-0">
        <div className="text-[10px] text-stone-400">{s.rating}</div>
        <div className="w-16 h-1.5 rounded-full bg-white/5 mt-1 overflow-hidden">
          <div className="h-full bg-emerald-400/70" style={{ width: `${Math.round(s.score * 100)}%` }} />
        </div>
      </div>
    </div>
  );
}