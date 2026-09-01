import React, { useCallback, useEffect, useState } from 'react';
import {
  ShoppingBag, TrendingUp, Star, Users, Wifi, Clock3, XCircle, Repeat, Timer,
  Trophy, Wallet, AlertTriangle, PackageX, MessageSquareWarning, Bike, ArrowUp, ArrowDown,
} from 'lucide-react';
import { fetchCrmResumo } from '../../lib/crm';
import { fetchDashboardResumo, fetchPresenceCount } from '../../lib/dashboard';
import { CrmSummary } from '../../types/Crm';
import { DashboardResumo, RFM_SEGMENT_COLORS, RFM_SEGMENT_STROKE } from '../../types/Dashboard';
import { STATUS_PEDIDO_LABELS, StatusPedido, FORMA_PAGAMENTO_LABELS, FormaPagamento } from '../../types/Pedido';
import LineChart from '../LineChart';
import DonutChart from '../DonutChart';
import HeatmapGrid from '../HeatmapGrid';
import FunnelChart from '../FunnelChart';

interface DashboardTabProps {
  empresaId: string;
}

type Periodo = 'hoje' | 'semana' | 'quinzena' | 'mes' | 'personalizado';

const todayISO = () => new Date().toISOString().slice(0, 10);

const STATUS_DONUT_COLORS: Record<string, { colorClass: string; strokeClass: string }> = {
  ENTREGUE: { colorClass: 'bg-emerald-500', strokeClass: 'stroke-emerald-500' },
  PREPARANDO: { colorClass: 'bg-amber-500', strokeClass: 'stroke-amber-500' },
  SAIU_ENTREGA: { colorClass: 'bg-blue-500', strokeClass: 'stroke-blue-500' },
  RECEBIDO: { colorClass: 'bg-gray-400', strokeClass: 'stroke-gray-400' },
  CANCELADO: { colorClass: 'bg-red-500', strokeClass: 'stroke-red-500' },
};

const PAGAMENTO_DONUT_COLORS: Record<string, { colorClass: string; strokeClass: string }> = {
  PIX: { colorClass: 'bg-teal-500', strokeClass: 'stroke-teal-500' },
  DINHEIRO: { colorClass: 'bg-emerald-500', strokeClass: 'stroke-emerald-500' },
  CARTAO: { colorClass: 'bg-indigo-500', strokeClass: 'stroke-indigo-500' },
  MULTIPLO: { colorClass: 'bg-purple-500', strokeClass: 'stroke-purple-500' },
};

const FUNIL_LABELS = { recebidos: 'Recebidos', preparando: 'Em preparo', saiuEntrega: 'A caminho', entregues: 'Entregues' };

/** Selo de tendência em texto simples ("↑18,6% vs período anterior") — estilo do mockup de referência. */
const TrendCaption: React.FC<{ atual: number; anterior: number }> = ({ atual, anterior }) => {
  if (!anterior) return null;
  const percentual = ((atual - anterior) / anterior) * 100;
  const subiu = percentual >= 0;
  const Icon = subiu ? ArrowUp : ArrowDown;
  return (
    <p className={`text-xs flex items-center gap-1 mt-1.5 ${subiu ? 'text-emerald-600' : 'text-red-600'}`}>
      <Icon className="h-3 w-3" /> {Math.abs(percentual).toFixed(1)}% vs período anterior
    </p>
  );
};

interface KpiCardProps {
  icon: React.ElementType;
  iconClass: string;
  label: string;
  value: string;
  trend?: { atual: number; anterior: number };
}

const KpiCard: React.FC<KpiCardProps> = ({ icon: Icon, iconClass, label, value, trend }) => (
  <div className="bg-white border border-gray-200 rounded-2xl p-5">
    <div className="flex items-center gap-2 mb-2">
      <span className={`flex items-center justify-center h-8 w-8 rounded-xl shrink-0 ${iconClass}`}>
        <Icon className="h-4 w-4" />
      </span>
      <span className="text-xs text-gray-500 truncate">{label}</span>
    </div>
    <p className="text-2xl font-bold text-gray-800">{value}</p>
    {trend && <TrendCaption atual={trend.atual} anterior={trend.anterior} />}
  </div>
);

