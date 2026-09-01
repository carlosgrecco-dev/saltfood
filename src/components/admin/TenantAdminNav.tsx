import React from 'react';
import {
  Package, Bike, DollarSign, ShoppingBag, BarChart3, CreditCard, Palette, Ticket, Tag,
  Clock, MapPin, Gift, LayoutDashboard, Sparkles, Target, LifeBuoy, Smartphone, Receipt,
} from 'lucide-react';

export type Tab =
  | 'dashboard' | 'crm'
  | 'pedidos' | 'produtos' | 'categorias' | 'cupons'
  | 'motoboys' | 'zonas-entrega'
  | 'fidelidade' | 'missoes'
  | 'fechamento'
  | 'operacional' | 'pdv'
  | 'aparencia' | 'gateways' | 'funcionalidades' | 'suporte' | 'app-lojista';

type NavEntry = { id: Tab; label: string; icon: typeof Package };
type NavGroup = { id: string; label: string; items: NavEntry[] };

/**
 * Grupos sempre abertos (sem colapsar), rótulo do grupo só como texto — mesmo padrão visual do
 * mockup de referência do admin. Vários grupos ainda vão crescer conforme os módulos novos
 * (Contas a Pagar/Receber, Metas, Estoque, Usuários etc.) forem sendo construídos em rodadas
 * seguintes; por enquanto cada grupo só lista o que já existe de verdade.
 */
export const GRUPOS: NavGroup[] = [
  {
    id: 'painel',
    label: 'Painel',
    items: [{ id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }],
  },
  {
    id: 'vendas',
    label: 'Vendas',
    items: [
      { id: 'pedidos', label: 'Pedidos', icon: Package },
      { id: 'produtos', label: 'Produtos', icon: ShoppingBag },
      { id: 'categorias', label: 'Categorias', icon: Tag },
      { id: 'cupons', label: 'Cupons', icon: Ticket },
    ],
  },
  {
    id: 'delivery',
    label: 'Delivery',
    items: [
      { id: 'motoboys', label: 'Motoboys', icon: Bike },
      { id: 'zonas-entrega', label: 'Entrega & Frete', icon: MapPin },
    ],
  },
  {
    id: 'clientes',
    label: 'Clientes',
    items: [
      { id: 'fidelidade', label: 'Fidelidade', icon: Gift },
      { id: 'missoes', label: 'Missões', icon: Target },
    ],
  },
  {
    id: 'financeiro',
    label: 'Financeiro',
    items: [{ id: 'fechamento', label: 'Resumo Financeiro', icon: DollarSign }],
  },
  {
    id: 'desempenho',
    label: 'Desempenho',
    items: [{ id: 'crm', label: 'Relatórios', icon: BarChart3 }],
  },
  {
    id: 'operacional',
    label: 'Operacional',
    items: [
      { id: 'operacional', label: 'Horários', icon: Clock },
      { id: 'pdv', label: 'PDV', icon: Receipt },
    ],
  },
  {
    id: 'sistema',
    label: 'Sistema',
    items: [
      { id: 'aparencia', label: 'Aparência', icon: Palette },
      { id: 'gateways', label: 'Integrações', icon: CreditCard },
      { id: 'funcionalidades', label: 'Funcionalidades', icon: Sparkles },
      { id: 'suporte', label: 'Suporte', icon: LifeBuoy },
      { id: 'app-lojista', label: 'App do Lojista', icon: Smartphone },
    ],
  },
];

export const TODOS_OS_ITENS: NavEntry[] = GRUPOS.flatMap((g) => g.items);

interface TenantAdminNavProps {
  tab: Tab;
  onSelectTab: (tab: Tab) => void;
  navOpen: boolean;
  isMobile: boolean;
  onCloseMobile: () => void;
}

const TenantAdminNav: React.FC<TenantAdminNavProps> = ({ tab, onSelectTab, navOpen, isMobile, onCloseMobile }) => {
  const selecionar = (id: Tab) => {
    onSelectTab(id);
    if (isMobile) onCloseMobile();
  };

  if (!navOpen) {
    return (
      <nav className="flex-1 overflow-y-auto py-2">
        {TODOS_OS_ITENS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => selecionar(id)}
            title={label}
            className={`flex w-full items-center justify-center py-3 text-sm font-medium transition-colors ${
              tab === id
                ? 'border-r-4 border-orange-500 bg-orange-50 text-orange-600'
                : 'border-r-4 border-transparent text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Icon className="h-4 w-4 shrink-0" />
          </button>
        ))}
      </nav>
    );
  }

  return (
    <nav className="flex-1 overflow-y-auto py-3">
      {GRUPOS.map((grupo, i) => (
        <div key={grupo.id} className={i > 0 ? 'mt-4' : ''}>
          <p className="px-5 mb-1 text-[11px] font-bold uppercase tracking-wide text-gray-400">{grupo.label}</p>
          {grupo.items.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => selecionar(id)}
              className={`flex w-full items-center gap-3 py-2.5 px-5 text-sm font-medium transition-colors ${
                tab === id
                  ? 'border-r-[3px] border-orange-500 bg-orange-50 text-orange-600'
                  : 'border-r-[3px] border-transparent text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{label}</span>
            </button>
          ))}
        </div>
      ))}
    </nav>
  );
};

export default TenantAdminNav;
