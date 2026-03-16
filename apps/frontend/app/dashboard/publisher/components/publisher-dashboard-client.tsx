'use client';

import { useEffect, useMemo, useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import {
  createAdSlot,
  deleteAdSlot,
  updateAdSlot,
  type DashboardActionState,
  type PublisherAdSlot,
} from '../actions';

const initialState: DashboardActionState = {
  success: false,
  message: null,
  error: null,
  fieldErrors: {},
};

interface PublisherDashboardClientProps {
  initialAdSlots: PublisherAdSlot[];
  loadError: string | null;
}

type Toast = {
  tone: 'success' | 'error';
  message: string;
};

const labelClassName = 'text-sm font-medium text-slate-200';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatCompactCurrency(value: number) {
  // Fixes: small values use the regular formatter so SSR and client hydration render the same text.
  if (Math.abs(value) < 1000) {
    return formatCurrency(value);
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}

function getTypeBadgeClass(type: string) {
  switch (type) {
    case 'DISPLAY':
      return 'border-blue-400/30 bg-blue-500/12 text-blue-100';
    case 'VIDEO':
      return 'border-rose-400/30 bg-rose-500/12 text-rose-100';
    case 'NATIVE':
      return 'border-emerald-400/30 bg-emerald-500/12 text-emerald-100';
    case 'NEWSLETTER':
      return 'border-violet-400/30 bg-violet-500/12 text-violet-100';
    case 'PODCAST':
      return 'border-amber-400/30 bg-amber-500/12 text-amber-100';
    default:
      return 'border-white/15 bg-white/8 text-slate-200';
  }
}

function getAvailabilityBadgeClass(isAvailable: boolean) {
  return isAvailable
    ? 'border-emerald-400/30 bg-emerald-500/12 text-emerald-100'
    : 'border-amber-400/30 bg-amber-500/12 text-amber-100';
}

function SubmitButton({
  idleLabel,
  pendingLabel,
  className,
}: {
  idleLabel: string;
  pendingLabel: string;
  className: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending} className={className}>
      {pending ? pendingLabel : idleLabel}
    </button>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-2 text-sm text-rose-300">{message}</p>;
}

function ToastBanner({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  return (
    <div
      className={`dashboard-toast flex items-start justify-between gap-3 rounded-2xl border px-4 py-3 text-sm ${
        toast.tone === 'success'
          ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-100'
          : 'border-rose-400/30 bg-rose-500/10 text-rose-100'
      }`}
    >
      <p>{toast.message}</p>
      <button type="button" onClick={onDismiss} className="text-xs font-semibold uppercase tracking-[0.2em]">
        Dismiss
      </button>
    </div>
  );
}

function AdSlotForm({
  mode,
  adSlot,
  onCancel,
  onSuccess,
  onError,
}: {
  mode: 'create' | 'edit';
  adSlot?: PublisherAdSlot;
  onCancel: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}) {
  const action = mode === 'create' ? createAdSlot : updateAdSlot;
  const [state, formAction] = useFormState(action, initialState);

  useEffect(() => {
    if (state.success && state.message) {
      onSuccess(state.message);
    } else if (state.error) {
      onError(state.error);
    }
  }, [state, onError, onSuccess]);

  return (
    <form action={formAction} className="dashboard-card dashboard-fade-up p-6 sm:p-8">
      {mode === 'edit' ? <input type="hidden" name="id" value={adSlot?.id} /> : null}

      <div className="mb-8 flex flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
            {mode === 'create' ? 'New inventory listing' : 'Inventory editor'}
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white">
            {mode === 'create' ? 'Create Ad Slot' : 'Edit Ad Slot'}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
            Add the placement details buyers need to evaluate this inventory quickly and confidently.
          </p>
        </div>
        <button type="button" onClick={onCancel} className="dashboard-button dashboard-button-secondary text-sm">
          Cancel
        </button>
      </div>

      {state.error ? (
        <div className="mb-6 rounded-2xl border border-rose-400/30 bg-rose-500/10 p-4 text-sm text-rose-200">
          {state.error}
        </div>
      ) : null}

      <div className="grid gap-6">
        <section className="rounded-[1.4rem] border border-white/10 bg-white/4 p-5 sm:p-6">
          <div className="mb-5">
            <h3 className="text-lg font-semibold text-white">Listing basics</h3>
            <p className="mt-1 text-sm text-slate-400">
              Define the placement, format, and buyer-facing description.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <label className="block">
              <span className={labelClassName}>Name</span>
              <input
                name="name"
                defaultValue={adSlot?.name ?? ''}
                placeholder="Homepage Hero Banner"
                className="dashboard-input mt-2"
              />
              <FieldError message={state.fieldErrors.name} />
            </label>

            <label className="block">
              <span className={labelClassName}>Type</span>
              <select name="type" defaultValue={adSlot?.type ?? 'DISPLAY'} className="dashboard-input mt-2">
                <option value="DISPLAY">DISPLAY</option>
                <option value="VIDEO">VIDEO</option>
                <option value="NATIVE">NATIVE</option>
                <option value="NEWSLETTER">NEWSLETTER</option>
                <option value="PODCAST">PODCAST</option>
              </select>
              <FieldError message={state.fieldErrors.type} />
            </label>

            <label className="block md:col-span-2">
              <span className={labelClassName}>Description</span>
              <textarea
                name="description"
                defaultValue={adSlot?.description ?? ''}
                rows={4}
                placeholder="Premium placement with high visibility and strong buyer intent."
                className="dashboard-input mt-2 min-h-32 resize-y"
              />
            </label>
          </div>
        </section>

        <section className="rounded-[1.4rem] border border-white/10 bg-white/4 p-5 sm:p-6">
          <div className="mb-5">
            <h3 className="text-lg font-semibold text-white">Placement and pricing</h3>
            <p className="mt-1 text-sm text-slate-400">
              Add commercial details so buyers can compare this slot against other options.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <label className="block">
              <span className={labelClassName}>Position</span>
              <input
                name="position"
                defaultValue={adSlot?.position ?? ''}
                placeholder="Above the fold"
                className="dashboard-input mt-2"
              />
            </label>

            <label className="block">
              <span className={labelClassName}>Base price</span>
              <input
                name="basePrice"
                type="number"
                step="0.01"
                defaultValue={adSlot?.basePrice ?? ''}
                placeholder="500"
                className="dashboard-input mt-2"
              />
              <FieldError message={state.fieldErrors.basePrice} />
            </label>

            <label className="block">
              <span className={labelClassName}>Width</span>
              <input
                name="width"
                type="number"
                defaultValue={adSlot?.width ?? ''}
                placeholder="728"
                className="dashboard-input mt-2"
              />
              <FieldError message={state.fieldErrors.width} />
            </label>

            <label className="block">
              <span className={labelClassName}>Height</span>
              <input
                name="height"
                type="number"
                defaultValue={adSlot?.height ?? ''}
                placeholder="90"
                className="dashboard-input mt-2"
              />
              <FieldError message={state.fieldErrors.height} />
            </label>

            <label className="block">
              <span className={labelClassName}>CPM floor</span>
              <input
                name="cpmFloor"
                type="number"
                step="0.01"
                defaultValue={adSlot?.cpmFloor ?? ''}
                placeholder="15"
                className="dashboard-input mt-2"
              />
              <FieldError message={state.fieldErrors.cpmFloor} />
            </label>

            <label className="flex min-h-full items-center rounded-[1.2rem] border border-white/10 bg-[rgba(15,23,42,0.55)] px-4 py-3">
              <input
                name="isAvailable"
                type="checkbox"
                defaultChecked={adSlot?.isAvailable ?? true}
                className="h-4 w-4 rounded border-white/20 bg-transparent accent-[--color-primary]"
              />
              <span className="ml-3">
                <span className="block text-sm font-medium text-white">Available for booking</span>
                <span className="block text-xs text-slate-400">
                  Disable this when the placement is sold or temporarily unavailable.
                </span>
              </span>
            </label>
          </div>
        </section>
      </div>

      <div className="mt-8 flex flex-col gap-3 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-400">
          {mode === 'create'
            ? 'Publish a new ad slot to make it available in your inventory.'
            : 'Save your changes to update how this slot appears to buyers.'}
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button type="button" onClick={onCancel} className="dashboard-button dashboard-button-secondary text-sm">
            Cancel
          </button>
          <SubmitButton
            idleLabel={mode === 'create' ? 'Create Ad Slot' : 'Save Changes'}
            pendingLabel={mode === 'create' ? 'Saving...' : 'Updating...'}
            className="dashboard-button dashboard-button-primary text-sm disabled:opacity-60"
          />
        </div>
      </div>
    </form>
  );
}

function DeleteAdSlotModal({
  adSlot,
  onClose,
  onSuccess,
  onError,
}: {
  adSlot: PublisherAdSlot;
  onClose: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}) {
  const [state, formAction] = useFormState(deleteAdSlot, initialState);

  useEffect(() => {
    if (state.success && state.message) {
      onSuccess(state.message);
      onClose();
    } else if (state.error) {
      onError(state.error);
    }
  }, [state, onClose, onError, onSuccess]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(2,6,23,0.78)] p-4 backdrop-blur-sm">
      <div className="dashboard-card w-full max-w-md p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-rose-300">Confirm delete</p>
        <h3 className="mt-3 text-xl font-semibold text-white">Delete “{adSlot.name}”?</h3>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          This removes the inventory listing from your dashboard. Only continue if you no longer want buyers to manage it here.
        </p>

        {state.error ? (
          <div className="mt-4 rounded-2xl border border-rose-400/30 bg-rose-500/10 p-3 text-sm text-rose-200">
            {state.error}
          </div>
        ) : null}

        <form action={formAction} className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <input type="hidden" name="id" value={adSlot.id} />
          <button type="button" onClick={onClose} className="dashboard-button dashboard-button-secondary text-sm">
            Cancel
          </button>
          <SubmitButton
            idleLabel="Delete Ad Slot"
            pendingLabel="Deleting..."
            className="dashboard-button rounded-full bg-rose-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_45px_rgba(225,29,72,0.28)] disabled:opacity-60"
          />
        </form>
      </div>
    </div>
  );
}

export function PublisherDashboardClient({
  initialAdSlots,
  loadError,
}: PublisherDashboardClientProps) {
  const [mode, setMode] = useState<'create' | 'edit' | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState<'ALL' | 'AVAILABLE' | 'BOOKED'>('ALL');
  const [typeFilter, setTypeFilter] = useState<'ALL' | PublisherAdSlot['type']>('ALL');
  const [sortBy, setSortBy] = useState<'price' | 'name'>('price');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast | null>(loadError ? { tone: 'error', message: loadError } : null);

  useEffect(() => {
    if (!toast) return;

    const timeout = window.setTimeout(() => setToast(null), 3600);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const selectedAdSlot = useMemo(
    () => initialAdSlots.find((slot) => slot.id === selectedId),
    [initialAdSlots, selectedId]
  );

  const filteredAdSlots = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    const filtered = initialAdSlots.filter((slot) => {
      const matchesSearch =
        !normalizedSearch ||
        slot.name.toLowerCase().includes(normalizedSearch) ||
        slot.description?.toLowerCase().includes(normalizedSearch) ||
        slot.position?.toLowerCase().includes(normalizedSearch);

      const matchesAvailability =
        availabilityFilter === 'ALL' ||
        (availabilityFilter === 'AVAILABLE' ? slot.isAvailable : !slot.isAvailable);
      const matchesType = typeFilter === 'ALL' || slot.type === typeFilter;

      return matchesSearch && matchesAvailability && matchesType;
    });

    return filtered.sort((left, right) => {
      if (sortBy === 'name') {
        return left.name.localeCompare(right.name);
      }
      return Number(right.basePrice) - Number(left.basePrice);
    });
  }, [availabilityFilter, initialAdSlots, search, sortBy, typeFilter]);

  const stats = useMemo(() => {
    const live = initialAdSlots.filter((slot) => slot.isAvailable).length;
    const booked = initialAdSlots.length - live;
    const estimatedRevenue = initialAdSlots.reduce((sum, slot) => sum + Number(slot.basePrice), 0);
    const avgFloor =
      initialAdSlots.length > 0
        ? initialAdSlots.reduce((sum, slot) => sum + Number(slot.cpmFloor ?? 0), 0) / initialAdSlots.length
        : 0;

    return { live, booked, estimatedRevenue, avgFloor };
  }, [initialAdSlots]);

  const pendingDeleteAdSlot = initialAdSlots.find((slot) => slot.id === pendingDeleteId) ?? null;

  return (
    <div className="dashboard-shell p-5 sm:p-8">
      <div className="dashboard-grid space-y-6">
        <section className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-teal-200/80">Publisher dashboard</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Keep inventory polished, priced, and easy to book.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
              Surface your highest-value inventory with clearer pricing, stronger organization, and faster management actions.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setSelectedId(null);
              setMode('create');
              setToast(null);
            }}
            className="dashboard-button dashboard-button-primary text-sm"
          >
            Create Ad Slot
          </button>
        </section>

        {toast ? <ToastBanner toast={toast} onDismiss={() => setToast(null)} /> : null}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="dashboard-stat p-5 sm:p-6">
            <p className="text-sm text-slate-400">Potential monthly revenue</p>
            <p className="mt-2 text-3xl font-semibold text-white">{formatCompactCurrency(stats.estimatedRevenue)}</p>
            <div className="dashboard-mini-card mt-4 p-3">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Scope</p>
              <p className="mt-1 text-sm text-slate-200">Across all listed inventory</p>
            </div>
          </div>
          <div className="dashboard-stat p-5 sm:p-6">
            <p className="text-sm text-slate-400">Live inventory</p>
            <p className="mt-2 text-3xl font-semibold text-white">{stats.live}</p>
            <div className="dashboard-mini-card mt-4 p-3">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Availability</p>
              <p className="mt-1 text-sm text-slate-200">Slots available for booking</p>
            </div>
          </div>
          <div className="dashboard-stat p-5 sm:p-6">
            <p className="text-sm text-slate-400">Booked or hidden</p>
            <p className="mt-2 text-3xl font-semibold text-white">{stats.booked}</p>
            <div className="dashboard-mini-card mt-4 p-3">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Closed</p>
              <p className="mt-1 text-sm text-slate-200">Not currently open to buyers</p>
            </div>
          </div>
          <div className="dashboard-stat p-5 sm:p-6">
            <p className="text-sm text-slate-400">Average CPM floor</p>
            <p className="mt-2 text-3xl font-semibold text-white">
              {stats.avgFloor > 0 ? formatCurrency(stats.avgFloor) : '$0'}
            </p>
            <div className="dashboard-mini-card mt-4 p-3">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Pricing</p>
              <p className="mt-1 text-sm text-slate-200">Useful for pricing consistency</p>
            </div>
          </div>
        </section>

        <section className="dashboard-card p-4 sm:p-5">
          <div className="grid gap-3 xl:grid-cols-[minmax(0,1.4fr)_200px_200px_180px_auto]">
            <label className="block">
              <span className="sr-only">Search ad slots</span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by slot name, description, or position"
                className="dashboard-input"
              />
            </label>
            <label className="block">
              <span className="sr-only">Filter by availability</span>
              <select
                value={availabilityFilter}
                onChange={(event) =>
                  setAvailabilityFilter(event.target.value as 'ALL' | 'AVAILABLE' | 'BOOKED')
                }
                className="dashboard-input"
              >
                <option value="ALL">All availability</option>
                <option value="AVAILABLE">Available</option>
                <option value="BOOKED">Booked</option>
              </select>
            </label>
            <label className="block">
              <span className="sr-only">Filter by type</span>
              <select
                value={typeFilter}
                onChange={(event) => setTypeFilter(event.target.value as 'ALL' | PublisherAdSlot['type'])}
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
              <span className="sr-only">Sort ad slots</span>
              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value as 'price' | 'name')}
                className="dashboard-input"
              >
                <option value="price">Sort by price</option>
                <option value="name">Sort by name</option>
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

        {mode ? (
          <AdSlotForm
            mode={mode}
            adSlot={selectedAdSlot}
            onCancel={() => {
              setMode(null);
              setSelectedId(null);
            }}
            onSuccess={(message) => {
              setToast({ tone: 'success', message });
              setMode(null);
              setSelectedId(null);
            }}
            onError={(message) => setToast({ tone: 'error', message })}
          />
        ) : null}

        {filteredAdSlots.length === 0 ? (
          <section className="dashboard-card p-8 text-center sm:p-12">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">No matches</p>
            <h2 className="mt-4 text-2xl font-semibold text-white">
              {initialAdSlots.length === 0 ? 'List your first ad slot' : 'No ad slots match those filters'}
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-300">
              {initialAdSlots.length === 0
                ? 'Add a placement with pricing and dimensions so sponsors can evaluate and book inventory faster.'
                : 'Try widening the search, clearing a filter, or switching the availability view to find more inventory.'}
            </p>
          </section>
        ) : (
          <section className={view === 'grid' ? 'grid gap-4 lg:grid-cols-2 2xl:grid-cols-3' : 'grid gap-4'}>
            {filteredAdSlots.map((slot, index) => (
              <article
                key={slot.id}
                className="dashboard-card dashboard-card-hover dashboard-fade-up p-5 sm:p-6"
                style={{ animationDelay: `${index * 40}ms` }}
              >
                <div className="relative z-10">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-xl font-semibold text-white">{slot.name}</h3>
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold tracking-[0.2em] ${getTypeBadgeClass(slot.type)}`}
                        >
                          {slot.type}
                        </span>
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold tracking-[0.2em] ${getAvailabilityBadgeClass(slot.isAvailable)}`}
                        >
                          {slot.isAvailable ? 'AVAILABLE' : 'BOOKED'}
                        </span>
                      </div>
                      {slot.description ? (
                        <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">{slot.description}</p>
                      ) : (
                        <p className="mt-3 text-sm text-slate-400">Add a short description to improve buyer confidence.</p>
                      )}
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Base price</p>
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

                  <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedId(slot.id);
                        setMode('edit');
                        setToast(null);
                      }}
                      className="dashboard-button dashboard-button-secondary text-sm"
                    >
                      Edit Ad Slot
                    </button>
                    <button
                      type="button"
                      onClick={() => setPendingDeleteId(slot.id)}
                      className="dashboard-button rounded-full border border-rose-400/24 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-100"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>

      {pendingDeleteAdSlot ? (
        <DeleteAdSlotModal
          adSlot={pendingDeleteAdSlot}
          onClose={() => setPendingDeleteId(null)}
          onSuccess={(message) => {
            setToast({ tone: 'success', message });
            if (selectedId === pendingDeleteAdSlot.id) {
              setSelectedId(null);
              setMode(null);
            }
          }}
          onError={(message) => setToast({ tone: 'error', message })}
        />
      ) : null}
    </div>
  );
}
