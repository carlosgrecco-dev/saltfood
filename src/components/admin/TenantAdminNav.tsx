import React, { useEffect, useState } from 'react';
import {
  Package, Bike, DollarSign, ShoppingBag, BarChart3, CreditCard, Palette, Ticket, Tag,
  Clock, MapPin, Gift, LayoutDashboard, Sparkles, Target, LifeBuoy, Smartphone, Receipt,
  ChevronDown, Layers, PlusCircle, ListChecks, Table,
} from 'lucide-react';

export type Tab =
  | 'dashboard' | 'crm'
  | 'pedidos' | 'produtos' | 'categorias' | 'combos' | 'adicionais' | 'opcoes-grupos' | 'tabela-precos' | 'cupons'
  | 'motoboys' | 'zonas-entrega'
  | 'fidelidade' | 'missoes'
  | 'fechamento'
  | 'operacional' | 'pdv'
  | 'aparencia' | 'gateways' | 'funcionalidades' | 'suporte' | 'app-lojista';

type NavEntry = { id: Tab; label: string; icon: typeof Package };
type NavParent = { label: string; icon: typeof Package; children: NavEntry[] };
type NavItem = NavEntry | NavParent;
type NavGroup = { id: string; label: string; items: NavItem[] };

const isParent = (item: NavItem): item is NavParent => 'children' in item;

/**
 * Grupos sempre abertos (sem colapsar), rótulo do grupo só como texto — mesmo padrão visual do
 * mockup de referência do admin. "Produtos" é um submenu com dropdown (várias telas do catálogo
 * moram nele); os demais grupos ainda vão crescer conforme os módulos novos (Contas a Pagar/
 * Receber, Metas, Estoque, Usuários etc.) forem sendo construídos em rodadas seguintes.
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
      {
        label: 'Produtos',
        icon: ShoppingBag,
        children: [
          { id: 'produtos', label: 'Todos os produtos', icon: ShoppingBag },
          { id: 'categorias', label: 'Categorias', icon: Tag },
          { id: 'combos', label: 'Combos', icon: Layers },
          { id: 'adicionais', label: 'Adicionais', icon: PlusCircle },
          { id: 'opcoes-grupos', label: 'Opções e Grupos', icon: ListChecks },
          { id: 'tabela-precos', label: 'Tabela de Preços', icon: Table },
        ],
      },
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

export const TODOS_OS_ITENS: NavEntry[] = GRUPOS.flatMap((g) => g.items.flatMap((item) => (isParent(item) ? item.children : [item])));

interface TenantAdminNavProps {
  tab: Tab;
  onSelectTab: (tab: Tab) => void;
  navOpen: boolean;
  isMobile: boolean;
  onCloseMobile: () => void;
}

const TenantAdminNav: React.FC<TenantAdminNavProps> = ({ tab, onSelectTab, navOpen, isMobile, onCloseMobile }) => {
  const parentAtivo = GRUPOS.flatMap((g) => g.items)
    .filter(isParent)
    .find((p) => p.children.some((c) => c.id === tab))?.label;
  const [abertos, setAbertos] = useState<Set<string>>(() => new Set(parentAtivo ? [parentAtivo] : []));

  useEffect(() => {
    if (!parentAtivo) return;
    setAbertos((prev) => (prev.has(parentAtivo) ? prev : new Set(prev).add(parentAtivo)));
  }, [parentAtivo]);

  const selecionar = (id: Tab) => {
    onSelectTab(id);
    if (isMobile) onCloseMobile();
  };

  const toggleParent = (label: string) => {
    setAbertos((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
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
          {grupo.items.map((item) => {
            if (isParent(item)) {
              const aberto = abertos.has(item.label);
              const ativo = item.children.some((c) => c.id === tab);
              return (
                <div key={item.label}>
                  <button
                    onClick={() => toggleParent(item.label)}
                    aria-expanded={aberto}
                    className={`flex w-full items-center gap-3 py-2.5 px-5 text-sm font-medium transition-colors ${
                      ativo ? 'text-orange-600' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    <span className="flex-1 text-left truncate">{item.label}</span>
                    <ChevronDown className={`h-3.5 w-3.5 shrink-0 transition-transform ${aberto ? 'rotate-180' : ''}`} />
                  </button>
                  {aberto && (
                    <div>
                      {item.children.map(({ id, label, icon: Icon }) => (
                        <button
                          key={id}
                          onClick={() => selecionar(id)}
                          className={`flex w-full items-center gap-3 py-2.5 pl-11 pr-5 text-sm font-medium transition-colors ${
                            tab === id
                              ? 'border-r-[3px] border-orange-500 bg-orange-50 text-orange-600'
                              : 'border-r-[3px] border-transparent text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          <Icon className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            }
            return (
              <button
                key={item.id}
                onClick={() => selecionar(item.id)}
                className={`flex w-full items-center gap-3 py-2.5 px-5 text-sm font-medium transition-colors ${
                  tab === item.id
                    ? 'border-r-[3px] border-orange-500 bg-orange-50 text-orange-600'
                    : 'border-r-[3px] border-transparent text-gray-600 hover:bg-gray-50'
                }`}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </div>
      ))}
    </nav>
  );
};

export default TenantAdminNav;
