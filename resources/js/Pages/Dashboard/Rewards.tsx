import * as React from 'react';
import { Gift } from 'lucide-react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Card, CardContent } from '@/Components/ui/Card';
import { Button } from '@/Components/ui/Button';
import { Empty } from '@/Components/dashboard/Empty';
import { Toast } from '@/Components/dashboard/Toast';
import { useI18n } from '@/lib/i18n';
import { apiGet, apiPatch } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { Bootstrap } from '@/types';

export default function Rewards() {
    const { t } = useI18n();
    const [data, setData] = React.useState<Bootstrap | null>(null);
    const [error, setError] = React.useState<string | null>(null);
    const [toast, setToast] = React.useState('');
    const [redeeming, setRedeeming] = React.useState<string | null>(null);

    const notify = (message: string) => setToast(message);

    const load = React.useCallback(() => {
        apiGet<Bootstrap>('/api/bootstrap')
            .then(setData)
            .catch((cause) => setError(cause instanceof Error ? cause.message : String(cause)));
    }, []);

    React.useEffect(load, [load]);
    React.useEffect(() => {
        if (!toast) return;
        const id = window.setTimeout(() => setToast(''), 3200);
        return () => window.clearTimeout(id);
    }, [toast]);

    if (!data) {
        return (
            <DashboardLayout>
                <p className="text-sm text-muted-foreground">{error ?? t('dashboard.loading')}</p>
            </DashboardLayout>
        );
    }

    const { user, rewards } = data;

    async function redeem(rewardId: string) {
        setRedeeming(rewardId);
        try {
            await apiPatch(`/api/rewards/${rewardId}`, {});
            notify(t('rewardMarked'));
            load();
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : String(cause));
        } finally {
            setRedeeming(null);
        }
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-bold">{t('rewardsTitle')}</h2>
                    <p className="text-sm text-muted-foreground">{t('rewardsSubtitle')}</p>
                </div>

                {error && <p className="rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm text-danger">{error}</p>}

                {rewards.length === 0 ? (
                    <Empty text={t('suggestionEmpty')} />
                ) : (
                    <div className="grid gap-4 md:grid-cols-3">
                        {rewards.map((reward) => {
                            const redeemed = Boolean(reward.redeemedAt);
                            const canAfford = (user.points ?? 0) >= reward.cost;
                            return (
                                <Card key={reward.id}>
                                    <CardContent className="p-5">
                                        <Gift className={cn('mb-4', redeemed ? 'text-muted-foreground' : 'text-warning')} />
                                        <h3 className="font-semibold">{reward.title}</h3>
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            {reward.description ?? t('rewardCustom')}
                                        </p>
                                        {redeemed && (
                                            <p className="mt-2 text-xs text-success">
                                                {t('rewardRedeemed')} · {reward.redeemedAt?.slice(0, 10)}
                                            </p>
                                        )}
                                        <div className="mt-5 flex items-center justify-between">
                                            <span className="font-bold">
                                                {redeemed ? '' : `${reward.cost} pts`}
                                            </span>
                                            <Button
                                                size="sm"
                                                variant={redeemed ? 'outline' : 'default'}
                                                disabled={redeemed || !canAfford || redeeming === reward.id}
                                                onClick={() => void redeem(reward.id)}
                                            >
                                                {redeemed ? t('rewardRedeemed') : t('rewardRedeem')}
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>

            {toast && <Toast message={toast} />}
        </DashboardLayout>
    );
}