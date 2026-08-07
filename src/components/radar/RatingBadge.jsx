const styles = {
  Excellent: "bg-emerald-400/15 text-emerald-300 ring-emerald-400/40",
  Good: "bg-lime-400/15 text-lime-300 ring-lime-400/40",
  Fair: "bg-amber-400/15 text-amber-300 ring-amber-400/40",
  Poor: "bg-rose-400/15 text-rose-300 ring-rose-400/40",
  Unknown: "bg-white/5 text-stone-400 ring-white/10",
};

export default function RatingBadge({ rating, size = "md" }) {
  const cls = styles[rating] || styles.Unknown;
  return (
    <span
      className={`inline-flex items-center rounded-full ring-1 ${cls} ${
        size === "lg" ? "px-4 py-1.5 text-sm tracking-[0.18em]" : "px-2.5 py-1 text-[10px] tracking-[0.16em]"
      } uppercase font-semibold`}
    >
      {rating || "Unknown"}
    </span>
  );
}