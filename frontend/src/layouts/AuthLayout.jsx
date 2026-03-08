import { Outlet } from "react-router-dom";
import { Briefcase } from "lucide-react";

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-indigo-900 to-slate-900 flex items-center justify-center">
      <div className="w-full max-w-md px-4 space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-500 rounded-xl mb-3 shadow-lg">
            <Briefcase size={24} className="text-white" />
          </div>
          <h2 className="text-white text-xl font-bold tracking-tight">Job Monitor</h2>
        </div>
        <Outlet />
      </div>
    </div>
  );
}
