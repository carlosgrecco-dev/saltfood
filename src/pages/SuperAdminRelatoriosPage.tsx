import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BarChart3, Loader2, Download, ChevronUp, ChevronDown } from 'lucide-react';
import SuperAdminNav from '../components/superadmin/SuperAdminNav';
import { getSuperAdminSession, signOutSuperAdmin } from '../lib/superAdminAuth';
import { fetchSuperAdminDashboard } from '../lib/superAdminDashboard';
import { SuperAdminDashboard } from '../types/SuperAdminDashboard';
import { useSuperAdminManifest } from '../hooks/useSuperAdminManifest';

type Periodo = 'hoje' | '7dias' | '15dias' | '30dias' | 'este-mes' | 'mes-passado';
type SortField = 'nome' | 'pedidosNoPeriodo' | 'faturamentoNoPeriodo' | 'ticketMedioNoPeriodo';

const toISO = (d: Date) => d.toISOString().slice(0, 10);

const exportarCsv = (linhas: (string | number)[][], header: string[], nomeArquivo: string) => {
  const csv = [header, ...linhas].map((l) => l.join(';')).join('\n');
  const blob = new Blob(['﻿', csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nomeArquivo;
  a.click();
  URL.revokeObjectURL(url);
};

const SuperAdminRelatoriosPage: React.FC = () => {
  useSuperAdminManifest();
  const navigate = useNavigate();
  const [authorized] = useState(() => !!getSuperAdminSession());
  const [periodo, setPeriodo] = useState<Periodo>('30dias');
  const [data, setData] = useState<SuperAdminDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [navOpen, setNavOpen] = useState(true);
  const [sortField, setSortField] = useState<SortField>('faturamentoNoPeriodo');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

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

  const getRange = useCallback((): { de?: string; ate?: string } => {
    const hoje = new Date();
    switch (periodo) {
      case 'hoje':
        return { de: toISO(hoje), ate: toISO(hoje) };
      case '7dias': {
        const inicio = new Date(hoje);
        inicio.setDate(inicio.getDate() - 6);
        return { de: toISO(inicio), ate: toISO(hoje) };
      }
      case '15dias': {
        const inicio = new Date(hoje);
        inicio.setDate(inicio.getDate() - 14);
        return { de: toISO(inicio), ate: toISO(hoje) };
      }
      case '30dias': {
        const inicio = new Date(hoje);
        inicio.setDate(inicio.getDate() - 29);
        return { de: toISO(inicio), ate: toISO(hoje) };
      }
      case 'este-mes': {
        const inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
        return { de: toISO(inicio), ate: toISO(hoje) };
      }
      case 'mes-passado': {
        const inicio = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
        const fim = new Date(hoje.getFullYear(), hoje.getMonth(), 0);
        return { de: toISO(inicio), ate: toISO(fim) };
      }
      default:
        return {};
    }
  }, [periodo]);

  useEffect(() => {
    if (!authorized) return;
    const { de, ate } = getRange();
    setLoading(true);
    fetchSuperAdminDashboard(de, ate)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [authorized, getRange]);

  if (!authorized) return null;

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const tenantsOrdenados = [...(data?.porTenant ?? [])].sort((a, b) => {
    const cmp = sortField === 'nome' ? a.nome.localeCompare(b.nome) : (a[sortField] as number) - (b[sortField] as number);
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const SortHeader: React.FC<{ field: SortField; label: string; className?: string }> = ({ field, label, className }) => (
    <th className={`py-2.5 px-4 cursor-pointer select-none ${className || ''}`} onClick={() => toggleSort(field)}>
      <span className="inline-flex items-center gap-1">
        {label}
        {sortField === field ? (sortDir === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />) : null}
      </span>
    </th>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className={`transition-[margin] duration-300 ease-in-out ml-0 ${navOpen ? 'sm:ml-72' : 'sm:ml-16'}`}>
        <div className="border-b border-gray-200 bg-white">
          <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
            <button
              onClick={() => navigate('/super-admin/dashboard')}
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
                  <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2"><BarChart3 className="h-5 w-5 text-orange-500" /> Relatórios</h1>
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

        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-wrap gap-2">
            {([
              { id: 'hoje', label: 'Hoje' },
              { id: '7dias', label: '7 dias' },
              { id: '15dias', label: '15 dias' },
              { id: '30dias', label: '30 dias' },
              { id: 'este-mes', label: 'Este mês' },
              { id: 'mes-passado', label: 'Mês passado' },
            ] as { id: Periodo; label: string }[]).map((p) => (
              <button
                key={p.id}
                onClick={() => setPeriodo(p.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  periodo === p.id ? 'bg-orange-500 text-white shadow' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-orange-500" /></div>
          ) : !data ? (
            <p className="text-center text-gray-400 py-16">Não foi possível carregar os dados.</p>
          ) : (
            <div className="space-y-6">
              <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-5 pb-4">
                  <p className="font-bold text-gray-800">Desempenho por tenant ({tenantsOrdenados.length})</p>
                  <button
                    onClick={() => exportarCsv(
                      tenantsOrdenados.map((t) => [t.nome, t.pedidosNoPeriodo, t.faturamentoNoPeriodo.toFixed(2), t.ticketMedioNoPeriodo.toFixed(2), t.ativo ? 'Ativa' : 'Inativa']),
                      ['Tenant', 'Pedidos', 'Faturamento', 'Ticket médio', 'Status'],
                      `desempenho-tenants-${getRange().de}-a-${getRange().ate}.csv`
                    )}
                    className="flex items-center gap-1.5 text-xs font-medium border border-gray-300 text-gray-600 hover:bg-gray-50 px-3 py-1.5 rounded-lg"
                  >
                    <Download className="h-3.5 w-3.5" /> Exportar CSV
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-t border-gray-100 text-left text-xs uppercase tracking-wide text-gray-400">
                        <SortHeader field="nome" label="Tenant" />
                        <SortHeader field="pedidosNoPeriodo" label="Pedidos" className="text-right" />
                        <SortHeader field="faturamentoNoPeriodo" label="Faturamento" className="text-right" />
                        <SortHeader field="ticketMedioNoPeriodo" label="Ticket médio" className="text-right" />
                        <th className="py-2.5 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tenantsOrdenados.map((t) => (
                        <tr key={t.id} className="border-t border-gray-100">
                          <td className="px-4 py-3 font-medium text-gray-800">{t.nome}</td>
                          <td className="px-4 py-3 text-right text-gray-700">{t.pedidosNoPeriodo}</td>
                          <td className="px-4 py-3 text-right text-gray-700">R$ {t.faturamentoNoPeriodo.toFixed(2)}</td>
                          <td className="px-4 py-3 text-right text-gray-700">R$ {t.ticketMedioNoPeriodo.toFixed(2)}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${t.ativo ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                              {t.ativo ? 'Ativa' : 'Inativa'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {tenantsOrdenados.length === 0 && <p className="text-center text-gray-400 text-sm py-10">Sem dados neste período.</p>}
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-2xl p-5">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <p className="font-bold text-gray-800">Vendas por categoria ({(data.porCategoria ?? []).length})</p>
                  <button
                    onClick={() => exportarCsv(
                      (data.porCategoria ?? []).map((c) => [c.nome, c.quantidade, c.receita.toFixed(2), c.percentual.toFixed(1)]),
                      ['Categoria', 'Quantidade', 'Receita', '% do total'],
                      `vendas-por-categoria-${getRange().de}-a-${getRange().ate}.csv`
                    )}
                    className="flex items-center gap-1.5 text-xs font-medium border border-gray-300 text-gray-600 hover:bg-gray-50 px-3 py-1.5 rounded-lg"
                  >
                    <Download className="h-3.5 w-3.5" /> Exportar CSV
                  </button>
                </div>
                <div className="space-y-3">
                  {(data.porCategoria ?? []).map((c) => (
                    <div key={c.categoriaId}>
                      <div className="flex items-center justify-between gap-2 text-sm mb-1">
                        <span className="text-gray-700">{c.nome}</span>
                        <span className="text-gray-500">{c.quantidade} un. · R$ {c.receita.toFixed(2)} ({c.percentual.toFixed(1)}%)</span>
                      </div>
                      <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
                        <div className="h-full rounded-full bg-orange-500" style={{ width: `${c.percentual}%` }} />
                      </div>
                    </div>
                  ))}
                  {(data.porCategoria ?? []).length === 0 && <p className="text-center text-gray-400 text-sm py-6">Sem dados neste período.</p>}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SuperAdminRelatoriosPage;
