# GitHub Copilot Instructions - AgendaPro

## Project Context

**AgendaPro** is a schedule management system for language teachers built with React, TypeScript, and Supabase.

### Tech Stack
- **Frontend:** React 18 + TypeScript + Vite
- **UI:** Shadcn/ui (Radix UI) + Tailwind CSS
- **Backend:** Supabase (PostgreSQL + Auth + RLS)
- **State:** React Context API
- **Routing:** React Router
- **Package Manager:** Bun

---

## Code Style & Conventions

### TypeScript
```typescript
// ✅ DO: Use explicit types
interface Teacher {
  id: string;
  name: string;
  level: TeacherLevel;
}

// ❌ DON'T: Use 'any'
const data: any = {}; // Avoid this

// ✅ DO: Use proper enum types
enum TeacherLevel {
  INICIANTE = 'iniciante',
  INTERMEDIARIO = 'intermediario',
  AVANCADO = 'avancado'
}
```

### React Components
```typescript
// ✅ DO: Use functional components with TypeScript
interface TeacherCardProps {
  teacher: Teacher;
  onEdit?: (id: string) => void;
}

export const TeacherCard = ({ teacher, onEdit }: TeacherCardProps) => {
  // Component logic
};

// ✅ DO: Use hooks properly
const [data, setData] = useState<Teacher[]>([]);
const { toast } = useToast();
```

### File Organization
```typescript
// ✅ DO: Group imports logically
// 1. React/External
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// 2. UI Components
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

// 3. Custom Components
import { TeacherCard } from '@/components/Dashboard/TeacherCard';

// 4. Hooks
import { useAuth } from '@/components/Auth/AuthContext';
import { useToast } from '@/hooks/use-toast';

// 5. Utils/Types
import { supabase } from '@/integrations/supabase/client';
import type { Teacher } from '@/integrations/supabase/types';
```

### Naming Conventions
```typescript
// Components: PascalCase
export const TeacherList = () => {};

// Functions: camelCase
const handleSubmit = () => {};
const fetchTeachers = async () => {};

// Constants: UPPER_SNAKE_CASE
const MAX_TEACHERS = 100;
const API_BASE_URL = 'https://api.example.com';

// Types/Interfaces: PascalCase
interface UserProfile {}
type TeacherStatus = 'active' | 'inactive';

// Files: kebab-case
// teacher-list.tsx
// use-teacher-data.ts
```

---

## Common Patterns

### Supabase Queries
```typescript
// ✅ DO: Always handle errors
const fetchTeachers = async () => {
  try {
    const { data, error } = await supabase
      .from('teachers')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching teachers:', error);
    toast({
      title: 'Erro',
      description: 'Não foi possível carregar os professores',
      variant: 'destructive',
    });
    return [];
  }
};

// ✅ DO: Use RLS-aware queries
const updateTeacher = async (id: string, updates: Partial<Teacher>) => {
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

### Form Handling
```typescript
// ✅ DO: Use controlled components with validation
const [formData, setFormData] = useState({
  name: '',
  email: '',
  level: 'iniciante' as TeacherLevel,
});

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
  
  // Submit logic
  try {
    // ... save data
    toast({
      title: 'Sucesso',
      description: 'Professor cadastrado com sucesso',
    });
  } catch (error) {
    // ... error handling
  }
};
```

### Loading States
```typescript
// ✅ DO: Show loading states
const [loading, setLoading] = useState(true);

useEffect(() => {
  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchTeachers();
      setTeachers(data);
    } finally {
      setLoading(false);
    }
  };
  
  loadData();
}, []);

if (loading) {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );
}
```

---

## Database Schema Reference

### Key Tables
```typescript
// profiles
{
  id: uuid,
  user_id: uuid, // FK to auth.users
  role: 'admin' | 'teacher',
  created_at: timestamp,
  updated_at: timestamp
}

// teachers
{
  id: uuid,
  user_id: uuid, // FK to auth.users
  name: string,
  email: string,
  phone?: string,
  level: 'iniciante' | 'intermediario' | 'avancado',
  has_international_certification: boolean,
  created_at: timestamp,
  updated_at: timestamp
}

// schedules
{
  id: uuid,
  teacher_id: uuid, // FK to teachers
  day_of_week: number, // 0-6 (Sunday-Saturday)
  hour: number, // 8-22
  status: 'livre' | 'ocupado',
  student_name?: string,
  created_at: timestamp,
  updated_at: timestamp
}

// special_lists
{
  id: uuid,
  teacher_id: uuid, // FK to teachers
  list_type: string, // 'ferias', 'licenca_medica', etc.
  start_date?: date,
  end_date?: date,
  observation?: string,
  created_at: timestamp,
  updated_at: timestamp
}
```

---

## UI Components (Shadcn/ui)

### Common Components
```typescript
// Buttons
import { Button } from '@/components/ui/button';
<Button variant="default | destructive | outline | ghost">Text</Button>

// Cards
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>Content</CardContent>
</Card>

// Forms
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
<Label htmlFor="name">Nome</Label>
<Input id="name" value={name} onChange={(e) => setName(e.target.value)} />

// Toast
import { useToast } from '@/hooks/use-toast';
const { toast } = useToast();
toast({ title: 'Success', description: 'Message' });

// Dialog
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

