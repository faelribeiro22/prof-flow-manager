import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScheduleGrid, ScheduleSlot } from "@/components/Schedule/ScheduleGrid";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Clock, Save, Loader2, Plus, ArrowLeft, User, Calendar, Trash2 } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTeacherSchedules, useBookSchedule, useFreeSchedule, useMarkScheduleUnavailable, useCreateSchedulesBulk, useDeleteSchedule } from "@/hooks/useSchedules";
import { useTeachers, useTeacher, useTeacherByUserId } from "@/hooks/useTeachers";
import { updateLastScheduleAccess } from "@/services/teacher.service";
import { Database } from "@/integrations/supabase/types";

type Schedule = Database['public']['Tables']['schedules']['Row'];

interface ScheduleViewProps {
  user: {
    id: string;
    name: string;
    role: 'admin' | 'teacher';
  };
  /** ID do professor para visualizar agenda (admin pode ver de outros) */
  selectedTeacherId?: string;
  /** Nome do professor selecionado */
  selectedTeacherName?: string;
  /** Callback para voltar à lista (quando admin está vendo agenda de outro professor) */
  onBack?: () => void;
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

// Mapeamento de dia da semana para número
const dayKeyToNumber: Record<string, number> = {
  'sunday': 0,
  'monday': 1,
  'tuesday': 2,
  'wednesday': 3,
  'thursday': 4,
  'friday': 5,
  'saturday': 6,
};

// Labels dos dias da semana
const dayLabels: Record<string, string> = {
  'sunday': 'Domingo',
  'monday': 'Segunda-feira',
  'tuesday': 'Terça-feira',
  'wednesday': 'Quarta-feira',
  'thursday': 'Quinta-feira',
  'friday': 'Sexta-feira',
  'saturday': 'Sábado',
};

// Ordem dos dias para exibição
const daysOrder = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

// Para compatibilidade com código existente
const availableHours = Array.from({ length: 15 }, (_, i) => i + 8);

export const ScheduleView = ({ user, selectedTeacherId, selectedTeacherName, onBack }: ScheduleViewProps) => {
  const [selectedSlot, setSelectedSlot] = useState<{ day: string; slot: ScheduleSlot; scheduleId: string } | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    status: 'free' as ScheduleSlot['status'],
    studentName: ''
  });
  const [createForm, setCreateForm] = useState({
    teacherId: '',
    daysOfWeek: [] as string[],
    timeSlots: [] as string[], // formato: "HH:MM-HH:MM" (início-fim)
    status: 'livre' as Schedule['status'],
    studentName: '',
  });
  // Estado para entrada de horário manual (início e fim)
  const [newTimeInput, setNewTimeInput] = useState({
    startHour: '08',
    startMinute: '00',
    endHour: '09',
    endMinute: '00'
  });
  const isMobile = useIsMobile();

  // Busca o teacher pelo user_id (para quando o professor acessa sua própria agenda)
  const { data: currentTeacher } = useTeacherByUserId(user.role === 'teacher' ? user.id : '');
  
  // Determina qual teacher ID usar para buscar agendas
  // - Se admin selecionou um professor específico, usa esse ID
  // - Se é professor, usa o teacher_id da tabela teachers (não o user.id)
  // - Se é admin sem seleção, busca todos (undefined)
  const effectiveTeacherId = selectedTeacherId || (user.role === 'teacher' ? currentTeacher?.id : undefined);
  
  // Busca informações do professor selecionado (se houver)
  const { data: teacherData } = useTeacher(selectedTeacherId || '');
  
  // Nome do professor para exibir no cabeçalho
  const displayTeacherName = selectedTeacherName || teacherData?.name || (user.role === 'teacher' ? (currentTeacher?.name || user.name) : null);

  // Registrar acesso do professor à agenda
  useEffect(() => {
    if (user.role === 'teacher') {
      // Registrar acesso usando o user.id
      const registerAccess = async () => {
        try {
          await updateLastScheduleAccess(user.id);
        } catch (error) {
          console.error('Error registering schedule access:', error);
        }
      };
      registerAccess();
    }
  }, [user.id, user.role]);

  // Fetch schedules for the effective teacher
  const { data: schedules, isLoading: schedulesLoading, error } = useTeacherSchedules(effectiveTeacherId);
  
  // Loading state inclui a busca do teacher atual para professores
  const isLoading = schedulesLoading || (user.role === 'teacher' && !currentTeacher && !error);

  // Fetch teachers list (for admin to select teacher)
  const { data: teachers } = useTeachers();

  // Mutations
  const bookMutation = useBookSchedule();
  const freeMutation = useFreeSchedule();
  const unavailableMutation = useMarkScheduleUnavailable();
  const createBulkMutation = useCreateSchedulesBulk();
  const deleteMutation = useDeleteSchedule();

  // Transform database schedules to ScheduleGrid format
  const transformedSchedule = useMemo(() => {
    if (!schedules) return {};

    const schedule: Record<string, (ScheduleSlot & { scheduleId: string })[]> = {
      sunday: [],
      monday: [],
      tuesday: [],
      wednesday: [],
      thursday: [],
      friday: [],
      saturday: [],
    };

    schedules.forEach((s) => {
      const dayKey = dayOfWeekToKey(s.day_of_week);
      if (!schedule[dayKey]) schedule[dayKey] = [];

      const startMinute = s.minute ?? 0;
      const endMinute = s.end_minute ?? 0;
      const startTime = `${s.hour.toString().padStart(2, '0')}:${startMinute.toString().padStart(2, '0')}`;
      const endTime = `${s.end_hour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
      
      schedule[dayKey].push({
        id: s.id,
        scheduleId: s.id,
        time: `${startTime} - ${endTime}`,
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

  const handleDeleteSlot = async () => {
    if (!selectedSlot) return;

    try {
      await deleteMutation.mutateAsync(selectedSlot.scheduleId);
      setIsEditDialogOpen(false);
      setSelectedSlot(null);
    } catch (error) {
      console.error('Error deleting schedule:', error);
    }
  };

  const handleOpenCreateDialog = () => {
    // Reset form with default values
    // Se admin está vendo a agenda de um professor específico, pré-seleciona esse professor
    // Se é professor, usa o teacher_id da tabela teachers
    const defaultTeacherId = selectedTeacherId || (user.role === 'teacher' ? currentTeacher?.id || '' : '');
    
    setCreateForm({
      teacherId: defaultTeacherId,
      daysOfWeek: [],
      timeSlots: [],
      status: 'livre',
      studentName: '',
    });
    setIsCreateDialogOpen(true);
  };

  const handleToggleDay = (day: string) => {
    setCreateForm(prev => ({
      ...prev,
      daysOfWeek: prev.daysOfWeek.includes(day)
        ? prev.daysOfWeek.filter(d => d !== day)
        : [...prev.daysOfWeek, day]
    }));
  };

  // Adiciona um horário à lista (formato: início-fim)
  const handleAddTimeSlot = () => {
    const startTime = `${newTimeInput.startHour.padStart(2, '0')}:${newTimeInput.startMinute.padStart(2, '0')}`;
    const endTime = `${newTimeInput.endHour.padStart(2, '0')}:${newTimeInput.endMinute.padStart(2, '0')}`;
    const timeLabel = `${startTime}-${endTime}`;
    
    // Verifica se já existe
    if (createForm.timeSlots.includes(timeLabel)) {
      return; // Já existe, não adiciona
    }
    
    // Valida que o fim é depois do início
    const startMinutes = parseInt(newTimeInput.startHour) * 60 + parseInt(newTimeInput.startMinute);
    const endMinutes = parseInt(newTimeInput.endHour) * 60 + parseInt(newTimeInput.endMinute);
    if (endMinutes <= startMinutes) {
      return; // Horário de fim deve ser depois do início
    }
    
    setCreateForm(prev => ({
      ...prev,
      timeSlots: [...prev.timeSlots, timeLabel].sort()
    }));
  };

  // Remove um horário da lista
  const handleRemoveTimeSlot = (timeLabel: string) => {
    setCreateForm(prev => ({
      ...prev,
      timeSlots: prev.timeSlots.filter(t => t !== timeLabel)
    }));
  };

  const handleToggleTimeSlot = (timeLabel: string) => {
    setCreateForm(prev => ({
      ...prev,
      timeSlots: prev.timeSlots.includes(timeLabel)
        ? prev.timeSlots.filter(t => t !== timeLabel)
        : [...prev.timeSlots, timeLabel]
    }));
  };

  const handleToggleHour = (hour: number) => {
    setCreateForm(prev => ({
      ...prev,
      hours: prev.hours.includes(hour)
        ? prev.hours.filter(h => h !== hour)
        : [...prev.hours, hour]
    }));
  };

  const handleSelectAllDays = () => {
    setCreateForm(prev => ({
      ...prev,
      daysOfWeek: prev.daysOfWeek.length === daysOrder.length ? [] : [...daysOrder]
    }));
  };

  const handleCreateSchedule = async () => {
    // Validation
    if (user.role === 'admin' && !createForm.teacherId && !selectedTeacherId) {
      return; // Should show error, but button will be disabled
    }

    if (createForm.daysOfWeek.length === 0 || createForm.timeSlots.length === 0) {
      return; // Button will be disabled
    }

    // Se é professor, usa o teacher_id da tabela teachers (não o user.id)
    // Se admin está visualizando agenda específica, usa o professor selecionado
    const teacherId = user.role === 'teacher' 
      ? currentTeacher?.id 
      : (selectedTeacherId || createForm.teacherId);

    if (!teacherId) {
      console.error('No teacher ID available');
      return;
    }

    // Create all combinations of days and time slots (formato: "HH:MM-HH:MM")
    const schedulesToCreate = createForm.daysOfWeek.flatMap(day => 
      createForm.timeSlots.map(timeSlot => {
        const [startTime, endTime] = timeSlot.split('-');
        const [startHourStr, startMinuteStr] = startTime.split(':');
        const [endHourStr, endMinuteStr] = endTime.split(':');
        return {
          teacher_id: teacherId,
          day_of_week: dayKeyToNumber[day],
          hour: parseInt(startHourStr, 10),
          minute: parseInt(startMinuteStr, 10),
          end_hour: parseInt(endHourStr, 10),
          end_minute: parseInt(endMinuteStr, 10),
          status: createForm.status,
          student_name: createForm.status === 'com_aluno' ? createForm.studentName : null,
        };
      })
    );

    try {
      await createBulkMutation.mutateAsync(schedulesToCreate);
      setIsCreateDialogOpen(false);
    } catch (error) {
      // Error handling is done by the mutation via toast
      console.error('Error creating schedules:', error);
    }
  };

  // Título da agenda baseado no contexto
  const getScheduleTitle = () => {
    if (user.role === 'teacher') {
      return 'Minha Agenda';
    }
    if (selectedTeacherId && displayTeacherName) {
      return `Agenda de ${displayTeacherName}`;
    }
    return 'Agenda Geral';
  };

  return (
    <div className="space-y-6">
      {/* Botão Voltar (quando admin está visualizando agenda de um professor) */}
      {user.role === 'admin' && selectedTeacherId && onBack && (
        <Button variant="ghost" onClick={onBack} className="mb-2">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
      )}

      <Card>
        <CardHeader>
          {/* Exibir nome do professor no topo */}
          {displayTeacherName && (
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="text-sm font-normal">
                <User className="h-3 w-3 mr-1" />
                Professor: {displayTeacherName}
              </Badge>
            </div>
          )}
          <CardTitle className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-primary" />
              {getScheduleTitle()}
            </div>
            <Button size="sm" onClick={handleOpenCreateDialog}>
              <Plus className="h-4 w-4 mr-1" />
              Adicionar Horário
            </Button>
          </CardTitle>
          {/* Descrição para admin quando visualiza agenda geral */}
          {user.role === 'admin' && !selectedTeacherId && (
            <CardDescription className="mt-2">
              Visualize as agendas de todos os professores. Use a busca avançada para encontrar um professor específico.
            </CardDescription>
          )}
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

          {/* Mensagem quando admin não selecionou professor e não há dados */}
          {!isLoading && !error && user.role === 'admin' && !selectedTeacherId && Object.keys(transformedSchedule).every(day => transformedSchedule[day].length === 0) && (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Selecione um Professor</h3>
              <p className="text-muted-foreground mb-4">
                Para visualizar ou adicionar horários, utilize a busca avançada para encontrar um professor.
              </p>
              <p className="text-sm text-muted-foreground">
                Você também pode adicionar horários diretamente usando o botão "Adicionar Horário" acima.
              </p>
            </div>
          )}

          {!isLoading && !error && (selectedTeacherId || user.role === 'teacher' || Object.keys(transformedSchedule).some(day => transformedSchedule[day].length > 0)) && (
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
                    <SelectItem value="occupied">Com aluno</SelectItem>
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
                className="w-full"
                disabled={bookMutation.isPending || freeMutation.isPending || unavailableMutation.isPending || deleteMutation.isPending}
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

              <Button
                onClick={handleDeleteSlot}
                variant="destructive"
                className="w-full"
                disabled={bookMutation.isPending || freeMutation.isPending || unavailableMutation.isPending || deleteMutation.isPending}
              >
                {deleteMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Removendo...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remover Horário
                  </>
                )}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog para criar novo horário */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className={isMobile ? "w-[95vw] max-w-[95vw] sm:max-w-[600px] max-h-[90vh] overflow-y-auto" : "sm:max-w-[600px] max-h-[90vh] overflow-y-auto"}>
          <DialogHeader>
            <DialogTitle>Adicionar Horários</DialogTitle>
            <DialogDescription>
              {selectedTeacherId && displayTeacherName 
                ? `Adicionar horários para ${displayTeacherName}`
                : 'Selecione os dias e horários para adicionar à agenda'
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Seletor de professor (apenas para admin quando não está visualizando um professor específico) */}
            {user.role === 'admin' && !selectedTeacherId && (
              <div>
                <Label htmlFor="teacher">Professor</Label>
                <Select 
                  value={createForm.teacherId} 
                  onValueChange={(value) => setCreateForm(prev => ({ ...prev, teacherId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um professor" />
                  </SelectTrigger>
                  <SelectContent>
                    {teachers?.map((teacher) => (
                      <SelectItem key={teacher.id} value={teacher.id}>
                        {teacher.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Dias da semana - seleção múltipla */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Dias da Semana</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleSelectAllDays}
                  className="text-xs"
                >
                  {createForm.daysOfWeek.length === daysOrder.length ? 'Desmarcar todos' : 'Selecionar todos'}
                </Button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {daysOrder.map((day) => (
                  <Button
                    key={day}
                    type="button"
                    variant={createForm.daysOfWeek.includes(day) ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleToggleDay(day)}
                    className="w-full"
                  >
                    {dayLabels[day].replace('-feira', '')}
                  </Button>
                ))}
              </div>
              {createForm.daysOfWeek.length > 0 && (
                <p className="text-xs text-muted-foreground mt-2">
                  {createForm.daysOfWeek.length} dia(s) selecionado(s)
                </p>
              )}
            </div>

            {/* Horários - entrada manual com início e fim */}
            <div>
              <Label className="mb-2 block">Horários</Label>
              
              {/* Campos de entrada: Início */}
              <div className="space-y-3 mb-3">
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <Label className="text-xs text-muted-foreground font-medium">Início</Label>
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        min="0"
                        max="23"
                        value={newTimeInput.startHour}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === '' || (parseInt(value) >= 0 && parseInt(value) <= 23)) {
                            setNewTimeInput(prev => ({ ...prev, startHour: value.slice(0, 2) }));
                          }
                        }}
                        onBlur={(e) => {
                          const value = parseInt(e.target.value) || 0;
                          setNewTimeInput(prev => ({ ...prev, startHour: value.toString().padStart(2, '0') }));
                        }}
                        className="w-16 text-center"
                        placeholder="08"
                      />
                      <span className="text-lg font-medium">:</span>
                      <Input
                        type="number"
                        min="0"
                        max="59"
                        value={newTimeInput.startMinute}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === '' || (parseInt(value) >= 0 && parseInt(value) <= 59)) {
                            setNewTimeInput(prev => ({ ...prev, startMinute: value.slice(0, 2) }));
                          }
                        }}
                        onBlur={(e) => {
                          const value = parseInt(e.target.value) || 0;
                          setNewTimeInput(prev => ({ ...prev, startMinute: value.toString().padStart(2, '0') }));
                        }}
                        className="w-16 text-center"
                        placeholder="00"
                      />
                    </div>
                  </div>
                  
                  <span className="text-muted-foreground mt-5">até</span>
                  
                  <div className="flex-1">
                    <Label className="text-xs text-muted-foreground font-medium">Fim</Label>
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        min="0"
                        max="23"
                        value={newTimeInput.endHour}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === '' || (parseInt(value) >= 0 && parseInt(value) <= 23)) {
                            setNewTimeInput(prev => ({ ...prev, endHour: value.slice(0, 2) }));
                          }
                        }}
                        onBlur={(e) => {
                          const value = parseInt(e.target.value) || 0;
                          setNewTimeInput(prev => ({ ...prev, endHour: value.toString().padStart(2, '0') }));
                        }}
                        className="w-16 text-center"
                        placeholder="09"
                      />
                      <span className="text-lg font-medium">:</span>
                      <Input
                        type="number"
                        min="0"
                        max="59"
                        value={newTimeInput.endMinute}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === '' || (parseInt(value) >= 0 && parseInt(value) <= 59)) {
                            setNewTimeInput(prev => ({ ...prev, endMinute: value.slice(0, 2) }));
                          }
                        }}
                        onBlur={(e) => {
                          const value = parseInt(e.target.value) || 0;
                          setNewTimeInput(prev => ({ ...prev, endMinute: value.toString().padStart(2, '0') }));
                        }}
                        className="w-16 text-center"
                        placeholder="00"
                      />
                    </div>
                  </div>
                  
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleAddTimeSlot}
                    className="mt-5"
                    disabled={(() => {
                      const startTime = `${newTimeInput.startHour.padStart(2, '0')}:${newTimeInput.startMinute.padStart(2, '0')}`;
                      const endTime = `${newTimeInput.endHour.padStart(2, '0')}:${newTimeInput.endMinute.padStart(2, '0')}`;
                      const timeLabel = `${startTime}-${endTime}`;
                      const startMinutes = parseInt(newTimeInput.startHour) * 60 + parseInt(newTimeInput.startMinute);
                      const endMinutes = parseInt(newTimeInput.endHour) * 60 + parseInt(newTimeInput.endMinute);
                      return createForm.timeSlots.includes(timeLabel) || endMinutes <= startMinutes;
                    })()}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Adicionar
                  </Button>
                </div>
              </div>

              {/* Lista de horários adicionados */}
              {createForm.timeSlots.length > 0 ? (
                <div className="border rounded-lg p-3 space-y-2 max-h-40 overflow-y-auto">
                  <p className="text-xs text-muted-foreground mb-2">
                    {createForm.timeSlots.length} horário(s) adicionado(s):
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {createForm.timeSlots.map((timeSlot) => (
                      <Badge 
                        key={timeSlot} 
                        variant="secondary"
                        className="flex items-center gap-1 pl-2 pr-1 py-1"
                      >
                        <Clock className="h-3 w-3" />
                        {timeSlot}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveTimeSlot(timeSlot)}
                          className="h-5 w-5 p-0 ml-1 hover:bg-destructive hover:text-destructive-foreground rounded-full"
                        >
                          <span className="text-xs">×</span>
                        </Button>
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="border rounded-lg p-4 text-center">
                  <p className="text-sm text-muted-foreground">
                    Nenhum horário adicionado. Use os campos acima para adicionar horários.
                  </p>
                </div>
              )}
            </div>

            {/* Resumo dos horários a serem criados */}
            {createForm.daysOfWeek.length > 0 && createForm.timeSlots.length > 0 && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-1">Resumo</p>
                <p className="text-xs text-muted-foreground">
                  Serão criados <strong>{createForm.daysOfWeek.length * createForm.timeSlots.length}</strong> horário(s) 
                  ({createForm.daysOfWeek.length} dia(s) × {createForm.timeSlots.length} horário(s))
                </p>
              </div>
            )}

            {/* Status inicial */}
            <div>
              <Label htmlFor="createStatus">Status Inicial</Label>
              <Select 
                value={createForm.status} 
                onValueChange={(value: Schedule['status']) => setCreateForm(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="livre">Livre</SelectItem>
                  <SelectItem value="com_aluno">Com Aluno</SelectItem>
                  <SelectItem value="indisponivel">Indisponível</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Nome do aluno (apenas se status for com_aluno) */}
            {createForm.status === 'com_aluno' && (
              <div>
                <Label htmlFor="createStudentName">Nome do Aluno</Label>
                <Input
                  id="createStudentName"
                  value={createForm.studentName}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, studentName: e.target.value }))}
                  placeholder="Digite o nome do aluno"
                />
              </div>
            )}

            <Button
              onClick={handleCreateSchedule}
              className="w-full"
              disabled={
                createBulkMutation.isPending || 
                (user.role === 'admin' && !selectedTeacherId && !createForm.teacherId) ||
                createForm.daysOfWeek.length === 0 ||
                createForm.timeSlots.length === 0 ||
                (createForm.status === 'com_aluno' && !createForm.studentName.trim())
              }
            >
              {createBulkMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Criar {createForm.daysOfWeek.length * createForm.timeSlots.length || 0} Horário(s)
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};