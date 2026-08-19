import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Bike, Wallet, Star, MapPin, CalendarClock, HandCoins, Clock3, Receipt } from 'lucide-react';
import { Pedido } from '../types/Pedido';
import { MovimentoCaixa } from '../types/MovimentoCaixa';
import { fetchMovimentosCaixa } from '../lib/movimentosCaixa';
import StarRating from './StarRating';

interface MotoboyDashboardProps {
  empresaId: string;
  motoboyId: string;
  pedidos: Pedido[];
}

const DAY_MS = 86400000;
const ULTIMAS_ENTREGAS_LIMITE = 20;
const HISTORICO_PAGAMENTOS_LIMITE = 10;
const POLL_PAGAMENTOS_MS = 15000;

/** dataMovimento vem como data pura (@db.Date, meia-noite UTC) — evita formatar via Date/fuso pra não voltar 1 dia. */
const formatData = (iso: string) => {
  const [ano, mes, dia] = iso.slice(0, 10).split('-');
  return `${dia}/${mes}/${ano}`;
};

const isHoje = (iso: string) => {
  const d = new Date(iso);
  const hoje = new Date();
  return d.getFullYear() === hoje.getFullYear() && d.getMonth() === hoje.getMonth() && d.getDate() === hoje.getDate();
};

const formatDataHora = (iso: string) =>
  new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

