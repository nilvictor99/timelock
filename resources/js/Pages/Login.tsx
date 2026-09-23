import * as React from 'react';
import { Link, router, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import QrScanner from '@/Components/Auth/QrScanner';
import { useI18n } from '@/lib/i18n';
import { apiPost } from '@/lib/api';

const QR_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

function normalizeQrValue(value: string): string | null {
    const trimmed = value.trim();
    if (QR_TOKEN_PATTERN.test(trimmed)) return trimmed;
    try {
        const parsed = new URL(trimmed, window.location.origin);
        if (parsed.origin !== window.location.origin) return null;
        const token = parsed.searchParams.get('qr')?.trim() ?? '';
        return QR_TOKEN_PATTERN.test(token) ? token : null;
    } catch {
        return null;
    }
}

export default function Login() {
    const { t } = useI18n();
    const { data, setData, post, processing, errors } = useForm({
        email: '',
        password: '',
        remember: true,
    });
    const [qrMode, setQrMode] = React.useState(() => {
        const token = new URLSearchParams(window.location.search).get('qr');
        return token !== null && token !== '';
    });
    const [qrToken, setQrToken] = React.useState(() => {
        const token = new URLSearchParams(window.location.search).get('qr') ?? '';
        return normalizeQrValue(token) ?? token.trim();
    });
    const [showScanner, setShowScanner] = React.useState(false);
    const [scannerError, setScannerError] = React.useState('');
    const [error, setError] = React.useState('');
    const [loading, setLoading] = React.useState(false);

    async function authenticate(tokenOverride?: string) {
        setError('');
        setLoading(true);
        const token = normalizeQrValue(tokenOverride ?? qrToken);
        if (!token) {
            setLoading(false);
            setError(t('qrScanError'));
            return;
        }
        try {
            const result = await apiPost<{ ok: boolean; redirect?: string }>('/auth/qr-login', { token });
            router.visit(result.redirect ?? '/dashboard');
        } catch (cause) {
            setLoading(false);
            setError(cause instanceof Error ? cause.message : t('qrScanError'));
        }
    }

    function handleScan(value: string) {
        const token = normalizeQrValue(value);
        if (token) {
            setQrToken(token);
            setShowScanner(false);
            setScannerError('');
            void authenticate(token);
        } else {
            setScannerError(t('qrScanError'));
        }
    }

    const serverError = Object.values(errors)[0] as string | undefined;

    return (
        <main className="grid min-h-screen place-items-center bg-muted/30 p-6">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <Link href="/" className="mb-5 text-sm font-semibold">
                        TimeLock<span className="text-info">-v</span>
                    </Link>
                    <CardTitle>{qrMode ? t('qrLoginAction') : t('login.title')}</CardTitle>
                    <p className="text-sm text-muted-foreground">{t('login.subtitle')}</p>
                </CardHeader>
                <CardContent>
                    {qrMode ? (
                        <form
                            className="space-y-4"
                            onSubmit={(event) => {
                                event.preventDefault();
                                void authenticate();
                            }}
                        >
                            <label className="block text-sm font-medium">
                                {t('qrToken')}
                                <Input
                                    className="mt-2"
                                    value={qrToken}
                                    onChange={(event) => setQrToken(event.target.value)}
                                    required
                                />
                            </label>
                            <button
                                type="button"
                                className="w-full rounded-md border border-border px-3 py-2 text-sm hover:bg-muted"
                                onClick={() => {
                                    setScannerError('');
                                    setShowScanner(true);
                                }}
                            >
                                {t('qrScannerTitle')}
                            </button>
                            {error && (
                                <p className="rounded-md border border-danger p-3 text-sm text-danger">{error}</p>
                            )}
                            <Button className="w-full" disabled={loading}>
                                {loading ? t('login.processing') : t('qrLoginAction')}
                            </Button>
                            <button
                                type="button"
                                className="w-full text-sm font-medium text-foreground underline"
                                onClick={() => setQrMode(false)}
                            >
                                {t('login.submit')}
                            </button>
                        </form>
                    ) : (
                        <form
                            className="space-y-4"
                            onSubmit={(event) => {
                                event.preventDefault();
                                post('/login');
                            }}
                        >
                            <label className="block text-sm font-medium">
                                {t('login.email')}
                                <Input
                                    className="mt-2"
                                    type="email"
                                    value={data.email}
                                    onChange={(event) => setData('email', event.target.value)}
                                    required
                                    autoComplete="email"
                                />
                            </label>
                            <label className="block text-sm font-medium">
                                {t('login.password')}
                                <Input
                                    className="mt-2"
                                    type="password"
                                    value={data.password}
                                    onChange={(event) => setData('password', event.target.value)}
                                    required
                                    minLength={12}
                                    autoComplete="current-password"
                                />
                                <span className="mt-1 block text-xs text-muted-foreground">{t('login.passwordHint')}</span>
                            </label>
                            <label className="flex items-center gap-2 text-sm">
                                <Checkbox
                                    checked={data.remember}
                                    onCheckedChange={(checked) => setData('remember', checked === true)}
                                />
                                {t('login.remember')}
                            </label>
                            {serverError && (
                                <p className="rounded-md border border-danger p-3 text-sm text-danger">{serverError}</p>
                            )}
                            <Button type="submit" className="w-full" disabled={processing}>
                                {processing ? t('login.processing') : t('login.submit')}
                            </Button>
                            <p className="text-center text-sm text-muted-foreground">
                                {t('login.noAccount')}{' '}
                                <Link href="/register" className="font-medium text-foreground underline">
                                    {t('login.register')}
                                </Link>
                            </p>
                            <button type="button" className="w-full text-sm underline" onClick={() => setQrMode(true)}>
                                {t('qrLoginAction')}
                            </button>
                        </form>
                    )}
                </CardContent>
            </Card>
            {showScanner && (
                <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
                    <Card className="w-full max-w-md">
                        <CardHeader>
                            <CardTitle>{t('qrScannerTitle')}</CardTitle>
                            <p className="text-sm text-muted-foreground">{t('scanInstructions')}</p>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <QrScanner
                                onDetected={handleScan}
                                onError={(kind) =>
                                    setScannerError(kind === 'camera' ? t('cameraPermission') : t('qrScanError'))
                                }
                            />
                            {scannerError && (
                                <p className="rounded-md border border-danger p-3 text-sm text-danger">{scannerError}</p>
                            )}
                            <Button variant="outline" className="w-full" onClick={() => setShowScanner(false)}>
                                {t('cancel')}
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            )}
        </main>
    );
}