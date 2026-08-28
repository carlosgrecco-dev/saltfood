import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight, Mail, MessageCircle, Search, ShieldCheck, Store, Zap, Wallet,
  UtensilsCrossed, Sandwich, Pizza, IceCream2, CupSoda, MapPin, Sparkles,
} from 'lucide-react';
import { fetchConfiguracaoPublica } from '../lib/configuracoesPlataforma';
import { slugify } from '../lib/masks';
import InstallAppButton from '../components/InstallAppButton';

const CATEGORIAS = [
  { icon: UtensilsCrossed, label: 'Restaurantes' },
  { icon: Sandwich, label: 'Lanchonetes' },
  { icon: Pizza, label: 'Pizzarias' },
  { icon: IceCream2, label: 'Doces & Sobremesas' },
  { icon: CupSoda, label: 'Bebidas' },
];

const FEATURES = [
  { icon: Store, titulo: 'Loja própria', texto: 'Cada restaurante parceiro tem seu cardápio, marca e link exclusivos.' },
  { icon: Zap, titulo: 'Pedido rápido', texto: 'Sem cadastro obrigatório — monta o carrinho e finaliza em poucos toques.' },
  { icon: MapPin, titulo: 'Acompanhamento', texto: 'Veja o status do seu pedido do preparo até a entrega, em tempo real.' },
  { icon: Wallet, titulo: 'Pagamento flexível', texto: 'Pix, dinheiro ou cartão na entrega — você escolhe o que for mais fácil.' },
];

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

  const buscaForm = (
    <form onSubmit={handleBuscar} className="flex items-stretch gap-2 max-w-md">
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
  );

  return (
    <div className="min-h-screen bg-white">
      <header className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between gap-4">
        <div className="h-10 w-10 shrink-0 rounded-xl bg-black p-1">
          <img src="/logo.png" alt="SaltFood" className="h-full w-full rounded-md" />
        </div>
        <nav className="hidden sm:flex items-center gap-6 text-sm font-medium text-slate-600">
          <a href="#como-funciona" className="hover:text-slate-900 transition-colors">Como funciona</a>
          <a href="#parceiro" className="hover:text-slate-900 transition-colors">Seja um parceiro</a>
        </nav>
        <InstallAppButton />
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-8 pb-16 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 leading-tight">
            Peça online na sua loja favorita,
            <br className="hidden sm:block" /> com entrega rápida.
          </h1>
          <p className="mt-4 text-slate-500 max-w-md">
            Cada loja parceira do SaltFood tem seu próprio endereço. Digite o nome do restaurante pra ir direto pro cardápio dele.
          </p>

          <div className="mt-8">{buscaForm}</div>
          <p className="mt-2 text-xs text-slate-400">Não sabe o endereço certo? Confira o link direto com o restaurante.</p>
        </div>

        <div className="relative mx-auto sm:mx-0">
          <div className="absolute inset-0 bg-orange-100 rounded-[3rem] scale-90 -rotate-6" />
          <img
            src="/logo.png"
            alt=""
            className="relative w-64 sm:w-80 mx-auto drop-shadow-xl"
          />
        </div>
      </section>

      {/* Categorias */}
      <section id="como-funciona" className="max-w-6xl mx-auto px-6 py-16 border-t border-slate-100">
        <p className="text-center text-orange-600 font-semibold text-sm">#vemcomfome</p>
        <h2 className="mt-2 text-center text-2xl sm:text-3xl font-bold text-slate-900">
          Sempre tem o que você quer no <span className="text-orange-600">SaltFood</span>
        </h2>

        <div className="mt-10 flex flex-wrap justify-center gap-x-10 gap-y-8">
          {CATEGORIAS.map(({ icon: Icon, label }) => (
            <div key={label} className="flex flex-col items-center gap-2.5 w-24">
              <div className="h-16 w-16 rounded-full bg-orange-50 flex items-center justify-center">
                <Icon className="h-7 w-7 text-orange-600" />
              </div>
              <span className="text-xs font-medium text-slate-600 text-center">{label}</span>
            </div>
          ))}
        </div>

        <h3 className="mt-16 text-center text-xl sm:text-2xl font-bold text-slate-900">
          Delivery completo, sem enrolação
        </h3>
        <p className="mt-2 text-center text-sm text-slate-500">A gente cuida de todos os detalhes pra te servir bem.</p>

        <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map(({ icon: Icon, titulo, texto }) => (
            <div key={titulo} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
              <div className="h-9 w-9 rounded-xl bg-orange-100 flex items-center justify-center mb-3">
                <Icon className="h-4 w-4 text-orange-600" />
              </div>
              <h4 className="font-semibold text-slate-800 text-sm mb-1">{titulo}</h4>
              <p className="text-xs text-slate-500">{texto}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Banner escuro */}
      <section className="bg-slate-900">
        <div className="max-w-6xl mx-auto px-6 py-16 grid md:grid-cols-2 gap-12 items-center">
          <div className="order-2 md:order-1 relative mx-auto sm:mx-0">
            <div className="absolute inset-0 bg-orange-600/20 rounded-[3rem] scale-90 rotate-6" />
            <img src="/logo.png" alt="" className="relative w-56 sm:w-72 mx-auto drop-shadow-xl" />
          </div>
          <div className="order-1 md:order-2">
            <p className="text-orange-400 font-semibold text-sm flex items-center gap-1.5">
              <Sparkles className="h-4 w-4" /> Não é só entrega
            </p>
            <h2 className="mt-2 text-2xl sm:text-3xl font-bold text-white leading-snug">
              É experiência completa, do pedido à porta.
            </h2>
            <ul className="mt-6 space-y-3 text-slate-300 text-sm">
              <li className="flex items-start gap-2.5">
                <ShieldCheck className="h-4 w-4 text-orange-400 shrink-0 mt-0.5" /> Cardápio digital atualizado pela própria loja, sem intermediário.
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin className="h-4 w-4 text-orange-400 shrink-0 mt-0.5" /> Rastreamento do motoboy em tempo real, do preparo até a entrega.
              </li>
              <li className="flex items-start gap-2.5">
                <Wallet className="h-4 w-4 text-orange-400 shrink-0 mt-0.5" /> Cupons, cashback e fidelidade em quem você já pede sempre.
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Seja parceiro */}
      <section id="parceiro" className="max-w-5xl mx-auto px-6 py-20">
        <div className="bg-slate-900 rounded-3xl px-6 py-10 sm:px-12 sm:py-12 text-center">
          <div className="h-11 w-11 rounded-2xl bg-orange-600/20 flex items-center justify-center mx-auto mb-4">
            <Store className="h-5 w-5 text-orange-400" />
          </div>
          <h2 className="text-white font-bold text-xl sm:text-2xl">Tem um restaurante e quer vender por aqui?</h2>
          <p className="text-slate-300 text-sm mt-2 max-w-md mx-auto">
            Leve o SaltFood pro seu negócio — cardápio digital, pedidos e entrega, tudo em um só lugar, com a sua própria marca.
          </p>
          {(whatsappUrl || mailtoUrl) && (
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
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

      <footer className="max-w-6xl mx-auto px-6 py-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 shrink-0 rounded-lg bg-black p-1">
            <img src="/logo.png" alt="SaltFood" className="h-full w-full rounded-sm" />
          </div>
          <span className="text-xs text-slate-400">SaltFood — uma plataforma Sigma Soluções Digitais</span>
        </div>
        <span className="text-xs text-slate-400">© {new Date().getFullYear()} Todos os direitos reservados.</span>
      </footer>
    </div>
  );
};

export default LandingPage;
