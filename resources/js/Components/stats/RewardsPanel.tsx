import { Gift } from 'lucide-react';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Empty } from '@/Components/dashboard/Empty';
import { chartVar } from '@/lib/charts';
import type { StatsSummary } from './types';
import type { Translator } from './format';

export function RewardsPanel({
    rewards,
    trend,
    loading,
    locale,
    t,
}: {
    rewards: StatsSummary['rewards'];
    trend: StatsSummary['rewardTrend'];
    loading?: boolean;
    locale: string;
    t: Translator;
}) {
    if (loading && !rewards.length) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>{t('statsRedeemedRewards')}</CardTitle>
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-32 w-full" />
                </CardContent>
            </Card>
        );
    }

    if (!rewards.length) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>{t('statsRedeemedRewards')}</CardTitle>
                </CardHeader>
                <CardContent>
                    <Empty text={t('statsNoRewards')} />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>{t('statsRedeemedRewards')}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="mb-4 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t('statsPointsSpent')}</span>
                    <strong>
                        {rewards.reduce((sum, reward) => sum + reward.cost, 0)} {t('statsPointsAbbrev')}
                    </strong>
                </div>
                <div className="grid gap-5 lg:grid-cols-[1fr_220px]">
                    <div className="space-y-2">
                        {rewards.map((reward) => (
                            <div key={reward.id} className="flex items-center justify-between rounded-lg border border-border p-3 text-sm">
                                <span className="flex items-center gap-2">
                                    <Gift size={16} className="text-warning" />
                                    {reward.title}
                                </span>
                                <span className="text-muted-foreground">
                                    {reward.redeemedAt ? new Date(reward.redeemedAt).toLocaleDateString(locale) : ''} ·{' '}
                                    {reward.cost} {t('statsPointsAbbrev')}
                                </span>
                            </div>
                        ))}
                    </div>
                    {trend.length > 0 && (
                        <div className="h-32">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={trend}>
                                    <XAxis dataKey="date" hide />
                                    <YAxis allowDecimals={false} width={24} />
                                    <Tooltip />
                                    <Bar dataKey="count" fill={chartVar(3)} radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
