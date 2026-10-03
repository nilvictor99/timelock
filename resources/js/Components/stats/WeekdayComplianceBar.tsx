import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { chartVar } from '@/lib/charts';
import type { StatsSummary } from './types';
import type { Translator } from './format';

export const WEEKDAY_KEYS = ['sunShort', 'monShort', 'tueShort', 'wedShort', 'thuShort', 'friShort', 'satShort'] as const;

export function WeekdayComplianceBar({ data, t }: { data: StatsSummary['weekday']; t: Translator }) {
    const localized = data.map((item) => ({ ...item, day: t(WEEKDAY_KEYS[item.day]) }));

    return (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart data={localized}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis domain={[0, 100]} />
                <Tooltip formatter={(value) => `${value}%`} />
                <Bar dataKey="compliance" fill={chartVar(4)} radius={[4, 4, 0, 0]} />
            </BarChart>
        </ResponsiveContainer>
    );
}
