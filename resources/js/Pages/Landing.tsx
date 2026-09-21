import { Button } from '@/Components/ui/Button';
import { Card, CardContent } from '@/Components/ui/Card';
import { Badge } from '@/Components/ui/Badge';
import { useI18n } from '@/lib/i18n';
import { useTheme } from '@/lib/theme';

export default function Landing({ appName }: { appName: string }) {
    const { theme, setTheme } = useTheme();
    const { t, locale } = useI18n();
    return (
        <main className="min-h-screen bg-background p-8 text-foreground">
            <Card>
                <CardContent className="space-y-4">
                    <h1 className="text-2xl font-semibold">
                        {appName ?? 'TimeLock-v'} — {t('landing.hero')}
                    </h1>
                    <Badge>shadcn/ui portado · {locale}</Badge>
                    <div className="flex gap-2">
                        <Button size="lg">{t('landing.start')}</Button>
                        <Button variant="outline">{t('landing.login')}</Button>
                        <Button
                            variant="ghost"
                            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                        >
                            {t('landing.theme')}: {theme}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </main>
    );
}