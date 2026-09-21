import * as React from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Button } from '@/Components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/Card';
import { useI18n } from '@/lib/i18n';
import { useTheme } from '@/lib/theme';
import { apiPost } from '@/lib/api';
import type { Theme, Language, OperationMode } from '@/types';

export default function Settings({
    user,
}: {
    user: {
        theme: Theme;
        language: Language;
        operationMode: OperationMode;
        name: string;
    };
}) {
    const { t } = useI18n();
    const { setTheme } = useTheme();

    const [name, setName] = React.useState(user.name);
    const [theme, setThemeValue] = React.useState<Theme>(user.theme);
    const [language, setLanguage] = React.useState<Language>(user.language);
    const [operationMode, setOperationMode] = React.useState<OperationMode>(user.operationMode);
    const [saving, setSaving] = React.useState(false);
    const [notice, setNotice] = React.useState<null | { kind: 'ok' | 'error'; message: string }>(null);

    async function save(event: React.FormEvent) {
        event.preventDefault();
        setSaving(true);
        setNotice(null);
        try {
            await apiPost('/api/bootstrap', {
                action: 'settings',
                name,
                theme,
                language,
                operationMode,
            });
            setThemeValue(theme);
            localStorage.setItem('timelock-theme', theme.toLowerCase());
            setTheme(theme.toLowerCase() as 'light' | 'dark' | 'system');
            setNotice({ kind: 'ok', message: t('profile.saved') });
        } catch (cause) {
            setNotice({ kind: 'error', message: cause instanceof Error ? cause.message : t('profile.error') });
        } finally {
            setSaving(false);
        }
    }

    return (
        <DashboardLayout>
            <Card>
                <CardHeader>
                    <CardTitle>{t('settings.title')}</CardTitle>
                </CardHeader>
                <CardContent>
                    {notice && (
                        <p
                            className={`mb-3 rounded-lg p-3 text-sm ${
                                notice.kind === 'ok'
                                    ? 'bg-green-100 text-green-700 dark:bg-green-950'
                                    : 'bg-danger/10 text-danger'
                            }`}
                        >
                            {notice.message}
                        </p>
                    )}
                    <form onSubmit={save} className="space-y-4">
                        <label className="block space-y-1 text-sm">
                            {t('settings.name')}
                            <input
                                value={name}
                                onChange={(event) => setName(event.target.value)}
                                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                            />
                        </label>

                        <div className="space-y-1 text-sm">
                            {t('settings.theme')}
                            <div className="flex gap-2">
                                {(['LIGHT', 'DARK', 'SYSTEM'] as const).map((option) => (
                                    <button
                                        key={option}
                                        type="button"
                                        onClick={() => setThemeValue(option)}
                                        className={`h-10 rounded-md border px-4 text-sm ${
                                            theme === option
                                                ? 'border-foreground bg-foreground text-background'
                                                : 'border-border bg-background hover:bg-muted'
                                        }`}
                                    >
                                        {option === 'LIGHT' ? '☀️' : option === 'DARK' ? '🌙' : '🖥️'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <label className="block space-y-1 text-sm">
                            {t('settings.language')}
                            <select
                                value={language}
                                onChange={(event) => setLanguage(event.target.value as Language)}
                                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                            >
                                <option value="es">Español</option>
                                <option value="en">English</option>
                            </select>
                        </label>

                        <label className="block space-y-1 text-sm">
                            {t('onboarding.mode')}
                            <select
                                value={operationMode}
                                onChange={(event) =>
                                    setOperationMode(event.target.value as OperationMode)
                                }
                                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                            >
                                <option value="FREE">{t('onboarding.free')}</option>
                                <option value="STRICT">{t('onboarding.strict')}</option>
                            </select>
                        </label>

                        <Button type="submit" disabled={saving}>
                            {t('profile.saved')}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </DashboardLayout>
    );
}