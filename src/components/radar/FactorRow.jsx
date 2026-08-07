import { CheckCircle2, MinusCircle, XCircle } from "lucide-react";

const marks = {
  strong: { Icon: CheckCircle2, color: "text-emerald-400" },
  partial: { Icon: MinusCircle, color: "text-amber-400" },
  weak: { Icon: XCircle, color: "text-rose-400" },
};

export default function FactorRow({ factor }) {
  const { Icon, color } = marks[factor.strength] || marks.partial;
  return (
    <div className="flex gap-3 py-2.5 border-b border-white/5 last:border-0">
      <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${color}`} />
      <div className="min-w-0">
        <div className="text-[13px] font-medium text-stone-200">{factor.label}</div>
        <div className="text-xs text-stone-400 leading-relaxed">{factor.detail}</div>
      </div>
    </div>
  );
}