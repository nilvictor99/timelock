import * as React from 'react';
import { format, parse } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';

export function DatePicker({
    value,
    onChange,
    placeholder,
    label,
    disabled,
    className,
    id,
}: {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    label?: string;
    disabled?: boolean;
    className?: string;
    id?: string;
}) {
    const { locale } = useI18n();
    const [open, setOpen] = React.useState(false);
    const dateLocale = locale === 'en' ? enUS : es;
    const parsed = value ? parse(value, 'yyyy-MM-dd', new Date()) : undefined;
    const isValid = parsed !== undefined && !Number.isNaN(parsed.getTime());
    const [month, setMonth] = React.useState<Date | undefined>(isValid ? parsed : new Date());

    const handleSelect = (selected: Date | undefined) => {
        if (!selected) return;
        const year = selected.getFullYear();
        const monthValue = String(selected.getMonth() + 1).padStart(2, '0');
        const day = String(selected.getDate()).padStart(2, '0');
        onChange(`${year}-${monthValue}-${day}`);
        setOpen(false);
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger
                id={id}
                disabled={disabled}
                className={cn(
                    'flex h-10 w-full items-center justify-between gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
                    !open && 'hover:bg-muted/50',
                    className,
                )}
            >
                <span className="min-w-0 text-left">
                    {label && (
                        <span className="pointer-events-none block text-[10px] leading-tight text-muted-foreground">
                            {label}
                        </span>
                    )}
                    <span className={cn('block truncate', !isValid && 'text-muted-foreground')}>
                        {isValid ? format(parsed, 'd MMM yyyy', { locale: dateLocale }) : (placeholder ?? '')}
                    </span>
                </span>
                <CalendarIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            </PopoverTrigger>
            <PopoverContent align="start" className="w-auto p-0">
                <Calendar
                    mode="single"
                    locale={dateLocale}
                    month={month}
                    onMonthChange={setMonth}
                    selected={isValid ? parsed : undefined}
                    onSelect={handleSelect}
                />
            </PopoverContent>
        </Popover>
    );
}
