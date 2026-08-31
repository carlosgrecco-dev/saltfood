import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight, Layers, Mail, MessageCircle, MessageSquarePlus, Search } from 'lucide-react';
import { fetchConfiguracaoPublica } from '../lib/configuracoesPlataforma';
import { slugify } from '../lib/masks';
import PublicHeader from '../components/PublicHeader';
import PlatformFooter from '../components/PlatformFooter';
import ContatoComercialDrawer from '../components/ContatoComercialDrawer';
import BlocoHero from '../components/site-cms/BlocoHero';
import { useSiteBlocos } from '../hooks/useSiteBlocos';

const ParceiroPage: React.FC = () => {
  const navigate = useNavigate();
  const [slugBusca, setSlugBusca] = useState('');
  const [contato, setContato] = useState<{ emailSuporte: string | null; telefoneSuporte: string | null } | null>(null);
  const [drawerAberto, setDrawerAberto] = useState(false);
  const blocos = useSiteBlocos('PARCEIRO');

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

  const abrirContato = () => setDrawerAberto(true);

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
            <Link
              to="/planos"
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors border border-white/20"
            >
              <Layers className="h-4 w-4" /> Ver planos e preços
            </Link>
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

      <PlatformFooter />

      <ContatoComercialDrawer
        isOpen={drawerAberto}
        onClose={() => setDrawerAberto(false)}
        origem="parceiro"
      />
    </div>
  );
};

export default ParceiroPage;
