import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { DatePicker } from '@/components/ui/date-picker';
import type { StatsSummary } from './types';
import type { Translator } from './format';

export function StatsFilters({
    options,
    rangeFrom,
    rangeTo,
    activitySearch,
    selectedActivities,
    selectedCategories,
    onRangeFromChange,
    onRangeToChange,
    onActivitySearchChange,
    onActivityToggle,
    onCategoryToggle,
    onClearFilters,
    t,
}: {
    options: StatsSummary['options'] | null;
    rangeFrom: string;
    rangeTo: string;
    activitySearch: string;
    selectedActivities: string[];
    selectedCategories: string[];
    onRangeFromChange: (value: string) => void;
    onRangeToChange: (value: string) => void;
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

    return (
        <Card>
            <CardContent className="grid gap-4 p-4 lg:grid-cols-[1fr_1fr_1fr]">
                <div>
                    <label className="mb-2 block text-sm font-medium">{t('statsDateRange')}</label>
                    <div className="grid grid-cols-2 gap-2">
                        <DatePicker value={rangeFrom} onChange={onRangeFromChange} label={t('from')} />
                        <DatePicker value={rangeTo} onChange={onRangeToChange} label={t('to')} />
                    </div>
                </div>
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
