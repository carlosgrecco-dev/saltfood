import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ShoppingBag, Truck, TrendingUp, Trophy, Clock3, XCircle, Download, MapPin, CalendarDays, Users,
  Ticket, Layers, BarChart3, ArrowRight, Loader2, Bike, Boxes, Store, Timer, Percent, FileText,
  Gift, Wallet, Grid3x3,
} from 'lucide-react';
import SimpleBarChart from '../SimpleBarChart';
import LineChart from '../LineChart';
import DonutChart from '../DonutChart';
import HeatmapGrid from '../HeatmapGrid';
import CashFlowChart from '../CashFlowChart';
import TrendBadge from '../TrendBadge';
import RelatorioModal from './RelatorioModal';
import { fetchCrmResumo, baixarCrmCsv } from '../../lib/crm';
import { fetchDashboardResumo } from '../../lib/dashboard';
import { fetchFinanceiroResumo } from '../../lib/financeiro';
import { fetchEmpresaById } from '../../lib/empresas';
import { fetchCuponsAdminResumo } from '../../lib/cupons';
import { fetchMotoboysAdminResumo, fetchPagamentosMotoboyResumo } from '../../lib/motoboysApi';
import { fetchClientesFidelidadeResumo } from '../../lib/clientes';
import { fetchProdutos } from '../../lib/produtos';
import { fetchPedidos } from '../../lib/pedidos';
import { fetchHorarios } from '../../lib/horarios';
import { CrmSummary } from '../../types/Crm';
import { DashboardResumo } from '../../types/Dashboard';
import { Empresa } from '../../types/Empresa';
import { FORMA_PAGAMENTO_LABELS, FormaPagamento, StatusPedido, STATUS_PEDIDO_LABELS, Pedido } from '../../types/Pedido';
import IndicacaoEmpresaCard from './IndicacaoEmpresaCard';

interface CrmTabProps {
  empresaId: string;
  onAbrirFinanceiro?: () => void;
}

type Periodo = 'hoje' | 'semana' | 'quinzena' | 'mes' | 'personalizado';

