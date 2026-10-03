import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { chartVar } from '@/lib/charts';
import type { StatsSummary } from './types';

export function TopActivitiesBar({ data }: { data: StatsSummary['topActivities'] }) {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" allowDecimals={false} />
                <YAxis type="category" dataKey="name" width={95} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill={chartVar(2)} radius={[0, 4, 4, 0]} />
            </BarChart>
        </ResponsiveContainer>
    );
}
