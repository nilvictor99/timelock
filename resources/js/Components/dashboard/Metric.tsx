import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';

export function Metric({
    title,
    value,
    detail,
    icon,
}: {
    title: string;
    value: string;
    detail: string;
    icon: React.ReactNode;
}) {
    return (
        <Card>
            <CardContent className="p-4">
                <div className="mb-3 flex items-center justify-between text-muted-foreground">
                    <span className="text-xs uppercase tracking-wide">{title}</span>
                    {icon}
                </div>
                <div className="text-2xl font-bold">{value}</div>
                <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
            </CardContent>
        </Card>
    );
}