import { CheckCircle2, Clock3, Gift, Trophy } from 'lucide-react';
import { Metric } from '@/Components/dashboard/Metric';
import { Skeleton } from '@/components/ui/skeleton';
import type { StatsSummary } from './types';
import { formatDuration, type Translator } from './format';

export function StatsMetrics({
    summary,
    loading,
    t,
}: {
    summary: StatsSummary | null;
    loading?: boolean;
    t: Translator;
}) {
    if (!summary) {
        return (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {Array.from({ length: 4 }, (_, index) => (
                    <Skeleton key={index} className="h-28 w-full" />
                ))}
            </div>
        );
    }

    return (
        <div className={loading ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <Metric
                    title={t('statsTotalTime')}
                    value={formatDuration(summary.kpis.totalMinutes, t)}
                    detail={t('statsTotalTimeDetail')}
                    icon={<Clock3 className="text-info" size={18} />}
                />
                <Metric
                    title={t('statsCompletedActivities')}
                    value={String(summary.kpis.completed)}
                    detail={t('statsCompletedDetail')}
                    icon={<CheckCircle2 className="text-success" size={18} />}
                />
                <Metric
                    title={t('statsPointsEarned')}
                    value={String(summary.kpis.points)}
                    detail={t('statsPointsDetail')}
                    icon={<Trophy className="text-warning" size={18} />}
                />
                <Metric
                    title={t('statsRewardsRedeemed')}
                    value={String(summary.kpis.rewardsRedeemed)}
                    detail={t('statsRewardsDetail')}
                    icon={<Gift className="text-warning" size={18} />}
                />
            </div>
        </div>
    );
}
