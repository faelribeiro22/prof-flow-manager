import { useEffect, useMemo, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import { Users, Search, Loader2, Mail, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { deleteUser } from '@/integrations/supabase/auth';

interface ListedUser {
  user_id: string;
  name: string;
  email: string;
  role: 'admin' | 'teacher';
  created_at: string;
}

export const UsersListView = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<ListedUser[]>([]);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [userToDelete, setUserToDelete] = useState<ListedUser | null>(null);

  const handleDeleteUser = useCallback(async () => {
    if (!userToDelete) return;

    setDeletingUserId(userToDelete.user_id);
    try {
      await deleteUser({ userId: userToDelete.user_id });

      toast({
        title: 'Sucesso',
        description: `${userToDelete.name} foi deletado com sucesso.`,
      });

      // Remover usuário da lista
      setUsers((prev) => prev.filter((u) => u.user_id !== userToDelete.user_id));
      setShowDeleteConfirm(false);
      setUserToDelete(null);
    } catch (error) {
      console.error('Erro ao deletar usuário:', error);
      toast({
        title: 'Erro ao deletar usuário',
        description:
          error instanceof Error
            ? error.message
            : 'Não foi possível deletar o usuário.',
        variant: 'destructive',
      });
    } finally {
      setDeletingUserId(null);
    }
  }, [userToDelete, toast]);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase.rpc('list_all_users');

        if (error) {
          throw error;
        }

        setUsers((data as ListedUser[]) || []);
      } catch (error) {
        console.error('Erro ao carregar usuarios:', error);
        toast({
          title: 'Erro ao carregar usuarios',
          description:
            error instanceof Error
              ? error.message
              : 'Nao foi possivel listar os usuarios.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, [toast]);

  const filteredUsers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return users;

    return users.filter((user) => {
      return (
        user.name.toLowerCase().includes(term)
        || user.email.toLowerCase().includes(term)
        || user.role.toLowerCase().includes(term)
      );
    });
  }, [searchTerm, users]);

  const adminCount = users.filter((user) => user.role === 'admin').length;
  const teacherCount = users.filter((user) => user.role === 'teacher').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Usuarios do Sistema</h1>
        <p className="text-muted-foreground">Lista completa de administradores e professores</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total</CardDescription>
            <CardTitle>{users.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Administradores</CardDescription>
            <CardTitle>{adminCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Professores</CardDescription>
            <CardTitle>{teacherCount}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader className="space-y-4">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Todos os usuarios
          </CardTitle>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nome, e-mail ou perfil..."
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {filteredUsers.map((user) => (
                <Card key={user.user_id} className="border border-border/70">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-foreground">{user.name || 'Sem nome'}</p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Mail className="h-3.5 w-3.5" />
                          {user.email || 'Sem e-mail'}
                        </p>
                      </div>
                      <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                        {user.role === 'admin' ? 'Administrador' : 'Professor'}
                      </Badge>
                    </div>
                    <div className="flex items-start justify-between pt-2">
                      <p className="text-xs text-muted-foreground">
                        Criado em {new Date(user.created_at).toLocaleDateString('pt-BR')}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setUserToDelete(user);
                          setShowDeleteConfirm(true);
                        }}
                        disabled={deletingUserId === user.user_id}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        {deletingUserId === user.user_id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {!filteredUsers.length && (
                <div className="col-span-full py-10 text-center text-muted-foreground">
                  Nenhum usuario encontrado para o filtro informado.
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deletar usuario?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar <strong>{userToDelete?.name}</strong>? Esta acao e
              irreversivel e todos os dados associados (agendas, listas, etc) sera deletados tambem.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingUserId === userToDelete?.user_id}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              disabled={deletingUserId === userToDelete?.user_id}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deletingUserId === userToDelete?.user_id ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deletando...
                </>
              ) : (
                'Deletar'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
