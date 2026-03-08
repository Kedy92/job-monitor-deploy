import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { createCVVersion, getCVVersions } from "../api/cvVersions";

export default function CVBuilderPage() {
  const { applicationId } = useParams();

  const [jobAdText, setJobAdText] = useState("");
  const [cvResult, setCvResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);

  async function loadHistory() {
    try {
      setLoadingHistory(true);
      const data = await getCVVersions(applicationId);
      setHistory(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load CV history:", err);
    } finally {
      setLoadingHistory(false);
    }
  }

  useEffect(() => {
    loadHistory();
  }, [applicationId]);

  const handleGenerate = async () => {
    if (!jobAdText.trim()) {
      alert("Please paste a job advertisement first.");
      return;
    }

    setLoading(true);

    try {
      const result = await createCVVersion({
        application_id: Number(applicationId),
        job_ad_text: jobAdText,
        template_name: "modern",
      });

      setCvResult(result);
      await loadHistory();
    } catch (err) {
      console.error(err);
      alert("Failed to generate CV");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">CV Builder</h1>
        <p className="text-slate-600 mt-2">
          Paste a job advertisement and generate a tailored CV draft.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Job advertisement
          </label>

          <textarea
            placeholder="Paste job advertisement here..."
            value={jobAdText}
            onChange={(e) => setJobAdText(e.target.value)}
            rows={12}
            className="w-full rounded-md border border-slate-300 p-3"
          />
        </div>

        <button
          type="button"
          onClick={handleGenerate}
          disabled={loading}
          className={`px-4 py-2 rounded-md text-sm font-medium text-white ${
            loading
              ? "bg-slate-500 cursor-not-allowed"
              : "bg-slate-900 hover:bg-slate-800"
          }`}
        >
          {loading ? "Generating..." : "Generate CV"}
        </button>
      </div>

      {cvResult && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900">
              Latest Generated CV
            </h2>

            <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
              ATS Score: {cvResult.ats_score}%
            </span>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Summary
            </h3>
            <p className="mt-2 text-slate-700">{cvResult.cv_summary}</p>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Skills
            </h3>
            <p className="mt-2 text-slate-700">{cvResult.cv_skills}</p>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Experience
            </h3>
            <p className="mt-2 text-slate-700">{cvResult.cv_experience}</p>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Missing Keywords
            </h3>
            <p className="mt-2 text-slate-700">
              {cvResult.missing_keywords || "None"}
            </p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900">
            Previous CV Versions
          </h2>
          <span className="text-sm text-slate-500">{history.length} saved</span>
        </div>

        {loadingHistory ? (
          <p className="text-slate-600">Loading CV history...</p>
        ) : history.length === 0 ? (
          <p className="text-slate-600">No CV versions saved yet.</p>
        ) : (
          <div className="space-y-4">
            {history.map((cv) => (
              <div
                key={cv.id}
                className="rounded-lg border border-slate-200 p-4 space-y-3"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="font-medium text-slate-900">
                    CV Version #{cv.id}
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                      ATS: {cv.ats_score}%
                    </span>

                    <a
                      href={`http://127.0.0.1:8000/cv-versions/${cv.id}/download`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1 rounded-md border border-slate-300 hover:bg-slate-50 text-sm"
                    >
                      Download PDF
                    </a>
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Summary
                  </h3>
                  <p className="mt-1 text-sm text-slate-700">{cv.cv_summary}</p>
                </div>

                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Skills
                  </h3>
                  <p className="mt-1 text-sm text-slate-700">{cv.cv_skills}</p>
                </div>

                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Missing Keywords
                  </h3>
                  <p className="mt-1 text-sm text-slate-700">
                    {cv.missing_keywords || "None"}
                  </p>
                </div>

                <div className="text-xs text-slate-400">
                  Created: {new Date(cv.created_at).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
