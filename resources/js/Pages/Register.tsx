import { Link, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { useI18n } from '@/lib/i18n';

export default function Register() {
    const { t } = useI18n();
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        password: '',
        acceptTerms: false,
        remember: true,
    });

    const serverError = Object.values(errors)[0] as string | undefined;

    return (
        <main className="grid min-h-screen place-items-center bg-muted/30 p-6">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <Link href="/" className="mb-5 text-sm font-semibold">
                        TimeLock<span className="text-info">-v</span>
                    </Link>
                    <CardTitle>{t('register.title')}</CardTitle>
                    <p className="text-sm text-muted-foreground">{t('register.subtitle')}</p>
                </CardHeader>
                <CardContent>
                    <form
                        className="space-y-4"
                        onSubmit={(event) => {
                            event.preventDefault();
                            post('/register');
                        }}
                    >
                        <label className="block text-sm font-medium">
                            {t('register.name')}
                            <Input
                                className="mt-2"
                                value={data.name}
                                onChange={(event) => setData('name', event.target.value)}
                                required
                                minLength={2}
                            />
                        </label>
                        <label className="block text-sm font-medium">
                            {t('register.email')}
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
                            {t('register.password')}
                            <Input
                                className="mt-2"
                                type="password"
                                value={data.password}
                                onChange={(event) => setData('password', event.target.value)}
                                required
                                minLength={12}
                                autoComplete="new-password"
                            />
                            <span className="mt-1 block text-xs text-muted-foreground">{t('login.passwordHint')}</span>
                        </label>
                        <label className="flex items-start gap-2 text-sm">
                            <Checkbox
                                checked={data.acceptTerms}
                                onCheckedChange={(checked) => setData('acceptTerms', checked === true)}
                                required
                            />
                            <span>{t('register.terms')}</span>
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
                            {processing ? t('login.processing') : t('register.submit')}
                        </Button>
                        <p className="text-center text-sm text-muted-foreground">
                            {t('register.hasAccount')}{' '}
                            <Link href="/login" className="font-medium text-foreground underline">
                                {t('register.login')}
                            </Link>
                        </p>
                    </form>
                </CardContent>
            </Card>
        </main>
    );
}