const MotoboyDashboard: React.FC<MotoboyDashboardProps> = ({ empresaId, motoboyId, pedidos }) => {
  const [pagamentos, setPagamentos] = useState<MovimentoCaixa[]>([]);

  const loadPagamentos = useCallback(async () => {
    try {
      setPagamentos(await fetchMovimentosCaixa(empresaId, { motoboyId, tipo: 'SAIDA' }));
    } catch {
      /* silencioso */
    }
  }, [empresaId, motoboyId]);

  useEffect(() => {
    loadPagamentos();
    const interval = setInterval(loadPagamentos, POLL_PAGAMENTOS_MS);
    return () => clearInterval(interval);
  }, [loadPagamentos]);

  const entregues = useMemo(
    () => pedidos.filter((p): p is Pedido & { entregueEm: string } => p.status === 'ENTREGUE' && Boolean(p.entregueEm)),
    [pedidos]
  );

  const totalPago = useMemo(() => pagamentos.reduce((soma, m) => soma + m.valor, 0), [pagamentos]);
  const totalAReceber = useMemo(
    () => entregues.filter((p) => !p.motoboyPago).reduce((soma, p) => soma + (p.taxaEntregaMotoboy ?? 0), 0),
    [entregues]
  );

  const tiles = useMemo(() => {
    const agora = Date.now();
    const contar = (limiteMs: number | 'hoje') => {
      const itens = limiteMs === 'hoje'
        ? entregues.filter((p) => isHoje(p.entregueEm))
        : entregues.filter((p) => new Date(p.entregueEm).getTime() >= agora - limiteMs);
      return {
        corridas: itens.length,
        ganho: itens.reduce((soma, p) => soma + (p.taxaEntregaMotoboy ?? 0), 0),
      };
    };

    return [
      { label: 'Hoje', ...contar('hoje') },
      { label: '7 dias', ...contar(7 * DAY_MS) },
      { label: '15 dias', ...contar(15 * DAY_MS) },
      { label: '30 dias', ...contar(30 * DAY_MS) },
    ];
  }, [entregues]);

  const avaliacoes = useMemo(() => entregues.filter((p) => p.notaMotoboy != null), [entregues]);
  const mediaNota = avaliacoes.length > 0
    ? avaliacoes.reduce((soma, p) => soma + (p.notaMotoboy ?? 0), 0) / avaliacoes.length
    : null;

  const ultimasEntregas = useMemo(
    () =>
      [...entregues]
        .sort((a, b) => new Date(b.entregueEm).getTime() - new Date(a.entregueEm).getTime())
        .slice(0, ULTIMAS_ENTREGAS_LIMITE),
    [entregues]
  );

  return (
    <div className="mb-8">
      <h2 className="font-bold text-gray-700 flex items-center gap-2 mb-3">
        <Bike className="h-4 w-4 text-orange-600" /> Seu desempenho
      </h2>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-3">
        {tiles.map((tile) => (
          <div key={tile.label} className="bg-white border border-gray-200 rounded-2xl p-3.5">
            <p className="text-xs text-gray-500 mb-1">{tile.label}</p>
            <p className="text-xl font-bold text-gray-800 leading-tight">{tile.corridas}</p>
            <p className="text-[11px] text-gray-400">corrida{tile.corridas !== 1 ? 's' : ''}</p>
            <p className="flex items-center gap-1 text-xs font-semibold text-green-700 mt-1.5">
              <Wallet className="h-3 w-3" /> R$ {tile.ganho.toFixed(2)}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2.5 mb-3">
        <div className="bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-2xl p-3.5">
          <p className="flex items-center gap-1 text-amber-100 text-xs mb-1">
            <Clock3 className="h-3.5 w-3.5" /> A receber
          </p>
          <p className="text-xl font-bold">R$ {totalAReceber.toFixed(2)}</p>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-2xl p-3.5">
          <p className="flex items-center gap-1 text-emerald-100 text-xs mb-1">
            <HandCoins className="h-3.5 w-3.5" /> Já recebido
          </p>
          <p className="text-xl font-bold">R$ {totalPago.toFixed(2)}</p>
        </div>
      </div>

      <h2 className="font-bold text-gray-700 flex items-center gap-2 mb-3">
        <Receipt className="h-4 w-4 text-orange-600" /> Histórico de pagamentos
      </h2>
      <div className="space-y-2 mb-6">
        {pagamentos.slice(0, HISTORICO_PAGAMENTOS_LIMITE).map((m) => (
          <div key={m.id} className="flex items-center justify-between gap-3 bg-white border border-gray-100 rounded-xl px-4 py-3">
            <div className="min-w-0">
              <p className="text-sm text-gray-700 truncate">{m.descricao || 'Pagamento'}</p>
              <p className="text-[11px] text-gray-400">{formatData(m.dataMovimento)}</p>
            </div>
            <span className="font-bold text-green-700 shrink-0">R$ {m.valor.toFixed(2)}</span>
          </div>
        ))}
        {pagamentos.length === 0 && (
          <p className="text-center text-gray-400 py-4 text-sm">Nenhum pagamento registrado ainda.</p>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-6 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs text-gray-500 mb-1">Sua classificação</p>
          {mediaNota != null ? (
            <div className="flex items-center gap-2">
              <StarRating value={Math.round(mediaNota)} readOnly size="sm" />
              <span className="text-sm font-bold text-gray-800">{mediaNota.toFixed(1)}</span>
            </div>
          ) : (
            <p className="text-sm text-gray-400">Ainda sem avaliações</p>
          )}
        </div>
        {avaliacoes.length > 0 && (
          <span className="text-xs text-gray-400 shrink-0">
            {avaliacoes.length} avaliaç{avaliacoes.length > 1 ? 'ões' : 'ão'}
          </span>
        )}
      </div>

      <h2 className="font-bold text-gray-700 mb-3">Últimas entregas</h2>
      <div className="space-y-2">
        {ultimasEntregas.map((p) => (
          <div key={p.id} className="bg-white border border-gray-100 rounded-xl px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs text-gray-400">#{String(p.numero).padStart(4, '0')}</span>
                  <span className="text-sm font-medium text-gray-700">{p.clienteNome}</span>
                </div>
                <p className="text-xs text-gray-500 flex items-start gap-1 mt-1">
                  <MapPin className="h-3 w-3 mt-0.5 shrink-0" />
                  {p.endereco}{p.bairro ? ` - ${p.bairro}` : ''}
                </p>
                <p className="text-[11px] text-gray-400 flex items-center gap-1 mt-1">
                  <CalendarClock className="h-3 w-3" /> {formatDataHora(p.entregueEm)}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm font-bold text-green-700">R$ {(p.taxaEntregaMotoboy ?? 0).toFixed(2)}</p>
                {p.notaMotoboy != null ? (
                  <div className="flex items-center gap-0.5 justify-end mt-1">
                    <Star className="h-3 w-3 fill-amber-400 stroke-amber-400" />
                    <span className="text-xs font-semibold text-gray-600">{p.notaMotoboy}</span>
                  </div>
                ) : (
                  <p className="text-[11px] text-gray-300 mt-1">sem avaliação</p>
                )}
              </div>
            </div>
          </div>
        ))}

        {ultimasEntregas.length === 0 && (
          <p className="text-center text-gray-400 py-6 text-sm">Nenhuma entrega concluída ainda.</p>
        )}
      </div>
    </div>
  );
};

export default MotoboyDashboard;
