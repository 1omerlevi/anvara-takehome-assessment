'use client';

import { useActionState, useEffect, useMemo, useState } from 'react';
import { useFormStatus } from 'react-dom';
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
  return <p className="mt-1 text-sm text-red-600">{message}</p>;
}

function DeleteCampaignForm({
  id,
  onSuccess,
}: {
  id: string;
  onSuccess: (message: string) => void;
}) {
  const [state, formAction] = useActionState(deleteCampaign, initialState);

  useEffect(() => {
    if (state.success && state.message) {
      onSuccess(state.message);
    }
  }, [state, onSuccess]);

  return (
    <form action={formAction}>
      <input type="hidden" name="id" value={id} />
      <SubmitButton
        idleLabel="Delete"
        pendingLabel="Deleting..."
        className="rounded border border-red-300 px-3 py-1.5 text-sm text-red-700 hover:bg-red-50 disabled:opacity-60"
      />
      {state.error ? <p className="mt-2 text-sm text-red-600">{state.error}</p> : null}
    </form>
  );
}

function toDateInputValue(value: string) {
  return new Date(value).toISOString().slice(0, 10);
}

function CampaignForm({
  mode,
  campaign,
  onCancel,
  onSuccess,
}: {
  mode: 'create' | 'edit';
  campaign?: SponsorCampaign;
  onCancel: () => void;
  onSuccess: (message: string) => void;
}) {
  const action = mode === 'create' ? createCampaign : updateCampaign;
  const [state, formAction] = useActionState(action, initialState);

  useEffect(() => {
    if (state.success && state.message) {
      onSuccess(state.message);
    }
  }, [state, onSuccess]);

  return (
    <form action={formAction} className="rounded-xl border border-[--color-border] bg-white p-6">
      {mode === 'edit' ? <input type="hidden" name="id" value={campaign?.id} /> : null}

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          {mode === 'create' ? 'Create Campaign' : 'Edit Campaign'}
        </h2>
        <button type="button" onClick={onCancel} className="text-sm text-[--color-muted]">
          Cancel
        </button>
      </div>

      {state.error ? (
        <div className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-600">
          {state.error}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium">Name</span>
          <input
            name="name"
            defaultValue={campaign?.name ?? ''}
            className="mt-1 w-full rounded border border-[--color-border] px-3 py-2"
          />
          <FieldError message={state.fieldErrors.name} />
        </label>

        <label className="block">
          <span className="text-sm font-medium">Budget</span>
          <input
            name="budget"
            type="number"
            step="0.01"
            defaultValue={campaign?.budget ?? ''}
            className="mt-1 w-full rounded border border-[--color-border] px-3 py-2"
          />
          <FieldError message={state.fieldErrors.budget} />
        </label>

        <label className="block md:col-span-2">
          <span className="text-sm font-medium">Description</span>
          <textarea
            name="description"
            defaultValue={campaign?.description ?? ''}
            rows={3}
            className="mt-1 w-full rounded border border-[--color-border] px-3 py-2"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium">Start Date</span>
          <input
            name="startDate"
            type="date"
            defaultValue={campaign ? toDateInputValue(campaign.startDate) : ''}
            className="mt-1 w-full rounded border border-[--color-border] px-3 py-2"
          />
          <FieldError message={state.fieldErrors.startDate} />
        </label>

        <label className="block">
          <span className="text-sm font-medium">End Date</span>
          <input
            name="endDate"
            type="date"
            defaultValue={campaign ? toDateInputValue(campaign.endDate) : ''}
            className="mt-1 w-full rounded border border-[--color-border] px-3 py-2"
          />
          <FieldError message={state.fieldErrors.endDate} />
        </label>

        <label className="block">
          <span className="text-sm font-medium">CPM Rate</span>
          <input
            name="cpmRate"
            type="number"
            step="0.01"
            defaultValue={campaign?.cpmRate ?? ''}
            className="mt-1 w-full rounded border border-[--color-border] px-3 py-2"
          />
          <FieldError message={state.fieldErrors.cpmRate} />
        </label>

        <label className="block">
          <span className="text-sm font-medium">CPC Rate</span>
          <input
            name="cpcRate"
            type="number"
            step="0.01"
            defaultValue={campaign?.cpcRate ?? ''}
            className="mt-1 w-full rounded border border-[--color-border] px-3 py-2"
          />
          <FieldError message={state.fieldErrors.cpcRate} />
        </label>

        <label className="block">
          <span className="text-sm font-medium">Target Categories</span>
          <input
            name="targetCategories"
            defaultValue={campaign?.targetCategories?.join(', ') ?? ''}
            placeholder="Tech, Finance, SaaS"
            className="mt-1 w-full rounded border border-[--color-border] px-3 py-2"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium">Target Regions</span>
          <input
            name="targetRegions"
            defaultValue={campaign?.targetRegions?.join(', ') ?? ''}
            placeholder="US, EU, Remote"
            className="mt-1 w-full rounded border border-[--color-border] px-3 py-2"
          />
        </label>

        {mode === 'edit' ? (
          <label className="block md:col-span-2">
            <span className="text-sm font-medium">Status</span>
            <select
              name="status"
              defaultValue={campaign?.status ?? 'DRAFT'}
              className="mt-1 w-full rounded border border-[--color-border] px-3 py-2"
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

      <div className="mt-6">
        <SubmitButton
          idleLabel={mode === 'create' ? 'Create Campaign' : 'Save Changes'}
          pendingLabel={mode === 'create' ? 'Saving...' : 'Updating...'}
          className="rounded bg-[--color-primary] px-4 py-2 text-white hover:opacity-90 disabled:opacity-60"
        />
      </div>
    </form>
  );
}

export function SponsorDashboardClient({
  initialCampaigns,
  loadError,
}: SponsorDashboardClientProps) {
  const [mode, setMode] = useState<'create' | 'edit' | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);

  const selectedCampaign = useMemo(
    () => initialCampaigns.find((campaign) => campaign.id === selectedId),
    [initialCampaigns, selectedId]
  );

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Campaigns</h1>
          <p className="text-[--color-muted]">Create, update, and delete your sponsor campaigns.</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setBanner(null);
            setSelectedId(null);
            setMode('create');
          }}
          className="rounded bg-[--color-primary] px-4 py-2 text-white hover:opacity-90"
        >
          Create Campaign
        </button>
      </div>

      {banner ? (
        <div className="rounded border border-green-200 bg-green-50 p-3 text-green-700">
          {banner}
        </div>
      ) : null}

      {mode ? (
        <CampaignForm
          mode={mode}
          campaign={selectedCampaign}
          onCancel={() => setMode(null)}
          onSuccess={(message) => {
            setBanner(message);
            setMode(null);
            setSelectedId(null);
          }}
        />
      ) : null}

      {loadError ? (
        <div className="rounded border border-red-200 bg-red-50 p-4 text-red-600">{loadError}</div>
      ) : initialCampaigns.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[--color-border] p-8 text-center text-[--color-muted]">
          No campaigns yet. Create your first campaign to get started.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {initialCampaigns.map((campaign) => (
            <div key={campaign.id} className="rounded-lg border border-[--color-border] p-4">
              <div className="mb-2 flex items-start justify-between gap-3">
                <h3 className="font-semibold">{campaign.name}</h3>
                <span className="rounded bg-gray-100 px-2 py-0.5 text-xs">{campaign.status}</span>
              </div>

              {campaign.description ? (
                <p className="mb-3 text-sm text-[--color-muted]">{campaign.description}</p>
              ) : null}

              <div className="space-y-1 text-sm text-[--color-muted]">
                <p>Budget: ${Number(campaign.budget).toLocaleString()}</p>
                <p>Spent: ${Number(campaign.spent).toLocaleString()}</p>
                <p>
                  Dates: {new Date(campaign.startDate).toLocaleDateString()} -{' '}
                  {new Date(campaign.endDate).toLocaleDateString()}
                </p>
              </div>

              <div className="mt-4 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setBanner(null);
                    setSelectedId(campaign.id);
                    setMode('edit');
                  }}
                  className="rounded border border-[--color-border] px-3 py-1.5 text-sm hover:bg-gray-50"
                >
                  Edit
                </button>

                <DeleteCampaignForm
                  id={campaign.id}
                  onSuccess={(message) => {
                    setBanner(message);
                    if (selectedId === campaign.id) {
                      setSelectedId(null);
                      setMode(null);
                    }
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
