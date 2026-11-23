import { format, isValid } from 'date-fns';

export function formatSafeDate(date: any, formatStr: string = 'dd MMM yy', fallback: string = '---') {
    if (!date) return fallback;
    const d = new Date(date);
    return isValid(d) ? format(d, formatStr) : fallback;
}
