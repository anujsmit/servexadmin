// app/_lib/mistris-counts.ts
export const MISTRIS_COUNTS_GLOBAL_KEY = '/admin/mistris/counts';

/** Key for counts scoped by search (mistris table tabs). */
export function mistriCountsKey(search: string): string {
  const q = search.trim();
  return q ? `/admin/mistris/counts?search=${encodeURIComponent(q)}` : MISTRIS_COUNTS_GLOBAL_KEY;
}

/** Invalidate every mistri counts query (after approve / reject / etc.). */
export function mistriCountsMatcher(key: unknown): boolean {
  return typeof key === 'string' && key.startsWith('/admin/mistris/counts');
}

export type MistriCountsPayload = {
  success: boolean;
  counts: {
    all: number;
    pending: number;
    approved: number;
    rejected: number;
  };
};