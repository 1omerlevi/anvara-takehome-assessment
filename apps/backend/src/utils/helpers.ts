// Utility helpers for the API

type QueryValue = string | string[] | undefined;
type QueryParams = Record<string, QueryValue>;

// Helper to safely extract route/query params
export function getParam(param: unknown): string {
  if (typeof param === 'string') return param;
  if (Array.isArray(param) && typeof param[0] === 'string') return param[0];
  return '';
}

// Helper to format currency values
export function formatCurrency(amount: number, currency = 'USD'): string {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  });

  return formatter.format(amount);
}

// Helper to calculate percentage change
export function calculatePercentChange(oldValue: number, newValue: number): number {
  if (oldValue === 0) return newValue > 0 ? 100 : 0;
  return ((newValue - oldValue) / oldValue) * 100;
}

// Parse pagination params from query
export function parsePagination(query: QueryParams) {
  const pageValue = Array.isArray(query.page) ? query.page[0] : query.page;
  const limitValue = Array.isArray(query.limit) ? query.limit[0] : query.limit;

  const page = Number.parseInt(pageValue ?? '1', 10) || 1;
  const limit = Number.parseInt(limitValue ?? '10', 10) || 10;
  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

// Validate email format
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Helper to build filter object from query params
export function buildFilters(query: QueryParams, allowedFields: string[]): Record<string, string | string[]> {
  const filters: Record<string, string | string[]> = {};

  for (const field of allowedFields) {
    const value = query[field];
    if (value !== undefined) {
      filters[field] = value;
    }
  }

  return filters;
}

export function clampValue(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function formatDate(date: string | number | Date): string {
  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) {
    return '';
  }

  return parsedDate.toLocaleDateString();
}
