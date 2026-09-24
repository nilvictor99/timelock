import type { useI18n } from '@/lib/i18n';

export type Translator = ReturnType<typeof useI18n>['t'];

export function formatDuration(minutes: number, t: Translator): string {
    const hours = Math.floor(minutes / 60);
    const rest = Math.round(minutes % 60);
    if (!hours) return `${rest} ${t('statsMinutes')}`;
    return `${hours} ${t('statsHours')} ${rest} ${t('statsMinutes')}`;
}
