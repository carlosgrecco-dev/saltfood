import React, { useState } from 'react';
import {
  Bike, Boxes, ChefHat, CheckCircle2, Clock3, Heart, Landmark, MessageSquarePlus,
  ShieldCheck, Smartphone, UtensilsCrossed, Users, Wallet,
} from 'lucide-react';
import PublicHeader from '../components/PublicHeader';
import PlatformFooter from '../components/PlatformFooter';
import ContatoComercialDrawer from '../components/ContatoComercialDrawer';

type StatusRecurso = 'disponivel' | 'em-breve';

interface Recurso {
  nome: string;
  status: StatusRecurso;
}

interface AreaRecursos {
  icon: typeof UtensilsCrossed;
  titulo: string;
  itens: Recurso[];
}

const AREAS: AreaRecursos[] = [
  {
    icon: UtensilsCrossed,
    titulo: 'Vendas & Cardápio',
    itens: [
      { nome: 'Cardápio digital com categorias e opções', status: 'disponivel' },
      { nome: 'PDV — venda de balcão, mesa e retirada', status: 'disponivel' },
      { nome: 'Mesa aberta recebendo pedidos aos poucos', status: 'disponivel' },
      { nome: 'Cupons de desconto', status: 'disponivel' },
      { nome: 'Agendamento de pedido', status: 'disponivel' },
      { nome: 'Favoritos e "peça de novo"', status: 'disponivel' },
    ],
  },
  {
    icon: Wallet,
    titulo: 'Pagamento',
    itens: [
      { nome: 'Pix, dinheiro e cartão na entrega', status: 'disponivel' },
      { nome: 'Confirmação obrigatória de recebimento', status: 'disponivel' },
      { nome: 'Cálculo automático de troco', status: 'disponivel' },
      { nome: 'Dividir uma venda em mais de uma forma', status: 'disponivel' },
      { nome: 'Pagamento online real via gateway', status: 'em-breve' },
      { nome: 'Vale-alimentação, vale-refeição e carteiras digitais', status: 'em-breve' },
    ],
  },
  {
    icon: Landmark,
    titulo: 'Caixa',
    itens: [
      { nome: 'Abertura de caixa com fundo de troco', status: 'disponivel' },
      { nome: 'Sangria e suprimento', status: 'disponivel' },
      { nome: 'Fechamento com conferência de diferença', status: 'disponivel' },
      { nome: 'Histórico de caixa por operador', status: 'disponivel' },
    ],
  },
  {
    icon: Bike,
    titulo: 'Motoboys',
    itens: [
      { nome: 'Cadastro e atribuição de motoboy por pedido', status: 'disponivel' },
      { nome: 'Rastreamento por GPS em tempo real', status: 'disponivel' },
      { nome: 'Conferência de recebimento por motoboy', status: 'disponivel' },
      { nome: 'Pagamento das corridas entregues', status: 'disponivel' },
    ],
  },
  {
    icon: Heart,
    titulo: 'Fidelidade & Clientes',
    itens: [
      { nome: 'Cartão fidelidade com níveis (Bronze/Prata/Ouro)', status: 'disponivel' },
      { nome: 'Cashback e SaltFood Coins', status: 'disponivel' },
      { nome: 'Programa de indicação', status: 'disponivel' },
      { nome: 'Avaliações com fotos', status: 'disponivel' },
      { nome: 'Missões de fidelidade', status: 'disponivel' },
      { nome: 'Central de notificações e de suporte', status: 'disponivel' },
    ],
  },
  {
    icon: ChefHat,
    titulo: 'Produção & Cozinha',
    itens: [
      { nome: 'Tela dedicada de produção pra cozinha', status: 'em-breve' },
      { nome: 'Tempo de preparo e prioridade por pedido', status: 'em-breve' },
      { nome: 'Alerta de pedido atrasado', status: 'em-breve' },
    ],
  },
  {
    icon: Boxes,
    titulo: 'Estoque',
    itens: [
      { nome: 'Ficha técnica por produto', status: 'em-breve' },
      { nome: 'Baixa automática de ingredientes', status: 'em-breve' },
      { nome: 'Alerta de estoque baixo', status: 'em-breve' },
      { nome: 'Controle de perdas', status: 'em-breve' },
    ],
  },
  {
    icon: Users,
    titulo: 'Usuários & Permissões',
    itens: [
      { nome: 'Operador de PDV (identifica quem abriu o caixa)', status: 'disponivel' },
      { nome: 'PIN de autorização por função', status: 'em-breve' },
      { nome: 'Limite de desconto por operador', status: 'em-breve' },
      { nome: 'Papéis de acesso granulares', status: 'em-breve' },
    ],
  },
  {
    icon: Smartphone,
    titulo: 'App do lojista',
    itens: [
      { nome: 'App Android com pedidos em tempo real', status: 'disponivel' },
      { nome: 'PDV completo dentro do app', status: 'disponivel' },
      { nome: 'Impressão de comanda térmica via Bluetooth', status: 'disponivel' },
      { nome: 'Gestão de motoboys pelo celular', status: 'disponivel' },
    ],
  },
];

