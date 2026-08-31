import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight, Bike, Check, ClipboardList, HandCoins, Link2, Mail, MessageCircle,
  MessageSquarePlus, Search, Star, Wallet,
} from 'lucide-react';
import { fetchConfiguracaoPublica } from '../lib/configuracoesPlataforma';
import { fetchPlanosPublico } from '../lib/planos';
import { PlanoPublico } from '../types/Plano';
import { slugify } from '../lib/masks';
import PublicHeader from '../components/PublicHeader';
import PlatformFooter from '../components/PlatformFooter';
import ContatoComercialDrawer from '../components/ContatoComercialDrawer';
import BlocoHero from '../components/site-cms/BlocoHero';
import BlocoListaIcones from '../components/site-cms/BlocoListaIcones';
import { useSiteBlocos } from '../hooks/useSiteBlocos';

const VANTAGENS = [
  { icon: Link2, titulo: 'Link exclusivo', texto: 'Sua loja ganha um endereço só seu (saltfood.com.br/sua-loja) pra divulgar nas redes sociais.' },
  { icon: Wallet, titulo: 'Pagamento flexível', texto: 'Pix, dinheiro ou cartão na entrega — o cliente escolhe, sem taxa de gateway no meio.' },
  { icon: HandCoins, titulo: 'Dinheiro direto com você', texto: 'Sem intermediário retendo o pagamento — o valor da venda vai direto pra loja.' },
  { icon: ClipboardList, titulo: 'Painel de pedidos', texto: 'Receba, prepare e imprima a comanda direto do painel ou do app do gestor.' },
  { icon: Bike, titulo: 'Gestão de entregadores', texto: 'Cadastre seus próprios motoboys, acompanhe corridas e feche o pagamento de cada um.' },
];

