import { Link, useForm } from '@inertiajs/react';
import { Button } from '@/Components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/Card';
import { Input } from '@/Components/ui/Input';
import { useI18n } from '@/lib/i18n';

export default function Register() {
    const { t } = useI18n();
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        acceptTerms: false,
    });

    return (
        <main className="flex min-h-screen items-center justify-center bg-background p-4 text-foreground">
            <Card className="w-full max-w-sm">
                <CardHeader>
                    <CardTitle>{t('register.title')}</CardTitle>
                </CardHeader>
                <CardContent>
                    <form
                        className="space-y-4"
                        onSubmit={(event) => {
                            event.preventDefault();
                            post('/register');
                        }}
                    >
                        <div className="space-y-1">
                            <Input
                                placeholder={t('register.name')}
                                value={data.name}
                                onChange={(event) => setData('name', event.target.value)}
                                required
                            />
                            {errors.name && <p className="text-sm text-danger">{errors.name}</p>}
                        </div>
                        <div className="space-y-1">
                            <Input
                                type="email"
                                placeholder={t('register.email')}
                                value={data.email}
                                onChange={(event) => setData('email', event.target.value)}
                                required
                            />
                            {errors.email && <p className="text-sm text-danger">{errors.email}</p>}
                        </div>
                        <div className="space-y-1">
                            <Input
                                type="password"
                                placeholder={t('register.password')}
                                value={data.password}
                                onChange={(event) => setData('password', event.target.value)}
                                required
                            />
                            {errors.password && (
                                <p className="text-sm text-danger">{errors.password}</p>
                            )}
                        </div>
                        <div className="space-y-1">
                            <Input
                                type="password"
                                placeholder={t('register.confirm')}
                                value={data.confirmPassword}
                                onChange={(event) =>
                                    setData('confirmPassword', event.target.value)
                                }
                                required
                            />
                            {errors.confirmPassword && (
                                <p className="text-sm text-danger">{errors.confirmPassword}</p>
                            )}
                        </div>
                        <label className="flex items-center gap-2 text-sm">
                            <input
                                type="checkbox"
                                checked={data.acceptTerms}
                                onChange={(event) => setData('acceptTerms', event.target.checked)}
                            />
                            {t('register.terms')}
                        </label>
                        {errors.acceptTerms && (
                            <p className="text-sm text-danger">{errors.acceptTerms}</p>
                        )}
                        <Button type="submit" className="w-full" disabled={processing}>
                            {t('register.submit')}
                        </Button>
                        <p className="text-center text-sm text-muted-foreground">
                            {t('register.hasAccount')}{' '}
                            <Link href="/login" className="underline">
                                {t('register.login')}
                            </Link>
                        </p>
                    </form>
                </CardContent>
            </Card>
        </main>
    );
}