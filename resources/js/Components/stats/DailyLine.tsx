import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { chartVar } from '@/lib/charts';
import type { StatsSummary } from './types';
import { formatDuration, type Translator } from './format';

export function DailyLine({ data, t }: { data: StatsSummary['daily']; t: Translator }) {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => formatDuration(Number(value ?? 0), t)} />
                <Line type="monotone" dataKey="minutes" stroke={chartVar(1)} strokeWidth={2} dot={false} />
            </LineChart>
        </ResponsiveContainer>
    );
}
