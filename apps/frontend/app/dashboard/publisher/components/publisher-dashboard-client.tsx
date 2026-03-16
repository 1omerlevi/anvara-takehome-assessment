'use client';

import { useActionState, useEffect, useMemo, useState } from 'react';
import { useFormStatus } from 'react-dom';
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

function DeleteAdSlotForm({
  id,
  onSuccess,
}: {
  id: string;
  onSuccess: (message: string) => void;
}) {
  const [state, formAction] = useActionState(deleteAdSlot, initialState);

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

function AdSlotForm({
  mode,
  adSlot,
  onCancel,
  onSuccess,
}: {
  mode: 'create' | 'edit';
  adSlot?: PublisherAdSlot;
  onCancel: () => void;
  onSuccess: (message: string) => void;
}) {
  const action = mode === 'create' ? createAdSlot : updateAdSlot;
  const [state, formAction] = useActionState(action, initialState);

  useEffect(() => {
    if (state.success && state.message) {
      onSuccess(state.message);
    }
  }, [state, onSuccess]);

  return (
    <form action={formAction} className="rounded-xl border border-[--color-border] bg-white p-6">
      {mode === 'edit' ? <input type="hidden" name="id" value={adSlot?.id} /> : null}

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          {mode === 'create' ? 'Create Ad Slot' : 'Edit Ad Slot'}
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
            defaultValue={adSlot?.name ?? ''}
            className="mt-1 w-full rounded border border-[--color-border] px-3 py-2"
          />
          <FieldError message={state.fieldErrors.name} />
        </label>

        <label className="block">
          <span className="text-sm font-medium">Type</span>
          <select
            name="type"
            defaultValue={adSlot?.type ?? 'DISPLAY'}
            className="mt-1 w-full rounded border border-[--color-border] px-3 py-2"
          >
            <option value="DISPLAY">DISPLAY</option>
            <option value="VIDEO">VIDEO</option>
            <option value="NATIVE">NATIVE</option>
            <option value="NEWSLETTER">NEWSLETTER</option>
            <option value="PODCAST">PODCAST</option>
          </select>
          <FieldError message={state.fieldErrors.type} />
        </label>

        <label className="block md:col-span-2">
          <span className="text-sm font-medium">Description</span>
          <textarea
            name="description"
            defaultValue={adSlot?.description ?? ''}
            rows={3}
            className="mt-1 w-full rounded border border-[--color-border] px-3 py-2"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium">Position</span>
          <input
            name="position"
            defaultValue={adSlot?.position ?? ''}
            className="mt-1 w-full rounded border border-[--color-border] px-3 py-2"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium">Base Price</span>
          <input
            name="basePrice"
            type="number"
            step="0.01"
            defaultValue={adSlot?.basePrice ?? ''}
            className="mt-1 w-full rounded border border-[--color-border] px-3 py-2"
          />
          <FieldError message={state.fieldErrors.basePrice} />
        </label>

        <label className="block">
          <span className="text-sm font-medium">Width</span>
          <input
            name="width"
            type="number"
            defaultValue={adSlot?.width ?? ''}
            className="mt-1 w-full rounded border border-[--color-border] px-3 py-2"
          />
          <FieldError message={state.fieldErrors.width} />
        </label>

        <label className="block">
          <span className="text-sm font-medium">Height</span>
          <input
            name="height"
            type="number"
            defaultValue={adSlot?.height ?? ''}
            className="mt-1 w-full rounded border border-[--color-border] px-3 py-2"
          />
          <FieldError message={state.fieldErrors.height} />
        </label>

        <label className="block">
          <span className="text-sm font-medium">CPM Floor</span>
          <input
            name="cpmFloor"
            type="number"
            step="0.01"
            defaultValue={adSlot?.cpmFloor ?? ''}
            className="mt-1 w-full rounded border border-[--color-border] px-3 py-2"
          />
          <FieldError message={state.fieldErrors.cpmFloor} />
        </label>

        <label className="flex items-center gap-2 pt-7">
          <input
            name="isAvailable"
            type="checkbox"
            defaultChecked={adSlot?.isAvailable ?? true}
            className="h-4 w-4"
          />
          <span className="text-sm font-medium">Available</span>
        </label>
      </div>

      <div className="mt-6">
        <SubmitButton
          idleLabel={mode === 'create' ? 'Create Ad Slot' : 'Save Changes'}
          pendingLabel={mode === 'create' ? 'Saving...' : 'Updating...'}
          className="rounded bg-[--color-primary] px-4 py-2 text-white hover:opacity-90 disabled:opacity-60"
        />
      </div>
    </form>
  );
}

export function PublisherDashboardClient({
  initialAdSlots,
  loadError,
}: PublisherDashboardClientProps) {
  const [mode, setMode] = useState<'create' | 'edit' | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);

  const selectedAdSlot = useMemo(
    () => initialAdSlots.find((slot) => slot.id === selectedId),
    [initialAdSlots, selectedId]
  );

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Ad Slots</h1>
          <p className="text-[--color-muted]">Create, update, and delete your publisher inventory.</p>
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
          Create Ad Slot
        </button>
      </div>

      {banner ? (
        <div className="rounded border border-green-200 bg-green-50 p-3 text-green-700">
          {banner}
        </div>
      ) : null}

      {mode ? (
        <AdSlotForm
          mode={mode}
          adSlot={selectedAdSlot}
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
      ) : initialAdSlots.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[--color-border] p-8 text-center text-[--color-muted]">
          No ad slots yet. Create your first ad slot to start earning.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {initialAdSlots.map((slot) => (
            <div key={slot.id} className="rounded-lg border border-[--color-border] p-4">
              <div className="mb-2 flex items-start justify-between gap-3">
                <h3 className="font-semibold">{slot.name}</h3>
                <span className="rounded bg-gray-100 px-2 py-0.5 text-xs">{slot.type}</span>
              </div>

              {slot.description ? (
                <p className="mb-3 text-sm text-[--color-muted]">{slot.description}</p>
              ) : null}

              <div className="space-y-1 text-sm text-[--color-muted]">
                <p>Base Price: ${Number(slot.basePrice).toLocaleString()}</p>
                <p>Status: {slot.isAvailable ? 'Available' : 'Booked'}</p>
                {slot.position ? <p>Position: {slot.position}</p> : null}
                {slot.width && slot.height ? <p>Size: {slot.width} x {slot.height}</p> : null}
              </div>

              <div className="mt-4 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setBanner(null);
                    setSelectedId(slot.id);
                    setMode('edit');
                  }}
                  className="rounded border border-[--color-border] px-3 py-1.5 text-sm hover:bg-gray-50"
                >
                  Edit
                </button>

                <DeleteAdSlotForm
                  id={slot.id}
                  onSuccess={(message) => {
                    setBanner(message);
                    if (selectedId === slot.id) {
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
