import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { router } from '@inertiajs/react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';
import { apiGet } from '@/lib/api';
import { cn, toDateKey } from '@/lib/utils';
import type { Activity, Bootstrap } from '@/types';

const calendarMonthFormatter = new Intl.DateTimeFormat('es', { month: 'long', year: 'numeric' });
const calendarDayFormatter = new Intl.DateTimeFormat('es', { weekday: 'short', day: 'numeric' });

type ViewMode = 'day' | 'week' | 'month';

export default function Calendar() {
    const { t } = useI18n();
    const [data, setData] = React.useState<Bootstrap | null>(null);
    const [error, setError] = React.useState<string | null>(null);
    const [date, setDate] = React.useState(toDateKey());
    const [view, setView] = React.useState<ViewMode>('week');

    const load = React.useCallback(() => {
        apiGet<Bootstrap>('/api/bootstrap')
            .then(setData)
            .catch((cause) => setError(cause instanceof Error ? cause.message : String(cause)));
    }, []);

    React.useEffect(load, [load]);

    if (!data) {
        return (
            <DashboardLayout active="calendar">
                <p className="text-sm text-muted-foreground">{error ?? t('dashboard.loading')}</p>
            </DashboardLayout>
        );
    }

    const { activities } = data;
    const anchor = new Date(`${date}T12:00:00`);

    const shift = (amount: number) => {
        const next = new Date(anchor);
        next.setDate(next.getDate() + (view === 'month' ? amount * 30 : view === 'week' ? amount * 7 : amount));
        setDate(toDateKey(next));
    };

    const weekStart = new Date(anchor);
    weekStart.setDate(anchor.getDate() - ((anchor.getDay() + 6) % 7));

    const days = Array.from({ length: view === 'month' ? 35 : view === 'week' ? 7 : 1 }, (_, index) => {
        const d = new Date(view === 'month' ? new Date(anchor.getFullYear(), anchor.getMonth(), 1) : weekStart);
        d.setDate(d.getDate() + index);
        return d;
    });

    const title = calendarMonthFormatter.format(anchor);

    return (
        <DashboardLayout active="calendar">
            <div className="space-y-6">
                <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                        <h2 className="text-2xl font-bold">{t('calendarTitle')}</h2>
                        <p className="text-sm text-muted-foreground">{title}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => shift(-1)} aria-label="prev">
                            <ChevronLeft size={15} />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setDate(toDateKey(new Date()))}>
                            {t('calendarToday')}
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => shift(1)} aria-label="next">
                            <ChevronRight size={15} />
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => router.get('/dashboard/activities')}
                        >
                            {t('calendarManage')}
                        </Button>
                    </div>
                </div>

                {error && <p className="rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm text-danger">{error}</p>}

                <div className="flex gap-1 rounded-lg border border-border p-1">
                    {(['day', 'week', 'month'] as const).map((item) => (
                        <button
                            key={item}
                            onClick={() => setView(item)}
                            className={cn(
                                'flex-1 rounded-md px-3 py-2 text-sm',
                                view === item && 'bg-foreground text-background',
                            )}
                        >
                            {item === 'day' ? t('calendarDay') : item === 'week' ? t('calendarWeek') : t('calendarMonth')}
                        </button>
                    ))}
                </div>

                <div
                    className={cn(
                        'grid gap-2',
                        view === 'day' ? 'grid-cols-1' : view === 'week' ? 'md:grid-cols-7' : 'grid-cols-5',
                    )}
                >
                    {days.map((d) => {
                        const key = toDateKey(d);
                        const items = activities.filter(
                            (a: Activity) => toDateKey(new Date(a.startAt)) === key,
                        );
                        return (
                            <button
                                key={`${key}-${d.getTime()}`}
                                onClick={() => setDate(key)}
                                className={cn(
                                    'min-h-28 rounded-xl border border-border p-3 text-left hover:bg-muted',
                                    date === key && 'border-foreground',
                                    view === 'month' && d.getMonth() !== anchor.getMonth() && 'opacity-40',
                                )}
                            >
                                <p className="text-xs text-muted-foreground">{calendarDayFormatter.format(d)}</p>
                                <div className="mt-2 space-y-1">
                                    {items.map((a) => (
                                        <div
                                            key={a.id}
                                            className={cn(
                                                'truncate rounded px-2 py-1 text-xs',
                                                a.status === 'COMPLETED'
                                                    ? 'bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-200'
                                                    : 'bg-muted',
                                            )}
                                            style={{ borderLeft: `3px solid ${a.category?.color ?? '#888'}` }}
                                        >
                                            {a.title}
                                        </div>
                                    ))}
                                    {!items.length && view !== 'month' && (
                                        <span className="text-xs text-muted-foreground">{t('calendarNone')}</span>
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>
        </DashboardLayout>
    );
}