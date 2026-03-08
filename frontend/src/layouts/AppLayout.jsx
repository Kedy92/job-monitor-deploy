import { NavLink, Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import { logoutToLogin } from "../services/token";
import { LayoutDashboard, Briefcase, Wand2, LogOut, UserCircle } from "lucide-react";
import { getMe } from "../api/users";

function NavItem({ to, icon: Icon, children }) {
  return (
    <NavLink
      to={to}
      end={to === "/app"}
      className={({ isActive }) =>
        `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
          isActive
            ? "bg-indigo-500 text-white"
            : "text-indigo-100 hover:bg-indigo-700 hover:text-white"
        }`
      }
    >
      {Icon && <Icon size={16} />}
      {children}
    </NavLink>
  );
}

export default function AppLayout() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    getMe().then(setUser).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-indigo-800 text-white shadow-md">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center gap-6">
          <div className="flex items-center gap-2 font-bold text-lg tracking-tight">
            <Briefcase size={20} className="text-indigo-300" />
            <span>Job Monitor</span>
          </div>

          <nav className="flex items-center gap-1">
            <NavItem to="/app" icon={LayoutDashboard}>Dashboard</NavItem>
            <NavItem to="/app/applications" icon={Briefcase}>Applications</NavItem>
            <NavItem to="/app/ai-tools" icon={Wand2}>AI Tools</NavItem>
          </nav>

          <div className="ml-auto flex items-center gap-4">
            {user && (
              <div className="flex items-center gap-2 text-sm text-indigo-200">
                <UserCircle size={18} className="text-indigo-300" />
                <span>{user.name || user.email?.split("@")[0]}</span>
              </div>
            )}
            <button
              onClick={logoutToLogin}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-indigo-100 hover:bg-indigo-700 hover:text-white transition-colors"
            >
              <LogOut size={16} />
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
