import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, isValid } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatSafeDate(date: any, formatStr: string = 'dd-MMM-yy', fallback: string = '---') {
    if (!date) return fallback;
    const d = new Date(date);
    return isValid(d) ? format(d, formatStr) : fallback;
}

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
