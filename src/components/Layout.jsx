import { Link, Outlet, useLocation } from "react-router-dom";
import { Radar, Leaf, NotebookPen, Sprout, Map } from "lucide-react";

const nav = [
  { to: "/", label: "Radar", icon: Radar },
  { to: "/species", label: "Species", icon: Leaf },
  { to: "/forecast", label: "Forecast", icon: Sprout },
  { to: "/patterns", label: "Patterns", icon: Map },
  { to: "/log", label: "Field Log", icon: NotebookPen },
];

export default function Layout() {
  const { pathname } = useLocation();
  return (
    <div className="min-h-screen bg-[#0c0f0d] text-stone-100 font-body">
      <header className="fixed top-0 inset-x-0 z-[900] border-b border-white/5 bg-[#0c0f0d]/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-5 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_12px] shadow-emerald-400/70" />
            <span className="text-[15px] tracking-[0.22em] uppercase font-semibold">Mushroom<span className="text-emerald-400">Radar</span></span>
          </Link>
          <nav className="flex items-center gap-1">
            {nav.map(({ to, label, icon: Icon }) => {
              const active = pathname === to;
              return (
                <Link
                  key={to}
                  to={to}
                  className={`flex items-center gap-2 rounded-full px-3.5 py-2 text-xs tracking-wide transition-all duration-300 ${
                    active ? "bg-emerald-400/10 text-emerald-300" : "text-stone-400 hover:text-stone-100"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </header>
      <main className="pt-14">
        <Outlet />
      </main>
    </div>
  );
}