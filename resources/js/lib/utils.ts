import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// formatSafeDate lives in lib/format-utils.ts to isolate date-fns from this core utils
// module and prevent Rollup from merging it with the recharts/d3 chunk.

export function resolveUrl(url: any): string {
    if (!url || typeof url !== 'string') return '';
    try {
        return new URL(url, typeof window !== 'undefined' ? window.location.origin : 'http://localhost').href;
    } catch {
        return url;
    }
}

export function isSameUrl(url1: any, url2: any): boolean {
    if (!url1 || !url2) return false;
    return resolveUrl(url1).split('?')[0].replace(/\/$/, '') === resolveUrl(url2).split('?')[0].replace(/\/$/, '');
}
