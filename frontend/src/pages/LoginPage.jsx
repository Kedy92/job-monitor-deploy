import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login } from "../api/auth";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();

  async function handleLogin(e) {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const data = await login({
        email: email.trim(),
        password,
      });

      localStorage.setItem("token", data.access_token);
      navigate("/app", { replace: true });
    } catch (err) {
      const msg =
        err?.message || err?.data?.detail || err?.detail || "Login failed";
      alert(`Login failed: ${msg}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleLogin}
      className="w-[420px] bg-white rounded-2xl border border-slate-200 shadow-sm p-6"
    >
      <h1 className="text-2xl font-bold text-slate-900">Login</h1>
      <p className="text-slate-600 mt-1">Sign in to Job Monitor.</p>

      <div className="mt-5 space-y-3">
        <input
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-900 placeholder-slate-400 outline-none focus:ring-2 focus:ring-slate-300"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />

        <input
          type="password"
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-900 placeholder-slate-400 outline-none focus:ring-2 focus:ring-slate-300"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />
      </div>

      <button
        disabled={isSubmitting}
        className="mt-4 w-full rounded-xl bg-slate-900 text-white py-2 font-medium disabled:opacity-60"
      >
        {isSubmitting ? "Logging in..." : "Login"}
      </button>

      <div className="mt-4 text-sm text-slate-600">
        No account yet?{" "}
        <Link to="/register" className="font-medium text-slate-900 underline">
          Create one
        </Link>
      </div>
    </form>
  );
}
