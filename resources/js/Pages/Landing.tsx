import { Link, usePage } from '@inertiajs/react';
import { ArrowRight, Check, Clock3, ShieldCheck, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';
import type { User } from '@/types';

export default function Landing() {
    const { t } = useI18n();
    const page = usePage<{ auth?: { user?: User | null } }>();
    const user = page.props.auth?.user;

    return (
        <main className="min-h-screen bg-background text-foreground">
            <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
                <div className="text-xl font-bold tracking-tight">
                    TimeLock<span className="text-info">-v</span>
                </div>
                <div className="flex items-center gap-2">
                    {user ? (
                        <Link href="/dashboard">
                            <Button variant="outline">{t('landing.dashboard')}</Button>
                        </Link>
                    ) : (
                        <>
                            <Link href="/login">
                                <Button variant="ghost">{t('landing.login')}</Button>
                            </Link>
                            <Link href="/register">
                                <Button>{t('landing.start')}</Button>
                            </Link>
                        </>
                    )}
                </div>
            </header>

            <section className="mx-auto grid max-w-6xl gap-12 px-6 pb-20 pt-16 lg:grid-cols-[1.1fr_.9fr] lg:items-center">
                <div>
                    <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-sm text-muted-foreground">
                        <Sparkles size={15} /> {t('landing.badge')}
                    </p>
                    <h1 className="max-w-3xl text-5xl font-bold tracking-tight md:text-6xl">{t('landing.heading')}</h1>
                    <p className="mt-6 max-w-2xl text-lg text-muted-foreground">{t('landing.subtitle')}</p>
                    <div className="mt-8 flex flex-wrap gap-3">
                        <Link href={user ? '/dashboard' : '/register'}>
                            <Button size="lg">
                                {t('landing.ctaPrimary')} <ArrowRight size={17} />
                            </Button>
                        </Link>
                        <Link href="/login">
                            <Button variant="outline" size="lg">
                                {t('landing.ctaSecondary')}
                            </Button>
                        </Link>
                    </div>
                </div>
                <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                    <div className="mb-5 flex items-center justify-between">
                        <span className="text-sm font-medium">{t('landing.cardTitle')}</span>
                        <span className="rounded-full bg-muted px-3 py-1 text-xs">{t('landing.cardPrivate')}</span>
                    </div>
                    <div className="space-y-3">
                        <div className="rounded-lg bg-muted p-4">
                            <div className="flex items-center justify-between text-sm">
                                <span className="font-medium">{t('landing.deepWork')}</span>
                                <span className="text-muted-foreground">09:00 – 11:00</span>
                            </div>
                            <div className="mt-3 h-2 rounded-full bg-info/20">
                                <div className="h-2 w-3/4 rounded-full bg-info" />
                            </div>
                        </div>
                        {[t('landing.training'), t('landing.reading')].map((item) => (
                            <div key={item} className="flex items-center gap-3 rounded-lg border border-border p-4 text-sm">
                                <Check size={16} className="text-success" />
                                {item}
                                <span className="ml-auto text-muted-foreground">{t('landing.done')}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="border-y border-border bg-muted/30 px-6 py-16">
                <div className="mx-auto max-w-6xl">
                    <h2 className="text-3xl font-bold">{t('landing.featuresTitle')}</h2>
                    <div className="mt-8 grid gap-4 md:grid-cols-3">
                        {[
                            { icon: Clock3, title: t('landing.f1Title'), text: t('landing.f1Text') },
                            { icon: ShieldCheck, title: t('landing.f2Title'), text: t('landing.f2Text') },
                            { icon: Sparkles, title: t('landing.f3Title'), text: t('landing.f3Text') },
                        ].map(({ icon: Icon, title, text }) => (
                            <div key={title} className="rounded-xl border border-border bg-card p-5">
                                <Icon className="mb-4 text-info" />
                                <h3 className="font-semibold">{title}</h3>
                                <p className="mt-2 text-sm text-muted-foreground">{text}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <footer className="mx-auto flex max-w-6xl flex-wrap justify-between gap-4 px-6 py-8 text-sm text-muted-foreground">
                <span>{t('landing.footerAge')}</span>
                <span>{t('landing.footerTerms')}</span>
            </footer>
        </main>
    );
}