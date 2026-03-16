'use client';

import { useEffect, useMemo, useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import {
  createCampaign,
  deleteCampaign,
  updateCampaign,
  type DashboardActionState,
  type SponsorCampaign,
} from '../actions';

const initialState: DashboardActionState = {
  success: false,
  message: null,
  error: null,
  fieldErrors: {},
};

interface SponsorDashboardClientProps {
  initialCampaigns: SponsorCampaign[];
  loadError: string | null;
}

type Toast = {
  tone: 'success' | 'error';
  message: string;
};

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

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function toDateInputValue(value: string) {
  return new Date(value).toISOString().slice(0, 10);
}

function getStatusTone(status: SponsorCampaign['status']) {
  switch (status) {
    case 'ACTIVE':
      return 'border-emerald-400/30 bg-emerald-500/12 text-emerald-100';
    case 'APPROVED':
      return 'border-sky-400/30 bg-sky-500/12 text-sky-100';
    case 'PENDING_REVIEW':
      return 'border-amber-400/30 bg-amber-500/12 text-amber-100';
    case 'PAUSED':
      return 'border-orange-400/30 bg-orange-500/12 text-orange-100';
    case 'COMPLETED':
      return 'border-violet-400/30 bg-violet-500/12 text-violet-100';
    case 'CANCELLED':
      return 'border-rose-400/30 bg-rose-500/12 text-rose-100';
    default:
      return 'border-white/15 bg-white/8 text-slate-200';
  }
}

function getProgress(spent: number, budget: number) {
  if (budget <= 0) return 0;
  return Math.max(0, Math.min(100, (spent / budget) * 100));
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

function CampaignForm({
  mode,
  campaign,
  onCancel,
  onSuccess,
  onError,
}: {
  mode: 'create' | 'edit';
  campaign?: SponsorCampaign;
  onCancel: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}) {
  const action = mode === 'create' ? createCampaign : updateCampaign;
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
      {mode === 'edit' ? <input type="hidden" name="id" value={campaign?.id} /> : null}

      <div className="mb-8 flex flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
            {mode === 'create' ? 'New campaign' : 'Campaign editor'}
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white">
            {mode === 'create' ? 'Launch a Campaign' : 'Refine Campaign Settings'}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
            Define budget, timing, and targeting so the marketplace can match your campaign more effectively.
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
            <h3 className="text-lg font-semibold text-white">Campaign basics</h3>
            <p className="mt-1 text-sm text-slate-400">
              Start with the essentials buyers and reviewers will use to understand this campaign.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-slate-200">Name</span>
              <input
                name="name"
                defaultValue={campaign?.name ?? ''}
                placeholder="Spring product launch"
                className="dashboard-input mt-2"
              />
              <FieldError message={state.fieldErrors.name} />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-200">Budget</span>
              <input
                name="budget"
                type="number"
                step="0.01"
                defaultValue={campaign?.budget ?? ''}
                placeholder="25000"
                className="dashboard-input mt-2"
              />
              <FieldError message={state.fieldErrors.budget} />
            </label>

            <label className="block md:col-span-2">
              <span className="text-sm font-medium text-slate-200">Description</span>
              <textarea
                name="description"
                defaultValue={campaign?.description ?? ''}
                rows={4}
                placeholder="Describe the audience, creative angle, and campaign goal."
                className="dashboard-input mt-2 min-h-32 resize-y"
              />
            </label>
          </div>
        </section>

        <section className="rounded-[1.4rem] border border-white/10 bg-white/4 p-5 sm:p-6">
          <div className="mb-5">
            <h3 className="text-lg font-semibold text-white">Flight and pricing</h3>
            <p className="mt-1 text-sm text-slate-400">
              Set the run dates and commercial terms for this campaign.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-slate-200">Start date</span>
              <input
                name="startDate"
                type="date"
                defaultValue={campaign ? toDateInputValue(campaign.startDate) : ''}
                className="dashboard-input mt-2"
              />
              <FieldError message={state.fieldErrors.startDate} />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-200">End date</span>
              <input
                name="endDate"
                type="date"
                defaultValue={campaign ? toDateInputValue(campaign.endDate) : ''}
                className="dashboard-input mt-2"
              />
              <FieldError message={state.fieldErrors.endDate} />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-200">CPM rate</span>
              <input
                name="cpmRate"
                type="number"
                step="0.01"
                defaultValue={campaign?.cpmRate ?? ''}
                placeholder="18"
                className="dashboard-input mt-2"
              />
              <FieldError message={state.fieldErrors.cpmRate} />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-200">CPC rate</span>
              <input
                name="cpcRate"
                type="number"
                step="0.01"
                defaultValue={campaign?.cpcRate ?? ''}
                placeholder="4.5"
                className="dashboard-input mt-2"
              />
              <FieldError message={state.fieldErrors.cpcRate} />
            </label>
          </div>
        </section>

        <section className="rounded-[1.4rem] border border-white/10 bg-white/4 p-5 sm:p-6">
          <div className="mb-5">
            <h3 className="text-lg font-semibold text-white">Audience targeting</h3>
            <p className="mt-1 text-sm text-slate-400">
              Use comma-separated values to guide where the campaign should surface.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-slate-200">Target categories</span>
              <input
                name="targetCategories"
                defaultValue={campaign?.targetCategories?.join(', ') ?? ''}
                placeholder="Tech, Finance, SaaS"
                className="dashboard-input mt-2"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-200">Target regions</span>
              <input
                name="targetRegions"
                defaultValue={campaign?.targetRegions?.join(', ') ?? ''}
                placeholder="US, Canada, EMEA"
                className="dashboard-input mt-2"
              />
            </label>

            {mode === 'edit' ? (
              <label className="block md:col-span-2">
                <span className="text-sm font-medium text-slate-200">Status</span>
                <select
                  name="status"
                  defaultValue={campaign?.status ?? 'DRAFT'}
                  className="dashboard-input mt-2"
                >
                  <option value="DRAFT">DRAFT</option>
                  <option value="PENDING_REVIEW">PENDING_REVIEW</option>
                  <option value="APPROVED">APPROVED</option>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="PAUSED">PAUSED</option>
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </label>
            ) : null}
          </div>
        </section>
      </div>

      <div className="mt-8 flex flex-col gap-3 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-400">
          {mode === 'create'
            ? 'Save this draft to add a new campaign to your portfolio.'
            : 'Save your edits to update how this campaign is managed and reviewed.'}
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button type="button" onClick={onCancel} className="dashboard-button dashboard-button-secondary text-sm">
            Cancel
          </button>
          <SubmitButton
            idleLabel={mode === 'create' ? 'Create Campaign' : 'Save Changes'}
            pendingLabel={mode === 'create' ? 'Creating...' : 'Saving...'}
            className="dashboard-button dashboard-button-primary text-sm disabled:opacity-60"
          />
        </div>
      </div>
    </form>
  );
}

function DeleteCampaignModal({
  campaign,
  onClose,
  onSuccess,
  onError,
}: {
  campaign: SponsorCampaign;
  onClose: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}) {
  const [state, formAction] = useFormState(deleteCampaign, initialState);

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
        <h3 className="mt-3 text-xl font-semibold text-white">Delete “{campaign.name}”?</h3>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          This removes the campaign from your dashboard. Use this only if the campaign should no longer be managed here.
        </p>

        {state.error ? (
          <div className="mt-4 rounded-2xl border border-rose-400/30 bg-rose-500/10 p-3 text-sm text-rose-200">
            {state.error}
          </div>
        ) : null}

        <form action={formAction} className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <input type="hidden" name="id" value={campaign.id} />
          <button type="button" onClick={onClose} className="dashboard-button dashboard-button-secondary text-sm">
            Cancel
          </button>
          <SubmitButton
            idleLabel="Delete Campaign"
            pendingLabel="Deleting..."
            className="dashboard-button rounded-full bg-rose-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_45px_rgba(225,29,72,0.28)] disabled:opacity-60"
          />
        </form>
      </div>
    </div>
  );
}

