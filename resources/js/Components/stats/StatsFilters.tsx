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
            <CardContent className="space-y-3 p-4">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                        <label htmlFor="stats-range-from" className="mb-1.5 block text-xs font-medium text-muted-foreground">
                            {t('from')}
                        </label>
                        <DatePicker id="stats-range-from" value={rangeFrom} onChange={onRangeFromChange} />
                    </div>
                    <div>
                        <label htmlFor="stats-range-to" className="mb-1.5 block text-xs font-medium text-muted-foreground">
                            {t('to')}
                        </label>
                        <DatePicker id="stats-range-to" value={rangeTo} onChange={onRangeToChange} />
                    </div>
                    <div>
                        <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{t('statsActivities')}</label>
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
                        <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{t('statsCategories')}</label>
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
