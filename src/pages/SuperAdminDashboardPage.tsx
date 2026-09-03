import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, LogOut, Wallet, ShoppingBag, TrendingUp, Percent, Building2, Users, Bike, Loader2,
  Sparkles, Smartphone, Globe2, ListChecks, HeartPulse, Activity, PieChart, AlertTriangle, Clock3,
  Building, UserPlus, MessageSquareWarning, ShieldAlert, Layers, CreditCard, Headset, BarChart3,
  Settings, ScrollText, Coins, Inbox,
} from 'lucide-react';
import SuperAdminNav from '../components/superadmin/SuperAdminNav';
import NotificacoesBell from '../components/superadmin/NotificacoesBell';
import { getSuperAdminSession, signOutSuperAdmin } from '../lib/superAdminAuth';
import { fetchSuperAdminDashboard } from '../lib/superAdminDashboard';
import { SuperAdminDashboard } from '../types/SuperAdminDashboard';
import { useSuperAdminManifest } from '../hooks/useSuperAdminManifest';
import StackedBar from '../components/StackedBar';
import LineChart from '../components/LineChart';
import DonutChart from '../components/DonutChart';
import { FORMA_PAGAMENTO_LABELS, FormaPagamento } from '../types/Pedido';

type Periodo = 'hoje' | '7dias' | '15dias' | '30dias' | 'este-mes' | 'mes-passado' | 'personalizado';

const PALETA_SEGMENTOS = ['bg-orange-500', 'bg-gray-700', 'bg-amber-400', 'bg-emerald-500', 'bg-sky-500', 'bg-rose-400', 'bg-violet-400', 'bg-gray-400'];
const FORMA_COR: Record<string, { bg: string; stroke: string }> = {
  PIX: { bg: 'bg-emerald-500', stroke: 'stroke-emerald-500' },
  DINHEIRO: { bg: 'bg-amber-500', stroke: 'stroke-amber-500' },
  CARTAO: { bg: 'bg-blue-500', stroke: 'stroke-blue-500' },
  MULTIPLO: { bg: 'bg-violet-500', stroke: 'stroke-violet-500' },
};

