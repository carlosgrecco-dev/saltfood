import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Search, Users, UserCheck, Star, Gift, Wallet, Medal, Clock, Eye, ChevronLeft, ChevronRight,
  ChevronUp, ChevronDown, Download, LayoutGrid, Table as TableIcon, SlidersHorizontal, Trophy,
  Lightbulb, CheckCircle2, Plus, Loader2, UserPlus,
} from 'lucide-react';
import { fetchClientesFidelidadeResumo, liberarResgateCliente, adicionarUnidadesFidelidade, adicionarPontosFidelidade } from '../../lib/clientes';
import { fetchPedidos } from '../../lib/pedidos';
import { Pedido } from '../../types/Pedido';
import {
  loyaltyProgress, loyaltyExpiracao, LOYALTY_STAMPS_GOAL,
  loyaltyTier, LOYALTY_TIER_LABELS, LoyaltyTier, indicadorNivel, NIVEL_INDICADOR_LABELS,
} from '../../types/Cliente';
import { ClienteFidelidade, FidelidadeAdminResumo, FidelidadeAtividadeTipo } from '../../types/Fidelidade';
import BottomSheet from '../BottomSheet';
import DonutChart from '../DonutChart';

const TIER_BADGE_COLORS: Record<LoyaltyTier, string> = {
  BRONZE: 'bg-amber-100 text-amber-800',
  PRATA: 'bg-slate-200 text-slate-700',
  OURO: 'bg-yellow-100 text-yellow-800',
};

interface FidelidadeClientesTabProps {
  empresaId: string;
  onAbrirConfiguracoes?: () => void;
}

const OPCOES_ITENS_POR_PAGINA = [8, 10, 25, 50];
type SortField = 'nome' | 'carimbos' | 'pedidos' | 'gasto' | 'ultimoPedido';
type Visao = 'tabela' | 'grade';

const DICAS_ENGAJAMENTO = [
  'Avise o cliente quando faltar pouco pro prêmio — configure em Configurações → Aviso de proximidade.',
  'Ative o cashback pra dar um motivo real pro cliente voltar mais rápido.',
  'Compartilhe o código de indicação do cliente pelo WhatsApp pra ele trazer novos clientes.',
  'Clientes Ouro/Prata já compraram bastante — um contato especial de agradecimento fideliza ainda mais.',
];

const formatDiasRestantes = (expiraEm: Date) => {
  const dias = Math.ceil((expiraEm.getTime() - Date.now()) / 86400000);
  if (dias <= 0) return 'expira hoje';
  if (dias === 1) return 'expira em 1 dia';
  return `expira em ${dias} dias`;
};

