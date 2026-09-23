import * as React from 'react';
import { ChevronRight, Clock3, Flame, Play, Plus, Target, Trophy } from 'lucide-react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import ActivitiesView from '@/Pages/Dashboard/Activities';
import RewardsView from '@/Pages/Dashboard/Rewards';
import SuggestionsView from '@/Pages/Dashboard/Suggestions';
import StreakView from '@/Pages/Dashboard/Streak';
import ExportView from '@/Pages/Dashboard/Export';
import CalendarView from '@/Pages/Dashboard/Calendar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ActivityForm } from '@/Components/dashboard/ActivityForm';
import { ActivityRow } from '@/Components/dashboard/ActivityRow';
import { Empty } from '@/Components/dashboard/Empty';
import { FloatingTimer } from '@/Components/dashboard/FloatingTimer';
import { Metric } from '@/Components/dashboard/Metric';
import { PauseBanner } from '@/Components/dashboard/PauseBanner';
import { Toast } from '@/Components/dashboard/Toast';
import { useI18n } from '@/lib/i18n';
import { isTabId, type NavId } from '@/lib/navigation';
import { apiGet, apiPatch } from '@/lib/api';
import { formatTime, minutesBetween, toDateKey } from '@/lib/utils';
import type { Activity, Bootstrap } from '@/types';

function initialTab(): NavId {
    try {
        const value = new URLSearchParams(window.location.search).get('tab');
        if (isTabId(value)) return value;
    } catch {
        // ignore
    }
    return 'home';
}

