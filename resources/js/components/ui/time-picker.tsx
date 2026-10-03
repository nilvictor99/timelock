import * as React from 'react';
import { ClockIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';

const HOURS = Array.from({ length: 24 }, (_, index) => index);
const MINUTES = Array.from({ length: 12 }, (_, index) => index * 5);

function splitValue(value: string): { hour: number; minute: number } | null {
    const match = /^(\d{2}):(\d{2})$/.exec(value);
    if (!match) return null;
    return { hour: Number(match[1]), minute: Number(match[2]) };
}

function pad(value: number): string {
    return String(value).padStart(2, '0');
}

function pickerCellClass(selected: boolean): string {
    return cn(
        'flex h-8 items-center justify-center rounded-md text-sm transition-colors',
        selected ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-foreground',
    );
}

export function TimePicker({
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
    const { t } = useI18n();
    const [open, setOpen] = React.useState(false);
    const current = splitValue(value);

    const select = (hour: number, minute: number) => {
        onChange(`${pad(hour)}:${pad(minute)}`);
        setOpen(false);
    };

    const setNow = () => {
        const now = new Date();
        select(now.getHours(), now.getMinutes());
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
                    <span className={cn('block truncate', !current && 'text-muted-foreground')}>
                        {current ? `${pad(current.hour)}:${pad(current.minute)}` : (placeholder ?? '')}
                    </span>
                </span>
                <ClockIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            </PopoverTrigger>
            <PopoverContent align="start" className="w-64 p-3">
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <p className="mb-1.5 text-xs text-muted-foreground">{t('timePickerHours')}</p>
                        <div className="grid max-h-44 grid-cols-3 gap-1 overflow-auto pr-1">
                            {HOURS.map((hour) => (
                                <button
                                    key={hour}
                                    type="button"
                                    className={pickerCellClass(current?.hour === hour)}
                                    onClick={() => select(hour, current?.minute ?? 0)}
                                >
                                    {pad(hour)}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <p className="mb-1.5 text-xs text-muted-foreground">{t('timePickerMinutes')}</p>
                        <div className="grid max-h-44 grid-cols-3 gap-1 overflow-auto pr-1">
                            {MINUTES.map((minute) => (
                                <button
                                    key={minute}
                                    type="button"
                                    className={pickerCellClass(current?.minute === minute)}
                                    onClick={() => select(current?.hour ?? 0, minute)}
                                >
                                    {pad(minute)}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
                <Button variant="outline" size="sm" className="mt-3 w-full" onClick={setNow}>
                    {t('timePickerNow')}
                </Button>
            </PopoverContent>
        </Popover>
    );
}