const toISO = (d: Date) => d.toISOString().slice(0, 10);
const formatDataCurta = (iso: string) => {
  const [, mes, dia] = iso.split('-');
  return `${dia}/${mes}`;
};
const tempoRelativo = (iso: string) => {
  const min = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (min < 1) return 'agora mesmo';
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h}h`;
  return `há ${Math.floor(h / 24)}d`;
};

const ATIVIDADE_ICON: Record<string, React.ElementType> = {
  NOVO_TENANT: Building,
  NOVO_PEDIDO: ShoppingBag,
  NOVO_CHAMADO: MessageSquareWarning,
  ALTERACAO: ShieldAlert,
};

const ATALHOS = [
  { path: '/super-admin/empresas', label: 'Tenants', icon: Building2 },
  { path: '/super-admin/planos', label: 'Planos', icon: Layers },
  { path: '/super-admin/financeiro', label: 'Financeiro', icon: Wallet },
  { path: '/super-admin/saltfood-coins', label: 'Coins', icon: Coins },
  { path: '/super-admin/leads', label: 'Leads', icon: Inbox },
  { path: '/super-admin/chamados', label: 'Suporte', icon: Headset },
  { path: '/super-admin/logs', label: 'Logs', icon: ScrollText },
  { path: '/super-admin/configuracoes', label: 'Configurações', icon: Settings },
];

const SuperAdminDashboardPage: React.FC = () => {
  useSuperAdminManifest();
  const navigate = useNavigate();
  const [authorized] = useState(() => !!getSuperAdminSession());
  const [periodo, setPeriodo] = useState<Periodo>('30dias');
  const [customDe, setCustomDe] = useState(toISO(new Date()));
  const [customAte, setCustomAte] = useState(toISO(new Date()));
  const [data, setData] = useState<SuperAdminDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [navOpen, setNavOpen] = useState(true);

  useEffect(() => {
    if (!authorized) navigate('/super-admin', { replace: true });
  }, [authorized, navigate]);

  useEffect(() => {
    const handler = (e: Event) => {
      if ((e as CustomEvent).detail?.kind !== 'superadmin') return;
      signOutSuperAdmin();
      navigate('/super-admin', { replace: true });
    };
    window.addEventListener('kifood:session-expired', handler);
    return () => window.removeEventListener('kifood:session-expired', handler);
  }, [navigate]);

  const getRange = useCallback((): { de?: string; ate?: string } => {
    const hoje = new Date();
    switch (periodo) {
      case 'hoje':
        return { de: toISO(hoje), ate: toISO(hoje) };
      case '7dias': {
        const inicio = new Date(hoje);
        inicio.setDate(inicio.getDate() - 6);
        return { de: toISO(inicio), ate: toISO(hoje) };
      }
      case '15dias': {
        const inicio = new Date(hoje);
        inicio.setDate(inicio.getDate() - 14);
        return { de: toISO(inicio), ate: toISO(hoje) };
      }
      case '30dias': {
        const inicio = new Date(hoje);
        inicio.setDate(inicio.getDate() - 29);
        return { de: toISO(inicio), ate: toISO(hoje) };
      }
      case 'este-mes': {
        const inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
        return { de: toISO(inicio), ate: toISO(hoje) };
      }
      case 'mes-passado': {
        const inicio = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
        const fim = new Date(hoje.getFullYear(), hoje.getMonth(), 0);
        return { de: toISO(inicio), ate: toISO(fim) };
      }
      case 'personalizado':
        return { de: customDe, ate: customAte };
      default:
        return {};
    }
  }, [periodo, customDe, customAte]);

  useEffect(() => {
    if (!authorized) return;
    const { de, ate } = getRange();
    setLoading(true);
    fetchSuperAdminDashboard(de, ate)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [authorized, getRange]);

  const handleLogout = () => {
    signOutSuperAdmin();
    navigate('/super-admin', { replace: true });
  };

  if (!authorized) return null;

  const porFormaPagamentoSegmentos = (data?.porFormaPagamento ?? []).map((f) => ({
    label: FORMA_PAGAMENTO_LABELS[f.forma as FormaPagamento] || f.forma,
    value: f.quantidade,
    colorClass: FORMA_COR[f.forma]?.bg || 'bg-gray-400',
    strokeClass: FORMA_COR[f.forma]?.stroke || 'stroke-gray-400',
  }));

  const porCategoriaSegmentos = (data?.porCategoria ?? []).slice(0, 6).map((c, i) => ({
    label: c.nome,
    value: c.receita,
    colorClass: PALETA_SEGMENTOS[i % PALETA_SEGMENTOS.length],
    strokeClass: PALETA_SEGMENTOS[i % PALETA_SEGMENTOS.length].replace('bg-', 'stroke-'),
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      <div className={`transition-[margin] duration-300 ease-in-out ml-0 ${navOpen ? 'sm:ml-72' : 'sm:ml-16'}`}>
        <div className="border-b border-gray-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 shrink-0 rounded-xl bg-black p-1.5">
                  <img src="/logo.png" alt="SaltFood" className="h-full w-full rounded-md" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-orange-500">Super Admin</p>
                  <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <LayoutDashboard className="h-5 w-5 text-orange-500" /> Visão Geral da Plataforma
                  </h1>
                  <p className="text-xs text-gray-400 mt-0.5">Acompanhe o desempenho geral de todos os seus tenants em tempo real.</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {data && (
                  <span className="hidden md:flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1.5">
                    <Activity className="h-3.5 w-3.5" /> Sistema operacional
                  </span>
                )}
                <NotificacoesBell />
                <button
                  onClick={handleLogout}
                  title="Sair"
                  className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-semibold text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                </button>
                <SuperAdminNav onOpenChange={setNavOpen} />
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-wrap items-center gap-2">
            {([
              { id: 'hoje', label: 'Hoje' },
              { id: '7dias', label: '7 dias' },
              { id: '15dias', label: '15 dias' },
              { id: '30dias', label: '30 dias' },
              { id: 'este-mes', label: 'Este mês' },
              { id: 'mes-passado', label: 'Mês passado' },
              { id: 'personalizado', label: 'Personalizado' },
            ] as { id: Periodo; label: string }[]).map((p) => (
              <button
                key={p.id}
                onClick={() => setPeriodo(p.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  periodo === p.id ? 'bg-orange-500 text-white shadow' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'
                }`}
              >
                {p.label}
              </button>
            ))}
            {periodo === 'personalizado' && (
              <div className="flex items-center gap-2 ml-1">
                <input type="date" value={customDe} onChange={(e) => setCustomDe(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                <span className="text-gray-400 text-sm">até</span>
                <input type="date" value={customAte} onChange={(e) => setCustomAte(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm" />
              </div>
            )}
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white py-16">
              <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
            </div>
          ) : !data ? (
            <p className="text-center text-gray-400 py-16">Não foi possível carregar os dados.</p>
          ) : (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-4">
                <div className="bg-gradient-to-r from-orange-500 to-orange-500 text-white p-5 rounded-2xl lg:col-span-1">
                  <p className="text-orange-100 text-xs mb-1 flex items-center gap-1"><Wallet className="h-3.5 w-3.5" /> Faturamento bruto</p>
                  <p className="text-xl font-bold">R$ {data.gmv.toFixed(2)}</p>
                </div>
                <div className="bg-white border border-gray-200 p-5 rounded-2xl">
                  <p className="text-gray-500 text-xs mb-1 flex items-center gap-1"><ShoppingBag className="h-3.5 w-3.5" /> Pedidos no período</p>
                  <p className="text-xl font-bold text-gray-800">{data.totalPedidos}</p>
                </div>
                <div className="bg-white border border-gray-200 p-5 rounded-2xl">
                  <p className="text-gray-500 text-xs mb-1 flex items-center gap-1"><TrendingUp className="h-3.5 w-3.5" /> Ticket médio</p>
                  <p className="text-xl font-bold text-gray-800">R$ {data.ticketMedio.toFixed(2)}</p>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-2xl">
                  <p className="text-emerald-700 text-xs mb-1 flex items-center gap-1"><Percent className="h-3.5 w-3.5" /> Comissão recebida</p>
                  <p className="text-xl font-bold text-emerald-800">R$ {data.comissaoTotal.toFixed(2)}</p>
                </div>
                <div className="bg-white border border-gray-200 p-5 rounded-2xl">
                  <p className="text-gray-500 text-xs mb-1 flex items-center gap-1"><Building2 className="h-3.5 w-3.5" /> Lojas ativas</p>
                  <p className="text-xl font-bold text-gray-800">{data.empresasAtivas}<span className="text-sm text-gray-400 font-normal"> / {data.totalEmpresas}</span></p>
                </div>
                <div className="bg-white border border-gray-200 p-5 rounded-2xl">
                  <p className="text-gray-500 text-xs mb-1 flex items-center gap-1"><Users className="h-3.5 w-3.5" /> Clientes cadastrados</p>
                  <p className="text-xl font-bold text-gray-800">{data.totalClientes}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white border border-gray-200 p-4 rounded-2xl">
                  <p className="text-gray-500 text-xs mb-1 flex items-center gap-1"><Building2 className="h-3.5 w-3.5" /> Lojas com venda</p>
                  <p className="text-lg font-bold text-gray-800">{data.lojasComVendaNoPeriodo}</p>
                </div>
                <div className="bg-white border border-gray-200 p-4 rounded-2xl">
                  <p className="text-gray-500 text-xs mb-1 flex items-center gap-1"><Sparkles className="h-3.5 w-3.5" /> Novos tenants</p>
                  <p className="text-lg font-bold text-gray-800">{data.novosTenantsNoPeriodo ?? 0}</p>
                </div>
                <div className="bg-white border border-gray-200 p-4 rounded-2xl">
                  <p className="text-gray-500 text-xs mb-1 flex items-center gap-1"><Bike className="h-3.5 w-3.5" /> Motoboys ativos</p>
                  <p className="text-lg font-bold text-gray-800">{data.totalMotoboysAtivos}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
                <div className="bg-white border border-gray-200 p-5 rounded-2xl lg:col-span-1">
                  <p className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-1.5"><TrendingUp className="h-4 w-4 text-orange-500" /> Faturamento ao longo do tempo</p>
                  <LineChart
                    labels={(data.pedidosPorDia ?? []).map((d) => formatDataCurta(d.data))}
                    series={[{ label: 'Faturamento', colorClass: 'bg-orange-500', strokeClass: 'stroke-orange-500', data: (data.pedidosPorDia ?? []).map((d) => d.faturamento) }]}
                  />
                </div>
                <div className="bg-white border border-gray-200 p-5 rounded-2xl">
                  <p className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-1.5"><CreditCard className="h-4 w-4 text-orange-500" /> Pedidos por forma de pagamento</p>
                  <DonutChart segments={porFormaPagamentoSegmentos} centerLabel="pedidos" />
                </div>
                <div className="bg-white border border-gray-200 p-5 rounded-2xl">
                  <p className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-1.5"><PieChart className="h-4 w-4 text-orange-500" /> Pedidos por categoria</p>
                  <DonutChart segments={porCategoriaSegmentos} formatValue={(v) => `R$ ${v.toFixed(0)}`} centerLabel="receita" />
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
                <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden lg:col-span-2">
                  <p className="text-sm font-semibold text-gray-700 px-5 pt-5 pb-4 flex items-center gap-1.5"><HeartPulse className="h-4 w-4 text-orange-500" /> Desempenho dos tenants</p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-t border-gray-100 text-left text-xs uppercase tracking-wide text-gray-400">
                          <th className="px-5 py-2 font-medium">Tenant</th>
                          <th className="px-5 py-2 font-medium text-right">Pedidos</th>
                          <th className="px-5 py-2 font-medium text-right">Faturamento</th>
                          <th className="px-5 py-2 font-medium text-right">Ticket médio</th>
                          <th className="px-5 py-2 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(data.porTenant ?? []).slice(0, 8).map((t) => (
                          <tr key={t.id} className="border-t border-gray-100">
                            <td className="px-5 py-3 font-medium text-gray-800">{t.nome}</td>
                            <td className="px-5 py-3 text-right text-gray-700">{t.pedidosNoPeriodo}</td>
                            <td className="px-5 py-3 text-right text-gray-700">R$ {t.faturamentoNoPeriodo.toFixed(2)}</td>
                            <td className="px-5 py-3 text-right text-gray-700">R$ {t.ticketMedioNoPeriodo.toFixed(2)}</td>
                            <td className="px-5 py-3">
                              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${t.ativo ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                                {t.ativo ? 'Ativa' : 'Inativa'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <button onClick={() => navigate('/super-admin/empresas')} className="w-full text-center text-xs font-medium text-orange-600 hover:underline px-5 py-3 border-t border-gray-100">
                    Ver todos os tenants
                  </button>
                </div>

                <div className="bg-white border border-gray-200 rounded-2xl p-5">
                  <p className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-1.5"><Clock3 className="h-4 w-4 text-orange-500" /> Atividade recente</p>
                  <div className="space-y-3">
                    {(data.atividadeRecente ?? []).slice(0, 8).map((a, i) => {
                      const Icon = ATIVIDADE_ICON[a.tipo] || Activity;
                      return (
                        <div key={i} className="flex items-start gap-2.5 text-sm">
                          <Icon className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
                          <div className="min-w-0">
                            <p className="text-gray-700 truncate">{a.descricao}</p>
                            <p className="text-[11px] text-gray-400">{tempoRelativo(a.data)}</p>
                          </div>
                        </div>
                      );
                    })}
                    {(data.atividadeRecente ?? []).length === 0 && <p className="text-center text-gray-400 text-sm py-6">Nenhuma atividade ainda.</p>}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                <div className="bg-white border border-gray-200 rounded-2xl p-5">
                  <p className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-1.5"><BarChart3 className="h-4 w-4 text-orange-500" /> Top categorias</p>
                  <div className="space-y-3">
                    {(data.porCategoria ?? []).slice(0, 5).map((c) => (
                      <div key={c.categoriaId} className="flex items-center gap-3">
                        <span className="w-28 shrink-0 text-sm text-gray-600 truncate">{c.nome}</span>
                        <div className="flex-1 h-2.5 rounded-full bg-gray-100 overflow-hidden">
                          <div className="h-full rounded-full bg-orange-500" style={{ width: `${c.percentual}%` }} />
                        </div>
                        <span className="w-32 shrink-0 text-right text-xs text-gray-500">R$ {c.receita.toFixed(2)} ({c.percentual.toFixed(0)}%)</span>
                      </div>
                    ))}
                    {(data.porCategoria ?? []).length === 0 && <p className="text-center text-gray-400 text-sm py-6">Sem dados neste período.</p>}
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-2xl p-5">
                  <p className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-1.5"><AlertTriangle className="h-4 w-4 text-orange-500" /> Status dos serviços</p>
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2 text-sm bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
                      <span className="flex items-center gap-2 text-amber-800"><Wallet className="h-3.5 w-3.5" /> {data.alertas?.faturasPendentes ?? 0} fatura(s) com pagamento pendente</span>
                    </div>
                    <div className="flex items-center justify-between gap-2 text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5">
                      <span className="flex items-center gap-2 text-gray-700"><UserPlus className="h-3.5 w-3.5" /> {data.alertas?.tenantsInativos30Dias ?? 0} tenant(s) inativo(s) há mais de 30 dias</span>
                    </div>
                    <p className="text-[11px] text-gray-400 pt-1">Backups e monitoramento detalhado: ver Monitoramento no menu Suporte e Relatórios.</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-white border border-gray-200 p-5 rounded-2xl">
                  <p className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-1.5"><Smartphone className="h-4 w-4 text-orange-500" /> Dispositivos</p>
                  {(data.dispositivos ?? []).length === 0 ? (
                    <p className="text-center text-gray-400 text-sm py-6">Sem dados neste período</p>
                  ) : (
                    <StackedBar
                      segments={(data.dispositivos ?? []).map((d, i) => ({ label: d.nome, value: d.quantidade, colorClass: PALETA_SEGMENTOS[i % PALETA_SEGMENTOS.length] }))}
                      formatValue={(v) => `${v} pedido${v === 1 ? '' : 's'}`}
                    />
                  )}
                </div>
                <div className="bg-white border border-gray-200 p-5 rounded-2xl">
                  <p className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-1.5"><Globe2 className="h-4 w-4 text-orange-500" /> Navegadores</p>
                  {(data.navegadores ?? []).length === 0 ? (
                    <p className="text-center text-gray-400 text-sm py-6">Sem dados neste período</p>
                  ) : (
                    <StackedBar
                      segments={(data.navegadores ?? []).map((d, i) => ({ label: d.nome, value: d.quantidade, colorClass: PALETA_SEGMENTOS[i % PALETA_SEGMENTOS.length] }))}
                      formatValue={(v) => `${v} pedido${v === 1 ? '' : 's'}`}
                    />
                  )}
                </div>
              </div>

              <div className="bg-white border border-gray-200 p-5 rounded-2xl mb-6">
                <p className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-1.5"><ListChecks className="h-4 w-4 text-orange-500" /> Uso de funcionalidades</p>
                <div className="space-y-3">
                  {(data.usoFuncionalidades ?? []).map((f) => (
                    <div key={f.recurso} className="flex items-center gap-3">
                      <span className="w-40 shrink-0 text-sm text-gray-600 truncate">{f.recurso}</span>
                      <div className="flex-1 h-2.5 rounded-full bg-gray-100 overflow-hidden">
                        <div className="h-full rounded-full bg-orange-500" style={{ width: `${f.percentual}%` }} />
                      </div>
                      <span className="w-24 shrink-0 text-right text-xs text-gray-500">{f.tenantsUsando} tenant{f.tenantsUsando === 1 ? '' : 's'} ({f.percentual}%)</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-2xl p-5">
                <p className="text-sm font-semibold text-gray-700 mb-4">Acesso rápido</p>
                <div className="flex flex-wrap gap-3">
                  {ATALHOS.map(({ path, label, icon: Icon }) => (
                    <button
                      key={path}
                      onClick={() => navigate(path)}
                      className="flex flex-col items-center gap-1.5 w-20 text-center group"
                    >
                      <span className="h-11 w-11 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-500 group-hover:bg-orange-50 group-hover:border-orange-200 group-hover:text-orange-600 transition-colors">
                        <Icon className="h-5 w-5" />
                      </span>
                      <span className="text-[11px] text-gray-500 group-hover:text-orange-600">{label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboardPage;
