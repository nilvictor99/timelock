import { Link } from '@inertiajs/react';
import { Pause } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

export function PauseBanner({ reason }: { reason?: string | null }) {
    const { t } = useI18n();

    return (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-warning bg-orange-50 px-4 py-3 text-center text-sm text-orange-900 shadow-lg dark:bg-orange-950/90 dark:text-orange-100">
            <Pause className="mr-2 inline" size={16} /> {t('dashboard.pauseActive')}
            {reason ? `: ${reason}` : ''}.
            <Link className="ml-2 underline" href="/dashboard/settings">
                {t('navSettings')}
            </Link>
        </div>
    );
}