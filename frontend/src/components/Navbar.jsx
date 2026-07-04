import { NavLink } from "react-router-dom";

const links = [
  { to: "/", label: "Home", end: true },
  { to: "/scan", label: "Scanner" },
  { to: "/matching", label: "Matching" },
  { to: "/passport", label: "Passport" },
  { to: "/dashboard", label: "ESG Dashboard" },
];

export default function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-moss-100 bg-paper/90 backdrop-blur">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <NavLink to="/" className="flex items-center gap-2">
          <span className="h-8 w-8 rounded-full bg-moss-600 flex items-center justify-center">
            <span className="h-3.5 w-3.5 rounded-full border-2 border-white border-dashed animate-[spin_6s_linear_infinite]" />
          </span>
          <span className="font-display font-semibold text-lg tracking-tight">ReLoop AI</span>
        </NavLink>
        <nav className="hidden md:flex items-center gap-1">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                `px-3.5 py-2 rounded-full text-sm font-medium transition-colors ${
                  isActive ? "bg-moss-600 text-white" : "text-ink/70 hover:bg-moss-50"
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}
