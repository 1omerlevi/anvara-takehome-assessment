import type { AdSlot, Campaign, Placement } from './types';

const API_URL = globalThis.process?.env.NEXT_PUBLIC_API_URL || 'http://localhost:4291';

type FetchOptions = globalThis.RequestInit;

type MarketplaceAdSlot = AdSlot & {
  position?: string | null;
  width?: number | null;
  height?: number | null;
  cpmFloor?: number | null;
  publisher?: {
    id: string;
    name: string;
    website?: string;
    category?: string;
    monthlyViews?: number;
  } | null;
};

type PlacementPayload = Partial<Placement> & {
  campaignId: string;
  adSlotId: string;
};

type DashboardStats = {
  campaigns: number;
  adSlots: number;
  placements: number;
  revenue?: number;
};

async function readErrorMessage(res: Response): Promise<string> {
  try {
    const data = (await res.json()) as { error?: string };
    return data.error || 'API request failed';
  } catch {
    return 'API request failed';
  }
}

export async function api<T>(endpoint: string, options?: FetchOptions): Promise<T> {
  const res = await fetch(`${API_URL}${endpoint}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    credentials: options?.credentials ?? 'include',
    ...options,
  });

  if (!res.ok) {
    throw new Error(await readErrorMessage(res));
  }

  return (await res.json()) as T;
}

export const getCampaigns = () => api<Campaign[]>('/api/campaigns');
export const getCampaign = (id: string) => api<Campaign>(`/api/campaigns/${id}`);
export const createCampaign = (data: Partial<Campaign>) =>
  api<Campaign>('/api/campaigns', { method: 'POST', body: JSON.stringify(data) });

export const getAdSlots = () => api<AdSlot[]>('/api/ad-slots');
export const getAdSlot = (id: string) => api<AdSlot>(`/api/ad-slots/${id}`);
export const createAdSlot = (data: Partial<AdSlot>) =>
  api<AdSlot>('/api/ad-slots', { method: 'POST', body: JSON.stringify(data) });

export const getMarketplaceAdSlots = () =>
  api<MarketplaceAdSlot[]>('/api/ad-slots/public?available=true', { credentials: 'omit' });
export const getMarketplaceAdSlot = (id: string) =>
  api<MarketplaceAdSlot>(`/api/ad-slots/public/${id}`, { credentials: 'omit' });

export const getPlacements = () => api<Placement[]>('/api/placements');
export const createPlacement = (data: PlacementPayload) =>
  api<Placement>('/api/placements', { method: 'POST', body: JSON.stringify(data) });

export const getStats = () => api<DashboardStats>('/api/dashboard/stats');
