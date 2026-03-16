export default function Loading() {
  return (
    <div className="dashboard-shell p-5 sm:p-8">
      <div className="dashboard-grid space-y-6 animate-pulse">
        <div className="flex items-end justify-between gap-4">
          <div className="space-y-3">
            <div className="h-3 w-32 rounded-full bg-white/10" />
            <div className="h-10 w-80 rounded-full bg-white/10" />
            <div className="h-4 w-96 max-w-full rounded-full bg-white/8" />
          </div>
          <div className="h-12 w-40 rounded-full bg-white/10" />
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="dashboard-stat h-32 bg-white/5" />
          ))}
        </div>

        <div className="dashboard-card h-24 bg-white/5" />

        <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="dashboard-card h-72 bg-white/5" />
          ))}
        </div>
      </div>
    </div>
  );
}
