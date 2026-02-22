import { Outlet } from "react-router-dom";

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-200 via-slate-100 to-slate-300 text-slate-800">
      <nav className="bg-slate-800 text-slate-100 shadow-md px-6 py-4 flex justify-between items-center">
        <span className="font-semibold text-lg tracking-tight">
          Job Monitor
        </span>

        <button
          onClick={() => {
            localStorage.removeItem("token");
            window.location.href = "/login";
          }}
          className="text-sm bg-slate-600 hover:bg-slate-500 px-3 py-1 rounded-md transition"
        >
          Logout
        </button>
      </nav>

      <div className="max-w-5xl mx-auto py-10 px-6">
        <Outlet />
      </div>
    </div>
  );
}
