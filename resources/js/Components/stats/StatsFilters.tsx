import { Card, CardContent } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
import { MultiSelect } from '@/components/ui/multi-select';
import type { StatsSummary } from './types';
import type { Translator } from './format';

export function StatsFilters({
    options,
    rangeFrom,
    rangeTo,
    selectedActivities,
    selectedCategories,
    onRangeFromChange,
    onRangeToChange,
    onActivitiesChange,
    onCategoriesChange,
    onClearFilters,
    t,
}: {
    options: StatsSummary['options'] | null;
    rangeFrom: string;
    rangeTo: string;
    selectedActivities: string[];
    selectedCategories: string[];
    onRangeFromChange: (value: string) => void;
    onRangeToChange: (value: string) => void;
    onActivitiesChange: (next: string[]) => void;
    onCategoriesChange: (next: string[]) => void;
    onClearFilters: () => void;
    t: Translator;
}) {
    const hasSelections = selectedActivities.length > 0 || selectedCategories.length > 0;
    const selectedLabel = (count: number) => t('statsFiltersSelected').replace('{n}', String(count));

    return (
        <Card>
            <CardContent className="space-y-4 p-4">
                <div className="grid gap-4 lg:grid-cols-2">
                    <div className="lg:col-span-2">
                        <label className="mb-2 block text-sm font-medium">{t('statsDateRange')}</label>
                        <div className="grid max-w-md grid-cols-2 gap-2">
                            <DatePicker value={rangeFrom} onChange={onRangeFromChange} label={t('from')} />
                            <DatePicker value={rangeTo} onChange={onRangeToChange} label={t('to')} />
                        </div>
                    </div>
                    <div>
                        <label className="mb-2 block text-sm font-medium">{t('statsActivities')}</label>
                        <MultiSelect
                            label={t('statsActivities')}
                            options={(options?.activities ?? []).map((activity) => ({
                                id: activity.id,
                                label: activity.title,
                            }))}
                            value={selectedActivities}
                            onChange={onActivitiesChange}
                            labels={{
                                all: t('statsAll'),
                                selected: selectedLabel,
                                search: t('statsFiltersSearch'),
                                empty: t('statsFiltersEmpty'),
                                clear: t('statsFiltersClear'),
                            }}
                        />
                    </div>
                    <div>
                        <label className="mb-2 block text-sm font-medium">{t('statsCategories')}</label>
                        <MultiSelect
                            label={t('statsCategories')}
                            options={(options?.categories ?? []).map((category) => ({
                                id: category.id,
                                label: category.name,
                                color: category.color,
                            }))}
                            value={selectedCategories}
                            onChange={onCategoriesChange}
                            labels={{
                                all: t('statsAll'),
                                selected: selectedLabel,
                                search: t('statsFiltersSearch'),
                                empty: t('statsFiltersEmpty'),
                                clear: t('statsFiltersClear'),
                                selectAll: t('statsFiltersSelectAll'),
                            }}
                            showSelectAll
                        />
                    </div>
                </div>
                {hasSelections && (
                    <div className="flex justify-end">
                        <button
                            type="button"
                            className="text-xs text-muted-foreground underline transition-colors hover:text-foreground"
                            onClick={onClearFilters}
                        >
                            {t('statsClearFilters')}
                        </button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
