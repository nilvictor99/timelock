import * as React from 'react';
import { CalendarDays, Download, RotateCcw } from 'lucide-react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ChartCard } from '@/Components/stats/ChartCard';
import { StatsMetrics } from '@/Components/stats/StatsMetrics';
import { StatsFilters } from '@/Components/stats/StatsFilters';
import { CategoryPie } from '@/Components/stats/CategoryPie';
import { DailyLine } from '@/Components/stats/DailyLine';
import { TopActivitiesBar } from '@/Components/stats/TopActivitiesBar';
import { WeekdayComplianceBar } from '@/Components/stats/WeekdayComplianceBar';
import { RewardsPanel } from '@/Components/stats/RewardsPanel';
import { StreakPanel } from '@/Components/stats/StreakPanel';
import type { StatsSummary } from '@/Components/stats/types';
import { useI18n } from '@/lib/i18n';
import { apiGet } from '@/lib/api';

function endOfDay(date: Date) {
    const result = new Date(date);
    result.setHours(23, 59, 59, 999);
    return result;
}

function dateKey(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

export default function Stats() {
    const { t, locale } = useI18n();
    const [summary, setSummary] = React.useState<StatsSummary | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState('');
    const [rangeFrom, setRangeFrom] = React.useState(dateKey(new Date()));
    const [rangeTo, setRangeTo] = React.useState(dateKey(new Date()));
    const [selectedActivities, setSelectedActivities] = React.useState<string[]>([]);
    const [selectedCategories, setSelectedCategories] = React.useState<string[]>([]);

    const { from, to } = React.useMemo(() => {
        const start = new Date(`${rangeFrom}T00:00:00`);
        const end = new Date(`${rangeTo}T00:00:00`);
        return start <= end ? { from: start, to: endOfDay(end) } : { from: end, to: endOfDay(start) };
    }, [rangeFrom, rangeTo]);

    const [reloadKey, setReloadKey] = React.useState(0);
    React.useEffect(() => {
        let cancelled = false;
        setLoading(true);

        const params = new URLSearchParams({ from: dateKey(from), to: dateKey(to) });
        if (selectedActivities.length) params.set('activities', selectedActivities.join(','));
        if (selectedCategories.length) params.set('categories', selectedCategories.join(','));

        const timer = setTimeout(() => {
            apiGet<StatsSummary>(`/api/stats/summary?${params.toString()}`)
                .then((result) => {
                    if (cancelled) return;
                    setSummary(result);
                    setError('');
                })
                .catch((reason: unknown) => {
                    if (!cancelled) setError(reason instanceof Error ? reason.message : t('statsError'));
                })
                .finally(() => {
                    if (!cancelled) setLoading(false);
                });
        }, 150);

        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [from, to, selectedActivities, selectedCategories, reloadKey, t]);

    const hasData = Boolean(
        summary && (summary.kpis.completed > 0 || summary.kpis.rewardsRedeemed > 0 || summary.category.length > 0),
    );
    const exportQuery = `format=csv&from=${encodeURIComponent(dateKey(from))}&to=${encodeURIComponent(dateKey(to))}`;

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">{t('statsTitle')}</h2>
                    <p className="mt-1 text-muted-foreground">{t('statsSubtitle')}</p>
                </div>

                <StatsFilters
                    options={summary?.options ?? null}
                    rangeFrom={rangeFrom}
                    rangeTo={rangeTo}
                    selectedActivities={selectedActivities}
                    selectedCategories={selectedCategories}
                    onRangeFromChange={setRangeFrom}
                    onRangeToChange={setRangeTo}
                    onActivitiesChange={setSelectedActivities}
                    onCategoriesChange={setSelectedCategories}
                    onClearFilters={() => {
                        setSelectedActivities([]);
                        setSelectedCategories([]);
                    }}
                    t={t}
                />

                {error && !summary ? (
                    <Card>
                        <CardContent className="flex flex-col items-center gap-4 p-12 text-center">
                            <p className="text-sm text-danger">{error || t('statsError')}</p>
                            <Button variant="outline" onClick={() => setReloadKey((key) => key + 1)}>
                                <RotateCcw size={16} />
                                {t('statsRetry')}
                            </Button>
                        </CardContent>
                    </Card>
                ) : !summary ? (
                    <div className="grid gap-6 lg:grid-cols-2">
                        <StatsMetrics summary={null} t={t} />
                        {Array.from({ length: 4 }, (_, index) => (
                            <Skeleton key={index} className="h-80 w-full" />
                        ))}
                    </div>
                ) : !hasData ? (
                    <Card>
                        <CardContent className="p-12 text-center">
                            <CalendarDays className="mx-auto mb-4 text-muted-foreground" size={36} />
                            <p className="text-sm text-muted-foreground">{t('statsEmpty')}</p>
                        </CardContent>
                    </Card>
                ) : (
                    <>
                        <StatsMetrics summary={summary} loading={loading} t={t} />
                        <div className="grid gap-6 lg:grid-cols-2">
                            <ChartCard title={t('statsTimeByCategory')} loading={loading}>
                                <CategoryPie data={summary.category} t={t} />
                            </ChartCard>
                            <ChartCard title={t('statsDailyEvolution')} loading={loading}>
                                <DailyLine data={summary.daily} t={t} />
                            </ChartCard>
                            <ChartCard title={t('statsTopActivities')} loading={loading}>
                                <TopActivitiesBar data={summary.topActivities} />
                            </ChartCard>
                            <ChartCard title={t('statsComplianceByDay')} loading={loading}>
                                <WeekdayComplianceBar data={summary.weekday} t={t} />
                            </ChartCard>
                        </div>
                        <RewardsPanel rewards={summary.rewards} trend={summary.rewardTrend} loading={loading} locale={locale} t={t} />
                        <StreakPanel streak={summary.streak} loading={loading} t={t} />
                    </>
                )}

                <div className="flex flex-wrap gap-2">
                    <Button variant="outline" onClick={() => (window.location.href = `/api/export?${exportQuery}`)}>
                        <Download size={16} />
                        {t('statsExportCsv')}
                    </Button>
                    <Button variant="outline" onClick={() => window.print()}>
                        <Download size={16} />
                        {t('statsExportPdf')}
                    </Button>
                </div>
            </div>
        </DashboardLayout>
    );
}
