export default function LoadingSpinner({ label = 'Loading…', className = '' }) {
  return (
    <div className={`flex items-center justify-center gap-3 ${className}`}>
      <span
        className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-slate-600 border-t-blue-400"
        aria-hidden="true"
      />
      <span className="text-sm text-slate-400">{label}</span>
    </div>
  );
}
