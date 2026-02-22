import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { register } from "../api/auth"; // <-- uses your api client wrapper

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  async function handleRegister(e) {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
      });

      alert("Account created! Please login.");
      navigate("/login", { replace: true });
    } catch (err) {
      // Works with both our api wrapper errors and raw fetch errors
      const msg =
        err?.message || err?.data?.detail || err?.detail || "Register failed";
      alert(`Register failed: ${msg}`);
    } finally {
      // CRITICAL: without this, button can stay stuck forever
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleRegister}
      className="w-[420px] bg-white rounded-2xl border border-slate-200 shadow-sm p-6"
    >
      <h1 className="text-2xl font-bold text-slate-900">Create account</h1>
      <p className="text-slate-600 mt-1">
        Register a new user for Job Monitor.
      </p>

      <div className="mt-5 space-y-3">
        <input
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-900 placeholder-slate-400 outline-none focus:ring-2 focus:ring-slate-300"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="name"
        />

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
          autoComplete="new-password"
        />
      </div>

      <button
        disabled={isSubmitting}
        className="mt-4 w-full rounded-xl bg-slate-900 text-white py-2 font-medium disabled:opacity-60"
      >
        {isSubmitting ? "Creating..." : "Create account"}
      </button>

      <div className="mt-4 text-sm text-slate-600">
        Already have an account?{" "}
        <Link to="/login" className="font-medium text-slate-900 underline">
          Login
        </Link>
      </div>
    </form>
  );
}
