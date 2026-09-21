import * as React from 'react';
import { Check, Download, Eye, EyeOff, Loader2, Pause, Play, RotateCcw, Trash2, XCircle } from 'lucide-react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Button } from '@/Components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/Card';
import { useTheme } from '@/lib/theme';
import { useI18n } from '@/lib/i18n';
import { apiDelete, apiGet, apiPost } from '@/lib/api';
import { useAutosave, type AutosaveStatus } from '@/lib/use-autosave';

const notificationOptions = [
    ['BEFORE_15', 'before15'],
    ['BEFORE_5', 'before5'],
    ['ON_COMPLETE', 'onComplete'],
    ['HOURLY', 'hourly'],
] as const;

const aiProviders = [
    ['', 'aiProviderNone'],
    ['NVIDIA_NIM', 'aiNvidia'],
    ['OPENROUTER', 'aiOpenrouter'],
    ['OPENAI', 'aiOpenai'],
    ['ANTHROPIC', 'aiAnthropic'],
    ['GOOGLE_GEMINI', 'aiGemini'],
    ['OLLAMA', 'aiOllama'],
    ['OPENCODE', 'aiOpencode'],
    ['CUSTOM', 'aiCustom'],
] as const;

type User = Record<string, any>;

function asNotificationTypes(value: unknown): string[] {
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function defaultTimeZone(user: User) {
    return user.timezoneOverride ?? user.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'UTC';
}

export default function Settings() {
    const { theme, setTheme } = useTheme();
    const { t, locale, setLocale } = useI18n();
    const [user, setUser] = React.useState<User | null>(null);
    const [reason, setReason] = React.useState('');
    const [message, setMessage] = React.useState('');
    const [timezoneOverride, setTimezoneOverride] = React.useState('UTC');
    const [timeFormat, setTimeFormat] = React.useState('24');
    const [measurementUnit, setMeasurementUnit] = React.useState('METRIC');
    const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
    const [notificationTypes, setNotificationTypes] = React.useState<string[]>([]);
    const [notificationFrequency, setNotificationFrequency] = React.useState('ALL');
    const [quietHoursStart, setQuietHoursStart] = React.useState('');
    const [quietHoursEnd, setQuietHoursEnd] = React.useState('');
    const [voiceEnabled, setVoiceEnabled] = React.useState(false);
    const [notificationVoice, setNotificationVoice] = React.useState('');
    const [notifyVolume, setNotifyVolume] = React.useState(70);
    const [generationPersonalization, setGenerationPersonalization] = React.useState(70);
    const [avoidRecentActivities, setAvoidRecentActivities] = React.useState(false);
    const [recentActivitiesWindow, setRecentActivitiesWindow] = React.useState(7);
    const [includeCompletedHistory, setIncludeCompletedHistory] = React.useState(true);
    const [profileVisibility, setProfileVisibility] = React.useState('PRIVATE');
    const [aiProvider, setAiProvider] = React.useState('');
    const [aiModel, setAiModel] = React.useState('');
    const [aiBaseUrl, setAiBaseUrl] = React.useState('');
    const [aiTemperature, setAiTemperature] = React.useState(0.7);
    const [aiMaxTokens, setAiMaxTokens] = React.useState(500);
    const [aiKey, setAiKey] = React.useState('');
    const [showAiKey, setShowAiKey] = React.useState(false);
    const [testingAi, setTestingAi] = React.useState(false);
    const [aiFeedback, setAiFeedback] = React.useState<{ ok: boolean; text: string } | null>(null);
    const [loaded, setLoaded] = React.useState(false);
    const [deleteArmed, setDeleteArmed] = React.useState(false);
    const [deleteEmail, setDeleteEmail] = React.useState('');
    const [deletePhrase, setDeletePhrase] = React.useState('');
    const [detectedTimezone, setDetectedTimezone] = React.useState('UTC');

    const load = async () => {
        try {
            const data = await apiGet<{ user: User }>('/api/bootstrap');
            const next = data.user;
            setUser(next);
            setLocale(next.language === 'en' ? 'en' : 'es');
            setReason(next.pauseReason ?? '');
            setTimezoneOverride(defaultTimeZone(next));
            setTimeFormat(next.timeFormat ?? '24');
            setMeasurementUnit(next.measurementUnit ?? 'METRIC');
            setNotificationsEnabled(next.notificationsEnabled ?? true);
            setNotificationTypes(asNotificationTypes(next.notificationTypes));
            setNotificationFrequency(next.notificationFrequency ?? 'ALL');
            setQuietHoursStart(next.quietHoursStart ?? '');
            setQuietHoursEnd(next.quietHoursEnd ?? '');
            setVoiceEnabled(Boolean(next.voiceEnabled));
            setNotificationVoice(next.notificationVoice ?? '');
            setNotifyVolume(Number.isInteger(next.notifyVolume) ? next.notifyVolume : 70);
            setGenerationPersonalization(next.generationPersonalization ?? 70);
            setAvoidRecentActivities(Boolean(next.avoidRecentActivities));
            setRecentActivitiesWindow(next.recentActivitiesWindow ?? 7);
            setIncludeCompletedHistory(next.includeCompletedHistory ?? true);
            setProfileVisibility(next.profileVisibility ?? 'PRIVATE');
            setAiProvider(next.aiProvider ?? '');
            setAiModel(next.aiModel ?? '');
            setAiBaseUrl(next.aiBaseUrl ?? '');
            setAiTemperature(next.aiTemperature ?? 0.7);
            setAiMaxTokens(next.aiMaxTokens ?? 500);
            setLoaded(true);
        } catch {
            // no-op: mantiene el estado vacío
        }
    };

    React.useEffect(() => {
        void load();
    }, []);

    const settingValues = React.useMemo(
        () => ({
            language: locale,
            theme: (theme ?? 'system').toUpperCase(),
            operationMode: user?.operationMode ?? 'SYNCHRONOUS',
            timezoneOverride,
            timeFormat,
            measurementUnit,
            notificationsEnabled,
            notificationTypes,
            notificationFrequency,
            quietHoursStart,
            quietHoursEnd,
            voiceEnabled,
            notifyVolume,
            notificationVoice,
            generationPersonalization,
            avoidRecentActivities,
            recentActivitiesWindow,
            includeCompletedHistory,
            profileVisibility,
            aiProvider,
            aiModel,
            aiBaseUrl,
            aiTemperature,
            aiMaxTokens,
        }),
        [
            aiBaseUrl,
            aiMaxTokens,
            aiModel,
            aiProvider,
            aiTemperature,
            avoidRecentActivities,
            generationPersonalization,
            includeCompletedHistory,
            locale,
            measurementUnit,
            notificationFrequency,
            notificationTypes,
            notificationVoice,
            notificationsEnabled,
            notifyVolume,
            profileVisibility,
            quietHoursEnd,
            quietHoursStart,
            recentActivitiesWindow,
            theme,
            timeFormat,
            timezoneOverride,
            user?.operationMode,
            voiceEnabled,
        ],
    );

    const setSettingValue = React.useCallback(
        (key: keyof typeof settingValues, value: unknown) => {
            switch (key) {
                case 'language':
                    setLocale(value as 'es' | 'en');
                    break;
                case 'theme':
                    setTheme(String(value).toLowerCase() as 'light' | 'dark' | 'system');
                    break;
                case 'operationMode':
                    setUser((current) => (current ? { ...current, operationMode: value } : current));
                    break;
                case 'timezoneOverride':
                    setTimezoneOverride(String(value ?? ''));
                    break;
                case 'timeFormat':
                    setTimeFormat(String(value));
                    break;
                case 'measurementUnit':
                    setMeasurementUnit(String(value));
                    break;
                case 'notificationsEnabled':
                    setNotificationsEnabled(Boolean(value));
                    break;
                case 'notificationTypes':
                    setNotificationTypes(Array.isArray(value) ? (value as string[]) : []);
                    break;
                case 'notificationFrequency':
                    setNotificationFrequency(String(value));
                    break;
                case 'quietHoursStart':
                    setQuietHoursStart(String(value ?? ''));
                    break;
                case 'quietHoursEnd':
                    setQuietHoursEnd(String(value ?? ''));
                    break;
                case 'voiceEnabled':
                    setVoiceEnabled(Boolean(value));
                    break;
                case 'notifyVolume':
                    setNotifyVolume(Number(value));
                    break;
                case 'notificationVoice':
                    setNotificationVoice(String(value ?? ''));
                    break;
                case 'generationPersonalization':
                    setGenerationPersonalization(Number(value));
                    break;
                case 'avoidRecentActivities':
                    setAvoidRecentActivities(Boolean(value));
                    break;
                case 'recentActivitiesWindow':
                    setRecentActivitiesWindow(Number(value));
                    break;
                case 'includeCompletedHistory':
                    setIncludeCompletedHistory(Boolean(value));
                    break;
                case 'profileVisibility':
                    setProfileVisibility(String(value));
                    break;
                case 'aiProvider':
                    setAiProvider(String(value ?? ''));
                    break;
                case 'aiModel':
                    setAiModel(String(value ?? ''));
                    break;
                case 'aiBaseUrl':
                    setAiBaseUrl(String(value ?? ''));
                    break;
                case 'aiTemperature':
                    setAiTemperature(Number(value));
                    break;
                case 'aiMaxTokens':
                    setAiMaxTokens(Number(value));
                    break;
            }
        },
        [setLocale, setTheme],
    );

    const saveSetting = React.useCallback(
        async (key: keyof typeof settingValues, value: unknown) => {
            const nullable = [
                'timezoneOverride',
                'quietHoursStart',
                'quietHoursEnd',
                'notificationVoice',
                'aiProvider',
                'aiModel',
                'aiBaseUrl',
            ].includes(String(key));
            const payloadValue = nullable && value === '' ? null : value;
            try {
                setUser(await apiPost<User>('/api/bootstrap', { action: 'settings', [key]: payloadValue }));
                setMessage(t('saved'));
                return true;
            } catch {
                setMessage(t('saveError'));
                return false;
            }
        },
        [t],
    );

    const { statuses, revert } = useAutosave({
        values: settingValues,
        ready: loaded && Boolean(user),
        save: (key, value) => saveSetting(key, value),
        onRevert: (key, value) => setSettingValue(key, value),
    });

    function update(body: Record<string, unknown>) {
        Object.entries(body).forEach(([key, value]) => {
            if (key in settingValues) setSettingValue(key as keyof typeof settingValues, value);
        });
    }

    async function togglePause() {
        try {
            setUser(await apiPost<User>('/api/bootstrap', { action: 'pause', active: !user?.pauseActive, reason }));
            setMessage(t('saved'));
        } catch {
            setMessage(t('saveError'));
        }
    }

    function toggleNotificationType(type: string) {
        setNotificationTypes((current) =>
            current.includes(type) ? current.filter((item) => item !== type) : [...current, type],
        );
    }

    async function testAiConnection() {
        if (!aiKey) {
            setAiFeedback({ ok: false, text: t('aiEnterKey') });
            return;
        }
        setTestingAi(true);
        setAiFeedback(null);
        try {
            await apiPost('/api/ai/test-connection', {
                provider: aiProvider,
                model: aiModel || undefined,
                baseUrl: aiBaseUrl || undefined,
                apiKey: aiKey,
            });
            setAiFeedback({ ok: true, text: t('aiConnectionSuccess') });
        } catch (cause) {
            setAiFeedback({ ok: false, text: `${t('aiConnectionError')}: ${cause instanceof Error ? cause.message : t('saveError')}` });
        } finally {
            setTestingAi(false);
        }
    }

    function exportData(format: 'json' | 'csv') {
        window.location.href = `/api/export?format=${format}`;
    }

    async function exportPdf() {
        try {
            const exported = await apiGet<{ user?: User; activities?: Array<{ title: string; startAt: string; status: string }> }>('/api/export?format=json');
            const { jsPDF } = await import('jspdf');
            const pdf = new jsPDF();
            pdf.setFontSize(16);
            pdf.text('TimeLock-v', 14, 18);
            pdf.setFontSize(10);
            pdf.text(`${exported.user?.name ?? ''} · ${new Date().toLocaleString()}`, 14, 26);
            let y = 38;
            for (const activity of exported.activities ?? []) {
                const line = `${activity.title} · ${new Date(activity.startAt).toLocaleString()} · ${activity.status}`;
                pdf.text(line.slice(0, 105), 14, y);
                y += 7;
                if (y > 280) {
                    pdf.addPage();
                    y = 18;
                }
            }
            pdf.save('timelock-export.pdf');
        } catch {
            setMessage(t('saveError'));
        }
    }

    async function deleteAccount() {
        if (!user?.email) {
            setMessage(t('deletionError'));
            return;
        }
        try {
            await apiDelete('/api/bootstrap', { email: deleteEmail, confirmation: deletePhrase });
            window.location.href = '/login';
        } catch {
            setMessage(t('deletionError'));
        }
    }

    React.useEffect(() => {
        setDetectedTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC');
    }, []);

    if (!user) {
        return (
            <DashboardLayout>
                <div className="text-sm text-muted-foreground">{t('loading')}</div>
            </DashboardLayout>
        );
    }

    const inputClass = 'mt-2 h-10 w-full rounded-md border border-input bg-background px-3 text-sm';
    return (
        <DashboardLayout>
            <div className="mx-auto max-w-5xl space-y-6">
                <div>
                    <h1 className="text-3xl font-bold">{t('settings')}</h1>
                    <p className="text-sm text-muted-foreground">{t('preferences')}</p>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('preferences')}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-5">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <label className="text-sm font-medium">
                                    {t('language')}
                                    <select
                                        className={inputClass}
                                        value={locale}
                                        onChange={(event) => {
                                            const next = event.target.value as 'es' | 'en';
                                            setLocale(next);
                                            update({ language: next });
                                        }}
                                    >
                                        <option value="es">{t('spanish')}</option>
                                        <option value="en">{t('english')}</option>
                                    </select>
                                </label>
                                <label className="text-sm font-medium">
                                    {t('theme')}
                                    <select
                                        className={inputClass}
                                        value={theme}
                                        onChange={(event) => {
                                            const next = event.target.value;
                                            setTheme(next as 'light' | 'dark' | 'system');
                                            update({ theme: next.toUpperCase() });
                                        }}
                                    >
                                        <option value="light">{t('light')}</option>
                                        <option value="dark">{t('dark')}</option>
                                        <option value="system">{t('system')}</option>
                                    </select>
                                </label>
                            </div>
                            <label className="block text-sm font-medium">
                                {t('operationMode')}
                                <select className={inputClass} value={user.operationMode} onChange={(event) => update({ operationMode: event.target.value })}>
                                    <option value="SYNCHRONOUS">{t('sync')}</option>
                                    <option value="FREE">{t('free')}</option>
                                </select>
                            </label>
                            <div className="space-y-1">
                                <AutoStatus status={statuses.language} onRevert={() => revert('language')} t={t} />
                                <AutoStatus status={statuses.theme} onRevert={() => revert('theme')} t={t} />
                                <AutoStatus status={statuses.operationMode} onRevert={() => revert('operationMode')} t={t} />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>{t('formatRegion')}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <label className="block text-sm font-medium">
                                {t('timezoneOverride')}
                                <div className="mt-2 flex gap-2">
                                    <input
                                        list="timezone-options"
                                        className="h-10 min-w-0 flex-1 rounded-md border border-input bg-background px-3 text-sm"
                                        value={timezoneOverride}
                                        onChange={(event) => setTimezoneOverride(event.target.value)}
                                    />
                                    <Button type="button" variant="outline" size="sm" onClick={() => setTimezoneOverride(detectedTimezone)}>
                                        {t('detectTimezone')}
                                    </Button>
                                </div>
                                <datalist id="timezone-options">
                                    <option value="UTC" />
                                    <option value="America/Mexico_City" />
                                    <option value="America/New_York" />
                                    <option value="America/Los_Angeles" />
                                    <option value="Europe/Madrid" />
                                    <option value="Europe/London" />
                                </datalist>
                            </label>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <label className="text-sm font-medium">
                                    {t('timeFormat')}
                                    <select className={inputClass} value={timeFormat} onChange={(event) => setTimeFormat(event.target.value)}>
                                        <option value="12">{t('hour12')}</option>
                                        <option value="24">{t('hour24')}</option>
                                    </select>
                                </label>
                                <label className="text-sm font-medium">
                                    {t('measurementUnit')}
                                    <select className={inputClass} value={measurementUnit} onChange={(event) => setMeasurementUnit(event.target.value)}>
                                        <option value="METRIC">{t('metric')}</option>
                                        <option value="IMPERIAL">{t('imperial')}</option>
                                    </select>
                                </label>
                            </div>
                            <AutoStatus status={statuses.timezoneOverride} onRevert={() => revert('timezoneOverride')} t={t} />
                            <AutoStatus status={statuses.timeFormat} onRevert={() => revert('timeFormat')} t={t} />
                            <AutoStatus status={statuses.measurementUnit} onRevert={() => revert('measurementUnit')} t={t} />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>{t('notifications')}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <label className="flex items-center gap-3 text-sm font-medium">
                                <input type="checkbox" checked={notificationsEnabled} onChange={(event) => setNotificationsEnabled(event.target.checked)} />
                                {t('notificationsEnabled')}
                            </label>
                            <fieldset className="space-y-2">
                                <legend className="text-sm font-medium">{t('notificationTypes')}</legend>
                                {notificationOptions.map(([value, label]) => (
                                    <label key={value} className="flex items-center gap-3 text-sm">
                                        <input type="checkbox" checked={notificationTypes.includes(value)} onChange={() => toggleNotificationType(value)} />
                                        {t(label)}
                                    </label>
                                ))}
                            </fieldset>
                            <label className="block text-sm font-medium">
                                {t('notificationFrequency')}
                                <select className={inputClass} value={notificationFrequency} onChange={(event) => setNotificationFrequency(event.target.value)}>
                                    <option value="ALL">{t('allNotifications')}</option>
                                    <option value="IMPORTANT">{t('importantNotifications')}</option>
                                    <option value="MUTED">{t('mutedNotifications')}</option>
                                </select>
                            </label>
                            <div>
                                <p className="text-sm font-medium">{t('quietHours')}</p>
                                <div className="mt-2 grid gap-4 sm:grid-cols-2">
                                    <label className="text-sm">
                                        {t('from')}
                                        <input type="time" className={inputClass} value={quietHoursStart} onChange={(event) => setQuietHoursStart(event.target.value)} />
                                    </label>
                                    <label className="text-sm">
                                        {t('to')}
                                        <input type="time" className={inputClass} value={quietHoursEnd} onChange={(event) => setQuietHoursEnd(event.target.value)} />
                                    </label>
                                </div>
                            </div>
                            <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
                                <label className="flex items-center gap-3 text-sm font-medium">
                                    <input type="checkbox" checked={voiceEnabled} onChange={(event) => setVoiceEnabled(event.target.checked)} />
                                    {t('notificationVoice')}
                                </label>
                                <label className="text-sm">
                                    {t('volume')}
                                    <input type="range" className="mt-3 w-full" min="0" max="100" value={notifyVolume} onChange={(event) => setNotifyVolume(Number(event.target.value))} />
                                </label>
                            </div>
                            <label className="block text-sm font-medium">
                                {t('notificationVoice')}
                                <input className={inputClass} value={notificationVoice} placeholder={t('defaultVoice')} onChange={(event) => setNotificationVoice(event.target.value)} />
                            </label>
                            <AutoStatus status={statuses.notificationsEnabled} onRevert={() => revert('notificationsEnabled')} t={t} />
                            <AutoStatus status={statuses.notificationTypes} onRevert={() => revert('notificationTypes')} t={t} />
                            <AutoStatus status={statuses.notificationFrequency} onRevert={() => revert('notificationFrequency')} t={t} />
                            <AutoStatus status={statuses.quietHoursStart} onRevert={() => revert('quietHoursStart')} t={t} />
                            <AutoStatus status={statuses.quietHoursEnd} onRevert={() => revert('quietHoursEnd')} t={t} />
                            <AutoStatus status={statuses.voiceEnabled} onRevert={() => revert('voiceEnabled')} t={t} />
                            <AutoStatus status={statuses.notifyVolume} onRevert={() => revert('notifyVolume')} t={t} />
                            <AutoStatus status={statuses.notificationVoice} onRevert={() => revert('notificationVoice')} t={t} />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>{t('generatorPreferences')}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-5">
                            <label className="block text-sm font-medium">
                                {t('personalization')}
                                <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                                    <span>{t('moreRandom')}</span>
                                    <input
                                        type="range"
                                        className="flex-1"
                                        min="0"
                                        max="100"
                                        value={generationPersonalization}
                                        onChange={(event) => setGenerationPersonalization(Number(event.target.value))}
                                    />
                                    <span>{t('morePersonalized')}</span>
                                </div>
                            </label>
                            <label className="flex items-center gap-3 text-sm font-medium">
                                <input type="checkbox" checked={avoidRecentActivities} onChange={(event) => setAvoidRecentActivities(event.target.checked)} />
                                {t('avoidRecent')}
                            </label>
                            <label className="block text-sm font-medium">
                                {t('recentWindow')}
                                <select
                                    className={inputClass}
                                    value={recentActivitiesWindow}
                                    onChange={(event) => setRecentActivitiesWindow(Number(event.target.value))}
                                >
                                    <option value="3">{t('days3')}</option>
                                    <option value="7">{t('days7')}</option>
                                    <option value="14">{t('days14')}</option>
                                    <option value="30">{t('days30')}</option>
                                </select>
                            </label>
                            <label className="flex items-center gap-3 text-sm font-medium">
                                <input type="checkbox" checked={includeCompletedHistory} onChange={(event) => setIncludeCompletedHistory(event.target.checked)} />
                                {t('includeCompleted')}
                            </label>
                            <AutoStatus status={statuses.generationPersonalization} onRevert={() => revert('generationPersonalization')} t={t} />
                            <AutoStatus status={statuses.avoidRecentActivities} onRevert={() => revert('avoidRecentActivities')} t={t} />
                            <AutoStatus status={statuses.recentActivitiesWindow} onRevert={() => revert('recentActivitiesWindow')} t={t} />
                            <AutoStatus status={statuses.includeCompletedHistory} onRevert={() => revert('includeCompletedHistory')} t={t} />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>{t('privacyAccount')}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-5">
                            <label className="block text-sm font-medium">
                                {t('profileVisibility')}
                                <select className={inputClass} value={profileVisibility} onChange={(event) => setProfileVisibility(event.target.value)}>
                                    <option value="PRIVATE">{t('privateProfile')}</option>
                                    <option value="PUBLIC">{t('publicProfile')}</option>
                                </select>
                            </label>
                            <AutoStatus status={statuses.profileVisibility} onRevert={() => revert('profileVisibility')} t={t} />
                            <div className="border-t border-border pt-4">
                                <p className="mb-3 text-sm font-medium">{t('exportData')}</p>
                                <div className="flex flex-wrap gap-2">
                                    <Button type="button" variant="outline" onClick={() => exportData('json')}>
                                        <Download size={15} />
                                        {t('exportJson')}
                                    </Button>
                                    <Button type="button" variant="outline" onClick={() => exportData('csv')}>
                                        <Download size={15} />
                                        {t('exportCsv')}
                                    </Button>
                                    <Button type="button" variant="outline" onClick={() => void exportPdf()}>
                                        <Download size={15} />
                                        {t('exportPdf')}
                                    </Button>
                                </div>
                            </div>
                            <div className="border-t border-border pt-4">
                                <p className="font-medium text-danger">{t('deleteAccount')}</p>
                                <p className="mt-1 text-sm text-muted-foreground">{t('deleteAccountWarning')}</p>
                                {!deleteArmed ? (
                                    <Button type="button" variant="danger" className="mt-3" onClick={() => setDeleteArmed(true)}>
                                        <Trash2 size={15} />
                                        {t('deleteAccount')}
                                    </Button>
                                ) : (
                                    <div className="mt-3 space-y-3 rounded-md border border-danger p-3">
                                        <p className="text-sm">{t('deleteAccountStep')}</p>
                                        <input className={inputClass} placeholder={t('typeEmail')} value={deleteEmail} onChange={(event) => setDeleteEmail(event.target.value)} />
                                        <input className={inputClass} placeholder={t('deletionPhrase')} value={deletePhrase} onChange={(event) => setDeletePhrase(event.target.value)} />
                                        <div className="flex gap-2">
                                            <Button
                                                type="button"
                                                variant="danger"
                                                disabled={deleteEmail !== user.email || deletePhrase !== 'DELETE_ACCOUNT'}
                                                onClick={() => void deleteAccount()}
                                            >
                                                {t('confirmDeletion')}
                                            </Button>
                                            <Button type="button" variant="outline" onClick={() => setDeleteArmed(false)}>
                                                {t('cancel')}
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>{t('aiIntegration')}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="rounded-md border border-border bg-muted p-3 text-sm text-muted-foreground">{t('aiKeyServerOnly')}</p>
                            <label className="block text-sm font-medium">
                                {t('aiApiKey')}
                                <div className="mt-2 flex gap-2">
                                    <input
                                        type={showAiKey ? 'text' : 'password'}
                                        autoComplete="off"
                                        className={`${inputClass} mt-0`}
                                        value={aiKey}
                                        onChange={(event) => {
                                            setAiKey(event.target.value);
                                            setAiFeedback(null);
                                        }}
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        aria-label={showAiKey ? t('aiHideKey') : t('aiShowKey')}
                                        onClick={() => setShowAiKey((current) => !current)}
                                    >
                                        {showAiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </Button>
                                </div>
                                <div className="mt-2 flex flex-wrap items-center gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        disabled={!aiKey || !aiProvider || testingAi}
                                        onClick={() => void testAiConnection()}
                                    >
                                        {testingAi ? <Loader2 className="animate-spin" size={15} /> : <Check size={15} />}
                                        {testingAi ? t('aiTestingConnection') : t('aiTestConnection')}
                                    </Button>
                                    {!aiKey && <span className="text-xs text-muted-foreground">{t('aiEnterKey')}</span>}
                                </div>
                                {aiFeedback && (
                                    <p className={`mt-2 text-sm ${aiFeedback.ok ? 'text-success' : 'text-danger'}`}>{aiFeedback.text}</p>
                                )}
                            </label>
                            <label className="block text-sm font-medium">
                                {t('aiProvider')}
                                <select className={inputClass} value={aiProvider} onChange={(event) => setAiProvider(event.target.value)}>
                                    {aiProviders.map(([value, label]) => (
                                        <option key={value} value={value}>
                                            {t(label)}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <label className="block text-sm font-medium">
                                {t('aiModel')}
                                <input className={inputClass} value={aiModel} onChange={(event) => setAiModel(event.target.value)} />
                            </label>
                            <label className="block text-sm font-medium">
                                {t('aiBaseUrl')}
                                <input type="url" className={inputClass} value={aiBaseUrl} onChange={(event) => setAiBaseUrl(event.target.value)} />
                            </label>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <label className="text-sm font-medium">
                                    {t('aiTemperature')}
                                    <input
                                        type="number"
                                        min="0"
                                        max="2"
                                        step="0.1"
                                        className={inputClass}
                                        value={aiTemperature}
                                        onChange={(event) => setAiTemperature(Number(event.target.value))}
                                    />
                                </label>
                                <label className="text-sm font-medium">
                                    {t('aiMaxTokens')}
                                    <input
                                        type="number"
                                        min="1"
                                        max="8192"
                                        className={inputClass}
                                        value={aiMaxTokens}
                                        onChange={(event) => setAiMaxTokens(Number(event.target.value))}
                                    />
                                </label>
                            </div>
                            <AutoStatus status={statuses.aiProvider} onRevert={() => revert('aiProvider')} t={t} />
                            <AutoStatus status={statuses.aiModel} onRevert={() => revert('aiModel')} t={t} />
                            <AutoStatus status={statuses.aiBaseUrl} onRevert={() => revert('aiBaseUrl')} t={t} />
                            <AutoStatus status={statuses.aiTemperature} onRevert={() => revert('aiTemperature')} t={t} />
                            <AutoStatus status={statuses.aiMaxTokens} onRevert={() => revert('aiMaxTokens')} t={t} />
                        </CardContent>
                    </Card>

                    <Card className={user.pauseActive ? 'border-warning' : ''}>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Pause size={18} /> {t('pauseMode')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm text-muted-foreground">{t('pauseDescription')}</p>
                            <label className="block text-sm font-medium">
                                {t('pauseReason')}
                                <input className={inputClass} maxLength={120} value={reason} onChange={(event) => setReason(event.target.value)} />
                            </label>
                            <Button onClick={() => void togglePause()}>
                                {user.pauseActive ? (
                                    <>
                                        <Play size={16} /> {t('resume')}
                                    </>
                                ) : (
                                    <>
                                        <Pause size={16} /> {t('activatePause')}
                                    </>
                                )}
                            </Button>
                            {user.pauseActive && (
                                <p className="rounded-md border border-warning bg-orange-50 p-3 text-sm text-orange-800 dark:bg-orange-950/30 dark:text-orange-200">
                                    {t('pauseActive')}
                                    {user.pauseReason ? ` ${user.pauseReason}` : ''}
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </div>
                {message && <p className="text-sm text-muted-foreground">{message}</p>}
            </div>
        </DashboardLayout>
    );
}

function AutoStatus({ status, onRevert, t }: { status?: AutosaveStatus; onRevert: () => void; t: (key: string) => string }) {
    if (!status || status === 'idle') return null;
    return (
        <div className="flex items-center gap-2 text-xs text-muted-foreground" aria-live="polite">
            {status === 'saving' && <Loader2 size={13} className="animate-spin" />}
            {status === 'saved' && <Check size={13} className="text-success" />}
            {status === 'error' && <XCircle size={13} className="text-danger" />}
            <span>
                {t(
                    status === 'modified'
                        ? 'autosaveModified'
                        : status === 'saving'
                          ? 'autosaveSaving'
                          : status === 'saved'
                            ? 'autosaveSaved'
                            : 'autosaveError',
                )}
            </span>
            {(status === 'modified' || status === 'error') && (
                <Button type="button" variant="ghost" size="sm" onClick={onRevert}>
                    <RotateCcw size={13} />
                    {t('autosaveRevert')}
                </Button>
            )}
        </div>
    );
}