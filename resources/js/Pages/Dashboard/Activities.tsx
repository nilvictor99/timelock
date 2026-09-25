import * as React from 'react';
import { Check, Plus, Trash2 } from 'lucide-react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ActivityForm } from '@/Components/dashboard/ActivityForm';
import { Empty } from '@/Components/dashboard/Empty';
import { useI18n } from '@/lib/i18n';
import { apiDelete, apiGet, apiPatch } from '@/lib/api';
import { formatTime, toDateKey } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { Activity, Bootstrap } from '@/types';

export default function Activities() {
    const { t } = useI18n();
    const [data, setData] = React.useState<Bootstrap | null>(null);
    const [error, setError] = React.useState<string | null>(null);
    const [date, setDate] = React.useState(toDateKey());
    const [showForm, setShowForm] = React.useState(false);

    const load = React.useCallback(() => {
        apiGet<Bootstrap>('/api/bootstrap')
            .then(setData)
            .catch((cause) => setError(cause instanceof Error ? cause.message : String(cause)));
    }, []);

    React.useEffect(load, [load]);

    if (!data) {
        return (
            <DashboardLayout active="activities">
                <p className="text-sm text-muted-foreground">{error ?? t('dashboard.loading')}</p>
            </DashboardLayout>
        );
    }

    const { user, activities, categories } = data;
    const dayActivities = activities
        .filter((a) => toDateKey(new Date(a.startAt)) === date)
        .sort((a, b) => a.startAt.localeCompare(b.startAt));

    async function markDone(activity: Activity) {
        await apiPatch('/api/bootstrap', { id: activity.id, status: 'COMPLETED' });
        load();
    }

    async function deleteActivity(id: string) {
        await apiDelete(`/api/bootstrap?id=${id}`);
        load();
    }

    return (
        <DashboardLayout active="activities">
            <div className="space-y-5">
                <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                        <h2 className="text-2xl font-bold">{t('navActivities')}</h2>
                        <p className="text-sm text-muted-foreground">
                            {user.operationMode === 'FREE' ? t('actSubtitleFree') : t('actSubtitleSync')}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <input
                            type="date"
                            value={date}
                            onChange={(event) => setDate(event.target.value)}
                            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                        />
                        <Button onClick={() => setShowForm(true)}>
                            <Plus size={16} /> {t('actAdd')}
                        </Button>
                    </div>
                </div>

                {error && <p className="rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm text-danger">{error}</p>}

                <Card>
                    <CardHeader>
                        <CardTitle>{t('calendarActivityDay')} {date}</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-3">
                        {dayActivities.length ? (
                            dayActivities.map((activity) => (
                                <div
                                    key={activity.id}
                                    className="flex items-center gap-4 rounded-xl border border-border bg-card p-4"
                                >
                                    <div
                                        className="h-12 w-1 rounded-full"
                                        style={{ backgroundColor: activity.category?.color ?? '#888' }}
                                    />
                                    <div className="flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h3
                                                className={cn(
                                                    'font-semibold',
                                                    activity.status === 'COMPLETED' && 'line-through opacity-60',
                                                )}
                                            >
                                                {activity.title}
                                            </h3>
                                            <Badge>
                                                {activity.points} {t('dashboard.pts')}
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            {formatTime(activity.startAt)} – {formatTime(activity.endAt)} ·{' '}
                                            {activity.category?.name ?? t('actNotScheduled')}
                                        </p>
                                        {activity.description && <p className="mt-1 text-sm">{activity.description}</p>}
                                    </div>
                                    <div className="flex gap-2">
                                        {activity.status !== 'COMPLETED' && (
                                            <Button size="sm" onClick={() => markDone(activity)}>
                                                <Check size={15} /> {t('actDone')}
                                            </Button>
                                        )}
                                        <Button variant="ghost" size="sm" onClick={() => deleteActivity(activity.id)} aria-label={t('actDelete')}>
                                            <Trash2 size={15} className="text-danger" />
                                        </Button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <Empty text={t('actNone').replace('{date}', date)} />
                        )}
                    </CardContent>
                </Card>

                <div className="flex flex-wrap gap-2">
                    {categories.map((category) => (
                        <Badge key={category.id}>
                            <span
                                className="mr-1 inline-block h-2 w-2 rounded-full"
                                style={{ backgroundColor: category.color }}
                            />
                            {category.name}: {category.pointsPerHour} {t('dashboard.pph')}
                        </Badge>
                    ))}
                </div>
            </div>

            {showForm && (
                <ActivityForm
                    categories={categories}
                    defaultDate={date}
                    mode={user.operationMode}
                    onClose={() => setShowForm(false)}
                    onCreated={() => {
                        setShowForm(false);
                        load();
                    }}
                />
            )}
        </DashboardLayout>
    );
}