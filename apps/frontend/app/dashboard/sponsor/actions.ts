'use server';

import { headers } from 'next/headers';
import type { Campaign } from '@/lib/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4291';
const REQUEST_TIMEOUT_MS = 5000;

export async function getSponsorCampaigns(
  sponsorId: string
): Promise<{ campaigns: Campaign[]; error: string | null }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const cookieHeader = (await headers()).get('cookie') ?? '';
    const res = await fetch(`${API_URL}/api/campaigns?sponsorId=${encodeURIComponent(sponsorId)}`, {
      cache: 'no-store',
      signal: controller.signal,
      headers: {
        cookie: cookieHeader,
      },

    });

    if (!res.ok) {
      return { campaigns: [], error: 'Failed to load campaigns' };
    }

    const campaigns = (await res.json()) as Campaign[];
    return { campaigns, error: null };
  } catch {
    return { campaigns: [], error: 'Failed to load campaigns' };
  } finally {
    clearTimeout(timeoutId);
  }
}
