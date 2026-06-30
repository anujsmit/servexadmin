// _lib/mistris-counts.ts

import { api } from './api';

export interface MistriCounts {
  all: number;
  pending: number;
  approved: number;
  rejected: number;
}

export interface MistriCountsPayload {
  success: boolean;
  counts: MistriCounts;
}

export function mistriCountsKey(search?: string): string {
  const base = '/admin/mistris/counts';
  if (search) {
    return `${base}?search=${encodeURIComponent(search)}`;
  }
  return base;
}

export const mistriCountsMatcher = /^\/admin\/mistris\/counts(\?.*)?$/;

export async function fetchMistriCounts(search?: string): Promise<MistriCounts> {
  const response = await api.get<MistriCountsPayload>(mistriCountsKey(search));
  return response.counts;
}