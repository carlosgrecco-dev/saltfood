import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Search, ChevronLeft, ChevronRight, Clock3, HandCoins, Calendar, TrendingUp, Bike, Loader2,
} from 'lucide-react';
import { Motoboy, PagamentosMotoboyResumo } from '../../types/Motoboy';
import { fetchMotoboys, fetchPagamentosMotoboyResumo } from '../../lib/motoboysApi';
import { pagarMotoboy } from '../../lib/pedidos';
import DonutChart from '../DonutChart';

interface MotoboyPagamentosTabProps {
  empresaId: string;
}

const ITENS_POR_PAGINA = 10;

const CORES_FORMA_PAGAMENTO: Record<string, { colorClass: string; strokeClass: string }> = {
  PIX: { colorClass: 'bg-emerald-500', strokeClass: 'stroke-emerald-500' },
  DINHEIRO: { colorClass: 'bg-amber-500', strokeClass: 'stroke-amber-500' },
  CARTAO: { colorClass: 'bg-blue-500', strokeClass: 'stroke-blue-500' },
  MULTIPLO: { colorClass: 'bg-purple-500', strokeClass: 'stroke-purple-500' },
};

/** dataMovimento/período vem como data pura (@db.Date, meia-noite UTC) — evita formatar via Date/fuso pra não voltar 1 dia. */
const formatData = (iso: string) => {
  const [ano, mes, dia] = iso.slice(0, 10).split('-');
  return `${dia}/${mes}/${ano}`;
};

