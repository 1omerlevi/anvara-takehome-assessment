'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { getMarketplaceAdSlots } from '@/lib/api';
import { trackMarketplaceEvent } from '@/lib/analytics';

interface MarketplaceAdSlot {
  id: string;
  name: string;
  description?: string | null;
  type: 'DISPLAY' | 'VIDEO' | 'NATIVE' | 'NEWSLETTER' | 'PODCAST';
  position?: string | null;
  width?: number | null;
  height?: number | null;
  basePrice: number;
  cpmFloor?: number | null;
  isAvailable: boolean;
  publisher?: {
    id: string;
    name: string;
    website?: string;
  } | null;
}

const typeColors: Record<MarketplaceAdSlot['type'], string> = {
  DISPLAY: 'border-blue-400/30 bg-blue-500/12 text-blue-100',
  VIDEO: 'border-rose-400/30 bg-rose-500/12 text-rose-100',
  NATIVE: 'border-emerald-400/30 bg-emerald-500/12 text-emerald-100',
  NEWSLETTER: 'border-violet-400/30 bg-violet-500/12 text-violet-100',
  PODCAST: 'border-amber-400/30 bg-amber-500/12 text-amber-100',
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatCompactCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}

export function AdSlotGrid() {
  const [adSlots, setAdSlots] = useState<MarketplaceAdSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | MarketplaceAdSlot['type']>('ALL');
  const [sortBy, setSortBy] = useState<'featured' | 'price-low' | 'price-high'>('featured');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const lastFilterSignature = useRef<string | null>(null);

  useEffect(() => {
    getMarketplaceAdSlots()
      .then((slots) => setAdSlots(slots as MarketplaceAdSlot[]))
      .catch(() => setError('Failed to load ad slots'))
      .finally(() => setLoading(false));
  }, []);

  const filteredSlots = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    const filtered = adSlots.filter((slot) => {
      const matchesSearch =
        !normalizedSearch ||
        slot.name.toLowerCase().includes(normalizedSearch) ||
        slot.description?.toLowerCase().includes(normalizedSearch) ||
        slot.publisher?.name.toLowerCase().includes(normalizedSearch) ||
        slot.position?.toLowerCase().includes(normalizedSearch);

      const matchesType = typeFilter === 'ALL' || slot.type === typeFilter;

      return matchesSearch && matchesType;
    });

    return filtered.sort((left, right) => {
      if (sortBy === 'price-low') return Number(left.basePrice) - Number(right.basePrice);
      if (sortBy === 'price-high') return Number(right.basePrice) - Number(left.basePrice);

      const leftScore = Number(Boolean(left.cpmFloor)) + Number(Boolean(left.width && left.height));
      const rightScore = Number(Boolean(right.cpmFloor)) + Number(Boolean(right.width && right.height));
      return rightScore - leftScore || Number(right.basePrice) - Number(left.basePrice);
    });
  }, [adSlots, search, sortBy, typeFilter]);

  const stats = useMemo(() => {
    const publishers = new Set(adSlots.map((slot) => slot.publisher?.id).filter(Boolean)).size;
    const avgPrice =
      adSlots.length > 0
        ? adSlots.reduce((sum, slot) => sum + Number(slot.basePrice), 0) / adSlots.length
        : 0;
    const premiumCount = adSlots.filter((slot) => Number(slot.basePrice) >= 1000).length;

    return { publishers, avgPrice, premiumCount };
  }, [adSlots]);

  useEffect(() => {
    if (loading || error) return;

    trackMarketplaceEvent('marketplace_viewed', {
      listing_count: adSlots.length,
      publisher_count: stats.publishers,
      premium_count: stats.premiumCount,
    });
  }, [adSlots.length, error, loading, stats.premiumCount, stats.publishers]);

  useEffect(() => {
    if (loading || error) return;

    const signature = JSON.stringify({
      search,
      typeFilter,
      sortBy,
      view,
      resultCount: filteredSlots.length,
    });

    if (lastFilterSignature.current === signature) return;
    lastFilterSignature.current = signature;

    trackMarketplaceEvent('marketplace_filters_changed', {
      search_length: search.trim().length,
      type_filter: typeFilter,
      sort_by: sortBy,
      view,
      result_count: filteredSlots.length,
    });
  }, [error, filteredSlots.length, loading, search, sortBy, typeFilter, view]);

  if (loading) {
    return (
      <div className="dashboard-shell p-5 sm:p-8">
        <div className="dashboard-grid space-y-6 animate-pulse">
          <div className="grid gap-4 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="dashboard-stat h-32 bg-white/5" />
            ))}
          </div>
          <div className="dashboard-card h-24 bg-white/5" />
          <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="dashboard-card h-72 bg-white/5" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-shell p-5 sm:p-8">
        <div className="dashboard-grid">
          <div className="dashboard-card p-6 text-center text-rose-100">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-rose-300">Load error</p>
            <p className="mt-4 text-lg font-semibold text-white">{error}</p>
            <p className="mt-2 text-sm text-slate-300">
              The marketplace inventory is temporarily unavailable. Refresh to try again.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-shell p-5 sm:p-8">
      <div className="dashboard-grid space-y-6">
        <section className="grid gap-4 md:grid-cols-3">
          <div className="dashboard-stat p-5 sm:p-6">
            <p className="text-sm text-slate-400">Live placements</p>
            <p className="mt-2 text-3xl font-semibold text-white">{adSlots.length}</p>
            <div className="dashboard-mini-card mt-4 p-3">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Coverage</p>
              <p className="mt-1 text-sm text-slate-200">{stats.publishers} publishers represented</p>
            </div>
          </div>
          <div className="dashboard-stat p-5 sm:p-6">
            <p className="text-sm text-slate-400">Average monthly rate</p>
            <p className="mt-2 text-3xl font-semibold text-white">{formatCompactCurrency(stats.avgPrice)}</p>
            <div className="dashboard-mini-card mt-4 p-3">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Benchmark</p>
              <p className="mt-1 text-sm text-slate-200">Useful for budget planning</p>
            </div>
          </div>
          <div className="dashboard-stat p-5 sm:p-6">
            <p className="text-sm text-slate-400">Premium inventory</p>
            <p className="mt-2 text-3xl font-semibold text-white">{stats.premiumCount}</p>
            <div className="dashboard-mini-card mt-4 p-3">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">High value</p>
              <p className="mt-1 text-sm text-slate-200">Placements priced at $1,000+</p>
            </div>
          </div>
        </section>

        <section className="dashboard-card p-4 sm:p-5">
          <div className="grid gap-3 xl:grid-cols-[minmax(0,1.5fr)_220px_220px_auto]">
            <label className="block">
              <span className="sr-only">Search placements</span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by slot, publisher, description, or position"
                className="dashboard-input"
              />
            </label>
            <label className="block">
              <span className="sr-only">Filter by type</span>
              <select
                value={typeFilter}
                onChange={(event) => setTypeFilter(event.target.value as 'ALL' | MarketplaceAdSlot['type'])}
                className="dashboard-input"
              >
                <option value="ALL">All types</option>
                <option value="DISPLAY">Display</option>
                <option value="VIDEO">Video</option>
                <option value="NATIVE">Native</option>
                <option value="NEWSLETTER">Newsletter</option>
                <option value="PODCAST">Podcast</option>
              </select>
            </label>
            <label className="block">
              <span className="sr-only">Sort placements</span>
              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value as 'featured' | 'price-low' | 'price-high')}
                className="dashboard-input"
              >
                <option value="featured">Sort by featured</option>
                <option value="price-low">Price: low to high</option>
                <option value="price-high">Price: high to low</option>
              </select>
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setView('grid')}
                className={`dashboard-button flex-1 text-sm ${view === 'grid' ? 'dashboard-button-primary' : 'dashboard-button-secondary'}`}
              >
                Grid
              </button>
              <button
                type="button"
                onClick={() => setView('list')}
                className={`dashboard-button flex-1 text-sm ${view === 'list' ? 'dashboard-button-primary' : 'dashboard-button-secondary'}`}
              >
                List
              </button>
            </div>
          </div>
        </section>

        {filteredSlots.length === 0 ? (
          <section className="dashboard-card p-8 text-center sm:p-12">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">No matches</p>
            <h2 className="mt-4 text-2xl font-semibold text-white">No placements match your filters.</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-300">
              Try widening the search or switching the inventory type filter to browse more options.
            </p>
          </section>
        ) : (
          <section className={view === 'grid' ? 'grid gap-4 lg:grid-cols-2 2xl:grid-cols-3' : 'grid gap-4'}>
            {filteredSlots.map((slot, index) => (
              <Link
                key={slot.id}
                href={`/marketplace/${slot.id}`}
                onClick={() =>
                  trackMarketplaceEvent('marketplace_listing_clicked', {
                    listing_id: slot.id,
                    listing_type: slot.type,
                    publisher_name: slot.publisher?.name || 'Independent publisher',
                    price: Number(slot.basePrice),
                    rank: index + 1,
                  })
                }
                className="dashboard-card dashboard-card-hover dashboard-fade-up block p-5 sm:p-6"
                style={{ animationDelay: `${index * 35}ms` }}
              >
                <div className="relative z-10">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-xl font-semibold text-white">{slot.name}</h3>
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold tracking-[0.2em] ${typeColors[slot.type]}`}
                        >
                          {slot.type}
                        </span>
                      </div>
                      <p className="mt-3 text-sm text-slate-400">
                        by {slot.publisher?.name || 'Independent publisher'}
                      </p>
                      <p className="mt-3 text-sm leading-7 text-slate-300">
                        {slot.description || 'No description added yet.'}
                      </p>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Monthly rate</p>
                      <p className="mt-1 text-2xl font-semibold text-white">{formatCurrency(Number(slot.basePrice))}</p>
                    </div>
                  </div>

                  <div className={`mt-6 grid gap-4 ${view === 'grid' ? 'sm:grid-cols-2 xl:grid-cols-3' : 'lg:grid-cols-4'}`}>
                    <div className="dashboard-mini-card p-4">
                      <p className="text-sm text-slate-400">Position</p>
                      <p className="mt-2 text-sm font-medium text-white">{slot.position || 'Not specified'}</p>
                    </div>
                    <div className="dashboard-mini-card p-4">
                      <p className="text-sm text-slate-400">Dimensions</p>
                      <p className="mt-2 text-sm font-medium text-white">
                        {slot.width && slot.height ? `${slot.width} × ${slot.height}` : 'Flexible'}
                      </p>
                    </div>
                    <div className="dashboard-mini-card p-4">
                      <p className="text-sm text-slate-400">CPM floor</p>
                      <p className="mt-2 text-sm font-medium text-white">
                        {slot.cpmFloor ? formatCurrency(Number(slot.cpmFloor)) : 'Not set'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 flex items-center justify-between">
                    <span className="inline-flex rounded-full border border-emerald-400/30 bg-emerald-500/12 px-3 py-1 text-xs font-semibold tracking-[0.2em] text-emerald-100">
                      AVAILABLE
                    </span>
                    <span className="text-sm font-medium text-sky-100">View placement details</span>
                  </div>
                </div>
              </Link>
            ))}
          </section>
        )}
      </div>
    </div>
  );
}
