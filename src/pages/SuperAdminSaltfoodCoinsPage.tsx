import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Coins, ArrowLeft, LayoutDashboard, Building2, ScrollText, Users, Wallet, Loader2,
  TrendingUp, TrendingDown, Save, Search, Mail,
} from 'lucide-react';
import SuperAdminNav from '../components/superadmin/SuperAdminNav';
import ToggleSwitch from '../components/superadmin/ToggleSwitch';
import { getSuperAdminSession, signOutSuperAdmin } from '../lib/superAdminAuth';
import { fetchEmpresas, setSaltfoodCoinsConfig } from '../lib/empresas';
import { fetchSaltfoodCoinsReport, fetchSaltfoodCoinsMovimentos, fetchSaltfoodCoinsContas } from '../lib/saltfoodCoinsReport';
import { Empresa } from '../types/Empresa';
import { SaltfoodCoinsReport } from '../types/SaltfoodCoinsReport';
import { CoinsMovimentoAdmin, ContaPlataformaAdmin } from '../types/SaltfoodCoinsAdmin';
import { useSuperAdminManifest } from '../hooks/useSuperAdminManifest';

type Feedback = { type: 'success' | 'error'; message: string } | null;
type Tab = 'visao-geral' | 'lojas' | 'movimentacoes' | 'contas';

const TABS: { id: Tab; label: string; icon: typeof Building2 }[] = [
  { id: 'visao-geral', label: 'Visão Geral', icon: LayoutDashboard },
  { id: 'lojas', label: 'Lojas Participantes', icon: Building2 },
  { id: 'movimentacoes', label: 'Movimentações', icon: ScrollText },
  { id: 'contas', label: 'Contas de Clientes', icon: Users },
];

type LojaEdit = { ativo: boolean; percentInput: string };

