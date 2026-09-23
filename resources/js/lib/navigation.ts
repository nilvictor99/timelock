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

export type TabId = 'activities' | 'suggestions' | 'rewards' | 'calendar' | 'streak' | 'export';

export const tabIds: TabId[] = ['activities', 'suggestions', 'rewards', 'calendar', 'streak', 'export'];

export function isTabId(value: string | null | undefined): value is TabId {
    return value !== null && value !== undefined && (tabIds as string[]).includes(value);
}

export function navigationPath(id: NavId): string {
    switch (id) {
        case 'home':
            return '/dashboard';
        case 'stats':
            return '/dashboard/stats';
        case 'activities':
            return '/dashboard?tab=activities';
        case 'suggestions':
            return '/dashboard?tab=suggestions';
        case 'rewards':
            return '/dashboard?tab=rewards';
        case 'calendar':
            return '/dashboard?tab=calendar';
        case 'streak':
            return '/dashboard?tab=streak';
        case 'profile':
            return '/dashboard/profile';
        case 'settings':
            return '/dashboard/settings';
        case 'export':
            return '/dashboard?tab=export';
    }
}