export default function Index() {
    const { t } = useI18n();
    const [tab, setTab] = React.useState<NavId>(initialTab);
    const [data, setData] = React.useState<Bootstrap | null>(null);
    const [error, setError] = React.useState<string | null>(null);
    const [activeTimer, setActiveTimer] = React.useState<Activity | null>(null);
    const [timerPaused, setTimerPaused] = React.useState(false);
    const [now, setNow] = React.useState(new Date());
    const [showForm, setShowForm] = React.useState(false);
    const [toast, setToast] = React.useState('');

    const notify = (message: string) => setToast(message);

    const load = React.useCallback(() => {
        apiGet<Bootstrap>('/api/bootstrap')
            .then(setData)
            .catch((cause) => setError(cause instanceof Error ? cause.message : String(cause)));
    }, []);

    React.useEffect(load, [load]);
    React.useEffect(() => {
        const id = window.setInterval(() => setNow(new Date()), 1000);
        return () => window.clearInterval(id);
    }, []);
    React.useEffect(() => {
        if (!toast) return;
        const id = window.setTimeout(() => setToast(''), 3000);
        return () => window.clearTimeout(id);
    }, [toast]);

    if (!data) {
        return (
            <DashboardLayout active={tab} onTabChange={setTab}>
                <p className="text-sm text-muted-foreground">{error ?? t('dashboard.loading')}</p>
            </DashboardLayout>
        );
    }

    const { user, activities, categories, today } = data;
    const todayActivities = activities
        .filter((a) => toDateKey(new Date(a.startAt)) === today && !user.pauseActive)
        .sort((a, b) => a.startAt.localeCompare(b.startAt));
    if (user.pauseActive) todayActivities.length = 0;

    const completed = todayActivities.filter((a) => a.status === 'COMPLETED').length;
    const totalMinutes = todayActivities.reduce((sum, a) => sum + minutesBetween(a.startAt, a.endAt), 0);
    const completedMinutes = todayActivities
        .filter((a) => a.status === 'COMPLETED')
        .reduce((sum, a) => sum + minutesBetween(a.startAt, a.endAt), 0);
    const progress = todayActivities.length ? Math.round((completed / todayActivities.length) * 100) : 0;
    const current =
        user.operationMode === 'FREE'
            ? activities.find((a) => a.status === 'PLANNED')
            : activities.find(
                  (a) => new Date(a.startAt) <= now && new Date(a.endAt) > now && a.status === 'PLANNED',
              );
    const timerSeconds =
        activeTimer && !timerPaused
            ? user.operationMode === 'FREE'
                ? Math.max(0, Math.floor((now.getTime() - new Date(activeTimer.startAt).getTime()) / 1000))
                : Math.max(0, Math.floor((new Date(activeTimer.endAt).getTime() - now.getTime()) / 1000))
            : 0;

    async function markDone(activity: Activity) {
        await apiPatch('/api/bootstrap', { id: activity.id, status: 'COMPLETED' });
        notify(t('toastDone').replace('{pts}', String(activity.points)));
        load();
    }

    const firstName = user.name?.split(' ')[0] ?? user.name;

    const homeView = (
        <div className="space-y-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <p className="mb-2 text-sm text-muted-foreground">
                        {user.operationMode === 'FREE' ? t('homeSubtitleFree') : t('homeSubtitleSync')}
                    </p>
                    <h2 className="text-3xl font-bold tracking-tight">
                        {t('homeGreeting').replace('{name}', firstName ?? '')}
                    </h2>
                </div>
                <Button onClick={() => setShowForm(true)}>
                    <Plus size={17} /> {t('dashboard.addActivity')}
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
                <Metric
                    title={t('homeProgress')}
                    value={`${progress}%`}
                    detail={t('homeProgressDetail')
                        .replace('{done}', String(completed))
                        .replace('{total}', String(todayActivities.length))}
                    icon={<Target className="text-success" />}
                />
                <Metric
                    title={t('homeFocusTime')}
                    value={`${Math.floor(completedMinutes / 60)}h ${completedMinutes % 60}m`}
                    detail={t('homeFocusTimePlanned')
                        .replace('{hours}', String(Math.floor(totalMinutes / 60)))
                        .replace('{minutes}', String(totalMinutes % 60))}
                    icon={<Clock3 className="text-info" />}
                />
                <Metric
                    title={t('dashboard.streak')}
                    value={`${user.currentStreak ?? 0} días`}
                    detail={t('homeStreakBest').replace('{best}', String(user.bestStreak ?? 0))}
                    icon={<Flame className="text-warning" />}
                />
                <Metric
                    title={t('dashboard.points')}
                    value={`${user.points}`}
                    detail={t('homePointsDetail')}
                    icon={<Trophy className="text-warning" />}
                />
            </div>

            {error && (
                <p className="rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm text-danger">{error}</p>
            )}

            <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
                <Card>
                    <CardHeader className="flex-row items-center justify-between">
                        <CardTitle>{t('homeAgenda')}</CardTitle>
                        <Button variant="ghost" size="sm" onClick={() => setTab('activities')}>
                            {t('homeViewAll')} <ChevronRight size={15} />
                        </Button>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {todayActivities.length === 0 ? (
                            <Empty text={t('dashboard.noActivities')} />
                        ) : (
                            todayActivities.slice(0, 5).map((activity) => (
                                <ActivityRow
                                    key={activity.id}
                                    activity={activity}
                                    now={now}
                                    onDone={() => markDone(activity)}
                                    onTimer={() => setActiveTimer(activity)}
                                />
                            ))
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>{t('homeFocusCard')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {current ? (
                            <div className="space-y-5">
                                <div className="rounded-lg bg-muted p-5">
                                    <div className="mb-2 flex items-center justify-between">
                                        <Badge variant="success">{t('homeInProgress')}</Badge>
                                        <span className="text-sm text-muted-foreground">
                                            {formatTime(current.startAt)} – {formatTime(current.endAt)}
                                        </span>
                                    </div>
                                    <h3 className="text-xl font-semibold">{current.title}</h3>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        {current.category?.name ?? t('rowWithoutCategory')}
                                    </p>
                                </div>
                                <Button className="w-full" onClick={() => setActiveTimer(current)}>
                                    <Play size={16} /> {t('homeOpenTimer')}
                                </Button>
                            </div>
                        ) : (
                            <Empty text={t('homeNoActive')} />
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );

    return (
        <DashboardLayout active={tab} onTabChange={setTab}>
            {tab === 'home' && homeView}
            {tab === 'activities' && <ActivitiesView />}
            {tab === 'suggestions' && <SuggestionsView />}
            {tab === 'rewards' && <RewardsView />}
            {tab === 'calendar' && <CalendarView onNavigate={setTab} />}
            {tab === 'streak' && <StreakView />}
            {tab === 'export' && <ExportView />}

            {showForm && (
                <ActivityForm
                    categories={categories}
                    defaultDate={today}
                    mode={user.operationMode}
                    onClose={() => setShowForm(false)}
                    onCreated={() => {
                        setShowForm(false);
                        load();
                        notify(t('toastScheduled'));
                    }}
                />
            )}
            {user.pauseActive && <PauseBanner reason={user.pauseReason} />}
            {activeTimer && (
                <FloatingTimer
                    activity={activeTimer}
                    seconds={timerSeconds}
                    paused={timerPaused}
                    onPause={() => setTimerPaused((value) => !value)}
                    onFinalize={() => {
                        void markDone(activeTimer);
                        setActiveTimer(null);
                        setTimerPaused(false);
                    }}
                    onSnooze={() => {
                        setActiveTimer(null);
                        setTimerPaused(false);
                        notify(t('timerSnoozed'));
                    }}
                    onCancel={() => {
                        setActiveTimer(null);
                        setTimerPaused(false);
                        notify(t('toastTimerCancel'));
                    }}
                />
            )}
            {toast && <Toast message={toast} />}
        </DashboardLayout>
    );
}