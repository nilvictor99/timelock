import * as React from 'react';
import { Link, router, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import QrScanner from '@/Components/Auth/QrScanner';
import { useI18n } from '@/lib/i18n';
import { apiPost } from '@/lib/api';
import type { CameraErrorKind } from '@/lib/camera';

const QR_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

const CAMERA_ERROR_KEYS: Record<CameraErrorKind, string> = {
    'insecure-context': 'camera.error.insecureContext',
    'no-camera': 'camera.error.noCamera',
    'permission-denied': 'camera.error.permissionDenied',
    'in-use': 'camera.error.inUse',
    'not-found': 'camera.error.notFound',
    unsupported: 'camera.error.unsupported',
    unknown: 'camera.error.unknown',
};

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

    function handleScan(value: string): boolean {
        const token = normalizeQrValue(value);
        if (!token) {
            setScannerError(t('qrScanError'));
            return false;
        }

        setQrToken(token);
        setShowScanner(false);
        setScannerError('');
        void authenticate(token);

        return true;
    }

    const serverError = Object.values(errors)[0] as string | undefined;

    const dialogRef = React.useRef<HTMLDivElement | null>(null);

    React.useEffect(() => {
        if (!showScanner) return;

        const dialog = dialogRef.current;
        dialog?.focus();

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setShowScanner(false);
                return;
            }
            if (event.key !== 'Tab' || !dialog) return;

            const focusable = Array.from(
                dialog.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, video, [tabindex]'),
            ).filter((element) => element.getAttribute('tabindex') !== '-1' && !element.hasAttribute('disabled'));

            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (!first || !last) return;

            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        };

        document.addEventListener('keydown', onKeyDown);

        return () => document.removeEventListener('keydown', onKeyDown);
    }, [showScanner]);

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
                <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/60 p-2 sm:p-4">
                    <div
                        ref={dialogRef}
                        role="dialog"
                        aria-modal="true"
                        aria-label={t('qrScannerTitle')}
                        tabIndex={-1}
                        className="w-full max-w-md focus:outline-none"
                    >
                        <Card>
                            <CardHeader className="space-y-1 p-4 pb-2 sm:p-5 sm:pb-2">
                                <CardTitle>{t('qrScannerTitle')}</CardTitle>
                                <p className="text-sm text-muted-foreground">{t('scanInstructions')}</p>
                            </CardHeader>
                            <CardContent className="space-y-3 p-4 pt-0 sm:p-5 sm:pt-0">
                                <QrScanner
                                    onDetected={handleScan}
                                    onError={(kind) => setScannerError(t(CAMERA_ERROR_KEYS[kind]))}
                                    onInvalidQr={() => setScannerError(t('qrScanError'))}
                                />
                                {scannerError && (
                                    <p className="rounded-md border border-danger p-3 text-sm text-danger">{scannerError}</p>
                                )}
                                <Button
                                    variant="outline"
                                    className="w-full"
                                    onClick={() => {
                                        setScannerError('');
                                        setShowScanner(false);
                                    }}
                                >
                                    {t('cancel')}
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}
        </main>
    );
}