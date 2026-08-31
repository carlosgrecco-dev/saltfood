import React, { useEffect, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { fetchConfiguracaoPublica } from '../lib/configuracoesPlataforma';
import PublicHeader from '../components/PublicHeader';
import PlatformFooter from '../components/PlatformFooter';
import ContatoComercialDrawer from '../components/ContatoComercialDrawer';
import BlocoCtaBanner from '../components/site-cms/BlocoCtaBanner';
import { useSiteBlocos } from '../hooks/useSiteBlocos';

const PoliticaPrivacidadePage: React.FC = () => {
  const [contato, setContato] = useState<{ emailSuporte: string | null; telefoneSuporte: string | null } | null>(null);
  const [drawerAberto, setDrawerAberto] = useState(false);
  const blocos = useSiteBlocos('POLITICA_PRIVACIDADE');

  useEffect(() => {
    fetchConfiguracaoPublica()
      .then(setContato)
      .catch(() => setContato(null));
  }, []);

  const emailContato = contato?.emailSuporte || 'suporte@saltfood.com.br';

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <PublicHeader onFalarComAGente={() => setDrawerAberto(true)} />

      <main className="max-w-3xl mx-auto px-6 pb-16 w-full flex-1">
        <div className="flex items-center gap-2 mb-2">
          <ShieldCheck className="h-5 w-5 text-orange-600" />
          <h1 className="text-2xl font-bold text-slate-900">Política de Privacidade</h1>
        </div>
        <p className="text-sm text-slate-400 mb-8">Última atualização: {new Date().toLocaleDateString('pt-BR', { year: 'numeric', month: 'long' })}</p>

        <div className="prose prose-sm max-w-none text-slate-600 leading-relaxed space-y-6">
          <p>
            Quando você usa o site ou o aplicativo do <strong>SaltFood</strong>, seja como cliente de uma loja parceira,
            como lojista ou como motoboy, está confiando a gente com alguns dos seus dados pessoais. Esta política
            explica quais dados coletamos, por que coletamos e como você pode controlar isso.
          </p>
          <p>
            O SaltFood é operado pela <strong>Sigma Soluções Digitais</strong> e segue a Lei Geral de Proteção de
            Dados (Lei nº 13.709/2018) e o Marco Civil da Internet (Lei nº 12.965/2014). Esta política pode ser
            atualizada de tempos em tempos — a data no topo desta página sempre mostra a versão mais recente.
          </p>

          <h2 className="text-lg font-bold text-slate-900 mt-8">1. Quais dados coletamos</h2>
          <p>Dependendo de como você usa a plataforma, coletamos:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Clientes:</strong> nome, telefone, endereço de entrega e histórico de pedidos — necessários pra processar e entregar seu pedido.</li>
            <li><strong>Lojistas:</strong> dados da loja (nome, endereço, cardápio) e credenciais de acesso ao painel administrativo.</li>
            <li><strong>Motoboys:</strong> nome, telefone e, durante uma entrega em andamento, localização aproximada — usada só pra mostrar o acompanhamento da corrida ao cliente e à loja.</li>
            <li><strong>Uso da plataforma:</strong> informações técnicas básicas do dispositivo (tipo de navegador, sistema operacional) usadas apenas para estatísticas agregadas de uso, nunca para identificar uma pessoa individualmente.</li>
          </ul>
          <p>Não coletamos dados sensíveis (origem racial, opinião política, orientação sexual, saúde) nem os pedimos em nenhum cadastro.</p>

          <h2 className="text-lg font-bold text-slate-900 mt-8">2. Cookies e armazenamento local</h2>
          <p>
            O site e o aplicativo usam o armazenamento local do navegador (não cookies de rastreamento de terceiros)
            pra manter seu carrinho de compras, sua sessão de login e suas preferências entre visitas. Nenhuma
            dessas informações é compartilhada com redes de publicidade.
          </p>

          <h2 className="text-lg font-bold text-slate-900 mt-8">3. Como usamos seus dados</h2>
          <p>
            Usamos seus dados exclusivamente para viabilizar o pedido (preparo, cobrança e entrega), te avisar sobre
            o andamento dele, dar suporte quando você precisa, e — se você participar de algum programa da loja
            (cupons, fidelidade, cashback) — calcular e aplicar esses benefícios.
          </p>

          <h3 className="text-base font-bold text-slate-900 mt-6">3.1. Compartilhamento de dados com terceiros</h3>
          <p>
            Seus dados são compartilhados apenas com quem precisa deles pra concluir o seu pedido: a loja parceira
            responsável pelo preparo e o motoboy responsável pela entrega. Não vendemos nem alugamos seus dados a
            terceiros pra fins de marketing. Podemos divulgar dados a autoridades públicas somente mediante ordem
            judicial.
          </p>

          <h2 className="text-lg font-bold text-slate-900 mt-8">4. Segurança dos dados</h2>
          <p>
            Seus dados ficam armazenados em servidores com controles de acesso e segurança de mercado. Nenhum
            sistema é 100% imune a falhas — caso identifiquemos qualquer incidente que comprometa seus dados,
            avisaremos você e as autoridades competentes conforme exige a LGPD.
          </p>

          <h2 className="text-lg font-bold text-slate-900 mt-8">5. Seus direitos</h2>
          <p>
            De acordo com a LGPD, você pode a qualquer momento pedir a confirmação, correção, exportação ou exclusão
            dos seus dados pessoais, ou revogar um consentimento dado anteriormente. Pra isso, é só entrar em contato
            pelo canal abaixo.
          </p>

          <h2 className="text-lg font-bold text-slate-900 mt-8">6. Contato</h2>
          <p>
            Dúvidas sobre esta política ou pedidos relacionados aos seus dados podem ser enviados para{' '}
            <a href={`mailto:${emailContato}`} className="text-orange-600 font-medium hover:underline">{emailContato}</a>.
          </p>

          <h2 className="text-lg font-bold text-slate-900 mt-8">7. Foro</h2>
          <p>
            Em caso de conflitos relacionados a esta política, fica eleito o foro do domicílio do usuário, conforme
            previsto no Código de Defesa do Consumidor, salvo disposição legal em contrário.
          </p>
        </div>
      </main>

      <section className="max-w-3xl mx-auto px-6 pb-16 w-full">
        <BlocoCtaBanner
          bloco={blocos['cta-rodape']}
          fallback={{
            icone: 'Store',
            titulo: 'Ainda não vende pelo SaltFood?',
            texto: 'Cadastre seu restaurante na plataforma e leve cardápio digital, pedidos e entrega pro seu negócio — sem complicação, com a sua própria marca.',
            textoBotao: 'Quero cadastrar meu restaurante',
            linkBotao: '/parceiro',
          }}
          onAbrirContato={() => setDrawerAberto(true)}
        />
      </section>

      <PlatformFooter />

      <ContatoComercialDrawer isOpen={drawerAberto} onClose={() => setDrawerAberto(false)} origem="politica-privacidade" />
    </div>
  );
};

export default PoliticaPrivacidadePage;
