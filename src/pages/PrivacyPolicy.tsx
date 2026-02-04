import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Shield, Mail, FileText, UserCheck, Clock, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="mb-6">
          <Link to="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </Link>
        </div>

        <Card className="shadow-custom-lg">
          <CardHeader className="text-center border-b">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Política de Privacidade</CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              Última atualização: {new Date().toLocaleDateString('pt-BR')}
            </p>
          </CardHeader>
          
          <CardContent className="prose prose-sm dark:prose-invert max-w-none p-6 space-y-6">
            {/* Introdução */}
            <section>
              <p className="text-muted-foreground">
                A <strong>AgendaPro</strong> está comprometida em proteger sua privacidade e seus dados pessoais, 
                em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018). 
                Esta Política de Privacidade descreve como coletamos, usamos, armazenamos e protegemos suas informações.
              </p>
            </section>

            {/* 1. Dados Coletados */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <FileText className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold m-0">1. Dados Coletados</h2>
              </div>
              <p className="text-muted-foreground mb-2">
                Coletamos os seguintes dados pessoais para a prestação de nossos serviços:
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li><strong>Dados de identificação:</strong> Nome completo</li>
                <li><strong>Dados de contato:</strong> Endereço de e-mail, número de telefone (opcional)</li>
                <li><strong>Dados profissionais:</strong> Nível de experiência, certificações, formação acadêmica</li>
                <li><strong>Dados de agendamento:</strong> Horários de aulas, disponibilidade</li>
                <li><strong>Dados de autenticação:</strong> Credenciais de acesso (senha criptografada)</li>
              </ul>
            </section>

            {/* 2. Finalidade do Tratamento */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <UserCheck className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold m-0">2. Finalidade do Tratamento</h2>
              </div>
              <p className="text-muted-foreground mb-2">
                Os dados são utilizados exclusivamente para:
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Gerenciamento de agenda de professores</li>
                <li>Organização de horários e aulas</li>
                <li>Comunicação sobre aulas agendadas e notificações do sistema</li>
                <li>Melhoria dos serviços prestados</li>
                <li>Cumprimento de obrigações legais e regulatórias</li>
              </ul>
            </section>

            {/* 3. Base Legal */}
            <section>
              <h2 className="text-lg font-semibold">3. Base Legal para o Tratamento</h2>
              <p className="text-muted-foreground mb-2">
                O tratamento de dados pessoais é realizado com base nas seguintes hipóteses legais previstas na LGPD:
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li><strong>Consentimento (Art. 7º, I):</strong> Para coleta e processamento de dados pessoais</li>
                <li><strong>Execução de contrato (Art. 7º, V):</strong> Para prestação dos serviços contratados</li>
                <li><strong>Legítimo interesse (Art. 7º, IX):</strong> Para melhoria e segurança dos serviços</li>
                <li><strong>Cumprimento de obrigação legal (Art. 7º, II):</strong> Para atendimento de requisitos legais</li>
              </ul>
            </section>

            {/* 4. Direitos do Titular */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <Shield className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold m-0">4. Direitos do Titular</h2>
              </div>
              <p className="text-muted-foreground mb-2">
                Conforme previsto na LGPD, você tem os seguintes direitos em relação aos seus dados pessoais:
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li><strong>Acesso:</strong> Solicitar informações sobre seus dados pessoais tratados</li>
                <li><strong>Correção:</strong> Corrigir dados incompletos, inexatos ou desatualizados</li>
                <li><strong>Exclusão:</strong> Solicitar a eliminação de dados desnecessários ou tratados em desconformidade</li>
                <li><strong>Portabilidade:</strong> Receber seus dados em formato estruturado</li>
                <li><strong>Revogação:</strong> Revogar o consentimento a qualquer momento</li>
                <li><strong>Informação:</strong> Ser informado sobre o compartilhamento de dados</li>
                <li><strong>Oposição:</strong> Opor-se ao tratamento em determinadas situações</li>
              </ul>
              <p className="text-muted-foreground mt-3">
                Para exercer seus direitos, acesse as <strong>Configurações de Privacidade</strong> no sistema 
                ou entre em contato através dos canais indicados abaixo.
              </p>
            </section>

            {/* 5. Compartilhamento de Dados */}
            <section>
              <h2 className="text-lg font-semibold">5. Compartilhamento de Dados</h2>
              <p className="text-muted-foreground mb-2">
                Seus dados pessoais podem ser compartilhados apenas nas seguintes situações:
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Com prestadores de serviços essenciais (hospedagem, banco de dados)</li>
                <li>Para cumprimento de obrigações legais ou regulatórias</li>
                <li>Mediante seu consentimento expresso para outras finalidades</li>
              </ul>
              <p className="text-muted-foreground mt-2">
                <strong>Não vendemos, alugamos ou comercializamos seus dados pessoais.</strong>
              </p>
            </section>

            {/* 6. Segurança dos Dados */}
            <section>
              <h2 className="text-lg font-semibold">6. Segurança dos Dados</h2>
              <p className="text-muted-foreground mb-2">
                Adotamos medidas técnicas e organizacionais para proteger seus dados:
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Criptografia de dados em trânsito (HTTPS/TLS)</li>
                <li>Criptografia de senhas (bcrypt)</li>
                <li>Controle de acesso baseado em funções (RLS)</li>
                <li>Monitoramento e logs de auditoria</li>
                <li>Backups regulares dos dados</li>
              </ul>
            </section>

            {/* 7. Retenção de Dados */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <Clock className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold m-0">7. Retenção de Dados</h2>
              </div>
              <p className="text-muted-foreground">
                Os dados pessoais serão mantidos enquanto houver relação ativa com o serviço 
                ou conforme exigido por obrigações legais. Após o término da relação, os dados 
                poderão ser anonimizados ou excluídos, exceto quando houver necessidade de 
                retenção por obrigação legal ou para exercício de direitos em processos judiciais.
              </p>
            </section>

            {/* 8. Cookies */}
            <section>
              <h2 className="text-lg font-semibold">8. Cookies e Tecnologias Similares</h2>
              <p className="text-muted-foreground">
                Utilizamos cookies e tecnologias similares para melhorar sua experiência no sistema. 
                Os cookies são utilizados para manter sua sessão, preferências e para fins de segurança. 
                Você pode configurar seu navegador para recusar cookies, porém isso pode afetar 
                o funcionamento do sistema.
              </p>
            </section>

            {/* 9. Exclusão de Conta */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <Trash2 className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold m-0">9. Exclusão de Conta</h2>
              </div>
              <p className="text-muted-foreground">
                Você pode solicitar a exclusão de sua conta e de todos os seus dados pessoais 
                a qualquer momento através das Configurações de Privacidade. Após a solicitação, 
                seus dados serão excluídos permanentemente, exceto aqueles que devemos manter 
                por obrigação legal.
              </p>
            </section>

            {/* 10. Contato do DPO */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <Mail className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold m-0">10. Contato do Encarregado (DPO)</h2>
              </div>
              <p className="text-muted-foreground mb-2">
                Para exercer seus direitos, esclarecer dúvidas sobre o tratamento de seus dados 
                ou reportar incidentes de segurança, entre em contato com nosso Encarregado de 
                Proteção de Dados (DPO):
              </p>
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm">
                  <strong>E-mail:</strong> privacidade@agendapro.com.br
                </p>
                <p className="text-sm mt-1">
                  <strong>Prazo de resposta:</strong> Até 15 dias úteis
                </p>
              </div>
            </section>

            {/* 11. Alterações */}
            <section>
              <h2 className="text-lg font-semibold">11. Alterações nesta Política</h2>
              <p className="text-muted-foreground">
                Esta Política de Privacidade pode ser atualizada periodicamente. 
                Notificaremos você sobre alterações significativas por e-mail ou através 
                de aviso no sistema. Recomendamos a revisão periódica desta página.
              </p>
            </section>

            {/* 12. Legislação Aplicável */}
            <section>
              <h2 className="text-lg font-semibold">12. Legislação Aplicável</h2>
              <p className="text-muted-foreground">
                Esta Política de Privacidade é regida pela legislação brasileira, especialmente 
                pela Lei Geral de Proteção de Dados (Lei nº 13.709/2018) e pelo Marco Civil da 
                Internet (Lei nº 12.965/2014).
              </p>
            </section>
          </CardContent>
        </Card>

        <div className="text-center mt-6 text-sm text-muted-foreground">
          <p>
            Ao utilizar o AgendaPro, você concorda com os termos desta Política de Privacidade.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
