// ============================================
// COMPONENT: Teacher Address Form
// ============================================
// Formulário para cadastro/edição de endereço do professor
// Acesso restrito: apenas admin

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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  createTeacherAddress,
  updateTeacherAddress,
  fetchAddressByCep,
} from '@/lib/api/teacher-extended';
import type { TeacherAddress } from '@/integrations/supabase/extended-types';
import { BRAZILIAN_STATES } from '@/integrations/supabase/extended-types';
import { Loader2, MapPin } from 'lucide-react';

interface TeacherAddressFormProps {
  teacherId: string;
  address?: TeacherAddress | null;
  onSuccess?: () => void;
}

export const TeacherAddressForm = ({
  teacherId,
  address,
  onSuccess,
}: TeacherAddressFormProps) => {
  const [formData, setFormData] = useState({
    cep: address?.cep || '',
    street: address?.street || '',
    number: address?.number || '',
    complement: address?.complement || '',
    neighborhood: address?.neighborhood || '',
    city: address?.city || '',
    state: address?.state || '',
  });
  const [loading, setLoading] = useState(false);
  const [loadingCep, setLoadingCep] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (address) {
      setFormData({
        cep: address.cep,
        street: address.street,
        number: address.number,
        complement: address.complement || '',
        neighborhood: address.neighborhood,
        city: address.city,
        state: address.state,
      });
    }
  }, [address]);

  const handleCepBlur = async () => {
    if (formData.cep.length < 8) return;

    setLoadingCep(true);
    try {
      const data = await fetchAddressByCep(formData.cep);
      
      if (data) {
        setFormData((prev) => ({
          ...prev,
          street: data.logradouro || prev.street,
          neighborhood: data.bairro || prev.neighborhood,
          city: data.localidade || prev.city,
          state: data.uf || prev.state,
          complement: data.complemento || prev.complement,
        }));

        toast({
          title: 'CEP encontrado',
          description: 'Endereço preenchido automaticamente',
        });
      }
    } catch (error) {
      toast({
        title: 'Erro ao buscar CEP',
        description: 'Verifique o CEP informado',
        variant: 'destructive',
      });
    } finally {
      setLoadingCep(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (
      !formData.cep ||
      !formData.street ||
      !formData.number ||
      !formData.neighborhood ||
      !formData.city ||
      !formData.state
    ) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos obrigatórios',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      if (address) {
        await updateTeacherAddress(teacherId, formData);
        toast({
          title: 'Sucesso',
          description: 'Endereço atualizado com sucesso',
        });
      } else {
        await createTeacherAddress({
          teacher_id: teacherId,
          ...formData,
        });
        toast({
          title: 'Sucesso',
          description: 'Endereço cadastrado com sucesso',
        });
      }

      onSuccess?.();
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar o endereço',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          {address ? 'Editar Endereço' : 'Cadastrar Endereço'}
        </CardTitle>
        <CardDescription>
          Informação restrita - visível apenas para administradores
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="cep">CEP *</Label>
              <div className="flex gap-2">
                <Input
                  id="cep"
                  value={formData.cep}
                  onChange={(e) =>
                    setFormData({ ...formData, cep: e.target.value })
                  }
                  onBlur={handleCepBlur}
                  placeholder="12345-678"
                  maxLength={9}
                  required
                />
                {loadingCep && <Loader2 className="h-4 w-4 animate-spin" />}
              </div>
            </div>

            <div>
              <Label htmlFor="street">Logradouro *</Label>
              <Input
                id="street"
                value={formData.street}
                onChange={(e) =>
                  setFormData({ ...formData, street: e.target.value })
                }
                placeholder="Rua, Avenida, etc."
                required
              />
            </div>

            <div>
              <Label htmlFor="number">Número *</Label>
              <Input
                id="number"
                value={formData.number}
                onChange={(e) =>
                  setFormData({ ...formData, number: e.target.value })
                }
                placeholder="123"
                required
              />
            </div>

            <div>
              <Label htmlFor="complement">Complemento</Label>
              <Input
                id="complement"
                value={formData.complement}
                onChange={(e) =>
                  setFormData({ ...formData, complement: e.target.value })
                }
                placeholder="Apto, Bloco, etc."
              />
            </div>

            <div>
              <Label htmlFor="neighborhood">Bairro *</Label>
              <Input
                id="neighborhood"
                value={formData.neighborhood}
                onChange={(e) =>
                  setFormData({ ...formData, neighborhood: e.target.value })
                }
                required
              />
            </div>

            <div>
              <Label htmlFor="city">Cidade *</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) =>
                  setFormData({ ...formData, city: e.target.value })
                }
                required
              />
            </div>

            <div>
              <Label htmlFor="state">Estado *</Label>
              <Select
                value={formData.state}
                onValueChange={(value) =>
                  setFormData({ ...formData, state: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o estado" />
                </SelectTrigger>
                <SelectContent>
                  {BRAZILIAN_STATES.map((state) => (
                    <SelectItem key={state.value} value={state.value}>
                      {state.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : address ? (
              'Atualizar Endereço'
            ) : (
              'Cadastrar Endereço'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
