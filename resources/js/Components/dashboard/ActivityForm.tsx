import * as React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { TimePicker } from '@/components/ui/time-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useI18n } from '@/lib/i18n';
import { apiPost } from '@/lib/api';
import type { Category, OperationMode } from '@/types';

function dateTimeFor(date: string, time: string) {
    return new Date(`${date}T${time}:00`).toISOString();
}

export function ActivityForm({
    categories,
    defaultDate,
    mode,
    onClose,
    onCreated,
}: {
    categories: Category[];
    defaultDate: string;
    mode: OperationMode;
    onClose: () => void;
    onCreated: () => void;
}) {
    const { t } = useI18n();
    const [title, setTitle] = React.useState('');
    const [categoryId, setCategoryId] = React.useState(categories[0]?.id ?? '');
    const [start, setStart] = React.useState('09:00');
    const [end, setEnd] = React.useState('10:00');
    const [description, setDescription] = React.useState('');
    const [duration, setDuration] = React.useState('60');
    const [saving, setSaving] = React.useState(false);

    const submit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!title.trim() || saving) return;
        setSaving(true);
        try {
            const startAt = mode === 'FREE' ? new Date().toISOString() : dateTimeFor(defaultDate, start);
            const endAt =
                mode === 'FREE'
                    ? new Date(Date.now() + Number(duration || 60) * 60_000).toISOString()
                    : dateTimeFor(defaultDate, end);
            await apiPost('/api/bootstrap', {
                action: 'activity',
                title,
                categoryId,
                description,
                startAt,
                endAt,
                isFree: mode === 'FREE',
            });
            onCreated();
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-40 grid place-items-center bg-black/50 p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="flex-row items-center justify-between">
                    <CardTitle>{mode === 'FREE' ? t('formNewFree') : t('formNewSync')}</CardTitle>
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
                                    <TimePicker className="mt-2" value={start} onChange={setStart} />
                                </label>
                                <label className="text-sm font-medium">
                                    {t('formEnd')}
                                    <TimePicker className="mt-2" value={end} onChange={setEnd} />
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
                            {mode === 'FREE' ? t('formSubmitFree') : t('formSubmitSync')}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}