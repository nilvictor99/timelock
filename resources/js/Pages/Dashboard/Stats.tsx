import * as React from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Button } from '@/Components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/Card';
import { useI18n } from '@/lib/i18n';
import { apiGet } from '@/lib/api';
import type { Bootstrap } from '@/types';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { jsPDF } from 'jspdf';

export default function Stats() {
    const { t } = useI18n();
    const [data, setData] = React.useState<Bootstrap | null>(null);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        apiGet<Bootstrap>('/api/bootstrap')
            .then(setData)
            .catch((cause) => setError(cause instanceof Error ? cause.message : String(cause)));
    }, []);

    if (error) {
        return (
            <DashboardLayout>
                <p className="text-danger">{error}</p>
            </DashboardLayout>
        );
    }

    if (!data) {
        return (
            <DashboardLayout>
                <p className="text-muted-foreground">{t('dashboard.loading')}</p>
            </DashboardLayout>
        );
    }

    const bootstrap: Bootstrap = data;
    const completed = bootstrap.activities.filter((a) => a.status === 'COMPLETED');
    const pointsEarned = completed.reduce((sum, activity) => sum + (activity.points ?? 0), 0);
    const byCategory = new Map<string, { count: number; points: number }>();
    for (const activity of completed) {
        const name = activity.category?.name ?? t('dashboard.free');
        const bucket = byCategory.get(name) ?? { count: 0, points: 0 };
        bucket.count += 1;
        bucket.points += activity.points ?? 0;
        byCategory.set(name, bucket);
    }
    const bestCategory = [...byCategory.entries()].sort((a, b) => b[1].count - a[1].count)[0];

    const daily: { day: string; count: number }[] = [];
    for (let index = 13; index >= 0; index -= 1) {
        const date = new Date();
        date.setHours(0, 0, 0, 0);
        date.setDate(date.getDate() - index);
        const count = completed.filter((activity) => activity.completedAt && activity.completedAt.startsWith(date.toISOString().slice(0, 10))).length;
        daily.push({ day: date.toISOString().slice(5, 10), count });
    }

    function downloadCsv() {
        window.open('/api/export', '_blank');
    }

    function downloadPdf() {
        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text('TimeLock-v', 14, 20);
        doc.setFontSize(11);
        doc.text(t('stats.pointsEarned') + ': ' + pointsEarned, 14, 32);
        doc.text(t('stats.completed') + ': ' + completed.length + '/' + bootstrap.activities.length, 14, 39);
        doc.text(t('stats.bestCategory') + ': ' + (bestCategory?.[0] ?? '—'), 14, 46);
        let y = 60;
        for (const [name, bucket] of byCategory.entries()) {
            doc.text(`${name}: ${bucket.count} ${t('stats.activities')} · ${bucket.points} pts`, 14, y);
            y += 7;
        }
        doc.save('timelock-stats.pdf');
    }

    return (
        <DashboardLayout>
            <div className="space-y-4">
                <section className="grid gap-3 sm:grid-cols-3">
                    <Card>
                        <CardContent className="pt-5">
                            <p className="text-sm text-muted-foreground">{t('stats.pointsEarned')}</p>
                            <p className="text-2xl font-semibold">{pointsEarned}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-5">
                            <p className="text-sm text-muted-foreground">{t('stats.completed')}</p>
                            <p className="text-2xl font-semibold">
                                {completed.length}/{bootstrap.activities.length}
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-5">
                            <p className="text-sm text-muted-foreground">{t('stats.bestCategory')}</p>
                            <p className="truncate text-2xl font-semibold">
                                {bestCategory?.[0] ?? '—'}
                            </p>
                        </CardContent>
                    </Card>
                </section>

                <Card>
                    <CardHeader>
                        <CardTitle>{t('stats.last14')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={daily}>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                <XAxis dataKey="day" fontSize={11} stroke="hsl(var(--muted-foreground))" />
                                <YAxis allowDecimals={false} fontSize={11} stroke="hsl(var(--muted-foreground))" />
                                <Tooltip cursor={{ fill: 'hsl(var(--muted))' }} />
                                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>{t('stats.byCategory')}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {byCategory.size === 0 && (
                            <p className="text-sm text-muted-foreground">{t('stats.noData')}</p>
                        )}
                        {[...byCategory.entries()].map(([name, bucket]) => (
                            <div
                                key={name}
                                className="flex items-center justify-between rounded-lg border border-border p-3 text-sm"
                            >
                                <span>
                                    {name} · {bucket.count} {t('stats.activities')}
                                </span>
                                <span className="font-medium">{bucket.points} pts</span>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={downloadCsv}>
                        {t('stats.downloadCsv')}
                    </Button>
                    <Button variant="outline" size="sm" onClick={downloadPdf}>
                        {t('stats.downloadPdf')}
                    </Button>
                </div>
            </div>
        </DashboardLayout>
    );
}