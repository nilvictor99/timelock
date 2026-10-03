export type Theme = 'LIGHT' | 'DARK' | 'SYSTEM';
export type Language = 'es' | 'en';
export type OperationMode = 'SYNCHRONOUS' | 'FREE';

export type User = {
    id: string;
    email: string;
    name: string;
    emoji?: string | null;
    timezone?: string | null;
    language: Language;
    operationMode: OperationMode;
    theme: Theme;
    points: number;
    currentStreak?: number | null;
    bestStreak?: number | null;
    onboardingCompleted: boolean;
    avatarUrl?: string | null;
    pauseActive?: boolean | null;
    pauseStartsAt?: string | null;
    pauseEndsAt?: string | null;
    pauseReason?: string | null;
};

export type Category = {
    id: string;
    name: string;
    color: string;
    pointsPerHour: number;
};

export type Reward = {
    id: string;
    title: string;
    cost: number;
    description?: string | null;
    redeemedAt?: string | null;
};

export type ActivityStatus = 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED';

export type Activity = {
    id: string;
    title: string;
    description?: string | null;
    date: string;
    startAt: string;
    endAt: string;
    status: ActivityStatus;
    points: number;
    isFree: boolean;
    completedAt?: string | null;
    categoryId?: string | null;
    category?: Category | null;
};

export type Bootstrap = {
    user: User;
    activities: Activity[];
    categories: Category[];
    rewards: Reward[];
    today: string;
};

export type Suggestion = {
    id: string;
    title: string;
    category: string;
    duration: number;
    reason: string;
    points: number;
    suggestedTime?: string | null;
    source: 'ai' | 'rule';
};