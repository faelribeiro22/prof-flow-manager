import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, Filter, Clock } from "lucide-react";

interface SearchViewProps {
  userRole: 'admin' | 'teacher';
}

interface TeacherAvailability {
  id: string;
  name: string;
  level: string;
  hasCertification: boolean;
  time: string;
  day: string;
  status: 'free' | 'occupied' | 'unavailable';
}

// Dados mockados para demonstração
const mockAvailability: TeacherAvailability[] = [
  {
    id: '1',
    name: 'Ana Silva',
    level: 'Sênior',
    hasCertification: true,
    time: '09:00',
    day: 'Segunda',
    status: 'free'
  },
  {
    id: '2',
    name: 'Carlos Santos',
    level: 'Pleno',
    hasCertification: false,
    time: '09:00',
    day: 'Segunda',
    status: 'free'
  },
  {
    id: '3',
    name: 'Maria Oliveira',
    level: 'Júnior',
    hasCertification: true,
    time: '10:00',
    day: 'Terça',
    status: 'free'
  }
];

export const SearchView = ({ userRole }: SearchViewProps) => {
  const [searchFilters, setSearchFilters] = useState({
    day: '',
    time: '',
    teacherName: '',
    status: 'free'
  });
  
  const [results, setResults] = useState<TeacherAvailability[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = () => {
    setIsSearching(true);
    // Simular busca
    const timeoutId = setTimeout(() => {
      const filtered = mockAvailability.filter(item => {
        return (
          (!searchFilters.day || item.day === searchFilters.day) &&
          (!searchFilters.time || item.time === searchFilters.time) &&
          (!searchFilters.teacherName || item.name.toLowerCase().includes(searchFilters.teacherName.toLowerCase())) &&
          (!searchFilters.status || item.status === searchFilters.status)
        );
      });
      setResults(filtered);
      setIsSearching(false);
    }, 500);
    
    // Retorna cleanup (embora não seja automático aqui)
    return () => clearTimeout(timeoutId);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'free':
        return 'bg-status-free text-status-free-foreground';
      case 'occupied':
        return 'bg-status-occupied text-status-occupied-foreground';
      case 'unavailable':
        return 'bg-status-unavailable text-status-unavailable-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Buscar Horários</h1>
        <p className="text-muted-foreground">
          Encontre professores disponíveis por dia e horário
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" />
            Filtros de Busca
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="day">Dia da Semana</Label>
              <Select value={searchFilters.day} onValueChange={(value) => setSearchFilters(prev => ({ ...prev, day: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o dia" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Segunda">Segunda</SelectItem>
                  <SelectItem value="Terça">Terça</SelectItem>
                  <SelectItem value="Quarta">Quarta</SelectItem>
                  <SelectItem value="Quinta">Quinta</SelectItem>
                  <SelectItem value="Sexta">Sexta</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="time">Horário</Label>
              <Select value={searchFilters.time} onValueChange={(value) => setSearchFilters(prev => ({ ...prev, time: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o horário" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="08:00">08:00</SelectItem>
                  <SelectItem value="09:00">09:00</SelectItem>
                  <SelectItem value="10:00">10:00</SelectItem>
                  <SelectItem value="11:00">11:00</SelectItem>
                  <SelectItem value="14:00">14:00</SelectItem>
                  <SelectItem value="15:00">15:00</SelectItem>
                  <SelectItem value="16:00">16:00</SelectItem>
                  <SelectItem value="17:00">17:00</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="teacherName">Nome do Professor</Label>
              <Input
                id="teacherName"
                placeholder="Digite o nome..."
                value={searchFilters.teacherName}
                onChange={(e) => setSearchFilters(prev => ({ ...prev, teacherName: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={searchFilters.status} onValueChange={(value) => setSearchFilters(prev => ({ ...prev, status: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Livre</SelectItem>
                  <SelectItem value="occupied">Ocupado</SelectItem>
                  <SelectItem value="unavailable">Indisponível</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={handleSearch} className="w-full md:w-auto" disabled={isSearching}>
            <Search className="mr-2 h-4 w-4" />
            {isSearching ? 'Buscando...' : 'Buscar'}
          </Button>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Resultados da Busca
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {results.map((item) => (
                <Card key={`${item.id}-${item.time}-${item.day}`} className="transition-smooth hover:shadow-custom-md">
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center space-x-4">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {item.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div>
                        <h3 className="font-semibold text-foreground">{item.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {item.day} - {item.time}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary">
                        {item.level}
                      </Badge>
                      
                      {item.hasCertification && (
                        <Badge variant="secondary">
                          Certificado
                        </Badge>
                      )}

                      <Badge className={getStatusColor(item.status)}>
                        {item.status === 'free' ? 'Livre' : item.status === 'occupied' ? 'Ocupado' : 'Indisponível'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};