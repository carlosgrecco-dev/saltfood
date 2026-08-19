import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Wallet, Plus, Layers, AlertTriangle, ShieldOff, Loader2, Trash2, ArrowLeft,
  Building2, CheckCircle2, Unlock, Receipt, Clock3, HandCoins, Users,
} from 'lucide-react';
import SuperAdminNav from '../components/superadmin/SuperAdminNav';
import { getSuperAdminSession, signOutSuperAdmin } from '../lib/superAdminAuth';
import { fetchEmpresas, setEmpresaStatus } from '../lib/empresas';
import { fetchPlanos } from '../lib/planos';
import { fetchFaturas, gerarFatura, gerarFaturasEmLote, setFaturaStatus, deleteFatura } from '../lib/faturas';
import { Empresa } from '../types/Empresa';
import { Plano } from '../types/Plano';
import { Fatura, StatusFatura } from '../types/Fatura';

type Feedback = { type: 'success' | 'error'; message: string } | null;
type Tab = 'tenants' | 'atraso' | 'em-dia' | 'bloqueados' | 'faturas';

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

const TABS: { id: Tab; label: string; icon: typeof Building2 }[] = [
  { id: 'tenants', label: 'Tenants & Planos', icon: Building2 },
  { id: 'atraso', label: 'Em atraso', icon: AlertTriangle },
  { id: 'em-dia', label: 'Em dia', icon: CheckCircle2 },
  { id: 'bloqueados', label: 'Bloqueados', icon: ShieldOff },
  { id: 'faturas', label: 'Faturas', icon: Receipt },
];