const SuperAdminSaltfoodCoinsPage: React.FC = () => {
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

  useEffect(() => {
    if (!authorized) navigate('/super-admin', { replace: true });
  }, [authorized, navigate]);

  const [tab, setTab] = useState<Tab>('visao-geral');
  const [navOpen, setNavOpen] = useState(true);
  const [feedback, setFeedback] = useState<Feedback>(null);

  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => setFeedback(null), 4000);
    return () => clearTimeout(timer);
  }, [feedback]);

  // --- Visão Geral ---
  const [report, setReport] = useState<SaltfoodCoinsReport | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportDe, setReportDe] = useState('');
  const [reportAte, setReportAte] = useState('');

  useEffect(() => {
    if (tab !== 'visao-geral' || !authorized) return;
    setReportLoading(true);
    fetchSaltfoodCoinsReport(reportDe || undefined, reportAte || undefined)
      .then(setReport)
      .catch((err) => setFeedback({ type: 'error', message: err instanceof Error ? err.message : 'Erro ao carregar relatório' }))
      .finally(() => setReportLoading(false));
  }, [tab, authorized, reportDe, reportAte]);

  // --- Lojas Participantes ---
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [empresasLoading, setEmpresasLoading] = useState(false);
  const [lojaEdits, setLojaEdits] = useState<Record<string, LojaEdit>>({});
  const [savingLojaId, setSavingLojaId] = useState<string | null>(null);

  const loadEmpresas = useCallback(() => {
    setEmpresasLoading(true);
    fetchEmpresas()
      .then((lista) => {
        setEmpresas(lista);
        setLojaEdits(
          Object.fromEntries(
            lista.map((e) => [e.id, { ativo: e.participaSaltfoodCoins, percentInput: e.saltfoodCoinsPercent != null ? String(e.saltfoodCoinsPercent) : '' }])
          )
        );
      })
      .catch((err) => setFeedback({ type: 'error', message: err instanceof Error ? err.message : 'Erro ao carregar lojas' }))
      .finally(() => setEmpresasLoading(false));
  }, []);

  useEffect(() => {
    if (tab !== 'lojas' || !authorized) return;
    loadEmpresas();
  }, [tab, authorized, loadEmpresas]);

  const handleSaveLoja = async (empresaId: string, nome: string) => {
    const edit = lojaEdits[empresaId];
    if (!edit) return;
    let percentValor: number | null = null;
    if (edit.percentInput) {
      percentValor = parseFloat(edit.percentInput);
      if (Number.isNaN(percentValor) || percentValor < 0 || percentValor > 100) {
        setFeedback({ type: 'error', message: 'Informe um percentual entre 0 e 100' });
        return;
      }
    }
    setSavingLojaId(empresaId);
    try {
      const atualizado = await setSaltfoodCoinsConfig(empresaId, edit.ativo, percentValor);
      setEmpresas((prev) => prev.map((e) => (e.id === atualizado.id ? atualizado : e)));
      setFeedback({ type: 'success', message: `SaltFood Coins ${edit.ativo ? 'ativado' : 'desativado'} para "${nome}".` });
    } catch (err) {
      setFeedback({ type: 'error', message: err instanceof Error ? err.message : 'Erro ao salvar' });
    } finally {
      setSavingLojaId(null);
    }
  };

  // --- Movimentações ---
  const [movimentos, setMovimentos] = useState<CoinsMovimentoAdmin[]>([]);
  const [movLoading, setMovLoading] = useState(false);
  const [movEmpresaId, setMovEmpresaId] = useState('');
  const [movTipo, setMovTipo] = useState<'' | 'GANHO' | 'GASTO'>('');
  const [movDe, setMovDe] = useState('');
  const [movAte, setMovAte] = useState('');

  useEffect(() => {
    if (tab !== 'movimentacoes' || !authorized) return;
    setMovLoading(true);
    fetchSaltfoodCoinsMovimentos({ empresaId: movEmpresaId || undefined, tipo: movTipo || undefined, de: movDe || undefined, ate: movAte || undefined })
      .then(setMovimentos)
      .catch((err) => setFeedback({ type: 'error', message: err instanceof Error ? err.message : 'Erro ao carregar movimentações' }))
      .finally(() => setMovLoading(false));
  }, [tab, authorized, movEmpresaId, movTipo, movDe, movAte]);

  useEffect(() => {
    if (tab === 'movimentacoes' && empresas.length === 0) loadEmpresas();
  }, [tab, empresas.length, loadEmpresas]);

  // --- Contas de Clientes ---
  const [contas, setContas] = useState<ContaPlataformaAdmin[]>([]);
  const [contasLoading, setContasLoading] = useState(false);
  const [contasQInput, setContasQInput] = useState('');
  const [contasQ, setContasQ] = useState('');

  useEffect(() => {
    if (tab !== 'contas' || !authorized) return;
    setContasLoading(true);
    fetchSaltfoodCoinsContas(contasQ || undefined)
      .then(setContas)
      .catch((err) => setFeedback({ type: 'error', message: err instanceof Error ? err.message : 'Erro ao carregar contas' }))
      .finally(() => setContasLoading(false));
  }, [tab, authorized, contasQ]);

  if (!authorized) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className={`transition-[margin] duration-300 ease-in-out ml-0 ${navOpen ? 'sm:ml-72' : 'sm:ml-16'}`}>
        <div className="border-b border-gray-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <button
              onClick={() => navigate('/super-admin/empresas')}
              className="mb-3 inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" /> Voltar
            </button>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 shrink-0 rounded-xl bg-amber-500 p-2">
                  <Coins className="h-full w-full text-white" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-amber-600">Super Admin</p>
                  <h1 className="text-xl font-bold text-gray-900">SaltFood Coins</h1>
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

          <div className="flex flex-wrap gap-2">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  tab === id ? 'bg-amber-500 text-white shadow' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon className="h-3.5 w-3.5" /> {label}
              </button>
            ))}
          </div>

          {tab === 'visao-geral' && (
            <div className="rounded-2xl border border-gray-200 bg-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <h2 className="flex items-center gap-2 font-bold text-gray-800">
                  <LayoutDashboard className="h-4 w-4 text-amber-500" /> Resumo da plataforma
                </h2>
                <div className="flex flex-wrap items-end gap-2">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Ganho/gasto de</label>
                    <input type="date" value={reportDe} onChange={(e) => setReportDe(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">até</label>
                    <input type="date" value={reportAte} onChange={(e) => setReportAte(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                  </div>
                  {(reportDe || reportAte) && (
                    <button type="button" onClick={() => { setReportDe(''); setReportAte(''); }} className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700">
                      Limpar período
                    </button>
                  )}
                </div>
              </div>
              <p className="text-xs text-gray-400 mb-4">
                Ganho/gasto refletem só o período filtrado (todo o histórico se em branco); o saldo total é sempre o estado atual da carteira.
              </p>

              {reportLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
                </div>
              ) : report ? (
                <>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
                    <div className="bg-gradient-to-br from-amber-500 to-yellow-600 text-white rounded-2xl p-4">
                      <p className="flex items-center gap-1.5 text-amber-100 text-xs mb-1 font-semibold uppercase tracking-wide">
                        <Wallet className="h-3.5 w-3.5" /> Saldo total na carteira
                      </p>
                      <p className="text-2xl font-bold">R$ {report.saldoTotalAtual.toFixed(2)}</p>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-2xl p-4">
                      <p className="flex items-center gap-1.5 text-emerald-600 text-xs mb-1 font-semibold uppercase tracking-wide">
                        <TrendingUp className="h-3.5 w-3.5" /> Ganho no período
                      </p>
                      <p className="text-2xl font-bold text-gray-800">R$ {report.totalGanhoPeriodo.toFixed(2)}</p>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-2xl p-4">
                      <p className="flex items-center gap-1.5 text-rose-600 text-xs mb-1 font-semibold uppercase tracking-wide">
                        <TrendingDown className="h-3.5 w-3.5" /> Gasto no período
                      </p>
                      <p className="text-2xl font-bold text-gray-800">R$ {report.totalGastoPeriodo.toFixed(2)}</p>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-2xl p-4">
                      <p className="flex items-center gap-1.5 text-gray-500 text-xs mb-1 font-semibold uppercase tracking-wide">
                        <Users className="h-3.5 w-3.5" /> Lojas participando
                      </p>
                      <p className="text-2xl font-bold text-gray-800">{report.tenantsParticipando}</p>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-gray-100 text-xs font-semibold uppercase tracking-wide text-gray-500">
                          <th className="py-2 pr-3">Empresa</th>
                          <th className="py-2 pr-3">Participa</th>
                          <th className="py-2 pr-3">%</th>
                          <th className="py-2 pr-3">Ganho no período</th>
                          <th className="py-2 pr-3">Gasto no período</th>
                          <th className="py-2 pr-3">Líquido</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {report.porLoja.map((loja) => (
                          <tr key={loja.id}>
                            <td className="py-3 pr-3">
                              <p className="font-medium text-gray-800">{loja.nome}</p>
                              <p className="text-xs text-gray-400 font-mono">/{loja.slug}</p>
                            </td>
                            <td className="py-3 pr-3">
                              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${loja.participa ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-500'}`}>
                                {loja.participa ? 'Sim' : 'Não'}
                              </span>
                            </td>
                            <td className="py-3 pr-3 text-gray-600">{loja.percentual != null ? `${loja.percentual}%` : '—'}</td>
                            <td className="py-3 pr-3 text-emerald-600">R$ {loja.ganhoNoPeriodo.toFixed(2)}</td>
                            <td className="py-3 pr-3 text-rose-600">R$ {loja.gastoNoPeriodo.toFixed(2)}</td>
                            <td className={`py-3 pr-3 font-semibold ${loja.liquidoNoPeriodo >= 0 ? 'text-gray-800' : 'text-rose-600'}`}>
                              R$ {loja.liquidoNoPeriodo.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {report.porLoja.length === 0 && <p className="text-center text-gray-400 py-8 text-sm">Nenhuma loja participa do SaltFood Coins ainda.</p>}
                  </div>
                </>
              ) : (
                <p className="text-center text-gray-400 py-12 text-sm">Não foi possível carregar o relatório.</p>
              )}
            </div>
          )}

          {tab === 'lojas' && (
            <div className="rounded-2xl border border-gray-200 bg-white p-5">
              <h2 className="flex items-center gap-2 font-bold text-gray-800 mb-1">
                <Building2 className="h-4 w-4 text-amber-500" /> Ativar por loja
              </h2>
              <p className="text-xs text-gray-400 mb-4">
                Só o Super Admin liga/desliga e define o percentual — o lojista não controla isso no próprio admin,
                já que envolve exposição financeira entre lojas diferentes.
              </p>

              {empresasLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 text-xs font-semibold uppercase tracking-wide text-gray-500">
                        <th className="py-2 pr-3">Empresa</th>
                        <th className="py-2 pr-3">Participa</th>
                        <th className="py-2 pr-3">% do subtotal</th>
                        <th className="py-2 pr-3 text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {empresas.map((empresa) => {
                        const edit = lojaEdits[empresa.id] || { ativo: false, percentInput: '' };
                        return (
                          <tr key={empresa.id}>
                            <td className="py-3 pr-3">
                              <p className="font-medium text-gray-800">{empresa.nome}</p>
                              <p className="text-xs text-gray-400 font-mono">/{empresa.slug}</p>
                            </td>
                            <td className="py-3 pr-3">
                              <ToggleSwitch
                                size="sm"
                                checked={edit.ativo}
                                onChange={(v) => setLojaEdits((prev) => ({ ...prev, [empresa.id]: { ...edit, ativo: v } }))}
                              />
                            </td>
                            <td className="py-3 pr-3">
                              <input
                                type="number"
                                min={0}
                                max={100}
                                step={0.5}
                                value={edit.percentInput}
                                onChange={(e) => setLojaEdits((prev) => ({ ...prev, [empresa.id]: { ...edit, percentInput: e.target.value } }))}
                                placeholder="0"
                                className="w-24 px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm"
                              />
                            </td>
                            <td className="py-3 pr-3 text-right">
                              <button
                                onClick={() => handleSaveLoja(empresa.id, empresa.nome)}
                                disabled={savingLojaId === empresa.id}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold px-3 py-2 disabled:opacity-60"
                              >
                                {savingLojaId === empresa.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                                Salvar
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {empresas.length === 0 && <p className="text-center text-gray-400 py-8 text-sm">Nenhuma empresa cadastrada.</p>}
                </div>
              )}
            </div>
          )}

          {tab === 'movimentacoes' && (
            <div className="rounded-2xl border border-gray-200 bg-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <h2 className="flex items-center gap-2 font-bold text-gray-800">
                  <ScrollText className="h-4 w-4 text-amber-500" /> Ledger — últimas 200 movimentações
                </h2>
                <div className="flex flex-wrap gap-2">
                  <select value={movEmpresaId} onChange={(e) => setMovEmpresaId(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
                    <option value="">Todas as lojas</option>
                    {empresas.map((emp) => (
                      <option key={emp.id} value={emp.id}>{emp.nome}</option>
                    ))}
                  </select>
                  <select value={movTipo} onChange={(e) => setMovTipo(e.target.value as '' | 'GANHO' | 'GASTO')} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
                    <option value="">Ganho e gasto</option>
                    <option value="GANHO">Só ganho</option>
                    <option value="GASTO">Só gasto</option>
                  </select>
                  <input type="date" value={movDe} onChange={(e) => setMovDe(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                  <input type="date" value={movAte} onChange={(e) => setMovAte(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
              </div>

              {movLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 text-xs font-semibold uppercase tracking-wide text-gray-500">
                        <th className="py-2 pr-3">Data</th>
                        <th className="py-2 pr-3">Loja</th>
                        <th className="py-2 pr-3">Cliente</th>
                        <th className="py-2 pr-3">Tipo</th>
                        <th className="py-2 pr-3">Valor</th>
                        <th className="py-2 pr-3">Pedido</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {movimentos.map((m) => (
                        <tr key={m.id}>
                          <td className="py-3 pr-3 text-gray-500 text-xs">{new Date(m.createdAt).toLocaleString('pt-BR')}</td>
                          <td className="py-3 pr-3 text-gray-800">{m.empresa.nome}</td>
                          <td className="py-3 pr-3">
                            <p className="text-gray-800">{m.cliente.nome}</p>
                            <p className="text-xs text-gray-400">{m.cliente.email}</p>
                          </td>
                          <td className="py-3 pr-3">
                            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${m.tipo === 'GANHO' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                              {m.tipo === 'GANHO' ? 'Ganho' : 'Gasto'}
                            </span>
                          </td>
                          <td className={`py-3 pr-3 font-semibold ${m.tipo === 'GANHO' ? 'text-emerald-600' : 'text-rose-600'}`}>
                            R$ {m.valor.toFixed(2)}
                          </td>
                          <td className="py-3 pr-3 text-gray-500 text-xs">{m.pedido ? `#${String(m.pedido.numero).padStart(4, '0')}` : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {movimentos.length === 0 && <p className="text-center text-gray-400 py-8 text-sm">Nenhuma movimentação encontrada.</p>}
                </div>
              )}
            </div>
          )}

          {tab === 'contas' && (
            <div className="rounded-2xl border border-gray-200 bg-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <h2 className="flex items-center gap-2 font-bold text-gray-800">
                  <Users className="h-4 w-4 text-amber-500" /> Contas de clientes (até 200, maior saldo primeiro)
                </h2>
                <form
                  onSubmit={(e) => { e.preventDefault(); setContasQ(contasQInput.trim()); }}
                  className="flex items-center gap-2"
                >
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                    <input
                      type="text"
                      value={contasQInput}
                      onChange={(e) => setContasQInput(e.target.value)}
                      placeholder="Buscar por e-mail"
                      className="pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-sm min-w-[220px]"
                    />
                  </div>
                  <button type="submit" className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold px-3 py-2">
                    <Search className="h-3.5 w-3.5" /> Buscar
                  </button>
                </form>
              </div>

              {contasLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 text-xs font-semibold uppercase tracking-wide text-gray-500">
                        <th className="py-2 pr-3">E-mail</th>
                        <th className="py-2 pr-3">Saldo</th>
                        <th className="py-2 pr-3">Lojas vinculadas</th>
                        <th className="py-2 pr-3">Desde</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {contas.map((conta) => (
                        <tr key={conta.id}>
                          <td className="py-3 pr-3">
                            <p className="text-gray-800">{conta.email}</p>
                            {conta.telefone && <p className="text-xs text-gray-400">{conta.telefone}</p>}
                          </td>
                          <td className="py-3 pr-3 font-semibold text-amber-700">R$ {conta.saldoCoins.toFixed(2)}</td>
                          <td className="py-3 pr-3">
                            <div className="flex flex-wrap gap-1.5">
                              {conta.clientes.map((c) => (
                                <span key={c.id} className="rounded-full bg-gray-100 text-gray-600 text-xs px-2 py-1">
                                  {c.empresa.nome}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="py-3 pr-3 text-gray-500 text-xs">{new Date(conta.createdAt).toLocaleDateString('pt-BR')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {contas.length === 0 && <p className="text-center text-gray-400 py-8 text-sm">Nenhuma conta encontrada.</p>}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SuperAdminSaltfoodCoinsPage;
