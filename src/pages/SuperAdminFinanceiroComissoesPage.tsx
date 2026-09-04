import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Percent, Loader2, Download, ChevronUp, ChevronDown } from 'lucide-react';
import SuperAdminNav from '../components/superadmin/SuperAdminNav';
import { getSuperAdminSession, signOutSuperAdmin } from '../lib/superAdminAuth';
import { fetchSuperAdminDashboard } from '../lib/superAdminDashboard';
import { fetchEmpresas } from '../lib/empresas';
import { fetchFaturas } from '../lib/faturas';
import { SuperAdminDashboard } from '../types/SuperAdminDashboard';
import { Empresa } from '../types/Empresa';
import { Fatura } from '../types/Fatura';
import { useSuperAdminManifest } from '../hooks/useSuperAdminManifest';

type Periodo = 'hoje' | '7dias' | '15dias' | '30dias' | 'este-mes' | 'mes-passado';
type SortField = 'nome' | 'comissaoPercent' | 'faturamentoNoPeriodo' | 'comissaoAcumulada' | 'comissaoJaFaturada';

type LinhaComissao = {
  id: string;
  nome: string;
  comissaoPercent: number;
  origem: 'Plano' | 'Avulsa';
  faturamentoNoPeriodo: number;
  comissaoAcumulada: number;
  comissaoJaFaturada: number;
};

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

const SuperAdminFinanceiroComissoesPage: React.FC = () => {
  useSuperAdminManifest();
  const navigate = useNavigate();
  const [authorized] = useState(() => !!getSuperAdminSession());
  const [periodo, setPeriodo] = useState<Periodo>('30dias');
  const [dashboard, setDashboard] = useState<SuperAdminDashboard | null>(null);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [faturas, setFaturas] = useState<Fatura[]>([]);
  const [loading, setLoading] = useState(true);
  const [navOpen, setNavOpen] = useState(true);
  const [sortField, setSortField] = useState<SortField>('comissaoAcumulada');
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
    Promise.all([fetchSuperAdminDashboard(de, ate), fetchEmpresas(), fetchFaturas()])
      .then(([dash, emp, fat]) => {
        setDashboard(dash);
        setEmpresas(emp);
        setFaturas(fat);
      })
      .catch(() => setDashboard(null))
      .finally(() => setLoading(false));
  }, [authorized, getRange]);

  if (!authorized) return null;

  const { de, ate } = getRange();

  const linhas: LinhaComissao[] = (dashboard?.porTenant ?? []).map((t) => {
    const empresa = empresas.find((e) => e.id === t.id);
    const comissaoPercent = empresa?.comissaoPercent ?? 0;
    const comissaoJaFaturada = faturas
      .filter((f) => f.empresaId === t.id && (!de || f.periodoInicio >= de) && (!ate || f.periodoFim <= ate))
      .reduce((s, f) => s + f.valorComissao, 0);
    return {
      id: t.id,
      nome: t.nome,
      comissaoPercent,
      origem: empresa?.planoId ? 'Plano' : 'Avulsa',
      faturamentoNoPeriodo: t.faturamentoNoPeriodo,
      comissaoAcumulada: t.faturamentoNoPeriodo * (comissaoPercent / 100),
      comissaoJaFaturada,
    };
  });

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const linhasOrdenadas = [...linhas].sort((a, b) => {
    const cmp = sortField === 'nome' ? a.nome.localeCompare(b.nome) : (a[sortField] as number) - (b[sortField] as number);
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const comissaoAcumuladaTotal = linhas.reduce((s, l) => s + l.comissaoAcumulada, 0);
  const comissaoJaFaturadaTotal = linhas.reduce((s, l) => s + l.comissaoJaFaturada, 0);
  const percentualJaCobrado = comissaoAcumuladaTotal > 0 ? (comissaoJaFaturadaTotal / comissaoAcumuladaTotal) * 100 : 0;

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
                  <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2"><Percent className="h-5 w-5 text-orange-500" /> Comissões</h1>
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

        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-wrap gap-2">
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
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-2xl p-4">
                  <p className="text-emerald-100 text-xs mb-1 font-semibold uppercase tracking-wide">Comissão acumulada no período</p>
                  <p className="text-2xl font-bold">R$ {comissaoAcumuladaTotal.toFixed(2)}</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl p-4">
                  <p className="text-gray-500 text-xs mb-1 font-semibold uppercase tracking-wide">Já faturada</p>
                  <p className="text-2xl font-bold text-gray-800">R$ {comissaoJaFaturadaTotal.toFixed(2)}</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl p-4">
                  <p className="text-gray-500 text-xs mb-1 font-semibold uppercase tracking-wide">% já cobrado</p>
                  <p className="text-2xl font-bold text-gray-800">{percentualJaCobrado.toFixed(1)}%</p>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-5 pb-4">
                  <p className="font-bold text-gray-800">Comissão por tenant ({linhasOrdenadas.length})</p>
                  <button
                    onClick={() => exportarCsv(
                      linhasOrdenadas.map((l) => [l.nome, `${l.comissaoPercent}%`, l.origem, l.faturamentoNoPeriodo.toFixed(2), l.comissaoAcumulada.toFixed(2), l.comissaoJaFaturada.toFixed(2)]),
                      ['Tenant', 'Comissão %', 'Origem', 'Faturamento', 'Comissão acumulada', 'Comissão já faturada'],
                      `comissoes-${de}-a-${ate}.csv`
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
                        <SortHeader field="comissaoPercent" label="Comissão %" className="text-right" />
                        <th className="py-2.5 px-4">Origem</th>
                        <SortHeader field="faturamentoNoPeriodo" label="Faturamento" className="text-right" />
                        <SortHeader field="comissaoAcumulada" label="Acumulada" className="text-right" />
                        <SortHeader field="comissaoJaFaturada" label="Já faturada" className="text-right" />
                      </tr>
                    </thead>
                    <tbody>
                      {linhasOrdenadas.map((l) => (
                        <tr key={l.id} className="border-t border-gray-100">
                          <td className="px-4 py-3 font-medium text-gray-800">{l.nome}</td>
                          <td className="px-4 py-3 text-right text-gray-700">{l.comissaoPercent}%</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${l.origem === 'Plano' ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                              {l.origem}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right text-gray-700">R$ {l.faturamentoNoPeriodo.toFixed(2)}</td>
                          <td className="px-4 py-3 text-right font-semibold text-gray-800">R$ {l.comissaoAcumulada.toFixed(2)}</td>
                          <td className="px-4 py-3 text-right text-gray-700">R$ {l.comissaoJaFaturada.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {linhasOrdenadas.length === 0 && <p className="text-center text-gray-400 text-sm py-10">Sem dados neste período.</p>}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SuperAdminFinanceiroComissoesPage;
