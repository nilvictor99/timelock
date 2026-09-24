import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { StatsSummary } from './types';
import type { Translator } from './format';

export type RangePreset = 'today' | 'week' | 'month' | 'custom';

export function StatsFilters({
    options,
    preset,
    customFrom,
    customTo,
    activitySearch,
    selectedActivities,
    selectedCategories,
    onPresetChange,
    onCustomFromChange,
    onCustomToChange,
    onActivitySearchChange,
    onActivityToggle,
    onCategoryToggle,
    onClearFilters,
    t,
}: {
    options: StatsSummary['options'] | null;
    preset: RangePreset;
    customFrom: string;
    customTo: string;
    activitySearch: string;
    selectedActivities: string[];
    selectedCategories: string[];
    onPresetChange: (preset: RangePreset) => void;
    onCustomFromChange: (value: string) => void;
    onCustomToChange: (value: string) => void;
    onActivitySearchChange: (value: string) => void;
    onActivityToggle: (id: string) => void;
    onCategoryToggle: (id: string) => void;
    onClearFilters: () => void;
    t: Translator;
}) {
    const visibleActivities = React.useMemo(
        () =>
            (options?.activities ?? []).filter((activity) =>
                activity.title.toLowerCase().includes(activitySearch.toLowerCase()),
            ),
        [activitySearch, options],
    );

    const presetKeys: Record<RangePreset, string> = {
        today: 'statsToday',
        week: 'statsThisWeek',
        month: 'statsThisMonth',
        custom: 'statsCustom',
    };

    return (
        <Card>
            <CardContent className="grid gap-4 p-4 lg:grid-cols-[1.2fr_1fr_1fr]">
                <div>
                    <label className="mb-2 block text-sm font-medium">{t('statsDateRange')}</label>
                    <div className="flex flex-wrap gap-2">
                        {(['today', 'week', 'month', 'custom'] as RangePreset[]).map((value) => (
                            <button
                                key={value}
                                type="button"
                                onClick={() => onPresetChange(value)}
                                className={cn(
                                    'rounded-md border px-3 py-2 text-sm',
                                    preset === value
                                        ? 'border-foreground bg-foreground text-background'
                                        : 'border-border text-muted-foreground',
                                )}
                            >
                                {t(presetKeys[value])}
                            </button>
                        ))}
                    </div>
                </div>
                {preset === 'custom' && (
                    <div className="grid grid-cols-2 gap-2">
                        <label className="text-sm">
                            {t('from')}
                            <Input className="mt-2" type="date" value={customFrom} onChange={(event) => onCustomFromChange(event.target.value)} />
                        </label>
                        <label className="text-sm">
                            {t('to')}
                            <Input className="mt-2" type="date" value={customTo} onChange={(event) => onCustomToChange(event.target.value)} />
                        </label>
                    </div>
                )}
                <div>
                    <label className="mb-2 block text-sm font-medium">{t('statsActivities')}</label>
                    <Input placeholder={t('statsSearchActivities')} value={activitySearch} onChange={(event) => onActivitySearchChange(event.target.value)} />
                    <div className="mt-2 flex max-h-20 flex-wrap gap-2 overflow-auto">
                        {visibleActivities.slice(0, 12).map((activity) => (
                            <label key={activity.id} className="flex items-center gap-1 text-xs">
                                <Checkbox
                                    checked={selectedActivities.includes(activity.id)}
                                    onCheckedChange={() => onActivityToggle(activity.id)}
                                />
                                {activity.title}
                            </label>
                        ))}
                        {visibleActivities.length > 12 && (
                            <span className="text-xs text-muted-foreground">+{visibleActivities.length - 12}</span>
                        )}
                    </div>
                </div>
                <div>
                    <label className="mb-2 block text-sm font-medium">{t('statsCategories')}</label>
                    <div className="flex max-h-24 flex-wrap gap-2 overflow-auto">
                        {(options?.categories ?? []).map((category) => (
                            <label key={category.id} className="flex items-center gap-1 text-sm">
                                <Checkbox
                                    checked={selectedCategories.includes(category.id)}
                                    onCheckedChange={() => onCategoryToggle(category.id)}
                                />
                                {category.name}
                            </label>
                        ))}
                    </div>
                    {(selectedActivities.length > 0 || selectedCategories.length > 0) && (
                        <button type="button" className="mt-2 text-xs text-muted-foreground underline" onClick={onClearFilters}>
                            {t('statsAll')}
                        </button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
