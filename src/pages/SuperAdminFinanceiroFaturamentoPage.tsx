import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, Loader2, Download, HandCoins, Clock3, Receipt } from 'lucide-react';
import SuperAdminNav from '../components/superadmin/SuperAdminNav';
import LineChart from '../components/LineChart';
import DonutChart from '../components/DonutChart';
import { getSuperAdminSession, signOutSuperAdmin } from '../lib/superAdminAuth';
import { fetchFaturas } from '../lib/faturas';
import { Fatura } from '../types/Fatura';
import { useSuperAdminManifest } from '../hooks/useSuperAdminManifest';

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

const mesLabel = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
};

const SuperAdminFinanceiroFaturamentoPage: React.FC = () => {
  useSuperAdminManifest();
  const navigate = useNavigate();
  const [authorized] = useState(() => !!getSuperAdminSession());
  const [faturas, setFaturas] = useState<Fatura[]>([]);
  const [loading, setLoading] = useState(true);
  const [navOpen, setNavOpen] = useState(true);

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

  useEffect(() => {
    if (!authorized) return;
    setLoading(true);
    fetchFaturas().then(setFaturas).catch(() => setFaturas([])).finally(() => setLoading(false));
  }, [authorized]);

  const porMes = useMemo(() => {
    const map = new Map<string, number>();
    for (const f of faturas) {
      const chave = f.periodoInicio.slice(0, 7);
      map.set(chave, (map.get(chave) || 0) + f.valorTotal);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [faturas]);

  const totalFaturado = useMemo(() => faturas.reduce((s, f) => s + f.valorTotal, 0), [faturas]);
  const totalPago = useMemo(() => faturas.filter((f) => f.status === 'PAGO').reduce((s, f) => s + f.valorTotal, 0), [faturas]);
  const totalPendenteAtrasado = totalFaturado - totalPago;
  const ticketMedio = faturas.length > 0 ? totalFaturado / faturas.length : 0;
  const totalComissao = useMemo(() => faturas.reduce((s, f) => s + f.valorComissao, 0), [faturas]);
  const totalPlano = useMemo(() => faturas.reduce((s, f) => s + f.valorPlano, 0), [faturas]);

  if (!authorized) return null;

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
                  <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2"><TrendingUp className="h-5 w-5 text-orange-500" /> Faturamento</h1>
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
          {loading ? (
            <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-orange-500" /></div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-2xl p-4">
                  <p className="flex items-center gap-1.5 text-emerald-100 text-xs mb-1 font-semibold uppercase tracking-wide"><HandCoins className="h-3.5 w-3.5" /> Total faturado</p>
                  <p className="text-2xl font-bold">R$ {totalFaturado.toFixed(2)}</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl p-4">
                  <p className="flex items-center gap-1.5 text-gray-500 text-xs mb-1 font-semibold uppercase tracking-wide"><HandCoins className="h-3.5 w-3.5" /> Total pago</p>
                  <p className="text-2xl font-bold text-gray-800">R$ {totalPago.toFixed(2)}</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl p-4">
                  <p className="flex items-center gap-1.5 text-gray-500 text-xs mb-1 font-semibold uppercase tracking-wide"><Clock3 className="h-3.5 w-3.5" /> Pendente/atrasado</p>
                  <p className="text-2xl font-bold text-gray-800">R$ {totalPendenteAtrasado.toFixed(2)}</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl p-4">
                  <p className="flex items-center gap-1.5 text-gray-500 text-xs mb-1 font-semibold uppercase tracking-wide"><Receipt className="h-3.5 w-3.5" /> Ticket médio</p>
                  <p className="text-2xl font-bold text-gray-800">R$ {ticketMedio.toFixed(2)}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-white border border-gray-200 rounded-2xl p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                    <p className="font-bold text-gray-800">Faturamento por mês</p>
                    <button
                      onClick={() => exportarCsv(porMes.map(([mes, total]) => [mes, total.toFixed(2)]), ['Mês', 'Faturamento'], 'faturamento-por-mes.csv')}
                      className="flex items-center gap-1.5 text-xs font-medium border border-gray-300 text-gray-600 hover:bg-gray-50 px-3 py-1.5 rounded-lg"
                    >
                      <Download className="h-3.5 w-3.5" /> Exportar CSV
                    </button>
                  </div>
                  <LineChart
                    labels={porMes.map(([mes]) => mesLabel(`${mes}-01`))}
                    series={[{ label: 'Faturamento total', colorClass: 'bg-orange-500', strokeClass: 'stroke-orange-500', data: porMes.map(([, total]) => total) }]}
                  />
                </div>

                <div className="bg-white border border-gray-200 rounded-2xl p-5">
                  <p className="font-bold text-gray-800 mb-4">Composição do faturamento</p>
                  <DonutChart
                    segments={[
                      { label: 'Comissão', value: totalComissao, colorClass: 'bg-orange-500', strokeClass: 'stroke-orange-500' },
                      { label: 'Mensalidade de planos', value: totalPlano, colorClass: 'bg-blue-500', strokeClass: 'stroke-blue-500' },
                    ]}
                    formatValue={(v) => `R$ ${v.toFixed(2)}`}
                    centerLabel="Total"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SuperAdminFinanceiroFaturamentoPage;
