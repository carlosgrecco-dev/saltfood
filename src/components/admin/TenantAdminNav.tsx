import React, { useEffect, useState } from 'react';
import {
  Package, Bike, DollarSign, ShoppingBag, BarChart3, CreditCard, Palette, Ticket, Tag,
  Clock, MapPin, Gift, LayoutDashboard, Sparkles, Target, LifeBuoy, Smartphone, Receipt,
  ChevronDown, Layers, PlusCircle, ListChecks, Table, ChefHat, Truck, CheckCircle2, XCircle,
  Boxes, Star, UsersRound, Gauge, Wallet, Navigation, Radar, Printer, Settings, Webhook, ScrollText, UserCog,
} from 'lucide-react';
import { PapelUsuarioAdmin } from '../../types/UsuarioAdmin';

export type Tab =
  | 'dashboard' | 'crm'
  | 'pedidos' | 'pedidos-em-andamento' | 'pedidos-prontos' | 'pedidos-entregues' | 'pedidos-cancelados'
  | 'produtos' | 'categorias' | 'combos' | 'adicionais' | 'opcoes-grupos' | 'tabela-precos' | 'cupons' | 'formas-pagamento'
  | 'motoboys' | 'zonas-entrega' | 'entregas' | 'logistica'
  | 'fidelidade' | 'missoes' | 'avaliacoes' | 'grupos-clientes'
  | 'fechamento'
  | 'operacional' | 'pdv' | 'estoque' | 'fornecedores' | 'indicadores' | 'impressoras'
  | 'aparencia' | 'gateways' | 'funcionalidades' | 'suporte' | 'app-lojista'
  | 'configuracoes' | 'webhook' | 'logs-atividade' | 'usuarios-admin';

/** Cada papel de usuário de equipe só enxerga estes grupos do menu — o login master (sem papel)
 * sempre vê tudo. "Sistema" nunca aparece pra usuário de equipe, de propósito: gestão de acesso
 * fica centralizada em quem sempre teve controle total da loja. */
const GRUPOS_POR_PAPEL: Record<PapelUsuarioAdmin, string[]> = {
  GERENTE: ['painel', 'vendas', 'delivery', 'clientes', 'financeiro', 'desempenho', 'operacional'],
  OPERADOR_CAIXA: ['painel', 'operacional', 'financeiro'],
  ATENDENTE: ['painel', 'vendas', 'delivery'],
};

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
      {
        label: 'Pedidos',
        icon: Package,
        children: [
          { id: 'pedidos', label: 'Todos os pedidos', icon: Package },
          { id: 'pedidos-em-andamento', label: 'Em andamento', icon: ChefHat },
          { id: 'pedidos-prontos', label: 'Prontos', icon: Truck },
          { id: 'pedidos-entregues', label: 'Entregues', icon: CheckCircle2 },
          { id: 'pedidos-cancelados', label: 'Cancelados', icon: XCircle },
        ],
      },
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
      { id: 'formas-pagamento', label: 'Formas de Pagamento', icon: Wallet },
    ],
  },
  {
    id: 'delivery',
    label: 'Delivery',
    items: [
      { id: 'motoboys', label: 'Motoboys', icon: Bike },
      { id: 'zonas-entrega', label: 'Entrega & Frete', icon: MapPin },
      { id: 'entregas', label: 'Entregas', icon: Navigation },
      { id: 'logistica', label: 'Logística', icon: Radar },
    ],
  },
  {
    id: 'clientes',
    label: 'Clientes',
    items: [
      { id: 'fidelidade', label: 'Fidelidade', icon: Gift },
      { id: 'missoes', label: 'Missões', icon: Target },
      { id: 'avaliacoes', label: 'Avaliações', icon: Star },
      { id: 'grupos-clientes', label: 'Grupos', icon: UsersRound },
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
    items: [
      { id: 'crm', label: 'Relatórios', icon: BarChart3 },
      { id: 'indicadores', label: 'Indicadores', icon: Gauge },
    ],
  },
  {
    id: 'operacional',
    label: 'Operacional',
    items: [
      { id: 'operacional', label: 'Horários', icon: Clock },
      { id: 'pdv', label: 'PDV', icon: Receipt },
      { id: 'estoque', label: 'Estoque', icon: Boxes },
      { id: 'fornecedores', label: 'Fornecedores', icon: Truck },
      { id: 'impressoras', label: 'Impressoras', icon: Printer },
    ],
  },
  {
    id: 'sistema',
    label: 'Sistema',
    items: [
      { id: 'configuracoes', label: 'Configurações', icon: Settings },
      { id: 'aparencia', label: 'Aparência', icon: Palette },
      { id: 'gateways', label: 'Integrações', icon: CreditCard },
      { id: 'webhook', label: 'Webhook', icon: Webhook },
      { id: 'funcionalidades', label: 'Funcionalidades', icon: Sparkles },
      { id: 'usuarios-admin', label: 'Usuários', icon: UserCog },
      { id: 'logs-atividade', label: 'Logs', icon: ScrollText },
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
  /** Login master (sem papel) vê tudo; usuário de equipe só vê os grupos liberados pro papel dele. */
  papel?: PapelUsuarioAdmin;
}

const TenantAdminNav: React.FC<TenantAdminNavProps> = ({ tab, onSelectTab, navOpen, isMobile, onCloseMobile, papel }) => {
  const gruposVisiveis = papel ? GRUPOS.filter((g) => GRUPOS_POR_PAPEL[papel].includes(g.id)) : GRUPOS;
  const itensVisiveis = gruposVisiveis.flatMap((g) => g.items.flatMap((item) => (isParent(item) ? item.children : [item])));

  const parentAtivo = gruposVisiveis.flatMap((g) => g.items)
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
        {itensVisiveis.map(({ id, label, icon: Icon }) => (
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
      {gruposVisiveis.map((grupo, i) => (
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
