import * as React from 'react';
import { router } from '@inertiajs/react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Badge } from '@/Components/ui/Badge';
import { Button } from '@/Components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/Card';
import { Input } from '@/Components/ui/Input';
import { useI18n } from '@/lib/i18n';
import { apiGet, apiPost, apiPatch, apiDelete } from '@/lib/api';
import { formatTime } from '@/lib/utils';
import type { Bootstrap } from '@/types';

export default function Index() {
    const { t } = useI18n();
    const [data, setData] = React.useState<Bootstrap | null>(null);
    const [error, setError] = React.useState<string | null>(null);

    const [title, setTitle] = React.useState('');
    const [categoryId, setCategoryId] = React.useState('');
    const [startAt, setStartAt] = React.useState(
        new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16),
    );
    const [endAt, setEndAt] = React.useState(
        new Date(Date.now() - new Date().getTimezoneOffset() * 60000 + 3600000).toISOString().slice(0, 16),
    );
    const [rewardTitle, setRewardTitle] = React.useState('');
    const [rewardCost, setRewardCost] = React.useState('');
    const [saving, setSaving] = React.useState(false);

    const load = React.useCallback(() => {
        apiGet<Bootstrap>('/api/bootstrap')
            .then(setData)
            .catch((cause) => setError(cause instanceof Error ? cause.message : String(cause)));
    }, []);

    React.useEffect(load, [load]);

    async function createActivity(event: React.FormEvent) {
        event.preventDefault();
        setSaving(true);
        setError(null);
        try {
            await apiPost('/api/bootstrap', {
                action: 'activity',
                title,
                categoryId,
                startAt: new Date(startAt).toISOString(),
                endAt: new Date(endAt).toISOString(),
            });
            setTitle('');
            load();
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : String(cause));
        } finally {
            setSaving(false);
        }
    }

    async function createReward(event: React.FormEvent) {
        event.preventDefault();
        setSaving(true);
        setError(null);
        try {
            await apiPost('/api/bootstrap', {
                action: 'reward',
                title: rewardTitle,
                cost: rewardCost,
            });
            setRewardTitle('');
            setRewardCost('');
            load();
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : String(cause));
        } finally {
            setSaving(false);
        }
    }

    if (!data) {
        return (
            <DashboardLayout>
                <p className="text-muted-foreground">{t('dashboard.loading')}</p>
            </DashboardLayout>
        );
    }

    const { user, activities, categories, rewards, today } = data;
    const todayActivities = activities
        .filter((activity) => activity.date === today)
        .sort((a, b) => a.startAt.localeCompare(b.startAt));

    return (
        <DashboardLayout>
            <div className="space-y-4">
                {user.pauseActive && (
                    <div className="rounded-xl border border-warning bg-orange-50 p-3 text-sm dark:bg-orange-950/90">
                        {t('dashboard.pauseActive')}: {user.pauseReason ?? ''}{' '}
                        {user.pauseEndsAt ? `· ${t('dashboard.resumes')} ${formatTime(user.pauseEndsAt)}` : ''}
                    </div>
                )}

                <section className="grid gap-3 sm:grid-cols-3">
                    <Card>
                        <CardContent className="pt-5">
                            <p className="text-sm text-muted-foreground">{t('dashboard.points')}</p>
                            <p className="text-2xl font-semibold">{user.points}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-5">
                            <p className="text-sm text-muted-foreground">{t('dashboard.streak')}</p>
                            <p className="text-2xl font-semibold">{user.currentStreak ?? 0}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-5">
                            <p className="text-sm text-muted-foreground">{t('dashboard.activitiesToday')}</p>
                            <p className="text-2xl font-semibold">
                                {todayActivities.filter((a) => a.status === 'COMPLETED').length}/{todayActivities.length}
                            </p>
                        </CardContent>
                    </Card>
                </section>

                {error && <p className="rounded-lg bg-danger/10 p-3 text-sm text-danger">{error}</p>}

                <Card>
                    <CardHeader>
                        <CardTitle>{t('dashboard.addActivity')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={createActivity} className="space-y-3">
                            <Input
                                placeholder={t('dashboard.activityTitle')}
                                value={title}
                                onChange={(event) => setTitle(event.target.value)}
                                required
                            />
                            <select
                                value={categoryId}
                                onChange={(event) => setCategoryId(event.target.value)}
                                required
                                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                            >
                                <option value="">{t('dashboard.selectCategory')}</option>
                                {categories.map((category) => (
                                    <option key={category.id} value={category.id}>
                                        {category.name} · {category.pointsPerHour} {t('dashboard.pph')}
                                    </option>
                                ))}
                            </select>
                            <div className="grid grid-cols-2 gap-3">
                                <Input
                                    type="datetime-local"
                                    value={startAt}
                                    onChange={(event) => setStartAt(event.target.value)}
                                    required
                                />
                                <Input
                                    type="datetime-local"
                                    value={endAt}
                                    onChange={(event) => setEndAt(event.target.value)}
                                    required
                                />
                            </div>
                            <Button type="submit" disabled={saving}>
                                {t('dashboard.save')}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>
                            {t('dashboard.today')} · {today}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {todayActivities.length === 0 && (
                            <p className="text-sm text-muted-foreground">{t('dashboard.noActivities')}</p>
                        )}
                        {todayActivities.map((activity) => (
                            <div
                                key={activity.id}
                                className="flex items-center gap-3 rounded-lg border border-border p-3"
                            >
                                <div className="min-w-0 flex-1">
                                    <p className="truncate font-medium">
                                        {activity.status === 'COMPLETED' ? (
                                            <span className="line-through opacity-60">{activity.title}</span>
                                        ) : (
                                            activity.title
                                        )}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {formatTime(activity.startAt)}–{formatTime(activity.endAt)} ·{' '}
                                        {activity.category?.name ?? t('dashboard.free')} · +{activity.points} {t('dashboard.pts')}
                                    </p>
                                </div>
                                {activity.status !== 'COMPLETED' ? (
                                    <Button
                                        size="sm"
                                        onClick={() =>
                                            apiPatch('/api/bootstrap', {
                                                id: activity.id,
                                                status: 'COMPLETED',
                                            }).then(load)
                                        }
                                    >
                                        {t('dashboard.complete')}
                                    </Button>
                                ) : (
                                    <Badge variant="success">{t('dashboard.completed')}</Badge>
                                )}
                                <Button
                                    size="sm"
                                    variant="danger"
                                    onClick={() =>
                                        apiDelete('/api/bootstrap?id=' + activity.id).then(load)
                                    }
                                >
                                    {t('dashboard.delete')}
                                </Button>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>{t('dashboard.rewards')}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <form onSubmit={createReward} className="flex gap-3">
                            <Input
                                placeholder={t('dashboard.rewardTitle')}
                                value={rewardTitle}
                                onChange={(event) => setRewardTitle(event.target.value)}
                                required
                            />
                            <Input
                                type="number"
                                min={1}
                                placeholder={t('dashboard.rewardCost')}
                                value={rewardCost}
                                onChange={(event) => setRewardCost(event.target.value)}
                                required
                                className="w-28"
                            />
                            <Button type="submit" disabled={saving}>
                                {t('dashboard.save')}
                            </Button>
                        </form>
                        {rewards.map((reward) => (
                            <div
                                key={reward.id}
                                className="flex items-center justify-between rounded-lg border border-border p-3 text-sm"
                            >
                                <span>{reward.title}</span>
                                <Badge>
                                    {reward.cost} {t('dashboard.pts')}
                                </Badge>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                <div className="flex justify-end">
                    <Button variant="ghost" size="sm" onClick={() => router.reload()}>
                        {t('dashboard.refresh')}
                    </Button>
                </div>
            </div>
        </DashboardLayout>
    );
}