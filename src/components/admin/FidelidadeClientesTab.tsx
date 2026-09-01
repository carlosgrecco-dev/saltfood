import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Search, Gift, Plus, Clock, Wallet, Medal, UserPlus, Users, ChevronLeft, ChevronRight, Loader2,
} from 'lucide-react';
import { fetchClientes, liberarResgateCliente, adicionarUnidadesFidelidade } from '../../lib/clientes';
import { fetchEmpresaById } from '../../lib/empresas';
import {
  Cliente, loyaltyProgress, loyaltyExpiracao, LOYALTY_STAMPS_GOAL,
  loyaltyTier, LOYALTY_TIER_LABELS, LoyaltyTier, indicadorNivel, NIVEL_INDICADOR_LABELS,
} from '../../types/Cliente';

const TIER_BADGE_COLORS: Record<LoyaltyTier, string> = {
  BRONZE: 'bg-amber-100 text-amber-800',
  PRATA: 'bg-slate-200 text-slate-700',
  OURO: 'bg-yellow-100 text-yellow-800',
};

interface FidelidadeClientesTabProps {
  empresaId: string;
}

const ITENS_POR_PAGINA = 10;

const formatDiasRestantes = (expiraEm: Date) => {
  const dias = Math.ceil((expiraEm.getTime() - Date.now()) / 86400000);
  if (dias <= 0) return 'expira hoje';
  if (dias === 1) return 'expira em 1 dia';
  return `expira em ${dias} dias`;
};

