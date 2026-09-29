import * as React from 'react';
import QRCode from 'qrcode';
import { Copy, Download, Loader2, RefreshCw, ShieldCheck, TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { QrCode } from '@/Components/QrCode';
import { useI18n } from '@/lib/i18n';
import { apiPost } from '@/lib/api';

/**
 * Whitelist keys, in the order the panel offers them. The server owns the
 * meaning of each key (config/qr.php) and rejects anything not listed here, so
 * adding an option is a two-sided change on purpose.
 */
const TTL_OPTIONS = ['never', '5m', '10m', '1d', '1w', '1m'] as const;
const USE_OPTIONS = ['1', '5', '10', '25', 'unlimited'] as const;

/**
 * The login link is redundant next to the QR image, which already encodes it,
 * and it is the widest string in the panel. The value stays in `qr.loginUrl`
 * (and in the QR itself) so turning it back on is a one-line change.
 */
const SHOW_LOGIN_LINK = false;

/**
 * "Probar en este dispositivo" spends the current QR on purpose: it logs in
 * with it, burning a use (or the whole token) and forcing a regeneration. Useful
 * to check a QR without a second phone, destructive for anyone who clicks it by
 * accident, so the UI does not offer it. Kept here because the flow is the one
 * the E2E exercises, and turning it back on is a one-line change.
 */
const SHOW_TEST_ACTION = false;

const TTL_LABELS: Record<(typeof TTL_OPTIONS)[number], string> = {
    never: 'qr.ttl.never',
    '5m': 'qr.ttl.5m',
    '10m': 'qr.ttl.10m',
    '1d': 'qr.ttl.1d',
    '1w': 'qr.ttl.1w',
    '1m': 'qr.ttl.1m',
};

const USE_LABELS: Record<(typeof USE_OPTIONS)[number], string> = {
    '1': 'qr.uses.1',
    '5': 'qr.uses.5',
    '10': 'qr.uses.10',
    '25': 'qr.uses.25',
    unlimited: 'qr.uses.unlimited',
};

type Qr = {
    token: string;
    loginUrl: string;
    imageUrl: string;
    /** null when the token never expires. */
    expiresAt: string | null;
    maxUses: number | null;
    perpetual: boolean;
};

const formatCountdown = (totalSeconds: number): string => {
    const safe = Math.max(0, totalSeconds);
    const minutes = Math.floor(safe / 60);
    const seconds = safe % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

export default function QrLoginPanel() {
    const { t, locale } = useI18n();
    const [ttl, setTtl] = React.useState<(typeof TTL_OPTIONS)[number]>('10m');
    const [uses, setUses] = React.useState<(typeof USE_OPTIONS)[number]>('1');
    const [qr, setQr] = React.useState<Qr | null>(null);
    const [now, setNow] = React.useState(() => Date.now());
    const [generating, setGenerating] = React.useState(false);
    const [consuming, setConsuming] = React.useState(false);
    const [error, setError] = React.useState('');
    const [info, setInfo] = React.useState('');

    const generate = React.useCallback(async (successMessage = '') => {
        setGenerating(true);
        setError('');
        setInfo('');

        try {
            const result = await apiPost<{
                token: string;
                expiresAt: string | null;
                maxUses: number | null;
                perpetual: boolean;
            }>('/auth/qr', { ttl, uses });

            const loginUrl = `${window.location.origin}/login?qr=${encodeURIComponent(result.token)}`;

            setQr({
                token: result.token,
                loginUrl,
                imageUrl: await QRCode.toDataURL(loginUrl, { margin: 2, width: 240 }),
                expiresAt: result.expiresAt,
                maxUses: result.maxUses,
                perpetual: result.perpetual,
            });
            setNow(Date.now());
            setInfo(successMessage);
        } catch (cause) {
            setQr(null);
            setError(cause instanceof Error ? cause.message : t('saveError'));
        } finally {
            setGenerating(false);
        }
    }, [t, ttl, uses]);

    React.useEffect(() => {
        if (!qr) return;
        const interval = window.setInterval(() => setNow(Date.now()), 1000);
        return () => window.clearInterval(interval);
    }, [qr]);

    /**
     * Counted from the real deadline the server sent. The old panel counted down
     * a fixed 60s and silently minted a new QR when it hit zero, which had
     * nothing to do with the 10 minutes the token actually lasted.
     */
    const secondsLeft = qr?.expiresAt
        ? Math.max(0, Math.round((new Date(qr.expiresAt).getTime() - now) / 1000))
        : null;
    const expired = qr !== null && secondsLeft === 0;

    const downloadPng = () => {
        if (!qr) return;
        const link = document.createElement('a');
        link.href = qr.imageUrl;
        link.download = 'timelock-qr-login.png';
        link.click();
    };

    const downloadPdf = async () => {
        if (!qr) return;
        const { jsPDF } = await import('jspdf');
        const pdf = new jsPDF({ format: 'a4', unit: 'mm' });
        pdf.setFontSize(18);
        pdf.text('TimeLock-v', 20, 25);
        pdf.setFontSize(13);
        pdf.text(t('qrLogin'), 20, 35);
        pdf.addImage(qr.imageUrl, 'PNG', 20, 45, 70, 70);
        pdf.setFontSize(10);
        pdf.text(t('qrExpires'), 20, 125);
        pdf.text(
            qr.expiresAt ? new Date(qr.expiresAt).toLocaleString(locale) : t('qr.ttl.never'),
            20,
            133,
        );
        pdf.save('timelock-qr-login.pdf');
    };

    const testHere = async () => {
        if (!qr) return;
        setConsuming(true);
        setError('');
        setInfo('');

        try {
            await apiPost<{ ok: boolean }>('/auth/qr-login', { token: qr.token });
            // The token is single active, so testing it spends or shortens it
            // and the panel must not keep showing a QR that is no longer there.
            // The message has to travel with the regeneration, otherwise
            // generate() clears it on its way in.
            await generate(t('qrTestDone'));
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : t('saveError'));
        } finally {
            setConsuming(false);
        }
    };

    const copy = (value: string, key: 'copied') => {
        void navigator.clipboard?.writeText(value);
        setInfo(t(key));
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <ShieldCheck size={18} aria-hidden="true" /> {t('security')}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{t('qrPanelIntro')}</p>

                <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block text-sm font-medium">
                        {t('qrTtlLabel')}
                        <Select value={ttl} onValueChange={(value) => setTtl(value as typeof ttl)}>
                            <SelectTrigger className="mt-2 w-full" aria-label={t('qrTtlLabel')}>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {TTL_OPTIONS.map((option) => (
                                    <SelectItem key={option} value={option}>
                                        {t(TTL_LABELS[option])}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </label>

                    <label className="block text-sm font-medium">
                        {t('qrUsesLabel')}
                        <Select value={uses} onValueChange={(value) => setUses(value as typeof uses)}>
                            <SelectTrigger className="mt-2 w-full" aria-label={t('qrUsesLabel')}>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {USE_OPTIONS.map((option) => (
                                    <SelectItem key={option} value={option}>
                                        {t(USE_LABELS[option])}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </label>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <Button onClick={() => void generate()} disabled={generating}>
                        {generating ? (
                            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                        ) : (
                            <RefreshCw className="size-4" aria-hidden="true" />
                        )}
                        {qr ? t('qrRegenerate') : t('generateQr')}
                    </Button>
                    {qr && (
                        <>
                            <Badge variant="default">{t(TTL_LABELS[ttl])}</Badge>
                            <Badge variant="default">{t(USE_LABELS[uses])}</Badge>
                            {secondsLeft !== null && (
                                <Badge variant={expired ? 'danger' : 'default'}>
                                    {t('qr.expires')} {formatCountdown(secondsLeft)}
                                </Badge>
                            )}
                        </>
                    )}
                </div>

                {error && <p className="rounded-md border border-danger p-3 text-sm text-danger">{error}</p>}
                {info && !error && <p className="text-xs text-muted-foreground">{info}</p>}

                {qr && (
                    <>
                        {qr.perpetual && (
                            <p className="flex items-start gap-2 rounded-md border border-warning p-3 text-sm text-warning">
                                <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                                {t('qrPerpetualWarning')}
                            </p>
                        )}

                        {/*
                         * The Security card lives in a half-width column of the
                         * Profile grid, so a viewport breakpoint (lg:) would fire
                         * while the container is still ~420px and squeeze the data
                         * column. Container queries answer the question that is
                         * actually being asked: how much room is there?
                         */}
                        <div className="@container">
                            <div className="flex flex-col gap-6 @2xl:flex-row @2xl:items-start">
                            <div className="shrink-0 self-start">
                                <div className="rounded-lg border bg-white p-2">
                                    <QrCode value={qr.loginUrl} size={224} />
                                    <p className="mt-2 text-center text-xs text-slate-700">{t('qrScan')}</p>
                                </div>
                            </div>

                            <div className="min-w-0 flex-1 space-y-4">
                                <dl className="grid gap-2 @md:grid-cols-[minmax(0,11rem)_1fr] @md:gap-x-4 @md:gap-y-2">
                                    <dt className="text-xs font-medium text-muted-foreground">{t('qrValidUntil')}</dt>
                                    <dd className="min-w-0 text-sm">
                                        {qr.expiresAt
                                            ? new Date(qr.expiresAt).toLocaleString(locale)
                                            : t('qrNoExpiry')}
                                    </dd>

                                    {SHOW_LOGIN_LINK && (
                                        <>
                                            <dt className="text-xs font-medium text-muted-foreground">{t('qrLink')}</dt>
                                            <dd className="min-w-0 break-all text-sm">{qr.loginUrl}</dd>
                                        </>
                                    )}
                                </dl>

                                <div className="flex flex-wrap items-center gap-2 rounded-md border bg-muted/40 px-3 py-2">
                                    <span className="text-xs font-medium text-muted-foreground">{t('qrToken')}</span>
                                    <code className="min-w-0 flex-1 break-all font-mono text-xs">{qr.token}</code>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="shrink-0"
                                        onClick={() => copy(qr.token, 'copied')}
                                    >
                                        <Copy size={15} /> {t('copyToken')}
                                    </Button>
                                    {SHOW_LOGIN_LINK && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="shrink-0"
                                            onClick={() => copy(qr.loginUrl, 'copied')}
                                        >
                                            <Copy size={15} /> {t('copyLink')}
                                        </Button>
                                    )}
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    <Button variant="outline" size="sm" onClick={downloadPng}>
                                        <Download size={15} /> {t('downloadPng')}
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={() => void downloadPdf()}>
                                        <Download size={15} /> {t('downloadPdf')}
                                    </Button>
                                    {SHOW_TEST_ACTION && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={consuming}
                                            onClick={() => void testHere()}
                                        >
                                            {t('qr.test')}
                                        </Button>
                                    )}
                                </div>

                                <p className="rounded-md border border-warning/40 bg-warning/5 px-3 py-2 text-xs text-warning">
                                    {t('qrDownloadWarning')}
                                </p>
                            </div>
                            </div>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
}
