import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowLeftRight, Loader2, Download } from 'lucide-react';
import SuperAdminNav from '../components/superadmin/SuperAdminNav';
import { getSuperAdminSession, signOutSuperAdmin } from '../lib/superAdminAuth';
import { fetchTransacoesPlataforma } from '../lib/superAdminFinanceiro';
import { fetchEmpresas } from '../lib/empresas';
import { TransacaoPlataforma } from '../types/SuperAdminFinanceiro';
import { Empresa } from '../types/Empresa';
import { FormaPagamento, StatusPedido, FORMA_PAGAMENTO_LABELS, STATUS_PEDIDO_LABELS } from '../types/Pedido';
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

const SuperAdminFinanceiroTransacoesPage: React.FC = () => {
  useSuperAdminManifest();
  const navigate = useNavigate();
  const [authorized] = useState(() => !!getSuperAdminSession());
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [transacoes, setTransacoes] = useState<TransacaoPlataforma[]>([]);
  const [loading, setLoading] = useState(true);
  const [navOpen, setNavOpen] = useState(true);

  const [filtroEmpresa, setFiltroEmpresa] = useState('');
  const [filtroForma, setFiltroForma] = useState<FormaPagamento | ''>('');
  const [filtroStatus, setFiltroStatus] = useState<StatusPedido | ''>('');
  const [filtroDe, setFiltroDe] = useState('');
  const [filtroAte, setFiltroAte] = useState('');

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
    if (authorized) fetchEmpresas().then(setEmpresas).catch(() => setEmpresas([]));
  }, [authorized]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setTransacoes(await fetchTransacoesPlataforma({
        empresaId: filtroEmpresa || undefined,
        formaPagamento: filtroForma || undefined,
        status: filtroStatus || undefined,
        de: filtroDe || undefined,
        ate: filtroAte || undefined,
      }));
    } catch {
      setTransacoes([]);
    } finally {
      setLoading(false);
    }
  }, [filtroEmpresa, filtroForma, filtroStatus, filtroDe, filtroAte]);

  useEffect(() => {
    if (authorized) load();
  }, [authorized, load]);

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
                  <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2"><ArrowLeftRight className="h-5 w-5 text-orange-500" /> Transações</h1>
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

        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 space-y-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-wrap items-end gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Empresa</label>
              <select value={filtroEmpresa} onChange={(e) => setFiltroEmpresa(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm min-w-[180px]">
                <option value="">Todas</option>
                {empresas.map((emp) => (
                  <option key={emp.id} value={emp.id}>{emp.nome}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Forma de pagamento</label>
              <select value={filtroForma} onChange={(e) => setFiltroForma(e.target.value as FormaPagamento | '')} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
                <option value="">Todas</option>
                {(Object.keys(FORMA_PAGAMENTO_LABELS) as FormaPagamento[]).map((f) => (
                  <option key={f} value={f}>{FORMA_PAGAMENTO_LABELS[f]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Status</label>
              <select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value as StatusPedido | '')} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
                <option value="">Entregue (padrão)</option>
                {(Object.keys(STATUS_PEDIDO_LABELS) as StatusPedido[]).map((s) => (
                  <option key={s} value={s}>{STATUS_PEDIDO_LABELS[s]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">De</label>
              <input type="date" value={filtroDe} onChange={(e) => setFiltroDe(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Até</label>
              <input type="date" value={filtroAte} onChange={(e) => setFiltroAte(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
            <button
              onClick={() => exportarCsv(
                transacoes.map((t) => [new Date(t.createdAt).toLocaleString('pt-BR'), t.empresaNome, t.numero, FORMA_PAGAMENTO_LABELS[t.formaPagamento], t.total.toFixed(2), t.valorComissaoEstimado.toFixed(2), STATUS_PEDIDO_LABELS[t.status]]),
                ['Data/hora', 'Tenant', 'Nº pedido', 'Forma de pagamento', 'Total', 'Comissão estimada', 'Status'],
                'transacoes-plataforma.csv'
              )}
              className="flex items-center gap-1.5 text-xs font-medium border border-gray-300 text-gray-600 hover:bg-gray-50 px-3 py-2 rounded-lg ml-auto"
            >
              <Download className="h-3.5 w-3.5" /> Exportar CSV
            </button>
          </div>

          <p className="text-xs text-gray-400">Mostrando até 200 transações mais recentes que casam com o filtro.</p>

          {loading ? (
            <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-orange-500" /></div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wide text-gray-400">
                      <th className="py-2.5 px-4">Data/hora</th>
                      <th className="py-2.5 px-4">Tenant</th>
                      <th className="py-2.5 px-4">Nº pedido</th>
                      <th className="py-2.5 px-4">Forma de pagamento</th>
                      <th className="py-2.5 px-4 text-right">Total</th>
                      <th className="py-2.5 px-4 text-right">Comissão estimada</th>
                      <th className="py-2.5 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transacoes.map((t) => (
                      <tr key={t.id} className="border-t border-gray-100">
                        <td className="px-4 py-3 text-gray-500 text-xs">{new Date(t.createdAt).toLocaleString('pt-BR')}</td>
                        <td className="px-4 py-3 font-medium text-gray-800">{t.empresaNome}</td>
                        <td className="px-4 py-3 text-gray-600">#{t.numero}</td>
                        <td className="px-4 py-3 text-gray-600">{FORMA_PAGAMENTO_LABELS[t.formaPagamento]}</td>
                        <td className="px-4 py-3 text-right text-gray-700">R$ {t.total.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right text-gray-700">R$ {t.valorComissaoEstimado.toFixed(2)} <span className="text-xs text-gray-400">({t.comissaoPercent}%)</span></td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-emerald-50 text-emerald-700">
                            {STATUS_PEDIDO_LABELS[t.status]}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {transacoes.length === 0 && <p className="text-center text-gray-400 text-sm py-10">Nenhuma transação encontrada.</p>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SuperAdminFinanceiroTransacoesPage;
