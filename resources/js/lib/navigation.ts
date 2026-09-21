export type NavId =
    | 'home'
    | 'stats'
    | 'activities'
    | 'suggestions'
    | 'rewards'
    | 'calendar'
    | 'streak'
    | 'profile'
    | 'settings'
    | 'export';

export const navigationIds: NavId[] = [
    'home',
    'stats',
    'activities',
    'suggestions',
    'rewards',
    'calendar',
    'streak',
    'profile',
    'settings',
    'export',
];

export const mobilePrimaryNavigation: NavId[] = ['home', 'activities', 'calendar', 'stats', 'profile'];

export const mobileMoreNavigation: NavId[] = ['suggestions', 'rewards', 'streak', 'settings', 'export'];

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
        case 'streak':
            return '/dashboard/streak';
        case 'profile':
            return '/dashboard/profile';
        case 'settings':
            return '/dashboard/settings';
        case 'export':
            return '/dashboard/export';
    }
}