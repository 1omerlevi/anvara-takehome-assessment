'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { authClient } from '@/auth-client';
import { getMarketplaceAdSlot } from '@/lib/api';

interface AdSlot {
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

interface User {
  id: string;
  name: string;
  email: string;
}

interface RoleInfo {
  role: 'sponsor' | 'publisher' | null;
  sponsorId?: string;
  publisherId?: string;
  name?: string;
}

const API_URL = globalThis.process?.env.NEXT_PUBLIC_API_URL || 'http://localhost:4291';

const typeColors: Record<AdSlot['type'], string> = {
  DISPLAY: 'border-blue-400/30 bg-blue-500/12 text-blue-100',
  VIDEO: 'border-rose-400/30 bg-rose-500/12 text-rose-100',
  NATIVE: 'border-emerald-400/30 bg-emerald-500/12 text-emerald-100',
  NEWSLETTER: 'border-violet-400/30 bg-violet-500/12 text-violet-100',
  PODCAST: 'border-amber-400/30 bg-amber-500/12 text-amber-100',
};

interface Props {
  id: string;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

export function AdSlotDetail({ id }: Props) {
  const [adSlot, setAdSlot] = useState<AdSlot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [roleInfo, setRoleInfo] = useState<RoleInfo | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [booking, setBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  useEffect(() => {
    getMarketplaceAdSlot(id)
      .then((slot) => setAdSlot(slot as AdSlot))
      .catch(() => setError('Failed to load ad slot details'))
      .finally(() => setLoading(false));

    authClient
      .getSession()
      .then(({ data }) => {
        if (!data?.user) {
          setRoleLoading(false);
          return;
        }

        const sessionUser = data.user as User;
        setUser(sessionUser);

        fetch(`${API_URL}/api/auth/role/${sessionUser.id}`)
          .then((res) => res.json())
          .then((payload) => setRoleInfo(payload as RoleInfo))
          .catch(() => setRoleInfo(null))
          .finally(() => setRoleLoading(false));
      })
      .catch(() => setRoleLoading(false));
  }, [id]);

  const handleBooking = async () => {
    if (!roleInfo?.sponsorId || !adSlot) return;

    setBooking(true);
    setBookingError(null);

    try {
      const response = await fetch(`${API_URL}/api/ad-slots/${adSlot.id}/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sponsorId: roleInfo.sponsorId,
          message: message || undefined,
        }),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error || 'Failed to book placement');
      }

      setBookingSuccess(true);
      setAdSlot({ ...adSlot, isAvailable: false });
    } catch (err) {
      setBookingError(err instanceof Error ? err.message : 'Failed to book placement');
    } finally {
      setBooking(false);
    }
  };

  const handleUnbook = async () => {
    if (!adSlot) return;

    try {
      const response = await fetch(`${API_URL}/api/ad-slots/${adSlot.id}/unbook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Failed to reset booking');
      }

      setBookingSuccess(false);
      setAdSlot({ ...adSlot, isAvailable: true });
      setMessage('');
      setBookingError(null);
    } catch {
      setBookingError('Failed to reset booking.');
    }
  };

  if (loading) {
    return (
      <div className="dashboard-shell p-5 sm:p-8">
        <div className="dashboard-grid space-y-6 animate-pulse">
          <div className="h-6 w-40 rounded-full bg-white/10" />
          <div className="dashboard-card h-80 bg-white/5" />
          <div className="grid gap-4 lg:grid-cols-[1.5fr_0.9fr]">
            <div className="dashboard-card h-64 bg-white/5" />
            <div className="dashboard-card h-64 bg-white/5" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !adSlot) {
    return (
      <div className="space-y-4">
        <Link href="/marketplace" className="text-sm font-medium text-sky-200 hover:text-white">
          ← Back to Marketplace
        </Link>
        <div className="dashboard-shell p-5 sm:p-8">
          <div className="dashboard-grid">
            <div className="dashboard-card p-8 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-rose-300">Load error</p>
              <h1 className="mt-4 text-3xl font-semibold text-white">Placement not available.</h1>
              <p className="mt-3 text-sm leading-7 text-slate-300">{error || 'Ad slot not found'}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link href="/marketplace" className="text-sm font-medium text-sky-200 hover:text-white">
        ← Back to Marketplace
      </Link>

      <section className="dashboard-shell p-5 sm:p-8">
        <div className="dashboard-grid space-y-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">{adSlot.name}</h1>
                <span
                  className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold tracking-[0.2em] ${typeColors[adSlot.type]}`}
                >
                  {adSlot.type}
                </span>
              </div>
              <p className="mt-3 text-sm text-slate-400">
                by {adSlot.publisher?.name || 'Independent publisher'}
                {adSlot.publisher?.website ? ` • ${adSlot.publisher.website}` : ''}
              </p>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">
                {adSlot.description || 'No description has been added for this placement yet.'}
              </p>
            </div>

            <div className="dashboard-mini-card min-w-[220px] p-4 sm:p-5">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Monthly rate</p>
              <p className="mt-2 text-3xl font-semibold text-white">{formatCurrency(Number(adSlot.basePrice))}</p>
              <p className="mt-2 text-sm text-slate-300">Direct booking request</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="dashboard-stat p-5">
              <p className="text-sm text-slate-400">Availability</p>
              <p className="mt-2 text-2xl font-semibold text-white">{adSlot.isAvailable ? 'Available' : 'Booked'}</p>
              <div className="dashboard-mini-card mt-4 p-3">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Status</p>
                <p className="mt-1 text-sm text-slate-200">
                  {adSlot.isAvailable ? 'Open for sponsor requests' : 'Currently unavailable'}
                </p>
              </div>
            </div>
            <div className="dashboard-stat p-5">
              <p className="text-sm text-slate-400">Position</p>
              <p className="mt-2 text-2xl font-semibold text-white">{adSlot.position || 'Flexible'}</p>
              <div className="dashboard-mini-card mt-4 p-3">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Placement</p>
                <p className="mt-1 text-sm text-slate-200">Where this inventory typically appears</p>
              </div>
            </div>
            <div className="dashboard-stat p-5">
              <p className="text-sm text-slate-400">Dimensions</p>
              <p className="mt-2 text-2xl font-semibold text-white">
                {adSlot.width && adSlot.height ? `${adSlot.width} × ${adSlot.height}` : 'Flexible'}
              </p>
              <div className="dashboard-mini-card mt-4 p-3">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Format</p>
                <p className="mt-1 text-sm text-slate-200">Use this to validate creative requirements</p>
              </div>
            </div>
            <div className="dashboard-stat p-5">
              <p className="text-sm text-slate-400">CPM floor</p>
              <p className="mt-2 text-2xl font-semibold text-white">
                {adSlot.cpmFloor ? formatCurrency(Number(adSlot.cpmFloor)) : 'Not set'}
              </p>
              <div className="dashboard-mini-card mt-4 p-3">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Pricing signal</p>
                <p className="mt-1 text-sm text-slate-200">Helpful when comparing media efficiency</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.4fr_0.95fr]">
        <div className="dashboard-card p-6 sm:p-8">
          <div className="relative z-10">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Placement overview</p>
            <h2 className="mt-3 text-2xl font-semibold text-white">Why this slot is worth considering</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="dashboard-mini-card p-4">
                <p className="text-sm text-slate-400">Publisher</p>
                <p className="mt-2 text-lg font-semibold text-white">{adSlot.publisher?.name || 'Independent publisher'}</p>
                <p className="mt-2 text-sm text-slate-300">Review the publisher name before you request the placement.</p>
              </div>
              <div className="dashboard-mini-card p-4">
                <p className="text-sm text-slate-400">Inventory type</p>
                <p className="mt-2 text-lg font-semibold text-white">{adSlot.type}</p>
                <p className="mt-2 text-sm text-slate-300">Use the format to decide what creative or messaging fits best.</p>
              </div>
              <div className="dashboard-mini-card p-4 md:col-span-2">
                <p className="text-sm text-slate-400">Booking notes</p>
                <p className="mt-2 text-sm leading-7 text-slate-300">
                  Include campaign timing, target audience, and any creative constraints in your request message so the publisher can qualify the placement faster.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="dashboard-card p-6 sm:p-8">
          <div className="relative z-10">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Request placement</p>
            <h2 className="mt-3 text-2xl font-semibold text-white">Contact the publisher</h2>

            {!adSlot.isAvailable && !bookingSuccess ? (
              <div className="mt-6 rounded-2xl border border-amber-400/30 bg-amber-500/10 p-4 text-amber-100">
                This placement is currently booked. You can reset it locally for testing.
                <button
                  onClick={handleUnbook}
                  className="mt-4 dashboard-button rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950"
                >
                  Reset Listing
                </button>
              </div>
            ) : bookingSuccess ? (
              <div className="mt-6 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-4 text-emerald-100">
                Request submitted successfully. This placement is now marked unavailable.
                <button
                  onClick={handleUnbook}
                  className="mt-4 dashboard-button dashboard-button-secondary text-sm"
                >
                  Reset Listing
                </button>
              </div>
            ) : roleLoading ? (
              <div className="mt-6 text-sm text-slate-300">Checking your account permissions...</div>
            ) : roleInfo?.role === 'sponsor' && roleInfo?.sponsorId ? (
              <div className="mt-6 space-y-4">
                <div className="dashboard-mini-card p-4">
                  <p className="text-sm text-slate-400">Requesting as</p>
                  <p className="mt-2 text-base font-semibold text-white">{roleInfo.name || user?.name}</p>
                </div>

                <label className="block">
                  <span className="text-sm font-medium text-slate-200">Message to publisher</span>
                  <textarea
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    placeholder="Share campaign goals, audience, timing, and any creative notes."
                    className="dashboard-input mt-2 min-h-32 resize-y"
                    rows={4}
                  />
                </label>

                {bookingError ? (
                  <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 p-3 text-sm text-rose-200">
                    {bookingError}
                  </div>
                ) : null}

                <button
                  onClick={handleBooking}
                  disabled={booking}
                  className="dashboard-button dashboard-button-primary w-full text-sm disabled:opacity-60"
                >
                  {booking ? 'Submitting Request...' : 'Request This Placement'}
                </button>
              </div>
            ) : (
              <div className="mt-6 rounded-2xl border border-white/10 bg-white/4 p-4">
                <button
                  disabled
                  className="dashboard-button w-full cursor-not-allowed rounded-full bg-white/10 text-sm text-slate-400"
                >
                  Request This Placement
                </button>
                <p className="mt-3 text-center text-sm text-slate-300">
                  {user ? 'Only sponsors can request placements.' : 'Log in as a sponsor to request this placement.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
