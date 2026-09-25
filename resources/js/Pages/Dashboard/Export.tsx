import { Download } from 'lucide-react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useI18n } from '@/lib/i18n';

const PERIODS: { key: string; labelKey: string }[] = [
    { key: 'today', labelKey: 'exportPeriodTom' },
    { key: 'week', labelKey: 'exportPeriodWeek' },
    { key: 'month', labelKey: 'exportPeriodMonth' },
];

export default function ExportView() {
    const { t } = useI18n();

    const downloadExport = () => {
        window.location.href = '/api/export';
    };

    return (
        <DashboardLayout active="export">
            <div className="max-w-3xl space-y-6">
                <div>
                    <h2 className="text-2xl font-bold">{t('exportTitle')}</h2>
                    <p className="text-sm text-muted-foreground">{t('exportSubtitle')}</p>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    {PERIODS.map((period) => (
                        <Card key={period.key}>
                            <CardContent className="p-5">
                                <Download className="mb-4" />
                                <h3 className="font-semibold">
                                    {t('exportPeriod').replace('{label}', t(period.labelKey))}
                                </h3>
                                <p className="my-3 text-sm text-muted-foreground">{t('exportPeriodDetail')}</p>
                                <Button variant="outline" size="sm" onClick={downloadExport}>
                                    {t('exportCsv')}
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <Card>
                    <CardContent className="flex items-center gap-4 p-5">
                        <div className="grid h-10 w-10 place-items-center rounded-lg bg-muted">
                            <Download size={18} />
                        </div>
                        <div>
                            <p className="font-medium">{t('exportPdf')}</p>
                            <p className="text-sm text-muted-foreground">{t('exportPdfNote')}</p>
                        </div>
                        <Button className="ml-auto" variant="outline" onClick={() => window.print()}>
                            {t('exportPdf')}
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}