const DashboardTab: React.FC<DashboardTabProps> = ({ empresaId }) => {
  const [periodo, setPeriodo] = useState<Periodo>('semana');
  const [customStart, setCustomStart] = useState(todayISO());
  const [customEnd, setCustomEnd] = useState(todayISO());

  const [crmData, setCrmData] = useState<CrmSummary | null>(null);
  const [crmAnterior, setCrmAnterior] = useState<CrmSummary | null>(null);
  const [dashData, setDashData] = useState<DashboardResumo | null>(null);
  const [loading, setLoading] = useState(false);
  const [online, setOnline] = useState<number | null>(null);

  const getRange = useCallback((): { de: string; ate: string } => {
    const end = new Date();
    const start = new Date();
    switch (periodo) {
      case 'hoje':
        break;
      case 'semana':
        start.setDate(start.getDate() - 6);
        break;
      case 'quinzena':
        start.setDate(start.getDate() - 14);
        break;
      case 'mes':
        start.setDate(start.getDate() - 29);
        break;
      case 'personalizado':
        return { de: customStart, ate: customEnd };
    }
    return { de: start.toISOString().slice(0, 10), ate: end.toISOString().slice(0, 10) };
  }, [periodo, customStart, customEnd]);

  const getPreviousRange = useCallback((): { de: string; ate: string } => {
    const { de, ate } = getRange();
    const deDate = new Date(`${de}T00:00:00`);
    const ateDate = new Date(`${ate}T00:00:00`);
    const duracaoDias = Math.round((ateDate.getTime() - deDate.getTime()) / 86400000) + 1;
    const prevAte = new Date(deDate);
    prevAte.setDate(prevAte.getDate() - 1);
    const prevDe = new Date(prevAte);
    prevDe.setDate(prevDe.getDate() - (duracaoDias - 1));
    return { de: prevDe.toISOString().slice(0, 10), ate: prevAte.toISOString().slice(0, 10) };
  }, [getRange]);

  useEffect(() => {
    const { de, ate } = getRange();
    const anterior = getPreviousRange();
    setLoading(true);
    Promise.all([
      fetchCrmResumo(empresaId, de, ate),
      fetchCrmResumo(empresaId, anterior.de, anterior.ate).catch(() => null),
      fetchDashboardResumo(empresaId, de, ate),
    ])
      .then(([atual, previo, dash]) => {
        setCrmData(atual);
        setCrmAnterior(previo);
        setDashData(dash);
      })
      .catch(() => {
        setCrmData(null);
        setDashData(null);
      })
      .finally(() => setLoading(false));
  }, [empresaId, getRange, getPreviousRange]);

  useEffect(() => {
    const carregar = () => fetchPresenceCount(empresaId).then(setOnline).catch(() => {});
    carregar();
    const interval = setInterval(carregar, 20000);
    return () => clearInterval(interval);
  }, [empresaId]);

  const data = crmData;
  const dash = dashData;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
        <div className="flex flex-wrap items-center gap-2">
          {([
            { id: 'hoje', label: 'Hoje' },
            { id: 'semana', label: '7 dias' },
            { id: 'quinzena', label: 'Quinzena (15 dias)' },
            { id: 'mes', label: 'Mês (30 dias)' },
            { id: 'personalizado', label: 'Personalizado' },
          ] as { id: Periodo; label: string }[]).map((p) => (
            <button
              key={p.id}
              onClick={() => setPeriodo(p.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                periodo === p.id ? 'bg-orange-600 text-white shadow' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        {online != null && (
          <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full">
            <Wifi className="h-3.5 w-3.5" /> {online} navegando agora
          </span>
        )}
      </div>

      {periodo === 'personalizado' && (
        <div className="flex flex-wrap items-center gap-3 mb-6 bg-gray-50 p-4 rounded-xl">
          <div>
            <label className="block text-xs text-gray-500 mb-1">De</label>
            <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Até</label>
            <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
        </div>
      )}

      {loading && <p className="text-gray-500 mb-4">Carregando...</p>}

      {!loading && data && dash && (
        <>
          {/* KPIs principais — 1 linha de 6 no desktop, igual ao layout de referência */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            <KpiCard
              icon={Wallet}
              iconClass="bg-blue-100 text-blue-600"
              label="Faturamento Total"
              value={`R$ ${data.totalRevenue.toFixed(2)}`}
              trend={crmAnterior ? { atual: data.totalRevenue, anterior: crmAnterior.totalRevenue } : undefined}
            />
            <KpiCard
              icon={ShoppingBag}
              iconClass="bg-purple-100 text-purple-600"
              label="Pedidos"
              value={String(data.totalOrders)}
              trend={crmAnterior ? { atual: data.totalOrders, anterior: crmAnterior.totalOrders } : undefined}
            />
            <KpiCard
              icon={TrendingUp}
              iconClass="bg-teal-100 text-teal-600"
              label="Ticket Médio"
              value={`R$ ${data.ticketMedio.toFixed(2)}`}
              trend={crmAnterior ? { atual: data.ticketMedio, anterior: crmAnterior.ticketMedio } : undefined}
            />
            <KpiCard
              icon={Users}
              iconClass="bg-indigo-100 text-indigo-600"
              label="Clientes Ativos"
              value={String(dash.clientesAtivos)}
              trend={crmAnterior ? { atual: dash.clientesAtivos, anterior: crmAnterior.novosVsRecorrentes.novos + crmAnterior.novosVsRecorrentes.recorrentes } : undefined}
            />
            <KpiCard icon={Repeat} iconClass="bg-pink-100 text-pink-600" label="Pedidos por Cliente Ativo" value={dash.pedidosPorClienteAtivo.toFixed(1)} />
            <KpiCard
              icon={Star}
              iconClass="bg-yellow-100 text-yellow-600"
              label="Avaliação Média"
              value={data.ratingCount > 0 ? `${data.avgRating.toFixed(1)} (${data.ratingCount})` : '—'}
            />
          </div>

          {/* Visão geral de vendas (2/3) + resumo de pedidos (1/3) */}
          <div className="grid lg:grid-cols-3 gap-6 mb-6">
            <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl p-5">
              <h3 className="font-bold text-gray-800 mb-4">Visão Geral de Vendas</h3>
              <LineChart
                labels={data.daily.map((d) => new Date(`${d.date}T00:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }))}
                series={[
                  { label: 'Faturamento (R$)', colorClass: 'bg-orange-500', strokeClass: 'stroke-orange-500', data: data.daily.map((d) => d.total) },
                  {
                    label: 'Pedidos',
                    colorClass: 'bg-blue-500',
                    strokeClass: 'stroke-blue-500',
                    data: data.daily.map((d) => dash.porDia.find((x) => x.date === d.date)?.pedidos ?? 0),
                  },
                  {
                    label: 'Novos Clientes',
                    colorClass: 'bg-emerald-500',
                    strokeClass: 'stroke-emerald-500',
                    data: data.daily.map((d) => dash.porDia.find((x) => x.date === d.date)?.novosClientes ?? 0),
                  },
                ]}
              />
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><XCircle className="h-4 w-4 text-orange-600" /> Resumo de Pedidos</h3>
              <DonutChart
                centerLabel="pedidos"
                formatValue={(v) => v.toFixed(0)}
                segments={data.porStatus.map((s) => ({
                  label: STATUS_PEDIDO_LABELS[s.status as StatusPedido] || s.status,
                  value: s.quantidade,
                  ...(STATUS_DONUT_COLORS[s.status] || { colorClass: 'bg-gray-400', strokeClass: 'stroke-gray-400' }),
                }))}
              />
            </div>
          </div>

          {/* Segunda leva de KPIs operacionais */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            <KpiCard
              icon={Timer}
              iconClass="bg-emerald-100 text-emerald-600"
              label="Entregas no Prazo"
              value={dash.entregasNoPrazoPercent != null ? `${dash.entregasNoPrazoPercent.toFixed(0)}%` : '—'}
            />
            <KpiCard
              icon={Clock3}
              iconClass="bg-blue-100 text-blue-600"
              label="Tempo Médio Entrega"
              value={dash.tempoMedioEntregaMin != null ? `${Math.round(dash.tempoMedioEntregaMin)} min` : '—'}
            />
            <KpiCard icon={XCircle} iconClass="bg-red-100 text-red-600" label="Cancelamentos" value={`${dash.cancelamentosPercent.toFixed(0)}%`} />
            <KpiCard icon={Repeat} iconClass="bg-teal-100 text-teal-600" label="Taxa de Recompra" value={`${dash.taxaRecompraPercent.toFixed(0)}%`} />
            <KpiCard icon={ShoppingBag} iconClass="bg-indigo-100 text-indigo-600" label="Produtos Vendidos" value={String(data.totalUnits)} />
            <KpiCard icon={Wifi} iconClass="bg-emerald-100 text-emerald-600" label="Usuários Online" value={online != null ? String(online) : '—'} />
          </div>

          {/* Forma de pagamento | Heatmap | Top categorias — 3 colunas iguais */}
          <div className="grid lg:grid-cols-3 gap-6 mb-6">
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <h3 className="font-bold text-gray-800 mb-4">Vendas por Forma de Pagamento</h3>
              <DonutChart
                centerLabel="total"
                formatValue={(v) => `R$ ${v.toFixed(0)}`}
                segments={data.byPayment.map((p) => ({
                  label: FORMA_PAGAMENTO_LABELS[p.formaPagamento as FormaPagamento] || p.formaPagamento,
                  value: p.total,
                  ...(PAGAMENTO_DONUT_COLORS[p.formaPagamento] || { colorClass: 'bg-gray-400', strokeClass: 'stroke-gray-400' }),
                }))}
              />
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <h3 className="font-bold text-gray-800 mb-4">Vendas por Período do Dia</h3>
              <HeatmapGrid data={dash.heatmap} />
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <h3 className="font-bold text-gray-800 mb-4">Top Categorias</h3>
              <div className="space-y-2">
                {dash.porCategoria.map((c, i) => (
                  <div key={c.categoriaId} className="flex items-center gap-2 text-sm">
                    <span className="text-gray-400 w-4">{i + 1}</span>
                    <span className="text-gray-700 flex-1 truncate">{c.nome}</span>
                    <span className="font-bold text-gray-800">R$ {c.receita.toFixed(0)}</span>
                    <span className="text-gray-400 w-10 text-right">{c.percentual.toFixed(0)}%</span>
                  </div>
                ))}
                {dash.porCategoria.length === 0 && <p className="text-center text-gray-400 text-sm py-6">Sem dados neste período</p>}
              </div>
            </div>
          </div>

          {/* Produtos mais vendidos | Top motoboys | Status em tempo real — 3 colunas iguais */}
          <div className="grid lg:grid-cols-3 gap-6 mb-6">
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><Trophy className="h-4 w-4 text-orange-600" /> Produtos Mais Vendidos</h3>
              <div className="space-y-2">
                {data.topProdutos.slice(0, 5).map((p, i) => (
                  <div key={p.produtoId} className="flex items-center gap-2 text-sm">
                    <span className="text-gray-400 w-4">{i + 1}</span>
                    <span className="text-gray-700 flex-1 truncate">{p.nome}</span>
                    <span className="text-gray-400">{p.quantidade}un</span>
                    <span className="font-bold text-orange-600 w-16 text-right">R$ {p.receita.toFixed(0)}</span>
                  </div>
                ))}
                {data.topProdutos.length === 0 && <p className="text-center text-gray-400 text-sm py-6">Sem dados neste período</p>}
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><Bike className="h-4 w-4 text-orange-600" /> Top Motoboys</h3>
              <div className="space-y-2">
                {dash.topMotoboys.map((m, i) => (
                  <div key={m.motoboyId} className="flex items-center gap-2 text-sm">
                    <span className="text-gray-400 w-4">{i + 1}</span>
                    <span className="text-gray-700 flex-1 truncate">{m.motoboyNome}</span>
                    <span className="text-gray-400">{m.entregas} ent.</span>
                    <span className="font-bold text-gray-800 w-12 text-right flex items-center justify-end gap-0.5">
                      {m.avaliacaoMedia != null ? <><Star className="h-3 w-3 text-yellow-500 fill-yellow-500" /> {m.avaliacaoMedia.toFixed(1)}</> : '—'}
                    </span>
                  </div>
                ))}
                {dash.topMotoboys.length === 0 && <p className="text-center text-gray-400 text-sm py-6">Sem corridas neste período</p>}
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <h3 className="font-bold text-gray-800 mb-4">Status das Entregas (Hoje)</h3>
              <div className="space-y-2">
                {dash.statusHoje.map((s) => (
                  <div key={s.status} className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2 text-sm">
                    <span className="text-gray-600">{STATUS_PEDIDO_LABELS[s.status as StatusPedido] || s.status}</span>
                    <span className="font-bold text-gray-800">{s.quantidade}</span>
                  </div>
                ))}
                {dash.statusHoje.length === 0 && <p className="text-center text-gray-400 text-sm py-6">Nenhum pedido hoje ainda</p>}
              </div>
            </div>
          </div>

          {/* Funil | RFM | Avaliações recentes — 3 colunas iguais */}
          <div className="grid lg:grid-cols-3 gap-6 mb-6">
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <h3 className="font-bold text-gray-800 mb-4">Fluxo de Pedidos (Delivery)</h3>
              <FunnelChart
                stages={[
                  { label: FUNIL_LABELS.recebidos, value: dash.funil.recebidos },
                  { label: FUNIL_LABELS.preparando, value: dash.funil.preparando },
                  { label: FUNIL_LABELS.saiuEntrega, value: dash.funil.saiuEntrega },
                  { label: FUNIL_LABELS.entregues, value: dash.funil.entregues },
                ]}
                cancelados={dash.funil.cancelados}
              />
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <h3 className="font-bold text-gray-800 mb-4">Análise RFM</h3>
              <DonutChart
                centerLabel="clientes"
                segments={dash.rfm.map((r) => ({
                  label: r.label,
                  value: r.quantidade,
                  colorClass: RFM_SEGMENT_COLORS[r.segmento],
                  strokeClass: RFM_SEGMENT_STROKE[r.segmento],
                }))}
              />
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><Star className="h-4 w-4 text-orange-600" /> Avaliações Recentes</h3>
              <div className="space-y-3">
                {dash.avaliacoesRecentes.slice(0, 4).map((a) => (
                  <div key={a.id} className="border-b border-gray-100 pb-2 last:border-0">
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star key={i} className={`h-3 w-3 ${i < a.notaPedido ? 'text-yellow-500 fill-yellow-500' : 'text-gray-200'}`} />
                      ))}
                    </div>
                    <p className="text-xs text-gray-600 truncate">{a.comentarioPedido || <span className="text-gray-400 italic">Sem comentário</span>}</p>
                    <p className="text-[11px] text-gray-400">{a.clienteNome}</p>
                  </div>
                ))}
                {dash.avaliacoesRecentes.length === 0 && <p className="text-center text-gray-400 text-sm py-6">Nenhuma avaliação ainda</p>}
              </div>
            </div>
          </div>

          {/* Resumo financeiro (2/3) + alertas (1/3) */}
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl p-5">
              <h3 className="font-bold text-gray-800 mb-1 flex items-center gap-2"><Wallet className="h-4 w-4 text-orange-600" /> Resumo Financeiro (Caixa)</h3>
              <p className="text-xs text-gray-500 mb-4">Saldo real de caixa da loja — cada loja usa o próprio meio de pagamento, o valor cai direto pra ela.</p>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
                  <p className="text-xs text-emerald-700 mb-0.5">Entradas</p>
                  <p className="text-lg font-bold text-emerald-800">R$ {dash.caixa.entradasPeriodo.toFixed(2)}</p>
                </div>
                <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                  <p className="text-xs text-red-700 mb-0.5">Saídas</p>
                  <p className="text-lg font-bold text-red-800">R$ {dash.caixa.saidasPeriodo.toFixed(2)}</p>
                </div>
                <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
                  <p className="text-xs text-blue-700 mb-0.5">Saldo</p>
                  <p className="text-lg font-bold text-blue-800">R$ {dash.caixa.saldoPeriodo.toFixed(2)}</p>
                </div>
              </div>
              <LineChart
                labels={dash.caixa.porDia.map((d) => new Date(`${d.date}T00:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }))}
                series={[
                  { label: 'Entradas', colorClass: 'bg-emerald-500', strokeClass: 'stroke-emerald-500', data: dash.caixa.porDia.map((d) => d.entradas) },
                  { label: 'Saídas', colorClass: 'bg-red-500', strokeClass: 'stroke-red-500', data: dash.caixa.porDia.map((d) => d.saidas) },
                  { label: 'Saldo', colorClass: 'bg-blue-500', strokeClass: 'stroke-blue-500', data: dash.caixa.porDia.map((d) => d.saldo) },
                ]}
              />
              {dash.caixa.sessaoAberta ? (
                <p className="text-xs text-gray-500 mt-3">
                  Caixa aberto por <strong>{dash.caixa.sessaoAberta.operadorNome}</strong> (fundo de troco R$ {dash.caixa.sessaoAberta.fundoTroco.toFixed(2)})
                </p>
              ) : (
                <p className="text-xs text-gray-400 mt-3">Nenhum caixa aberto agora</p>
              )}
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <h3 className="font-bold text-gray-800 mb-4">Alertas e Notificações</h3>
              <div className="space-y-2">
                {dash.alertas.estoqueBaixo.map((e) => (
                  <div key={e.produtoId} className="flex items-center gap-2 text-sm bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
                    <PackageX className="h-4 w-4 text-amber-600 shrink-0" />
                    <span className="text-amber-800"><strong>{e.nome}</strong> com estoque baixo ({e.estoqueQtd} un.)</span>
                  </div>
                ))}
                {dash.alertas.pedidosAtrasados.map((p) => (
                  <div key={p.pedidoId} className="flex items-center gap-2 text-sm bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                    <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
                    <span className="text-red-800">Pedido #{String(p.numero).padStart(4, '0')} atrasado há {p.minutosDesdeOPedido} min</span>
                  </div>
                ))}
                {dash.alertas.avaliacoesNegativas.map((a) => (
                  <div key={a.id} className="flex items-center gap-2 text-sm bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
                    <MessageSquareWarning className="h-4 w-4 text-gray-500 shrink-0" />
                    <span className="text-gray-700">Avaliação negativa (nota {a.notaPedido}) no pedido #{String(a.numero).padStart(4, '0')}</span>
                  </div>
                ))}
                {dash.alertas.estoqueBaixo.length === 0 && dash.alertas.pedidosAtrasados.length === 0 && dash.alertas.avaliacoesNegativas.length === 0 && (
                  <p className="text-center text-gray-400 text-sm py-6">Tudo certo por aqui — sem alertas</p>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DashboardTab;
