import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Mail, MessageCircle, Search, ShieldCheck, Store, Zap } from 'lucide-react';
import { fetchConfiguracaoPublica } from '../lib/configuracoesPlataforma';
import { slugify } from '../lib/masks';
import InstallAppButton from '../components/InstallAppButton';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [busca, setBusca] = useState('');
  const [contato, setContato] = useState<{ emailSuporte: string | null; telefoneSuporte: string | null } | null>(null);

  useEffect(() => {
    fetchConfiguracaoPublica()
      .then(setContato)
      .catch(() => setContato(null));
  }, []);

  const handleBuscar = (e: React.FormEvent) => {
    e.preventDefault();
    const slug = slugify(busca.trim());
    if (slug) navigate(`/${slug}`);
  };

  const whatsappUrl = contato?.telefoneSuporte
    ? `https://wa.me/${contato.telefoneSuporte.replace(/\D/g, '')}?text=${encodeURIComponent('Olá! Quero saber mais sobre o SaltFood para o meu negócio.')}`
    : null;
  const mailtoUrl = contato?.emailSuporte ? `mailto:${contato.emailSuporte}` : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 via-white to-white">
      <header className="max-w-5xl mx-auto px-6 pt-10 pb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="h-10 w-10 shrink-0 rounded-xl bg-black p-1">
            <img src="/logo.png" alt="SaltFood" className="h-full w-full rounded-md" />
          </div>
        </div>
        <InstallAppButton />
      </header>

      <main className="max-w-3xl mx-auto px-6 pt-12 pb-20 text-center">
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 leading-tight">
          Peça online na sua loja favorita,
          <br className="hidden sm:block" /> com entrega rápida.
        </h1>
        <p className="mt-4 text-slate-500 max-w-lg mx-auto">
          Cada loja parceira do SaltFood tem seu próprio endereço. Digite o nome do restaurante pra ir direto pro cardápio dele.
        </p>

        <form onSubmit={handleBuscar} className="mt-8 flex items-stretch gap-2 max-w-md mx-auto">
          <div className="flex-1 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 shadow-sm focus-within:ring-2 focus-within:ring-orange-500 focus-within:border-transparent">
            <Search className="h-4 w-4 text-slate-400 shrink-0" />
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Nome da loja (ex: acaraje-o-abencoado)"
              className="flex-1 min-w-0 py-3 text-sm outline-none bg-transparent"
            />
          </div>
          <button
            type="submit"
            disabled={!busca.trim()}
            className="shrink-0 flex items-center gap-1.5 bg-orange-600 hover:bg-orange-700 disabled:opacity-40 disabled:hover:bg-orange-600 text-white font-semibold text-sm px-5 rounded-xl transition-colors"
          >
            Ir <ArrowRight className="h-4 w-4" />
          </button>
        </form>
        <p className="mt-2 text-xs text-slate-400">Não sabe o endereço certo? Confira o link direto com o restaurante.</p>

        <div className="mt-16 grid sm:grid-cols-3 gap-4 text-left">
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
            <div className="h-9 w-9 rounded-xl bg-orange-100 flex items-center justify-center mb-3">
              <Store className="h-4.5 w-4.5 text-orange-600" />
            </div>
            <h3 className="font-semibold text-slate-800 text-sm mb-1">Loja própria</h3>
            <p className="text-xs text-slate-500">Cada restaurante parceiro tem seu cardápio, marca e link exclusivos.</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
            <div className="h-9 w-9 rounded-xl bg-orange-100 flex items-center justify-center mb-3">
              <Zap className="h-4.5 w-4.5 text-orange-600" />
            </div>
            <h3 className="font-semibold text-slate-800 text-sm mb-1">Pedido rápido</h3>
            <p className="text-xs text-slate-500">Sem cadastro obrigatório — monta o carrinho e finaliza em poucos toques.</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
            <div className="h-9 w-9 rounded-xl bg-orange-100 flex items-center justify-center mb-3">
              <ShieldCheck className="h-4.5 w-4.5 text-orange-600" />
            </div>
            <h3 className="font-semibold text-slate-800 text-sm mb-1">Acompanhamento</h3>
            <p className="text-xs text-slate-500">Veja o status do seu pedido do preparo até a entrega, em tempo real.</p>
          </div>
        </div>

        {(whatsappUrl || mailtoUrl) && (
          <div className="mt-16 bg-slate-900 rounded-3xl px-6 py-8 sm:px-10 sm:py-10 text-center">
            <h2 className="text-white font-bold text-lg">Tem um restaurante e quer vender por aqui?</h2>
            <p className="text-slate-300 text-sm mt-1.5 max-w-md mx-auto">
              Leve o SaltFood pro seu negócio — cardápio digital, pedidos e entrega, tudo em um só lugar.
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
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
        )}
      </main>

      <footer className="max-w-5xl mx-auto px-6 py-8 text-center text-xs text-slate-400">
        SaltFood — uma plataforma Sigma Soluções Digitais
      </footer>
    </div>
  );
};

export default LandingPage;
