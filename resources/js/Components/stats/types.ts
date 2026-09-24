export type StatsSummary = {
    kpis: {
        totalMinutes: number;
        completed: number;
        points: number;
        rewardsRedeemed: number;
        pointsSpent: number;
    };
    category: { name: string; minutes: number; color?: string | null }[];
    daily: { date: string; minutes: number; completed: number; total: number }[];
    topActivities: { name: string; count: number }[];
    weekday: { day: number; completed: number; total: number; compliance: number }[];
    streak: {
        current: number;
        longest: number;
        perfectDays: number;
        history: { date: string; completed: boolean; total: number }[];
    };
    rewardTrend: { date: string; count: number }[];
    rewards: { id: string; title: string; cost: number; redeemedAt?: string | null }[];
    options: {
        activities: { id: string; title: string }[];
        categories: { id: string; name: string; color: string }[];
    };
};