const todayISO = () => new Date().toISOString().slice(0, 10);
const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const DIAS_SEMANA_LONGO = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
const TIPO_PEDIDO_LABELS: Record<string, string> = { DELIVERY: 'Delivery', BALCAO: 'Balcão', MESA: 'Mesa', RETIRADA: 'Retirada' };
const CLASSE_ABC_COLORS: Record<'A' | 'B' | 'C', string> = {
  A: 'bg-emerald-100 text-emerald-800',
  B: 'bg-amber-100 text-amber-800',
  C: 'bg-gray-200 text-gray-700',
};
const DONUT_CORES = ['bg-emerald-500', 'bg-blue-500', 'bg-purple-500', 'bg-amber-500', 'bg-rose-500', 'bg-gray-400'];
const DONUT_STROKES = ['stroke-emerald-500', 'stroke-blue-500', 'stroke-purple-500', 'stroke-amber-500', 'stroke-rose-500', 'stroke-gray-400'];
const formatDataCurta = (iso: string) => new Date(`${iso}T00:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

const fmtR$ = (v: number) => `R$ ${v.toFixed(2)}`;

const CrmTab: React.FC<CrmTabProps> = ({ empresaId, onAbrirFinanceiro }) => {
  const [periodo, setPeriodo] = useState<Periodo>('semana');
  const [customStart, setCustomStart] = useState(todayISO());
  const [customEnd, setCustomEnd] = useState(todayISO());
  const [data, setData] = useState<CrmSummary | null>(null);
  const [dataAnterior, setDataAnterior] = useState<CrmSummary | null>(null);
  const [dashboard, setDashboard] = useState<DashboardResumo | null>(null);
  const [loading, setLoading] = useState(false);
  const [exportando, setExportando] = useState(false);

  const [relatorio, setRelatorio] = useState<{ titulo: string; conteudo: React.ReactNode } | null>(null);
  const [carregandoRelatorio, setCarregandoRelatorio] = useState<string | null>(null);

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

  const periodoLabel = useMemo(() => {
    const { de, ate } = getRange();
    return de === ate ? formatDataCurta(de) : `${formatDataCurta(de)} a ${formatDataCurta(ate)}`;
  }, [getRange]);

  useEffect(() => {
    const { de, ate } = getRange();
    const anterior = getPreviousRange();
    setLoading(true);
    Promise.all([
      fetchCrmResumo(empresaId, de, ate),
      fetchCrmResumo(empresaId, anterior.de, anterior.ate).catch(() => null),
      fetchDashboardResumo(empresaId, de, ate).catch(() => null),
    ])
      .then(([atual, previo, dash]) => {
        setData(atual);
        setDataAnterior(previo);
        setDashboard(dash);
      })
      .catch(() => {
        setData(null);
        setDataAnterior(null);
        setDashboard(null);
      })
      .finally(() => setLoading(false));
  }, [empresaId, getRange, getPreviousRange]);

  const handleExportarCsv = async () => {
    const { de, ate } = getRange();
    setExportando(true);
    try {
      await baixarCrmCsv(empresaId, de, ate);
    } catch {
      alert('Não foi possível exportar o CSV. Tente novamente.');
    } finally {
      setExportando(false);
    }
  };

  const downloadCsv = (nomeArquivo: string, linhas: string[][]) => {
    const csv = linhas.map((l) => l.join(';')).join('\n');
    const blob = new Blob(['﻿', csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nomeArquivo;
    a.click();
    URL.revokeObjectURL(url);
  };

  const tabelaPedidos = (pedidos: Pedido[]) => (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-left text-gray-500">
            <th className="py-2 px-3">Pedido</th>
            <th className="py-2 px-3">Cliente</th>
            <th className="py-2 px-3">Tipo</th>
            <th className="py-2 px-3">Status</th>
            <th className="py-2 px-3">Total</th>
            <th className="py-2 px-3">Data</th>
          </tr>
        </thead>
        <tbody>
          {pedidos.map((p) => (
            <tr key={p.id} className="border-b border-gray-100">
              <td className="py-2 px-3 font-mono text-xs">#{p.numero}</td>
              <td className="py-2 px-3">{p.clienteNome || '—'}</td>
              <td className="py-2 px-3">{TIPO_PEDIDO_LABELS[p.tipoPedido] || p.tipoPedido}</td>
              <td className="py-2 px-3">{STATUS_PEDIDO_LABELS[p.status]}</td>
              <td className="py-2 px-3 font-bold text-orange-600">{fmtR$(p.total)}</td>
              <td className="py-2 px-3 text-xs text-gray-500">{new Date(p.createdAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {pedidos.length === 0 && <p className="text-center text-gray-400 text-sm py-8">Nenhum pedido encontrado.</p>}
    </div>
  );

  const abrirRelatorioSimples = (titulo: string, conteudo: React.ReactNode) => setRelatorio({ titulo, conteudo });

  const abrirRelatorioAssincrono = async (id: string, titulo: string, carregar: () => Promise<React.ReactNode>) => {
    setCarregandoRelatorio(id);
    try {
      const conteudo = await carregar();
      setRelatorio({ titulo, conteudo });
    } catch {
      alert('Não foi possível carregar este relatório.');
    } finally {
      setCarregandoRelatorio(null);
    }
  };

  const outrosRelatorios = [
    {
      id: 'pedidos', titulo: 'Relatório de pedidos', icone: ShoppingBag, cor: 'text-blue-500',
      descricao: 'Detalhes completos de todos os pedidos do período',
      abrir: () => abrirRelatorioAssincrono('pedidos', 'Relatório de pedidos', async () => {
        const { de, ate } = getRange();
        const pedidos = await fetchPedidos(empresaId, { de, ate });
        return tabelaPedidos(pedidos);
      }),
    },
    {
      id: 'cancelamentos', titulo: 'Relatório de cancelamentos', icone: XCircle, cor: 'text-red-500',
      descricao: 'Análise de cancelamentos e motivos',
      abrir: () => abrirRelatorioAssincrono('cancelamentos', 'Relatório de cancelamentos', async () => {
        const { de, ate } = getRange();
        const pedidos = await fetchPedidos(empresaId, { de, ate, status: 'CANCELADO' as StatusPedido });
        return (
          <div>
            <p className="text-sm text-gray-600 mb-4">{pedidos.length} pedido{pedidos.length !== 1 ? 's' : ''} cancelado{pedidos.length !== 1 ? 's' : ''} no período, somando {fmtR$(pedidos.reduce((s, p) => s + p.total, 0))}.</p>
            {tabelaPedidos(pedidos)}
          </div>
        );
      }),
    },
    {
      id: 'cupons', titulo: 'Relatório de cupons', icone: Ticket, cor: 'text-purple-500',
      descricao: 'Cupons usados e efetividade',
      abrir: () => abrirRelatorioAssincrono('cupons', 'Relatório de cupons', async () => {
        const resumo = await fetchCuponsAdminResumo(empresaId);
        return (
          <div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
              <div className="bg-gray-50 rounded-xl p-3"><p className="text-xs text-gray-500">Total de cupons</p><p className="text-lg font-bold text-gray-800">{resumo.stats.total}</p></div>
              <div className="bg-gray-50 rounded-xl p-3"><p className="text-xs text-gray-500">Ativos</p><p className="text-lg font-bold text-gray-800">{resumo.stats.ativos}</p></div>
              <div className="bg-gray-50 rounded-xl p-3"><p className="text-xs text-gray-500">Usos este mês</p><p className="text-lg font-bold text-gray-800">{resumo.stats.usosMesAtual}</p></div>
              <div className="bg-gray-50 rounded-xl p-3"><p className="text-xs text-gray-500">Desconto este mês</p><p className="text-lg font-bold text-gray-800">{fmtR$(resumo.stats.descontoMesAtual)}</p></div>
            </div>
            <table className="w-full text-sm">
              <thead><tr className="border-b border-gray-200 text-left text-gray-500"><th className="py-2 px-3">Código</th><th className="py-2 px-3">Tipo</th><th className="py-2 px-3">Usos</th><th className="py-2 px-3">Status</th></tr></thead>
              <tbody>
                {resumo.cupons.map((c) => (
                  <tr key={c.id} className="border-b border-gray-100">
                    <td className="py-2 px-3 font-mono font-medium">{c.codigo}</td>
                    <td className="py-2 px-3">{c.tipo}</td>
                    <td className="py-2 px-3">{c.usosRealizados}{c.usoMaximo ? ` / ${c.usoMaximo}` : ''}</td>
                    <td className="py-2 px-3">{c.ativo ? 'Ativo' : 'Inativo'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {resumo.cupons.length === 0 && <p className="text-center text-gray-400 text-sm py-8">Nenhum cupom cadastrado.</p>}
          </div>
        );
      }),
    },
    {
      id: 'fidelidade', titulo: 'Relatório de fidelidade', icone: Gift, cor: 'text-orange-500',
      descricao: 'Pontos, resgates e clientes fiéis',
      abrir: () => abrirRelatorioAssincrono('fidelidade', 'Relatório de fidelidade', async () => {
        const resumo = await fetchClientesFidelidadeResumo(empresaId);
        return (
          <div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
              <div className="bg-gray-50 rounded-xl p-3"><p className="text-xs text-gray-500">Clientes cadastrados</p><p className="text-lg font-bold text-gray-800">{resumo.stats.clientesCadastrados.atual}</p></div>
              <div className="bg-gray-50 rounded-xl p-3"><p className="text-xs text-gray-500">Clientes ativos</p><p className="text-lg font-bold text-gray-800">{resumo.stats.clientesAtivos}</p></div>
              <div className="bg-gray-50 rounded-xl p-3"><p className="text-xs text-gray-500">Economia gerada</p><p className="text-lg font-bold text-gray-800">{fmtR$(resumo.stats.economiaGerada.atual)}</p></div>
            </div>
            <p className="font-bold text-gray-800 mb-2">Ranking de clientes fiéis</p>
            <table className="w-full text-sm">
              <thead><tr className="border-b border-gray-200 text-left text-gray-500"><th className="py-2 px-3">#</th><th className="py-2 px-3">Cliente</th><th className="py-2 px-3">Unidades compradas</th></tr></thead>
              <tbody>
                {resumo.ranking.map((r, i) => (
                  <tr key={r.id} className="border-b border-gray-100">
                    <td className="py-2 px-3 text-gray-400">{i + 1}º</td>
                    <td className="py-2 px-3 font-medium">{r.nome}</td>
                    <td className="py-2 px-3 font-bold text-orange-600">{r.totalUnidadesCompradas}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }),
    },
    {
      id: 'motoboys', titulo: 'Relatório de motoboys', icone: Bike, cor: 'text-blue-500',
      descricao: 'Desempenho das entregas',
      abrir: () => abrirRelatorioAssincrono('motoboys', 'Relatório de motoboys', async () => {
        const [resumo, pagamentos] = await Promise.all([fetchMotoboysAdminResumo(empresaId), fetchPagamentosMotoboyResumo(empresaId)]);
        return (
          <div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
              <div className="bg-gray-50 rounded-xl p-3"><p className="text-xs text-gray-500">Total</p><p className="text-lg font-bold text-gray-800">{resumo.stats.total}</p></div>
              <div className="bg-gray-50 rounded-xl p-3"><p className="text-xs text-gray-500">Ativos</p><p className="text-lg font-bold text-gray-800">{resumo.stats.ativos}</p></div>
              <div className="bg-gray-50 rounded-xl p-3"><p className="text-xs text-gray-500">Avaliação média</p><p className="text-lg font-bold text-gray-800">{resumo.stats.avaliacaoMediaGeral.toFixed(1)}</p></div>
              <div className="bg-gray-50 rounded-xl p-3"><p className="text-xs text-gray-500">A pagar</p><p className="text-lg font-bold text-gray-800">{fmtR$(pagamentos.stats.aReceber)}</p></div>
            </div>
            <table className="w-full text-sm">
              <thead><tr className="border-b border-gray-200 text-left text-gray-500"><th className="py-2 px-3">Motoboy</th><th className="py-2 px-3">Status</th><th className="py-2 px-3">Entregas</th><th className="py-2 px-3">Avaliação</th></tr></thead>
              <tbody>
                {resumo.motoboys.map((m) => (
                  <tr key={m.id} className="border-b border-gray-100">
                    <td className="py-2 px-3 font-medium">{m.nome}</td>
                    <td className="py-2 px-3">{m.statusCalculado}</td>
                    <td className="py-2 px-3">{m.entregasTotais ?? 0}</td>
                    <td className="py-2 px-3">{m.avaliacaoMedia != null ? m.avaliacaoMedia.toFixed(1) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }),
    },
    {
      id: 'estoque', titulo: 'Relatório de estoque', icone: Boxes, cor: 'text-emerald-500',
      descricao: 'Produtos, entradas e saídas',
      abrir: () => abrirRelatorioAssincrono('estoque', 'Relatório de estoque', async () => {
        const produtos = await fetchProdutos(empresaId);
        const controlados = produtos.filter((p) => p.controlarEstoque);
        return (
          <div>
            <p className="text-sm text-gray-600 mb-4">{controlados.length} produto{controlados.length !== 1 ? 's' : ''} com controle de estoque ativo.</p>
            <table className="w-full text-sm">
              <thead><tr className="border-b border-gray-200 text-left text-gray-500"><th className="py-2 px-3">Produto</th><th className="py-2 px-3">Estoque atual</th><th className="py-2 px-3">Mínimo</th><th className="py-2 px-3">Status</th></tr></thead>
              <tbody>
                {controlados.map((p) => {
                  const baixo = p.estoqueMinimo != null && (p.estoqueQtd ?? 0) <= p.estoqueMinimo;
                  return (
                    <tr key={p.id} className="border-b border-gray-100">
                      <td className="py-2 px-3 font-medium">{p.nome}</td>
                      <td className="py-2 px-3">{p.estoqueQtd ?? 0}</td>
                      <td className="py-2 px-3">{p.estoqueMinimo ?? '—'}</td>
                      <td className="py-2 px-3">{baixo ? <span className="text-red-600 font-medium">Baixo</span> : <span className="text-emerald-600">Ok</span>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {controlados.length === 0 && <p className="text-center text-gray-400 text-sm py-8">Nenhum produto com controle de estoque configurado.</p>}
          </div>
        );
      }),
    },
    {
      id: 'pdv', titulo: 'Relatório de PDV', icone: Store, cor: 'text-indigo-500',
      descricao: 'Vendas no ponto de venda',
      abrir: () => abrirRelatorioAssincrono('pdv', 'Relatório de PDV', async () => {
        const { de, ate } = getRange();
        const pedidos = await fetchPedidos(empresaId, { de, ate });
        const pdv = pedidos.filter((p) => p.tipoPedido !== 'DELIVERY');
        const porTipo = new Map<string, { quantidade: number; total: number }>();
        for (const p of pdv) {
          const atual = porTipo.get(p.tipoPedido) || { quantidade: 0, total: 0 };
          atual.quantidade += 1;
          atual.total += p.total;
          porTipo.set(p.tipoPedido, atual);
        }
        return (
          <div>
            <p className="text-sm text-gray-600 mb-4">{pdv.length} venda{pdv.length !== 1 ? 's' : ''} pelo PDV (balcão/mesa/retirada) no período, somando {fmtR$(pdv.reduce((s, p) => s + p.total, 0))}.</p>
            <table className="w-full text-sm mb-5">
              <thead><tr className="border-b border-gray-200 text-left text-gray-500"><th className="py-2 px-3">Tipo</th><th className="py-2 px-3">Vendas</th><th className="py-2 px-3">Total</th></tr></thead>
              <tbody>
                {Array.from(porTipo.entries()).map(([tipo, v]) => (
                  <tr key={tipo} className="border-b border-gray-100">
                    <td className="py-2 px-3 font-medium">{TIPO_PEDIDO_LABELS[tipo] || tipo}</td>
                    <td className="py-2 px-3">{v.quantidade}</td>
                    <td className="py-2 px-3 font-bold text-orange-600">{fmtR$(v.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {tabelaPedidos(pdv)}
          </div>
        );
      }),
    },
    {
      id: 'horarios', titulo: 'Relatório de horários', icone: Clock3, cor: 'text-teal-500',
      descricao: 'Movimentação por horário',
      abrir: () => abrirRelatorioAssincrono('horarios', 'Relatório de horários de funcionamento', async () => {
        const horarios = await fetchHorarios(empresaId);
        return (
          <table className="w-full text-sm">
            <thead><tr className="border-b border-gray-200 text-left text-gray-500"><th className="py-2 px-3">Dia</th><th className="py-2 px-3">Abre</th><th className="py-2 px-3">Fecha</th><th className="py-2 px-3">Status</th></tr></thead>
            <tbody>
              {DIAS_SEMANA_LONGO.map((label, dia) => {
                const h = horarios.find((x) => x.diaSemana === dia);
                return (
                  <tr key={dia} className="border-b border-gray-100">
                    <td className="py-2 px-3 font-medium">{label}</td>
                    <td className="py-2 px-3">{h && !h.fechado ? h.abre : '—'}</td>
                    <td className="py-2 px-3">{h && !h.fechado ? h.fecha : '—'}</td>
                    <td className="py-2 px-3">{!h || h.fechado ? <span className="text-red-600">Fechado</span> : <span className="text-emerald-600">Aberto</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        );
      }),
    },
    {
      id: 'taxas', titulo: 'Relatório de taxas', icone: Percent, cor: 'text-rose-500',
      descricao: 'Taxas e comissões detalhadas',
      abrir: () => abrirRelatorioAssincrono('taxas', 'Relatório de taxas e comissões', async () => {
        const empresa: Empresa = await fetchEmpresaById(empresaId);
        return (
          <div className="space-y-2.5 text-sm">
            <div className="flex items-center justify-between py-2 border-b border-gray-100"><span className="text-gray-500">Comissão da plataforma</span><span className="font-bold text-gray-800">{data?.mostrarComissao ? `${empresa.comissaoPercent.toFixed(1)}%` : 'Oculta pra esta loja'}</span></div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100"><span className="text-gray-500">Taxa de entrega padrão</span><span className="font-bold text-gray-800">{fmtR$(empresa.taxaEntrega)}</span></div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100"><span className="text-gray-500">Frete grátis acima de</span><span className="font-bold text-gray-800">{empresa.freteGratisAcimaDe != null ? fmtR$(empresa.freteGratisAcimaDe) : 'Não configurado'}</span></div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100"><span className="text-gray-500">Cashback</span><span className="font-bold text-gray-800">{empresa.cashbackPercent ? `${empresa.cashbackPercent}%` : 'Desativado'}</span></div>
            <div className="flex items-center justify-between py-2"><span className="text-gray-500">Tempo estimado de entrega</span><span className="font-bold text-gray-800">{empresa.tempoEstimadoMin && empresa.tempoEstimadoMax ? `${empresa.tempoEstimadoMin}–${empresa.tempoEstimadoMax} min` : 'Não configurado'}</span></div>
          </div>
        );
      }),
    },
    {
      id: 'exportacao', titulo: 'Relatório de exportação', icone: FileText, cor: 'text-gray-500',
      descricao: 'Exporta dados personalizados',
      abrir: async () => {
        const { de, ate } = getRange();
        setCarregandoRelatorio('exportacao');
        try {
          const [pedidos, produtos] = await Promise.all([fetchPedidos(empresaId, { de, ate }), fetchProdutos(empresaId)]);
          downloadCsv(`pedidos-${de}-a-${ate}.csv`, [
            ['Número', 'Cliente', 'Tipo', 'Status', 'Total', 'Data'],
            ...pedidos.map((p) => [String(p.numero), p.clienteNome || '', p.tipoPedido, p.status, p.total.toFixed(2), p.createdAt]),
          ]);
          downloadCsv('produtos.csv', [
            ['Nome', 'Categoria', 'Preço', 'Ativo', 'Estoque'],
            ...produtos.map((p) => [p.nome, p.categoria?.nome || '', p.preco.toFixed(2), p.ativo ? 'Sim' : 'Não', p.controlarEstoque ? String(p.estoqueQtd ?? 0) : '']),
          ]);
        } catch {
          alert('Não foi possível exportar os dados.');
        } finally {
          setCarregandoRelatorio(null);
        }
      },
    },
  ];

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-bold text-gray-800">Relatórios</h2>
        <p className="text-sm text-gray-500">Acompanhe todos os dados e performance da sua loja.</p>
      </div>

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
        <button
          onClick={handleExportarCsv}
          disabled={exportando || !data}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium bg-gray-800 hover:bg-gray-900 text-white disabled:opacity-60 transition-colors"
        >
          <Download className="h-3.5 w-3.5" /> {exportando ? 'Exportando...' : 'Exportar CSV'}
        </button>
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

      {!loading && data && (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-5 rounded-2xl">
              <p className="text-orange-100 text-xs mb-1">Faturamento bruto</p>
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-2xl font-bold">{fmtR$(data.totalRevenue)}</p>
                {dataAnterior && <TrendBadge atual={data.totalRevenue} anterior={dataAnterior.totalRevenue} variante="escuro" />}
              </div>
            </div>
            <div className="bg-white border border-gray-200 p-5 rounded-2xl">
              <p className="text-gray-500 text-xs mb-1 flex items-center gap-1"><ShoppingBag className="h-3.5 w-3.5" /> Pedidos</p>
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-2xl font-bold text-gray-800">{data.totalOrders}</p>
                {dataAnterior && <TrendBadge atual={data.totalOrders} anterior={dataAnterior.totalOrders} />}
              </div>
            </div>
            <div className="bg-white border border-gray-200 p-5 rounded-2xl">
              <p className="text-gray-500 text-xs mb-1 flex items-center gap-1"><TrendingUp className="h-3.5 w-3.5" /> Ticket médio</p>
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-2xl font-bold text-gray-800">{fmtR$(data.ticketMedio)}</p>
                {dataAnterior && <TrendBadge atual={data.ticketMedio} anterior={dataAnterior.ticketMedio} />}
              </div>
            </div>
            <div className="bg-white border border-gray-200 p-5 rounded-2xl">
              <p className="text-gray-500 text-xs mb-1 flex items-center gap-1"><Users className="h-3.5 w-3.5" /> Clientes novos</p>
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-2xl font-bold text-gray-800">{data.novosVsRecorrentes.novos}</p>
                {dataAnterior && <TrendBadge atual={data.novosVsRecorrentes.novos} anterior={dataAnterior.novosVsRecorrentes.novos} />}
              </div>
            </div>
            {(() => {
              const totalStatus = data.porStatus.reduce((s, x) => s + x.quantidade, 0);
              const cancelados = data.porStatus.find((s) => s.status === 'CANCELADO')?.quantidade || 0;
              const taxaCancel = totalStatus > 0 ? (cancelados / totalStatus) * 100 : 0;
              let taxaCancelAnterior = 0;
              if (dataAnterior) {
                const totalAnt = dataAnterior.porStatus.reduce((s, x) => s + x.quantidade, 0);
                const cancelAnt = dataAnterior.porStatus.find((s) => s.status === 'CANCELADO')?.quantidade || 0;
                taxaCancelAnterior = totalAnt > 0 ? (cancelAnt / totalAnt) * 100 : 0;
              }
              return (
                <div className="bg-white border border-gray-200 p-5 rounded-2xl">
                  <p className="text-gray-500 text-xs mb-1 flex items-center gap-1"><XCircle className="h-3.5 w-3.5" /> Taxa de cancelamento</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-2xl font-bold text-gray-800">{taxaCancel.toFixed(2)}%</p>
                    {dataAnterior && <TrendBadge atual={taxaCancel} anterior={taxaCancelAnterior} />}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Visão geral de vendas */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><BarChart3 className="h-4 w-4 text-orange-600" /> Visão geral de vendas</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {([
                ['Faturamento', data.daily.map((d) => d.total), (v: number) => fmtR$(v), 'stroke-orange-500', 'bg-orange-500'],
                ['Pedidos', data.daily.map((d) => d.pedidos), (v: number) => `${v} pedidos`, 'stroke-blue-500', 'bg-blue-500'],
                ['Ticket médio', data.daily.map((d) => d.ticketMedio), (v: number) => fmtR$(v), 'stroke-purple-500', 'bg-purple-500'],
                ['Clientes novos', data.daily.map((d) => d.clientesNovos), (v: number) => `${v} clientes`, 'stroke-emerald-500', 'bg-emerald-500'],
              ] as [string, number[], (v: number) => string, string, string][]).map(([label, serie, fmt, stroke, bg]) => {
                const total = serie.reduce((s, v) => s + v, 0);
                const media = serie.length > 0 ? total / serie.length : 0;
                return (
                  <div key={label}>
                    <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
                    <p className="text-lg font-bold text-gray-800 mb-2">{fmt(label === 'Ticket médio' ? media : total)}</p>
                    <LineChart labels={data.daily.map((d) => formatDataCurta(d.date))} series={[{ label, data: serie, colorClass: bg, strokeClass: stroke }]} />
                  </div>
                );
              })}
            </div>
            {data.daily.length === 0 && <p className="text-center text-gray-400 text-sm py-6">Nenhuma venda entregue neste período</p>}
          </div>

          {/* Vendas detalhadas */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <h3 className="font-bold text-gray-800 mb-4">Vendas por forma de pagamento</h3>
              <DonutChart
                segments={data.byPayment.map((p, i) => ({
                  label: FORMA_PAGAMENTO_LABELS[p.formaPagamento as FormaPagamento] || p.formaPagamento,
                  value: p.total, colorClass: DONUT_CORES[i % DONUT_CORES.length], strokeClass: DONUT_STROKES[i % DONUT_STROKES.length],
                }))}
                formatValue={(v) => fmtR$(v)}
              />
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 text-sm">
                <span className="text-gray-500">Total</span><span className="font-bold text-gray-800">{fmtR$(data.byPayment.reduce((s, p) => s + p.total, 0))}</span>
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><Layers className="h-4 w-4 text-orange-600" /> Vendas por tipo de pedido</h3>
              <DonutChart
                segments={data.porTipoPedido.map((t, i) => ({
                  label: TIPO_PEDIDO_LABELS[t.tipoPedido] || t.tipoPedido,
                  value: t.total, colorClass: DONUT_CORES[i % DONUT_CORES.length], strokeClass: DONUT_STROKES[i % DONUT_STROKES.length],
                }))}
                formatValue={(v) => fmtR$(v)}
              />
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 text-sm">
                <span className="text-gray-500">Total</span><span className="font-bold text-gray-800">{fmtR$(data.porTipoPedido.reduce((s, t) => s + t.total, 0))}</span>
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><Grid3x3 className="h-4 w-4 text-orange-600" /> Vendas por período do dia</h3>
              {dashboard ? <HeatmapGrid data={dashboard.heatmap} /> : <p className="text-center text-gray-400 text-sm py-10">Carregando...</p>}
            </div>
          </div>

          {/* Desempenho de produtos */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-800 flex items-center gap-2"><Trophy className="h-4 w-4 text-orange-600" /> Produtos mais vendidos</h3>
                <button onClick={() => abrirRelatorioSimples('Produtos mais vendidos', tabelaProdutos(data.topProdutos))} className="text-xs text-orange-600 hover:underline flex items-center gap-0.5 shrink-0">Ver relatório completo <ArrowRight className="h-3 w-3" /></button>
              </div>
              <div className="space-y-2">
                {data.topProdutos.slice(0, 5).map((p, i) => (
                  <div key={p.produtoId} className="flex items-center gap-2.5 text-sm">
                    <span className="w-5 text-xs font-bold text-gray-400 shrink-0">{i + 1}º</span>
                    <span className="text-gray-700 truncate flex-1 min-w-0">{p.nome}</span>
                    <span className="text-gray-400 text-xs shrink-0">{p.quantidade} un.</span>
                    <span className="font-bold text-gray-800 shrink-0">{fmtR$(p.receita)}</span>
                  </div>
                ))}
                {data.topProdutos.length === 0 && <p className="text-center text-gray-400 text-sm py-6">Nenhuma venda no período</p>}
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <h3 className="font-bold text-gray-800 mb-4">Categorias mais vendidas</h3>
              {dashboard ? (
                <DonutChart
                  segments={dashboard.porCategoria.map((c, i) => ({
                    label: c.nome, value: c.receita, colorClass: DONUT_CORES[i % DONUT_CORES.length], strokeClass: DONUT_STROKES[i % DONUT_STROKES.length],
                  }))}
                  formatValue={(v) => fmtR$(v)}
                />
              ) : <p className="text-center text-gray-400 text-sm py-10">Carregando...</p>}
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-bold text-gray-800 flex items-center gap-2"><BarChart3 className="h-4 w-4 text-orange-600" /> Curva ABC de produtos</h3>
                <button onClick={() => abrirRelatorioSimples('Curva ABC de produtos', tabelaCurvaAbc(data.curvaAbc))} className="text-xs text-orange-600 hover:underline flex items-center gap-0.5 shrink-0">Ver relatório completo <ArrowRight className="h-3 w-3" /></button>
              </div>
              <p className="text-xs text-gray-500 mb-3">A = até 80% da receita, B = até 95%, C = o restante.</p>
              <div className="space-y-1.5">
                {(['A', 'B', 'C'] as const).map((classe) => {
                  const itens = data.curvaAbc.filter((p) => p.classe === classe);
                  const receita = itens.reduce((s, p) => s + p.receita, 0);
                  return (
                    <div key={classe} className="flex items-center justify-between text-sm">
                      <span className={`inline-flex items-center justify-center h-6 w-6 rounded-full text-xs font-bold ${CLASSE_ABC_COLORS[classe]}`}>{classe}</span>
                      <span className="text-gray-500 text-xs">{itens.length} produtos</span>
                      <span className="font-bold text-gray-800">{fmtR$(receita)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Clientes */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><Users className="h-4 w-4 text-orange-600" /> Clientes recorrentes vs novos</h3>
              <DonutChart
                segments={[
                  { label: 'Novos', value: data.novosVsRecorrentes.novos, colorClass: 'bg-blue-500', strokeClass: 'stroke-blue-500' },
                  { label: 'Recorrentes', value: data.novosVsRecorrentes.recorrentes, colorClass: 'bg-rose-500', strokeClass: 'stroke-rose-500' },
                ]}
                centerLabel="clientes"
              />
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-800">Top clientes por gasto</h3>
                <button onClick={() => abrirRelatorioSimples('Top clientes por gasto', tabelaTopClientes(data.topClientesPorGasto))} className="text-xs text-orange-600 hover:underline flex items-center gap-0.5 shrink-0">Ver relatório completo <ArrowRight className="h-3 w-3" /></button>
              </div>
              <div className="space-y-2">
                {data.topClientesPorGasto.slice(0, 5).map((c, i) => (
                  <div key={c.clienteId} className="flex items-center gap-2.5 text-sm">
                    <span className="w-5 text-xs font-bold text-gray-400 shrink-0">{i + 1}º</span>
                    <span className="text-gray-700 truncate flex-1 min-w-0">{c.nome}</span>
                    <span className="font-bold text-gray-800 shrink-0">{fmtR$(c.gasto)}</span>
                  </div>
                ))}
                {data.topClientesPorGasto.length === 0 && <p className="text-center text-gray-400 text-sm py-6">Nenhum cliente identificado no período</p>}
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <h3 className="font-bold text-gray-800 mb-4">Clientes por frequência</h3>
              {(() => {
                const f = data.clientesPorFrequencia;
                const totalClientes = f.umPedido + f.doisACinco + f.seisADez + f.onzeOuMais;
                const linhas: [string, number][] = [
                  ['1 pedido', f.umPedido], ['2 a 5 pedidos', f.doisACinco], ['6 a 10 pedidos', f.seisADez], ['11 ou mais pedidos', f.onzeOuMais],
                ];
                return (
                  <div className="space-y-2.5">
                    {linhas.map(([label, qtd]) => {
                      const pct = totalClientes > 0 ? (qtd / totalClientes) * 100 : 0;
                      return (
                        <div key={label}>
                          <div className="flex items-center justify-between text-xs mb-1"><span className="text-gray-600">{label}</span><span className="font-medium text-gray-800">{qtd} ({pct.toFixed(1)}%)</span></div>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden"><div className="h-full rounded-full bg-orange-500" style={{ width: `${pct}%` }} /></div>
                        </div>
                      );
                    })}
                    <p className="text-xs text-gray-400 pt-1">Total {totalClientes} clientes</p>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Delivery e entregas */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><Truck className="h-4 w-4 text-orange-600" /> Entregas por status</h3>
              <DonutChart
                segments={[
                  { label: 'Entregues', value: data.porStatus.find((s) => s.status === 'ENTREGUE')?.quantidade || 0, colorClass: 'bg-emerald-500', strokeClass: 'stroke-emerald-500' },
                  { label: 'Canceladas', value: data.porStatus.find((s) => s.status === 'CANCELADO')?.quantidade || 0, colorClass: 'bg-red-400', strokeClass: 'stroke-red-400' },
                ]}
                centerLabel="entregas"
              />
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col items-center justify-center text-center">
              <p className="text-sm text-gray-500 mb-2 flex items-center gap-1.5"><Timer className="h-4 w-4" /> Tempo médio de entrega</p>
              <p className="text-3xl font-bold text-gray-800">{dashboard?.tempoMedioEntregaMin != null ? `${dashboard.tempoMedioEntregaMin.toFixed(0)} min` : '—'}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col items-center justify-center text-center">
              <p className="text-sm text-gray-500 mb-2">Taxa de entrega no prazo</p>
              <p className="text-3xl font-bold text-emerald-600">{dashboard?.entregasNoPrazoPercent != null ? `${dashboard.entregasNoPrazoPercent.toFixed(1)}%` : '—'}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-800 flex items-center gap-2"><MapPin className="h-4 w-4 text-orange-600" /> Entregas por bairro</h3>
                <button onClick={() => abrirRelatorioSimples('Entregas por bairro', tabelaBairros(data.porBairro))} className="text-xs text-orange-600 hover:underline flex items-center gap-0.5 shrink-0">Ver relatório completo <ArrowRight className="h-3 w-3" /></button>
              </div>
              <div className="space-y-1.5">
                {data.porBairro.slice(0, 5).map((b) => (
                  <div key={b.bairro} className="flex items-center justify-between text-sm">
                    <span className="text-gray-700 truncate">{b.bairro}</span>
                    <span className="font-bold text-gray-800 shrink-0">{b.pedidos}</span>
                  </div>
                ))}
                {data.porBairro.length === 0 && <p className="text-center text-gray-400 text-sm py-6">Nenhuma entrega no período</p>}
              </div>
            </div>
          </div>

          {/* Financeiro */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-800 flex items-center gap-2"><Wallet className="h-4 w-4 text-orange-600" /> Resumo financeiro</h3>
                {onAbrirFinanceiro && <button onClick={onAbrirFinanceiro} className="text-xs text-orange-600 hover:underline flex items-center gap-0.5 shrink-0">Ver relatório completo <ArrowRight className="h-3 w-3" /></button>}
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between"><span className="text-gray-500">Faturamento bruto</span><span className="font-bold text-gray-800">{fmtR$(data.totalRevenue)}</span></div>
                <div className="flex items-center justify-between"><span className="text-gray-500">Descontos (cupons)</span><span className="font-bold text-red-500">- {fmtR$(data.descontosTotais)}</span></div>
                {data.mostrarComissao && <div className="flex items-center justify-between"><span className="text-gray-500">Comissão da plataforma</span><span className="font-bold text-red-500">- {fmtR$(data.comissaoValor)}</span></div>}
                <div className="flex items-center justify-between pt-2 border-t border-gray-100"><span className="text-gray-700 font-medium">Total líquido</span><span className="font-bold text-gray-800">{fmtR$(data.totalRevenue - data.descontosTotais - (data.mostrarComissao ? data.comissaoValor : 0))}</span></div>
              </div>
            </div>
            <RelatorioFinanceiroMini empresaId={empresaId} de={getRange().de} ate={getRange().ate} />
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <h3 className="font-bold text-gray-800 mb-4">Formas de pagamento</h3>
              <table className="w-full text-sm">
                <thead><tr className="text-left text-gray-500"><th className="pb-2">Forma</th><th className="pb-2">Valor</th><th className="pb-2">%</th></tr></thead>
                <tbody>
                  {data.byPayment.map((p) => {
                    const total = data.byPayment.reduce((s, x) => s + x.total, 0);
                    return (
                      <tr key={p.formaPagamento} className="border-t border-gray-100">
                        <td className="py-1.5">{FORMA_PAGAMENTO_LABELS[p.formaPagamento as FormaPagamento] || p.formaPagamento}</td>
                        <td className="py-1.5 font-bold text-gray-800">{fmtR$(p.total)}</td>
                        <td className="py-1.5 text-gray-500">{total > 0 ? ((p.total / total) * 100).toFixed(1) : 0}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {data.mostrarComissao && (
            <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6">
              <h3 className="font-bold text-gray-800 mb-1 flex items-center gap-2"><Percent className="h-4 w-4 text-orange-600" /> Comissão da plataforma</h3>
              <p className="text-xs text-gray-500 mb-4">Percentual definido pela plataforma sobre as vendas entregues no período selecionado.</p>
              <div className="flex flex-wrap items-center gap-4">
                <div className="bg-gray-100 rounded-xl px-5 py-3"><p className="text-xs text-gray-500 mb-0.5">Percentual contratado</p><p className="text-xl font-bold text-gray-800">{data.comissaoPercent.toFixed(1)}%</p></div>
                <div className="bg-orange-50 border border-orange-200 rounded-xl px-5 py-3"><p className="text-xs text-orange-700 mb-0.5">Comissão do período selecionado</p><p className="text-xl font-bold text-orange-700">{fmtR$(data.comissaoValor)}</p></div>
              </div>
            </div>
          )}

          <IndicacaoEmpresaCard empresaId={empresaId} />

          <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><Clock3 className="h-4 w-4 text-orange-600" /> Horários de pico</h3>
            <SimpleBarChart data={data.porHora.map((h) => ({ label: `${h.hora}h`, value: h.pedidos }))} formatValue={(v) => `${v} pedido${v === 1 ? '' : 's'}`} />
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><CalendarDays className="h-4 w-4 text-orange-600" /> Pedidos por dia da semana</h3>
            <SimpleBarChart data={data.porDiaSemana.map((d) => ({ label: DIAS_SEMANA[d.dia], value: d.pedidos }))} formatValue={(v) => `${v} pedido${v === 1 ? '' : 's'}`} />
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6">
            <h3 className="font-bold text-gray-800 mb-4">Valores a Pagar por Motoboy (no período)</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-gray-200 text-left text-gray-500"><th className="py-2 px-3">Motoboy</th><th className="py-2 px-3">Corridas concluídas</th><th className="py-2 px-3">Canceladas</th><th className="py-2 px-3">Total a pagar</th></tr></thead>
                <tbody>
                  {data.motoboyClosing.map((m) => (
                    <tr key={m.motoboyId} className="border-b border-gray-100">
                      <td className="py-2 px-3 font-medium">{m.motoboyNome}</td>
                      <td className="py-2 px-3">{m.corridasConcluidas}</td>
                      <td className="py-2 px-3">{m.corridasCanceladas}</td>
                      <td className="py-2 px-3 font-bold text-orange-600">{fmtR$(m.totalAPagar)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {data.motoboyClosing.length === 0 && <p className="text-center text-gray-400 text-sm py-6">Nenhuma corrida neste período</p>}
            </div>
          </div>

          {/* Outros relatórios */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><FileText className="h-4 w-4 text-orange-600" /> Outros relatórios</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {outrosRelatorios.map((r) => (
                <div key={r.id} className="border border-gray-200 rounded-xl p-4">
                  <r.icone className={`h-5 w-5 mb-2 ${r.cor}`} />
                  <p className="font-bold text-gray-800 text-sm mb-1">{r.titulo}</p>
                  <p className="text-xs text-gray-500 mb-3">{r.descricao}</p>
                  <button
                    onClick={r.abrir}
                    disabled={carregandoRelatorio === r.id}
                    className="text-xs font-medium text-orange-600 hover:underline flex items-center gap-1 disabled:opacity-60"
                  >
                    {carregandoRelatorio === r.id ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                    {r.id === 'exportacao' ? 'Exportar CSVs' : 'Ver relatório'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <RelatorioModal isOpen={!!relatorio} onClose={() => setRelatorio(null)} titulo={relatorio?.titulo || ''} periodoLabel={periodoLabel}>
        {relatorio?.conteudo}
      </RelatorioModal>
    </div>
  );
};

const tabelaProdutos = (produtos: CrmSummary['topProdutos']) => (
  <table className="w-full text-sm">
    <thead><tr className="border-b border-gray-200 text-left text-gray-500"><th className="py-2 px-3">#</th><th className="py-2 px-3">Produto</th><th className="py-2 px-3">Unidades</th><th className="py-2 px-3">Receita</th></tr></thead>
    <tbody>
      {produtos.map((p, i) => (
        <tr key={p.produtoId} className="border-b border-gray-100">
          <td className="py-2 px-3 text-gray-400">{i + 1}º</td>
          <td className="py-2 px-3 font-medium">{p.nome}</td>
          <td className="py-2 px-3">{p.quantidade}</td>
          <td className="py-2 px-3 font-bold text-orange-600">{fmtR$(p.receita)}</td>
        </tr>
      ))}
    </tbody>
  </table>
);

const tabelaCurvaAbc = (curva: CrmSummary['curvaAbc']) => (
  <table className="w-full text-sm">
    <thead><tr className="border-b border-gray-200 text-left text-gray-500"><th className="py-2 px-3">#</th><th className="py-2 px-3">Produto</th><th className="py-2 px-3">Unidades</th><th className="py-2 px-3">Receita</th><th className="py-2 px-3">% Acumulado</th><th className="py-2 px-3">Classe</th></tr></thead>
    <tbody>
      {curva.map((p, i) => (
        <tr key={p.produtoId || p.nome} className="border-b border-gray-100">
          <td className="py-2 px-3 text-gray-400">{i + 1}º</td>
          <td className="py-2 px-3 font-medium">{p.nome}</td>
          <td className="py-2 px-3">{p.quantidade}</td>
          <td className="py-2 px-3 font-bold text-orange-600">{fmtR$(p.receita)}</td>
          <td className="py-2 px-3 text-gray-500">{p.percentualAcumulado.toFixed(1)}%</td>
          <td className="py-2 px-3"><span className={`inline-flex items-center justify-center h-6 w-6 rounded-full text-xs font-bold ${CLASSE_ABC_COLORS[p.classe]}`}>{p.classe}</span></td>
        </tr>
      ))}
    </tbody>
  </table>
);

const tabelaTopClientes = (clientes: CrmSummary['topClientesPorGasto']) => (
  <table className="w-full text-sm">
    <thead><tr className="border-b border-gray-200 text-left text-gray-500"><th className="py-2 px-3">#</th><th className="py-2 px-3">Cliente</th><th className="py-2 px-3">Pedidos</th><th className="py-2 px-3">Gasto total</th></tr></thead>
    <tbody>
      {clientes.map((c, i) => (
        <tr key={c.clienteId} className="border-b border-gray-100">
          <td className="py-2 px-3 text-gray-400">{i + 1}º</td>
          <td className="py-2 px-3 font-medium">{c.nome}</td>
          <td className="py-2 px-3">{c.pedidos}</td>
          <td className="py-2 px-3 font-bold text-orange-600">{fmtR$(c.gasto)}</td>
        </tr>
      ))}
    </tbody>
  </table>
);

const tabelaBairros = (bairros: CrmSummary['porBairro']) => (
  <table className="w-full text-sm">
    <thead><tr className="border-b border-gray-200 text-left text-gray-500"><th className="py-2 px-3">Bairro</th><th className="py-2 px-3">Pedidos</th><th className="py-2 px-3">Total</th></tr></thead>
    <tbody>
      {bairros.map((b) => (
        <tr key={b.bairro} className="border-b border-gray-100">
          <td className="py-2 px-3 font-medium">{b.bairro}</td>
          <td className="py-2 px-3">{b.pedidos}</td>
          <td className="py-2 px-3 font-bold text-orange-600">{fmtR$(b.total)}</td>
        </tr>
      ))}
    </tbody>
  </table>
);

/** Mini-painel "Entradas vs Saídas" do bloco Financeiro — busca o fluxo de caixa real (Resumo
 * Financeiro) recortado pro mesmo período selecionado aqui, em vez de duplicar essa lógica. */
const RelatorioFinanceiroMini: React.FC<{ empresaId: string; de: string; ate: string }> = ({ empresaId, de, ate }) => {
  const [pontos, setPontos] = useState<{ label: string; entradas: number; saidas: number; saldoAcumulado: number }[] | null>(null);

  useEffect(() => {
    let ativo = true;
    fetchFinanceiroResumo(empresaId, de, ate)
      .then((r) => {
        if (!ativo) return;
        setPontos(r.fluxoPorDia.filter((p) => p.data >= de && p.data <= ate).map((p) => ({
          label: formatDataCurta(p.data), entradas: p.entradas, saidas: p.saidas, saldoAcumulado: p.saldoAcumulado,
        })));
      })
      .catch(() => setPontos([]));
    return () => { ativo = false; };
  }, [empresaId, de, ate]);

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5">
      <h3 className="font-bold text-gray-800 mb-4">Entradas vs saídas</h3>
      {pontos ? <CashFlowChart data={pontos} /> : <p className="text-center text-gray-400 text-sm py-10">Carregando...</p>}
    </div>
  );
};

export default CrmTab;
