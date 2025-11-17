import { Link, Outlet, NavLink } from "react-router-dom"

export default function App() {
  return (
    <div className="min-h-full">
      {/* NAV */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-gray-200">
        <nav className="container-safe h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 rounded-full bg-emerald-600/15 ring-1 ring-emerald-600/20" />
            <span className="text-2xl font-semibold text-emerald-700">BrewScout</span>
          </Link>
          <div className="flex items-center gap-6 text-sm">
            <Nav to="/">Home</Nav>
            <Nav to="/search">Search</Nav>
            <Nav to="/saved">Saved</Nav>
          </div>
        </nav>
      </header>

      {/* PAGE */}
      <main className="container-safe py-8">
        <Outlet />
      </main>

      {/* FOOTER */}
      <footer className="mt-8 border-t border-gray-200">
        <div className="container-safe py-6 text-xs text-gray-500">
          Built for APImagination • React + Vite + Tailwind
        </div>
      </footer>
    </div>
  )
}

function Nav({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        isActive
          ? "text-emerald-700 font-medium"
          : "text-gray-600 hover:text-gray-900"
      }
    >
      {children}
    </NavLink>
  )
}
