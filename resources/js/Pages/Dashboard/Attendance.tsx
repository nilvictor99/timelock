import * as React from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { useI18n } from '@/lib/i18n';
import { apiGet, apiPost } from '@/lib/api';

type AttendanceItem = {
  id:string;
  type:string;
  started_at:string;
  ended_at:string|null;
  duration_minutes:number|null;
};

export default function AttendancePage(){
  const { t } = useI18n();
  const [from,setFrom]=React.useState<string>(new Date().toISOString().slice(0,10));
  const [to,setTo]=React.useState<string>(new Date().toISOString().slice(0,10));
  const [items,setItems]=React.useState<AttendanceItem[]>([]);
  const [summary,setSummary]=React.useState({work_minutes:0,break_minutes:0,sessions:0});
  const [historyLoading,setHistoryLoading]=React.useState(false);

  const loadHistory = async ()=>{
    setHistoryLoading(true);
    try{
      const res = await apiGet<any>(`/api/attendance?from=${from}&to=${to}`);
      setItems(res.items||[]);
      setSummary(res.summary||{work_minutes:0,break_minutes:0,sessions:0});
    }catch{} finally { setHistoryLoading(false); }
  };

  React.useEffect(()=>{ void loadHistory(); },[from,to]);

  const toggle = async (type:'WORK'|'BREAK')=>{
    await apiPost('/api/attendance/toggle',{type});
    await loadHistory();
  };

  return (
    <DashboardLayout active="attendance" subtitle={t('attendance.subtitle')}>
      <div className="mx-auto max-w-6xl space-y-6 p-6">
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>{t('attendance.control.title')}</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <Button onClick={()=>toggle('WORK')} className="min-w-[160px]">{t('attendance.work')}</Button>
                <Button variant="outline" onClick={()=>toggle('BREAK')} className="min-w-[160px]">{t('attendance.break')}</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>{t('attendance.history.title')}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <div className="flex-1"><span className="text-xs text-muted-foreground">{t('attendance.history.from')}</span><DatePicker value={from} onChange={setFrom}/></div>
                <div className="flex-1"><span className="text-xs text-muted-foreground">{t('attendance.history.to')}</span><DatePicker value={to} onChange={setTo}/></div>
              </div>
              {historyLoading ? <div className="h-16 animate-pulse rounded bg-muted" /> : (
                <div className="text-sm">
                  {t('attendance.history.summary.work')}: {summary.work_minutes}m • {t('attendance.history.summary.break')}: {summary.break_minutes}m • {t('attendance.history.summary.sessions')}: {summary.sessions}
                </div>
              )}
              {historyLoading ? <div className="space-y-2"><div className="h-4 animate-pulse rounded bg-muted"/><div className="h-4 animate-pulse rounded bg-muted"/></div> :
                items.length === 0 ? <div className="text-sm text-muted-foreground">{t('attendance.history.empty')}</div> :
                <ul className="space-y-1 text-sm max-h-64 overflow-auto">
                  {items.slice(0,20).map(i=>(
                    <li key={i.id} className="flex justify-between border-b py-1">
                      <span>{i.type} {new Date(i.started_at).toLocaleString()}</span>
                      <span>{i.duration_minutes ?? '-'}m</span>
                    </li>
                  ))}
                </ul>
              }
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
