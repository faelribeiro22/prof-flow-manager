// ============================================
// COMPONENT: Enhanced Teacher Form
// ============================================
// Formulário completo para cadastro/edição de professor
// Inclui: dados básicos + formação + tipos de aula + desempenho (admin)

import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/Auth/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import {
  fetchLessonTypes,
  fetchTeacherLessonTypes,
  updateTeacherLessonTypes,
  fetchTeacherAddress,
} from '@/lib/api/teacher-extended';
import { TeacherAddressForm } from './TeacherAddressForm';
import type {
  Teacher,
  LessonType,
  TeacherAddress,
} from '@/integrations/supabase/extended-types';
import {
  TEACHER_LEVEL_LABELS,
  TEACHER_PERFORMANCE_LABELS,
} from '@/integrations/supabase/extended-types';
import { Loader2, GraduationCap, MapPin, BookOpen, Award } from 'lucide-react';

interface EnhancedTeacherFormProps {
  teacher?: Teacher;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const EnhancedTeacherForm = ({
  teacher,
  onSuccess,
  onCancel,
}: EnhancedTeacherFormProps) => {
  const [formData, setFormData] = useState({
    name: teacher?.name || '',
    email: teacher?.email || '',
    phone: teacher?.phone || '',
    level: teacher?.level || 'iniciante',
    has_international_certification: teacher?.has_international_certification || false,
    academic_background: teacher?.academic_background || '',
    performance: teacher?.performance || undefined,
  });
  const [lessonTypes, setLessonTypes] = useState<LessonType[]>([]);
  const [selectedLessonTypes, setSelectedLessonTypes] = useState<string[]>([]);
  const [teacherAddress, setTeacherAddress] = useState<TeacherAddress | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const { toast } = useToast();
  const { role } = useAuth();

  const isAdmin = role === 'admin';
  const isEditMode = !!teacher;

  useEffect(() => {
    loadInitialData();
  }, [teacher]);

  const loadInitialData = async () => {
    try {
      setLoadingData(true);

      // Load lesson types
      const types = await fetchLessonTypes();
      setLessonTypes(types);

      // If editing, load teacher's lesson types and address
      if (teacher) {
        const teacherTypes = await fetchTeacherLessonTypes(teacher.id);
        setSelectedLessonTypes(teacherTypes.map((t) => t.id));

        // Load address (admin only)
        if (isAdmin) {
          const address = await fetchTeacherAddress(teacher.id);
          setTeacherAddress(address);
        }
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleLessonTypeToggle = (lessonTypeId: string) => {
    setSelectedLessonTypes((prev) =>
      prev.includes(lessonTypeId)
        ? prev.filter((id) => id !== lessonTypeId)
        : [...prev, lessonTypeId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.name || !formData.email || !formData.level) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos obrigatórios',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      let teacherId: string;

      if (isEditMode && teacher) {
        // Update existing teacher
        const updates: Partial<Teacher> = {
          name: formData.name,
          email: formData.email,
          phone: formData.phone || null,
          level: formData.level as any,
          has_international_certification: formData.has_international_certification,
          academic_background: formData.academic_background || null,
        };

        // Only admin can update performance
        if (isAdmin && formData.performance) {
          updates.performance = formData.performance as any;
        }

        const { error } = await supabase
          .from('teachers')
          .update(updates)
          .eq('id', teacher.id);

        if (error) throw error;
        teacherId = teacher.id;

        toast({
          title: 'Sucesso',
          description: 'Professor atualizado com sucesso',
        });
      } else {
        // Create new teacher
        // Note: This assumes user already has an account
        // In a real scenario, you'd need to create the auth user first
        toast({
          title: 'Aviso',
          description: 'Criação de novo professor requer integração com sistema de autenticação',
          variant: 'destructive',
        });
        return;
      }

      // Update lesson types
      await updateTeacherLessonTypes(teacherId, selectedLessonTypes);

      onSuccess?.();
    } catch (error) {
      console.error('Error saving teacher:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar o professor',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic">
            <Award className="h-4 w-4 mr-2" />
            Dados Básicos
          </TabsTrigger>
          <TabsTrigger value="academic">
            <GraduationCap className="h-4 w-4 mr-2" />
            Formação
          </TabsTrigger>
          <TabsTrigger value="lessons">
            <BookOpen className="h-4 w-4 mr-2" />
            Tipos de Aula
          </TabsTrigger>
          {isAdmin && isEditMode && (
            <TabsTrigger value="address">
              <MapPin className="h-4 w-4 mr-2" />
              Endereço
            </TabsTrigger>
          )}
        </TabsList>

        {/* Basic Information */}
        <TabsContent value="basic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
              <CardDescription>
                Dados principais do professor
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nome Completo *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    placeholder="(11) 98765-4321"
                  />
                </div>

                <div>
                  <Label htmlFor="level">Nível *</Label>
                  <Select
                    value={formData.level}
                    onValueChange={(value) =>
                      setFormData({ ...formData, level: value as any })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
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
              </div>

              <Separator />

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="certification"
                  checked={formData.has_international_certification}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      has_international_certification: checked as boolean,
                    })
                  }
                />
                <Label htmlFor="certification" className="cursor-pointer">
                  Possui certificação internacional
                </Label>
              </div>

              {/* Performance (Admin Only) */}
              {isAdmin && (
                <>
                  <Separator />
                  <div>
                    <Label htmlFor="performance">
                      Desempenho em Sala (Restrito - Admin)
                    </Label>
                    <Select
                      value={formData.performance || ''}
                      onValueChange={(value) =>
                        setFormData({
                          ...formData,
                          performance: value ? (value as any) : undefined,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o desempenho" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Não informado</SelectItem>
                        {Object.entries(TEACHER_PERFORMANCE_LABELS).map(
                          ([key, label]) => (
                            <SelectItem key={key} value={key}>
                              {label}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Academic Background */}
        <TabsContent value="academic">
          <Card>
            <CardHeader>
              <CardTitle>Formação Acadêmica</CardTitle>
              <CardDescription>
                Informações sobre a formação e qualificações do professor
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div>
                <Label htmlFor="academic_background">
                  Formação Acadêmica
                </Label>
                <Textarea
                  id="academic_background"
                  value={formData.academic_background}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      academic_background: e.target.value,
                    })
                  }
                  placeholder="Ex: Licenciatura em Letras - Inglês pela USP, Mestrado em Linguística Aplicada..."
                  rows={6}
                />
                <p className="text-sm text-muted-foreground mt-2">
                  Descreva a formação acadêmica, cursos, especializações e qualificações relevantes
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Lesson Types */}
        <TabsContent value="lessons">
          <Card>
            <CardHeader>
              <CardTitle>Tipos de Aula</CardTitle>
              <CardDescription>
                Selecione os tipos de aula que o professor pode lecionar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {lessonTypes.map((lessonType) => (
                  <Badge
                    key={lessonType.id}
                    variant={
                      selectedLessonTypes.includes(lessonType.id)
                        ? 'default'
                        : 'outline'
                    }
                    className="cursor-pointer py-2 px-4 text-sm"
                    onClick={() => handleLessonTypeToggle(lessonType.id)}
                  >
                    {lessonType.name}
                  </Badge>
                ))}
              </div>
              {lessonTypes.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Nenhum tipo de aula cadastrado no sistema
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Address (Admin Only - Edit Mode) */}
        {isAdmin && isEditMode && teacher && (
          <TabsContent value="address">
            <TeacherAddressForm
              teacherId={teacher.id}
              address={teacherAddress}
              onSuccess={() => {
                toast({
                  title: 'Sucesso',
                  description: 'Endereço atualizado',
                });
                loadInitialData();
              }}
            />
          </TabsContent>
        )}
      </Tabs>

      {/* Action Buttons */}
      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : isEditMode ? (
            'Atualizar Professor'
          ) : (
            'Cadastrar Professor'
          )}
        </Button>
      </div>
    </form>
  );
};
