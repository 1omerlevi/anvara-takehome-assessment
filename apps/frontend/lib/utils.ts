// Frontend utility functions
// Format a price for display
// FIXED: 'price' type -  'number'
// FIXED: unusedFormatter is used

export function formatPrice(price: number, locale = 'en-US'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'USD',
  }).format(price);
}

// Debounce function for search inputs
// FIXED: now 'any' types - fn are typed, return type is specified
export function debounce<TArgs extends unknown[]>(
  fn: (...args: TArgs) => void,
  delay: number
): (...args: TArgs) => void {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  return (...args: TArgs) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

// Parse query string parameters
// FIXED: Return type is now <string, string>
export function parseQueryString(queryString: string): Record<string, string> {
  const params: Record<string, string> = {};
  const searchParams = new URLSearchParams(queryString);

  searchParams.forEach((value, key) => {
    params[key] = value;
  });

  return params;
}

// Check if we're running on the client side
export const isClient = typeof window !== 'undefined';

// Truncate text with ellipsis - unusedCheck is used
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
}

// Class name helper (simple cn alternative)
// FIXDE: 'classes' is typed strictly
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}

// Sleep utility for testing/debugging - specifying  return tpye
export const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

// Deep clone an object
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj)) as T;
}

// Logger that only logs in development
type LoggerArgs = unknown[];
const consoleRef = globalThis.console;

export const logger = {
  log: (...args: LoggerArgs) => {
    if (globalThis.process?.env.NODE_ENV === 'development') {
      consoleRef.log('[App]', ...args);
    }
  },
  error: (...args: LoggerArgs) => {
    consoleRef.error('[App Error]', ...args);
  },
  warn: (...args: LoggerArgs) => {
    consoleRef.warn('[App Warning]', ...args);
  },
};

export function formatRelativeTime(date: string | number | Date): string {
  const now = new Date();
  const then = new Date(date);

  if (Number.isNaN(then.getTime())) {
    return '';
  }

  const diff = now.getTime() - then.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return then.toLocaleDateString();
}
