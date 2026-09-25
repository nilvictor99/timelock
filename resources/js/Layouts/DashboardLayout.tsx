import * as React from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import {
    Activity as ActivityIcon,
    BarChart3,
    CalendarDays,
    Download,
    Flame,
    Gift,
    Home,
    Moon,
    MoreHorizontal,
    PanelLeftClose,
    PanelLeftOpen,
    Settings,
    Sparkles,
    Sun,
    Trophy,
    UserRound,
    X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LiveClock } from '@/Components/dashboard/LiveClock';
import { useI18n } from '@/lib/i18n';
import { useTheme } from '@/lib/theme';
import { cn } from '@/lib/utils';
import { mobileMoreNavigation, mobilePrimaryNavigation, navigationPath, activeFromPathname, type NavId } from '@/lib/navigation';
import type { User } from '@/types';

export type ShellNavId = NavId;

const navItems: { id: NavId; labelKey: string; icon: typeof Home }[] = [
    { id: 'home', labelKey: 'navHome', icon: Home },
    { id: 'stats', labelKey: 'navStats', icon: BarChart3 },
    { id: 'activities', labelKey: 'navActivities', icon: ActivityIcon },
    { id: 'suggestions', labelKey: 'navSuggestions', icon: Sparkles },
    { id: 'rewards', labelKey: 'navRewards', icon: Gift },
    { id: 'calendar', labelKey: 'navCalendar', icon: CalendarDays },
    { id: 'streak', labelKey: 'navStreak', icon: Flame },
    { id: 'profile', labelKey: 'navProfile', icon: UserRound },
    { id: 'settings', labelKey: 'navSettings', icon: Settings },
    { id: 'export', labelKey: 'navExport', icon: Download },
];

function activeFromUrl(rawUrl: string): NavId {
    const [pathname] = rawUrl.split('?');
    return activeFromPathname(pathname) ?? 'home';
}