const RecursosPage: React.FC = () => {
  const [drawerAberto, setDrawerAberto] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      <PublicHeader onFalarComAGente={() => setDrawerAberto(true)} />

      <section className="max-w-4xl mx-auto px-6 pt-8 pb-14 text-center">
        <p className="text-orange-600 font-semibold text-sm">Recursos</p>
        <h1 className="mt-2 text-3xl sm:text-4xl font-bold text-slate-900 leading-tight">
          Tudo que o SaltFood oferece
        </h1>
        <p className="mt-4 text-slate-500 max-w-xl mx-auto">
          Uma plataforma de verdade pra rodar seu delivery — do cardápio ao caixa. Alguns itens
          marcados como "em breve" ainda estão no nosso roadmap; tudo o resto já está no ar hoje.
        </p>
        <div className="mt-6 flex items-center justify-center gap-4 text-xs">
          <span className="inline-flex items-center gap-1.5 text-emerald-700">
            <CheckCircle2 className="h-3.5 w-3.5" /> Disponível hoje
          </span>
          <span className="inline-flex items-center gap-1.5 text-slate-400">
            <Clock3 className="h-3.5 w-3.5" /> Em breve
          </span>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-16 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {AREAS.map(({ icon: Icon, titulo, itens }) => (
          <div key={titulo} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="h-9 w-9 rounded-xl bg-orange-100 flex items-center justify-center shrink-0">
                <Icon className="h-4 w-4 text-orange-600" />
              </div>
              <h2 className="font-bold text-slate-800 text-sm">{titulo}</h2>
            </div>
            <ul className="space-y-2">
              {itens.map((item) => (
                <li key={item.nome} className="flex items-start gap-2 text-sm">
                  {item.status === 'disponivel' ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  ) : (
                    <Clock3 className="h-4 w-4 text-slate-300 shrink-0 mt-0.5" />
                  )}
                  <span className={item.status === 'disponivel' ? 'text-slate-700' : 'text-slate-400'}>
                    {item.nome}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <section className="max-w-5xl mx-auto px-6 pb-20">
        <div className="bg-slate-900 rounded-3xl px-6 py-10 sm:px-12 sm:py-12 text-center">
          <div className="h-11 w-11 rounded-2xl bg-orange-600/20 flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="h-5 w-5 text-orange-400" />
          </div>
          <h2 className="text-white font-bold text-xl sm:text-2xl">Ficou com alguma dúvida sobre algum recurso?</h2>
          <p className="text-slate-300 text-sm mt-2 max-w-md mx-auto">
            Conta pra gente o que sua loja precisa e te mostramos como o SaltFood se encaixa.
          </p>
          <button
            onClick={() => setDrawerAberto(true)}
            className="mt-6 inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors"
          >
            <MessageSquarePlus className="h-4 w-4" /> Falar com a gente
          </button>
        </div>
      </section>

      <PlatformFooter />

      <ContatoComercialDrawer isOpen={drawerAberto} onClose={() => setDrawerAberto(false)} origem="recursos" />
    </div>
  );
};

export default RecursosPage;
