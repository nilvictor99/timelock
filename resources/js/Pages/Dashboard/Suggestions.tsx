import * as React from 'react';
import { Sparkles } from 'lucide-react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Badge } from '@/Components/ui/Badge';
import { Button } from '@/Components/ui/Button';
import { Card, CardContent } from '@/Components/ui/Card';
import { Empty } from '@/Components/dashboard/Empty';
import { useI18n } from '@/lib/i18n';
import { apiGet, apiPost } from '@/lib/api';
import { toDateKey } from '@/lib/utils';
import type { Bootstrap, Suggestion, User } from '@/types';

type SuggestionResponse = {
    suggestions?: Suggestion[];
    source?: 'ai' | 'rule';
    warning?: string;
    error?: string;
};

export default function Suggestions() {
    const { t } = useI18n();
    const [user, setUser] = React.useState<User | null>(null);
    const [categories, setCategories] = React.useState<Bootstrap['categories']>([]);
    const [suggestions, setSuggestions] = React.useState<Suggestion[]>([]);
    const [source, setSource] = React.useState<'ai' | 'rule'>('rule');
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState('');
    const [adding, setAdding] = React.useState<string | null>(null);

    const refreshUser = React.useCallback(() => {
        apiGet<Bootstrap>('/api/bootstrap').then((data) => {
            setUser(data.user);
            setCategories(data.categories);
        });
    }, []);

    const generate = React.useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const data = await apiPost<SuggestionResponse>('/api/suggestions', {
                action: suggestions.length ? 'regenerate' : 'generate',
            });
            setSuggestions(data.suggestions ?? []);
            setSource(data.source === 'ai' ? 'ai' : 'rule');
            if (data.warning) setError(data.warning);
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : t('suggestionError'));
        } finally {
            setLoading(false);
        }
    }, [suggestions.length, t]);

    React.useEffect(() => {
        refreshUser();
        void generate();
    }, [refreshUser, generate]);

    const addToToday = async (suggestion: Suggestion) => {
        setAdding(suggestion.id ?? suggestion.title);
        try {
            const start = suggestion.suggestedTime
                ? new Date(`${toDateKey()}T${suggestion.suggestedTime}:00`)
                : new Date(Date.now() + 60 * 60 * 1000);
            start.setSeconds(0, 0);
            const end = new Date(start.getTime() + suggestion.duration * 60 * 1000);
            const category =
                categories.find(
                    (item) => item.name.toLowerCase() === suggestion.category?.toLowerCase(),
                ) ?? categories[0];
            await apiPost('/api/bootstrap', {
                action: 'activity',
                title: suggestion.title,
                description: suggestion.reason,
                categoryId: category?.id,
                startAt:
                    user?.operationMode === 'FREE'
                        ? new Date().toISOString()
                        : start.toISOString(),
                endAt:
                    user?.operationMode === 'FREE'
                        ? new Date(Date.now() + suggestion.duration * 60 * 1000).toISOString()
                        : end.toISOString(),
                isFree: user?.operationMode === 'FREE',
            });
            refreshUser();
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : t('suggestionError'));
        } finally {
            setAdding(null);
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                        <h2 className="text-2xl font-bold">{t('suggestionsTitle')}</h2>
                        <p className="text-sm text-muted-foreground">{t('suggestionsDescription')}</p>
                    </div>
                    <Button variant="outline" onClick={() => void generate()} disabled={loading}>
                        <Sparkles size={16} /> {t('regenerateSuggestions')}
                    </Button>
                </div>

                {error && (
                    <p className="rounded-md border border-border bg-muted px-3 py-2 text-sm text-muted-foreground">
                        {error}
                    </p>
                )}

                {loading ? (
                    <div className="grid gap-4 md:grid-cols-2" aria-label={t('loadingSuggestions')}>
                        {[1, 2, 3, 4].map((item) => (
                            <Card key={item}>
                                <CardContent className="space-y-3 p-5">
                                    <div className="h-5 w-2/3 animate-pulse rounded bg-muted" />
                                    <div className="h-4 w-full animate-pulse rounded bg-muted" />
                                    <div className="h-9 w-28 animate-pulse rounded bg-muted" />
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : suggestions.length === 0 ? (
                    <Empty text={t('suggestionEmpty')} />
                ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                        {suggestions.map((suggestion) => (
                            <Card key={suggestion.id ?? suggestion.title}>
                                <CardContent className="space-y-4 p-5">
                                    <div className="flex items-start gap-3">
                                        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-muted">
                                            <Sparkles size={18} />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h3 className="font-semibold">{suggestion.title}</h3>
                                                <Badge variant={source === 'ai' ? 'success' : 'default'}>
                                                    {source === 'ai' ? t('generatedByAI') : t('generatedByRules')}
                                                </Badge>
                                            </div>
                                            <p className="mt-1 text-sm text-muted-foreground">
                                                {suggestion.category} · {suggestion.duration} {t('suggestionMinutes')} ·{' '}
                                                {suggestion.points} {t('suggestionPoints')}
                                            </p>
                                        </div>
                                    </div>
                                    <p className="text-sm">
                                        <span className="font-medium">{t('suggestionReason')}:</span>{' '}
                                        {suggestion.reason}
                                    </p>
                                    {suggestion.suggestedTime && (
                                        <p className="text-xs text-muted-foreground">
                                            {t('suggestionTime')}: {suggestion.suggestedTime}
                                        </p>
                                    )}
                                    <Button
                                        className="w-full"
                                        variant="outline"
                                        onClick={() => void addToToday(suggestion)}
                                        disabled={adding === (suggestion.id ?? suggestion.title)}
                                    >
                                        {adding === (suggestion.id ?? suggestion.title)
                                            ? t('dashboard.loading')
                                            : t('addToToday')}
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}