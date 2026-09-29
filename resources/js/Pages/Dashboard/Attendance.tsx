import { DashboardLayout } from '@/Components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useI18n } from '@/lib/i18n';

export default function AttendancePage() {
  const { t } = useI18n();
  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('attendance.title') || 'Asistencias'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-sm">TTL</label>
                <Input placeholder="5" />
              </div>
              <div>
                <label className="text-sm">Unidad</label>
                <Select>
                  <SelectTrigger><SelectValue placeholder="minutos" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minutes">minutos</SelectItem>
                    <SelectItem value="days">días</SelectItem>
                    <SelectItem value="never">nunca</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button variant="outline">Guardar</Button>
              </div>
            </div>
            <div className="flex gap-3">
              <Button>{t('attendance.work') || 'Trabajo'}</Button>
              <Button variant="outline">{t('attendance.break') || 'Descanso'}</Button>
            </div>
            <p className="text-sm text-muted-foreground">{t('attendance.placeholder') || 'Módulo en construcción'}</p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
