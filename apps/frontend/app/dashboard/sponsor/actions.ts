'use server';

import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';

const API_URL = globalThis.process?.env.NEXT_PUBLIC_API_URL || 'http://localhost:4291';

export interface SponsorCampaign {
  id: string;
  name: string;
  description?: string | null;
  budget: number;
  spent: number;
  status:
    | 'DRAFT'
    | 'PENDING_REVIEW'
    | 'APPROVED'
    | 'ACTIVE'
    | 'PAUSED'
    | 'COMPLETED'
    | 'CANCELLED';
  startDate: string;
  endDate: string;
  cpmRate?: number | null;
  cpcRate?: number | null;
  targetCategories: string[];
  targetRegions: string[];
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

function parseStringList(value: string | File | null) {
  if (typeof value !== 'string' || value.trim() === '') {
    return [];
  }

  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function validateCampaign(formData: FormData) {
  const fieldErrors: Record<string, string> = {};

  const name = String(formData.get('name') ?? '').trim();
  const budget = parseOptionalNumber(formData.get('budget'));
  const cpmRate = parseOptionalNumber(formData.get('cpmRate'));
  const cpcRate = parseOptionalNumber(formData.get('cpcRate'));
  const startDate = String(formData.get('startDate') ?? '').trim();
  const endDate = String(formData.get('endDate') ?? '').trim();

  if (!name) fieldErrors.name = 'Name is required.';
  if (budget === undefined || Number.isNaN(budget) || budget <= 0) {
    fieldErrors.budget = 'Budget must be a positive number.';
  }
  if (cpmRate !== undefined && (Number.isNaN(cpmRate) || cpmRate < 0)) {
    fieldErrors.cpmRate = 'CPM rate must be zero or greater.';
  }
  if (cpcRate !== undefined && (Number.isNaN(cpcRate) || cpcRate < 0)) {
    fieldErrors.cpcRate = 'CPC rate must be zero or greater.';
  }
  if (!startDate) fieldErrors.startDate = 'Start date is required.';
  if (!endDate) fieldErrors.endDate = 'End date is required.';

  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (Number.isNaN(start.getTime())) fieldErrors.startDate = 'Invalid start date.';
    if (Number.isNaN(end.getTime())) fieldErrors.endDate = 'Invalid end date.';
    if (!fieldErrors.startDate && !fieldErrors.endDate && end < start) {
      fieldErrors.endDate = 'End date must be after start date.';
    }
  }

  return fieldErrors;
}

function buildCampaignPayload(formData: FormData, includeStatus: boolean) {
  const payload: Record<string, unknown> = {
    name: String(formData.get('name') ?? '').trim(),
    description: String(formData.get('description') ?? '').trim() || null,
    budget: Number(formData.get('budget')),
    startDate: String(formData.get('startDate') ?? ''),
    endDate: String(formData.get('endDate') ?? ''),
    targetCategories: parseStringList(formData.get('targetCategories')),
    targetRegions: parseStringList(formData.get('targetRegions')),
  };

  const cpmRate = parseOptionalNumber(formData.get('cpmRate'));
  const cpcRate = parseOptionalNumber(formData.get('cpcRate'));

  if (cpmRate !== undefined) payload.cpmRate = cpmRate;
  if (cpcRate !== undefined) payload.cpcRate = cpcRate;

  if (includeStatus) {
    payload.status = String(formData.get('status') ?? 'DRAFT');
  }

  return payload;
}

export async function getSponsorCampaigns(): Promise<{
  campaigns: SponsorCampaign[];
  error: string | null;
}> {
  try {
    const res = await fetch(`${API_URL}/api/campaigns`, {
      cache: 'no-store',
      headers: {
        cookie: await getCookieHeader(),
      },
    });

    if (!res.ok) {
      return { campaigns: [], error: 'Failed to load campaigns.' };
    }

    const campaigns = (await res.json()) as SponsorCampaign[];
    return { campaigns, error: null };
  } catch {
    return { campaigns: [], error: 'Failed to load campaigns.' };
  }
}

export async function createCampaign(
  _prevState: DashboardActionState,
  formData: FormData
): Promise<DashboardActionState> {
  const fieldErrors = validateCampaign(formData);
  if (Object.keys(fieldErrors).length > 0) {
    return {
      success: false,
      message: null,
      error: 'Please correct the highlighted fields.',
      fieldErrors,
    };
  }

  try {
    const res = await fetch(`${API_URL}/api/campaigns`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: await getCookieHeader(),
      },
      body: JSON.stringify(buildCampaignPayload(formData, false)),
    });

    if (!res.ok) {
      return {
        success: false,
        message: null,
        error: await readErrorMessage(res, 'Failed to create campaign.'),
        fieldErrors: {},
      };
    }

    revalidatePath('/dashboard/sponsor');

    return {
      success: true,
      message: 'Campaign created successfully.',
      error: null,
      fieldErrors: {},
    };
  } catch {
    return {
      success: false,
      message: null,
      error: 'Failed to create campaign.',
      fieldErrors: {},
    };
  }
}

export async function updateCampaign(
  _prevState: DashboardActionState,
  formData: FormData
): Promise<DashboardActionState> {
  const id = String(formData.get('id') ?? '');
  if (!id) {
    return {
      success: false,
      message: null,
      error: 'Missing campaign id.',
      fieldErrors: {},
    };
  }

  const fieldErrors = validateCampaign(formData);
  if (Object.keys(fieldErrors).length > 0) {
    return {
      success: false,
      message: null,
      error: 'Please correct the highlighted fields.',
      fieldErrors,
    };
  }

  try {
    const res = await fetch(`${API_URL}/api/campaigns/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        cookie: await getCookieHeader(),
      },
      body: JSON.stringify(buildCampaignPayload(formData, true)),
    });

    if (!res.ok) {
      return {
        success: false,
        message: null,
        error: await readErrorMessage(res, 'Failed to update campaign.'),
        fieldErrors: {},
      };
    }

    revalidatePath('/dashboard/sponsor');

    return {
      success: true,
      message: 'Campaign updated successfully.',
      error: null,
      fieldErrors: {},
    };
  } catch {
    return {
      success: false,
      message: null,
      error: 'Failed to update campaign.',
      fieldErrors: {},
    };
  }
}

export async function deleteCampaign(
  _prevState: DashboardActionState,
  formData: FormData
): Promise<DashboardActionState> {
  const id = String(formData.get('id') ?? '');
  if (!id) {
    return {
      success: false,
      message: null,
      error: 'Missing campaign id.',
      fieldErrors: {},
    };
  }

  try {
    const res = await fetch(`${API_URL}/api/campaigns/${id}`, {
      method: 'DELETE',
      headers: {
        cookie: await getCookieHeader(),
      },
    });

    if (!res.ok) {
      return {
        success: false,
        message: null,
        error: await readErrorMessage(res, 'Failed to delete campaign.'),
        fieldErrors: {},
      };
    }

    revalidatePath('/dashboard/sponsor');

    return {
      success: true,
      message: 'Campaign deleted successfully.',
      error: null,
      fieldErrors: {},
    };
  } catch {
    return {
      success: false,
      message: null,
      error: 'Failed to delete campaign.',
      fieldErrors: {},
    };
  }
}
