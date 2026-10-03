import * as React from 'react';
import { router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useI18n } from '@/lib/i18n';

export default function Onboarding() {
    const { t } = useI18n();
    const [name, setName] = React.useState('');
    const [timezone, setTimezone] = React.useState('');
    const [language, setLanguage] = React.useState<'es' | 'en'>('es');
    const [operationMode, setOperationMode] = React.useState<'SYNCHRONOUS' | 'FREE'>('SYNCHRONOUS');
    const [error, setError] = React.useState('');
    const [saving, setSaving] = React.useState(false);

    React.useEffect(() => {
        setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC');
    }, []);

    async function submit(event: React.FormEvent) {
        event.preventDefault();
        setSaving(true);
        try {
            const response = await fetch('/api/bootstrap', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                body: JSON.stringify({ action: 'onboarding', name, timezone, language, operationMode }),
            });
            if (!response.ok) {
                const result = (await response.json().catch(() => ({}))) as { error?: string };
                setError(result.error ?? t('onboarding.error'));
                setSaving(false);
                return;
            }
            router.visit('/dashboard');
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : t('onboarding.error'));
            setSaving(false);
        }
    }

    return (
        <main className="grid min-h-screen place-items-center bg-muted/30 p-6">
            <Card className="w-full max-w-2xl">
                <CardHeader>
                    <p className="text-sm font-semibold text-info">{t('onboarding.step')}</p>
                    <CardTitle>{t('onboarding.title')}</CardTitle>
                    <p className="text-sm text-muted-foreground">{t('onboarding.subtitle')}</p>
                </CardHeader>
                <CardContent>
                    <form onSubmit={submit} className="space-y-6">
                        <label className="block text-sm font-medium">
                            {t('onboarding.name')}
                            <Input className="mt-2" value={name} onChange={(event) => setName(event.target.value)} required />
                        </label>
                        <div className="grid gap-4 md:grid-cols-2">
                            <label className="block text-sm font-medium">
                                {t('onboarding.timezone')}
                                <Input className="mt-2" value={timezone} onChange={(event) => setTimezone(event.target.value)} required />
                            </label>
                            <label className="block text-sm font-medium">
                                {t('onboarding.language')}
                                <select
                                    className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                                    value={language}
                                    onChange={(event) => setLanguage(event.target.value as 'es' | 'en')}
                                >
                                    <option value="es">Español</option>
                                    <option value="en">English</option>
                                </select>
                            </label>
                        </div>
                        <fieldset>
                            <legend className="mb-3 text-sm font-medium">{t('onboarding.mode')}</legend>
                            <div className="grid gap-3 md:grid-cols-2">
                                <label
                                    className={`cursor-pointer rounded-lg border p-4 ${
                                        operationMode === 'SYNCHRONOUS' ? 'border-foreground bg-muted' : 'border-border'
                                    }`}
                                >
                                    <input
                                        className="sr-only"
                                        type="radio"
                                        checked={operationMode === 'SYNCHRONOUS'}
                                        onChange={() => setOperationMode('SYNCHRONOUS')}
                                    />
                                    <strong>{t('onboarding.sync')}</strong>
                                    <p className="mt-1 text-sm text-muted-foreground">{t('onboarding.syncDescription')}</p>
                                </label>
                                <label
                                    className={`cursor-pointer rounded-lg border p-4 ${
                                        operationMode === 'FREE' ? 'border-foreground bg-muted' : 'border-border'
                                    }`}
                                >
                                    <input
                                        className="sr-only"
                                        type="radio"
                                        checked={operationMode === 'FREE'}
                                        onChange={() => setOperationMode('FREE')}
                                    />
                                    <strong>{t('onboarding.free')}</strong>
                                    <p className="mt-1 text-sm text-muted-foreground">{t('onboarding.freeDescription')}</p>
                                </label>
                            </div>
                        </fieldset>
                        {error && <p className="text-sm text-danger">{error}</p>}
                        <Button className="w-full" disabled={saving}>
                            {saving ? t('onboarding.saving') : t('onboarding.submit')}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </main>
    );
}