import * as React from 'react';
import { format } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { Clock } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';

export function LiveClock({ className }: { className?: string }) {
    const { locale } = useI18n();
    const [now, setNow] = React.useState(() => new Date());

    React.useEffect(() => {
        const id = window.setInterval(() => setNow(new Date()), 1000);
        return () => window.clearInterval(id);
    }, []);

    const dateLocale = locale === 'en' ? enUS : es;

    return (
        <div
            className={cn('flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-sm', className)}
            role="timer"
            aria-live="off"
        >
            <Clock size={15} className="shrink-0 text-info" aria-hidden="true" />
            <span className="tabular-nums font-medium">{format(now, 'HH:mm:ss')}</span>
            <span className="hidden capitalize text-xs text-muted-foreground md:inline">
                {format(now, 'EEE d MMM', { locale: dateLocale })}
            </span>
        </div>
    );
}
