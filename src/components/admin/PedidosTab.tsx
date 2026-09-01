import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ChefHat, Truck, CheckCircle2, XCircle, Package, Printer, MessageCircle, BellOff, Layers, Gift, CalendarClock,
  Search, ChevronDown, Grid2x2, List as ListIcon, Phone, MapPin, X, Pencil, PackageCheck,
} from 'lucide-react';
import { Pedido, StatusPedido, TipoPedido, FormaPagamento, STATUS_PEDIDO_LABELS, TIPO_PEDIDO_LABELS, FORMA_PAGAMENTO_LABELS } from '../../types/Pedido';
import { Motoboy } from '../../types/Motoboy';
import { fetchPedidos, updatePedidoStatus, assignMotoboy, liberarResgateFidelidade } from '../../lib/pedidos';
import { fetchMotoboys } from '../../lib/motoboysApi';
import { useTenant } from '../../context/TenantContext';
import ConfirmarPagamentoEntrega from '../ConfirmarPagamentoEntrega';
import NovoPedidoModal from './NovoPedidoModal';
import EditarPedidoModal from './EditarPedidoModal';

interface PedidosTabProps {
  empresaId: string;
  /** Abre a tela já filtrada num status — usado pelos itens do submenu "Pedidos" na sidebar. */
  initialBucket?: 'todos' | 'em_andamento' | 'prontos' | 'entregues' | 'cancelados';
}

const MENSAGEM_POR_STATUS: Record<StatusPedido, (numero: number) => string> = {
  RECEBIDO: (n) => `Olá! Recebemos seu pedido #${String(n).padStart(4, '0')} e já vamos preparar. 🍽️`,
  PREPARANDO: (n) => `Seu pedido #${String(n).padStart(4, '0')} está sendo preparado! 👨‍🍳`,
  SAIU_ENTREGA: (n) => `Seu pedido #${String(n).padStart(4, '0')} saiu para entrega! 🛵`,
  ENTREGUE: (n) => `Seu pedido #${String(n).padStart(4, '0')} foi entregue. Bom apetite! 🎉`,
  CANCELADO: (n) => `Seu pedido #${String(n).padStart(4, '0')} foi cancelado. Qualquer dúvida, estamos à disposição.`,
};

const onlyDigits = (value: string) => value.replace(/\D/g, '');

const linkWhatsapp = (telefone: string, mensagem: string) => {
  const digits = onlyDigits(telefone);
  if (!digits) return null;
  const numero = digits.startsWith('55') ? digits : `55${digits}`;
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`;
};

const linkMapa = (pedido: Pedido) => {
  const endereco = [pedido.endereco, pedido.bairro].filter(Boolean).join(', ');
  if (!endereco) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(endereco)}`;
};

const STATUS_ICONS: Record<StatusPedido, typeof Package> = {
  RECEBIDO: PackageCheck,
  PREPARANDO: ChefHat,
  SAIU_ENTREGA: Truck,
  ENTREGUE: CheckCircle2,
  CANCELADO: XCircle,
};

const STATUS_COLORS: Record<StatusPedido, string> = {
  RECEBIDO: 'bg-yellow-100 text-yellow-800',
  PREPARANDO: 'bg-orange-100 text-orange-800',
  SAIU_ENTREGA: 'bg-blue-100 text-blue-800',
  ENTREGUE: 'bg-green-100 text-green-800',
  CANCELADO: 'bg-red-100 text-red-800',
};

/** Reagrupamento de status pra bater com os filtros do layout de referência — "Prontos" é o
 * pedido já despachado (SAIU_ENTREGA); não existe um status "PRONTO" separado no banco. */
type Bucket = 'todos' | 'em_andamento' | 'prontos' | 'entregues' | 'cancelados';

const STATUS_POR_BUCKET: Record<Exclude<Bucket, 'todos'>, StatusPedido[]> = {
  em_andamento: ['RECEBIDO', 'PREPARANDO'],
  prontos: ['SAIU_ENTREGA'],
  entregues: ['ENTREGUE'],
  cancelados: ['CANCELADO'],
};

const BUCKET_LABELS: Record<Bucket, string> = {
  todos: 'Todos',
  em_andamento: 'Em andamento',
  prontos: 'Prontos',
  entregues: 'Entregues',
  cancelados: 'Cancelados',
};

