export type NavId =
    | 'home'
    | 'stats'
    | 'activities'
    | 'suggestions'
    | 'rewards'
    | 'calendar'
    | 'profile'
    | 'settings'
    | 'attendance';

export const navigationIds: NavId[] = [
    'home',
    'stats',
    'activities',
    'suggestions',
    'rewards',
    'calendar',
    'profile',
    'settings',
    'attendance',
];

export const mobilePrimaryNavigation: NavId[] = ['home', 'activities', 'calendar', 'stats', 'profile'];

export const mobileMoreNavigation: NavId[] = ['suggestions', 'rewards', 'settings', 'attendance'];

export function navigationPath(id: NavId): string {
    switch (id) {
        case 'home':
            return '/dashboard';
        case 'stats':
            return '/dashboard/stats';
        case 'activities':
            return '/dashboard/activities';
        case 'suggestions':
            return '/dashboard/suggestions';
        case 'rewards':
            return '/dashboard/rewards';
        case 'calendar':
            return '/dashboard/calendar';
        case 'profile':
            return '/dashboard/profile';
        case 'settings':
            return '/dashboard/settings';
        case 'attendance':
            return '/dashboard/attendance';
    }
}

export function activeFromPathname(pathname: string): NavId | null {
    switch (pathname) {
        case '/dashboard':
            return 'home';
        case '/dashboard/stats':
            return 'stats';
        case '/dashboard/activities':
            return 'activities';
        case '/dashboard/suggestions':
            return 'suggestions';
        case '/dashboard/rewards':
            return 'rewards';
        case '/dashboard/calendar':
            return 'calendar';
        case '/dashboard/profile':
            return 'profile';
        case '/dashboard/settings':
            return 'settings';
        case '/dashboard/attendance':
            return 'attendance';
        default:
            return null;
    }
}
