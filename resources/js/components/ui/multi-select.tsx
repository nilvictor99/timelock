import * as React from 'react';
import { ChevronDown, Search, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export type MultiSelectOption = {
    id: string;
    label: string;
    color?: string | null;
};

export type MultiSelectLabels = {
    all: string;
    selected: (count: number) => string;
    search: string;
    empty: string;
    clear: string;
    selectAll?: string;
};

export function MultiSelect({
    options,
    value,
    onChange,
    label,
    labels,
    searchable = true,
    showSelectAll = false,
    className,
}: {
    options: MultiSelectOption[];
    value: string[];
    onChange: (next: string[]) => void;
    label: string;
    labels: MultiSelectLabels;
    searchable?: boolean;
    showSelectAll?: boolean;
    className?: string;
}) {
    const [open, setOpen] = React.useState(false);
    const [query, setQuery] = React.useState('');

    const visible = React.useMemo(() => {
        const needle = query.trim().toLowerCase();
        if (needle === '') return options;
        return options.filter((option) => option.label.toLowerCase().includes(needle));
    }, [options, query]);

    const selected = React.useMemo(() => {
        const byId = new Map(options.map((option) => [option.id, option]));
        return value
            .map((id) => byId.get(id))
            .filter((option): option is MultiSelectOption => option !== undefined);
    }, [options, value]);

    const toggle = (id: string) =>
        onChange(value.includes(id) ? value.filter((item) => item !== id) : [...value, id]);

    const footerVisible = value.length > 0 || (showSelectAll && options.length > 0);

    return (
        <div className={cn('w-full space-y-2', className)}>
            <Popover
                open={open}
                onOpenChange={(next) => {
                    setOpen(next);
                    if (!next) setQuery('');
                }}
            >
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        className="h-10 w-full justify-between font-normal"
                        aria-expanded={open}
                        aria-label={label}
                    >
                        <span className="truncate text-muted-foreground">
                            {value.length > 0 ? labels.selected(value.length) : labels.all}
                        </span>
                        <span className="flex items-center gap-1.5">
                            {value.length > 0 && (
                                <Badge className="rounded-full px-1.5 tabular-nums">{value.length}</Badge>
                            )}
                            <ChevronDown size={16} className="opacity-50" />
                        </span>
                    </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-[var(--radix-popper-anchor-width)] p-2">
                    {searchable && (
                        <div className="relative mb-1">
                            <Search size={14} className="absolute top-1/2 left-2.5 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                value={query}
                                onChange={(event) => setQuery(event.target.value)}
                                placeholder={labels.search}
                                className="h-8 pl-8 text-sm"
                            />
                        </div>
                    )}
                    <div role="listbox" aria-multiselectable="true" aria-label={label} className="max-h-64 overflow-auto p-1">
                        {visible.length === 0 && (
                            <p className="px-2 py-6 text-center text-xs text-muted-foreground">{labels.empty}</p>
                        )}
                        {visible.map((option) => {
                            const active = value.includes(option.id);
                            return (
                                <button
                                    key={option.id}
                                    type="button"
                                    role="option"
                                    aria-selected={active}
                                    onClick={() => toggle(option.id)}
                                    className={cn(
                                        'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted',
                                        active && 'bg-muted',
                                    )}
                                >
                                    <span className="pointer-events-none">
                                        <Checkbox checked={active} tabIndex={-1} />
                                    </span>
                                    {option.color && (
                                        <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: option.color }} />
                                    )}
                                    <span className="truncate">{option.label}</span>
                                </button>
                            );
                        })}
                    </div>
                    {footerVisible && (
                        <div className="flex items-center justify-between gap-2 border-t border-border pt-2">
                            {showSelectAll && labels.selectAll && value.length < options.length ? (
                                <button
                                    type="button"
                                    className="px-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                                    onClick={() => onChange(options.map((option) => option.id))}
                                >
                                    {labels.selectAll}
                                </button>
                            ) : (
                                <span />
                            )}
                            {value.length > 0 && (
                                <button
                                    type="button"
                                    className="px-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                                    onClick={() => onChange([])}
                                >
                                    {labels.clear}
                                </button>
                            )}
                        </div>
                    )}
                </PopoverContent>
            </Popover>
            {selected.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                    {selected.map((option) => (
                        <Badge key={option.id} className="gap-1 pr-1">
                            {option.color && (
                                <span className="size-1.5 rounded-full" style={{ backgroundColor: option.color }} />
                            )}
                            {option.label}
                            <button
                                type="button"
                                aria-label={`${labels.clear}: ${option.label}`}
                                onClick={() => toggle(option.id)}
                                className="rounded-full p-0.5 transition-colors hover:bg-foreground/10"
                            >
                                <X size={11} />
                            </button>
                        </Badge>
                    ))}
                </div>
            )}
        </div>
    );
}
