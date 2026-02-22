export function LoadingLine({ label = "Loading..." }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <div className="text-sm text-slate-600">{label}</div>
      <div className="mt-2 h-2 w-full overflow-hidden rounded bg-slate-100">
        <div className="h-full w-1/2 animate-pulse bg-slate-300" />
      </div>
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="h-4 w-40 animate-pulse rounded bg-slate-200" />
      <div className="mt-2 h-3 w-full animate-pulse rounded bg-slate-100" />
      <div className="mt-2 h-3 w-2/3 animate-pulse rounded bg-slate-100" />
    </div>
  );
}
