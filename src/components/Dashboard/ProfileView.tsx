import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { User, Save, Phone, Mail, Award } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ProfileViewProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'teacher';
    phone?: string;
    level?: string;
    hasCertification?: boolean;
  };
}

export const ProfileView = ({ user }: ProfileViewProps) => {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
    phone: user.phone || '',
    level: user.level || 'Júnior',
    hasCertification: user.hasCertification || false
  });

  const handleSave = () => {
    // Simular salvamento
    const timeoutId = setTimeout(() => {
      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram salvas com sucesso.",
      });
      setIsEditing(false);
    }, 500);
    
    // Cleanup automático não é necessário aqui pois é um evento único de usuário
    // mas mantemos a referência caso o componente desmonte
    return () => clearTimeout(timeoutId);
  };

  const handleCancel = () => {
    setFormData({
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      level: user.level || 'Júnior',
      hasCertification: user.hasCertification || false
    });
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Meu Perfil</h1>
        <p className="text-muted-foreground">
          Gerencie suas informações pessoais
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Informações Pessoais
            </CardTitle>
            {!isEditing ? (
              <Button onClick={() => setIsEditing(true)} variant="outline">
                Editar Perfil
              </Button>
            ) : (
              <div className="space-x-2">
                <Button onClick={handleCancel} variant="outline" size="sm">
                  Cancelar
                </Button>
                <Button onClick={handleSave} size="sm">
                  <Save className="mr-2 h-4 w-4" />
                  Salvar
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center space-x-4">
            <Avatar className="h-20 w-20">
              <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-semibold text-foreground">{user.name}</h2>
              <Badge variant="secondary" className="mt-1">
                {user.role === 'admin' ? 'Administrador' : 'Professor'}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="name" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Nome Completo
                </Label>
                {isEditing ? (
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  />
                ) : (
                  <p className="mt-1 p-2 bg-muted rounded-md">{formData.name}</p>
                )}
              </div>

              <div>
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  E-mail
                </Label>
                {isEditing ? (
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  />
                ) : (
                  <p className="mt-1 p-2 bg-muted rounded-md">{formData.email}</p>
                )}
              </div>

              <div>
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Telefone
                </Label>
                {isEditing ? (
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="(11) 99999-9999"
                  />
                ) : (
                  <p className="mt-1 p-2 bg-muted rounded-md">{formData.phone || 'Não informado'}</p>
                )}
              </div>
            </div>

            {user.role === 'teacher' && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="level" className="flex items-center gap-2">
                    <Award className="h-4 w-4" />
                    Nível do Professor
                  </Label>
                  {isEditing ? (
                    <Select value={formData.level} onValueChange={(value) => setFormData(prev => ({ ...prev, level: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Júnior">Júnior</SelectItem>
                        <SelectItem value="Pleno">Pleno</SelectItem>
                        <SelectItem value="Sênior">Sênior</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="mt-1 p-2 bg-muted rounded-md">{formData.level}</p>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="certification"
                    checked={formData.hasCertification}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, hasCertification: checked }))}
                    disabled={!isEditing}
                  />
                  <Label htmlFor="certification">
                    Possui Certificação Internacional
                  </Label>
                </div>

                {formData.hasCertification && (
                  <Badge variant="secondary" className="ml-6">
                    Certificado
                  </Badge>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};