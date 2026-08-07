import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, ReferenceArea, CartesianGrid } from "recharts";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const fmt = (d) => {
  const dt = new Date(d + "T00:00");
  return `${MONTHS[dt.getUTCMonth()]} ${dt.getUTCDate()}`;
};

export default function SoilTrendChart({ series = [], forecast = [], window = null }) {
  const past = series.map((s) => ({ date: s.date, t4: Number(s.t4.toFixed(1)) }));
  const fut = forecast.map((s) => ({ date: s.date, t4: Number(s.t4.toFixed(1)) }));
  // Past line carries nulls for forecast days; forecast line carries nulls for past + the join point.
  const join = fut.length ? { date: past[past.length - 1]?.date, t4: past[past.length - 1]?.t4 } : null;
  const data = [
    ...past.map((p) => ({ ...p, t4past: p.t4, t4fut: null })),
    ...(join ? [{ date: join.date, t4past: join.t4, t4fut: join.t4 }] : []),
    ...fut.map((f) => ({ ...f, t4past: null, t4fut: f.t4 })),
  ];
  if (!data.length) return null;

  const min = window ? window[0] : null;
  const max = window ? window[1] : null;
  const forecastStart = past.length ? past[past.length - 1].date : fut[0]?.date;

  return (
    <div className="rounded-xl bg-white/[0.03] p-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] uppercase tracking-[0.14em] text-stone-500">4" soil temperature trend</span>
        <span className="text-[10px] text-stone-600">{past.length}d past · {fut.length}d forecast</span>
      </div>
      <div className="h-[120px] -ml-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 6, right: 8, bottom: 0, left: 0 }}>
            {min != null && max != null && (
              <ReferenceArea y1={min} y2={max} fill="#34d399" fillOpacity={0.12} />
            )}
            <CartesianGrid stroke="#ffffff10" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={fmt}
              tick={{ fill: "#78716c", fontSize: 9 }}
              axisLine={false}
              tickLine={false}
              minTickGap={18}
            />
            <YAxis
              tick={{ fill: "#78716c", fontSize: 9 }}
              axisLine={false}
              tickLine={false}
              width={24}
              domain={["dataMin - 4", "dataMax + 4"]}
            />
            <Tooltip
              contentStyle={{ background: "#121614", border: "1px solid #ffffff15", borderRadius: 8, fontSize: 11, color: "#e7e5e4" }}
              labelFormatter={fmt}
              formatter={(v) => [`${v}°F`, "4\" soil"]}
            />
            <Line type="monotone" dataKey="t4past" stroke="#34d399" strokeWidth={2} dot={false} connectNulls />
            <Line type="monotone" dataKey="t4fut" stroke="#34d399" strokeWidth={2} dot={false} strokeDasharray="3 3" connectNulls />
          </LineChart>
        </ResponsiveContainer>
      </div>
      {min != null && max != null && (
        <p className="text-[10px] text-emerald-400/70 mt-1">Green band = optimal fruiting window ({min}–{max}°F)</p>
      )}
    </div>
  );
}