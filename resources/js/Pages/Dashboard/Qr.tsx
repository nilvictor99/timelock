import * as React from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Button } from '@/Components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/Card';
import { QrCode } from '@/Components/QrCode';
import { useI18n } from '@/lib/i18n';
import { apiGet, apiPost } from '@/lib/api';

type QrPayload = {
    token: string;
    expiresAt: string;
};

export default function Qr() {
    const { t } = useI18n();
    const [qr, setQr] = React.useState<QrPayload | null>(null);
    const [error, setError] = React.useState<string | null>(null);
    const [secondsLeft, setSecondsLeft] = React.useState(0);

    const generate = React.useCallback(() => {
        apiGet<QrPayload>('/auth/qr')
            .then(setQr)
            .catch((cause) => setError(cause instanceof Error ? cause.message : String(cause)));
    }, []);

    React.useEffect(() => {
        if (qr) {
            setSecondsLeft(Math.max(0, Math.round((new Date(qr.expiresAt).getTime() - Date.now()) / 1000)));
        }
    }, [qr]);

    React.useEffect(() => {
        generate();
    }, [generate]);

    React.useEffect(() => {
        const interval = setInterval(() => {
            setSecondsLeft((current) => {
                if (current <= 1) {
                    generate();
                    return 0;
                }
                return current - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [generate]);

    async function consumeHere() {
        if (!qr) {
            return;
        }
        setError(null);
        try {
            await apiPost('/auth/qr-login', { token: qr.token });
            generate();
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : String(cause));
            generate();
        }
    }

    return (
        <DashboardLayout>
            <Card className="mx-auto max-w-md">
                <CardHeader>
                    <CardTitle>{t('qr.title')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">{t('qr.explanation')}</p>
                    <div className="flex justify-center">
                        {qr ? (
                            <QrCode value={qr.token} />
                        ) : (
                            <div className="h-[222px] w-[222px] animate-pulse rounded-lg border border-border bg-muted" />
                        )}
                    </div>
                    <div className="text-center text-sm text-muted-foreground">
                        {t('qr.expires')}: {secondsLeft}s
                    </div>
                    {error && <p className="rounded-lg bg-danger/10 p-3 text-sm text-danger">{error}</p>}
                    <div className="flex justify-center gap-2">
                        <Button variant="outline" size="sm" onClick={generate}>
                            {t('qr.refresh')}
                        </Button>
                        <Button size="sm" onClick={() => void consumeHere()}>
                            {t('qr.test')}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </DashboardLayout>
    );
}