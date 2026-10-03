import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function ChartCard({
    title,
    loading,
    children,
    className,
}: {
    title: string;
    loading?: boolean;
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <Card className={className}>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <Skeleton className="h-64 w-full" />
                ) : (
                    <div className="h-64 w-full" role="img" aria-label={title}>
                        {children}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
