import { Pause, X, Check } from 'lucide-react';
import { Badge } from '@/Components/ui/Badge';
import { Button } from '@/Components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/Card';
import { useI18n } from '@/lib/i18n';
import type { Activity } from '@/types';

function formatSeconds(seconds: number) {
    return `${String(Math.floor(seconds / 3600)).padStart(2, '0')}:${String(Math.floor((seconds % 3600) / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}

export function FloatingTimer({
    activity,
    seconds,
    paused,
    onPause,
    onFinalize,
    onSnooze,
    onCancel,
}: {
    activity: Activity;
    seconds: number;
    paused: boolean;
    onPause: () => void;
    onFinalize: () => void;
    onSnooze: () => void;
    onCancel: () => void;
}) {
    const { t } = useI18n();

    return (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
            <Card className="w-full max-w-md shadow-2xl">
                <CardHeader className="flex-row items-start justify-between">
                    <div>
                        <Badge variant="success">{paused ? t('timerPaused') : t('timerInProgress')}</Badge>
                        <CardTitle className="mt-3">{activity.title}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                            {activity.category?.name ?? t('rowWithoutCategory')}
                        </p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={onCancel} aria-label={t('timerClose')}>
                        <X size={16} />
                    </Button>
                </CardHeader>
                <CardContent className="space-y-6 text-center">
                    <div className="font-mono text-6xl font-bold tracking-tight">{formatSeconds(seconds)}</div>
                    <div className="flex flex-wrap justify-center gap-2">
                        <Button variant="outline" onClick={onPause}>
                            <Pause size={16} /> {paused ? t('timerResume') : t('timerPause')}
                        </Button>
                        <Button variant="outline" onClick={onSnooze}>
                            {t('timerSnooze')}
                        </Button>
                        <Button onClick={onFinalize}>
                            <Check size={16} /> {t('timerFinalize')}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}