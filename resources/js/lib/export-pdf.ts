import { apiGet } from '@/lib/api';

export type ExportUser = Record<string, any>;

export type ExportActivity = {
    title: string;
    status: string;
    points: number;
    date: string | null;
    startAt: string | null;
    endAt: string | null;
    isFree: boolean;
    category: { name: string } | null;
};

const MARGIN = 14;
const PAGE_WIDTH = 210;
const BOTTOM = 282;
const FOOTER = 290;

type Translator = (key: string) => string;

function fit(text: string, max: number): string {
    return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function fmt(value: string | null): string {
    if (!value) {
        return '—';
    }

    const parsed = new Date(value);

    return Number.isNaN(parsed.getTime()) ? '—' : parsed.toLocaleString();
}

export async function downloadUserStatePdf(t: Translator): Promise<void> {
    const exported = await apiGet<{ user?: ExportUser; activities?: ExportActivity[] }>('/api/export?format=json');
    const { jsPDF } = await import('jspdf');
    const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
    const activities = exported.activities ?? [];
    const user = exported.user ?? {};
    const textWidth = PAGE_WIDTH - MARGIN * 2;

    pdf.setFontSize(18);
    pdf.text('TimeLock-v', MARGIN, 20);
    pdf.setFontSize(10);
    pdf.setTextColor(110);
    pdf.text(fit(`${user.name ?? ''} · ${user.email ?? ''}`, 80), MARGIN, 27);
    pdf.text(new Date().toLocaleString(), MARGIN, 33);
    pdf.setTextColor(0);

    let y = 46;

    pdf.setFontSize(12);
    pdf.text(t('exportPdfSummary'), MARGIN, y);
    pdf.setFontSize(9);
    y += 6;

    const summary: Array<[string, string]> = [
        [t('exportPdfTotalActivities'), String(activities.length)],
        [t('exportPdfCompleted'), String(activities.filter((a) => a.status === 'COMPLETED').length)],
        [t('exportPdfPoints'), String(activities.reduce((total, a) => total + (Number(a.points) || 0), 0))],
        [t('exportPdfCurrentStreak'), String(user.currentStreak ?? 0)],
        [t('exportPdfBestStreak'), String(user.bestStreak ?? 0)],
        [t('exportPdfCategories'), String(new Set(activities.map((a) => a.category?.name).filter(Boolean)).size)],
    ];

    for (const [label, value] of summary) {
        if (y > BOTTOM) {
            pdf.addPage();
            y = 20;
        }
        pdf.text(fit(label, 52), MARGIN, y);
        pdf.text(fit(value, 20), PAGE_WIDTH - MARGIN, y, { align: 'right' });
        y += 5.5;
    }

    y += 4;
    pdf.setFontSize(12);
    pdf.text(t('exportPdfActivities'), MARGIN, y);
    pdf.setFontSize(9);
    y += 6;

    if (activities.length === 0) {
        pdf.setTextColor(130);
        pdf.text(t('exportPdfNoActivities'), MARGIN, y);
        pdf.setTextColor(0);
    }

    for (const activity of activities) {
        if (y > BOTTOM) {
            pdf.addPage();
            y = 20;
        }

        const span = `${fmt(activity.startAt)} → ${fmt(activity.endAt)}`;
        const chars = Math.max(24, Math.floor(textWidth / 1.9) - Math.ceil(span.length / 2));

        pdf.setFontSize(10);
        pdf.text(fit(activity.title, chars), MARGIN, y);
        y += 5;

        pdf.setFontSize(8.5);
        pdf.setTextColor(110);
        pdf.text(
            fit(
                [activity.category?.name ?? t('exportPdfNoCategory'), span, activity.status, `${activity.points} ${t('exportPdfPts')}`].join(' · '),
                Math.floor(textWidth / 1.7),
            ),
            MARGIN,
            y,
        );
        pdf.setTextColor(0);
        y += 8;
    }

    const pages = pdf.getNumberOfPages();

    for (let page = 1; page <= pages; page += 1) {
        pdf.setPage(page);
        pdf.setFontSize(8);
        pdf.setTextColor(140);
        pdf.text(`${page} / ${pages}`, PAGE_WIDTH - MARGIN, FOOTER, { align: 'right' });
    }

    pdf.setTextColor(0);
    pdf.save('timelock-estado-completo.pdf');
}
