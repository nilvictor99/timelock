import * as React from 'react';
import { router } from '@inertiajs/react';
import { Button } from '@/Components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/Card';
import { Input } from '@/Components/ui/Input';
import { useI18n } from '@/lib/i18n';

export default function Onboarding() {
    const { t } = useI18n();
    const [name, setName] = React.useState('');
    const [timezone, setTimezone] = React.useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
    const [language, setLanguage] = React.useState<'es' | 'en'>('es');
    const [operationMode, setOperationMode] = React.useState<'FREE' | 'STRICT'>('FREE');
    const [saving, setSaving] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    async function submit(event: React.FormEvent) {
        event.preventDefault();
        setSaving(true);
        setError(null);

        try {
            await fetch('/api/bootstrap', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                body: JSON.stringify({
                    action: 'onboarding',
                    name,
                    timezone,
                    language,
                    operationMode,
                }),
            });
            router.visit('/dashboard');
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : t('onboarding.error'));
            setSaving(false);
        }
    }

    return (
        <main className="flex min-h-screen items-center justify-center bg-background p-4 text-foreground">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>{t('onboarding.title')}</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={submit} className="space-y-4">
                        <div className="space-y-1">
                            <Input
                                placeholder={t('login.name')}
                                value={name}
                                onChange={(event) => setName(event.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-1">
                            <Input
                                value={timezone}
                                onChange={(event) => setTimezone(event.target.value)}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <label className="space-y-1 text-sm">
                                {t('onboarding.language')}
                                <select
                                    value={language}
                                    onChange={(event) =>
                                        setLanguage(event.target.value as 'es' | 'en')
                                    }
                                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                                >
                                    <option value="es">Español</option>
                                    <option value="en">English</option>
                                </select>
                            </label>
                            <label className="space-y-1 text-sm">
                                {t('onboarding.mode')}
                                <select
                                    value={operationMode}
                                    onChange={(event) =>
                                        setOperationMode(event.target.value as 'FREE' | 'STRICT')
                                    }
                                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                                >
                                    <option value="FREE">{t('onboarding.free')}</option>
                                    <option value="STRICT">{t('onboarding.strict')}</option>
                                </select>
                            </label>
                        </div>
                        {error && <p className="text-sm text-danger">{error}</p>}
                        <Button type="submit" className="w-full" disabled={saving}>
                            {t('onboarding.submit')}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </main>
    );
}