const todayISO = () => new Date().toISOString().slice(0, 10);
const diasAtras = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
};

const formatHora = (iso: string) => new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
const formatDataHora = (iso: string) => new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

const TrendCaption: React.FC<{ atual: number; anterior: number; inverso?: boolean }> = ({ atual, anterior, inverso }) => {
  if (!anterior) return null;
  const percentual = ((atual - anterior) / anterior) * 100;
  const bom = inverso ? percentual <= 0 : percentual >= 0;
  return (
    <p className={`text-xs mt-1 ${bom ? 'text-emerald-600' : 'text-red-600'}`}>
      {percentual >= 0 ? '↑' : '↓'} {Math.abs(percentual).toFixed(0)}% vs ontem
    </p>
  );
};

const POLL_INTERVAL_MS = 10000;

const PedidosTab: React.FC<PedidosTabProps> = ({ empresaId, initialBucket }) => {
  const { slug } = useTenant();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [pedidosKpi, setPedidosKpi] = useState<Pedido[]>([]);
  const [motoboys, setMotoboys] = useState<Motoboy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bucket, setBucket] = useState<Bucket>(initialBucket ?? 'todos');
  const [busca, setBusca] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState<TipoPedido | ''>('');
  const [formaPagamentoFiltro, setFormaPagamentoFiltro] = useState<FormaPagamento | ''>('');
  const [somenteComMotoboy, setSomenteComMotoboy] = useState(false);
  const [dataInicio, setDataInicio] = useState(diasAtras(6));
  const [dataFim, setDataFim] = useState(todayISO());
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [visao, setVisao] = useState<'lista' | 'grade'>('lista');
  const [selecionadoId, setSelecionadoId] = useState<string | null>(null);
  const [alarmeAtivo, setAlarmeAtivo] = useState(false);
  const [pagamentosConfirmados, setPagamentosConfirmados] = useState<Record<string, number | null>>({});
  const [maisAcoesAberto, setMaisAcoesAberto] = useState(false);
  const [modalNovoPedido, setModalNovoPedido] = useState(false);
  const [modalEditarPedido, setModalEditarPedido] = useState<Pedido | null>(null);

  const idsConhecidosRef = useRef<Set<string> | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const tocarBip = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioCtxRef.current) audioCtxRef.current = new AudioCtx();
      const ctx = audioCtxRef.current;
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = 880;
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start();
      oscillator.stop(ctx.currentTime + 0.18);
    } catch {
      /* ambiente sem suporte a áudio, ignora silenciosamente */
    }
  }, []);

  const load = useCallback(async () => {
    try {
      const [dados, dadosKpi] = await Promise.all([
        fetchPedidos(empresaId, { de: dataInicio, ate: dataFim }),
        fetchPedidos(empresaId, { de: diasAtras(1), ate: todayISO() }),
      ]);
      const idsAtuais = new Set(dados.map((p) => p.id));
      if (idsConhecidosRef.current) {
        const chegouNovo = dados.some((p) => p.status === 'RECEBIDO' && !idsConhecidosRef.current!.has(p.id));
        if (chegouNovo) setAlarmeAtivo(true);
      }
      idsConhecidosRef.current = idsAtuais;
      setPedidos(dados);
      setPedidosKpi(dadosKpi);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar pedidos');
    } finally {
      setLoading(false);
    }
  }, [empresaId, dataInicio, dataFim]);

  useEffect(() => {
    fetchMotoboys(empresaId, true).then(setMotoboys).catch(() => setMotoboys([]));
  }, [empresaId]);

  useEffect(() => {
    load();
    const interval = setInterval(load, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [load]);

  useEffect(() => {
    if (!alarmeAtivo) return;
    tocarBip();
    const interval = setInterval(tocarBip, 2000);
    return () => clearInterval(interval);
  }, [alarmeAtivo, tocarBip]);

  // KPIs de hoje x ontem — computados no cliente a partir da janela de 2 dias buscada à parte,
  // independente do período selecionado nos filtros da lista.
  const kpis = useMemo(() => {
    const hojeStr = todayISO();
    const ontemStr = diasAtras(1);
    const doDia = (dia: string) => pedidosKpi.filter((p) => p.createdAt.slice(0, 10) === dia);
    const calcular = (lista: Pedido[]) => {
      const validos = lista.filter((p) => p.status !== 'CANCELADO');
      const faturamento = validos.reduce((s, p) => s + p.total, 0);
      const entregues = lista.filter((p) => p.entregueEm);
      const tempoMedio = entregues.length
        ? entregues.reduce((s, p) => s + (new Date(p.entregueEm!).getTime() - new Date(p.createdAt).getTime()) / 60000, 0) / entregues.length
        : null;
      const cancelados = lista.filter((p) => p.status === 'CANCELADO').length;
      return {
        pedidos: lista.length,
        faturamento,
        ticketMedio: validos.length ? faturamento / validos.length : 0,
        tempoMedio,
        taxaCancelamento: lista.length ? (cancelados / lista.length) * 100 : 0,
      };
    };
    return { hoje: calcular(doDia(hojeStr)), ontem: calcular(doDia(ontemStr)) };
  }, [pedidosKpi]);

  const contagens = useMemo(() => {
    const porBucket = (b: Exclude<Bucket, 'todos'>) => pedidos.filter((p) => STATUS_POR_BUCKET[b].includes(p.status)).length;
    return {
      todos: pedidos.length,
      em_andamento: porBucket('em_andamento'),
      prontos: porBucket('prontos'),
      entregues: porBucket('entregues'),
      cancelados: porBucket('cancelados'),
    };
  }, [pedidos]);

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return pedidos.filter((p) => {
      if (bucket !== 'todos' && !STATUS_POR_BUCKET[bucket].includes(p.status)) return false;
      if (tipoFiltro && p.tipoPedido !== tipoFiltro) return false;
      if (formaPagamentoFiltro && p.formaPagamento !== formaPagamentoFiltro) return false;
      if (somenteComMotoboy && !p.motoboyId) return false;
      if (termo) {
        const alvo = `${p.numero} ${p.clienteNome ?? ''} ${p.clienteTelefone ?? ''}`.toLowerCase();
        if (!alvo.includes(termo)) return false;
      }
      return true;
    });
  }, [pedidos, bucket, tipoFiltro, formaPagamentoFiltro, somenteComMotoboy, busca]);

  useEffect(() => {
    if (filtrados.length === 0) {
      setSelecionadoId(null);
      return;
    }
    if (!selecionadoId || !filtrados.some((p) => p.id === selecionadoId)) {
      setSelecionadoId(filtrados[0].id);
    }
  }, [filtrados, selecionadoId]);

  const selecionado = filtrados.find((p) => p.id === selecionadoId) || null;
  const motoboyDoSelecionado = selecionado?.motoboyId ? motoboys.find((m) => m.id === selecionado.motoboyId) : null;

  const handleAvancar = async (pedido: Pedido, status: StatusPedido) => {
    await updatePedidoStatus(empresaId, pedido.id, status);
    load();
  };

  const handleConfirmarEntrega = async (pedido: Pedido) => {
    const valorRecebido = pagamentosConfirmados[pedido.id];
    if (valorRecebido == null) return;
    await updatePedidoStatus(empresaId, pedido.id, 'ENTREGUE', undefined, true, valorRecebido);
    setPagamentosConfirmados((prev) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [pedido.id]: _removido, ...resto } = prev;
      return resto;
    });
    load();
  };

  const handleCancelar = async (pedido: Pedido) => {
    if (!window.confirm('Cancelar este pedido?')) return;
    await updatePedidoStatus(empresaId, pedido.id, 'CANCELADO');
    load();
  };

  const handleAssign = async (pedido: Pedido, motoboyId: string) => {
    if (!motoboyId) return;
    await assignMotoboy(empresaId, pedido.id, motoboyId);
    load();
  };

  const handleLiberarResgate = async (pedido: Pedido) => {
    if (!window.confirm(`Liberar o item grátis da fidelidade no pedido #${String(pedido.numero).padStart(4, '0')}?`)) return;
    try {
      await liberarResgateFidelidade(empresaId, pedido.id);
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Não foi possível liberar o resgate.');
    }
  };

  const handleExportarCsv = () => {
    const csvField = (v: string | number) => {
      const str = String(v ?? '');
      return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
    };
    const cabecalho = ['Número', 'Data', 'Cliente', 'Telefone', 'Tipo', 'Status', 'Forma Pagamento', 'Total'];
    const linhas = filtrados.map((p) => [
      p.numero, formatDataHora(p.createdAt), p.clienteNome || '', p.clienteTelefone || '',
      TIPO_PEDIDO_LABELS[p.tipoPedido], STATUS_PEDIDO_LABELS[p.status], FORMA_PAGAMENTO_LABELS[p.formaPagamento], p.total.toFixed(2),
    ]);
    const csv = [cabecalho, ...linhas].map((l) => l.map(csvField).join(',')).join('\r\n');
    const blob = new Blob(['﻿', csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pedidos.csv';
    a.click();
    URL.revokeObjectURL(url);
    setMaisAcoesAberto(false);
  };

  const filtrosAtivos: { label: string; onRemover: () => void }[] = [];
  if (bucket !== 'todos') filtrosAtivos.push({ label: `Status: ${BUCKET_LABELS[bucket]}`, onRemover: () => setBucket('todos') });
  if (tipoFiltro) filtrosAtivos.push({ label: `Tipo: ${TIPO_PEDIDO_LABELS[tipoFiltro]}`, onRemover: () => setTipoFiltro('') });
  if (formaPagamentoFiltro) filtrosAtivos.push({ label: `Pagamento: ${FORMA_PAGAMENTO_LABELS[formaPagamentoFiltro]}`, onRemover: () => setFormaPagamentoFiltro('') });
  if (somenteComMotoboy) filtrosAtivos.push({ label: 'Com motoboy atribuído', onRemover: () => setSomenteComMotoboy(false) });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <h2 className="text-lg font-bold text-gray-800">Pedidos</h2>
          <p className="text-sm text-gray-500">Gerencie e acompanhe todos os pedidos da sua loja</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              onClick={() => setMaisAcoesAberto((v) => !v)}
              className="flex items-center gap-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm px-3.5 py-2 rounded-lg"
            >
              Mais ações <ChevronDown className="h-4 w-4" />
            </button>
            {maisAcoesAberto && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden z-30">
                <button onClick={handleExportarCsv} className="w-full text-left px-3.5 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                  Exportar CSV
                </button>
              </div>
            )}
          </div>
          <button
            onClick={() => setModalNovoPedido(true)}
            className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white text-sm px-4 py-2 rounded-lg"
          >
            <Package className="h-4 w-4" /> Novo pedido
          </button>
        </div>
      </div>

      {alarmeAtivo && (
        <div className="flex items-center justify-between gap-3 bg-orange-100 border border-orange-300 text-orange-800 px-4 py-3 rounded-xl mb-4 animate-pulse">
          <span className="font-medium text-sm">🔔 Novo pedido recebido!</span>
          <button
            onClick={() => setAlarmeAtivo(false)}
            className="flex items-center gap-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs px-3 py-1.5 rounded-lg"
          >
            <BellOff className="h-3.5 w-3.5" /> Silenciar
          </button>
        </div>
      )}
      {error && <p className="text-red-600 mb-4">{error}</p>}

      <div className="flex flex-wrap gap-2 mb-5">
        {(['todos', 'em_andamento', 'prontos', 'entregues', 'cancelados'] as Bucket[]).map((b) => (
          <button
            key={b}
            onClick={() => setBucket(b)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium transition-colors ${
              bucket === b ? 'bg-orange-600 text-white shadow' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {BUCKET_LABELS[b]}
            <span className={`text-[11px] rounded-full px-1.5 ${bucket === b ? 'bg-white/25' : 'bg-white text-gray-500'}`}>
              {contagens[b]}
            </span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-5">
        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <p className="text-xs text-gray-500 mb-1">Faturamento hoje</p>
          <p className="text-xl font-bold text-gray-800">R$ {kpis.hoje.faturamento.toFixed(2)}</p>
          <TrendCaption atual={kpis.hoje.faturamento} anterior={kpis.ontem.faturamento} />
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <p className="text-xs text-gray-500 mb-1">Pedidos hoje</p>
          <p className="text-xl font-bold text-gray-800">{kpis.hoje.pedidos}</p>
          <TrendCaption atual={kpis.hoje.pedidos} anterior={kpis.ontem.pedidos} />
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <p className="text-xs text-gray-500 mb-1">Ticket médio</p>
          <p className="text-xl font-bold text-gray-800">R$ {kpis.hoje.ticketMedio.toFixed(2)}</p>
          <TrendCaption atual={kpis.hoje.ticketMedio} anterior={kpis.ontem.ticketMedio} />
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <p className="text-xs text-gray-500 mb-1">Tempo médio entrega</p>
          <p className="text-xl font-bold text-gray-800">{kpis.hoje.tempoMedio != null ? `${Math.round(kpis.hoje.tempoMedio)} min` : '—'}</p>
          {kpis.hoje.tempoMedio != null && kpis.ontem.tempoMedio != null && (
            <TrendCaption atual={kpis.hoje.tempoMedio} anterior={kpis.ontem.tempoMedio} inverso />
          )}
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <p className="text-xs text-gray-500 mb-1">Taxa de cancelamento</p>
          <p className="text-xl font-bold text-gray-800">{kpis.hoje.taxaCancelamento.toFixed(1)}%</p>
          <TrendCaption atual={kpis.hoje.taxaCancelamento} anterior={kpis.ontem.taxaCancelamento} inverso />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar pedido, cliente ou telefone..."
            className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm"
          />
        </div>
        <input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm" />
        <span className="text-gray-400 text-sm">até</span>
        <input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm" />
        <select
          value={tipoFiltro}
          onChange={(e) => setTipoFiltro(e.target.value as TipoPedido | '')}
          className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white"
        >
          <option value="">Todos os tipos</option>
          {(Object.keys(TIPO_PEDIDO_LABELS) as TipoPedido[]).map((t) => (
            <option key={t} value={t}>{TIPO_PEDIDO_LABELS[t]}</option>
          ))}
        </select>
        <button
          onClick={() => setMostrarFiltros((v) => !v)}
          className={`flex items-center gap-1.5 px-3 py-2.5 border rounded-lg text-sm ${mostrarFiltros ? 'border-orange-400 text-orange-600 bg-orange-50' : 'border-gray-300 text-gray-600'}`}
        >
          Filtros
        </button>
        <div className="flex border border-gray-300 rounded-lg overflow-hidden shrink-0">
          <button onClick={() => setVisao('lista')} className={`p-2.5 ${visao === 'lista' ? 'bg-orange-500 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}>
            <ListIcon className="h-4 w-4" />
          </button>
          <button onClick={() => setVisao('grade')} className={`p-2.5 border-l border-gray-300 ${visao === 'grade' ? 'bg-orange-500 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}>
            <Grid2x2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {mostrarFiltros && (
        <div className="flex flex-wrap items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mb-4">
          <select
            value={formaPagamentoFiltro}
            onChange={(e) => setFormaPagamentoFiltro(e.target.value as FormaPagamento | '')}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
          >
            <option value="">Todas as formas de pagamento</option>
            {(Object.keys(FORMA_PAGAMENTO_LABELS) as FormaPagamento[]).map((f) => (
              <option key={f} value={f}>{FORMA_PAGAMENTO_LABELS[f]}</option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input type="checkbox" checked={somenteComMotoboy} onChange={(e) => setSomenteComMotoboy(e.target.checked)} className="w-4 h-4 text-orange-600 rounded" />
            Só com motoboy atribuído
          </label>
        </div>
      )}

      {filtrosAtivos.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-4 text-xs">
          <span className="text-gray-400">Filtros ativos:</span>
          {filtrosAtivos.map((f) => (
            <span key={f.label} className="flex items-center gap-1 bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
              {f.label}
              <button onClick={f.onRemover}><X className="h-3 w-3" /></button>
            </span>
          ))}
          <button
            onClick={() => { setBucket('todos'); setTipoFiltro(''); setFormaPagamentoFiltro(''); setSomenteComMotoboy(false); }}
            className="text-orange-600 hover:underline"
          >
            Limpar filtros
          </button>
        </div>
      )}

      <div className={`grid gap-5 ${selecionado ? 'lg:grid-cols-[1fr_380px]' : ''}`}>
        <div className={visao === 'grade' ? 'grid sm:grid-cols-2 gap-3' : 'space-y-3'}>
          {loading && <p className="text-gray-500">Carregando...</p>}
          {filtrados.map((pedido) => {
            const Icon = STATUS_ICONS[pedido.status];
            const ativo = pedido.id === selecionadoId;
            return (
              <button
                key={pedido.id}
                onClick={() => setSelecionadoId(pedido.id)}
                className={`w-full text-left border rounded-2xl p-4 transition-colors ${
                  ativo ? 'border-orange-400 bg-orange-50/50 ring-1 ring-orange-200' : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div>
                    <span className="font-mono text-xs font-bold text-orange-600">#{String(pedido.numero).padStart(4, '0')}</span>
                    <p className="font-bold text-gray-800">{pedido.clienteNome || 'Cliente balcão'}</p>
                    <p className="text-xs text-gray-400">{pedido.clienteTelefone}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 text-gray-600">{TIPO_PEDIDO_LABELS[pedido.tipoPedido]}</span>
                    <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${STATUS_COLORS[pedido.status]}`}>
                      <Icon className="h-3 w-3" /> {STATUS_PEDIDO_LABELS[pedido.status]}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-gray-400 mb-1">
                  {pedido.createdAt.slice(0, 10) === todayISO() ? `Hoje às ${formatHora(pedido.createdAt)}` : formatDataHora(pedido.createdAt)}
                </p>
                <p className="text-sm text-gray-600 truncate mb-1">
                  {pedido.itens.length}x item{pedido.itens.length !== 1 ? 's' : ''} · {pedido.itens.map((i) => `${i.quantidade}x ${i.nomeProduto}`).join(' • ')}
                </p>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-800">R$ {pedido.total.toFixed(2)}</span>
                  <span className="text-xs text-gray-400">{FORMA_PAGAMENTO_LABELS[pedido.formaPagamento]}</span>
                </div>
              </button>
            );
          })}
          {!loading && filtrados.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Nenhum pedido nesta situação</p>
            </div>
          )}
        </div>

        {selecionado && (
          <div className="bg-white border border-gray-200 rounded-2xl p-5 h-fit sticky top-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-800">Pedido #{String(selecionado.numero).padStart(4, '0')}</h3>
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[selecionado.status]}`}>
                {STATUS_PEDIDO_LABELS[selecionado.status]}
              </span>
            </div>
            <p className="text-xs text-gray-400 flex items-center gap-1.5 -mt-2">
              {TIPO_PEDIDO_LABELS[selecionado.tipoPedido]} · {formatDataHora(selecionado.createdAt)}
              {selecionado.agendadoPara && (
                <span className="flex items-center gap-1 text-blue-600"><CalendarClock className="h-3 w-3" /> agendado p/ {formatDataHora(selecionado.agendadoPara)}</span>
              )}
            </p>

            {selecionado.clienteNome && (
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-1.5">Cliente</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-800">{selecionado.clienteNome}</p>
                    <p className="text-xs text-gray-400">{selecionado.clienteTelefone}</p>
                  </div>
                  {selecionado.clienteTelefone && (
                    <div className="flex items-center gap-2">
                      <a href={`tel:${selecionado.clienteTelefone}`} className="text-gray-400 hover:text-gray-700"><Phone className="h-4 w-4" /></a>
                      {(() => {
                        const link = linkWhatsapp(selecionado.clienteTelefone, MENSAGEM_POR_STATUS[selecionado.status](selecionado.numero));
                        return link ? <a href={link} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:text-green-800"><MessageCircle className="h-4 w-4" /></a> : null;
                      })()}
                    </div>
                  )}
                </div>
              </div>
            )}

            {selecionado.endereco && (
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-1.5">Endereço de entrega</p>
                <p className="text-sm text-gray-700">{selecionado.endereco}{selecionado.bairro ? ` — ${selecionado.bairro}` : ''}</p>
                {selecionado.referencia && <p className="text-xs text-gray-400">{selecionado.referencia}</p>}
                {linkMapa(selecionado) && (
                  <a href={linkMapa(selecionado)!} target="_blank" rel="noopener noreferrer" className="text-xs text-orange-600 hover:underline flex items-center gap-1 mt-1">
                    <MapPin className="h-3 w-3" /> Ver no mapa
                  </a>
                )}
              </div>
            )}

            {selecionado.observacoes && (
              <div className="bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
                <p className="text-xs font-bold text-amber-800 mb-0.5">Observações do cliente</p>
                <p className="text-sm text-amber-900">{selecionado.observacoes}</p>
              </div>
            )}

            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-1.5">Itens do pedido</p>
              <div className="space-y-1.5">
                {selecionado.itens.map((item) => (
                  <div key={item.id} className="text-sm">
                    <div className="flex justify-between">
                      <span className="flex items-center gap-1.5 text-gray-700">
                        {item.quantidade}x {item.nomeProduto}
                        {item.ehCombo && <Layers className="h-3 w-3 text-purple-500" />}
                      </span>
                      <span className="text-gray-700">R$ {(item.precoUnitario * item.quantidade).toFixed(2)}</span>
                    </div>
                    {item.opcoesSelecionadas.map((opt) => (
                      <p key={opt.id} className="text-xs text-gray-400 pl-4">+ {opt.nomeOpcao}</p>
                    ))}
                    {item.observacoes && <p className="text-xs text-orange-600 italic pl-4">Obs: {item.observacoes}</p>}
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-100 mt-2 pt-2 space-y-1 text-sm">
                <div className="flex justify-between text-gray-500"><span>Taxa de entrega</span><span>R$ {selecionado.taxaEntrega.toFixed(2)}</span></div>
                {selecionado.descontoCupom != null && selecionado.descontoCupom > 0 && (
                  <div className="flex justify-between text-emerald-600"><span>Desconto {selecionado.cupomCodigo ? `(${selecionado.cupomCodigo})` : ''}</span><span>- R$ {selecionado.descontoCupom.toFixed(2)}</span></div>
                )}
                <div className="flex justify-between font-bold text-gray-800 text-base pt-1"><span>Total do pedido</span><span className="text-orange-600">R$ {selecionado.total.toFixed(2)}</span></div>
              </div>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-1.5">Pagamento</p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-700">{FORMA_PAGAMENTO_LABELS[selecionado.formaPagamento]}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${selecionado.pagamentoConfirmado ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-500'}`}>
                  {selecionado.pagamentoConfirmado ? 'Pago' : 'Pendente'}
                </span>
              </div>
              {selecionado.formaPagamento === 'DINHEIRO' && selecionado.trocoPara != null && (
                <p className="text-xs text-amber-700 mt-1">Cliente paga com R$ {selecionado.trocoPara.toFixed(2)}{selecionado.trocoPara > selecionado.total && ` — troco R$ ${(selecionado.trocoPara - selecionado.total).toFixed(2)}`}</p>
              )}
            </div>

            {selecionado.motoboyId && (
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-1.5">Entrega</p>
                <div className="flex items-center justify-between">
                  <p className="font-medium text-gray-800">{selecionado.motoboy?.nome}</p>
                  {motoboyDoSelecionado?.telefone && (
                    <div className="flex items-center gap-2">
                      <a href={`tel:${motoboyDoSelecionado.telefone}`} className="text-gray-400 hover:text-gray-700"><Phone className="h-4 w-4" /></a>
                      <a href={linkWhatsapp(motoboyDoSelecionado.telefone, `Pedido #${String(selecionado.numero).padStart(4, '0')}`) || '#'} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:text-green-800"><MessageCircle className="h-4 w-4" /></a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {selecionado.status === 'SAIU_ENTREGA' && (
              <ConfirmarPagamentoEntrega
                formaPagamento={selecionado.formaPagamento}
                trocoPara={selecionado.trocoPara}
                total={selecionado.total}
                onChange={(valor) => setPagamentosConfirmados((prev) => ({ ...prev, [selecionado.id]: valor }))}
              />
            )}

            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-2">Ações rápidas</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => window.open(`/${slug}/admin/pedidos/${selecionado.id}/imprimir`, '_blank', 'noopener,noreferrer')}
                  className="flex items-center justify-center gap-1.5 border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm px-3 py-2 rounded-lg"
                >
                  <Printer className="h-4 w-4" /> Imprimir
                </button>
                <button
                  onClick={() => setModalEditarPedido(selecionado)}
                  disabled={selecionado.status === 'ENTREGUE' || selecionado.status === 'CANCELADO'}
                  className="flex items-center justify-center gap-1.5 border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm px-3 py-2 rounded-lg disabled:opacity-40"
                >
                  <Pencil className="h-4 w-4" /> Editar pedido
                </button>

                {selecionado.status === 'RECEBIDO' && (
                  <button onClick={() => handleAvancar(selecionado, 'PREPARANDO')} className="col-span-2 flex items-center justify-center gap-1.5 bg-yellow-500 hover:bg-yellow-600 text-white text-sm px-3 py-2 rounded-lg">
                    <ChefHat className="h-4 w-4" /> Preparar
                  </button>
                )}

                {(selecionado.status === 'PREPARANDO' || selecionado.status === 'RECEBIDO') && (
                  <select
                    defaultValue=""
                    onChange={(e) => handleAssign(selecionado, e.target.value)}
                    className="col-span-2 text-sm border border-gray-300 rounded-lg px-2 py-2"
                  >
                    <option value="" disabled>Atribuir motoboy…</option>
                    {motoboys.map((m) => (
                      <option key={m.id} value={m.id}>{m.nome} (R$ {m.taxaPadrao.toFixed(2)})</option>
                    ))}
                  </select>
                )}

                {selecionado.status === 'PREPARANDO' && selecionado.motoboyId && (
                  <button onClick={() => handleAvancar(selecionado, 'SAIU_ENTREGA')} className="col-span-2 flex items-center justify-center gap-1.5 bg-blue-500 hover:bg-blue-600 text-white text-sm px-3 py-2 rounded-lg">
                    <Truck className="h-4 w-4" /> Saiu para entrega
                  </button>
                )}

                {selecionado.status === 'SAIU_ENTREGA' && (
                  <button
                    onClick={() => handleConfirmarEntrega(selecionado)}
                    disabled={pagamentosConfirmados[selecionado.id] == null}
                    className="col-span-2 flex items-center justify-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white text-sm px-3 py-2 rounded-lg disabled:opacity-50"
                  >
                    <CheckCircle2 className="h-4 w-4" /> Marcar como entregue
                  </button>
                )}

                {selecionado.clienteId && !selecionado.itemGratisResgatado && selecionado.status !== 'ENTREGUE' && selecionado.status !== 'CANCELADO' && (
                  <button onClick={() => handleLiberarResgate(selecionado)} className="col-span-2 flex items-center justify-center gap-1.5 border border-orange-200 text-orange-600 hover:bg-orange-50 text-sm px-3 py-2 rounded-lg">
                    <Gift className="h-4 w-4" /> Liberar resgate de fidelidade
                  </button>
                )}

                {selecionado.status !== 'ENTREGUE' && selecionado.status !== 'CANCELADO' && (
                  <button onClick={() => handleCancelar(selecionado)} className="col-span-2 text-sm text-red-600 hover:bg-red-50 border border-red-200 px-3 py-2 rounded-lg">
                    Cancelar pedido
                  </button>
                )}
              </div>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-2">Histórico do pedido</p>
              <div className="space-y-2">
                {[
                  { label: 'Pedido realizado', em: selecionado.createdAt },
                  { label: 'Em preparo', em: selecionado.preparandoEm },
                  ...(selecionado.tipoPedido === 'DELIVERY' ? [{ label: 'Saiu para entrega', em: selecionado.saiuEntregaEm }] : []),
                  selecionado.status === 'CANCELADO'
                    ? { label: 'Cancelado', em: selecionado.canceladoEm }
                    : { label: 'Entregue', em: selecionado.entregueEm },
                ].map((etapa, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <span className={`h-2 w-2 rounded-full shrink-0 ${etapa.em ? 'bg-emerald-500' : 'bg-gray-200'}`} />
                    <span className={etapa.em ? 'text-gray-700' : 'text-gray-400'}>{etapa.label}</span>
                    {etapa.em && <span className="text-xs text-gray-400 ml-auto">{formatDataHora(etapa.em)}</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {modalNovoPedido && (
        <NovoPedidoModal empresaId={empresaId} onClose={() => setModalNovoPedido(false)} onCriado={load} />
      )}
      {modalEditarPedido && (
        <EditarPedidoModal
          empresaId={empresaId}
          pedido={modalEditarPedido}
          onClose={() => setModalEditarPedido(null)}
          onSalvo={load}
        />
      )}
    </div>
  );
};

export default PedidosTab;
