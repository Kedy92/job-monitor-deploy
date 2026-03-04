import { NavLink, Outlet } from "react-router-dom";
import { logoutToLogin } from "../services/token";

function NavItem({ to, children }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `px-3 py-2 rounded-md text-sm font-medium ${
          isActive
            ? "bg-slate-700 text-white"
            : "text-slate-200 hover:bg-slate-700 hover:text-white"
        }`
      }
      end={to === "/app"}
    >
      {children}
    </NavLink>
  );
}

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-slate-800 text-white">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center gap-4">
          <div className="font-bold">Job Monitor</div>

          <nav className="flex items-center gap-2">
            {/* exact routes */}
            <NavItem to="/app">Dashboard</NavItem>
            <NavItem to="/app/ai-tools">ApplicationsAI Tools</NavItem>
            <NavItem to="/app/applications">Applications</NavItem>
          </nav>

          <div className="ml-auto">
            <button
              onClick={logoutToLogin}
              className="px-3 py-2 rounded-md text-sm font-medium bg-slate-700 hover:bg-slate-600"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        <Outlet />
      </main>
    </div>
  );
}
