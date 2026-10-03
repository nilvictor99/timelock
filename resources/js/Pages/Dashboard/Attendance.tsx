import * as React from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useI18n } from '@/lib/i18n';
import { apiGet, apiPost } from '@/lib/api';

type AttendanceItem = {
  id:string;
  type:string;
  started_at:string;
  ended_at:string|null;
  duration_minutes:number|null;
  location?:string|null;
  notes?:string|null;
};

export default function AttendancePage(){
  const { t } = useI18n();
  const [from,setFrom]=React.useState<string>(new Date().toISOString().slice(0,10));
  const [to,setTo]=React.useState<string>(new Date().toISOString().slice(0,10));
  const [items,setItems]=React.useState<AttendanceItem[]>([]);
  const [summary,setSummary]=React.useState({work_minutes:0,break_minutes:0,sessions:0});
  const [loading,setLoading]=React.useState(false);
  const [toggling,setToggling]=React.useState<'WORK'|'BREAK'|null>(null);

  const loadHistory = async ()=>{
    setLoading(true);
    try{
      const res = await apiGet<any>(`/api/attendance?from=${from}&to=${to}`);
      setItems(res.items||[]);
      setSummary(res.summary||{work_minutes:0,break_minutes:0,sessions:0});
    }catch{} finally { setLoading(false); }
  };

  React.useEffect(()=>{ void loadHistory(); },[from,to]);

  const toggle = async (type:'WORK'|'BREAK')=>{
    setToggling(type);
    try{
      let locationData:any = undefined;
      if (navigator.geolocation) {
        try {
          const pos = await new Promise<GeolocationPosition>((resolve,reject)=>{
            navigator.geolocation.getCurrentPosition(resolve,reject,{enableHighAccuracy:false,timeout:3000,maximumAge:60000});
          });
          locationData = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            address: '',
          };
        } catch {}
      }
      await apiPost('/api/attendance/toggle',{type, ...locationData});
      await loadHistory();
    }finally{
      setToggling(null);
    }
  };

  const active = items.find(i=>!i.ended_at);
  const fmt = (iso:string)=> new Date(iso).toLocaleString();

  return (
    <DashboardLayout active="attendance" subtitle={t('attendance.subtitle')}>
      <div className="mx-auto max-w-5xl space-y-6 p-6">
        <Card>
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <CardTitle className="text-xl">{t('attendance.title')}</CardTitle>
              <p className="text-sm text-muted-foreground">{t('attendance.subtitle')}</p>
            </div>
            <div className="flex items-center gap-2">
              {active && (
                <Badge variant="secondary" className="text-xs">
                  {active.type === 'WORK' ? t('attendance.work') : t('attendance.break')} · {fmt(active.started_at)}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-2">
                <Button onClick={()=>toggle('WORK')} disabled={!!toggling} className="min-w-[140px]">
                  {toggling==='WORK'?'...':t('attendance.work')}
                </Button>
                <Button variant="outline" onClick={()=>toggle('BREAK')} disabled={!!toggling} className="min-w-[140px]">
                  {toggling==='BREAK'?'...':t('attendance.break')}
                </Button>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <span className="text-xs text-muted-foreground">{t('attendance.history.from')}</span>
                  <DatePicker value={from} onChange={setFrom}/>
                </div>
                <div className="flex-1">
                  <span className="text-xs text-muted-foreground">{t('attendance.history.to')}</span>
                  <DatePicker value={to} onChange={setTo}/>
                </div>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-3 gap-3">
              {loading ? (
                <>
                  <Skeleton className="h-20 rounded-lg"/>
                  <Skeleton className="h-20 rounded-lg"/>
                  <Skeleton className="h-20 rounded-lg"/>
                </>
              ) : (
                <>
                  <div className="rounded-lg border p-4">
                    <div className="text-xs text-muted-foreground">{t('attendance.history.summary.work')}</div>
                    <div className="mt-1 text-2xl font-semibold">{summary.work_minutes}<span className="text-sm font-normal text-muted-foreground">m</span></div>
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="text-xs text-muted-foreground">{t('attendance.history.summary.break')}</div>
                    <div className="mt-1 text-2xl font-semibold">{summary.break_minutes}<span className="text-sm font-normal text-muted-foreground">m</span></div>
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="text-xs text-muted-foreground">{t('attendance.history.summary.sessions')}</div>
                    <div className="mt-1 text-2xl font-semibold">{summary.sessions}</div>
                  </div>
                </>
              )}
            </div>

            <div>
              <div className="mb-3 text-sm font-medium">{t('attendance.history.title')}</div>
              {loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full"/>
                  <Skeleton className="h-4 w-5/6"/>
                  <Skeleton className="h-4 w-4/6"/>
                </div>
              ) : items.length === 0 ? (
                <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                  {t('attendance.history.empty')}
                </div>
              ) : (
                <ul className="max-h-80 overflow-auto rounded-lg border divide-y">
                  {items.slice(0,50).map(i=>(
                    <li key={i.id} className="grid grid-cols-1 sm:grid-cols-[auto_1fr_auto] gap-2 px-4 py-3 text-sm border-b last:border-0">
                      <Badge variant={i.type==='WORK'?'default':'secondary'} className="self-start">
                        {i.type==='WORK' ? t('attendance.work') : t('attendance.break')}
                      </Badge>
                      <div className="min-w-0">
                        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                          <span>{t('attendance.history.start')}: {fmt(i.started_at)}</span>
                          {i.ended_at && <span>{t('attendance.history.end')}: {fmt(i.ended_at)}</span>}
                          <span>{t('attendance.history.duration')}: {i.duration_minutes ?? '—'}m</span>
                        </div>
                        <div className="text-xs">
                          <span className="text-muted-foreground">{t('attendance.history.location')}:</span>{' '}
                          {i.location ? (
                            <span className="truncate max-w-[320px] inline-block">{i.location}</span>
                          ) : (
                            <span className="text-muted-foreground">{t('attendance.history.noLocation')}</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right tabular-nums text-sm font-medium self-start">
                        {i.duration_minutes ?? '—'}m
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
