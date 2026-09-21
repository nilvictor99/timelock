import * as React from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Button } from '@/Components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/Card';
import { Input } from '@/Components/ui/Input';
import { useI18n } from '@/lib/i18n';
import { apiPost } from '@/lib/api';
import { router } from '@inertiajs/react';

type Notice = { kind: 'ok' | 'error'; message: string } | null;

export default function Profile({ user }: { user: { avatarUrl?: string | null; email: string } }) {
    const { t } = useI18n();

    const [avatarUrl, setAvatarUrl] = React.useState(user.avatarUrl ?? '');
    const [notice, setNotice] = React.useState<Notice>(null);

    const [email, setEmail] = React.useState('');
    const [currentPassword, setCurrentPassword] = React.useState('');
    const [newPassword, setNewPassword] = React.useState('');
    const [confirmPassword, setConfirmPassword] = React.useState('');

    async function uploadAvatar(event: React.ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0];
        if (!file) {
            return;
        }

        const body = new FormData();
        body.append('file', file);

        try {
            const response = await fetch('/api/profile/avatar', {
                method: 'POST',
                credentials: 'include',
                body,
            });
            const data = (await response.json()) as { avatarUrl?: string; error?: string };
            if (!response.ok) {
                setNotice({ kind: 'error', message: data.error ?? t('profile.error') });
                return;
            }
            setAvatarUrl(data.avatarUrl ?? '');
            setNotice({ kind: 'ok', message: t('profile.saved') });
            router.reload();
        } catch {
            setNotice({ kind: 'error', message: t('profile.error') });
        }
    }

    async function changeEmail(event: React.FormEvent) {
        event.preventDefault();
        setNotice(null);
        try {
            await apiPost('/api/profile/email', { email, currentPassword });
            setEmail('');
            setCurrentPassword('');
            setNotice({ kind: 'ok', message: t('profile.saved') });
        } catch (cause) {
            setNotice({ kind: 'error', message: cause instanceof Error ? cause.message : t('profile.error') });
        }
    }

    async function changePassword(event: React.FormEvent) {
        event.preventDefault();
        setNotice(null);
        try {
            await apiPost('/api/profile/password', {
                currentPassword,
                newPassword,
                confirmPassword,
            });
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setNotice({ kind: 'ok', message: t('profile.saved') });
        } catch (cause) {
            setNotice({ kind: 'error', message: cause instanceof Error ? cause.message : t('profile.error') });
        }
    }

    return (
        <DashboardLayout>
            <div className="space-y-4">
                {notice && (
                    <p
                        className={`rounded-lg p-3 text-sm ${
                            notice.kind === 'ok' ? 'bg-green-100 text-green-700 dark:bg-green-950' : 'bg-danger/10 text-danger'
                        }`}
                    >
                        {notice.message}
                    </p>
                )}

                <Card>
                    <CardHeader>
                        <CardTitle>{t('profile.avatar')}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {avatarUrl ? (
                            <img
                                src={avatarUrl}
                                alt="avatar"
                                className="h-20 w-20 rounded-full border border-border object-cover"
                            />
                        ) : (
                            <div className="h-20 w-20 rounded-full border border-border bg-muted" />
                        )}
                        <label className="inline-flex">
                            <span className="cursor-pointer rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90">
                                {t('profile.changeAvatar')}
                            </span>
                            <input
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                className="hidden"
                                onChange={uploadAvatar}
                            />
                        </label>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>{t('profile.changeEmail')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={changeEmail} className="space-y-3">
                            <Input
                                type="email"
                                value={email}
                                placeholder="nuevo@example.com"
                                onChange={(event) => setEmail(event.target.value)}
                                required
                            />
                            <Input
                                type="password"
                                value={currentPassword}
                                placeholder={t('profile.currentPassword')}
                                onChange={(event) => setCurrentPassword(event.target.value)}
                                required
                            />
                            <Button type="submit">{t('profile.saveEmail')}</Button>
                        </form>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>{t('profile.changePassword')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={changePassword} className="space-y-3">
                            <Input
                                type="password"
                                value={currentPassword}
                                placeholder={t('profile.currentPassword')}
                                onChange={(event) => setCurrentPassword(event.target.value)}
                                required
                            />
                            <Input
                                type="password"
                                value={newPassword}
                                placeholder={t('profile.newPassword')}
                                onChange={(event) => setNewPassword(event.target.value)}
                                required
                            />
                            <Input
                                type="password"
                                value={confirmPassword}
                                placeholder={t('profile.confirmPassword')}
                                onChange={(event) => setConfirmPassword(event.target.value)}
                                required
                            />
                            <Button type="submit">{t('profile.savePassword')}</Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}