const FidelidadeClientesTab: React.FC<FidelidadeClientesTabProps> = ({ empresaId }) => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [fidelidadeValidadeDias, setFidelidadeValidadeDias] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [filtroTier, setFiltroTier] = useState<LoyaltyTier | ''>('');
  const [somenteProntos, setSomenteProntos] = useState(false);
  const [pagina, setPagina] = useState(1);
  const [unidadesDraft, setUnidadesDraft] = useState<Record<string, string>>({});
  const [processandoId, setProcessandoId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [listaClientes, empresa] = await Promise.all([
        fetchClientes(empresaId),
        fetchEmpresaById(empresaId),
      ]);
      setClientes(listaClientes);
      setFidelidadeValidadeDias(empresa.fidelidadeValidadeDias);
    } catch {
      /* silencioso */
    } finally {
      setLoading(false);
    }
  }, [empresaId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleLiberarResgate = async (cliente: Cliente) => {
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

  const handleAdicionarUnidades = async (cliente: Cliente) => {
    const valor = Number(unidadesDraft[cliente.id]);
    if (!Number.isInteger(valor) || valor < 1) {
      alert('Digite quantas unidades adicionar (número inteiro maior que zero).');
      return;
    }
    setProcessandoId(cliente.id);
    try {
      await adicionarUnidadesFidelidade(empresaId, cliente.id, valor);
      setUnidadesDraft((prev) => ({ ...prev, [cliente.id]: '' }));
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Não foi possível adicionar as unidades.');
    } finally {
      setProcessandoId(null);
    }
  };

  const linhas = useMemo(() => {
    return clientes.map((cliente) => ({
      cliente,
      progresso: loyaltyProgress(cliente),
      tier: loyaltyTier(cliente),
      expiracao: loyaltyExpiracao(cliente, { fidelidadeValidadeDias }),
    }));
  }, [clientes, fidelidadeValidadeDias]);

  const stats = useMemo(() => {
    const prontos = linhas.filter((l) => l.expiracao.disponiveis > 0).length;
    const cashbackTotal = clientes.reduce((s, c) => s + c.saldoCashback, 0);
    const fieis = linhas.filter((l) => l.tier !== 'BRONZE').length;
    const indicacoes = clientes.reduce((s, c) => s + c.indicacoesConcluidas, 0);
    return { total: clientes.length, prontos, cashbackTotal, fieis, indicacoes };
  }, [clientes, linhas]);

  const filtradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return linhas
      .filter(({ cliente, tier, expiracao }) => {
        if (termo && !cliente.nome.toLowerCase().includes(termo) && !(cliente.email || '').toLowerCase().includes(termo) && !(cliente.telefone || '').includes(termo)) return false;
        if (filtroTier && tier !== filtroTier) return false;
        if (somenteProntos && expiracao.disponiveis === 0) return false;
        return true;
      })
      .sort((a, b) => {
        if (a.expiracao.disponiveis !== b.expiracao.disponiveis) return b.expiracao.disponiveis - a.expiracao.disponiveis;
        if (a.progresso.stamps !== b.progresso.stamps) return b.progresso.stamps - a.progresso.stamps;
        return a.cliente.nome.localeCompare(b.cliente.nome);
      });
  }, [linhas, busca, filtroTier, somenteProntos]);

  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / ITENS_POR_PAGINA));
  const paginaAtual = Math.min(pagina, totalPaginas);
  const linhasPagina = filtradas.slice((paginaAtual - 1) * ITENS_POR_PAGINA, paginaAtual * ITENS_POR_PAGINA);

  if (loading) {
    return <p className="text-center text-gray-500 py-8">Carregando...</p>;
  }

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <p className="text-xs text-gray-500 mb-1 flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> Total de clientes</p>
          <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <p className="text-xs text-gray-500 mb-1 flex items-center gap-1.5"><Gift className="h-3.5 w-3.5 text-orange-500" /> Prontos p/ resgate</p>
          <p className="text-2xl font-bold text-gray-800">{stats.prontos}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <p className="text-xs text-gray-500 mb-1 flex items-center gap-1.5"><Wallet className="h-3.5 w-3.5 text-emerald-500" /> Cashback acumulado</p>
          <p className="text-2xl font-bold text-gray-800">R$ {stats.cashbackTotal.toFixed(2)}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <p className="text-xs text-gray-500 mb-1 flex items-center gap-1.5"><Medal className="h-3.5 w-3.5 text-yellow-500" /> Clientes fiéis</p>
          <p className="text-2xl font-bold text-gray-800">{stats.fieis}</p>
          <p className="text-[11px] text-gray-400">Prata ou Ouro</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <p className="text-xs text-gray-500 mb-1 flex items-center gap-1.5"><UserPlus className="h-3.5 w-3.5 text-indigo-500" /> Indicações concluídas</p>
          <p className="text-2xl font-bold text-gray-800">{stats.indicacoes}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative flex-1 min-w-[220px]">
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
        <label className="flex items-center gap-1.5 text-sm text-gray-600 bg-white border border-gray-300 rounded-lg px-3 py-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={somenteProntos}
            onChange={(e) => { setSomenteProntos(e.target.checked); setPagina(1); }}
          />
          Só prontos p/ resgate
        </label>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-gray-500 bg-gray-50">
                <th className="py-3 px-4">Cliente</th>
                <th className="py-3 px-4">Nível</th>
                <th className="py-3 px-4">Progresso</th>
                <th className="py-3 px-4">Resgate</th>
                <th className="py-3 px-4">Cashback</th>
                <th className="py-3 px-4">Indicações</th>
                <th className="py-3 px-4">Ações</th>
              </tr>
            </thead>
            <tbody>
              {linhasPagina.map(({ cliente, progresso, tier, expiracao }) => {
                const processando = processandoId === cliente.id;
                return (
                  <tr key={cliente.id} className="border-b border-gray-100 hover:bg-gray-50 align-top">
                    <td className="py-3 px-4">
                      <div className="min-w-[180px]">
                        <p className="font-bold text-gray-800">{cliente.nome}</p>
                        {cliente.email && <p className="text-xs text-gray-400 truncate">{cliente.email}</p>}
                        {cliente.telefone && <p className="text-xs text-gray-400">{cliente.telefone}</p>}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${TIER_BADGE_COLORS[tier]}`}>
                        <Medal className="h-3 w-3" /> {LOYALTY_TIER_LABELS[tier]}
                      </span>
                      <p className="text-[11px] text-gray-400 mt-1">{cliente.totalUnidadesCompradas} unid. no total</p>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2 min-w-[140px]">
                        <div className="h-1.5 w-20 overflow-hidden rounded-full bg-gray-100">
                          <div
                            className="h-full rounded-full bg-orange-500 transition-all"
                            style={{ width: `${(progresso.stamps / LOYALTY_STAMPS_GOAL) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs font-mono text-gray-600">{progresso.stamps}/{LOYALTY_STAMPS_GOAL}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {expiracao.disponiveis > 0 ? (
                        <div>
                          <span className="flex items-center gap-1 text-[11px] font-bold text-orange-700 bg-orange-100 px-2 py-0.5 rounded-full w-fit">
                            <Gift className="h-3 w-3" /> {expiracao.disponiveis} pronto{expiracao.disponiveis > 1 ? 's' : ''}
                          </span>
                          {expiracao.expiraEm && (
                            <span className="flex items-center gap-1 text-[10px] text-gray-400 mt-1">
                              <Clock className="h-2.5 w-2.5" /> {formatDiasRestantes(expiracao.expiraEm)}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {cliente.saldoCashback > 0 ? (
                        <span className="font-semibold text-emerald-700">R$ {cliente.saldoCashback.toFixed(2)}</span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {cliente.indicacoesConcluidas > 0 ? (
                        <span className="text-gray-600">{cliente.indicacoesConcluidas} · {NIVEL_INDICADOR_LABELS[indicadorNivel(cliente).nivel]}</span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-col gap-1.5 min-w-[190px]">
                        {expiracao.disponiveis > 0 && (
                          <button
                            onClick={() => handleLiberarResgate(cliente)}
                            disabled={processando}
                            className="flex items-center justify-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs px-3 py-1.5 rounded-lg disabled:opacity-60"
                          >
                            <Gift className="h-3.5 w-3.5" /> Liberar resgate
                          </button>
                        )}
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min={1}
                            placeholder="Ex: 2"
                            value={unidadesDraft[cliente.id] || ''}
                            onChange={(e) => setUnidadesDraft((prev) => ({ ...prev, [cliente.id]: e.target.value }))}
                            className="w-16 px-2 py-1.5 border border-gray-300 rounded-lg text-xs text-center"
                          />
                          <button
                            onClick={() => handleAdicionarUnidades(cliente)}
                            disabled={processando || !unidadesDraft[cliente.id]}
                            title="Creditar unidades (retirada/compra por telefone)"
                            className="flex items-center gap-1 bg-gray-800 hover:bg-gray-900 text-white text-xs px-2.5 py-1.5 rounded-lg disabled:opacity-60"
                          >
                            {processando ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {linhasPagina.length === 0 && (
            <p className="text-center text-gray-500 py-10">
              {busca || filtroTier || somenteProntos ? 'Nenhum cliente encontrado para esse filtro' : 'Nenhum cliente cadastrado ainda'}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-gray-100">
          <p className="text-xs text-gray-500">
            Mostrando {filtradas.length === 0 ? 0 : (paginaAtual - 1) * ITENS_POR_PAGINA + 1} a{' '}
            {Math.min(paginaAtual * ITENS_POR_PAGINA, filtradas.length)} de {filtradas.length} clientes
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
    </div>
  );
};

export default FidelidadeClientesTab;
