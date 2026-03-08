import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FileText, Sparkles, Clock, Download, ChevronDown, ChevronUp, LayoutTemplate, ArrowLeft } from "lucide-react";
import { createCVVersion, getCVVersions } from "../api/cvVersions";

const TEMPLATES = [
  {
    id: "modern",
    label: "Modern",
    description: "Clean layout with accent colors and section dividers.",
    preview: "bg-indigo-50 border-indigo-200",
    accent: "bg-indigo-600",
  },
  {
    id: "classic",
    label: "Classic",
    description: "Traditional format, ideal for corporate roles.",
    preview: "bg-slate-50 border-slate-300",
    accent: "bg-slate-700",
  },
  {
    id: "minimal",
    label: "Minimal",
    description: "Simple and clean — lets the content speak.",
    preview: "bg-white border-slate-200",
    accent: "bg-slate-400",
  },
];

const ATS_COLOR = (score) => {
  if (score >= 75) return "bg-emerald-100 text-emerald-700";
  if (score >= 50) return "bg-yellow-100 text-yellow-700";
  return "bg-red-100 text-red-600";
};

function SectionLabel({ children }) {
  return (
    <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-1">
      {children}
    </h3>
  );
}

function CVCard({ cv, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <div
        className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-slate-50 transition-colors"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="flex items-center gap-3">
          <FileText size={16} className="text-indigo-500" />
          <span className="font-medium text-slate-800">CV Version #{cv.id}</span>
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${ATS_COLOR(cv.ats_score)}`}>
            ATS {cv.ats_score}%
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400 hidden sm:block">
            {new Date(cv.created_at).toLocaleDateString()}
          </span>
          <a
            href={`http://127.0.0.1:8000/cv-versions/${cv.id}/download`}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="btn-secondary py-1 px-2 text-xs"
          >
            <Download size={12} />
            PDF
          </a>
          {open ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
        </div>
      </div>

      {open && (
        <div className="px-5 pb-5 pt-1 border-t border-slate-100 space-y-4">
          <div>
            <SectionLabel>Summary</SectionLabel>
            <p className="text-sm text-slate-700 leading-relaxed">{cv.cv_summary}</p>
          </div>
          <div>
            <SectionLabel>Skills</SectionLabel>
            <div className="flex flex-wrap gap-2 mt-1">
              {cv.cv_skills.split(",").map((s) => s.trim()).filter(Boolean).map((s) => (
                <span key={s} className="bg-indigo-50 text-indigo-700 border border-indigo-100 text-xs px-2.5 py-0.5 rounded-full font-medium">
                  {s}
                </span>
              ))}
            </div>
          </div>
          <div>
            <SectionLabel>Experience</SectionLabel>
            <p className="text-sm text-slate-700 leading-relaxed">{cv.cv_experience}</p>
          </div>
          {cv.missing_keywords && (
            <div>
              <SectionLabel>Missing Keywords</SectionLabel>
              <div className="flex flex-wrap gap-2 mt-1">
                {cv.missing_keywords.split(",").map((k) => k.trim()).filter(Boolean).map((k) => (
                  <span key={k} className="bg-red-50 text-red-600 border border-red-100 text-xs px-2 py-0.5 rounded-full">
                    {k}
                  </span>
                ))}
              </div>
            </div>
          )}
          <div className="text-xs text-slate-400">
            Generated: {new Date(cv.created_at).toLocaleString()}
          </div>
        </div>
      )}
    </div>
  );
}

export default function CVBuilderPage() {
  const { applicationId } = useParams();
  const navigate = useNavigate();

  const [jobAdText, setJobAdText] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("modern");
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

  useEffect(() => { loadHistory(); }, [applicationId]);

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
        template_name: selectedTemplate,
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
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <FileText size={22} className="text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">CV Builder</h1>
            <p className="text-sm text-slate-500">
              Paste a job advertisement and generate a tailored CV draft.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => navigate("/app/applications")}
          className="btn-secondary"
        >
          <ArrowLeft size={16} />
          Back to Applications
        </button>
      </div>

      {/* Step 1 — Job ad */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center gap-2 text-base font-semibold text-slate-900">
          <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center font-bold">1</span>
          Paste the job advertisement
        </div>
        <textarea
          placeholder="Paste job advertisement here..."
          value={jobAdText}
          onChange={(e) => setJobAdText(e.target.value)}
          rows={10}
          className="input resize-none"
        />
      </div>

      {/* Step 2 — Template */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center gap-2 text-base font-semibold text-slate-900">
          <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center font-bold">2</span>
          <LayoutTemplate size={16} className="text-indigo-600" />
          Choose a template
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {TEMPLATES.map((tpl) => (
            <button
              key={tpl.id}
              type="button"
              onClick={() => setSelectedTemplate(tpl.id)}
              className={`rounded-xl border-2 p-4 text-left transition-all ${
                selectedTemplate === tpl.id
                  ? "border-indigo-500 ring-2 ring-indigo-100"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              {/* Mini preview */}
              <div className={`rounded-lg border-2 ${tpl.preview} h-16 mb-3 flex flex-col gap-1.5 p-2`}>
                <div className={`${tpl.accent} h-2 w-3/4 rounded`} />
                <div className="bg-slate-300 h-1.5 w-full rounded opacity-60" />
                <div className="bg-slate-300 h-1.5 w-2/3 rounded opacity-40" />
              </div>
              <div className="font-semibold text-slate-900 text-sm">{tpl.label}</div>
              <div className="text-xs text-slate-500 mt-0.5">{tpl.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Step 3 — Generate */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center gap-2 text-base font-semibold text-slate-900">
          <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center font-bold">3</span>
          Generate
        </div>

        <button
          type="button"
          onClick={handleGenerate}
          disabled={loading}
          className="btn-primary text-base px-6 py-3"
        >
          <Sparkles size={18} />
          {loading ? "Generating your CV..." : "Generate CV"}
        </button>
      </div>

      {/* Result */}
      {cvResult && (
        <div className="card p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <Sparkles size={18} className="text-indigo-500" />
              Latest Generated CV
            </h2>
            <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${ATS_COLOR(cvResult.ats_score)}`}>
              ATS Score: {cvResult.ats_score}%
            </span>
          </div>

          <div className="w-full bg-slate-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-700 ${
                cvResult.ats_score >= 75 ? "bg-emerald-500" :
                cvResult.ats_score >= 50 ? "bg-yellow-400" : "bg-red-400"
              }`}
              style={{ width: `${cvResult.ats_score}%` }}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <SectionLabel>Summary</SectionLabel>
              <p className="text-sm text-slate-700 leading-relaxed">{cvResult.cv_summary}</p>
            </div>
            <div>
              <SectionLabel>Skills</SectionLabel>
              <div className="flex flex-wrap gap-2 mt-1">
                {cvResult.cv_skills.split(",").map((s) => s.trim()).filter(Boolean).map((s) => (
                  <span key={s} className="bg-indigo-50 text-indigo-700 border border-indigo-100 text-xs px-2.5 py-0.5 rounded-full font-medium">
                    {s}
                  </span>
                ))}
              </div>
            </div>
            <div className="md:col-span-2">
              <SectionLabel>Experience</SectionLabel>
              <p className="text-sm text-slate-700 leading-relaxed">{cvResult.cv_experience}</p>
            </div>
            {cvResult.missing_keywords && (
              <div className="md:col-span-2">
                <SectionLabel>Missing Keywords</SectionLabel>
                <div className="flex flex-wrap gap-2 mt-1">
                  {cvResult.missing_keywords.split(",").map((k) => k.trim()).filter(Boolean).map((k) => (
                    <span key={k} className="bg-red-50 text-red-600 border border-red-100 text-xs px-2 py-0.5 rounded-full">
                      {k}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* History */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <Clock size={18} className="text-slate-400" />
            Previous CV Versions
          </h2>
          <span className="text-xs text-slate-400">{history.length} saved</span>
        </div>

        {loadingHistory ? (
          <div className="card p-8 text-center text-sm text-slate-500">Loading CV history...</div>
        ) : history.length === 0 ? (
          <div className="card p-8 text-center space-y-2">
            <FileText size={28} className="mx-auto text-slate-300" />
            <p className="text-sm text-slate-500">No CV versions saved yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((cv, i) => (
              <CVCard key={cv.id} cv={cv} defaultOpen={i === 0} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
