import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScheduleGrid, ScheduleSlot } from "@/components/Schedule/ScheduleGrid";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Clock, Save, Loader2, Plus, ArrowLeft, User, Calendar } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTeacherSchedules, useBookSchedule, useFreeSchedule, useMarkScheduleUnavailable, useCreateSchedule } from "@/hooks/useSchedules";
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
  'monday': 'Segunda-feira',
  'tuesday': 'Terça-feira',
  'wednesday': 'Quarta-feira',
  'thursday': 'Quinta-feira',
  'friday': 'Sexta-feira',
};

// Horários disponíveis (8h às 22h)
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
    dayOfWeek: 'monday',
    hour: 8,
    status: 'livre' as Schedule['status'],
    studentName: '',
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
  const createMutation = useCreateSchedule();

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

  const handleOpenCreateDialog = () => {
    // Reset form with default values
    // Se admin está vendo a agenda de um professor específico, pré-seleciona esse professor
    // Se é professor, usa o teacher_id da tabela teachers
    const defaultTeacherId = selectedTeacherId || (user.role === 'teacher' ? currentTeacher?.id || '' : '');
    
    setCreateForm({
      teacherId: defaultTeacherId,
      dayOfWeek: 'monday',
      hour: 8,
      status: 'livre',
      studentName: '',
    });
    setIsCreateDialogOpen(true);
  };

  const handleCreateSchedule = async () => {
    // Validation
    if (user.role === 'admin' && !createForm.teacherId && !selectedTeacherId) {
      return; // Should show error, but button will be disabled
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

    try {
      await createMutation.mutateAsync({
        teacher_id: teacherId,
        day_of_week: dayKeyToNumber[createForm.dayOfWeek],
        hour: createForm.hour,
        status: createForm.status,
        student_name: createForm.status === 'com_aluno' ? createForm.studentName : null,
      });

      setIsCreateDialogOpen(false);
    } catch (error) {
      // Error handling is done by the mutation via toast
      console.error('Error creating schedule:', error);
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
            <div className={`flex gap-2 ${isMobile ? "w-full mt-2" : ""}`}>
              <Button size="sm" onClick={handleOpenCreateDialog} className={isMobile ? "flex-1" : ""}>
                <Plus className="h-4 w-4 mr-1" />
                Adicionar Horário
              </Button>
              <Button size="sm" variant="outline" className={isMobile ? "flex-1" : ""}>
                Imprimir
              </Button>
            </div>
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

      {/* Dialog para criar novo horário */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className={isMobile ? "w-[90vw] max-w-[90vw] sm:max-w-[425px]" : ""}>
          <DialogHeader>
            <DialogTitle>Adicionar Horário</DialogTitle>
            <DialogDescription>
              {selectedTeacherId && displayTeacherName 
                ? `Adicionar horário para ${displayTeacherName}`
                : 'Crie um novo horário na agenda'
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
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

            {/* Dia da semana */}
            <div>
              <Label htmlFor="dayOfWeek">Dia da Semana</Label>
              <Select 
                value={createForm.dayOfWeek} 
                onValueChange={(value) => setCreateForm(prev => ({ ...prev, dayOfWeek: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(dayLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Horário */}
            <div>
              <Label htmlFor="hour">Horário</Label>
              <Select 
                value={createForm.hour.toString()} 
                onValueChange={(value) => setCreateForm(prev => ({ ...prev, hour: parseInt(value) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableHours.map((hour) => (
                    <SelectItem key={hour} value={hour.toString()}>
                      {hour.toString().padStart(2, '0')}:00
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

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
                createMutation.isPending || 
                (user.role === 'admin' && !selectedTeacherId && !createForm.teacherId) ||
                (createForm.status === 'com_aluno' && !createForm.studentName.trim())
              }
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Criar Horário
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};