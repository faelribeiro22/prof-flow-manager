import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScheduleGrid, ScheduleSlot } from "@/components/Schedule/ScheduleGrid";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, Save, Loader2 } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTeacherSchedules, useBookSchedule, useFreeSchedule, useMarkScheduleUnavailable } from "@/hooks/useSchedules";
import { Database } from "@/integrations/supabase/types";

type Schedule = Database['public']['Tables']['schedules']['Row'];

interface ScheduleViewProps {
  user: {
    id: string;
    name: string;
    role: 'admin' | 'teacher';
  };
}

// Mapeamento de day_of_week (0-6) para chave de dia
const dayOfWeekToKey = (dayOfWeek: number): string => {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[dayOfWeek];
};

// Mapeamento de status do banco para ScheduleSlot
const mapStatus = (status: Schedule['status']): ScheduleSlot['status'] => {
  const statusMap: Record<string, ScheduleSlot['status']> = {
    'livre': 'free',
    'com_aluno': 'occupied',
    'indisponivel': 'unavailable',
  };
  return statusMap[status] || 'free';
};

// Mapeamento reverso de status
const mapStatusReverse = (status: ScheduleSlot['status']): Schedule['status'] => {
  const statusMap: Record<ScheduleSlot['status'], Schedule['status']> = {
    'free': 'livre',
    'occupied': 'com_aluno',
    'unavailable': 'indisponivel',
  };
  return statusMap[status];
};

export const ScheduleView = ({ user }: ScheduleViewProps) => {
  const [selectedSlot, setSelectedSlot] = useState<{ day: string; slot: ScheduleSlot; scheduleId: string } | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    status: 'free' as ScheduleSlot['status'],
    studentName: ''
  });
  const isMobile = useIsMobile();

  // Fetch schedules for current teacher (if teacher) or all (if admin)
  const { data: schedules, isLoading, error } = useTeacherSchedules(user.role === 'teacher' ? user.id : undefined);

  // Mutations
  const bookMutation = useBookSchedule();
  const freeMutation = useFreeSchedule();
  const unavailableMutation = useMarkScheduleUnavailable();

  // Transform database schedules to ScheduleGrid format
  const transformedSchedule = useMemo(() => {
    if (!schedules) return {};

    const schedule: Record<string, (ScheduleSlot & { scheduleId: string })[]> = {
      monday: [],
      tuesday: [],
      wednesday: [],
      thursday: [],
      friday: [],
    };

    schedules.forEach((s) => {
      const dayKey = dayOfWeekToKey(s.day_of_week);
      if (!schedule[dayKey]) schedule[dayKey] = [];

      schedule[dayKey].push({
        id: s.id,
        scheduleId: s.id,
        time: `${s.hour.toString().padStart(2, '0')}:00`,
        status: mapStatus(s.status),
        studentName: s.student_name || undefined,
        lastModified: s.updated_at ? new Date(s.updated_at) : undefined,
      });
    });

    // Sort by time for each day
    Object.keys(schedule).forEach(day => {
      schedule[day].sort((a, b) => a.time.localeCompare(b.time));
    });

    return schedule;
  }, [schedules]);

  const handleSlotClick = (day: string, slot: ScheduleSlot) => {
    const slotWithId = (transformedSchedule[day] || []).find(s => s.id === slot.id);
    if (!slotWithId) return;

    setSelectedSlot({ day, slot, scheduleId: slotWithId.scheduleId });
    setEditForm({
      status: slot.status,
      studentName: slot.studentName || ''
    });
    setIsEditDialogOpen(true);
  };

  const handleSaveSlot = async () => {
    if (!selectedSlot) return;

    const scheduleId = selectedSlot.scheduleId;

    try {
      // Use appropriate mutation based on new status
      if (editForm.status === 'occupied' && editForm.studentName) {
        await bookMutation.mutateAsync({
          id: scheduleId,
          studentName: editForm.studentName,
        });
      } else if (editForm.status === 'free') {
        await freeMutation.mutateAsync(scheduleId);
      } else if (editForm.status === 'unavailable') {
        await unavailableMutation.mutateAsync(scheduleId);
      }

      setIsEditDialogOpen(false);
      setSelectedSlot(null);
    } catch (error) {
      // Error handling is done by the mutations via toast
      console.error('Error saving schedule:', error);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-primary" />
              {user.role === 'admin' ? 'Agenda Geral' : 'Minha Agenda'}
            </div>
            <Button size="sm" variant="outline" className={isMobile ? "w-full mt-2" : ""}>
              Imprimir
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-2 sm:px-6">
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Carregando agenda...</span>
            </div>
          )}

          {error && (
            <div className="text-center py-12">
              <p className="text-destructive">Erro ao carregar agenda</p>
              <p className="text-sm text-muted-foreground mt-2">
                {error instanceof Error ? error.message : 'Erro desconhecido'}
              </p>
            </div>
          )}

          {!isLoading && !error && (
            <ScheduleGrid
              schedule={transformedSchedule}
              onSlotClick={handleSlotClick}
              readOnly={false}
            />
          )}
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className={isMobile ? "w-[90vw] max-w-[90vw] sm:max-w-[425px]" : ""}>
          <DialogHeader>
            <DialogTitle>Editar Horário</DialogTitle>
          </DialogHeader>
          
          {selectedSlot && (
            <div className="space-y-4">
              <div>
                <Label>Horário</Label>
                <p className="text-sm text-muted-foreground">
                  {selectedSlot.slot.time}
                </p>
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={editForm.status} onValueChange={(value: ScheduleSlot['status']) => setEditForm(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Livre</SelectItem>
                    <SelectItem value="occupied">Ocupado</SelectItem>
                    <SelectItem value="unavailable">Indisponível</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {editForm.status === 'occupied' && (
                <div>
                  <Label htmlFor="studentName">Nome do Aluno</Label>
                  <Input
                    id="studentName"
                    value={editForm.studentName}
                    onChange={(e) => setEditForm(prev => ({ ...prev, studentName: e.target.value }))}
                    placeholder="Digite o nome do aluno"
                  />
                </div>
              )}

              <Button
                onClick={handleSaveSlot}
                className={isMobile ? "w-full" : "w-full"}
                disabled={bookMutation.isPending || freeMutation.isPending || unavailableMutation.isPending}
              >
                {(bookMutation.isPending || freeMutation.isPending || unavailableMutation.isPending) ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Salvar Alterações
                  </>
                )}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};