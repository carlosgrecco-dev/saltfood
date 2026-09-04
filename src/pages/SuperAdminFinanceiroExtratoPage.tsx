import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Loader2, Download, HandCoins } from 'lucide-react';
import SuperAdminNav from '../components/superadmin/SuperAdminNav';
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

const SuperAdminFinanceiroExtratoPage: React.FC = () => {
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

  const lancamentos = useMemo(() => {
    const pagas = faturas
      .filter((f) => f.status === 'PAGO' && f.pagoEm)
      .sort((a, b) => new Date(a.pagoEm as string).getTime() - new Date(b.pagoEm as string).getTime());
    let saldo = 0;
    return pagas.map((f) => {
      saldo += f.valorTotal;
      return { fatura: f, saldoAcumulado: saldo };
    });
  }, [faturas]);

  const totalRecebidoHistorico = lancamentos.length > 0 ? lancamentos[lancamentos.length - 1].saldoAcumulado : 0;

  if (!authorized) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className={`transition-[margin] duration-300 ease-in-out ml-0 ${navOpen ? 'sm:ml-72' : 'sm:ml-16'}`}>
        <div className="border-b border-gray-200 bg-white">
          <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
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
                  <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2"><FileText className="h-5 w-5 text-orange-500" /> Extrato</h1>
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

        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8 space-y-4">
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-2xl p-4 max-w-xs">
            <p className="flex items-center gap-1.5 text-emerald-100 text-xs mb-1 font-semibold uppercase tracking-wide"><HandCoins className="h-3.5 w-3.5" /> Total recebido histórico</p>
            <p className="text-2xl font-bold">R$ {totalRecebidoHistorico.toFixed(2)}</p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-orange-500" /></div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-5 pb-4">
                <p className="font-bold text-gray-800">Faturas pagas ({lancamentos.length})</p>
                <button
                  onClick={() => exportarCsv(
                    lancamentos.map((l) => [new Date(l.fatura.pagoEm as string).toLocaleDateString('pt-BR'), l.fatura.empresa.nome, `${new Date(l.fatura.periodoInicio).toLocaleDateString('pt-BR')} – ${new Date(l.fatura.periodoFim).toLocaleDateString('pt-BR')}`, l.fatura.valorTotal.toFixed(2), l.saldoAcumulado.toFixed(2)]),
                    ['Data de pagamento', 'Tenant', 'Período faturado', 'Valor', 'Saldo acumulado'],
                    'extrato-plataforma.csv'
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
                      <th className="py-2.5 px-4">Data de pagamento</th>
                      <th className="py-2.5 px-4">Tenant</th>
                      <th className="py-2.5 px-4">Período faturado</th>
                      <th className="py-2.5 px-4 text-right">Valor</th>
                      <th className="py-2.5 px-4 text-right">Saldo acumulado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lancamentos.map((l) => (
                      <tr key={l.fatura.id} className="border-t border-gray-100">
                        <td className="px-4 py-3 text-gray-500 text-xs">{new Date(l.fatura.pagoEm as string).toLocaleDateString('pt-BR')}</td>
                        <td className="px-4 py-3 font-medium text-gray-800">{l.fatura.empresa.nome}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs">
                          {new Date(l.fatura.periodoInicio).toLocaleDateString('pt-BR')} – {new Date(l.fatura.periodoFim).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-700">R$ {l.fatura.valorTotal.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right font-semibold text-gray-800">R$ {l.saldoAcumulado.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {lancamentos.length === 0 && <p className="text-center text-gray-400 text-sm py-10">Nenhuma fatura paga ainda.</p>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SuperAdminFinanceiroExtratoPage;
