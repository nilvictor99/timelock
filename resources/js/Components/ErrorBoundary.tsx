import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useI18n } from '@/lib/i18n';

type Props = {
    children?: React.ReactNode;
    /** Replaces the default recovery actions, e.g. with a link back home. */
    fallback?: (retry: () => void) => React.ReactNode;
};

type State = {
    error: Error | null;
    /** Bumped on every retry so the subtree remounts instead of replaying the error. */
    attempt: number;
};

/**
 * React unmounts the entire tree when a render throws, which leaves the page
 * blank with no explanation. A silent white page is the hardest kind of bug to
 * report, so every view gets a boundary that keeps the shell and says what broke.
 */
export default class ErrorBoundary extends React.Component<Props, State> {
    state: State = { error: null, attempt: 0 };

    static getDerivedStateFromError(error: Error): Partial<State> {
        return { error };
    }

    componentDidCatch(error: Error, info: React.ErrorInfo) {
        // Logged in production too: a caught error that only exists in dev is
        // indistinguishable from a blank page for whoever has to debug it.
        console.error('[TimeLock] error no controlado en la vista', error, info.componentStack);
    }

    private retry = () => {
        this.setState((state) => ({ error: null, attempt: state.attempt + 1 }));
    };

    render() {
        const { error, attempt } = this.state;

        if (!error) {
            return <React.Fragment key={attempt}>{this.props.children}</React.Fragment>;
        }

        return (
            <div className="grid min-h-dvh place-items-center p-4">
                <Card className="w-full max-w-md">
                    <CardHeader className="space-y-1">
                        <CardTitle>Error</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Recovery error={error} onRetry={this.retry} fallback={this.props.fallback} />
                    </CardContent>
                </Card>
            </div>
        );
    }
}

function Recovery({
    error,
    onRetry,
    fallback,
}: {
    error: Error;
    onRetry: () => void;
    fallback: Props['fallback'];
}) {
    const { t } = useI18n();

    if (fallback) return <>{fallback(onRetry)}</>;

    return (
        <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{t('appError.description')}</p>
            {import.meta.env.DEV && (
                <pre className="max-h-40 overflow-auto rounded-md border bg-muted p-2 text-xs whitespace-pre-wrap">
                    {error.message}
                </pre>
            )}
            <div className="flex flex-wrap gap-2">
                <Button type="button" onClick={onRetry}>
                    {t('appError.retry')}
                </Button>
                <Button type="button" variant="outline" onClick={() => window.location.assign('/dashboard')}>
                    {t('appError.home')}
                </Button>
            </div>
        </div>
    );
}
