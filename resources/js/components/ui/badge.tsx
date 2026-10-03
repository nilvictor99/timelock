import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
    'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-ring',
    {
        variants: {
            variant: {
                default: 'bg-muted text-muted-foreground',
                success: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300',
                warning: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300',
                danger: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
            },
        },
        defaultVariants: {
            variant: 'default',
        },
    },
);

function Badge({ className, variant = 'default', ...props }: React.ComponentProps<'span'> & VariantProps<typeof badgeVariants>) {
    return <span data-slot="badge" data-variant={variant} className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };