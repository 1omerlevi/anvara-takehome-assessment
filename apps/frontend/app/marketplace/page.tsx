import { AdSlotGrid } from './components/ad-slot-grid';

export default function MarketplacePage() {
  return (
    <div className="space-y-6">
      <section className="dashboard-shell p-5 sm:p-8">
        <div className="dashboard-grid flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-sky-200/80">Marketplace</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Browse publisher inventory with clearer pricing and context.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
              Compare open placements, scan publisher details, and identify inventory that fits your campaign quickly.
            </p>
          </div>
          <div className="dashboard-mini-card max-w-sm p-4">
            <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Marketplace view</p>
            <p className="mt-2 text-sm leading-6 text-slate-200">
              Filter by format, sort by price, and open a listing to request a placement.
            </p>
          </div>
        </div>
      </section>

      <AdSlotGrid />
    </div>
  );
}
