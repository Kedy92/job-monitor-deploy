export default function ErrorBanner({
  title = "Something went wrong",
  message,
  onClose,
}) {
  if (!message) return null;

  return (
    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-900 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="font-semibold">{title}</div>
          <div className="mt-1 text-sm text-red-800">{message}</div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="rounded-md px-2 py-1 text-sm text-red-900 hover:bg-red-100"
          >
            Close
          </button>
        )}
      </div>
    </div>
  );
}
