// ============================================
// COMPONENT: Lesson Types Management
// ============================================
// Gerenciamento de tipos de aula (Admin only)

import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  fetchLessonTypes,
  createLessonType,
  updateLessonType,
  deleteLessonType,
} from '@/lib/api/teacher-extended';
import type { LessonType } from '@/integrations/supabase/extended-types';
import { BookOpen, Plus, Pencil, Trash2, Loader2 } from 'lucide-react';

export const LessonTypesManagement = () => {
  const [lessonTypes, setLessonTypes] = useState<LessonType[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingType, setEditingType] = useState<LessonType | null>(null);
  const [deletingType, setDeletingType] = useState<LessonType | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadLessonTypes();
  }, []);

  const loadLessonTypes = async () => {
    try {
      setLoading(true);
      const data = await fetchLessonTypes();
      setLessonTypes(data);
    } catch (error) {
      console.error('Error loading lesson types:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os tipos de aula',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (type?: LessonType) => {
    if (type) {
      setEditingType(type);
      setFormData({
        name: type.name,
        description: type.description || '',
      });
    } else {
      setEditingType(null);
      setFormData({ name: '', description: '' });
    }
    setShowDialog(true);
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    setEditingType(null);
    setFormData({ name: '', description: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast({
        title: 'Erro',
        description: 'O nome do tipo de aula é obrigatório',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);

    try {
      if (editingType) {
        await updateLessonType(editingType.id, formData);
        toast({
          title: 'Sucesso',
          description: 'Tipo de aula atualizado com sucesso',
        });
      } else {
        await createLessonType(formData);
        toast({
          title: 'Sucesso',
          description: 'Tipo de aula criado com sucesso',
        });
      }

      handleCloseDialog();
      loadLessonTypes();
    } catch (error) {
      console.error('Error saving lesson type:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar o tipo de aula',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingType) return;

    try {
      await deleteLessonType(deletingType.id);
      toast({
        title: 'Sucesso',
        description: 'Tipo de aula excluído com sucesso',
      });
      setDeletingType(null);
      loadLessonTypes();
    } catch (error) {
      console.error('Error deleting lesson type:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir o tipo de aula',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Gerenciar Tipos de Aula
              </CardTitle>
              <CardDescription>
                Cadastre e gerencie os tipos de aula disponíveis no sistema
              </CardDescription>
            </div>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Tipo
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {lessonTypes.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum tipo de aula cadastrado</p>
              <Button
                onClick={() => handleOpenDialog()}
                variant="outline"
                className="mt-4"
              >
                <Plus className="mr-2 h-4 w-4" />
                Cadastrar Primeiro Tipo
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {lessonTypes.map((type) => (
                <div
                  key={type.id}
                  className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{type.name}</h3>
                    {type.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {type.description}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenDialog(type)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeletingType(type)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {editingType ? 'Editar Tipo de Aula' : 'Novo Tipo de Aula'}
              </DialogTitle>
              <DialogDescription>
                {editingType
                  ? 'Atualize as informações do tipo de aula'
                  : 'Cadastre um novo tipo de aula no sistema'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Ex: Conversação, Gramática..."
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Descreva o tipo de aula..."
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseDialog}
                disabled={submitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : editingType ? (
                  'Atualizar'
                ) : (
                  'Criar'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deletingType}
        onOpenChange={() => setDeletingType(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o tipo de aula{' '}
              <strong>{deletingType?.name}</strong>? Esta ação não pode ser
              desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
