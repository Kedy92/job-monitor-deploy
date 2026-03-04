import { useState } from "react";

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
          profile_keywords: keywords
            .split(",")
            .map((k) => k.trim())
            .filter(Boolean),
        }),
      });

      if (!res.ok) throw new Error("Request failed");

      const data = await res.json();
      setResult(data);
    } catch (err) {
      alert("Analysis failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold text-slate-900">CV Match Analyzer</h1>
      <p className="text-slate-600">
        Analyze how well your profile matches a job description.
      </p>

      {/* Input Section */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <textarea
          className="w-full h-40 p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400"
          placeholder="Paste job description here..."
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
        />

        <input
          className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400"
          placeholder="Enter your profile keywords (comma separated)"
          value={keywords}
          onChange={(e) => setKeywords(e.target.value)}
        />

        <button
          onClick={handleAnalyze}
          disabled={loading}
          className="bg-slate-900 text-white px-5 py-2 rounded-md hover:bg-slate-700 transition disabled:opacity-50"
        >
          {loading ? "Analyzing..." : "Analyze Match"}
        </button>
      </div>

      {/* Result Section */}
      {result && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
          {/* Score */}
          <div>
            <div className="flex justify-between mb-2">
              <span className="font-semibold text-lg">Match Score</span>
              <span className="font-semibold text-lg">
                {result.score ?? 0}%
              </span>
            </div>

            <div className="w-full bg-slate-200 rounded-full h-4">
              <div
                className={`h-4 rounded-full transition-all duration-500 ${
                  result.score >= 75
                    ? "bg-green-500"
                    : result.score >= 50
                    ? "bg-yellow-500"
                    : "bg-red-500"
                }`}
                style={{ width: `${result.score ?? 0}%` }}
              />
            </div>
          </div>

          {/* Matched Keywords */}
          <div>
            <strong>Matched Keywords</strong>
            <div className="flex flex-wrap gap-2 mt-2">
              {(result.matched_keywords || []).map((k) => (
                <span
                  key={k}
                  className="bg-green-100 text-green-700 px-2 py-1 rounded-md text-sm"
                >
                  {k}
                </span>
              ))}
            </div>
          </div>

          {/* Missing Keywords */}
          <div>
            <strong>Missing Keywords</strong>
            <div className="flex flex-wrap gap-2 mt-2">
              {(result.missing_keywords || []).map((k) => (
                <span
                  key={k}
                  className="bg-red-100 text-red-700 px-2 py-1 rounded-md text-sm"
                >
                  {k}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
