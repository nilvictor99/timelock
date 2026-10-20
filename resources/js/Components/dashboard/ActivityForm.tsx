import * as React from 'react';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { TimePicker } from '@/components/ui/time-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useI18n } from '@/lib/i18n';
import { apiPost, apiPatch } from '@/lib/api';
import { toDateKey } from '@/lib/utils';
import type { Category, OperationMode } from '@/types';

function dateTimeFor(date: string, time: string) {
    return `${date}T${time}:00`;
}

export function ActivityForm({
    categories,
    defaultDate,
    mode,
    onClose,
    onCreated,
    editActivity,
    existingActivities,
}: {
    categories: Category[];
    defaultDate: string;
    mode: OperationMode;
    onClose: () => void;
    onCreated: () => void;
    editActivity?: import('@/types').Activity;
    existingActivities?: import('@/types').Activity[];
}) {
    const { t } = useI18n();
    const isEdit = !!editActivity;
    const [title, setTitle] = React.useState(editActivity?.title ?? '');
    const [categoryId, setCategoryId] = React.useState(editActivity?.categoryId ?? categories[0]?.id ?? '');
    const [start, setStart] = React.useState(() => {
        if (isEdit && editActivity) {
            try { return new Date(editActivity.startAt).toTimeString().slice(0,5); } catch { return '09:00'; }
        }
        return '09:00';
    });
    const [end, setEnd] = React.useState(() => {
        if (isEdit && editActivity) {
            try { return new Date(editActivity.endAt).toTimeString().slice(0,5); } catch { return '10:00'; }
        }
        return '10:00';
    });
    const [description, setDescription] = React.useState(editActivity?.description ?? '');
    const [duration, setDuration] = React.useState('60');
    const [saving, setSaving] = React.useState(false);

    React.useEffect(() => {
        if (isEdit) return;
        if (mode !== 'FREE') {
            const today = toDateKey();
            if (defaultDate === today) {
                const now = new Date();
                const minutes = Math.ceil(now.getMinutes() / 30) * 30;
                now.setMinutes(minutes, 0, 0);
                const pad = (n: number) => String(n).padStart(2, '0');
                const time = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
                setStart(time);
                const endDate = new Date(now.getTime() + 60 * 60_000);
                setEnd(`${pad(endDate.getHours())}:${pad(endDate.getMinutes())}`);
            } else {
                setStart('09:00');
                setEnd('10:00');
            }
        }
    }, [mode, defaultDate, isEdit]);

    React.useEffect(() => {
        if (mode === 'FREE' || isEdit) return;
        const pad = (n: number) => String(n).padStart(2, '0');
        const startDate = new Date(`${defaultDate}T${start}:00`);
        const endDate = new Date(`${defaultDate}T${end}:00`);
        const duration = Math.max(30 * 60_000, endDate.getTime() - startDate.getTime());
        let newEnd = new Date(startDate.getTime() + duration);
        const overlaps = (s:Date, e:Date) => existingActivities?.some(a => {
            if (a.id === editActivity?.id) return false;
            const aStart = new Date(a.startAt);
            const aEnd = new Date(a.endAt);
            return s < aEnd && e > aStart;
        });
        while (newEnd <= startDate || (existingActivities && overlaps(startDate, newEnd))) {
            newEnd = new Date(newEnd.getTime() + 30 * 60_000);
            if (newEnd.getHours() >= 23) break;
        }
        if (endDate.getTime() !== newEnd.getTime()) {
            setEnd(`${pad(newEnd.getHours())}:${pad(newEnd.getMinutes())}`);
        }
    }, [start, defaultDate, mode, isEdit, existingActivities]);

    const submit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!title.trim() || saving) return;
        setSaving(true);
        try {
            if (mode !== 'FREE') {
                const today = toDateKey();
                if (defaultDate === today) {
                    const now = new Date();
                    const startDate = new Date(`${defaultDate}T${start}:00`);
                    if (startDate.getTime() <= now.getTime()) {
                        toast.error(t('formStartFuture'));
                        setSaving(false);
                        return;
                    }
                }
                const startDateTime = new Date(`${defaultDate}T${start}:00`);
                const endDateTime = new Date(`${defaultDate}T${end}:00`);
                if (endDateTime <= startDateTime) {
                    toast.error(t('formEndAfterStart'));
                    setSaving(false);
                    return;
                }
                if (existingActivities && existingActivities.length) {
                    const overlap = existingActivities.some((a) => {
                        if (isEdit && a.id === editActivity?.id) return false;
                        const aStart = new Date(a.startAt);
                        const aEnd = new Date(a.endAt);
                        return startDateTime < aEnd && endDateTime > aStart;
                    });
                    if (overlap) {
                        toast.error(t('formOverlap'));
                        setSaving(false);
                        return;
                    }
                }
            }
            const startAt = mode === 'FREE' ? new Date().toISOString() : dateTimeFor(defaultDate, start);
            const endAt =
                mode === 'FREE'
                    ? new Date(Date.now() + Number(duration || 60) * 60_000).toISOString()
                    : dateTimeFor(defaultDate, end);

            if (isEdit && editActivity) {
                await apiPatch('/api/bootstrap', {
                    id: editActivity.id,
                    title,
                    categoryId,
                    description,
                    startAt,
                    endAt,
                });
            } else {
                await apiPost('/api/bootstrap', {
                    action: 'activity',
                    title,
                    categoryId,
                    description,
                    startAt,
                    endAt,
                    isFree: mode === 'FREE',
                });
            }
            onCreated();
        } finally {
            setSaving(false);
        }
    };

    const isSlotOccupied = (hour: number, minute: number) => {
        if (mode === 'FREE' || !existingActivities?.length) return false;
        const slotStart = new Date(`${defaultDate}T${String(hour).padStart(2,'0')}:${String(minute).padStart(2,'0')}:00`);
        const slotEnd = new Date(slotStart.getTime() + 60 * 60_000);
        return existingActivities.some((a) => {
            if (isEdit && a.id === editActivity?.id) return false;
            const aStart = new Date(a.startAt);
            const aEnd = new Date(a.endAt);
            return slotStart < aEnd && slotEnd > aStart;
        });
    };

    const isStartSlotDisabled = (h: number, m: number) => isSlotOccupied(h, m) || (defaultDate === toDateKey() && new Date(`${defaultDate}T${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:00`).getTime() <= Date.now());

    const isEndSlotDisabled = (h: number, m: number) => {
        if (mode === 'FREE') return false;
        const endDate = new Date(`${defaultDate}T${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:00`);
        const startDate = new Date(`${defaultDate}T${start}:00`);
        if (endDate <= startDate) return true;
        return isSlotOccupied(h, m);
    };

    const findNextFreeSlot = (fromHour: number, fromMinute: number) => {
        const pad = (n:number)=>String(n).padStart(2,'0');
        let h = fromHour;
        let m = fromMinute;
        for (let i=0;i<48;i++){
            if (!isStartSlotDisabled(h,m)) return `${pad(h)}:${pad(m)}`;
            m += 30;
            if (m>=60){ m=0; h++; }
            if (h>=24) h=0;
        }
        return `${pad(fromHour)}:${pad(fromMinute)}`;
    };

    React.useEffect(() => {
        if (mode === 'FREE' || isEdit) return;
        if (isStartSlotDisabled(parseInt(start.split(':')[0]), parseInt(start.split(':')[1]))) {
            const [h,m]=start.split(':').map(Number);
            const next = findNextFreeSlot(h,m);
            setStart(next);
            const endDate = new Date(`${defaultDate}T${next}:00`);
            endDate.setHours(endDate.getHours()+1);
            const pad = (n:number)=>String(n).padStart(2,'0');
            setEnd(`${pad(endDate.getHours())}:${pad(endDate.getMinutes())}`);
        }
    }, [existingActivities, defaultDate, mode, isEdit, start]);

    return (
        <div className="fixed inset-0 z-40 grid place-items-center bg-black/50 p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="flex-row items-center justify-between">
                    <CardTitle>{isEdit ? t('formEditActivity') : mode === 'FREE' ? t('formNewFree') : t('formNewSync')}</CardTitle>
                    <Button variant="ghost" size="sm" onClick={onClose} aria-label={t('timerClose')}>
                        <X size={16} />
                    </Button>
                </CardHeader>
                <CardContent>
                    <form onSubmit={submit} className="space-y-4">
                        <label className="block text-sm font-medium">
                            {t('formTitle')}
                            <Input
                                className="mt-2"
                                autoFocus
                                value={title}
                                onChange={(event) => setTitle(event.target.value)}
                                placeholder={t('formPlaceholder')}
                            />
                        </label>
                        <label className="block text-sm font-medium">
                            {t('formCategory')}
                            <Select value={categoryId} onValueChange={setCategoryId}>
                                <SelectTrigger className="mt-2 w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map((category) => (
                                        <SelectItem key={category.id} value={category.id}>
                                            {category.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </label>
                        {mode === 'FREE' ? (
                            <label className="block text-sm font-medium">
                                {t('formDuration')}
                                <Input
                                    className="mt-2"
                                    type="number"
                                    min={1}
                                    value={duration}
                                    onChange={(event) => setDuration(event.target.value)}
                                />
                            </label>
                        ) : (
                            <div className="grid grid-cols-2 gap-3">
                                <label className="text-sm font-medium">
                                    {t('formStart')}
                                    <TimePicker className="mt-2" value={start} onChange={setStart} isSlotDisabled={isStartSlotDisabled} />
                                </label>
                                <label className="text-sm font-medium">
                                    {t('formEnd')}
                                    <TimePicker className="mt-2" value={end} onChange={setEnd} isSlotDisabled={isEndSlotDisabled} />
                                </label>
                            </div>
                        )}
                        <label className="block text-sm font-medium">
                            {t('formDescription')}
                            <Textarea
                                className="mt-2 min-h-20"
                                value={description}
                                onChange={(event) => setDescription(event.target.value)}
                            />
                        </label>
                        <Button className="w-full" type="submit" disabled={saving}>
                            {isEdit ? t('formSave') : mode === 'FREE' ? t('formSubmitFree') : t('formSubmitSync')}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}