'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="rounded border border-red-200 bg-red-50 p-4 text-red-600">
      <p className="mb-3">Something went wrong while loading campaigns.</p>
      <button
        onClick={reset}
        className="rounded bg-red-600 px-3 py-1.5 text-white hover:bg-red-700"
      >
        Try again
      </button>
    </div>
  );
}
