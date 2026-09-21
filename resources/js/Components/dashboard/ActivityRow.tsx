import { Check, Play } from 'lucide-react';
import { Badge } from '@/Components/ui/Badge';
import { Button } from '@/Components/ui/Button';
import { useI18n } from '@/lib/i18n';
import { cn, formatTime } from '@/lib/utils';
import type { Activity } from '@/types';

export function ActivityRow({
    activity,
    now,
    onDone,
    onTimer,
}: {
    activity: Activity;
    now: Date;
    onDone: () => void;
    onTimer: () => void;
}) {
    const { t } = useI18n();
    const active = new Date(activity.startAt) <= now && new Date(activity.endAt) > now;

    return (
        <div className="flex items-center gap-3 rounded-lg border border-border p-3">
            <div className="h-10 w-1 rounded-full" style={{ backgroundColor: activity.category?.color ?? '#888' }} />
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                    <p className={cn('truncate font-medium', activity.status === 'COMPLETED' && 'text-muted-foreground line-through')}>
                        {activity.title}
                    </p>
                    {active && <Badge variant="success">{t('rowNow')}</Badge>}
                </div>
                <p className="text-xs text-muted-foreground">
                    {formatTime(activity.startAt)} – {formatTime(activity.endAt)} ·{' '}
                    {activity.category?.name ?? t('dashboard.free')}
                </p>
            </div>
            {activity.status === 'COMPLETED' ? (
                <Check className="text-success" size={18} />
            ) : (
                <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={onTimer} aria-label={t('homeOpenTimer')}>
                        <Play size={15} />
                    </Button>
                    <Button variant="outline" size="sm" onClick={onDone}>
                        {t('dashboard.complete')}
                    </Button>
                </div>
            )}
        </div>
    );
}