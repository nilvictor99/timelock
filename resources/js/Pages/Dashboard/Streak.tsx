import * as React from 'react';
import { Flame } from 'lucide-react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/Card';
import { useI18n } from '@/lib/i18n';
import { apiGet } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { Bootstrap } from '@/types';

const MILESTONES = [3, 5, 7, 9, 11, 12, 15, 18, 21, 25];

export default function Streak() {
    const { t } = useI18n();
    const [data, setData] = React.useState<Bootstrap | null>(null);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        apiGet<Bootstrap>('/api/bootstrap')
            .then(setData)
            .catch((cause) => setError(cause instanceof Error ? cause.message : String(cause)));
    }, []);

    if (!data) {
        return (
            <DashboardLayout>
                <p className="text-sm text-muted-foreground">{error ?? t('dashboard.loading')}</p>
            </DashboardLayout>
        );
    }

    const current = data.user.currentStreak ?? 0;
    const best = data.user.bestStreak ?? 0;

    return (
        <DashboardLayout>
            <div className="mx-auto max-w-3xl space-y-6">
                <div className="text-center">
                    <div className="mx-auto mb-4 grid h-20 w-20 place-items-center rounded-full bg-orange-100 text-warning dark:bg-orange-950">
                        <Flame size={40} />
                    </div>
                    <h2 className="text-3xl font-bold">{t('streakCurrentDays').replace('{count}', String(current))}</h2>
                    <p className="mt-2 text-muted-foreground">
                        {t('streakBest').replace('{best}', String(best))}
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>{t('streakMilestones')}</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-3 md:grid-cols-5">
                        {MILESTONES.map((milestone) => {
                            const unlocked = current >= milestone;
                            return (
                                <div
                                    key={milestone}
                                    className={cn(
                                        'rounded-lg border p-4 text-center',
                                        unlocked && 'border-success bg-green-50 dark:bg-green-950/30',
                                    )}
                                >
                                    <div className="text-xl font-bold">{milestone}</div>
                                    <p className="text-xs text-muted-foreground">
                                        {unlocked ? t('streakUnlocked') : t('streakDaysToGo').replace('{left}', String(milestone - current))}
                                    </p>
                                </div>
                            );
                        })}
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}