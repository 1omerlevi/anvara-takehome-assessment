'use server';

import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';

const API_URL = globalThis.process?.env.NEXT_PUBLIC_API_URL || 'http://localhost:4291';

export interface PublisherAdSlot {
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
}

export interface DashboardActionState {
  success: boolean;
  message: string | null;
  error: string | null;
  fieldErrors: Record<string, string>;
}

async function getCookieHeader() {
  return (await headers()).get('cookie') ?? '';
}

async function readErrorMessage(res: Response, fallback: string) {
  try {
    const data = (await res.json()) as { error?: string };
    return data.error || fallback;
  } catch {
    return fallback;
  }
}

function parseOptionalNumber(value: string | File | null) {
  if (typeof value !== 'string' || value.trim() === '') {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

function validateAdSlot(formData: FormData) {
  const fieldErrors: Record<string, string> = {};

  const name = String(formData.get('name') ?? '').trim();
  const type = String(formData.get('type') ?? '').trim();
  const basePrice = parseOptionalNumber(formData.get('basePrice'));
  const width = parseOptionalNumber(formData.get('width'));
  const height = parseOptionalNumber(formData.get('height'));
  const cpmFloor = parseOptionalNumber(formData.get('cpmFloor'));

  if (!name) fieldErrors.name = 'Name is required.';
  if (!type) fieldErrors.type = 'Type is required.';
  if (basePrice === undefined || Number.isNaN(basePrice) || basePrice <= 0) {
    fieldErrors.basePrice = 'Base price must be a positive number.';
  }
  if (width !== undefined && (Number.isNaN(width) || width <= 0 || !Number.isInteger(width))) {
    fieldErrors.width = 'Width must be a positive integer.';
  }
  if (height !== undefined && (Number.isNaN(height) || height <= 0 || !Number.isInteger(height))) {
    fieldErrors.height = 'Height must be a positive integer.';
  }
  if (cpmFloor !== undefined && (Number.isNaN(cpmFloor) || cpmFloor < 0)) {
    fieldErrors.cpmFloor = 'CPM floor must be zero or greater.';
  }

  return fieldErrors;
}

function buildAdSlotPayload(formData: FormData) {
  const payload: Record<string, unknown> = {
    name: String(formData.get('name') ?? '').trim(),
    description: String(formData.get('description') ?? '').trim() || null,
    type: String(formData.get('type') ?? '').trim(),
    position: String(formData.get('position') ?? '').trim() || null,
    basePrice: Number(formData.get('basePrice')),
    isAvailable: formData.get('isAvailable') === 'on',
  };

  const width = parseOptionalNumber(formData.get('width'));
  const height = parseOptionalNumber(formData.get('height'));
  const cpmFloor = parseOptionalNumber(formData.get('cpmFloor'));

  if (width !== undefined) payload.width = width;
  if (height !== undefined) payload.height = height;
  if (cpmFloor !== undefined) payload.cpmFloor = cpmFloor;

  return payload;
}

export async function getPublisherAdSlots(): Promise<{
  adSlots: PublisherAdSlot[];
  error: string | null;
}> {
  try {
    const res = await fetch(`${API_URL}/api/ad-slots`, {
      cache: 'no-store',
      headers: {
        cookie: await getCookieHeader(),
      },
    });

    if (!res.ok) {
      return { adSlots: [], error: 'Failed to load ad slots.' };
    }

    const adSlots = (await res.json()) as PublisherAdSlot[];
    return { adSlots, error: null };
  } catch {
    return { adSlots: [], error: 'Failed to load ad slots.' };
  }
}

export async function createAdSlot(
  _prevState: DashboardActionState,
  formData: FormData
): Promise<DashboardActionState> {
  const fieldErrors = validateAdSlot(formData);
  if (Object.keys(fieldErrors).length > 0) {
    return {
      success: false,
      message: null,
      error: 'Please correct the highlighted fields.',
      fieldErrors,
    };
  }

  try {
    const res = await fetch(`${API_URL}/api/ad-slots`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: await getCookieHeader(),
      },
      body: JSON.stringify(buildAdSlotPayload(formData)),
    });

    if (!res.ok) {
      return {
        success: false,
        message: null,
        error: await readErrorMessage(res, 'Failed to create ad slot.'),
        fieldErrors: {},
      };
    }

    revalidatePath('/dashboard/publisher');

    return {
      success: true,
      message: 'Ad slot created successfully.',
      error: null,
      fieldErrors: {},
    };
  } catch {
    return {
      success: false,
      message: null,
      error: 'Failed to create ad slot.',
      fieldErrors: {},
    };
  }
}

export async function updateAdSlot(
  _prevState: DashboardActionState,
  formData: FormData
): Promise<DashboardActionState> {
  const id = String(formData.get('id') ?? '');
  if (!id) {
    return {
      success: false,
      message: null,
      error: 'Missing ad slot id.',
      fieldErrors: {},
    };
  }

  const fieldErrors = validateAdSlot(formData);
  if (Object.keys(fieldErrors).length > 0) {
    return {
      success: false,
      message: null,
      error: 'Please correct the highlighted fields.',
      fieldErrors,
    };
  }

  try {
    const res = await fetch(`${API_URL}/api/ad-slots/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        cookie: await getCookieHeader(),
      },
      body: JSON.stringify(buildAdSlotPayload(formData)),
    });

    if (!res.ok) {
      return {
        success: false,
        message: null,
        error: await readErrorMessage(res, 'Failed to update ad slot.'),
        fieldErrors: {},
      };
    }

    revalidatePath('/dashboard/publisher');

    return {
      success: true,
      message: 'Ad slot updated successfully.',
      error: null,
      fieldErrors: {},
    };
  } catch {
    return {
      success: false,
      message: null,
      error: 'Failed to update ad slot.',
      fieldErrors: {},
    };
  }
}

export async function deleteAdSlot(
  _prevState: DashboardActionState,
  formData: FormData
): Promise<DashboardActionState> {
  const id = String(formData.get('id') ?? '');
  if (!id) {
    return {
      success: false,
      message: null,
      error: 'Missing ad slot id.',
      fieldErrors: {},
    };
  }

  try {
    const res = await fetch(`${API_URL}/api/ad-slots/${id}`, {
      method: 'DELETE',
      headers: {
        cookie: await getCookieHeader(),
      },
    });

    if (!res.ok) {
      return {
        success: false,
        message: null,
        error: await readErrorMessage(res, 'Failed to delete ad slot.'),
        fieldErrors: {},
      };
    }

    revalidatePath('/dashboard/publisher');

    return {
      success: true,
      message: 'Ad slot deleted successfully.',
      error: null,
      fieldErrors: {},
    };
  } catch {
    return {
      success: false,
      message: null,
      error: 'Failed to delete ad slot.',
      fieldErrors: {},
    };
  }
}
