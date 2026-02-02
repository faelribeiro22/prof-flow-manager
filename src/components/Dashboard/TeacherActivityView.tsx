import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Activity, 
  Clock, 
  Search, 
  Calendar,
  RefreshCw,
  Eye
} from "lucide-react";
import { useTeachers } from "@/hooks/useTeachers";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow, format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface TeacherActivityViewProps {
  onViewSchedule?: (teacherId: string, teacherName: string) => void;
}

interface ScheduleActivity {
  teacher_id: string;
  last_schedule_update: string | null;
}

export const TeacherActivityView = ({ onViewSchedule }: TeacherActivityViewProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  
  const { data: teachers, isLoading: teachersLoading, refetch: refetchTeachers } = useTeachers();

  // Buscar última atualização de agenda para cada professor
  const { data: scheduleActivities, isLoading: activitiesLoading, refetch: refetchActivities } = useQuery({
    queryKey: ['schedule-activities'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('schedules')
        .select('teacher_id, updated_at')
        .order('updated_at', { ascending: false });

      if (error) throw error;

      // Agrupar por professor e pegar a última atualização
      const activityMap = new Map<string, string>();
      data?.forEach((schedule) => {
        if (!activityMap.has(schedule.teacher_id)) {
          activityMap.set(schedule.teacher_id, schedule.updated_at);
        }
      });

      return activityMap;
    },
    staleTime: 1 * 60 * 1000, // 1 minuto
  });

  const isLoading = teachersLoading || activitiesLoading;

  const handleRefresh = () => {
    refetchTeachers();
    refetchActivities();
  };

  // Filtrar e ordenar professores
  const filteredTeachers = useMemo(() => {
    if (!teachers) return [];

    const result = teachers.filter((teacher) => 
      teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Ordenar por último acesso (mais recente primeiro)
    result.sort((a, b) => {
      const accessA = a.last_schedule_access ? new Date(a.last_schedule_access).getTime() : 0;
      const accessB = b.last_schedule_access ? new Date(b.last_schedule_access).getTime() : 0;
      return accessB - accessA;
    });

    return result;
  }, [teachers, searchTerm]);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Nunca";
    const date = new Date(dateStr);
    return format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  };

  const formatRelative = (dateStr: string | null) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return formatDistanceToNow(date, { addSuffix: true, locale: ptBR });
  };

  const getActivityStatus = (lastAccess: string | null) => {
    if (!lastAccess) return { label: "Inativo", variant: "destructive" as const };
    
    const hoursSinceAccess = (Date.now() - new Date(lastAccess).getTime()) / (1000 * 60 * 60);
    
    if (hoursSinceAccess < 24) return { label: "Ativo", variant: "default" as const };
    if (hoursSinceAccess < 72) return { label: "Recente", variant: "secondary" as const };
    if (hoursSinceAccess < 168) return { label: "Ausente", variant: "outline" as const };
    return { label: "Inativo", variant: "destructive" as const };
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Atividade dos Professores</h1>
        <p className="text-muted-foreground">
          Monitore o último acesso e alterações nas agendas dos professores
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Monitoramento de Atividade
              </CardTitle>
              <CardDescription>
                {filteredTeachers.length} professor(es) encontrado(s)
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar professor por nome ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Tabela */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Professor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Último Acesso</TableHead>
                  <TableHead>Última Alteração na Agenda</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <RefreshCw className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                      <p className="mt-2 text-sm text-muted-foreground">Carregando...</p>
                    </TableCell>
                  </TableRow>
                ) : filteredTeachers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <p className="text-muted-foreground">Nenhum professor encontrado</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTeachers.map((teacher) => {
                    const activityStatus = getActivityStatus(teacher.last_schedule_access);
                    const lastScheduleUpdate = scheduleActivities?.get(teacher.id) || null;
                    
                    return (
                      <TableRow key={teacher.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{teacher.name}</p>
                            <p className="text-sm text-muted-foreground">{teacher.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={activityStatus.variant}>
                            {activityStatus.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm">{formatDate(teacher.last_schedule_access)}</p>
                              {teacher.last_schedule_access && (
                                <p className="text-xs text-muted-foreground">
                                  {formatRelative(teacher.last_schedule_access)}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm">{formatDate(lastScheduleUpdate)}</p>
                              {lastScheduleUpdate && (
                                <p className="text-xs text-muted-foreground">
                                  {formatRelative(lastScheduleUpdate)}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {onViewSchedule && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onViewSchedule(teacher.id, teacher.name)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Ver Agenda
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Legenda */}
          <div className="flex flex-wrap gap-4 pt-4 border-t">
            <div className="flex items-center gap-2 text-sm">
              <Badge variant="default">Ativo</Badge>
              <span className="text-muted-foreground">Acessou nas últimas 24h</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Badge variant="secondary">Recente</Badge>
              <span className="text-muted-foreground">Acessou nos últimos 3 dias</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Badge variant="outline">Ausente</Badge>
              <span className="text-muted-foreground">Acessou na última semana</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Badge variant="destructive">Inativo</Badge>
              <span className="text-muted-foreground">Mais de uma semana sem acesso</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
