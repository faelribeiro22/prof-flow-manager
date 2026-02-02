import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Users, Search, UserPlus, Eye, Calendar } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import { EnhancedTeacherForm } from "@/components/Teachers/EnhancedTeacherForm";
import type { Teacher } from "@/integrations/supabase/extended-types";
import { TEACHER_LEVEL_LABELS } from "@/integrations/supabase/extended-types";
import { Loader2 } from "lucide-react";

interface TeachersViewProps {
  onViewSchedule?: (teacherId: string, teacherName: string) => void;
}

export const TeachersView = ({ onViewSchedule }: TeachersViewProps) => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const isMobile = useIsMobile();

  const loadTeachers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('teachers')
        .select('*')
        .order('name');

      if (error) throw error;
      setTeachers(data || []);
    } catch (error) {
      console.error('Error loading teachers:', error);
      setTeachers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeachers();
  }, []);

  const filteredTeachers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return teachers;

    return teachers.filter((teacher) =>
      teacher.name.toLowerCase().includes(term) ||
      teacher.email.toLowerCase().includes(term)
    );
  }, [teachers, searchTerm]);

  const getLevelColor = (level: Teacher['level']) => {
    switch (level) {
      case 'iniciante':
        return 'bg-status-free text-status-free-foreground';
      case 'intermediario':
        return 'bg-status-occupied text-status-occupied-foreground';
      case 'avancado':
      case 'nativo':
      default:
        return 'bg-primary text-primary-foreground';
    }
  };

  const handleNewTeacher = () => {
    setSelectedTeacher(null);
    setIsDialogOpen(true);
  };

  const handleEditTeacher = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setIsDialogOpen(true);
  };

  const handleDialogClose = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setSelectedTeacher(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className={`flex ${isMobile ? 'flex-col' : 'items-center justify-between'} gap-4`}>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Professores</h1>
          <p className="text-muted-foreground">Gerencie o cadastro dos professores</p>
        </div>
        <Button className="bg-gradient-primary w-full md:w-auto" onClick={handleNewTeacher}>
          <UserPlus className="mr-2 h-4 w-4" />
          Novo Professor
        </Button>
      </div>

      <Card>
        <CardHeader className="space-y-4">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Lista de Professores
          </CardTitle>
          <div className="flex flex-col md:flex-row items-center gap-2">
            <div className="relative w-full">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar professor por nome ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredTeachers.map((teacher) => (
              <Card key={teacher.id} className="transition-smooth hover:shadow-custom-md">
                <CardContent className={`flex ${isMobile ? 'flex-col' : 'items-center justify-between'} p-4 ${isMobile ? 'gap-3' : 'gap-4'}`}>
                  <div className={`flex items-center ${isMobile ? 'space-x-3' : 'space-x-4'} w-full`}>
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {teacher.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="overflow-hidden">
                      <h3 className="font-semibold text-foreground truncate">{teacher.name}</h3>
                      <p className="text-sm text-muted-foreground truncate">{teacher.email}</p>
                      {teacher.phone && (
                        <p className="text-sm text-muted-foreground truncate">{teacher.phone}</p>
                      )}
                    </div>
                  </div>
                  <div className={`flex ${isMobile ? 'w-full justify-between flex-wrap' : 'items-center'} gap-2`}>
                    <Badge className={getLevelColor(teacher.level)}>
                      {TEACHER_LEVEL_LABELS[teacher.level]}
                    </Badge>
                    
                    {teacher.has_international_certification && (
                      <Badge variant="secondary">
                        Certificado
                      </Badge>
                    )}

                    <div className="flex gap-1">
                      {onViewSchedule && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-shrink-0"
                          onClick={() => onViewSchedule(teacher.id, teacher.name)}
                          title="Ver Agenda"
                        >
                          <Calendar className="h-4 w-4" />
                          {isMobile && <span className="ml-2">Agenda</span>}
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-shrink-0"
                        onClick={() => handleEditTeacher(teacher)}
                        title="Ver Detalhes"
                      >
                        <Eye className="h-4 w-4" />
                        {isMobile && <span className="ml-2">Detalhes</span>}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedTeacher ? 'Editar Professor' : 'Novo Professor'}
            </DialogTitle>
          </DialogHeader>
          <EnhancedTeacherForm
            teacher={selectedTeacher || undefined}
            onCancel={() => handleDialogClose(false)}
            onSuccess={() => {
              handleDialogClose(false);
              loadTeachers();
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};