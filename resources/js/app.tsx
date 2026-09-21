import '@vitejs/plugin-react/preamble';
import '../css/app.css';
import { type ComponentType } from 'react';
import { createRoot } from 'react-dom/client';
import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { I18nProvider } from '@/lib/i18n';
import { ThemeProvider } from '@/lib/theme';

type PageProps = {
    auth?: { user?: { theme?: string } };
    locale?: string;
};

const themeFromUser = (theme?: string): 'light' | 'dark' | 'system' =>
    theme === 'LIGHT' ? 'light' : theme === 'DARK' ? 'dark' : 'system';

createInertiaApp({
    title: (title) => (title ? `${title} · TimeLock-v` : 'TimeLock-v'),
    resolve: (name) =>
        resolvePageComponent(`./Pages/${name}.tsx`, import.meta.glob('./Pages/**/*.tsx')) as Promise<ComponentType>,
    setup({ el, App, props }) {
        const pageProps = props.initialPage.props as PageProps;
        const user = pageProps.auth?.user;
        const locale = pageProps.locale;

        createRoot(el as HTMLElement).render(
            <I18nProvider locale={locale}>
                <ThemeProvider initialTheme={themeFromUser(user?.theme)}>
                    <App {...props} />
                </ThemeProvider>
            </I18nProvider>,
        );
    },
});