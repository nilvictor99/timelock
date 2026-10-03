import * as React from 'react';

type Theme = 'light' | 'dark' | 'system';

type ThemeContextValue = {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    resolvedTheme: 'light' | 'dark';
};

const STORAGE_KEY = 'timelock-theme';

const ThemeContext = React.createContext<ThemeContextValue | undefined>(undefined);

function getInitialTheme(): Theme {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored === 'light' || stored === 'dark' || stored === 'system') {
            return stored;
        }
    } catch {
        // ignore
    }
    return 'system';
}

function getResolvedTheme(theme: Theme): 'light' | 'dark' {
    if (theme === 'system') {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return theme;
}

function applyTheme(resolved: 'light' | 'dark') {
    document.documentElement.classList.toggle('dark', resolved === 'dark');
}

export function ThemeProvider({
    children,
    initialTheme,
}: {
    children: React.ReactNode;
    initialTheme?: Theme;
}) {
    const initial = initialTheme ?? getInitialTheme();

    const [theme, setThemeState] = React.useState<Theme>(initial);
    const [resolvedTheme, setResolvedTheme] = React.useState<'light' | 'dark'>(() =>
        getResolvedTheme(initial),
    );

    React.useEffect(() => {
        const resolved = getResolvedTheme(theme);
        applyTheme(resolved);
        setResolvedTheme(resolved);

        if (theme !== 'system') {
            return;
        }

        const media = window.matchMedia('(prefers-color-scheme: dark)');
        const onChange = () => {
            const next = media.matches ? 'dark' : 'light';
            applyTheme(next);
            setResolvedTheme(next);
        };
        media.addEventListener('change', onChange);
        return () => media.removeEventListener('change', onChange);
    }, [theme]);

    const setTheme = React.useCallback((next: Theme) => {
        try {
            localStorage.setItem(STORAGE_KEY, next);
        } catch {
            // ignore
        }
        setThemeState(next);
    }, []);

    return (
        <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme(): ThemeContextValue {
    const context = React.useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}