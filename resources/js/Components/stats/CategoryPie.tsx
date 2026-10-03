import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { CHART_COLORS } from '@/lib/charts';
import type { StatsSummary } from './types';
import { formatDuration, type Translator } from './format';

export function CategoryPie({ data, t }: { data: StatsSummary['category']; t: Translator }) {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <PieChart>
                <Pie data={data} dataKey="minutes" nameKey="name" outerRadius={90} label>
                    {data.map((item, index) => (
                        <Cell key={item.name} fill={item.color ?? CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                </Pie>
                <Tooltip formatter={(value) => formatDuration(Number(value ?? 0), t)} />
            </PieChart>
        </ResponsiveContainer>
    );
}
