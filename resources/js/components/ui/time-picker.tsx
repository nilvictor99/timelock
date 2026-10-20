import * as React from 'react';
import { ClockIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';

const HOURS = Array.from({ length: 24 }, (_, index) => index);
const MINUTES = Array.from({ length: 60 }, (_, index) => index);

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
        'flex min-w-[3rem] h-7 items-center justify-center rounded-md text-xs transition-colors',
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
    isSlotDisabled,
}: {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    label?: string;
    disabled?: boolean;
    className?: string;
    id?: string;
    isSlotDisabled?: (hour: number, minute: number) => boolean;
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
            <PopoverContent align="start" className="w-72 p-2 max-h-[80vh] overflow-auto">
                <div className="mb-2">
                    <label className="mb-1 block text-xs text-muted-foreground">{t('timePickerManual')}</label>
                    <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-2][0-9]:[0-5][0-9]"
                        placeholder={t('timePickerPlaceholder')}
                        value={value}
                        onChange={(e) => {
                            const v = e.target.value;
                            if (/^\d{2}:\d{2}$/.test(v)) {
                                onChange(v);
                            }
                        }}
                        className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <p className="mb-1 text-xs text-muted-foreground">{t('timePickerHours')}</p>
                        <div className="flex flex-col gap-0.5 max-h-40 overflow-y-auto pr-1 py-0.5"> 
                            {HOURS.map((hour) => {
                                const disabledSlot = isSlotDisabled?.(hour, current?.minute ?? 0);
                                return (
                                <button
                                    key={hour}
                                    type="button"
                                    disabled={disabledSlot}
                                    className={cn(pickerCellClass(current?.hour === hour), disabledSlot && 'opacity-40 cursor-not-allowed')}
                                    onClick={() => !disabledSlot && select(hour, current?.minute ?? 0)}
                                >
                                    {pad(hour)}
                                </button>
                                );
                            })}
                        </div>
                    </div>
                    <div>
                        <p className="mb-1 text-xs text-muted-foreground">{t('timePickerMinutes')}</p>
                        <div className="flex flex-col gap-0.5 max-h-40 overflow-y-auto pr-1 py-0.5">
                            {MINUTES.map((minute) => {
                                const disabledSlot = isSlotDisabled?.(current?.hour ?? 0, minute);
                                return (
                                <button
                                    key={minute}
                                    type="button"
                                    disabled={disabledSlot}
                                    className={cn(pickerCellClass(current?.minute === minute), disabledSlot && 'opacity-40 cursor-not-allowed')}
                                    onClick={() => !disabledSlot && select(current?.hour ?? 0, minute)}
                                >
                                    {pad(minute)}
                                </button>
                                );
                            })}
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
