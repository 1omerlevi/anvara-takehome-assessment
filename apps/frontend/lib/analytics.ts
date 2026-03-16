'use client';

type MarketplaceEventName =
  | 'marketplace_viewed'
  | 'marketplace_filters_changed'
  | 'marketplace_listing_clicked'
  | 'marketplace_detail_viewed'
  | 'marketplace_request_attempted'
  | 'marketplace_request_succeeded'
  | 'marketplace_request_failed'
  | 'marketplace_request_blocked';

type MarketplaceEventPayload = {
  event: MarketplaceEventName;
  timestamp: string;
  path: string;
  metadata?: Record<string, string | number | boolean | null | undefined>;
};

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
  }
}

const STORAGE_KEY = 'anvara.marketplace.analytics';

function getPath() {
  if (typeof window === 'undefined') return '';
  return `${window.location.pathname}${window.location.search}`;
}

function readStoredEvents(): MarketplaceEventPayload[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as MarketplaceEventPayload[];
  } catch {
    return [];
  }
}

function persistEvent(payload: MarketplaceEventPayload) {
  if (typeof window === 'undefined') return;

  const next = [...readStoredEvents(), payload].slice(-25);
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export function trackMarketplaceEvent(
  event: MarketplaceEventName,
  metadata?: Record<string, string | number | boolean | null | undefined>,
) {
  if (typeof window === 'undefined') return;

  const payload: MarketplaceEventPayload = {
    event,
    timestamp: new Date().toISOString(),
    path: getPath(),
    metadata,
  };

  persistEvent(payload);

  window.dataLayer?.push({
    event,
    path: payload.path,
    timestamp: payload.timestamp,
    ...metadata,
  });

  window.dispatchEvent(new CustomEvent('anvara:marketplace-event', { detail: payload }));
}

export function getTrackedMarketplaceEvents() {
  return readStoredEvents();
}
