import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { router } from '@inertiajs/react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';
import { apiGet } from '@/lib/api';
import { cn, formatTime, toDateKey } from '@/lib/utils';
import type { Activity, Bootstrap } from '@/types';

type ViewMode = 'day' | 'week' | 'month';

const REFERENCE_MONDAY = new Date(2026, 8, 21);

function startOfWeek(date: Date) {
    const result = new Date(date);
    result.setDate(result.getDate() - ((result.getDay() + 6) % 7));
    return result;
}

function addDays(date: Date, amount: number) {
    const result = new Date(date);
    result.setDate(result.getDate() + amount);
    return result;
}

function addMonthsClamped(date: Date, amount: number) {
    const day = date.getDate();
    const result = new Date(date.getFullYear(), date.getMonth(), 1);
    result.setMonth(result.getMonth() + amount);
    const lastDay = new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate();
    result.setDate(Math.min(day, lastDay));
    return result;
}

export default function Calendar() {
    const { t, locale } = useI18n();
    const [data, setData] = React.useState<Bootstrap | null>(null);
    const [error, setError] = React.useState<string | null>(null);
    const [todayKey, setTodayKey] = React.useState<string | null>(null);
    const [selected, setSelected] = React.useState<string | null>(null);
    const [view, setView] = React.useState<ViewMode>('day');

    const load = React.useCallback(() => {
        apiGet<Bootstrap>('/api/bootstrap')
            .then((payload) => {
                setData(payload);
                setTodayKey(payload.today ?? toDateKey());
                setError(null);
            })
            .catch((cause) => setError(cause instanceof Error ? cause.message : String(cause)));
    }, []);

    React.useEffect(load, [load]);
    React.useEffect(() => {
        const id = window.setInterval(load, 60_000);
        return () => window.clearInterval(id);
    }, [load]);

    const formatters = React.useMemo(
        () => ({
            day: new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
            range: new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' }),
            month: new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }),
            cell: new Intl.DateTimeFormat(locale, { weekday: 'short', day: 'numeric' }),
            cellDay: new Intl.DateTimeFormat(locale, { day: 'numeric' }),
            weekday: new Intl.DateTimeFormat(locale, { weekday: 'short' }),
        }),
        [locale],
    );

    if (!data || !todayKey) {
        return (
            <DashboardLayout active="calendar">
                <p className="text-sm text-muted-foreground">{error ?? t('dashboard.loading')}</p>
            </DashboardLayout>
        );
    }

    const { activities } = data;
    const anchorKey = selected ?? todayKey;
    const anchor = new Date(`${anchorKey}T12:00:00`);
    const weekStart = startOfWeek(anchor);

    const days =
        view === 'day'
            ? [anchor]
            : view === 'week'
              ? Array.from({ length: 7 }, (_, index) => addDays(weekStart, index))
              : (() => {
                    const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
                    const gridStart = startOfWeek(first);
                    const offset = Math.round((first.getTime() - gridStart.getTime()) / 86_400_000);
                    const daysInMonth = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0).getDate();
                    const weeks = Math.ceil((offset + daysInMonth) / 7);
                    return Array.from({ length: weeks * 7 }, (_, index) => addDays(gridStart, index));
                })();

    const title =
        view === 'day'
            ? formatters.day.format(anchor)
            : view === 'week'
              ? `${formatters.range.format(weekStart)} – ${formatters.range.format(addDays(weekStart, 6))}`
              : formatters.month.format(anchor);

    const shift = (amount: number) => {
        const next =
            view === 'month'
                ? addMonthsClamped(anchor, amount)
                : view === 'week'
                  ? addDays(anchor, amount * 7)
                  : addDays(anchor, amount);
        setSelected(toDateKey(next));
    };

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
                        <Button variant="outline" size="sm" onClick={() => setSelected(null)}>
                            {t('calendarToday')}
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => shift(1)} aria-label="next">
                            <ChevronRight size={15} />
                        </Button>
                        <Button variant="outline" onClick={() => router.get('/dashboard/activities')}>
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

                {view === 'month' && (
                    <div className="grid grid-cols-7 gap-2">
                        {Array.from({ length: 7 }, (_, index) => (
                            <p key={index} className="text-center text-xs text-muted-foreground">
                                {formatters.weekday.format(addDays(REFERENCE_MONDAY, index))}
                            </p>
                        ))}
                    </div>
                )}

                <div
                    className={cn(
                        'grid gap-2',
                        view === 'day' ? 'grid-cols-1' : view === 'week' ? 'md:grid-cols-7' : 'grid-cols-7',
                    )}
                >
                    {days.map((d) => {
                        const key = toDateKey(d);
                        const items = activities.filter((a: Activity) => (a.date ?? '').slice(0, 10) === key);
                        const isToday = key === todayKey;
                        const isSelected = key === anchorKey;
                        const isOtherMonth = view === 'month' && d.getMonth() !== anchor.getMonth();

                        return (
                            <button
                                key={key}
                                onClick={() => setSelected(key)}
                                className={cn(
                                    'min-h-24 rounded-lg border p-3 text-left transition-colors hover:bg-muted',
                                    isSelected ? 'border-foreground' : 'border-border',
                                    isToday && 'ring-2 ring-primary/40',
                                    isOtherMonth && 'opacity-40',
                                    view === 'day' && 'min-h-48',
                                )}
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <p className={cn('text-xs text-muted-foreground', isToday && 'font-semibold text-foreground')}>
                                        {view === 'month' ? formatters.cellDay.format(d) : formatters.cell.format(d)}
                                    </p>
                                    {isToday && <Badge variant="success">{t('calendarToday')}</Badge>}
                                </div>
                                <div className="mt-2 space-y-1">
                                    {items.map((a) => (
                                        <div
                                            key={a.id}
                                            className={cn(
                                                'rounded px-2 py-1 text-xs',
                                                a.status === 'COMPLETED' ? 'bg-success/15 text-success' : 'bg-muted',
                                                view === 'day' ? '' : 'truncate',
                                            )}
                                            style={{ borderLeft: `3px solid ${a.category?.color ?? 'var(--color-border)'}` }}
                                        >
                                            {view === 'day' ? `${formatTime(a.startAt)} · ${a.title}` : a.title}
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
