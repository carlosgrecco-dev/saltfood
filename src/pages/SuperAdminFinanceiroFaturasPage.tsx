import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wallet, Plus, Layers, Loader2, Trash2, ArrowLeft } from 'lucide-react';
import SuperAdminNav from '../components/superadmin/SuperAdminNav';
import { getSuperAdminSession, signOutSuperAdmin } from '../lib/superAdminAuth';
import { fetchEmpresas } from '../lib/empresas';
import { fetchFaturas, gerarFatura, gerarFaturasEmLote, setFaturaStatus, deleteFatura } from '../lib/faturas';
import { Empresa } from '../types/Empresa';
import { Fatura, StatusFatura } from '../types/Fatura';
import { useSuperAdminManifest } from '../hooks/useSuperAdminManifest';

type Feedback = { type: 'success' | 'error'; message: string } | null;

const todayISO = () => new Date().toISOString().slice(0, 10);
const firstOfMonthISO = () => {
  const d = new Date();
  d.setDate(1);
  return d.toISOString().slice(0, 10);
};

const STATUS_BADGE: Record<StatusFatura, string> = {
  PENDENTE: 'bg-amber-100 text-amber-800',
  PAGO: 'bg-emerald-100 text-emerald-800',
  ATRASADO: 'bg-red-100 text-red-800',
};