// Select
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
```

### Styling with Tailwind
```typescript
// ✅ DO: Use semantic Tailwind classes
<div className="flex items-center justify-between p-4 bg-card rounded-lg shadow-sm">
  <h2 className="text-lg font-semibold text-foreground">Title</h2>
</div>

// ✅ DO: Use theme variables
className="bg-background text-foreground border-border"

// ✅ DO: Responsive design
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
```

---

## Authentication Pattern

```typescript
// ✅ DO: Use AuthContext
import { useAuth } from '@/components/Auth/AuthContext';

const MyComponent = () => {
  const { user, role, loading, signOut } = useAuth();
  
  if (loading) return <LoadingSpinner />;
  
  if (!user) return <LoginForm />;
  
  if (role === 'admin') {
    // Admin-only content
  }
  
  // Regular content
};

// ✅ DO: Check permissions
const canEdit = role === 'admin' || teacher.user_id === user?.id;

if (canEdit) {
  // Show edit button
}
```

---

## Error Handling

```typescript
// ✅ DO: Consistent error handling
try {
  const result = await someAsyncOperation();
  
  if (!result) {
    throw new Error('Operation failed');
  }
  
  toast({
    title: 'Sucesso',
    description: 'Operação realizada com sucesso',
  });
  
  return result;
} catch (error) {
  console.error('Error in operation:', error);
  
  toast({
    title: 'Erro',
    description: error instanceof Error ? error.message : 'Erro desconhecido',
    variant: 'destructive',
  });
  
  throw error; // Re-throw if needed
}
```

---

## Performance Best Practices

```typescript
// ✅ DO: Memoize expensive computations
const sortedTeachers = useMemo(() => {
  return teachers.sort((a, b) => a.name.localeCompare(b.name));
}, [teachers]);

// ✅ DO: Use useCallback for event handlers
const handleDelete = useCallback(async (id: string) => {
  // Delete logic
}, []);

// ✅ DO: Debounce search inputs
const [searchTerm, setSearchTerm] = useState('');
const debouncedSearch = useDebounce(searchTerm, 300);

useEffect(() => {
  if (debouncedSearch) {
    performSearch(debouncedSearch);
  }
}, [debouncedSearch]);
```

---

## Testing Considerations

```typescript
// ✅ DO: Write testable code
// Export functions for testing
export const validateTeacherData = (data: Partial<Teacher>): boolean => {
  return !!(data.name && data.email && data.level);
};

// Use dependency injection where possible
interface TeacherServiceProps {
  supabaseClient?: typeof supabase;
}

export const createTeacherService = ({ 
  supabaseClient = supabase 
}: TeacherServiceProps = {}) => {
  // Service methods using supabaseClient
};
```

---

## Accessibility

```typescript
// ✅ DO: Add proper ARIA labels
<button
  aria-label="Editar professor"
  onClick={() => handleEdit(teacher.id)}
>
  <Edit className="h-4 w-4" />
</button>

// ✅ DO: Use semantic HTML
<nav aria-label="Main navigation">
  <ul>
    <li><a href="/dashboard">Dashboard</a></li>
  </ul>
</nav>

// ✅ DO: Support keyboard navigation
<div
  role="button"
  tabIndex={0}
  onKeyDown={(e) => e.key === 'Enter' && handleClick()}
  onClick={handleClick}
>
  Clickable div
</div>
```

---

## Common Tasks Quick Reference

### Create a new page
```typescript
// src/pages/NewPage.tsx
import { useAuth } from '@/components/Auth/AuthContext';

const NewPage = () => {
  const { user, role } = useAuth();
  
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">New Page</h1>
      {/* Content */}
    </div>
  );
};

export default NewPage;
```

### Add a new Supabase query
```typescript
// src/integrations/supabase/queries/teachers.ts
import { supabase } from '../client';
import type { Teacher } from '../types';

export const getTeachers = async (): Promise<Teacher[]> => {
  const { data, error } = await supabase
    .from('teachers')
    .select('*')
    .order('name');
  
  if (error) throw error;
  return data || [];
};
```

### Create a new component
```typescript
// src/components/Feature/ComponentName.tsx
interface ComponentNameProps {
  // Props definition
}

export const ComponentName = ({ }: ComponentNameProps) => {
  // Component logic
  
  return (
    <div>
      {/* JSX */}
    </div>
  );
};
```

---

## Project-Specific Rules

### Schedule Grid
- Day of week: 0-6 (Sunday-Saturday)
- Hours: 8-22 (8 AM - 10 PM)
- Status: 'livre' | 'ocupado'
- student_name required when status = 'ocupado'

### Teacher Levels
- 'iniciante' - Beginner
- 'intermediario' - Intermediate
- 'avancado' - Advanced

### User Roles
- 'admin' - Full access to all features
- 'teacher' - Access only to own data

### Special Lists Types
- 'ferias' - Vacation
- 'licenca_medica' - Medical leave
- 'afastamento' - Leave of absence
- Custom types allowed

---

## When Generating Code

1. **Always** check user's role for permissions
2. **Always** handle loading and error states
3. **Always** show user feedback (toast notifications)
4. **Always** use TypeScript types from `@/integrations/supabase/types`
5. **Always** follow the existing file structure
6. **Prefer** functional components over class components
7. **Prefer** Context API over prop drilling
8. **Prefer** Tailwind classes over inline styles
9. **Avoid** using 'any' type
10. **Avoid** direct DOM manipulation

---

**Last Updated:** November 2, 2025  
**Version:** 1.0.0