const formatDataHora = (iso: string) => {
  const d = new Date(iso);
  return `${d.toLocaleDateString('pt-BR')} ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
};

const proximoNivelLabel = (totalUnidades: number, limitePrata: number, limiteOuro: number) => {
  if (totalUnidades >= limiteOuro) return 'Nível máximo';
  if (totalUnidades >= limitePrata) return `Para Ouro: ${limiteOuro - totalUnidades} unid.`;
  return `Para Prata: ${limitePrata - totalUnidades} unid.`;
};

interface EventoFidelidade {
  tipo: FidelidadeAtividadeTipo;
  valor?: number;
  unidades?: number;
  pedidoNumero: number;
  data: string;
}

const eventosDoPedido = (p: Pedido): EventoFidelidade[] => {
  const eventos: EventoFidelidade[] = [];
  if (p.itemGratisResgatado) eventos.push({ tipo: 'RESGATE', pedidoNumero: p.numero, data: p.createdAt });
  if (p.cashbackUsado) eventos.push({ tipo: 'CASHBACK_USADO', valor: p.cashbackUsado, pedidoNumero: p.numero, data: p.createdAt });
  if (p.pontosUsados) eventos.push({ tipo: 'PONTOS_USADOS', unidades: p.pontosUsados, pedidoNumero: p.numero, data: p.createdAt });
  if (p.unidadesFidelidadeCreditadas) eventos.push({ tipo: 'CARIMBO', unidades: p.unidadesFidelidadeCreditadas, pedidoNumero: p.numero, data: p.entregueEm || p.createdAt });
  if (p.pontosCreditados) eventos.push({ tipo: 'PONTOS_CREDITADOS', unidades: p.pontosCreditados, pedidoNumero: p.numero, data: p.entregueEm || p.createdAt });
  if (p.cashbackCreditado) eventos.push({ tipo: 'CASHBACK_CREDITADO', valor: p.cashbackCreditado, pedidoNumero: p.numero, data: p.entregueEm || p.createdAt });
  return eventos;
};

const descricaoAtividade = (a: { tipo: FidelidadeAtividadeTipo; valor?: number; unidades?: number }, nomeMoeda = 'pts') => {
  switch (a.tipo) {
    case 'CARIMBO':
      return { label: `ganhou ${a.unidades} carimbo${a.unidades !== 1 ? 's' : ''}`, badge: `+${a.unidades}`, positivo: true };
    case 'RESGATE':
      return { label: 'resgatou o item grátis', badge: 'grátis', positivo: false };
    case 'CASHBACK_USADO':
      return { label: `usou R$ ${(a.valor ?? 0).toFixed(2)} de cashback`, badge: `-R$ ${(a.valor ?? 0).toFixed(2)}`, positivo: false };
    case 'CASHBACK_CREDITADO':
      return { label: `ganhou R$ ${(a.valor ?? 0).toFixed(2)} de cashback`, badge: `+R$ ${(a.valor ?? 0).toFixed(2)}`, positivo: true };
    case 'PONTOS_CREDITADOS':
      return { label: `ganhou ${a.unidades} ${nomeMoeda}`, badge: `+${a.unidades}`, positivo: true };
    case 'PONTOS_USADOS':
      return { label: `resgatou ${a.unidades} ${nomeMoeda}`, badge: `-${a.unidades}`, positivo: false };
    default:
      return { label: '', badge: '', positivo: true };
  }
};

const TrendMini: React.FC<{ atual: number; anterior: number }> = ({ atual, anterior }) => {
  if (!anterior) return null;
  const pct = ((atual - anterior) / anterior) * 100;
  const subiu = pct >= 0;
  return (
    <p className={`text-[11px] font-medium ${subiu ? 'text-emerald-600' : 'text-red-500'}`}>
      {subiu ? '↑' : '↓'} {Math.abs(pct).toFixed(1)}% vs mês anterior
    </p>
  );
};

const FidelidadeClientesTab: React.FC<FidelidadeClientesTabProps> = ({ empresaId, onAbrirConfiguracoes }) => {
  const [resumo, setResumo] = useState<FidelidadeAdminResumo | null>(null);
  const [loading, setLoading] = useState(true);
  const tabelaRef = useRef<HTMLDivElement>(null);

  const [busca, setBusca] = useState('');
  const [filtroTier, setFiltroTier] = useState<LoyaltyTier | ''>('');
  const [filtroStatus, setFiltroStatus] = useState<'ATIVO' | 'INATIVO' | ''>('');
  const [somenteProntos, setSomenteProntos] = useState(false);
  const [mostrarMaisFiltros, setMostrarMaisFiltros] = useState(false);
  const [visao, setVisao] = useState<Visao>('tabela');
  const [itensPorPagina, setItensPorPagina] = useState(8);
  const [pagina, setPagina] = useState(1);
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const [unidadesDraft, setUnidadesDraft] = useState<Record<string, string>>({});
  const [processandoId, setProcessandoId] = useState<string | null>(null);

  const [detalheCliente, setDetalheCliente] = useState<ClienteFidelidade | null>(null);
  const [historicoCliente, setHistoricoCliente] = useState<ClienteFidelidade | null>(null);
  const [historicoPedidos, setHistoricoPedidos] = useState<Pedido[]>([]);
  const [carregandoHistorico, setCarregandoHistorico] = useState(false);

  const load = useCallback(async () => {
    try {
      setResumo(await fetchClientesFidelidadeResumo(empresaId));
    } catch {
      setResumo(null);
    } finally {
      setLoading(false);
    }
  }, [empresaId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleLiberarResgate = async (cliente: ClienteFidelidade) => {
    if (!window.confirm(`Liberar 1 item grátis da fidelidade para ${cliente.nome}?`)) return;
    setProcessandoId(cliente.id);
    try {
      await liberarResgateCliente(empresaId, cliente.id);
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Não foi possível liberar o resgate.');
    } finally {
      setProcessandoId(null);
    }
  };

  const ehPontos = resumo?.config.fidelidadeMetodo === 'PONTOS';
  const nomeMoeda = resumo?.config.pontosNomeMoeda || 'pts';

  const handleCreditarManual = async (cliente: ClienteFidelidade) => {
    const valor = Number(unidadesDraft[cliente.id]);
    if (!Number.isInteger(valor) || valor < 1) {
      alert(`Digite quantos ${ehPontos ? nomeMoeda : 'unidades'} adicionar (número inteiro maior que zero).`);
      return;
    }
    setProcessandoId(cliente.id);
    try {
      if (ehPontos) {
        await adicionarPontosFidelidade(empresaId, cliente.id, valor);
      } else {
        await adicionarUnidadesFidelidade(empresaId, cliente.id, valor);
      }
      setUnidadesDraft((prev) => ({ ...prev, [cliente.id]: '' }));
      await load();
      setDetalheCliente(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Não foi possível creditar.');
    } finally {
      setProcessandoId(null);
    }
  };

  const handleAbrirHistorico = async (cliente: ClienteFidelidade) => {
    setHistoricoCliente(cliente);
    setCarregandoHistorico(true);
    try {
      setHistoricoPedidos(await fetchPedidos(empresaId, { clienteId: cliente.id }));
    } catch {
      setHistoricoPedidos([]);
    } finally {
      setCarregandoHistorico(false);
    }
  };

  const historicoEventos = useMemo(
    () => historicoPedidos.flatMap(eventosDoPedido).sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()),
    [historicoPedidos]
  );

  const linhas = useMemo(() => {
    const clientes = resumo?.clientes ?? [];
    const limites = { prata: resumo?.config.fidelidadeLimitePrata ?? 20, ouro: resumo?.config.fidelidadeLimiteOuro ?? 50 };
    return clientes.map((cliente) => ({
      cliente,
      progresso: loyaltyProgress(cliente),
      tier: loyaltyTier(cliente, limites),
      expiracao: loyaltyExpiracao(cliente, { fidelidadeValidadeDias: resumo?.config.fidelidadeValidadeDias ?? null }),
    }));
  }, [resumo]);

  const distribuicaoNivel = useMemo(() => {
    const counts: Record<LoyaltyTier, number> = { BRONZE: 0, PRATA: 0, OURO: 0 };
    linhas.forEach((l) => { counts[l.tier] += 1; });
    return counts;
  }, [linhas]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const filtradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    const filtered = linhas.filter(({ cliente, tier, expiracao }) => {
      if (termo && !cliente.nome.toLowerCase().includes(termo) && !(cliente.email || '').toLowerCase().includes(termo) && !(cliente.telefone || '').includes(termo)) return false;
      if (filtroTier && tier !== filtroTier) return false;
      if (filtroStatus === 'ATIVO' && !cliente.ativo) return false;
      if (filtroStatus === 'INATIVO' && cliente.ativo) return false;
      if (somenteProntos && expiracao.disponiveis === 0) return false;
      return true;
    });

    if (!sortField) {
      return [...filtered].sort((a, b) => {
        if (a.expiracao.disponiveis !== b.expiracao.disponiveis) return b.expiracao.disponiveis - a.expiracao.disponiveis;
        if (a.progresso.stamps !== b.progresso.stamps) return b.progresso.stamps - a.progresso.stamps;
        return a.cliente.nome.localeCompare(b.cliente.nome);
      });
    }

    return [...filtered].sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'nome': cmp = a.cliente.nome.localeCompare(b.cliente.nome); break;
        case 'carimbos': cmp = ehPontos ? a.cliente.saldoPontos - b.cliente.saldoPontos : a.cliente.totalUnidadesCompradas - b.cliente.totalUnidadesCompradas; break;
        case 'pedidos': cmp = a.cliente.pedidosCount - b.cliente.pedidosCount; break;
        case 'gasto': cmp = a.cliente.gastoTotal - b.cliente.gastoTotal; break;
        case 'ultimoPedido': cmp = new Date(a.cliente.ultimoPedidoEm || 0).getTime() - new Date(b.cliente.ultimoPedidoEm || 0).getTime(); break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [linhas, busca, filtroTier, filtroStatus, somenteProntos, sortField, sortDir, ehPontos]);

  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / itensPorPagina));
  const paginaAtual = Math.min(pagina, totalPaginas);
  const linhasPagina = filtradas.slice((paginaAtual - 1) * itensPorPagina, paginaAtual * itensPorPagina);

  const handleExportarCsv = () => {
    const linhasCsv = filtradas.map(({ cliente, tier }) => [
      cliente.nome,
      cliente.telefone || '',
      cliente.email || '',
      LOYALTY_TIER_LABELS[tier],
      ehPontos ? cliente.saldoPontos : cliente.totalUnidadesCompradas,
      cliente.pedidosCount,
      cliente.gastoTotal.toFixed(2),
      cliente.ultimoPedidoEm ? formatDataHora(cliente.ultimoPedidoEm) : '',
      cliente.ativo ? 'Ativo' : 'Inativo',
    ]);
    const csv = [
      ['Nome', 'Telefone', 'Email', 'Nível', ehPontos ? nomeMoeda : 'Carimbos', 'Pedidos', 'Gasto total', 'Último pedido', 'Status'],
      ...linhasCsv,
    ].map((l) => l.join(';')).join('\n');
    const blob = new Blob(['﻿', csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'clientes-fidelidade.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const SortHeader: React.FC<{ field: SortField; label: string }> = ({ field, label }) => (
    <th className="py-3 px-4 cursor-pointer select-none" onClick={() => toggleSort(field)}>
      <span className="flex items-center gap-1">
        {label}
        {sortField === field ? (sortDir === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />) : <ChevronDown className="h-3 w-3 opacity-20" />}
      </span>
    </th>
  );

  if (loading || !resumo) {
    return <p className="text-center text-gray-500 py-8">Carregando...</p>;
  }

  const { stats, config } = resumo;

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <p className="text-xs text-gray-500 mb-1 flex items-center gap-1.5"><Users className="h-3.5 w-3.5 text-purple-500" /> Clientes cadastrados</p>
          <p className="text-2xl font-bold text-gray-800">{stats.clientesCadastrados.atual}</p>
          <TrendMini atual={stats.clientesCadastrados.atual} anterior={stats.clientesCadastrados.anterior} />
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <p className="text-xs text-gray-500 mb-1 flex items-center gap-1.5"><UserCheck className="h-3.5 w-3.5 text-emerald-500" /> Clientes ativos</p>
          <p className="text-2xl font-bold text-gray-800">{stats.clientesAtivos}</p>
          <p className="text-[11px] text-gray-400">{stats.clientesAtivosPercent.toFixed(1)}% do total</p>
        </div>
        {ehPontos ? (
          <>
            <div className="bg-white border border-gray-200 rounded-2xl p-4">
              <p className="text-xs text-gray-500 mb-1 flex items-center gap-1.5"><Star className="h-3.5 w-3.5 text-amber-500" /> {nomeMoeda} emitidos</p>
              <p className="text-2xl font-bold text-gray-800">{stats.pontosEmitidos.atual}</p>
              <TrendMini atual={stats.pontosEmitidos.atual} anterior={stats.pontosEmitidos.anterior} />
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-4">
              <p className="text-xs text-gray-500 mb-1 flex items-center gap-1.5"><Gift className="h-3.5 w-3.5 text-blue-500" /> {nomeMoeda} resgatados</p>
              <p className="text-2xl font-bold text-gray-800">{stats.pontosResgatados.atual}</p>
              <TrendMini atual={stats.pontosResgatados.atual} anterior={stats.pontosResgatados.anterior} />
            </div>
          </>
        ) : (
          <>
            <div className="bg-white border border-gray-200 rounded-2xl p-4">
              <p className="text-xs text-gray-500 mb-1 flex items-center gap-1.5"><Star className="h-3.5 w-3.5 text-amber-500" /> Carimbos emitidos</p>
              <p className="text-2xl font-bold text-gray-800">{stats.carimbosEmitidos.atual}</p>
              <TrendMini atual={stats.carimbosEmitidos.atual} anterior={stats.carimbosEmitidos.anterior} />
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-4">
              <p className="text-xs text-gray-500 mb-1 flex items-center gap-1.5"><Gift className="h-3.5 w-3.5 text-blue-500" /> Itens grátis resgatados</p>
              <p className="text-2xl font-bold text-gray-800">{stats.itensGratisResgatados.atual}</p>
              <TrendMini atual={stats.itensGratisResgatados.atual} anterior={stats.itensGratisResgatados.anterior} />
            </div>
          </>
        )}
        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <p className="text-xs text-gray-500 mb-1 flex items-center gap-1.5"><Wallet className="h-3.5 w-3.5 text-rose-500" /> Economia gerada</p>
          <p className="text-2xl font-bold text-gray-800">R$ {stats.economiaGerada.atual.toFixed(2)}</p>
          <TrendMini atual={stats.economiaGerada.atual} anterior={stats.economiaGerada.anterior} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4 mb-4 items-start">
        <div ref={tabelaRef} className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-bold text-gray-800 mb-3">Clientes fiéis</h3>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  value={busca}
                  onChange={(e) => { setBusca(e.target.value); setPagina(1); }}
                  placeholder="Buscar por nome, e-mail ou telefone..."
                  className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <select
                value={filtroTier}
                onChange={(e) => { setFiltroTier(e.target.value as LoyaltyTier | ''); setPagina(1); }}
                className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white"
              >
                <option value="">Todos os níveis</option>
                {(Object.keys(LOYALTY_TIER_LABELS) as LoyaltyTier[]).map((t) => (
                  <option key={t} value={t}>{LOYALTY_TIER_LABELS[t]}</option>
                ))}
              </select>
              <select
                value={filtroStatus}
                onChange={(e) => { setFiltroStatus(e.target.value as 'ATIVO' | 'INATIVO' | ''); setPagina(1); }}
                className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white"
              >
                <option value="">Todos os status</option>
                <option value="ATIVO">Ativo</option>
                <option value="INATIVO">Inativo</option>
              </select>
              <button
                onClick={() => setMostrarMaisFiltros((v) => !v)}
                className={`flex items-center gap-1.5 px-3 py-2.5 border rounded-lg text-sm ${mostrarMaisFiltros ? 'border-orange-400 text-orange-600 bg-orange-50' : 'border-gray-300 text-gray-600 bg-white hover:bg-gray-50'}`}
              >
                <SlidersHorizontal className="h-4 w-4" /> Mais filtros
              </button>
              <button
                onClick={handleExportarCsv}
                title="Exportar CSV"
                className="p-2.5 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"
              >
                <Download className="h-4 w-4" />
              </button>
              <div className="flex border border-gray-300 rounded-lg overflow-hidden shrink-0">
                <button
                  onClick={() => setVisao('tabela')}
                  title="Ver em tabela"
                  className={`p-2.5 ${visao === 'tabela' ? 'bg-orange-500 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
                >
                  <TableIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setVisao('grade')}
                  title="Ver em grade"
                  className={`p-2.5 border-l border-gray-300 ${visao === 'grade' ? 'bg-orange-500 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
              </div>
            </div>
            {mostrarMaisFiltros && (
              <label className="flex items-center gap-1.5 text-sm text-gray-600 mt-3">
                <input
                  type="checkbox"
                  checked={somenteProntos}
                  onChange={(e) => { setSomenteProntos(e.target.checked); setPagina(1); }}
                />
                Só clientes prontos para resgate
              </label>
            )}
          </div>

          {visao === 'tabela' ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-gray-500 bg-gray-50">
                    <SortHeader field="nome" label="Cliente" />
                    <th className="py-3 px-4">Nível</th>
                    <SortHeader field="carimbos" label={ehPontos ? nomeMoeda.charAt(0).toUpperCase() + nomeMoeda.slice(1) : 'Carimbos'} />
                    <SortHeader field="pedidos" label="Pedidos" />
                    <SortHeader field="gasto" label="Gasto total" />
                    <SortHeader field="ultimoPedido" label="Último pedido" />
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {linhasPagina.map(({ cliente, tier, expiracao }) => (
                    <tr key={cliente.id} className="border-b border-gray-100 hover:bg-gray-50 align-top">
                      <td className="py-3 px-4">
                        <div className="min-w-[160px]">
                          <p className="font-bold text-gray-800">{cliente.nome}</p>
                          {cliente.telefone && <p className="text-xs text-gray-400">{cliente.telefone}</p>}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${TIER_BADGE_COLORS[tier]}`}>
                          <Medal className="h-3 w-3" /> {LOYALTY_TIER_LABELS[tier]}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {ehPontos ? (
                          <>
                            <p className="font-medium text-gray-800">{cliente.saldoPontos} {nomeMoeda}</p>
                            <p className="text-[11px] text-gray-400">{proximoNivelLabel(cliente.totalUnidadesCompradas, config.fidelidadeLimitePrata, config.fidelidadeLimiteOuro)}</p>
                          </>
                        ) : (
                          <>
                            <p className="font-medium text-gray-800">{cliente.totalUnidadesCompradas}</p>
                            <p className="text-[11px] text-gray-400">{proximoNivelLabel(cliente.totalUnidadesCompradas, config.fidelidadeLimitePrata, config.fidelidadeLimiteOuro)}</p>
                          </>
                        )}
                      </td>
                      <td className="py-3 px-4 text-gray-600">{cliente.pedidosCount}</td>
                      <td className="py-3 px-4 text-gray-800 font-medium">R$ {cliente.gastoTotal.toFixed(2)}</td>
                      <td className="py-3 px-4 text-gray-500 text-xs">{cliente.ultimoPedidoEm ? formatDataHora(cliente.ultimoPedidoEm) : '—'}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${cliente.ativo ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-600'}`}>
                          {cliente.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <button onClick={() => setDetalheCliente(cliente)} title="Ver detalhes" className="text-gray-400 hover:text-gray-700">
                            <Eye className="h-4 w-4" />
                          </button>
                          <button onClick={() => handleAbrirHistorico(cliente)} title="Histórico de fidelidade" className="text-gray-400 hover:text-gray-700">
                            <Clock className="h-4 w-4" />
                          </button>
                          {!ehPontos && (
                            <button
                              onClick={() => handleLiberarResgate(cliente)}
                              disabled={expiracao.disponiveis === 0 || processandoId === cliente.id}
                              title={expiracao.disponiveis > 0 ? 'Liberar resgate' : 'Sem resgates disponíveis'}
                              className="text-gray-400 hover:text-orange-600 disabled:opacity-30 disabled:hover:text-gray-400"
                            >
                              <Gift className={`h-4 w-4 ${expiracao.disponiveis > 0 ? 'text-orange-500' : ''}`} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {linhasPagina.length === 0 && (
                <p className="text-center text-gray-500 py-10">
                  {busca || filtroTier || filtroStatus || somenteProntos ? 'Nenhum cliente encontrado para esse filtro' : 'Nenhum cliente cadastrado ainda'}
                </p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4">
              {linhasPagina.map(({ cliente, tier, expiracao }) => (
                <div key={cliente.id} className="border border-gray-200 rounded-xl p-4">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <p className="font-bold text-gray-800 truncate">{cliente.nome}</p>
                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${TIER_BADGE_COLORS[tier]}`}>
                      <Medal className="h-2.5 w-2.5" /> {LOYALTY_TIER_LABELS[tier]}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mb-2">
                    {ehPontos ? `${cliente.saldoPontos} ${nomeMoeda}` : `${cliente.totalUnidadesCompradas} carimbos`} · {proximoNivelLabel(cliente.totalUnidadesCompradas, config.fidelidadeLimitePrata, config.fidelidadeLimiteOuro)}
                  </p>
                  <div className="flex items-center justify-between text-sm mb-3">
                    <span className="text-gray-600">{cliente.pedidosCount} pedidos</span>
                    <span className="font-semibold text-gray-800">R$ {cliente.gastoTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setDetalheCliente(cliente)} className="flex-1 flex items-center justify-center gap-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1.5 rounded-lg">
                      <Eye className="h-3.5 w-3.5" /> Detalhes
                    </button>
                    <button onClick={() => handleAbrirHistorico(cliente)} className="p-1.5 text-gray-400 hover:text-gray-700">
                      <Clock className="h-4 w-4" />
                    </button>
                    {!ehPontos && (
                      <button
                        onClick={() => handleLiberarResgate(cliente)}
                        disabled={expiracao.disponiveis === 0 || processandoId === cliente.id}
                        className="p-1.5 text-gray-400 hover:text-orange-600 disabled:opacity-30"
                      >
                        <Gift className={`h-4 w-4 ${expiracao.disponiveis > 0 ? 'text-orange-500' : ''}`} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {linhasPagina.length === 0 && <p className="col-span-full text-center text-gray-500 py-10">Nenhum cliente encontrado.</p>}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              Mostrando {filtradas.length === 0 ? 0 : (paginaAtual - 1) * itensPorPagina + 1} a{' '}
              {Math.min(paginaAtual * itensPorPagina, filtradas.length)} de {filtradas.length} clientes
            </p>
            <div className="flex items-center gap-2">
              <select
                value={itensPorPagina}
                onChange={(e) => { setItensPorPagina(Number(e.target.value)); setPagina(1); }}
                className="px-2 py-1.5 border border-gray-300 rounded-lg text-xs bg-white"
              >
                {OPCOES_ITENS_POR_PAGINA.map((n) => (
                  <option key={n} value={n}>{n} por página</option>
                ))}
              </select>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPagina((p) => Math.max(1, p - 1))}
                  disabled={paginaAtual === 1}
                  className="p-2 border border-gray-300 rounded-lg disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                {Array.from({ length: totalPaginas }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPaginas || Math.abs(p - paginaAtual) <= 1)
                  .map((p, i, arr) => (
                    <React.Fragment key={p}>
                      {i > 0 && arr[i - 1] !== p - 1 && <span className="px-1 text-gray-400">…</span>}
                      <button
                        onClick={() => setPagina(p)}
                        className={`h-8 w-8 rounded-lg text-sm font-medium ${p === paginaAtual ? 'bg-orange-500 text-white' : 'border border-gray-300 text-gray-600 hover:bg-gray-50'}`}
                      >
                        {p}
                      </button>
                    </React.Fragment>
                  ))}
                <button
                  onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                  disabled={paginaAtual === totalPaginas}
                  className="p-2 border border-gray-300 rounded-lg disabled:opacity-40"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-4">
            <p className="font-bold text-gray-800 flex items-center gap-1.5 mb-3"><Trophy className="h-4 w-4 text-amber-500" /> Ranking de clientes</p>
            <div className="space-y-2.5">
              {resumo.ranking.map((r, i) => (
                <div key={r.id} className="flex items-center gap-2.5">
                  <span className="w-4 text-xs font-bold text-gray-400 text-center shrink-0">{i + 1}</span>
                  <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center font-bold text-xs shrink-0">
                    {r.nome.charAt(0).toUpperCase()}
                  </div>
                  <p className="text-sm font-medium text-gray-800 truncate flex-1 min-w-0">{r.nome}</p>
                  <span className="text-xs font-bold text-gray-600 shrink-0">{r.totalUnidadesCompradas} unid.</span>
                </div>
              ))}
              {resumo.ranking.length === 0 && <p className="text-sm text-gray-400 text-center py-4">Nenhum cliente ainda</p>}
            </div>
            <button onClick={() => tabelaRef.current?.scrollIntoView({ behavior: 'smooth' })} className="text-xs text-orange-600 hover:underline mt-3">
              Ver todos os clientes
            </button>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-4">
            <p className="font-bold text-gray-800 mb-3">Resumo do programa</p>
            <div className="space-y-2.5 text-sm">
              {ehPontos ? (
                <>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-gray-500">Regra de pontuação</span>
                    <span className="font-medium text-gray-800 text-right">R$ 1,00 = {config.pontosPorReal} {nomeMoeda}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-gray-500">{nomeMoeda} expiram em</span>
                    <span className="font-medium text-gray-800 text-right">{config.pontosValidadeMeses ? `${config.pontosValidadeMeses} meses` : 'Sem validade'}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-gray-500">Resgate mínimo</span>
                    <span className="font-medium text-gray-800 text-right">{config.pontosResgateMinimo ? `${config.pontosResgateMinimo} ${nomeMoeda}` : 'Sem mínimo'}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-gray-500">Valor do {nomeMoeda.replace(/s$/, '')}</span>
                    <span className="font-medium text-gray-800 text-right">R$ {config.pontosValorReal.toFixed(2)}</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-gray-500">Regra de carimbos</span>
                    <span className="font-medium text-gray-800 text-right">{config.unidadesParaPremio} compras = 1 grátis</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-gray-500">Prazo de resgate</span>
                    <span className="font-medium text-gray-800 text-right">{config.fidelidadeValidadeDias ? `${config.fidelidadeValidadeDias} dias` : 'Sem prazo'}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-gray-500">Item do prêmio</span>
                    <span className="font-medium text-gray-800 text-right">{config.fidelidadeNomeItem || 'Não definido'}</span>
                  </div>
                </>
              )}
              <div className="flex items-center justify-between gap-2">
                <span className="text-gray-500">Cashback</span>
                <span className="font-medium text-gray-800 text-right">{config.cashbackPercent > 0 ? `${config.cashbackPercent}% por pedido` : 'Desativado'}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-gray-500">Bônus por indicação</span>
                <span className="font-medium text-gray-800 text-right">{config.indicacaoRecompensaUnidades} unid.</span>
              </div>
            </div>
            {onAbrirConfiguracoes && (
              <button onClick={onAbrirConfiguracoes} className="text-xs text-orange-600 hover:underline mt-3">
                Ver todas as regras
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <p className="font-bold text-gray-800 mb-3">Atividades recentes</p>
          <div className="space-y-2.5">
            {resumo.atividadesRecentes.map((a, i) => {
              const d = descricaoAtividade(a, nomeMoeda);
              return (
                <div key={i} className="flex items-center justify-between gap-2 text-sm">
                  <div className="min-w-0">
                    <p className="text-gray-800 truncate"><span className="font-medium">{a.clienteNome}</span> {d.label}</p>
                    <p className="text-[11px] text-gray-400">Pedido #{a.pedidoNumero} · {formatDataHora(a.data)}</p>
                  </div>
                  <span className={`text-xs font-bold shrink-0 ${d.positivo ? 'text-emerald-600' : 'text-red-500'}`}>{d.badge}</span>
                </div>
              );
            })}
            {resumo.atividadesRecentes.length === 0 && <p className="text-sm text-gray-400 text-center py-4">Nenhuma atividade ainda</p>}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <p className="font-bold text-gray-800 mb-3">Distribuição por nível</p>
          <DonutChart
            segments={[
              { label: 'Bronze', value: distribuicaoNivel.BRONZE, colorClass: 'bg-amber-500', strokeClass: 'stroke-amber-500' },
              { label: 'Prata', value: distribuicaoNivel.PRATA, colorClass: 'bg-slate-400', strokeClass: 'stroke-slate-400' },
              { label: 'Ouro', value: distribuicaoNivel.OURO, colorClass: 'bg-yellow-500', strokeClass: 'stroke-yellow-500' },
            ]}
            centerLabel="clientes"
          />
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <p className="font-bold text-gray-800 flex items-center gap-1.5 mb-3"><Lightbulb className="h-4 w-4 text-amber-500" /> Dicas para engajamento</p>
          <ul className="space-y-2.5">
            {DICAS_ENGAJAMENTO.map((dica) => (
              <li key={dica} className="flex items-start gap-2 text-sm text-gray-600">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" /> {dica}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <BottomSheet isOpen={!!detalheCliente} onClose={() => setDetalheCliente(null)} title="Detalhes do cliente">
        {detalheCliente && (() => {
          const tier = loyaltyTier(detalheCliente, { prata: config.fidelidadeLimitePrata, ouro: config.fidelidadeLimiteOuro });
          const progresso = loyaltyProgress(detalheCliente);
          const expiracao = loyaltyExpiracao(detalheCliente, { fidelidadeValidadeDias: config.fidelidadeValidadeDias });
          const processando = processandoId === detalheCliente.id;
          return (
            <div className="p-6 space-y-5">
              <div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <p className="font-bold text-gray-800 text-lg">{detalheCliente.nome}</p>
                  <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${TIER_BADGE_COLORS[tier]}`}>
                    <Medal className="h-2.5 w-2.5" /> {LOYALTY_TIER_LABELS[tier]}
                  </span>
                </div>
                <p className="text-sm text-gray-500">{detalheCliente.email}{detalheCliente.telefone ? ` · ${detalheCliente.telefone}` : ''}</p>
              </div>

              {ehPontos ? (
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-500 flex items-center gap-1"><Star className="h-3 w-3" /> Saldo de {nomeMoeda}</p>
                  <p className="text-xl font-bold text-gray-800">{detalheCliente.saldoPontos} {nomeMoeda}</p>
                  {config.pontosResgateMinimo != null && (
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      {detalheCliente.saldoPontos >= config.pontosResgateMinimo
                        ? 'Já pode resgatar no próximo pedido'
                        : `Faltam ${config.pontosResgateMinimo - detalheCliente.saldoPontos} ${nomeMoeda} pro resgate mínimo`}
                    </p>
                  )}
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-500">Progresso pro próximo item grátis</span>
                    <span className="text-xs font-mono text-gray-600">{progresso.stamps}/{LOYALTY_STAMPS_GOAL}</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                    <div className="h-full rounded-full bg-orange-500" style={{ width: `${(progresso.stamps / LOYALTY_STAMPS_GOAL) * 100}%` }} />
                  </div>
                  {expiracao.disponiveis > 0 && (
                    <div className="flex items-center gap-1.5 mt-2">
                      <span className="flex items-center gap-1 text-[11px] font-bold text-orange-700 bg-orange-100 px-2 py-0.5 rounded-full">
                        <Gift className="h-3 w-3" /> {expiracao.disponiveis} pronto{expiracao.disponiveis > 1 ? 's' : ''} p/ resgate
                      </span>
                      {expiracao.expiraEm && (
                        <span className="flex items-center gap-1 text-[10px] text-gray-400">
                          <Clock className="h-2.5 w-2.5" /> {formatDiasRestantes(expiracao.expiraEm)}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-500">Pedidos</p>
                  <p className="font-bold text-gray-800">{detalheCliente.pedidosCount}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-500">Gasto total</p>
                  <p className="font-bold text-gray-800">R$ {detalheCliente.gastoTotal.toFixed(2)}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-500 flex items-center gap-1"><Wallet className="h-3 w-3" /> Saldo cashback</p>
                  <p className="font-bold text-gray-800">R$ {detalheCliente.saldoCashback.toFixed(2)}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-500 flex items-center gap-1"><UserPlus className="h-3 w-3" /> Indicações</p>
                  <p className="font-bold text-gray-800">{detalheCliente.indicacoesConcluidas} · Nível {NIVEL_INDICADOR_LABELS[indicadorNivel(detalheCliente).nivel]}</p>
                </div>
              </div>

              {!ehPontos && expiracao.disponiveis > 0 && (
                <button
                  onClick={() => handleLiberarResgate(detalheCliente)}
                  disabled={processando}
                  className="w-full flex items-center justify-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white text-sm px-3 py-2.5 rounded-lg disabled:opacity-60"
                >
                  <Gift className="h-4 w-4" /> Liberar resgate
                </button>
              )}

              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                  {ehPontos ? `Creditar ${nomeMoeda} (bônus, correção, retirada por telefone)` : 'Creditar unidades (retirada/compra por telefone)'}
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    placeholder="Ex: 2"
                    value={unidadesDraft[detalheCliente.id] || ''}
                    onChange={(e) => setUnidadesDraft((prev) => ({ ...prev, [detalheCliente.id]: e.target.value }))}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                  <button
                    onClick={() => handleCreditarManual(detalheCliente)}
                    disabled={processando || !unidadesDraft[detalheCliente.id]}
                    className="flex items-center gap-1 bg-gray-800 hover:bg-gray-900 text-white text-sm px-3 py-2 rounded-lg disabled:opacity-60"
                  >
                    {processando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Adicionar
                  </button>
                </div>
              </div>
            </div>
          );
        })()}
      </BottomSheet>

      <BottomSheet isOpen={!!historicoCliente} onClose={() => setHistoricoCliente(null)} title={historicoCliente ? `Histórico de ${historicoCliente.nome}` : 'Histórico'}>
        <div className="p-6">
          {carregandoHistorico ? (
            <p className="text-center text-gray-500 py-8">Carregando...</p>
          ) : (
            <div className="space-y-3">
              {historicoEventos.map((ev, i) => {
                const d = descricaoAtividade(ev, nomeMoeda);
                return (
                  <div key={i} className="flex items-center justify-between gap-2 text-sm border-b border-gray-100 pb-2.5">
                    <div>
                      <p className="text-gray-800">{d.label}</p>
                      <p className="text-[11px] text-gray-400">Pedido #{ev.pedidoNumero} · {formatDataHora(ev.data)}</p>
                    </div>
                    <span className={`text-xs font-bold shrink-0 ${d.positivo ? 'text-emerald-600' : 'text-red-500'}`}>{d.badge}</span>
                  </div>
                );
              })}
              {historicoEventos.length === 0 && <p className="text-center text-gray-500 py-8">Nenhuma atividade de fidelidade registrada ainda.</p>}
            </div>
          )}
        </div>
      </BottomSheet>
    </div>
  );
};

export default FidelidadeClientesTab;
