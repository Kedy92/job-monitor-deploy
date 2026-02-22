import "./App.css";

console.log("VITE_API_URL =", import.meta.env.VITE_API_URL);

export default function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-slate-900 to-slate-800 flex items-center justify-center">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-white backdrop-blur">
        <h1 className="text-4xl font-bold tracking-tight">Tailwind OK ✅</h1>
        <p className="mt-2 text-white/70">
          Utilities, gradient, blur, border opacity all working.
        </p>
        <button className="mt-6 rounded-xl bg-white px-4 py-2 text-black">
          Button test
        </button>
      </div>
    </div>
  );
}
