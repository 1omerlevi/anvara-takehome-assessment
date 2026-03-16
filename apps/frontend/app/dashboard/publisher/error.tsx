'use client';

export default function Error({
  error: _error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="dashboard-shell p-5 sm:p-8">
      <div className="dashboard-grid">
        <div className="dashboard-card mx-auto max-w-2xl p-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-rose-300">Load error</p>
          <h1 className="mt-4 text-3xl font-semibold text-white">Inventory data didn’t load.</h1>
          <p className="mx-auto mt-4 max-w-lg text-sm leading-7 text-slate-300">
            The dashboard couldn’t fetch your latest ad slot data. Retry to restore the current inventory view.
          </p>
          <button
            onClick={reset}
            className="dashboard-button mt-6 rounded-full bg-rose-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_45px_rgba(225,29,72,0.28)]"
          >
            Try Again
          </button>
        </div>
      </div>
    </div>
  );
}
