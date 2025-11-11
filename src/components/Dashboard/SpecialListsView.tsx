import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Star, Shield, Plus, Trash2, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SpecialListEntry {
  id: string;
  teacherId: string;
  teacherName: string;
  reason: string;
  createdAt: Date;
}

interface SpecialListsViewProps {}

// Dados mockados
const mockRestrictedTeachers: SpecialListEntry[] = [
  {
    id: '1',
    teacherId: 'teacher-1',
    teacherName: 'Carlos Santos',
    reason: 'Professor em treinamento - aguardando certificação',
    createdAt: new Date('2024-01-15')
  }
];

const mockBestTeachers: SpecialListEntry[] = [
  {
    id: '1',
    teacherId: 'teacher-2',
    teacherName: 'Ana Silva',
    reason: 'Excelente feedback dos alunos - especialista em conversação',
    createdAt: new Date('2024-01-10')
  },
  {
    id: '2',
    teacherId: 'teacher-3',
    teacherName: 'Maria Oliveira',
    reason: 'Certificação TESOL - alta taxa de aprovação em exames',
    createdAt: new Date('2024-01-20')
  }
];

export const SpecialListsView = (props: SpecialListsViewProps) => {
  const { toast } = useToast();
  const [restrictedTeachers, setRestrictedTeachers] = useState<SpecialListEntry[]>(mockRestrictedTeachers);
  const [bestTeachers, setBestTeachers] = useState<SpecialListEntry[]>(mockBestTeachers);
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<'restricted' | 'best'>('restricted');
  const [formData, setFormData] = useState({
    teacherName: '',
    reason: ''
  });

  const handleAdd = (type: 'restricted' | 'best') => {
    setDialogType(type);
    setFormData({ teacherName: '', reason: '' });
    setIsAddDialogOpen(true);
  };

  const handleSave = () => {
    const newEntry: SpecialListEntry = {
      id: Math.random().toString(),
      teacherId: Math.random().toString(),
      teacherName: formData.teacherName,
      reason: formData.reason,
      createdAt: new Date()
    };

    if (dialogType === 'restricted') {
      setRestrictedTeachers(prev => [...prev, newEntry]);
    } else {
      setBestTeachers(prev => [...prev, newEntry]);
    }

    toast({
      title: "Professor adicionado",
      description: `Professor adicionado à lista ${dialogType === 'restricted' ? 'de restrição' : 'dos melhores'} com sucesso.`,
    });

    setIsAddDialogOpen(false);
    setFormData({ teacherName: '', reason: '' });
  };

  const handleRemove = (type: 'restricted' | 'best', id: string) => {
    if (type === 'restricted') {
      setRestrictedTeachers(prev => prev.filter(item => item.id !== id));
    } else {
      setBestTeachers(prev => prev.filter(item => item.id !== id));
    }

    toast({
      title: "Professor removido",
      description: "Professor removido da lista com sucesso.",
    });
  };

  const renderTeacherList = (teachers: SpecialListEntry[], type: 'restricted' | 'best') => (
    <div className="space-y-3">
      {teachers.map((teacher) => (
        <Card key={teacher.id} className="transition-smooth hover:shadow-custom-md">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center space-x-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {teacher.teacherName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <h4 className="font-semibold text-foreground">{teacher.teacherName}</h4>
                <p className="text-sm text-muted-foreground">{teacher.reason}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Adicionado em: {teacher.createdAt.toLocaleDateString()}
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleRemove(type, teacher.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      ))}

      {teachers.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p>Nenhum professor nesta lista</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Listas Especiais</h1>
        <p className="text-muted-foreground">
          Gerencie listas especiais de professores (visível apenas para administradores)
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lista de Restrição */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-destructive" />
                Não Enviar Alunos no Momento
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAdd('restricted')}
              >
                <Plus className="mr-2 h-4 w-4" />
                Adicionar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {renderTeacherList(restrictedTeachers, 'restricted')}
          </CardContent>
        </Card>

        {/* Lista dos Melhores */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-warning" />
                Melhores Professores
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAdd('best')}
              >
                <Plus className="mr-2 h-4 w-4" />
                Adicionar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {renderTeacherList(bestTeachers, 'best')}
          </CardContent>
        </Card>
      </div>

      {/* Dialog para Adicionar Professor */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Adicionar à Lista {dialogType === 'restricted' ? 'de Restrição' : 'dos Melhores'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="teacherName">Nome do Professor</Label>
              <Input
                id="teacherName"
                value={formData.teacherName}
                onChange={(e) => setFormData(prev => ({ ...prev, teacherName: e.target.value }))}
                placeholder="Digite o nome do professor"
              />
            </div>

            <div>
              <Label htmlFor="reason">Motivo/Observação</Label>
              <Textarea
                id="reason"
                value={formData.reason}
                onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="Digite o motivo ou observação..."
                rows={3}
              />
            </div>

            <div className="flex space-x-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setIsAddDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1"
                onClick={handleSave}
                disabled={!formData.teacherName || !formData.reason}
              >
                Adicionar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};