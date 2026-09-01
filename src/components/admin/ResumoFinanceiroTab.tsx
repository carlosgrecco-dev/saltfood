import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Wallet, TrendingDown, Scale, ShoppingCart, Receipt, XCircle, Printer, Download, Bike, Clock,
  Package, Target, Plus, Trash2, Loader2, ArrowRight, BarChart3, CalendarClock, AlertTriangle,
} from 'lucide-react';
import { fetchFinanceiroResumo, fetchMetas, salvarMetas } from '../../lib/financeiro';
import { fetchMovimentosCaixa } from '../../lib/movimentosCaixa';
import { fetchProdutos } from '../../lib/produtos';
import { FinanceiroResumo, MetasResumo } from '../../types/Financeiro';
import { Produto } from '../../types/Produto';
import { CATEGORIA_MOVIMENTO_LABELS } from '../../types/MovimentoCaixa';
import TrendBadge from '../TrendBadge';
import DonutChart from '../DonutChart';
import CashFlowChart from '../CashFlowChart';
import BottomSheet from '../BottomSheet';

interface ResumoFinanceiroTabProps {
  empresaId: string;
  onAbrirRelatorios?: () => void;
}

type Periodo = 'hoje' | 'ontem' | 'semana' | 'mes' | 'esteMes' | 'mesPassado' | 'personalizado';
type GranularidadeFluxo = 'hoje' | 'semana' | 'mes';

const PERIODOS: { id: Periodo; label: string }[] = [
  { id: 'hoje', label: 'Hoje' },
  { id: 'ontem', label: 'Ontem' },
  { id: 'semana', label: '7 dias' },
  { id: 'mes', label: '30 dias' },
  { id: 'esteMes', label: 'Este mês' },
  { id: 'mesPassado', label: 'Mês passado' },
  { id: 'personalizado', label: 'Personalizado' },
];

const FORMA_PAGAMENTO_LABELS: Record<string, string> = { PIX: 'PIX', DINHEIRO: 'Dinheiro', CARTAO: 'Cartão', MULTIPLO: 'Múltiplo' };
const FORMA_PAGAMENTO_CORES: Record<string, { colorClass: string; strokeClass: string }> = {
  PIX: { colorClass: 'bg-emerald-500', strokeClass: 'stroke-emerald-500' },
  DINHEIRO: { colorClass: 'bg-amber-500', strokeClass: 'stroke-amber-500' },
  CARTAO: { colorClass: 'bg-blue-500', strokeClass: 'stroke-blue-500' },
  MULTIPLO: { colorClass: 'bg-purple-500', strokeClass: 'stroke-purple-500' },
};

const CATEGORIA_SAIDA_LABELS: Record<string, string> = {
  MOTOBOYS: 'Pagamentos a motoboys',
  SANGRIAS: 'Sangrias / Retiradas',
  ...CATEGORIA_MOVIMENTO_LABELS,
};
const CATEGORIA_SAIDA_CORES: Record<string, { colorClass: string; strokeClass: string }> = {
  MOTOBOYS: { colorClass: 'bg-blue-500', strokeClass: 'stroke-blue-500' },
  SANGRIAS: { colorClass: 'bg-purple-500', strokeClass: 'stroke-purple-500' },
  COMPRAS_ESTOQUE: { colorClass: 'bg-amber-500', strokeClass: 'stroke-amber-500' },
  TAXAS_TARIFAS: { colorClass: 'bg-rose-500', strokeClass: 'stroke-rose-500' },
  OUTROS: { colorClass: 'bg-gray-400', strokeClass: 'stroke-gray-400' },
};

const todayISO = () => new Date().toISOString().slice(0, 10);
const addDays = (str: string, delta: number) => {
  const d = new Date(`${str}T00:00:00`);
  d.setDate(d.getDate() + delta);
  return d.toISOString().slice(0, 10);
};

