// ============================================
// COMPONENT: Teacher Advanced Search
// ============================================
// Busca avançada com novos filtros

import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { searchTeachersAdvanced, fetchLessonTypes } from '@/lib/api/teacher-extended';
import type {
  TeacherSearchFilters,
  TeacherSearchResult,
  LessonType,
  TeacherLevel,
  TeacherPerformance,
} from '@/integrations/supabase/extended-types';
import {
  TEACHER_LEVEL_LABELS,
  TEACHER_PERFORMANCE_LABELS,
} from '@/integrations/supabase/extended-types';
import { Search, Loader2, Calendar } from 'lucide-react';
import { useAuth } from '@/components/Auth/AuthContext';

interface TeacherAdvancedSearchProps {
  onViewSchedule?: (teacherId: string, teacherName: string) => void;
}

const DAYS_OF_WEEK = [
  { value: 1, label: 'Segunda-feira' },
  { value: 2, label: 'Terça-feira' },
  { value: 3, label: 'Quarta-feira' },
  { value: 4, label: 'Quinta-feira' },
  { value: 5, label: 'Sexta-feira' },
  { value: 6, label: 'Sábado' },
  { value: 0, label: 'Domingo' },
];

const HOURS = Array.from({ length: 15 }, (_, i) => i + 8); // 8-22

export const TeacherAdvancedSearch = ({ onViewSchedule }: TeacherAdvancedSearchProps) => {
  const [filters, setFilters] = useState<TeacherSearchFilters>({});
  const [results, setResults] = useState<TeacherSearchResult[]>([]);
  const [lessonTypes, setLessonTypes] = useState<LessonType[]>([]);
  const [selectedLessonTypes, setSelectedLessonTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { role } = useAuth();

  const isAdmin = role === 'admin';

  useEffect(() => {
    loadLessonTypes();
  }, []);

  const loadLessonTypes = async () => {
    try {
      const data = await fetchLessonTypes();
      setLessonTypes(data);
    } catch (error) {
      console.error('Error loading lesson types:', error);
    }
  };

  const handleSearch = async () => {
    setLoading(true);
    try {
      const searchFilters: TeacherSearchFilters = {
        ...filters,
        lessonTypeIds: selectedLessonTypes.length > 0 ? selectedLessonTypes : undefined,
      };

      const data = await searchTeachersAdvanced(searchFilters);
      setResults(data);

      toast({
        title: 'Busca concluída',
        description: `${data.length} professor(es) encontrado(s)`,
      });
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: 'Erro na busca',
        description: 'Não foi possível realizar a busca',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLessonTypeToggle = (lessonTypeId: string) => {
    setSelectedLessonTypes((prev) =>
      prev.includes(lessonTypeId)
        ? prev.filter((id) => id !== lessonTypeId)
        : [...prev, lessonTypeId]
    );
  };

  const clearFilters = () => {
    setFilters({});
    setSelectedLessonTypes([]);
    setResults([]);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Busca Avançada de Professores
          </CardTitle>
          <CardDescription>
            Filtre por disponibilidade, nível, certificação, desempenho, tipo de aula e formação
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Availability Filters */}
          <div className="space-y-4">
            <h3 className="font-semibold">Disponibilidade</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dayOfWeek">Dia da Semana</Label>
                <Select
                  value={filters.dayOfWeek?.toString()}
                  onValueChange={(value) =>
                    setFilters({ ...filters, dayOfWeek: parseInt(value) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o dia" />
                  </SelectTrigger>
                  <SelectContent>
                    {DAYS_OF_WEEK.map((day) => (
                      <SelectItem key={day.value} value={day.value.toString()}>
                        {day.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="hour">Horário</Label>
                <Select
                  value={filters.hour?.toString()}
                  onValueChange={(value) =>
                    setFilters({ ...filters, hour: parseInt(value) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o horário" />
                  </SelectTrigger>
                  <SelectContent>
                    {HOURS.map((hour) => (
                      <SelectItem key={hour} value={hour.toString()}>
                        {hour}:00
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Teacher Attributes */}
          <div className="space-y-4">
            <h3 className="font-semibold">Características do Professor</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="level">Nível</Label>
                <Select
                  value={filters.level}
                  onValueChange={(value) =>
                    setFilters({ ...filters, level: value as TeacherLevel })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o nível" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TEACHER_LEVEL_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2 pt-8">
                <Checkbox
                  id="certification"
                  checked={filters.hasCertification || false}
                  onCheckedChange={(checked) =>
                    setFilters({ ...filters, hasCertification: checked as boolean })
                  }
                />
                <Label htmlFor="certification">Certificação Internacional</Label>
              </div>
            </div>
          </div>

          {/* Performance (Admin only) */}
          {isAdmin && (
            <div className="space-y-4">
              <h3 className="font-semibold">Desempenho em Sala</h3>
              <Select
                value={filters.performance}
                onValueChange={(value) =>
                  setFilters({ ...filters, performance: value as TeacherPerformance })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o desempenho" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TEACHER_PERFORMANCE_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Lesson Types */}
          <div className="space-y-4">
            <h3 className="font-semibold">Tipos de Aula</h3>
            <div className="flex flex-wrap gap-2">
              {lessonTypes.map((lessonType) => (
                <Badge
                  key={lessonType.id}
                  variant={
                    selectedLessonTypes.includes(lessonType.id)
                      ? 'default'
                      : 'outline'
                  }
                  className="cursor-pointer"
                  onClick={() => handleLessonTypeToggle(lessonType.id)}
                >
                  {lessonType.name}
                </Badge>
              ))}
            </div>
          </div>

          {/* Academic Background */}
          <div className="space-y-4">
            <h3 className="font-semibold">Formação Acadêmica</h3>
            <Input
              placeholder="Buscar por formação (ex: Letras, Pedagogia...)"
              value={filters.academicBackground || ''}
              onChange={(e) =>
                setFilters({ ...filters, academicBackground: e.target.value })
              }
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button onClick={handleSearch} disabled={loading} className="flex-1">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Buscando...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Buscar
                </>
              )}
            </Button>
            <Button onClick={clearFilters} variant="outline">
              Limpar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Resultados ({results.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {results.map((teacher) => (
                <div
                  key={teacher.id}
                  className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-lg">{teacher.name}</h3>
                      <p className="text-sm text-muted-foreground">{teacher.email}</p>
                      {teacher.phone && (
                        <p className="text-sm text-muted-foreground">{teacher.phone}</p>
                      )}
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="text-right">
                        <Badge>{TEACHER_LEVEL_LABELS[teacher.level]}</Badge>
                        {teacher.has_international_certification && (
                          <Badge variant="secondary" className="ml-2">
                            Certificado
                          </Badge>
                        )}
                      </div>
                      {isAdmin && onViewSchedule && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onViewSchedule(teacher.id, teacher.name)}
                        >
                          <Calendar className="h-4 w-4 mr-1" />
                          Ver Agenda
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    {teacher.academic_background && (
                      <p className="text-sm">
                        <span className="font-medium">Formação:</span>{' '}
                        {teacher.academic_background}
                      </p>
                    )}
                    {isAdmin && teacher.performance && (
                      <p className="text-sm">
                        <span className="font-medium">Desempenho:</span>{' '}
                        {TEACHER_PERFORMANCE_LABELS[teacher.performance]}
                      </p>
                    )}
                    <p className="text-sm">
                      <span className="font-medium">Horários livres:</span>{' '}
                      {teacher.free_hours_count}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