const ParceiroPage: React.FC = () => {
  const navigate = useNavigate();
  const [slugBusca, setSlugBusca] = useState('');
  const [contato, setContato] = useState<{ emailSuporte: string | null; telefoneSuporte: string | null } | null>(null);
  const [planos, setPlanos] = useState<PlanoPublico[]>([]);
  const [drawerAberto, setDrawerAberto] = useState(false);
  const [planoSelecionado, setPlanoSelecionado] = useState<string | undefined>(undefined);
  const blocos = useSiteBlocos('PARCEIRO');

  useEffect(() => {
    fetchConfiguracaoPublica()
      .then(setContato)
      .catch(() => setContato(null));
    fetchPlanosPublico()
      .then(setPlanos)
      .catch(() => setPlanos([]));
  }, []);

  const handleAcessarPainel = (e: React.FormEvent) => {
    e.preventDefault();
    const slug = slugify(slugBusca.trim());
    if (slug) navigate(`/${slug}/admin`);
  };

  const abrirContato = (planoId?: string) => {
    setPlanoSelecionado(planoId);
    setDrawerAberto(true);
  };

  const whatsappUrl = contato?.telefoneSuporte
    ? `https://wa.me/${contato.telefoneSuporte.replace(/\D/g, '')}?text=${encodeURIComponent('Olá! Quero saber mais sobre como virar parceiro do SaltFood.')}`
    : null;
  const mailtoUrl = contato?.emailSuporte ? `mailto:${contato.emailSuporte}` : null;

  return (
    <div className="min-h-screen bg-white">
      <PublicHeader onFalarComAGente={() => abrirContato()} />

      {/* Hero */}
      <section className="bg-slate-900">
        <div className="max-w-4xl mx-auto px-6 py-16 text-center">
          <BlocoHero
            bloco={blocos['hero']}
            variant="dark"
            fallback={{
              eyebrow: 'Seja nosso parceiro',
              titulo: 'Quando você vende, todo mundo faz um bom negócio.',
              subtitulo: 'Leve seu restaurante pro SaltFood — cardápio digital, pedidos, entrega e gestão dos seus motoboys, tudo em um só lugar, com a sua própria marca.',
            }}
            subtituloClassName="max-w-lg mx-auto"
          />
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => abrirContato()}
              className="inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors"
            >
              <MessageSquarePlus className="h-4 w-4" /> Quero contratar
            </button>
            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors"
              >
                <MessageCircle className="h-4 w-4" /> Falar no WhatsApp
              </a>
            )}
            {mailtoUrl && (
              <a
                href={mailtoUrl}
                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors border border-white/20"
              >
                <Mail className="h-4 w-4" /> Enviar e-mail
              </a>
            )}
          </div>
        </div>
      </section>

      {/* Acesso ao painel — já é parceiro */}
      <section className="max-w-4xl mx-auto px-6 py-14 text-center border-b border-slate-100">
        <h2 className="text-lg font-bold text-slate-800">Já é parceiro? Acesse o painel da sua loja</h2>
        <form onSubmit={handleAcessarPainel} className="mt-5 flex items-stretch gap-2 max-w-md mx-auto">
          <div className="flex-1 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 shadow-sm focus-within:ring-2 focus-within:ring-orange-500 focus-within:border-transparent">
            <Search className="h-4 w-4 text-slate-400 shrink-0" />
            <input
              type="text"
              value={slugBusca}
              onChange={(e) => setSlugBusca(e.target.value)}
              placeholder="Nome da sua loja"
              className="flex-1 min-w-0 py-3 text-sm outline-none bg-transparent"
            />
          </div>
          <button
            type="submit"
            disabled={!slugBusca.trim()}
            className="shrink-0 flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white font-semibold text-sm px-5 rounded-xl transition-colors"
          >
            Acessar <ArrowRight className="h-4 w-4" />
          </button>
        </form>
        <p className="mt-2 text-xs text-slate-400">Cada loja tem seu próprio painel em saltfood.com.br/sua-loja/admin.</p>
      </section>

      {/* Vantagens */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <p className="text-center text-orange-600 font-semibold text-sm">cuidar e servir bem</p>
        <h2 className="mt-2 text-center text-2xl sm:text-3xl font-bold text-slate-900">
          O melhor app com vantagens exclusivas pra parceiros
        </h2>
        <p className="mt-3 text-center text-sm text-slate-500 max-w-lg mx-auto">
          Receba seus pedidos prontos pra impressão, com notificação na hora, no computador ou no celular.
        </p>

        <BlocoListaIcones
          bloco={blocos['vantagens']}
          fallback={VANTAGENS}
          gridClassName="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-4"
        />
      </section>

      {/* Planos */}
      {planos.length > 0 && (
        <section id="planos" className="max-w-6xl mx-auto px-6 py-16 border-t border-slate-100">
          <p className="text-center text-orange-600 font-semibold text-sm">sem letra miúda</p>
          <h2 className="mt-2 text-center text-2xl sm:text-3xl font-bold text-slate-900">
            Escolha o plano do tamanho do seu negócio
          </h2>

          <div className="mt-10 grid md:grid-cols-3 gap-6 items-start">
            {planos.map((plano) => (
              <div
                key={plano.id}
                className={`relative rounded-3xl p-6 bg-white ${plano.destaque ? 'border-2 border-orange-400 shadow-lg shadow-orange-100' : 'border border-slate-200'}`}
              >
                {plano.destaque && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 bg-orange-500 text-white text-[10px] font-bold px-3 py-1 rounded-full">
                    <Star className="h-3 w-3" /> MAIS POPULAR
                  </span>
                )}
                <h3 className="font-bold text-slate-900 text-lg">{plano.nome}</h3>
                {plano.descricao && <p className="text-xs text-slate-500 mt-1">{plano.descricao}</p>}
                <p className="mt-4">
                  <span className="text-3xl font-bold text-slate-900">R$ {plano.valorMensal.toFixed(2)}</span>
                  <span className="text-sm text-slate-400">/mês</span>
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {plano.comissaoPercent > 0 ? `+ ${plano.comissaoPercent}% de comissão sobre vendas` : 'sem comissão sobre vendas'}
                </p>
                {plano.recursos.length > 0 && (
                  <ul className="mt-5 space-y-2">
                    {plano.recursos.map((recurso) => (
                      <li key={recurso} className="flex items-start gap-2 text-sm text-slate-600">
                        <Check className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" /> {recurso}
                      </li>
                    ))}
                  </ul>
                )}
                <button
                  onClick={() => abrirContato(plano.id)}
                  className={`mt-6 w-full text-sm font-semibold py-2.5 rounded-xl transition-colors ${
                    plano.destaque
                      ? 'bg-orange-600 hover:bg-orange-700 text-white'
                      : 'bg-slate-900 hover:bg-slate-800 text-white'
                  }`}
                >
                  Quero este plano
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      <PlatformFooter />

      <ContatoComercialDrawer
        isOpen={drawerAberto}
        onClose={() => setDrawerAberto(false)}
        origem="parceiro"
        planoIdInicial={planoSelecionado}
      />
    </div>
  );
};

export default ParceiroPage;
