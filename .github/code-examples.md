# Code Examples - AgendaPro

Este arquivo contém exemplos de código comuns para referência do GitHub Copilot.

## Table of Contents
- [Authentication](#authentication)
- [CRUD Operations](#crud-operations)
- [Schedule Management](#schedule-management)
- [Search Functionality](#search-functionality)
- [Forms](#forms)
- [UI Components](#ui-components)

---

## Authentication

### Login Component
```typescript
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signIn } from '@/integrations/supabase/auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await signIn({ email, password });
      
      if (error) throw error;

      toast({
        title: 'Login realizado',
        description: 'Bem-vindo de volta!',
      });
      
      navigate('/dashboard');
    } catch (error) {
      toast({
        title: 'Erro ao fazer login',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      
      <div>
        <Label htmlFor="password">Senha</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Entrando...' : 'Entrar'}
      </Button>
    </form>
  );
};
```

### Protected Route
```typescript
import { useAuth } from '@/components/Auth/AuthContext';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'teacher';
}

export const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (requiredRole && role !== requiredRole) {
    return <Navigate to="/unauthorized" />;
  }

  return <>{children}</>;
};
```

---

## CRUD Operations

### Fetch Teachers (Read)
```typescript
import { supabase } from '@/integrations/supabase/client';
import type { Teacher } from '@/integrations/supabase/types';

export const fetchTeachers = async (): Promise<Teacher[]> => {
  const { data, error } = await supabase
    .from('teachers')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error fetching teachers:', error);
    throw error;
  }

  return data || [];
};

// With filters
export const fetchTeachersByLevel = async (
  level: string
): Promise<Teacher[]> => {
  const { data, error } = await supabase
    .from('teachers')
    .select('*')
    .eq('level', level)
    .order('name');

  if (error) throw error;
  return data || [];
};
```

### Create Teacher
```typescript
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type TeacherInsert = Database['public']['Tables']['teachers']['Insert'];

export const createTeacher = async (
  teacherData: TeacherInsert
): Promise<Teacher> => {
  const { data, error } = await supabase
    .from('teachers')
    .insert(teacherData)
    .select()
    .single();

  if (error) throw error;
  return data;
};
```

### Update Teacher
```typescript
export const updateTeacher = async (
  id: string,
  updates: Partial<Teacher>
): Promise<Teacher> => {
  const { data, error } = await supabase
    .from('teachers')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};
```

### Delete Teacher
```typescript
export const deleteTeacher = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('teachers')
    .delete()
    .eq('id', id);

  if (error) throw error;
};
```

### Teacher List Component with CRUD
```typescript
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { fetchTeachers, deleteTeacher } from '@/lib/api/teachers';
import type { Teacher } from '@/integrations/supabase/types';

export const TeacherList = () => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadTeachers();
  }, []);

  const loadTeachers = async () => {
    try {
      setLoading(true);
      const data = await fetchTeachers();
      setTeachers(data);
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os professores',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este professor?')) return;

    try {
      await deleteTeacher(id);
      setTeachers((prev) => prev.filter((t) => t.id !== id));
      toast({
        title: 'Sucesso',
        description: 'Professor excluído com sucesso',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir o professor',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="grid gap-4">
      {teachers.map((teacher) => (
        <TeacherCard
          key={teacher.id}
          teacher={teacher}
          onDelete={handleDelete}
        />
      ))}
    </div>
  );
};
```

---

## Schedule Management

### Fetch Schedule for Teacher
```typescript
import { supabase } from '@/integrations/supabase/client';
import type { Schedule } from '@/integrations/supabase/types';

export const fetchTeacherSchedule = async (
  teacherId: string
): Promise<Schedule[]> => {
  const { data, error } = await supabase
    .from('schedules')
    .select('*')
    .eq('teacher_id', teacherId)
    .order('day_of_week')
    .order('hour');

  if (error) throw error;
  return data || [];
};
```

### Update Schedule Slot
```typescript
export const updateScheduleSlot = async (
  scheduleId: string,
  status: 'livre' | 'ocupado',
  studentName?: string
): Promise<Schedule> => {
  const updates: Partial<Schedule> = { status };
  
  if (status === 'ocupado' && studentName) {
    updates.student_name = studentName;
  } else {
    updates.student_name = null;
  }

  const { data, error } = await supabase
    .from('schedules')
    .update(updates)
    .eq('id', scheduleId)
    .select()
    .single();

  if (error) throw error;
  return data;
};
```

### Bulk Create Schedule
```typescript
export const createDefaultSchedule = async (
  teacherId: string
): Promise<void> => {
  const schedules: Database['public']['Tables']['schedules']['Insert'][] = [];

  // Monday to Friday (1-5)
  for (let day = 1; day <= 5; day++) {
    // 8 AM to 10 PM (8-22)
    for (let hour = 8; hour <= 22; hour++) {
      schedules.push({
        teacher_id: teacherId,
        day_of_week: day,
        hour,
        status: 'livre',
      });
    }
  }

  const { error } = await supabase
    .from('schedules')
    .insert(schedules);

  if (error) throw error;
};
```

### Schedule Grid Component
```typescript
import { useState, useEffect } from 'react';
import { fetchTeacherSchedule } from '@/lib/api/schedules';
import type { Schedule } from '@/integrations/supabase/types';

const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const HOURS = Array.from({ length: 15 }, (_, i) => i + 8); // 8-22

interface ScheduleGridProps {
  teacherId: string;
}

export const ScheduleGrid = ({ teacherId }: ScheduleGridProps) => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSchedule();
  }, [teacherId]);

  const loadSchedule = async () => {
    try {
      const data = await fetchTeacherSchedule(teacherId);
      setSchedules(data);
    } catch (error) {
      console.error('Error loading schedule:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSchedule = (day: number, hour: number) => {
    return schedules.find(
      (s) => s.day_of_week === day && s.hour === hour
    );
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="border p-2">Hora</th>
            {DAYS.map((day, index) => (
              <th key={index} className="border p-2">
                {day}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {HOURS.map((hour) => (
            <tr key={hour}>
              <td className="border p-2 text-center font-medium">
                {hour}:00
              </td>
              {DAYS.map((_, dayIndex) => {
                const schedule = getSchedule(dayIndex, hour);
                return (
                  <td
                    key={dayIndex}
                    className={`border p-2 cursor-pointer hover:bg-muted ${
                      schedule?.status === 'ocupado'
                        ? 'bg-destructive/20'
                        : 'bg-success/20'
                    }`}
                  >
                    {schedule?.student_name || '-'}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
```

---

## Search Functionality

### Search Teachers by Availability
```typescript
import { supabase } from '@/integrations/supabase/client';
import type { Teacher } from '@/integrations/supabase/types';

interface SearchFilters {
  dayOfWeek?: number;
  hour?: number;
  level?: string;
  hasCertification?: boolean;
}

export const searchAvailableTeachers = async (
  filters: SearchFilters
): Promise<Teacher[]> => {
  let query = supabase
    .from('teachers')
    .select(`
      *,
      schedules!inner(*)
    `);

  // Filter by available schedule
  if (filters.dayOfWeek !== undefined && filters.hour !== undefined) {
    query = query
      .eq('schedules.day_of_week', filters.dayOfWeek)
      .eq('schedules.hour', filters.hour)
      .eq('schedules.status', 'livre');
  }

  // Filter by level
  if (filters.level) {
    query = query.eq('level', filters.level);
  }

  // Filter by certification
  if (filters.hasCertification !== undefined) {
    query = query.eq('has_international_certification', filters.hasCertification);
  }

  const { data, error } = await query.order('name');

  if (error) throw error;
  return data || [];
};
```

### Search Component
```typescript
import { useState } from 'react';
import { searchAvailableTeachers } from '@/lib/api/search';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export const TeacherSearch = () => {
  const [filters, setFilters] = useState({
    dayOfWeek: undefined as number | undefined,
    hour: undefined as number | undefined,
    level: undefined as string | undefined,
  });
  const [results, setResults] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const data = await searchAvailableTeachers(filters);
      setResults(data);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Select
          value={filters.dayOfWeek?.toString()}
          onValueChange={(value) =>
            setFilters({ ...filters, dayOfWeek: parseInt(value) })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Dia da semana" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Segunda</SelectItem>
            <SelectItem value="2">Terça</SelectItem>
            <SelectItem value="3">Quarta</SelectItem>
            <SelectItem value="4">Quinta</SelectItem>
            <SelectItem value="5">Sexta</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.hour?.toString()}
          onValueChange={(value) =>
            setFilters({ ...filters, hour: parseInt(value) })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Horário" />
          </SelectTrigger>
          <SelectContent>
            {Array.from({ length: 15 }, (_, i) => i + 8).map((hour) => (
              <SelectItem key={hour} value={hour.toString()}>
                {hour}:00
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.level}
          onValueChange={(value) =>
            setFilters({ ...filters, level: value })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Nível" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="iniciante">Iniciante</SelectItem>
            <SelectItem value="intermediario">Intermediário</SelectItem>
            <SelectItem value="avancado">Avançado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button onClick={handleSearch} disabled={loading} className="w-full">
        {loading ? 'Buscando...' : 'Buscar'}
      </Button>

      {results.length > 0 && (
        <div className="grid gap-4">
          {results.map((teacher) => (
            <TeacherCard key={teacher.id} teacher={teacher} />
          ))}
        </div>
      )}
    </div>
  );
};
```

---

## Forms

### Teacher Form with Validation
```typescript
import { useState } from 'react';
import { createTeacher, updateTeacher } from '@/lib/api/teachers';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Teacher } from '@/integrations/supabase/types';

interface TeacherFormProps {
  teacher?: Teacher;
  onSuccess?: () => void;
}

export const TeacherForm = ({ teacher, onSuccess }: TeacherFormProps) => {
  const [formData, setFormData] = useState({
    name: teacher?.name || '',
    email: teacher?.email || '',
    phone: teacher?.phone || '',
    level: teacher?.level || 'iniciante',
    has_international_certification: teacher?.has_international_certification || false,
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.name || !formData.email) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos obrigatórios',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      if (teacher) {
        await updateTeacher(teacher.id, formData);
        toast({
          title: 'Sucesso',
          description: 'Professor atualizado com sucesso',
        });
      } else {
        await createTeacher(formData);
        toast({
          title: 'Sucesso',
          description: 'Professor cadastrado com sucesso',
        });
      }

      onSuccess?.();
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar o professor',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Nome *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>

      <div>
        <Label htmlFor="email">Email *</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
        />
      </div>

      <div>
        <Label htmlFor="phone">Telefone</Label>
        <Input
          id="phone"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
        />
      </div>

      <div>
        <Label htmlFor="level">Nível *</Label>
        <Select
          value={formData.level}
          onValueChange={(value) => setFormData({ ...formData, level: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="iniciante">Iniciante</SelectItem>
            <SelectItem value="intermediario">Intermediário</SelectItem>
            <SelectItem value="avancado">Avançado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="certification"
          checked={formData.has_international_certification}
          onChange={(e) =>
            setFormData({
              ...formData,
              has_international_certification: e.target.checked,
            })
          }
        />
        <Label htmlFor="certification">Possui certificação internacional</Label>
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Salvando...' : teacher ? 'Atualizar' : 'Cadastrar'}
      </Button>
    </form>
  );
};
```

---

## UI Components

### Loading Spinner
```typescript
export const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
  </div>
);
```

### Empty State
```typescript
interface EmptyStateProps {
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const EmptyState = ({ title, description, action }: EmptyStateProps) => (
  <div className="flex flex-col items-center justify-center p-12 text-center">
    <h3 className="text-lg font-semibold text-muted-foreground">{title}</h3>
    {description && (
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    )}
    {action && (
      <Button onClick={action.onClick} className="mt-4">
        {action.label}
      </Button>
    )}
  </div>
);
```

### Confirmation Dialog
```typescript
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

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  onConfirm: () => void;
}

export const ConfirmDialog = ({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
}: ConfirmDialogProps) => (
  <AlertDialog open={open} onOpenChange={onOpenChange}>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>{title}</AlertDialogTitle>
        <AlertDialogDescription>{description}</AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Cancelar</AlertDialogCancel>
        <AlertDialogAction onClick={onConfirm}>Confirmar</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);
```

---

**Note:** These examples follow the project's conventions and best practices. Use them as references when generating similar code.
