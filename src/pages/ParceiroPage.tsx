import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, Bike, ClipboardList, HandCoins, Link2, Mail, MessageCircle, Search, Wallet,
} from 'lucide-react';
import { fetchConfiguracaoPublica } from '../lib/configuracoesPlataforma';
import { slugify } from '../lib/masks';
import PlatformFooter from '../components/PlatformFooter';

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

  useEffect(() => {
    fetchConfiguracaoPublica()
      .then(setContato)
      .catch(() => setContato(null));
  }, []);

  const handleAcessarPainel = (e: React.FormEvent) => {
    e.preventDefault();
    const slug = slugify(slugBusca.trim());
    if (slug) navigate(`/${slug}/admin`);
  };

  const whatsappUrl = contato?.telefoneSuporte
    ? `https://wa.me/${contato.telefoneSuporte.replace(/\D/g, '')}?text=${encodeURIComponent('Olá! Quero saber mais sobre como virar parceiro do SaltFood.')}`
    : null;
  const mailtoUrl = contato?.emailSuporte ? `mailto:${contato.emailSuporte}` : null;

  return (
    <div className="min-h-screen bg-white">
      <header className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between gap-4">
        <Link to="/" className="h-10 w-10 shrink-0 rounded-xl bg-black p-1">
          <img src="/logo.png" alt="SaltFood" className="h-full w-full rounded-md" />
        </Link>
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Link>
      </header>

      {/* Hero */}
      <section className="bg-slate-900">
        <div className="max-w-4xl mx-auto px-6 py-16 text-center">
          <p className="text-orange-400 font-semibold text-sm">Seja nosso parceiro</p>
          <h1 className="mt-2 text-3xl sm:text-4xl font-bold text-white leading-tight">
            Quando você vende, todo mundo faz um bom negócio.
          </h1>
          <p className="mt-4 text-slate-300 max-w-lg mx-auto">
            Leve seu restaurante pro SaltFood — cardápio digital, pedidos, entrega e gestão dos seus motoboys, tudo em um só lugar, com a sua própria marca.
          </p>
          {(whatsappUrl || mailtoUrl) && (
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
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
          )}
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

        <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {VANTAGENS.map(({ icon: Icon, titulo, texto }) => (
            <div key={titulo} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
              <div className="h-9 w-9 rounded-xl bg-orange-100 flex items-center justify-center mb-3">
                <Icon className="h-4 w-4 text-orange-600" />
              </div>
              <h3 className="font-semibold text-slate-800 text-sm mb-1">{titulo}</h3>
              <p className="text-xs text-slate-500">{texto}</p>
            </div>
          ))}
        </div>
      </section>

      <PlatformFooter />
    </div>
  );
};

export default ParceiroPage;
