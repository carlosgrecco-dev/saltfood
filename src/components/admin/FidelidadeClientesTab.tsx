import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Search, Gift, Plus, Clock, Wallet, Medal, UserPlus } from 'lucide-react';
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
    const termo = busca.trim().toLowerCase();
    const filtrados = termo
      ? clientes.filter(
          (c) =>
            c.nome.toLowerCase().includes(termo) ||
            c.email.toLowerCase().includes(termo) ||
            (c.telefone || '').includes(termo)
        )
      : clientes;

    return filtrados
      .map((cliente) => ({
        cliente,
        progresso: loyaltyProgress(cliente),
        expiracao: fidelidadeValidadeDias != null
          ? loyaltyExpiracao(cliente, { fidelidadeValidadeDias })
          : loyaltyExpiracao(cliente, { fidelidadeValidadeDias: null }),
      }))
      .sort((a, b) => {
        if (a.expiracao.disponiveis !== b.expiracao.disponiveis) return b.expiracao.disponiveis - a.expiracao.disponiveis;
        if (a.progresso.stamps !== b.progresso.stamps) return b.progresso.stamps - a.progresso.stamps;
        return a.cliente.nome.localeCompare(b.cliente.nome);
      });
  }, [clientes, busca, fidelidadeValidadeDias]);

  if (loading) {
    return <p className="text-center text-gray-500 py-8">Carregando...</p>;
  }

  return (
    <div>
      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nome, e-mail ou telefone..."
          className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm"
        />
      </div>

      <div className="space-y-2">
        {linhas.map(({ cliente, progresso, expiracao }) => {
          const processando = processandoId === cliente.id;
          return (
            <div key={cliente.id} className="border border-gray-200 rounded-xl p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <p className="font-bold text-gray-800">{cliente.nome}</p>
                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${TIER_BADGE_COLORS[loyaltyTier(cliente)]}`}>
                      <Medal className="h-2.5 w-2.5" /> {LOYALTY_TIER_LABELS[loyaltyTier(cliente)]}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 truncate">{cliente.email}{cliente.telefone ? ` · ${cliente.telefone}` : ''}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{cliente.totalUnidadesCompradas} unidades compradas no total</p>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1">
                    {cliente.saldoCashback > 0 && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                        <Wallet className="h-3 w-3" /> R$ {cliente.saldoCashback.toFixed(2)} em cashback
                      </span>
                    )}
                    {cliente.indicacoesConcluidas > 0 && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full">
                        <UserPlus className="h-3 w-3" /> {cliente.indicacoesConcluidas} indicaç{cliente.indicacoesConcluidas > 1 ? 'ões' : 'ão'} · Nível {NIVEL_INDICADOR_LABELS[indicadorNivel(cliente).nivel]}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1 shrink-0">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-24 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full bg-orange-500 transition-all"
                        style={{ width: `${(progresso.stamps / LOYALTY_STAMPS_GOAL) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-mono text-gray-600">{progresso.stamps}/{LOYALTY_STAMPS_GOAL}</span>
                  </div>
                  {expiracao.disponiveis > 0 && (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-orange-700 bg-orange-100 px-2 py-0.5 rounded-full">
                      <Gift className="h-3 w-3" /> {expiracao.disponiveis} pronto{expiracao.disponiveis > 1 ? 's' : ''} p/ resgate
                    </span>
                  )}
                  {expiracao.disponiveis > 0 && expiracao.expiraEm && (
                    <span className="flex items-center gap-1 text-[10px] text-gray-400">
                      <Clock className="h-2.5 w-2.5" /> {formatDiasRestantes(expiracao.expiraEm)}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                {expiracao.disponiveis > 0 && (
                  <button
                    onClick={() => handleLiberarResgate(cliente)}
                    disabled={processando}
                    className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs px-3 py-1.5 rounded-lg disabled:opacity-60"
                  >
                    <Gift className="h-3.5 w-3.5" /> Liberar resgate
                  </button>
                )}

                <div className="flex items-center gap-1.5 ml-auto">
                  <span className="text-xs text-gray-500">Creditar unidades (retirada/compra por telefone):</span>
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
                    className="flex items-center gap-1 bg-gray-800 hover:bg-gray-900 text-white text-xs px-2.5 py-1.5 rounded-lg disabled:opacity-60"
                  >
                    <Plus className="h-3.5 w-3.5" /> Adicionar
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {linhas.length === 0 && (
          <p className="text-center text-gray-500 py-8">
            {busca ? 'Nenhum cliente encontrado para essa busca' : 'Nenhum cliente cadastrado ainda'}
          </p>
        )}
      </div>
    </div>
  );
};

export default FidelidadeClientesTab;
