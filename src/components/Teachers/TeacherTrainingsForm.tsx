import { useCallback, useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  createTeacherTraining,
  deleteTeacherTraining,
  fetchTeacherTrainings,
  updateTeacherTraining,
} from '@/lib/api/teacher-extended';
import type { TeacherTraining } from '@/integrations/supabase/extended-types';
import { BookOpenCheck, Loader2, Pencil, Plus, Trash2, X } from 'lucide-react';

interface TeacherTrainingsFormProps {
  teacherId: string;
  canManage?: boolean;
}

const emptyForm = {
  training_name: '',
  training_date: '',
  content: '',
};

const formatDate = (date: string) => {
  const [year, month, day] = date.split('-');
  if (!year || !month || !day) return date;
  return `${day}/${month}/${year}`;
};

export const TeacherTrainingsForm = ({
  teacherId,
  canManage = false,
}: TeacherTrainingsFormProps) => {
  const [trainings, setTrainings] = useState<TeacherTraining[]>([]);
  const [formData, setFormData] = useState(emptyForm);
  const [editingTraining, setEditingTraining] = useState<TeacherTraining | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { toast } = useToast();

  const loadTrainings = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchTeacherTrainings(teacherId);
      setTrainings(data);
    } catch (error) {
      console.error('Error loading teacher trainings:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os treinamentos',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [teacherId, toast]);

  useEffect(() => {
    loadTrainings();
  }, [loadTrainings]);

  const resetForm = () => {
    setFormData(emptyForm);
    setEditingTraining(null);
  };

  const handleEdit = (training: TeacherTraining) => {
    setEditingTraining(training);
    setFormData({
      training_name: training.training_name,
      training_date: training.training_date,
      content: training.content,
    });
  };

  const handleSave = async () => {
    if (!formData.training_name || !formData.training_date || !formData.content) {
      toast({
        title: 'Erro',
        description: 'Preencha treinamento, data e conteúdo',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSaving(true);

      if (editingTraining) {
        await updateTeacherTraining(editingTraining.id, formData);
        toast({
          title: 'Sucesso',
          description: 'Treinamento atualizado com sucesso',
        });
      } else {
        await createTeacherTraining({
          teacher_id: teacherId,
          ...formData,
        });
        toast({
          title: 'Sucesso',
          description: 'Treinamento cadastrado com sucesso',
        });
      }

      resetForm();
      await loadTrainings();
    } catch (error) {
      console.error('Error saving teacher training:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar o treinamento',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (trainingId: string) => {
    try {
      setDeletingId(trainingId);
      await deleteTeacherTraining(trainingId);
      toast({
        title: 'Sucesso',
        description: 'Treinamento removido com sucesso',
      });
      await loadTrainings();
    } catch (error) {
      console.error('Error deleting teacher training:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível remover o treinamento',
        variant: 'destructive',
      });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {canManage && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpenCheck className="h-5 w-5" />
              {editingTraining ? 'Editar Treinamento' : 'Cadastrar Treinamento'}
            </CardTitle>
            <CardDescription>
              Registre qual treinamento o professor assistiu, a data e o conteúdo.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_180px]">
                <div>
                  <Label htmlFor="training_name">Treinamento *</Label>
                  <Input
                    id="training_name"
                    value={formData.training_name}
                    onChange={(event) =>
                      setFormData({
                        ...formData,
                        training_name: event.target.value,
                      })
                    }
                    placeholder="Ex: Classroom Management"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="training_date">Data *</Label>
                  <Input
                    id="training_date"
                    type="date"
                    value={formData.training_date}
                    onChange={(event) =>
                      setFormData({
                        ...formData,
                        training_date: event.target.value,
                      })
                    }
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="training_content">Conteúdo *</Label>
                <Textarea
                  id="training_content"
                  value={formData.content}
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      content: event.target.value,
                    })
                  }
                  placeholder="Descreva os temas, módulos ou competências trabalhadas no treinamento."
                  rows={4}
                  required
                />
              </div>

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                {editingTraining && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetForm}
                    disabled={saving}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Cancelar edição
                  </Button>
                )}
                <Button type="button" onClick={handleSave} disabled={saving}>
                  {saving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="mr-2 h-4 w-4" />
                  )}
                  {editingTraining ? 'Atualizar' : 'Adicionar'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Treinamentos Cadastrados</CardTitle>
          <CardDescription>
            Histórico de treinamentos registrados para este professor.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : trainings.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum treinamento cadastrado para este professor.
            </p>
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Treinamento</TableHead>
                      <TableHead className="w-32">Data</TableHead>
                      <TableHead>Conteúdo</TableHead>
                      {canManage && <TableHead className="w-28 text-right">Ações</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {trainings.map((training) => (
                      <TableRow key={training.id}>
                        <TableCell className="font-medium">
                          {training.training_name}
                        </TableCell>
                        <TableCell>{formatDate(training.training_date)}</TableCell>
                        <TableCell className="max-w-md whitespace-pre-wrap">
                          {training.content}
                        </TableCell>
                        {canManage && (
                          <TableCell>
                            <div className="flex justify-end gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(training)}
                                title="Editar treinamento"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDelete(training.id)}
                                disabled={deletingId === training.id}
                                title="Excluir treinamento"
                              >
                                {deletingId === training.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="space-y-3 md:hidden">
                {trainings.map((training) => (
                  <div
                    key={training.id}
                    className="rounded-lg border p-3"
                  >
                    <div className="space-y-1">
                      <p className="font-medium">{training.training_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(training.training_date)}
                      </p>
                      <p className="whitespace-pre-wrap text-sm">
                        {training.content}
                      </p>
                    </div>

                    {canManage && (
                      <div className="mt-3 flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleEdit(training)}
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleDelete(training.id)}
                          disabled={deletingId === training.id}
                        >
                          {deletingId === training.id ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="mr-2 h-4 w-4" />
                          )}
                          Excluir
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