const getRange = (periodo: Periodo, customDe: string, customAte: string): { de: string; ate: string } => {
  const hoje = todayISO();
  switch (periodo) {
    case 'hoje':
      return { de: hoje, ate: hoje };
    case 'ontem': {
      const ontem = addDays(hoje, -1);
      return { de: ontem, ate: ontem };
    }
    case 'semana':
      return { de: addDays(hoje, -6), ate: hoje };
    case 'mes':
      return { de: addDays(hoje, -29), ate: hoje };
    case 'esteMes': {
      const d = new Date();
      return { de: new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10), ate: hoje };
    }
    case 'mesPassado': {
      const d = new Date();
      const primeiro = new Date(d.getFullYear(), d.getMonth() - 1, 1);
      const ultimo = new Date(d.getFullYear(), d.getMonth(), 0);
      return { de: primeiro.toISOString().slice(0, 10), ate: ultimo.toISOString().slice(0, 10) };
    }
    case 'personalizado':
      return { de: customDe, ate: customAte };
  }
};

const formatHora = (h: number) => `${String(h).padStart(2, '0')}h`;
const formatDiaCurto = (iso: string) => {
  const [, mes, dia] = iso.split('-');
  return `${dia}/${mes}`;
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

const ResumoFinanceiroTab: React.FC<ResumoFinanceiroTabProps> = ({ empresaId, onAbrirRelatorios }) => {
  const [periodo, setPeriodo] = useState<Periodo>('hoje');
  const [customDe, setCustomDe] = useState(todayISO());
  const [customAte, setCustomAte] = useState(todayISO());
  const [granularidadeFluxo, setGranularidadeFluxo] = useState<GranularidadeFluxo>('hoje');

  const [resumo, setResumo] = useState<FinanceiroResumo | null>(null);
  const [loading, setLoading] = useState(true);
  const [exportando, setExportando] = useState(false);

  const [metas, setMetas] = useState<MetasResumo | null>(null);
  const [metasAbertas, setMetasAbertas] = useState(false);
  const [salvandoMetas, setSalvandoMetas] = useState(false);
  const [draftFaturamento, setDraftFaturamento] = useState('');
  const [draftPedidos, setDraftPedidos] = useState('');
  const [draftTicketMedio, setDraftTicketMedio] = useState('');
  const [draftProdutos, setDraftProdutos] = useState<{ produtoId: string; nome: string; valorAlvo: string }[]>([]);
  const [produtosLoja, setProdutosLoja] = useState<Produto[]>([]);
  const [produtoParaAdicionar, setProdutoParaAdicionar] = useState('');

  const { de, ate } = useMemo(() => getRange(periodo, customDe, customAte), [periodo, customDe, customAte]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setResumo(await fetchFinanceiroResumo(empresaId, de, ate));
    } catch {
      setResumo(null);
    } finally {
      setLoading(false);
    }
  }, [empresaId, de, ate]);

  useEffect(() => {
    load();
  }, [load]);

  const loadMetas = useCallback(async () => {
    try {
      setMetas(await fetchMetas(empresaId));
    } catch {
      setMetas(null);
    }
  }, [empresaId]);

  useEffect(() => {
    loadMetas();
  }, [loadMetas]);

  const handleAbrirMetas = async () => {
    if (metas) {
      setDraftFaturamento(metas.faturamento.valorAlvo > 0 ? String(metas.faturamento.valorAlvo) : '');
      setDraftPedidos(metas.pedidos.valorAlvo > 0 ? String(metas.pedidos.valorAlvo) : '');
      setDraftTicketMedio(metas.ticketMedio.valorAlvo > 0 ? String(metas.ticketMedio.valorAlvo) : '');
      setDraftProdutos(metas.produtos.map((p) => ({ produtoId: p.produtoId, nome: p.nome, valorAlvo: String(p.valorAlvo) })));
    }
    if (produtosLoja.length === 0) {
      try {
        setProdutosLoja(await fetchProdutos(empresaId, true));
      } catch {
        setProdutosLoja([]);
      }
    }
    setMetasAbertas(true);
  };

  const handleAdicionarProdutoMeta = () => {
    if (!produtoParaAdicionar) return;
    const produto = produtosLoja.find((p) => p.id === produtoParaAdicionar);
    if (!produto || draftProdutos.some((p) => p.produtoId === produto.id)) return;
    setDraftProdutos((prev) => [...prev, { produtoId: produto.id, nome: produto.nome, valorAlvo: '' }]);
    setProdutoParaAdicionar('');
  };

  const handleSalvarMetas = async () => {
    setSalvandoMetas(true);
    try {
      await salvarMetas(empresaId, {
        faturamento: draftFaturamento ? Number(draftFaturamento) : null,
        pedidos: draftPedidos ? Number(draftPedidos) : null,
        ticketMedio: draftTicketMedio ? Number(draftTicketMedio) : null,
        produtos: draftProdutos.filter((p) => p.valorAlvo).map((p) => ({ produtoId: p.produtoId, valorAlvo: Number(p.valorAlvo) })),
      });
      setMetasAbertas(false);
      await loadMetas();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Não foi possível salvar as metas.');
    } finally {
      setSalvandoMetas(false);
    }
  };

  const handleExportar = async () => {
    setExportando(true);
    try {
      const movimentos = await fetchMovimentosCaixa(empresaId, { de, ate });
      const linhas = movimentos.map((m) => [
        m.tipo, m.descricao || '', m.formaPagamento || '', m.valor.toFixed(2), new Date(m.createdAt).toLocaleString('pt-BR'),
      ]);
      downloadCsv(`financeiro-${de}-a-${ate}.csv`, [['Tipo', 'Descrição', 'Forma de pagamento', 'Valor', 'Data/Hora'], ...linhas]);
    } catch {
      alert('Não foi possível exportar os movimentos.');
    } finally {
      setExportando(false);
    }
  };

  if (loading || !resumo) {
    return <p className="text-center text-gray-500 py-8">Carregando...</p>;
  }

  const { stats, resumoGeral, alertas } = resumo;

  const fluxoData = (
    granularidadeFluxo === 'hoje'
      ? resumo.fluxoPorHora.map((p) => ({ label: formatHora(p.hora), entradas: p.entradas, saidas: p.saidas, saldoAcumulado: p.saldoAcumulado }))
      : granularidadeFluxo === 'semana'
      ? resumo.fluxoPorDia.slice(-7).map((p) => ({ label: formatDiaCurto(p.data), entradas: p.entradas, saidas: p.saidas, saldoAcumulado: p.saldoAcumulado }))
      : resumo.fluxoPorDia.map((p) => ({ label: formatDiaCurto(p.data), entradas: p.entradas, saidas: p.saidas, saldoAcumulado: p.saldoAcumulado }))
  );

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex flex-wrap items-center gap-2">
          {PERIODOS.map((p) => (
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
        <div className="flex items-center gap-2">
          <button onClick={() => window.print()} className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium bg-gray-100 hover:bg-gray-200 text-gray-700">
            <Printer className="h-3.5 w-3.5" /> Imprimir
          </button>
          <button
            onClick={handleExportar}
            disabled={exportando}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium bg-gray-800 hover:bg-gray-900 text-white disabled:opacity-60"
          >
            {exportando ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />} Exportar
          </button>
        </div>
      </div>

      {periodo === 'personalizado' && (
        <div className="flex flex-wrap items-center gap-3 mb-6 bg-gray-50 p-4 rounded-xl">
          <div>
            <label className="block text-xs text-gray-500 mb-1">De</label>
            <input type="date" value={customDe} onChange={(e) => setCustomDe(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Até</label>
            <input type="date" value={customAte} onChange={(e) => setCustomAte(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-2xl p-4">
          <p className="text-emerald-100 text-xs mb-1 flex items-center gap-1"><Wallet className="h-3.5 w-3.5" /> Entradas</p>
          <p className="text-xl font-bold">R$ {stats.entradas.atual.toFixed(2)}</p>
          <TrendBadge atual={stats.entradas.atual} anterior={stats.entradas.anterior} variante="escuro" />
        </div>
        <div className="bg-gradient-to-br from-red-500 to-rose-600 text-white rounded-2xl p-4">
          <p className="text-red-100 text-xs mb-1 flex items-center gap-1"><TrendingDown className="h-3.5 w-3.5" /> Saídas / Sangrias</p>
          <p className="text-xl font-bold">R$ {stats.saidas.atual.toFixed(2)}</p>
          <TrendBadge atual={stats.saidas.atual} anterior={stats.saidas.anterior} variante="escuro" />
        </div>
        <div className="bg-gray-800 text-white rounded-2xl p-4">
          <p className="text-gray-300 text-xs mb-1 flex items-center gap-1"><Scale className="h-3.5 w-3.5" /> Saldo do período</p>
          <p className="text-xl font-bold">R$ {stats.saldo.atual.toFixed(2)}</p>
          <TrendBadge atual={stats.saldo.atual} anterior={stats.saldo.anterior} variante="escuro" />
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <p className="text-gray-500 text-xs mb-1 flex items-center gap-1"><ShoppingCart className="h-3.5 w-3.5" /> Pedidos pagos</p>
          <p className="text-xl font-bold text-gray-800">{stats.pedidosPagos.atual}</p>
          <TrendBadge atual={stats.pedidosPagos.atual} anterior={stats.pedidosPagos.anterior} />
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <p className="text-gray-500 text-xs mb-1 flex items-center gap-1"><Receipt className="h-3.5 w-3.5" /> Ticket médio</p>
          <p className="text-xl font-bold text-gray-800">R$ {stats.ticketMedio.atual.toFixed(2)}</p>
          <TrendBadge atual={stats.ticketMedio.atual} anterior={stats.ticketMedio.anterior} />
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <p className="text-gray-500 text-xs mb-1 flex items-center gap-1"><XCircle className="h-3.5 w-3.5" /> Taxa de cancelamento</p>
          <p className="text-xl font-bold text-gray-800">{stats.taxaCancelamentoPercent.atual.toFixed(2)}%</p>
          <TrendBadge atual={stats.taxaCancelamentoPercent.atual} anterior={stats.taxaCancelamentoPercent.anterior} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="font-bold text-gray-800">Fluxo de caixa</p>
            <select
              value={granularidadeFluxo}
              onChange={(e) => setGranularidadeFluxo(e.target.value as GranularidadeFluxo)}
              className="text-xs border border-gray-300 rounded-lg px-2 py-1.5 bg-white"
            >
              <option value="hoje">Hoje</option>
              <option value="semana">7 dias</option>
              <option value="mes">30 dias</option>
            </select>
          </div>
          <CashFlowChart data={fluxoData} />
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <p className="font-bold text-gray-800 mb-3">Entradas por forma de pagamento</p>
          <DonutChart
            segments={resumo.entradasPorFormaPagamento.map((f) => ({
              label: FORMA_PAGAMENTO_LABELS[f.formaPagamento] || f.formaPagamento,
              value: f.valor,
              colorClass: FORMA_PAGAMENTO_CORES[f.formaPagamento]?.colorClass || 'bg-gray-400',
              strokeClass: FORMA_PAGAMENTO_CORES[f.formaPagamento]?.strokeClass || 'stroke-gray-400',
            }))}
            formatValue={(v) => `R$ ${v.toFixed(0)}`}
          />
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 text-sm">
            <span className="text-gray-500">Total</span>
            <span className="font-bold text-gray-800">R$ {resumo.entradasPorFormaPagamento.reduce((s, f) => s + f.valor, 0).toFixed(2)}</span>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <p className="font-bold text-gray-800 mb-3">Saídas por categoria</p>
          <DonutChart
            segments={resumo.saidasPorCategoria.filter((c) => c.valor > 0).map((c) => ({
              label: CATEGORIA_SAIDA_LABELS[c.categoria] || c.categoria,
              value: c.valor,
              colorClass: CATEGORIA_SAIDA_CORES[c.categoria]?.colorClass || 'bg-gray-400',
              strokeClass: CATEGORIA_SAIDA_CORES[c.categoria]?.strokeClass || 'stroke-gray-400',
            }))}
            formatValue={(v) => `R$ ${v.toFixed(0)}`}
          />
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 text-sm">
            <span className="text-gray-500">Total</span>
            <span className="font-bold text-gray-800">R$ {resumo.saidasPorCategoria.reduce((s, c) => s + c.valor, 0).toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4 mb-6 items-start">
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <p className="font-bold text-gray-800">Movimentações recentes</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-gray-500 bg-gray-50">
                  <th className="py-2.5 px-4">Tipo</th>
                  <th className="py-2.5 px-4">Descrição</th>
                  <th className="py-2.5 px-4">Categoria</th>
                  <th className="py-2.5 px-4">Forma</th>
                  <th className="py-2.5 px-4">Valor</th>
                  <th className="py-2.5 px-4">Data / Hora</th>
                  <th className="py-2.5 px-4">Usuário</th>
                </tr>
              </thead>
              <tbody>
                {resumo.movimentacoesRecentes.map((m) => (
                  <tr key={m.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-2.5 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${m.tipo === 'ENTRADA' ? 'bg-emerald-100 text-emerald-800' : m.tipo === 'SANGRIA' ? 'bg-purple-100 text-purple-800' : 'bg-red-100 text-red-800'}`}>
                        {m.tipo === 'ENTRADA' ? 'Entrada' : m.tipo === 'SANGRIA' ? 'Sangria' : 'Saída'}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-gray-700 max-w-[220px] truncate">{m.descricao}</td>
                    <td className="py-2.5 px-4 text-gray-500 text-xs">{m.categoria ? (CATEGORIA_SAIDA_LABELS[m.categoria] || m.categoria) : '—'}</td>
                    <td className="py-2.5 px-4 text-gray-500 text-xs">{m.formaPagamento ? FORMA_PAGAMENTO_LABELS[m.formaPagamento] : '—'}</td>
                    <td className={`py-2.5 px-4 font-bold ${m.tipo === 'ENTRADA' ? 'text-emerald-600' : 'text-red-600'}`}>
                      {m.tipo === 'ENTRADA' ? '+' : '-'} R$ {m.valor.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-4 text-gray-500 text-xs">{new Date(m.data).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</td>
                    <td className="py-2.5 px-4 text-gray-500 text-xs">{m.usuario}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {resumo.movimentacoesRecentes.length === 0 && <p className="text-center text-gray-500 py-8">Nenhuma movimentação ainda.</p>}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-4">
            <p className="font-bold text-gray-800 flex items-center gap-1.5 mb-3"><CalendarClock className="h-4 w-4 text-orange-500" /> Recebimentos futuros</p>
            <div className="space-y-2.5 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Hoje</span>
                <span className="font-bold text-gray-800">R$ {resumo.recebimentosFuturos.hoje.valor.toFixed(2)} <span className="text-gray-400 font-normal">· {resumo.recebimentosFuturos.hoje.pedidos} pedidos</span></span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Amanhã</span>
                <span className="font-bold text-gray-800">R$ {resumo.recebimentosFuturos.amanha.valor.toFixed(2)} <span className="text-gray-400 font-normal">· {resumo.recebimentosFuturos.amanha.pedidos} pedidos</span></span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Esta semana</span>
                <span className="font-bold text-gray-800">R$ {resumo.recebimentosFuturos.semana.valor.toFixed(2)} <span className="text-gray-400 font-normal">· {resumo.recebimentosFuturos.semana.pedidos} pedidos</span></span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <span className="text-gray-700 font-medium">Total a receber</span>
                <span className="font-bold text-gray-800">R$ {resumo.recebimentosFuturos.total.toFixed(2)}</span>
              </div>
            </div>
            <p className="text-[11px] text-gray-400 mt-2">Pedidos agendados ainda não entregues, nos próximos 7 dias.</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="font-bold text-gray-800 flex items-center gap-1.5"><Target className="h-4 w-4 text-orange-500" /> Metas do dia</p>
              <button onClick={handleAbrirMetas} className="text-xs text-orange-600 hover:underline">Editar</button>
            </div>
            {metas && (
              <div className="space-y-3">
                {([
                  ['Faturamento', metas.faturamento, (v: number) => `R$ ${v.toFixed(2)}`],
                  ['Pedidos', metas.pedidos, (v: number) => String(Math.round(v))],
                  ['Ticket médio', metas.ticketMedio, (v: number) => `R$ ${v.toFixed(2)}`],
                ] as const).map(([label, meta, fmt]) => {
                  const pct = meta.valorAlvo > 0 ? Math.min(100, (meta.atual / meta.valorAlvo) * 100) : 0;
                  return (
                    <div key={label}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-gray-600">{label}</span>
                        <span className="font-medium text-gray-800">{fmt(meta.atual)} / {meta.valorAlvo > 0 ? fmt(meta.valorAlvo) : '—'}</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${pct >= 100 ? 'bg-emerald-500' : 'bg-orange-500'}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
                {metas.produtos.map((p) => {
                  const pct = p.valorAlvo > 0 ? Math.min(100, (p.atual / p.valorAlvo) * 100) : 0;
                  return (
                    <div key={p.produtoId}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-gray-600 truncate max-w-[140px]">{p.nome}</span>
                        <span className="font-medium text-gray-800">{p.atual} / {p.valorAlvo} un.</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${pct >= 100 ? 'bg-emerald-500' : 'bg-orange-500'}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <p className="font-bold text-gray-800 mb-3">Resumo geral do período</p>
          <div className="space-y-2.5 text-sm">
            <div className="flex items-center justify-between"><span className="text-gray-500">Entradas totais</span><span className="font-bold text-emerald-600">R$ {resumoGeral.entradasTotais.toFixed(2)}</span></div>
            <div className="flex items-center justify-between"><span className="text-gray-500">Saídas totais</span><span className="font-bold text-red-600">R$ {resumoGeral.saidasTotais.toFixed(2)}</span></div>
            <div className="flex items-center justify-between pt-2 border-t border-gray-100"><span className="text-gray-700 font-medium">Saldo líquido</span><span className="font-bold text-gray-800">R$ {resumoGeral.saldoLiquido.toFixed(2)}</span></div>
            <div>
              <div className="flex items-center justify-between"><span className="text-gray-700 font-medium">Lucro bruto (estimado)</span><span className="font-bold text-gray-800">R$ {resumoGeral.lucroBrutoEstimado.toFixed(2)}</span></div>
              <p className="text-[11px] text-gray-400 mt-0.5">Entradas − compras/estoque − taxas e tarifas</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <p className="font-bold text-gray-800 mb-3">Desempenho comparativo</p>
          <div className="space-y-2.5 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Faturamento</span>
              <span className="flex items-center gap-1.5"><span className="font-bold text-gray-800">R$ {stats.entradas.atual.toFixed(2)}</span> <TrendBadge atual={stats.entradas.atual} anterior={stats.entradas.anterior} /></span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Pedidos</span>
              <span className="flex items-center gap-1.5"><span className="font-bold text-gray-800">{stats.pedidosPagos.atual}</span> <TrendBadge atual={stats.pedidosPagos.atual} anterior={stats.pedidosPagos.anterior} /></span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Ticket médio</span>
              <span className="flex items-center gap-1.5"><span className="font-bold text-gray-800">R$ {stats.ticketMedio.atual.toFixed(2)}</span> <TrendBadge atual={stats.ticketMedio.atual} anterior={stats.ticketMedio.anterior} /></span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Taxa de cancelamento</span>
              <span className="flex items-center gap-1.5"><span className="font-bold text-gray-800">{stats.taxaCancelamentoPercent.atual.toFixed(1)}%</span> <TrendBadge atual={stats.taxaCancelamentoPercent.atual} anterior={stats.taxaCancelamentoPercent.anterior} /></span>
            </div>
          </div>
          <p className="text-[11px] text-gray-400 mt-2">vs período anterior de mesma duração</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="font-bold text-gray-800 flex items-center gap-1.5"><BarChart3 className="h-4 w-4 text-orange-500" /> Top produtos</p>
            {onAbrirRelatorios && (
              <button onClick={onAbrirRelatorios} className="text-xs text-orange-600 hover:underline flex items-center gap-0.5">Ver relatório <ArrowRight className="h-3 w-3" /></button>
            )}
          </div>
          <div className="space-y-2.5">
            {resumo.topProdutos.map((p, i) => (
              <div key={p.produtoId} className="flex items-center gap-2.5 text-sm">
                <span className="w-4 text-xs font-bold text-gray-400 shrink-0">{i + 1}</span>
                <span className="text-gray-700 truncate flex-1 min-w-0">{p.nome}</span>
                <span className="font-bold text-gray-800 shrink-0">R$ {p.receita.toFixed(2)}</span>
              </div>
            ))}
            {resumo.topProdutos.length === 0 && <p className="text-sm text-gray-400 text-center py-4">Nenhuma venda no período</p>}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <p className="font-bold text-gray-800 mb-3">Alertas financeiros</p>
          <div className="space-y-2.5 text-sm">
            {alertas.motoboysPendentes.quantidade > 0 && (
              <div className="flex items-start gap-2">
                <Bike className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                <p className="text-gray-700">{alertas.motoboysPendentes.quantidade} pagamento{alertas.motoboysPendentes.quantidade > 1 ? 's' : ''} a motoboys pendente{alertas.motoboysPendentes.quantidade > 1 ? 's' : ''} <span className="font-bold">R$ {alertas.motoboysPendentes.valor.toFixed(2)}</span></p>
              </div>
            )}
            {alertas.pagamentosAguardandoConfirmacao > 0 && (
              <div className="flex items-start gap-2">
                <Clock className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-gray-700">{alertas.pagamentosAguardandoConfirmacao} pedido{alertas.pagamentosAguardandoConfirmacao > 1 ? 's' : ''} aguardando confirmação de pagamento</p>
              </div>
            )}
            {alertas.estoqueBaixo.length > 0 && (
              <div className="flex items-start gap-2">
                <Package className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-gray-700">Estoque abaixo do mínimo em {alertas.estoqueBaixo.length} ite{alertas.estoqueBaixo.length > 1 ? 'ns' : 'm'}</p>
              </div>
            )}
            {alertas.sangriaAcimaDaMedia && (
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                <p className="text-gray-700">Sangria de hoje (R$ {alertas.sangriaAcimaDaMedia.hoje.toFixed(2)}) acima da média diária (R$ {alertas.sangriaAcimaDaMedia.media.toFixed(2)})</p>
              </div>
            )}
            {alertas.motoboysPendentes.quantidade === 0 && alertas.pagamentosAguardandoConfirmacao === 0 && alertas.estoqueBaixo.length === 0 && !alertas.sangriaAcimaDaMedia && (
              <p className="text-gray-400 text-center py-4">Nenhum alerta no momento</p>
            )}
          </div>
        </div>
      </div>

      <BottomSheet isOpen={metasAbertas} onClose={() => setMetasAbertas(false)} title="Metas do dia">
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Faturamento (R$)</label>
              <input type="number" min={0} step="0.01" value={draftFaturamento} onChange={(e) => setDraftFaturamento(e.target.value)} placeholder="Sem meta" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Pedidos (quantidade)</label>
              <input type="number" min={0} value={draftPedidos} onChange={(e) => setDraftPedidos(e.target.value)} placeholder="Sem meta" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Ticket médio (R$)</label>
              <input type="number" min={0} step="0.01" value={draftTicketMedio} onChange={(e) => setDraftTicketMedio(e.target.value)} placeholder="Sem meta" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Metas por produto (unidades vendidas hoje)</p>
            <div className="space-y-2 mb-3">
              {draftProdutos.map((p) => (
                <div key={p.produtoId} className="flex items-center gap-2">
                  <span className="flex-1 text-sm text-gray-700 truncate">{p.nome}</span>
                  <input
                    type="number"
                    min={0}
                    value={p.valorAlvo}
                    onChange={(e) => setDraftProdutos((prev) => prev.map((x) => (x.produtoId === p.produtoId ? { ...x, valorAlvo: e.target.value } : x)))}
                    placeholder="Qtd"
                    className="w-20 px-2 py-1.5 border border-gray-300 rounded-lg text-sm"
                  />
                  <button onClick={() => setDraftProdutos((prev) => prev.filter((x) => x.produtoId !== p.produtoId))} className="text-red-400 hover:text-red-600">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              {draftProdutos.length === 0 && <p className="text-xs text-gray-400">Nenhuma meta de produto ainda.</p>}
            </div>
            <div className="flex items-center gap-2">
              <select
                value={produtoParaAdicionar}
                onChange={(e) => setProdutoParaAdicionar(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
              >
                <option value="">Selecione um produto...</option>
                {produtosLoja.filter((prod) => !draftProdutos.some((p) => p.produtoId === prod.id)).map((prod) => (
                  <option key={prod.id} value={prod.id}>{prod.nome}</option>
                ))}
              </select>
              <button
                onClick={handleAdicionarProdutoMeta}
                disabled={!produtoParaAdicionar}
                className="flex items-center gap-1 bg-gray-800 hover:bg-gray-900 text-white text-sm px-3 py-2 rounded-lg disabled:opacity-60"
              >
                <Plus className="h-4 w-4" /> Adicionar
              </button>
            </div>
          </div>

          <button
            onClick={handleSalvarMetas}
            disabled={salvandoMetas}
            className="w-full flex items-center justify-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium px-3 py-2.5 rounded-lg disabled:opacity-60"
          >
            {salvandoMetas ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Salvar metas
          </button>
        </div>
      </BottomSheet>
    </div>
  );
};

export default ResumoFinanceiroTab;
