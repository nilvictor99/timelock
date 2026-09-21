import * as React from 'react';
import { router } from '@inertiajs/react';
import { Html5Qrcode } from 'html5-qrcode';
import { Button } from '@/Components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/Card';
import { Input } from '@/Components/ui/Input';
import { useI18n } from '@/lib/i18n';
import { apiPost } from '@/lib/api';

export default function QrLogin() {
    const { t } = useI18n();
    const [token, setToken] = React.useState('');
    const [error, setError] = React.useState<string | null>(null);
    const [scanning, setScanning] = React.useState(false);
    const scannerRef = React.useRef<Html5Qrcode | null>(null);

    async function complete(rawToken: string) {
        try {
            const response = await apiPost<{ redirect?: string }>('/auth/qr-login', { token: rawToken });
            router.visit(response.redirect ?? '/dashboard');
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : String(cause));
            setScanning(false);
        }
    }

    async function startScanner() {
        if (!scannerRef.current) {
            scannerRef.current = new Html5Qrcode('qr-login-scanner');
        }
        setError(null);
        try {
            await scannerRef.current.start(
                { facingMode: 'environment' },
                { fps: 10, qrbox: { width: 220, height: 220 } },
                (text) => {
                    void (async () => {
                        await stopScanner();
                        await complete(text);
                    })();
                },
                () => undefined,
            );
            setScanning(true);
        } catch {
            setError(t('qrlogin.cameraError'));
        }
    }

    async function stopScanner() {
        if (scannerRef.current) {
            try {
                await scannerRef.current.stop();
                scannerRef.current.clear();
            } catch {
                //
            }
        }
        setScanning(false);
    }

    React.useEffect(() => () => void stopScanner(), []);

    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>{t('qrlogin.title')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">{t('qrlogin.explanation')}</p>

                    <div className="flex justify-center">
                        {scanning ? (
                            <div id="qr-login-scanner" className="overflow-hidden rounded-lg border border-border" />
                        ) : (
                            <button
                                type="button"
                                className="flex h-40 w-40 items-center justify-center rounded-lg border border-dashed border-input text-muted-foreground"
                                onClick={() => void startScanner()}
                            >
                                {t('qrlogin.scan')}
                            </button>
                        )}
                    </div>

                    <div className="my-2 flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="h-px flex-1 bg-border" />
                        {t('qrlogin.or')}
                        <span className="h-px flex-1 bg-border" />
                    </div>

                    <form
                        className="space-y-2"
                        onSubmit={(event) => {
                            event.preventDefault();
                            if (token.trim()) {
                                setError(null);
                                void complete(token.trim());
                            }
                        }}
                    >
                        <Input
                            value={token}
                            onChange={(event) => setToken(event.target.value)}
                            placeholder={t('qrlogin.inputPlaceholder')}
                            autoComplete="off"
                        />
                        <Button className="w-full" type="submit" disabled={!token.trim() || scanning}>
                            {t('qrlogin.submit')}
                        </Button>
                    </form>

                    {error && <p className="rounded-lg bg-danger/10 p-3 text-sm text-danger">{error}</p>}
                </CardContent>
            </Card>
        </div>
    );
}