import { Link, useForm } from '@inertiajs/react';
import { Button } from '@/Components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/Card';
import { Input } from '@/Components/ui/Input';
import { useI18n } from '@/lib/i18n';

export default function Login() {
    const { t } = useI18n();
    const { data, setData, post, processing, errors } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    return (
        <main className="flex min-h-screen items-center justify-center bg-background p-4 text-foreground">
            <Card className="w-full max-w-sm">
                <CardHeader>
                    <CardTitle>{t('login.title')}</CardTitle>
                </CardHeader>
                <CardContent>
                    <form
                        className="space-y-4"
                        onSubmit={(event) => {
                            event.preventDefault();
                            post('/login');
                        }}
                    >
                        <div className="space-y-1">
                            <Input
                                type="email"
                                placeholder={t('login.email')}
                                value={data.email}
                                onChange={(event) => setData('email', event.target.value)}
                                required
                            />
                            {errors.email && <p className="text-sm text-danger">{errors.email}</p>}
                        </div>
                        <div className="space-y-1">
                            <Input
                                type="password"
                                placeholder={t('login.password')}
                                value={data.password}
                                onChange={(event) => setData('password', event.target.value)}
                                required
                            />
                            {errors.password && (
                                <p className="text-sm text-danger">{errors.password}</p>
                            )}
                        </div>
                        <label className="flex items-center gap-2 text-sm">
                            <input
                                type="checkbox"
                                checked={data.remember}
                                onChange={(event) => setData('remember', event.target.checked)}
                            />
                            {t('login.remember')}
                        </label>
                        {((errors as Record<string, string | undefined>).auth) && (
                            <p className="text-sm text-danger">
                                {(errors as Record<string, string | undefined>).auth}
                            </p>
                        )}
                        <Button type="submit" className="w-full" disabled={processing}>
                            {t('login.submit')}
                        </Button>
                        <p className="text-center text-sm text-muted-foreground">
                            {t('login.noAccount')}{' '}
                            <Link href="/register" className="underline">
                                {t('login.register')}
                            </Link>
                            {' · '}
                            <Link href="/auth/qr-login" className="underline">
                                {t('login.qr')}
                            </Link>
                        </p>
                    </form>
                </CardContent>
            </Card>
        </main>
    );
}