const SuperAdminFinanceiroFaturasPage: React.FC = () => {
  useSuperAdminManifest();
  const navigate = useNavigate();
  const [authorized] = useState(() => !!getSuperAdminSession());

  useEffect(() => {
    const handler = (e: Event) => {
      if ((e as CustomEvent).detail?.kind !== 'superadmin') return;
      signOutSuperAdmin();
      navigate('/super-admin', { replace: true });
    };
    window.addEventListener('kifood:session-expired', handler);
    return () => window.removeEventListener('kifood:session-expired', handler);
  }, [navigate]);

  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [faturas, setFaturas] = useState<Fatura[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [navOpen, setNavOpen] = useState(true);

  const [filtroEmpresa, setFiltroEmpresa] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<StatusFatura | ''>('');

  const [gerarEmpresaId, setGerarEmpresaId] = useState('todas');
  const [periodoInicio, setPeriodoInicio] = useState(firstOfMonthISO());
  const [periodoFim, setPeriodoFim] = useState(todayISO());
  const [vencimento, setVencimento] = useState(todayISO());
  const [gerando, setGerando] = useState(false);

  useEffect(() => {
    if (!authorized) navigate('/super-admin', { replace: true });
  }, [authorized, navigate]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [emp, fat] = await Promise.all([fetchEmpresas(), fetchFaturas()]);
      setEmpresas(emp);
      setFaturas(fat);
    } catch (err) {
      setFeedback({ type: 'error', message: err instanceof Error ? err.message : 'Erro ao carregar faturas' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authorized) loadAll();
  }, [authorized, loadAll]);

  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => setFeedback(null), 4000);
    return () => clearTimeout(timer);
  }, [feedback]);

  const faturasFiltradas = useMemo(
    () =>
      faturas.filter(
        (f) => (!filtroEmpresa || f.empresaId === filtroEmpresa) && (!filtroStatus || f.status === filtroStatus)
      ),
    [faturas, filtroEmpresa, filtroStatus]
  );

  const handleGerar = async (e: React.FormEvent) => {
    e.preventDefault();
    setGerando(true);
    try {
      if (gerarEmpresaId === 'todas') {
        const resultado = await gerarFaturasEmLote({ periodoInicio, periodoFim, vencimento });
        setFeedback({
          type: 'success',
          message: `${resultado.geradas} fatura(s) gerada(s)${resultado.puladas.length ? ` — já existiam para: ${resultado.puladas.join(', ')}` : ''}.`,
        });
      } else {
        await gerarFatura({ empresaId: gerarEmpresaId, periodoInicio, periodoFim, vencimento });
        setFeedback({ type: 'success', message: 'Fatura gerada com sucesso.' });
      }
      loadAll();
    } catch (err) {
      setFeedback({ type: 'error', message: err instanceof Error ? err.message : 'Erro ao gerar fatura' });
    } finally {
      setGerando(false);
    }
  };

  const handleStatus = async (fatura: Fatura, status: StatusFatura) => {
    try {
      const atualizada = await setFaturaStatus(fatura.id, status);
      setFaturas((prev) => prev.map((f) => (f.id === atualizada.id ? atualizada : f)));
    } catch (err) {
      setFeedback({ type: 'error', message: err instanceof Error ? err.message : 'Erro ao atualizar status' });
    }
  };

  const handleDelete = async (fatura: Fatura) => {
    if (!window.confirm(`Remover a fatura de ${fatura.empresa.nome}?`)) return;
    try {
      await deleteFatura(fatura.id);
      setFaturas((prev) => prev.filter((f) => f.id !== fatura.id));
    } catch (err) {
      setFeedback({ type: 'error', message: err instanceof Error ? err.message : 'Erro ao remover fatura' });
    }
  };

  if (!authorized) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className={`transition-[margin] duration-300 ease-in-out ml-0 ${navOpen ? 'sm:ml-72' : 'sm:ml-16'}`}>
        <div className="border-b border-gray-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <button
              onClick={() => navigate('/super-admin/financeiro')}
              className="mb-3 inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" /> Voltar
            </button>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 shrink-0 rounded-xl bg-black p-1.5">
                  <img src="/logo.png" alt="SaltFood" className="h-full w-full rounded-md" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-orange-500">Super Admin</p>
                  <h1 className="text-xl font-bold text-gray-900">Faturas e Cobranças</h1>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { signOutSuperAdmin(); navigate('/super-admin', { replace: true }); }}
                  className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-semibold text-gray-500 hover:bg-gray-100 transition-colors"
                >
                  Sair
                </button>
                <SuperAdminNav onOpenChange={setNavOpen} />
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
          {feedback && (
            <div className={`rounded-xl px-4 py-3 text-sm font-medium ${feedback.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
              {feedback.message}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
            </div>
          ) : (
            <>
              <div className="rounded-2xl border border-gray-200 bg-white p-5">
                <h2 className="flex items-center gap-2 font-bold text-gray-800 mb-4">
                  <Plus className="h-4 w-4 text-orange-500" /> Gerar fatura
                </h2>
                <form onSubmit={handleGerar} className="flex flex-wrap items-end gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Empresa</label>
                    <select
                      value={gerarEmpresaId}
                      onChange={(e) => setGerarEmpresaId(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm min-w-[200px]"
                    >
                      <option value="todas">Todas as empresas ativas (lote)</option>
                      {empresas.map((emp) => (
                        <option key={emp.id} value={emp.id}>{emp.nome}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Período de</label>
                    <input type="date" value={periodoInicio} onChange={(e) => setPeriodoInicio(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" required />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">até</label>
                    <input type="date" value={periodoFim} onChange={(e) => setPeriodoFim(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" required />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Vencimento</label>
                    <input type="date" value={vencimento} onChange={(e) => setVencimento(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" required />
                  </div>
                  <button
                    type="submit"
                    disabled={gerando}
                    className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-4 py-2.5 rounded-lg disabled:opacity-60"
                  >
                    {gerando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Layers className="h-4 w-4" />}
                    {gerando ? 'Gerando...' : 'Gerar'}
                  </button>
                </form>
                <p className="text-xs text-gray-400 mt-2">
                  A comissão usa o percentual vigente de cada empresa; se houver plano atribuído, a mensalidade do plano é somada ao total da fatura.
                </p>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-5">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <h2 className="flex items-center gap-2 font-bold text-gray-800">
                    <Wallet className="h-4 w-4 text-orange-500" /> Faturas
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    <select value={filtroEmpresa} onChange={(e) => setFiltroEmpresa(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
                      <option value="">Todas as empresas</option>
                      {empresas.map((emp) => (
                        <option key={emp.id} value={emp.id}>{emp.nome}</option>
                      ))}
                    </select>
                    <select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value as StatusFatura | '')} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
                      <option value="">Todos os status</option>
                      <option value="PENDENTE">Pendente</option>
                      <option value="PAGO">Pago</option>
                      <option value="ATRASADO">Atrasado</option>
                    </select>
                  </div>
                </div>

                {faturasFiltradas.length === 0 ? (
                  <p className="text-center text-gray-400 py-12 text-sm">Nenhuma fatura encontrada.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-gray-100 text-xs font-semibold uppercase tracking-wide text-gray-500">
                          <th className="py-2 pr-3">Empresa</th>
                          <th className="py-2 pr-3">Período</th>
                          <th className="py-2 pr-3">Vendas</th>
                          <th className="py-2 pr-3">Comissão</th>
                          <th className="py-2 pr-3">Plano</th>
                          <th className="py-2 pr-3">Total</th>
                          <th className="py-2 pr-3">Vencimento</th>
                          <th className="py-2 pr-3">Status</th>
                          <th className="py-2 pr-3 text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {faturasFiltradas.map((f) => (
                          <tr key={f.id}>
                            <td className="py-3 pr-3 font-medium text-gray-800">{f.empresa.nome}</td>
                            <td className="py-3 pr-3 text-gray-500 text-xs">
                              {new Date(f.periodoInicio).toLocaleDateString('pt-BR')} – {new Date(f.periodoFim).toLocaleDateString('pt-BR')}
                            </td>
                            <td className="py-3 pr-3 text-gray-600">R$ {f.valorVendas.toFixed(2)}</td>
                            <td className="py-3 pr-3 text-gray-600">R$ {f.valorComissao.toFixed(2)} <span className="text-xs text-gray-400">({f.comissaoPercent}%)</span></td>
                            <td className="py-3 pr-3 text-gray-600">R$ {f.valorPlano.toFixed(2)}</td>
                            <td className="py-3 pr-3 font-bold text-gray-800">
                              R$ {f.valorTotal.toFixed(2)}
                              {!!f.creditoIndicacaoAplicado && (
                                <span className="block text-[10px] font-normal text-emerald-600">
                                  -R$ {f.creditoIndicacaoAplicado.toFixed(2)} crédito indicação
                                </span>
                              )}
                            </td>
                            <td className="py-3 pr-3 text-gray-500 text-xs">{new Date(f.vencimento).toLocaleDateString('pt-BR')}</td>
                            <td className="py-3 pr-3">
                              <select
                                value={f.status}
                                onChange={(e) => handleStatus(f, e.target.value as StatusFatura)}
                                className={`rounded-full px-2.5 py-1 text-xs font-semibold border-0 ${STATUS_BADGE[f.status]}`}
                              >
                                <option value="PENDENTE">Pendente</option>
                                <option value="PAGO">Pago</option>
                                <option value="ATRASADO">Atrasado</option>
                              </select>
                              {f.atrasada && f.status !== 'ATRASADO' && (
                                <span className="ml-1.5 text-[10px] text-red-600 font-semibold">venceu</span>
                              )}
                            </td>
                            <td className="py-3 pr-3 text-right">
                              <button onClick={() => handleDelete(f)} className="text-gray-400 hover:text-red-600 p-1.5">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SuperAdminFinanceiroFaturasPage;
