import { CheckCircle2, Flame, Trophy } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { StatsSummary } from './types';
import type { Translator } from './format';

export function StreakPanel({
    streak,
    loading,
    t,
}: {
    streak: StatsSummary['streak'];
    loading?: boolean;
    t: Translator;
}) {
    if (loading && !streak.history.length) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>{t('statsChains')}</CardTitle>
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-40 w-full" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>{t('statsChains')}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid gap-4 sm:grid-cols-3">
                    <div className="rounded-lg bg-muted p-4">
                        <Flame className="mb-2 text-warning" size={20} />
                        <p className="text-xs text-muted-foreground">{t('statsCurrentStreak')}</p>
                        <strong className="text-2xl">{streak.current}</strong>
                    </div>
                    <div className="rounded-lg bg-muted p-4">
                        <Trophy className="mb-2 text-warning" size={20} />
                        <p className="text-xs text-muted-foreground">{t('statsLongestStreak')}</p>
                        <strong className="text-2xl">{streak.longest}</strong>
                    </div>
                    <div className="rounded-lg bg-muted p-4">
                        <CheckCircle2 className="mb-2 text-success" size={20} />
                        <p className="text-xs text-muted-foreground">{t('statsPerfectDays')}</p>
                        <strong className="text-2xl">{streak.perfectDays}</strong>
                    </div>
                </div>
                <div className="mt-5 flex flex-wrap gap-1" aria-label={t('statsChains')}>
                    {streak.history.map((day) => (
                        <span
                            key={day.date}
                            title={`${day.date}: ${day.total}`}
                            className={cn(
                                'h-4 w-4 rounded-sm border border-border',
                                day.completed ? 'bg-success' : day.total ? 'bg-warning/50' : 'bg-muted',
                            )}
                        />
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
