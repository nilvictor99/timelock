import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { differenceInMilliseconds, format } from 'date-fns';
import { es } from 'date-fns/locale';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function toDateKey(date = new Date()) {
    return format(date, 'yyyy-MM-dd');
}

export function formatTime(date: string | Date) {
    return format(new Date(date), 'HH:mm', { locale: es });
}

export function minutesBetween(start: string | Date, end: string | Date) {
    return Math.max(
        0,
        Math.round(differenceInMilliseconds(new Date(end), new Date(start)) / 60_000),
    );
}