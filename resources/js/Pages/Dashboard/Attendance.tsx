import * as React from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { DatePicker } from '@/components/ui/date-picker';
import { useI18n } from '@/lib/i18n';
import { apiGet, apiPatch, apiPost } from '@/lib/api';
import { useAutosave } from '@/lib/use-autosave';

type ConfigForm = {
  attendance_qr_ttl: number;
  attendance_qr_ttl_unit: 'minutes'|'days'|'never';
  attendance_close_on_rescan: boolean;
};

type AttendanceItem = {
  id:string;
  type:string;
  started_at:string;
  ended_at:string|null;
  duration_minutes:number|null;
};

export default function AttendancePage(){
  const { t } = useI18n();
  const [config, setConfig] = React.useState<ConfigForm>({attendance_qr_ttl:5,attendance_qr_ttl_unit:'minutes',attendance_close_on_rescan:false});
  const [loaded,setLoaded]=React.useState(false);
  const [qrType,setQrType]=React.useState<'WORK'|'BREAK'>('WORK');
  const [qrToken,setQrToken]=React.useState<string|null>(null);
  const [qrExpires,setQrExpires]=React.useState<string|null>(null);
  const [qrLoading,setQrLoading]=React.useState(false);
  const [from,setFrom]=React.useState<string>(new Date().toISOString().slice(0,10));
  const [to,setTo]=React.useState<string>(new Date().toISOString().slice(0,10));
  const [items,setItems]=React.useState<AttendanceItem[]>([]);
  const [summary,setSummary]=React.useState({work_minutes:0,break_minutes:0,sessions:0});
  const [historyLoading,setHistoryLoading]=React.useState(false);

  const loadConfig = async ()=>{
    const data = await apiGet<any>('/api/bootstrap');
    const u = data.user;
    setConfig({
      attendance_qr_ttl: u.attendance_qr_ttl ?? 5,
      attendance_qr_ttl_unit: u.attendance_qr_ttl_unit ?? 'minutes',
      attendance_close_on_rescan: !!u.attendance_close_on_rescan,
    });
    setLoaded(true);
  };

  React.useEffect(()=>{ void loadConfig(); },[]);
  React.useEffect(()=>{ void loadHistory(); },[from,to]);

  const saveConfig = async (key:keyof ConfigForm,value:any):Promise<boolean>=>{
    try{
      const res = await apiPatch('/api/attendance/config',{ [key]:value });
      setConfig(prev=>({...prev,[key]:res[key]}));
      return true;
    }catch{ return false; }
  };
  const { statuses } = useAutosave({values:config,ready:loaded,save:saveConfig,onRevert:(k,v)=>setConfig(p=>({...p,[k]:v}))});

  const loadHistory = async ()=>{
    setHistoryLoading(true);
    try{
      const res = await apiGet<any>(`/api/attendance?from=${from}&to=${to}`);
      setItems(res.items||[]);
      setSummary(res.summary||{work_minutes:0,break_minutes:0,sessions:0});
    }catch{} finally { setHistoryLoading(false); }
  };

  const generateQr = async ()=>{
    setQrLoading(true);
    try{
      const res = await apiPost('/auth/attendance/qr',{type:qrType});
      setQrToken(res.token);
      setQrExpires(res.expires_at);
    }catch{} finally { setQrLoading(false); }
  };
  React.useEffect(()=>{ void generateQr(); },[qrType]);

  const toggle = async (type:'WORK'|'BREAK')=>{
    await apiPost('/api/attendance/toggle',{type});
    await loadHistory();
  };

  const unitLabel = t(`attendance.unit.${config.attendance_qr_ttl_unit}`) || config.attendance_qr_ttl_unit;

  return (
    <DashboardLayout active="attendance" subtitle={t('attendance.subtitle')}>
      <div className="mx-auto max-w-6xl space-y-6 p-6">
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>{t('attendance.config.title')}</CardTitle>
              {!loaded && <div className="h-4 w-24 animate-pulse rounded bg-muted" />}
            </CardHeader>
            <CardContent className="space-y-4">
              {loaded ? (
                <>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-muted-foreground">{t('attendance.config.ttl')}</label>
                      <Input type="number" min={1} value={config.attendance_qr_ttl} onChange={e=>setConfig(c=>({...c,attendance_qr_ttl:Number(e.target.value)}))} className="mt-1"/>
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">{t('attendance.config.unit')}</label>
                      <Select value={config.attendance_qr_ttl_unit} onValueChange={v=>setConfig(c=>({...c,attendance_qr_ttl_unit:v as any}))}>
                        <SelectTrigger className="mt-1"><SelectValue/></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="minutes">{t('attendance.unit.minutes')}</SelectItem>
                          <SelectItem value="days">{t('attendance.unit.days')}</SelectItem>
                          <SelectItem value="never">{t('attendance.unit.never')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <label className="flex items-center gap-2 text-sm"><Checkbox checked={config.attendance_close_on_rescan} onCheckedChange={v=>setConfig(c=>({...c,attendance_close_on_rescan:!!v}))}/>{t('attendance.config.closeOnRescan')}</label>
                  <div className="text-xs text-muted-foreground">{t('attendance.config.ttl')}: {config.attendance_qr_ttl && config.attendance_qr_ttl_unit !== 'never' ? `${config.attendance_qr_ttl} ${unitLabel}` : t('attendance.qr.never')}</div>
                </>
              ) : <div className="h-24 animate-pulse rounded bg-muted" />}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>{t('attendance.control.title')}</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <Button onClick={()=>toggle('WORK')} className="min-w-[160px]">{t('attendance.work')}</Button>
                <Button variant="outline" onClick={()=>toggle('BREAK')} className="min-w-[160px]">{t('attendance.break')}</Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>{t('attendance.qr.title')}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">{t('attendance.qr.type')}</span>
                <Select value={qrType} onValueChange={v=>setQrType(v as any)}>
                  <SelectTrigger className="w-[200px]"><SelectValue/></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WORK">{t('attendance.work')}</SelectItem>
                    <SelectItem value="BREAK">{t('attendance.break')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {qrLoading && <div className="h-48 animate-pulse rounded bg-muted" />}
              {qrToken && !qrLoading && (
                <div className="grid sm:grid-cols-[auto_1fr] gap-4 items-start">
                  <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrToken)}`} alt="qr" className="rounded border"/>
                  <div className="text-sm text-muted-foreground">
                    {t('attendance.qr.expires')}: {qrExpires ? new Date(qrExpires).toLocaleString() : t('attendance.qr.never')}
                  </div>
                </div>
              )}
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
