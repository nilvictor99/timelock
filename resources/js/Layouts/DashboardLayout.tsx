import * as React from 'react';
import { Link, router } from '@inertiajs/react';
import { Button } from '@/Components/ui/Button';
import { useI18n } from '@/lib/i18n';
import { useTheme } from '@/lib/theme';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { t, setLocale, locale } = useI18n();
    const { theme, setTheme } = useTheme();

    return (
        <div className="min-h-screen bg-background text-foreground">
            <header className="sticky top-0 z-10 border-b border-border bg-background/90 backdrop-blur">
                <div className="mx-auto flex h-14 max-w-4xl items-center justify-between gap-4 px-4">
                    <Link href="/dashboard" className="font-semibold">
                        TimeLock-v
                    </Link>
                    <nav className="flex items-center gap-1">
                        <Link href="/dashboard" className="rounded-md px-2 py-1 text-sm hover:bg-muted">
                            {t('nav.dashboard')}
                        </Link>
                        <Link href="/dashboard/stats" className="rounded-md px-2 py-1 text-sm hover:bg-muted">
                            {t('nav.stats')}
                        </Link>
                        <Link href="/dashboard/qr" className="rounded-md px-2 py-1 text-sm hover:bg-muted">
                            {t('nav.qr')}
                        </Link>
                        <Link href="/dashboard/profile" className="rounded-md px-2 py-1 text-sm hover:bg-muted">
                            {t('nav.profile')}
                        </Link>
                        <Link href="/dashboard/settings" className="rounded-md px-2 py-1 text-sm hover:bg-muted">
                            {t('nav.settings')}
                        </Link>
                    </nav>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                            className="rounded-md px-2 py-1 text-sm hover:bg-muted"
                        >
                            {theme === 'dark' ? '☀️' : '🌙'}
                        </button>
                        <button
                            type="button"
                            onClick={() => setLocale(locale === 'es' ? 'en' : 'es')}
                            className="rounded-md px-2 py-1 text-sm hover:bg-muted"
                        >
                            {locale === 'es' ? 'EN' : 'ES'}
                        </button>
                        <Button size="sm" variant="outline" onClick={() => router.post('/logout')}>
                            {t('nav.logout')}
                        </Button>
                    </div>
                </div>
            </header>
            <main className="mx-auto max-w-4xl px-4 py-6">{children}</main>
        </div>
    );
}