const headerDateFormatters = {
    'es-ES': new Intl.DateTimeFormat('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }),
    'en-US': new Intl.DateTimeFormat('en-US', { weekday: 'long', day: 'numeric', month: 'long' }),
};

export default function DashboardLayout({
    children,
    active,
}: {
    children: React.ReactNode;
    active?: NavId;
}) {
    const { t } = useI18n();
    const { setTheme, resolvedTheme } = useTheme();
    const page = usePage<{ auth?: { user?: User | null } }>();
    const user = page.props.auth?.user;
    const navActive = active ?? activeFromUrl(page.url);

    const [mobileNav, setMobileNav] = React.useState(false);
    const [expanded, setExpanded] = React.useState(true);
    const [mounted, setMounted] = React.useState(false);
    const [dateLabel, setDateLabel] = React.useState('');

    React.useEffect(() => {
        try {
            const stored = window.localStorage.getItem('timelock-sidebar-expanded');
            if (stored !== null) setExpanded(stored !== 'false');
        } catch {
            // ignore
        }
        setMounted(true);
    }, []);

    React.useEffect(() => {
        if (mounted) {
            try {
                window.localStorage.setItem('timelock-sidebar-expanded', String(expanded));
            } catch {
                // ignore
            }
        }
    }, [expanded, mounted]);

    const dateLocale = user?.language === 'en' ? 'en-US' : 'es-ES';
    React.useEffect(() => {
        const updateDateLabel = () => setDateLabel(headerDateFormatters[dateLocale].format(new Date()));
        updateDateLabel();
        const id = window.setInterval(updateDateLabel, 60_000);
        return () => window.clearInterval(id);
    }, [dateLocale]);

    const title = t(navItems.find((item) => item.id === navActive)?.labelKey ?? 'navHome') || navActive;
    const initials =
        user?.name
            ?.trim()
            .split(/\s+/)
            .slice(0, 2)
            .map((part) => part[0])
            .join('')
            .toUpperCase() || 'TL';
    const darkMode = mounted && resolvedTheme === 'dark';

    function logout() {
        router.post('/logout');
    }

    const renderItem = (item: (typeof navItems)[number]) => {
        const label = t(item.labelKey) || item.id;
        const Icon = item.icon;
        const className = cn(
            'flex w-full items-center rounded-md py-2 text-sm transition-colors',
            expanded ? 'gap-3 px-3' : 'justify-center px-2',
            navActive === item.id
                ? 'bg-foreground text-background'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
        );
        const closeMobileNav = () => setMobileNav(false);
        const inner = (
            <>
                <Icon size={17} aria-hidden="true" />
                {expanded && <span>{label}</span>}
            </>
        );

        return (
            <Link
                key={item.id}
                href={navigationPath(item.id)}
                onClick={closeMobileNav}
                title={!expanded ? label : undefined}
                aria-label={label}
                className={className}
            >
                {inner}
            </Link>
        );
    };

    const itemById = (id: NavId) => navItems.find((item) => item.id === id);

    const renderMobileAction = (id: NavId, compact = false) => {
        const item = itemById(id);
        if (!item) return null;
        const label = t(item.labelKey) || item.id;
        const Icon = item.icon;
        const className = cn(
            'flex items-center rounded-lg transition-colors',
            compact
                ? 'w-full gap-3 px-4 py-3 text-left'
                : 'min-w-0 flex-1 flex-col justify-center gap-1 px-1 py-2 text-[10px]',
            navActive === id ? 'font-semibold text-foreground' : 'text-muted-foreground',
        );
        const closeMobileNav = () => setMobileNav(false);
        const inner = <><Icon size={compact ? 18 : 19} /><span>{label}</span></>;

        return (
            <Link key={id} href={navigationPath(id)} onClick={closeMobileNav} className={className} aria-label={label}>
                {inner}
            </Link>
        );
    };

    return (
        <div className="min-h-screen bg-background text-foreground">
            <aside
                className={cn(
                    'fixed inset-y-0 left-0 z-30 hidden border-r border-border bg-card p-3 transition-all duration-300 lg:flex lg:flex-col',
                    expanded ? 'w-64' : 'w-16',
                )}
            >
                <div className={cn('mb-8 flex items-center', expanded ? 'justify-between px-2' : 'justify-center')}>
                    {expanded && (
                        <div>
                            <div className="text-xl font-bold tracking-tight">
                                TimeLock<span className="text-info">-v</span>
                            </div>
                            <p className="text-xs text-muted-foreground">Controla tu tiempo</p>
                        </div>
                    )}
                    <Button
                        variant="ghost"
                        size="sm"
                        className="lg:hidden"
                        onClick={() => setMobileNav(false)}
                        aria-label={t('sidebarClose')}
                    >
                        <X size={16} />
                    </Button>
                </div>
                <nav className="space-y-1">{navItems.map(renderItem)}</nav>
                <div className={cn('mt-auto border-t border-border pt-3', expanded ? 'space-y-1' : 'space-y-2')}>
                    <button
                        onClick={() => setExpanded(!expanded)}
                        className={cn(
                            'flex w-full items-center rounded-md py-2 text-sm text-muted-foreground hover:bg-muted',
                            expanded ? 'gap-3 px-3' : 'justify-center px-2',
                        )}
                        title={expanded ? t('sidebarCollapse') : t('sidebarExpand')}
                        aria-label={expanded ? t('sidebarCollapse') : t('sidebarExpand')}
                    >
                        {expanded ? <PanelLeftClose size={17} /> : <PanelLeftOpen size={17} />}
                        {expanded && <span>{t('sidebarCollapse')}</span>}
                    </button>
                    <button
                        onClick={() => setTheme(darkMode ? 'light' : 'dark')}
                        className={cn(
                            'flex w-full items-center rounded-md py-2 text-sm text-muted-foreground hover:bg-muted',
                            expanded ? 'gap-3 px-3' : 'justify-center px-2',
                        )}
                        title={darkMode ? 'Modo claro' : 'Modo oscuro'}
                        aria-label={darkMode ? 'Modo claro' : 'Modo oscuro'}
                    >
                        {darkMode ? <Sun size={17} /> : <Moon size={17} />}
                        {expanded && <span>{darkMode ? 'Modo claro' : 'Modo oscuro'}</span>}
                    </button>
                </div>
            </aside>

            <main
                className={cn(
                    'transition-[padding] duration-300 lg:pl-16',
                    expanded ? 'lg:pl-64' : 'lg:pl-16',
                )}
            >
                <header className="sticky top-0 z-20 flex min-h-16 items-center justify-between gap-3 border-b border-border bg-background/95 px-4 py-2 backdrop-blur md:px-8">
                    <div className="flex min-w-0 items-center gap-3">
                        <span className="hidden lg:block" aria-hidden="true" />
                        <div className="min-w-0">
                            <p className="truncate text-xs capitalize text-muted-foreground">
                                {t('today')}
                                {dateLabel ? `, ${dateLabel}` : ''}
                            </p>
                            <h1 className="truncate font-semibold">{title}</h1>
                        </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                        <LiveClock className="flex" />
                        <div className="hidden items-center gap-2 rounded-full border border-border px-3 py-1.5 text-sm sm:flex">
                            <Trophy size={15} className="text-warning" /> {user?.points ?? 0} pts
                        </div>
                        <span className="hidden rounded-full bg-muted px-3 py-1 text-xs md:inline">
                            {user?.operationMode === 'FREE' ? t('modeFree') : t('modeSync')}
                        </span>
                        <Link
                            href="/dashboard/profile"
                            className="grid h-8 w-8 place-items-center overflow-hidden rounded-full bg-foreground text-xs font-bold text-background"
                            aria-label={t('navProfile')}
                        >
                            {user?.avatarUrl ? (
                                <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
                            ) : (
                                initials
                            )}
                        </Link>
                        <Button variant="ghost" size="sm" onClick={logout}>
                            {t('logout')}
                        </Button>
                    </div>
                </header>

                <div className="mx-auto max-w-7xl p-4 pb-24 md:p-8 md:pb-28 lg:pb-8">{children}</div>
            </main>

            {mobileNav && (
                <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setMobileNav(false)}>
                    <div
                        className="absolute inset-x-0 bottom-0 rounded-t-2xl border border-border bg-card p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="mb-3 flex items-center justify-between">
                            <h2 className="font-semibold">{t('statsMore')}</h2>
                            <Button variant="ghost" size="sm" onClick={() => setMobileNav(false)} aria-label={t('statsClose')}>
                                <X size={17} />
                            </Button>
                        </div>
                        <div className="grid gap-1">{mobileMoreNavigation.map((id) => renderMobileAction(id, true))}</div>
                        <div className="mt-3 border-t border-border pt-3">
                            <button
                                onClick={() => setTheme(darkMode ? 'light' : 'dark')}
                                className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm text-muted-foreground"
                            >
                                <Moon size={18} />
                                <span>{t('statsTheme')}</span>
                            </button>
                            <button
                                onClick={logout}
                                className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm text-danger"
                            >
                                <X size={18} />
                                <span>{t('statsLogout')}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <nav
                className="fixed inset-x-0 bottom-0 z-30 flex h-16 border-t border-border bg-card/95 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
                aria-label={t('statsMainNavigation')}
            >
                {mobilePrimaryNavigation.map((id) => (
                    <div key={id} className="flex min-w-0 flex-1">
                        {renderMobileAction(id)}
                    </div>
                ))}
                <button
                    onClick={() => setMobileNav(true)}
                    className={cn(
                        'flex min-w-0 flex-1 flex-col items-center justify-center gap-1 px-1 py-2 text-[10px]',
                        'text-muted-foreground',
                    )}
                    aria-label={t('statsMore')}
                >
                    <MoreHorizontal size={19} />
                    <span>{t('statsMore')}</span>
                </button>
            </nav>
        </div>
    );
}