const MotoboyPagamentosTab: React.FC<MotoboyPagamentosTabProps> = ({ empresaId }) => {
  const [motoboys, setMotoboys] = useState<Motoboy[]>([]);
  const [resumo, setResumo] = useState<PagamentosMotoboyResumo | null>(null);
  const [loading, setLoading] = useState(true);
  const [pagandoId, setPagandoId] = useState<string | null>(null);

  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<'' | 'PAGO' | 'A_PAGAR'>('');
  const [filtroMotoboy, setFiltroMotoboy] = useState('');
  const [de, setDe] = useState('');
  const [ate, setAte] = useState('');
  const [pagina, setPagina] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [listaMotoboys, dadosResumo] = await Promise.all([
        fetchMotoboys(empresaId),
        fetchPagamentosMotoboyResumo(empresaId, de || undefined, ate || undefined),
      ]);
      setMotoboys(listaMotoboys);
      setResumo(dadosResumo);
    } catch {
      setResumo(null);
    } finally {
      setLoading(false);
    }
  }, [empresaId, de, ate]);

  useEffect(() => {
    load();
  }, [load]);

  const linhas = useMemo(() => resumo?.linhas ?? [], [resumo]);
  const stats = resumo?.stats;

  const filtradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return linhas.filter((l) => {
      if (termo && !l.motoboyNome.toLowerCase().includes(termo)) return false;
      if (filtroStatus && l.status !== filtroStatus) return false;
      if (filtroMotoboy && l.motoboyId !== filtroMotoboy) return false;
      return true;
    });
  }, [linhas, busca, filtroStatus, filtroMotoboy]);

  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / ITENS_POR_PAGINA));
  const paginaAtual = Math.min(pagina, totalPaginas);
  const linhasPagina = filtradas.slice((paginaAtual - 1) * ITENS_POR_PAGINA, paginaAtual * ITENS_POR_PAGINA);

  const handlePagar = async (motoboyId: string) => {
    setPagandoId(motoboyId);
    try {
      await pagarMotoboy(empresaId, motoboyId);
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao registrar pagamento');
    } finally {
      setPagandoId(null);
    }
  };

  if (loading && !resumo) {
    return <p className="text-center text-gray-500 py-8">Carregando...</p>;
  }

  return (
    <div>
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-4">
            <p className="text-xs text-gray-500 mb-1 flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5 text-amber-500" /> A receber</p>
            <p className="text-2xl font-bold text-gray-800">R$ {stats.aReceber.toFixed(2)}</p>
            <p className="text-[11px] text-gray-400">{stats.motoboysAReceber} motoboy{stats.motoboysAReceber !== 1 ? 's' : ''}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-4">
            <p className="text-xs text-gray-500 mb-1 flex items-center gap-1.5"><HandCoins className="h-3.5 w-3.5 text-emerald-500" /> Já pago</p>
            <p className="text-2xl font-bold text-gray-800">R$ {stats.jaPago.toFixed(2)}</p>
            <p className="text-[11px] text-gray-400">{stats.motoboysJaPago} motoboy{stats.motoboysJaPago !== 1 ? 's' : ''}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-4">
            <p className="text-xs text-gray-500 mb-1 flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-blue-500" /> Este mês</p>
            <p className="text-2xl font-bold text-gray-800">R$ {stats.esteMes.toFixed(2)}</p>
            <p className="text-[11px] text-gray-400">{stats.totalPagamentosEsteMes} pagamento{stats.totalPagamentosEsteMes !== 1 ? 's' : ''}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-4">
            <p className="text-xs text-gray-500 mb-1 flex items-center gap-1.5"><TrendingUp className="h-3.5 w-3.5 text-purple-500" /> Média por entrega</p>
            <p className="text-2xl font-bold text-gray-800">R$ {stats.mediaPorEntrega.toFixed(2)}</p>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            value={busca}
            onChange={(e) => { setBusca(e.target.value); setPagina(1); }}
            placeholder="Buscar motoboy..."
            className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm"
          />
        </div>
        <select
          value={filtroStatus}
          onChange={(e) => { setFiltroStatus(e.target.value as typeof filtroStatus); setPagina(1); }}
          className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white"
        >
          <option value="">Todos os status</option>
          <option value="A_PAGAR">A pagar</option>
          <option value="PAGO">Pago</option>
        </select>
        <select
          value={filtroMotoboy}
          onChange={(e) => { setFiltroMotoboy(e.target.value); setPagina(1); }}
          className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white"
        >
          <option value="">Todos os motoboys</option>
          {motoboys.map((m) => (
            <option key={m.id} value={m.id}>{m.nome}</option>
          ))}
        </select>
        <input
          type="date"
          value={de}
          onChange={(e) => { setDe(e.target.value); setPagina(1); }}
          className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm"
        />
        <input
          type="date"
          value={ate}
          onChange={(e) => { setAte(e.target.value); setPagina(1); }}
          className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm"
        />
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-gray-500 bg-gray-50">
                <th className="py-3 px-4">Motoboy</th>
                <th className="py-3 px-4">Período</th>
                <th className="py-3 px-4">Entregas</th>
                <th className="py-3 px-4">Valor bruto</th>
                <th className="py-3 px-4">Descontos</th>
                <th className="py-3 px-4">Total</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Ações</th>
              </tr>
            </thead>
            <tbody>
              {linhasPagina.map((l) => (
                <tr key={l.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <Bike className="h-4 w-4 text-orange-500 shrink-0" />
                      <span className="font-medium text-gray-800">{l.motoboyNome}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-600">
                    {formatData(l.periodoDe)} – {formatData(l.periodoAte)}
                  </td>
                  <td className="py-3 px-4 text-gray-600">{l.entregas}</td>
                  <td className="py-3 px-4 text-gray-800">R$ {l.valorBruto.toFixed(2)}</td>
                  <td className="py-3 px-4 text-gray-500">{l.descontos > 0 ? `- R$ ${l.descontos.toFixed(2)}` : '—'}</td>
                  <td className="py-3 px-4 font-semibold text-gray-800">R$ {l.total.toFixed(2)}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${l.status === 'PAGO' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                      {l.status === 'PAGO' ? 'Pago' : 'A pagar'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {l.status === 'A_PAGAR' ? (
                      <button
                        onClick={() => handlePagar(l.motoboyId)}
                        disabled={pagandoId === l.motoboyId}
                        className="flex items-center gap-1 bg-gray-800 hover:bg-gray-900 text-white text-xs px-3 py-1.5 rounded-lg disabled:opacity-60"
                      >
                        {pagandoId === l.motoboyId ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Pagar'}
                      </button>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {linhasPagina.length === 0 && <p className="text-center text-gray-500 py-10">Nenhum pagamento encontrado.</p>}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-gray-100">
          <p className="text-xs text-gray-500">
            Mostrando {filtradas.length === 0 ? 0 : (paginaAtual - 1) * ITENS_POR_PAGINA + 1} a{' '}
            {Math.min(paginaAtual * ITENS_POR_PAGINA, filtradas.length)} de {filtradas.length} pagamentos
          </p>
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

      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-4">
            <p className="font-bold text-gray-800 mb-3">Formas de pagamento</p>
            <DonutChart
              segments={stats.formaPagamento.map((f) => ({
                label: f.formaPagamento,
                value: f.total,
                colorClass: CORES_FORMA_PAGAMENTO[f.formaPagamento]?.colorClass || 'bg-gray-400',
                strokeClass: CORES_FORMA_PAGAMENTO[f.formaPagamento]?.strokeClass || 'stroke-gray-400',
              }))}
              formatValue={(v) => `R$ ${v.toFixed(0)}`}
              centerLabel="pago no período"
            />
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-4">
            <p className="font-bold text-gray-800 mb-3">Próximos pagamentos</p>
            <div className="space-y-2">
              {stats.proximosPagamentos.length === 0 && (
                <p className="text-sm text-gray-400 py-4 text-center">Nenhum pagamento pendente.</p>
              )}
              {stats.proximosPagamentos.map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-3 bg-gray-50 rounded-lg px-3 py-2 text-sm">
                  <div className="min-w-0">
                    <p className="font-medium text-gray-800 truncate">{p.motoboyNome}</p>
                    <p className="text-xs text-gray-400">{p.entregas} entrega{p.entregas !== 1 ? 's' : ''} · {formatData(p.periodoDe)} – {formatData(p.periodoAte)}</p>
                  </div>
                  <span className="font-bold text-amber-700 shrink-0">R$ {p.total.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MotoboyPagamentosTab;