const SuperAdminFinanceiroPage: React.FC = () => {
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

  const [tab, setTab] = useState<Tab>('tenants');
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [planos, setPlanos] = useState<Plano[]>([]);
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
      const [emp, pl, fat] = await Promise.all([fetchEmpresas(), fetchPlanos(), fetchFaturas()]);
      setEmpresas(emp);
      setPlanos(pl);
      setFaturas(fat);
    } catch (err) {
      setFeedback({ type: 'error', message: err instanceof Error ? err.message : 'Erro ao carregar dados financeiros' });
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

  const planosPorId = useMemo(() => new Map(planos.map((p) => [p.id, p])), [planos]);

  const faturasAtrasadasPorEmpresa = useMemo(() => {
    const map = new Map<string, Fatura[]>();
    for (const f of faturas) {
      if (!f.atrasada) continue;
      const atual = map.get(f.empresaId) || [];
      atual.push(f);
      map.set(f.empresaId, atual);
    }
    return map;
  }, [faturas]);

  const totalPagoPorEmpresa = useMemo(() => {
    const map = new Map<string, number>();
    for (const f of faturas) {
      if (f.status !== 'PAGO') continue;
      map.set(f.empresaId, (map.get(f.empresaId) || 0) + f.valorTotal);
    }
    return map;
  }, [faturas]);

  // Dashboard principal: recebido / a receber / em atraso são partições que não se sobrepõem.
  const totalRecebido = useMemo(() => faturas.filter((f) => f.status === 'PAGO').reduce((s, f) => s + f.valorTotal, 0), [faturas]);
  const totalEmAtraso = useMemo(() => faturas.filter((f) => f.atrasada).reduce((s, f) => s + f.valorTotal, 0), [faturas]);
  const totalAReceber = useMemo(
    () => faturas.filter((f) => f.status !== 'PAGO' && !f.atrasada).reduce((s, f) => s + f.valorTotal, 0),
    [faturas]
  );
  const totalBloqueados = useMemo(() => empresas.filter((e) => !e.empresaAtiva).length, [empresas]);

  const empresasEmAtraso = useMemo(() => empresas.filter((e) => faturasAtrasadasPorEmpresa.has(e.id)), [empresas, faturasAtrasadasPorEmpresa]);
  const empresasEmDia = useMemo(() => empresas.filter((e) => !faturasAtrasadasPorEmpresa.has(e.id)), [empresas, faturasAtrasadasPorEmpresa]);
  const empresasBloqueadas = useMemo(() => empresas.filter((e) => !e.empresaAtiva), [empresas]);

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

  const handleBloquear = async (empresaId: string, nome: string) => {
    if (!window.confirm(`Bloquear "${nome}" por inadimplência? A loja ficará inativa até você reativar.`)) return;
    try {
      await setEmpresaStatus(empresaId, false);
      setFeedback({ type: 'success', message: `"${nome}" foi bloqueada.` });
      loadAll();
    } catch (err) {
      setFeedback({ type: 'error', message: err instanceof Error ? err.message : 'Erro ao bloquear empresa' });
    }
  };

  const handleAtivar = async (empresaId: string, nome: string) => {
    try {
      await setEmpresaStatus(empresaId, true);
      setFeedback({ type: 'success', message: `"${nome}" foi reativada imediatamente.` });
      loadAll();
    } catch (err) {
      setFeedback({ type: 'error', message: err instanceof Error ? err.message : 'Erro ao ativar empresa' });
    }
  };

  if (!authorized) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className={`transition-[margin] duration-300 ease-in-out ml-16 ${navOpen ? 'sm:ml-72' : ''}`}>
        <div className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <button
              onClick={() => navigate('/super-admin/empresas')}
              className="mb-3 inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" /> Voltar
            </button>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-black shadow-sm shadow-indigo-200">
                  <img src="/logo-sigma-digital.png" alt="Sigma Soluções Digitais" className="h-full w-full object-cover" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Super Admin</p>
                  <h1 className="text-xl font-bold text-slate-900">Financeiro</h1>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { signOutSuperAdmin(); navigate('/super-admin', { replace: true }); }}
                  className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-500 hover:bg-slate-100 transition-colors"
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

          {/* Dashboard principal — sempre visível, independente da aba selecionada */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-2xl p-4">
              <p className="flex items-center gap-1.5 text-emerald-100 text-xs mb-1 font-semibold uppercase tracking-wide">
                <HandCoins className="h-3.5 w-3.5" /> Recebido
              </p>
              <p className="text-2xl font-bold">R$ {totalRecebido.toFixed(2)}</p>
            </div>
            <div className="bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-2xl p-4">
              <p className="flex items-center gap-1.5 text-amber-100 text-xs mb-1 font-semibold uppercase tracking-wide">
                <Clock3 className="h-3.5 w-3.5" /> A receber
              </p>
              <p className="text-2xl font-bold">R$ {totalAReceber.toFixed(2)}</p>
            </div>
            <div className="bg-gradient-to-br from-red-500 to-rose-600 text-white rounded-2xl p-4">
              <p className="flex items-center gap-1.5 text-red-100 text-xs mb-1 font-semibold uppercase tracking-wide">
                <AlertTriangle className="h-3.5 w-3.5" /> Em atraso
              </p>
              <p className="text-2xl font-bold">R$ {totalEmAtraso.toFixed(2)}</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4">
              <p className="flex items-center gap-1.5 text-slate-500 text-xs mb-1 font-semibold uppercase tracking-wide">
                <Users className="h-3.5 w-3.5" /> Tenants
              </p>
              <p className="text-2xl font-bold text-slate-800">{empresas.length}</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4">
              <p className="flex items-center gap-1.5 text-slate-500 text-xs mb-1 font-semibold uppercase tracking-wide">
                <ShieldOff className="h-3.5 w-3.5" /> Bloqueados
              </p>
              <p className="text-2xl font-bold text-slate-800">{totalBloqueados}</p>
            </div>
          </div>

          {/* Abas */}
          <div className="flex flex-wrap gap-2">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  tab === id ? 'bg-indigo-600 text-white shadow' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Icon className="h-3.5 w-3.5" /> {label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
            </div>
          ) : (
            <>
              {tab === 'tenants' && (
                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <h2 className="flex items-center gap-2 font-bold text-slate-800 mb-4">
                    <Building2 className="h-4 w-4 text-indigo-600" /> Todos os tenants e seus planos
                  </h2>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-slate-100 text-xs font-semibold uppercase tracking-wide text-slate-500">
                          <th className="py-2 pr-3">Empresa</th>
                          <th className="py-2 pr-3">Plano</th>
                          <th className="py-2 pr-3">Mensalidade</th>
                          <th className="py-2 pr-3">Status</th>
                          <th className="py-2 pr-3">Pagamento</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {empresas.map((empresa) => {
                          const plano = empresa.planoId ? planosPorId.get(empresa.planoId) : null;
                          const atrasada = faturasAtrasadasPorEmpresa.has(empresa.id);
                          return (
                            <tr key={empresa.id}>
                              <td className="py-3 pr-3">
                                <p className="font-medium text-slate-800">{empresa.nome}</p>
                                <p className="text-xs text-slate-400 font-mono">/{empresa.slug}</p>
                              </td>
                              <td className="py-3 pr-3 text-slate-600">{plano ? plano.nome : 'Sem plano (comissão avulsa)'}</td>
                              <td className="py-3 pr-3 text-slate-600">{plano ? `R$ ${plano.valorMensal.toFixed(2)}` : '—'}</td>
                              <td className="py-3 pr-3">
                                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${empresa.empresaAtiva ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                                  {empresa.empresaAtiva ? 'Ativa' : 'Bloqueada'}
                                </span>
                              </td>
                              <td className="py-3 pr-3">
                                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${atrasada ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'}`}>
                                  {atrasada ? 'Atrasado' : 'Em dia'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    {empresas.length === 0 && <p className="text-center text-slate-400 py-8 text-sm">Nenhum tenant cadastrado.</p>}
                  </div>
                </div>
              )}

              {tab === 'atraso' && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
                  <h2 className="flex items-center gap-2 font-bold text-red-800 mb-4">
                    <AlertTriangle className="h-4 w-4" /> Tenants em atraso
                  </h2>
                  <div className="space-y-2">
                    {empresasEmAtraso.map((empresa) => {
                      const atrasadas = faturasAtrasadasPorEmpresa.get(empresa.id) || [];
                      const total = atrasadas.reduce((s, f) => s + f.valorTotal, 0);
                      return (
                        <div key={empresa.id} className="flex flex-wrap items-center justify-between gap-3 bg-white rounded-xl px-4 py-3 border border-red-100">
                          <div>
                            <p className="font-semibold text-slate-800">{empresa.nome}</p>
                            <p className="text-xs text-red-600">{atrasadas.length} fatura(s) atrasada(s) · R$ {total.toFixed(2)} em aberto</p>
                          </div>
                          {empresa.empresaAtiva ? (
                            <button
                              onClick={() => handleBloquear(empresa.id, empresa.nome)}
                              className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-3 py-2 rounded-lg"
                            >
                              <ShieldOff className="h-3.5 w-3.5" /> Bloquear loja
                            </button>
                          ) : (
                            <span className="text-xs font-semibold text-red-500">Já bloqueada</span>
                          )}
                        </div>
                      );
                    })}
                    {empresasEmAtraso.length === 0 && (
                      <p className="text-center text-red-400 py-8 text-sm">Nenhum tenant em atraso. Tudo em dia!</p>
                    )}
                  </div>
                </div>
              )}

              {tab === 'em-dia' && (
                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <h2 className="flex items-center gap-2 font-bold text-slate-800 mb-4">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Tenants em dia
                  </h2>
                  <div className="space-y-2">
                    {empresasEmDia.map((empresa) => (
                      <div key={empresa.id} className="flex flex-wrap items-center justify-between gap-3 border border-slate-100 rounded-xl px-4 py-3">
                        <div>
                          <p className="font-semibold text-slate-800">{empresa.nome}</p>
                          <p className="text-xs text-slate-400">/{empresa.slug}</p>
                        </div>
                        <span className="text-sm font-semibold text-emerald-700">
                          R$ {(totalPagoPorEmpresa.get(empresa.id) || 0).toFixed(2)} recebidos no total
                        </span>
                      </div>
                    ))}
                    {empresasEmDia.length === 0 && (
                      <p className="text-center text-slate-400 py-8 text-sm">Nenhum tenant em dia no momento.</p>
                    )}
                  </div>
                </div>
              )}

              {tab === 'bloqueados' && (
                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <h2 className="flex items-center gap-2 font-bold text-slate-800 mb-4">
                    <ShieldOff className="h-4 w-4 text-red-600" /> Tenants bloqueados
                  </h2>
                  <div className="space-y-2">
                    {empresasBloqueadas.map((empresa) => {
                      const porInadimplencia = faturasAtrasadasPorEmpresa.has(empresa.id);
                      return (
                        <div key={empresa.id} className="flex flex-wrap items-center justify-between gap-3 border border-slate-100 rounded-xl px-4 py-3">
                          <div>
                            <p className="font-semibold text-slate-800">{empresa.nome}</p>
                            <p className="text-xs text-slate-400">
                              {porInadimplencia ? 'Bloqueada por falta de pagamento' : 'Bloqueada manualmente'}
                            </p>
                          </div>
                          <button
                            onClick={() => handleAtivar(empresa.id, empresa.nome)}
                            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-2 rounded-lg"
                          >
                            <Unlock className="h-3.5 w-3.5" /> Ativar imediatamente
                          </button>
                        </div>
                      );
                    })}
                    {empresasBloqueadas.length === 0 && (
                      <p className="text-center text-slate-400 py-8 text-sm">Nenhum tenant bloqueado no momento.</p>
                    )}
                  </div>
                </div>
              )}

              {tab === 'faturas' && (
                <>
                  <div className="rounded-2xl border border-slate-200 bg-white p-5">
                    <h2 className="flex items-center gap-2 font-bold text-slate-800 mb-4">
                      <Plus className="h-4 w-4 text-indigo-600" /> Gerar fatura
                    </h2>
                    <form onSubmit={handleGerar} className="flex flex-wrap items-end gap-3">
                      <div>
                        <label className="block text-xs text-slate-500 mb-1">Empresa</label>
                        <select
                          value={gerarEmpresaId}
                          onChange={(e) => setGerarEmpresaId(e.target.value)}
                          className="px-3 py-2 border border-slate-300 rounded-lg text-sm min-w-[200px]"
                        >
                          <option value="todas">Todas as empresas ativas (lote)</option>
                          {empresas.map((emp) => (
                            <option key={emp.id} value={emp.id}>{emp.nome}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-slate-500 mb-1">Período de</label>
                        <input type="date" value={periodoInicio} onChange={(e) => setPeriodoInicio(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg text-sm" required />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-500 mb-1">até</label>
                        <input type="date" value={periodoFim} onChange={(e) => setPeriodoFim(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg text-sm" required />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-500 mb-1">Vencimento</label>
                        <input type="date" value={vencimento} onChange={(e) => setVencimento(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg text-sm" required />
                      </div>
                      <button
                        type="submit"
                        disabled={gerando}
                        className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2.5 rounded-lg disabled:opacity-60"
                      >
                        {gerando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Layers className="h-4 w-4" />}
                        {gerando ? 'Gerando...' : 'Gerar'}
                      </button>
                    </form>
                    <p className="text-xs text-slate-400 mt-2">
                      A comissão usa o percentual vigente de cada empresa; se houver plano atribuído, a mensalidade do plano é somada ao total da fatura.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                      <h2 className="flex items-center gap-2 font-bold text-slate-800">
                        <Wallet className="h-4 w-4 text-indigo-600" /> Faturas
                      </h2>
                      <div className="flex flex-wrap gap-2">
                        <select value={filtroEmpresa} onChange={(e) => setFiltroEmpresa(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg text-sm">
                          <option value="">Todas as empresas</option>
                          {empresas.map((emp) => (
                            <option key={emp.id} value={emp.id}>{emp.nome}</option>
                          ))}
                        </select>
                        <select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value as StatusFatura | '')} className="px-3 py-2 border border-slate-300 rounded-lg text-sm">
                          <option value="">Todos os status</option>
                          <option value="PENDENTE">Pendente</option>
                          <option value="PAGO">Pago</option>
                          <option value="ATRASADO">Atrasado</option>
                        </select>
                      </div>
                    </div>

                    {faturasFiltradas.length === 0 ? (
                      <p className="text-center text-slate-400 py-12 text-sm">Nenhuma fatura encontrada.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                          <thead>
                            <tr className="border-b border-slate-100 text-xs font-semibold uppercase tracking-wide text-slate-500">
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
                          <tbody className="divide-y divide-slate-100">
                            {faturasFiltradas.map((f) => (
                              <tr key={f.id}>
                                <td className="py-3 pr-3 font-medium text-slate-800">{f.empresa.nome}</td>
                                <td className="py-3 pr-3 text-slate-500 text-xs">
                                  {new Date(f.periodoInicio).toLocaleDateString('pt-BR')} – {new Date(f.periodoFim).toLocaleDateString('pt-BR')}
                                </td>
                                <td className="py-3 pr-3 text-slate-600">R$ {f.valorVendas.toFixed(2)}</td>
                                <td className="py-3 pr-3 text-slate-600">R$ {f.valorComissao.toFixed(2)} <span className="text-xs text-slate-400">({f.comissaoPercent}%)</span></td>
                                <td className="py-3 pr-3 text-slate-600">R$ {f.valorPlano.toFixed(2)}</td>
                                <td className="py-3 pr-3 font-bold text-slate-800">R$ {f.valorTotal.toFixed(2)}</td>
                                <td className="py-3 pr-3 text-slate-500 text-xs">{new Date(f.vencimento).toLocaleDateString('pt-BR')}</td>
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
                                  <button onClick={() => handleDelete(f)} className="text-slate-400 hover:text-red-600 p-1.5">
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
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SuperAdminFinanceiroPage;
