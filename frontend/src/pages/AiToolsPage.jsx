import { useState } from "react";
import { Wand2, Search } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL;

export default function AiToolsPage() {
  const [jobDescription, setJobDescription] = useState("");
  const [keywords, setKeywords] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleAnalyze() {
    if (!jobDescription.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`${API_BASE}/ai/match-score`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          job_description: jobDescription,
          profile_keywords: keywords.split(",").map((k) => k.trim()).filter(Boolean),
        }),
      });
      if (!res.ok) throw new Error("Request failed");
      setResult(await res.json());
    } catch {
      alert("Analysis failed");
    } finally {
      setLoading(false);
    }
  }

  const score = result?.score ?? 0;
  const scoreColor =
    score >= 75 ? "bg-emerald-500" :
    score >= 50 ? "bg-yellow-400" : "bg-red-400";
  const scoreBadge =
    score >= 75 ? "bg-emerald-100 text-emerald-700" :
    score >= 50 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-600";

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-indigo-100 rounded-lg">
          <Wand2 size={22} className="text-indigo-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">CV Match Analyzer</h1>
          <p className="text-sm text-slate-500">
            Analyze how well your profile matches a job description.
          </p>
        </div>
      </div>

      {/* Input */}
      <div className="card p-6 space-y-4">
        <textarea
          className="input resize-none h-40"
          placeholder="Paste job description here..."
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
        />

        <input
          className="input"
          placeholder="Your profile keywords, comma separated (e.g. Python, React, SQL)"
          value={keywords}
          onChange={(e) => setKeywords(e.target.value)}
        />

        <button
          onClick={handleAnalyze}
          disabled={loading}
          className="btn-primary text-base px-6 py-3"
        >
          <Search size={18} />
          {loading ? "Analyzing..." : "Analyze Match"}
        </button>
      </div>

      {/* Result */}
      {result && (
        <div className="card p-6 space-y-6">
          {/* Score bar */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="font-semibold text-slate-900">Match Score</span>
              <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${scoreBadge}`}>
                {score}%
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all duration-700 ${scoreColor}`}
                style={{ width: `${score}%` }}
              />
            </div>
          </div>

          {/* Matched keywords */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">
              Matched Keywords
            </h3>
            {(result.matched_keywords || []).length === 0 ? (
              <p className="text-sm text-slate-500">No matches found.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {(result.matched_keywords || []).map((k) => (
                  <span key={k} className="bg-emerald-100 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full text-sm">
                    {k}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Missing keywords */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">
              Missing Keywords
            </h3>
            {(result.missing_keywords || []).length === 0 ? (
              <p className="text-sm text-slate-500">Nothing missing — great match!</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {(result.missing_keywords || []).map((k) => (
                  <span key={k} className="bg-red-50 text-red-600 border border-red-100 px-2.5 py-1 rounded-full text-sm">
                    {k}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