export function SponsorDashboardClient({
  initialCampaigns,
  loadError,
}: SponsorDashboardClientProps) {
  const [mode, setMode] = useState<'create' | 'edit' | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | SponsorCampaign['status']>('ALL');
  const [sortBy, setSortBy] = useState<'recent' | 'budget' | 'spent'>('recent');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast | null>(loadError ? { tone: 'error', message: loadError } : null);

  useEffect(() => {
    if (!toast) return;

    const timeout = window.setTimeout(() => setToast(null), 3600);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const selectedCampaign = useMemo(
    () => initialCampaigns.find((campaign) => campaign.id === selectedId),
    [initialCampaigns, selectedId]
  );

  const filteredCampaigns = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    const filtered = initialCampaigns.filter((campaign) => {
      const matchesSearch =
        !normalizedSearch ||
        campaign.name.toLowerCase().includes(normalizedSearch) ||
        campaign.description?.toLowerCase().includes(normalizedSearch) ||
        campaign.targetCategories.some((category) => category.toLowerCase().includes(normalizedSearch)) ||
        campaign.targetRegions.some((region) => region.toLowerCase().includes(normalizedSearch));

      const matchesStatus = statusFilter === 'ALL' || campaign.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    return filtered.sort((left, right) => {
      if (sortBy === 'budget') return Number(right.budget) - Number(left.budget);
      if (sortBy === 'spent') return Number(right.spent) - Number(left.spent);
      return new Date(right.startDate).getTime() - new Date(left.startDate).getTime();
    });
  }, [initialCampaigns, search, sortBy, statusFilter]);

  const stats = useMemo(() => {
    const budget = initialCampaigns.reduce((sum, campaign) => sum + Number(campaign.budget), 0);
    const spent = initialCampaigns.reduce((sum, campaign) => sum + Number(campaign.spent), 0);
    const active = initialCampaigns.filter((campaign) => campaign.status === 'ACTIVE').length;
    const pending = initialCampaigns.filter((campaign) => campaign.status === 'PENDING_REVIEW').length;

    return { budget, spent, active, pending };
  }, [initialCampaigns]);

  const pendingDeleteCampaign = initialCampaigns.find((campaign) => campaign.id === pendingDeleteId) ?? null;

  return (
    <div className="dashboard-shell p-5 sm:p-8">
      <div className="dashboard-grid space-y-6">
        <section className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-sky-200/80">Sponsor dashboard</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Manage campaigns with more signal and less friction.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
              Track portfolio performance, refine campaign details, and keep the pipeline moving from draft to launch.
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
            Create Campaign
          </button>
        </section>

        {toast ? <ToastBanner toast={toast} onDismiss={() => setToast(null)} /> : null}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="dashboard-stat p-5 sm:p-6">
            <p className="text-sm text-slate-400">Total budget</p>
            <p className="mt-2 text-3xl font-semibold text-white">{formatCompactCurrency(stats.budget)}</p>
            <div className="dashboard-mini-card mt-4 p-3">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Portfolio</p>
              <p className="mt-1 text-sm text-slate-200">{initialCampaigns.length} campaigns in portfolio</p>
            </div>
          </div>
          <div className="dashboard-stat p-5 sm:p-6">
            <p className="text-sm text-slate-400">Spend to date</p>
            <p className="mt-2 text-3xl font-semibold text-white">{formatCompactCurrency(stats.spent)}</p>
            <div className="dashboard-mini-card mt-4 p-3">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Utilization</p>
              <p className="mt-1 text-sm text-slate-200">
                {stats.budget > 0 ? `${Math.round((stats.spent / stats.budget) * 100)}% of total budget` : 'No budget allocated yet'}
              </p>
            </div>
          </div>
          <div className="dashboard-stat p-5 sm:p-6">
            <p className="text-sm text-slate-400">Active campaigns</p>
            <p className="mt-2 text-3xl font-semibold text-white">{stats.active}</p>
            <div className="dashboard-mini-card mt-4 p-3">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Status</p>
              <p className="mt-1 text-sm text-slate-200">Currently running in market</p>
            </div>
          </div>
          <div className="dashboard-stat p-5 sm:p-6">
            <p className="text-sm text-slate-400">Pending review</p>
            <p className="mt-2 text-3xl font-semibold text-white">{stats.pending}</p>
            <div className="dashboard-mini-card mt-4 p-3">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Queue</p>
              <p className="mt-1 text-sm text-slate-200">Awaiting approval or edits</p>
            </div>
          </div>
        </section>

        <section className="dashboard-card p-4 sm:p-5">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1.5fr)_220px_220px_auto]">
            <label className="block">
              <span className="sr-only">Search campaigns</span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by name, description, category, or region"
                className="dashboard-input"
              />
            </label>
            <label className="block">
              <span className="sr-only">Filter campaigns by status</span>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as 'ALL' | SponsorCampaign['status'])}
                className="dashboard-input"
              >
                <option value="ALL">All statuses</option>
                <option value="DRAFT">Draft</option>
                <option value="PENDING_REVIEW">Pending review</option>
                <option value="APPROVED">Approved</option>
                <option value="ACTIVE">Active</option>
                <option value="PAUSED">Paused</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </label>
            <label className="block">
              <span className="sr-only">Sort campaigns</span>
              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value as 'recent' | 'budget' | 'spent')}
                className="dashboard-input"
              >
                <option value="recent">Sort by recent</option>
                <option value="budget">Sort by budget</option>
                <option value="spent">Sort by spend</option>
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
          <CampaignForm
            mode={mode}
            campaign={selectedCampaign}
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

        {filteredCampaigns.length === 0 ? (
          <section className="dashboard-card p-8 text-center sm:p-12">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">No matches</p>
            <h2 className="mt-4 text-2xl font-semibold text-white">
              {initialCampaigns.length === 0 ? 'Create your first campaign' : 'Adjust your filters'}
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-300">
              {initialCampaigns.length === 0
                ? 'Start with a campaign brief, budget, and dates. You can save it as a draft and come back later.'
                : 'No campaigns match the current search and filter combination. Try broadening the query or switching the status filter.'}
            </p>
          </section>
        ) : (
          <section
            className={
              view === 'grid'
                ? 'grid gap-4 lg:grid-cols-2 2xl:grid-cols-3'
                : 'grid gap-4'
            }
          >
            {filteredCampaigns.map((campaign, index) => {
              const progress = getProgress(Number(campaign.spent), Number(campaign.budget));

              return (
                <article
                  key={campaign.id}
                  className="dashboard-card dashboard-card-hover dashboard-fade-up p-5 sm:p-6"
                  style={{ animationDelay: `${index * 40}ms` }}
                >
                  <div className="relative z-10">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-xl font-semibold text-white">{campaign.name}</h3>
                          <span
                            className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold tracking-[0.2em] ${getStatusTone(campaign.status)}`}
                          >
                            {campaign.status.replaceAll('_', ' ')}
                          </span>
                        </div>
                        {campaign.description ? (
                          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">{campaign.description}</p>
                        ) : (
                          <p className="mt-3 text-sm text-slate-400">No description added yet.</p>
                        )}
                      </div>
                      <div className="text-left sm:text-right">
                        <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Budget</p>
                        <p className="mt-1 text-2xl font-semibold text-white">{formatCurrency(Number(campaign.budget))}</p>
                      </div>
                    </div>

                    <div className={`mt-6 grid gap-4 ${view === 'grid' ? 'sm:grid-cols-2 xl:grid-cols-3' : 'lg:grid-cols-4'}`}>
                      <div className="dashboard-mini-card p-4">
                        <p className="text-sm text-slate-400">Spent</p>
                        <p className="mt-2 text-xl font-semibold text-white">{formatCurrency(Number(campaign.spent))}</p>
                      </div>
                      <div className="dashboard-mini-card p-4">
                        <p className="text-sm text-slate-400">Flight</p>
                        <p className="mt-2 text-sm font-medium text-white">
                          {formatDate(campaign.startDate)} to {formatDate(campaign.endDate)}
                        </p>
                      </div>
                      <div className="dashboard-mini-card p-4">
                        <p className="text-sm text-slate-400">Targeting</p>
                        <p className="mt-2 text-sm font-medium text-white">
                          {campaign.targetCategories.slice(0, 2).join(', ') || 'Open'}{' '}
                          {campaign.targetRegions.length ? `• ${campaign.targetRegions.slice(0, 1).join(', ')}` : ''}
                        </p>
                      </div>
                    </div>

                    <div className="dashboard-mini-card mt-6 p-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-400">Budget utilization</span>
                        <span className="font-medium text-white">{Math.round(progress)}%</span>
                      </div>
                      <div className="mt-2 h-2 rounded-full bg-white/8">
                        <div
                          className="h-2 rounded-full bg-[linear-gradient(90deg,var(--color-accent),var(--color-primary-light))]"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedId(campaign.id);
                          setMode('edit');
                          setToast(null);
                        }}
                        className="dashboard-button dashboard-button-secondary text-sm"
                      >
                        Edit Campaign
                      </button>
                      <button
                        type="button"
                        onClick={() => setPendingDeleteId(campaign.id)}
                        className="dashboard-button rounded-full border border-rose-400/24 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-100"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </div>

      {pendingDeleteCampaign ? (
        <DeleteCampaignModal
          campaign={pendingDeleteCampaign}
          onClose={() => setPendingDeleteId(null)}
          onSuccess={(message) => {
            setToast({ tone: 'success', message });
            if (selectedId === pendingDeleteCampaign.id) {
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
