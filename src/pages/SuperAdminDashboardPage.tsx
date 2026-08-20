import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, LogOut, Wallet, ShoppingBag, TrendingUp, Percent, Building2, Users, Bike, Loader2,
  Sparkles, Smartphone, Globe2, ListChecks, HeartPulse,
} from 'lucide-react';
import SuperAdminNav from '../components/superadmin/SuperAdminNav';
import { getSuperAdminSession, signOutSuperAdmin } from '../lib/superAdminAuth';
import { fetchSuperAdminDashboard } from '../lib/superAdminDashboard';
import { SuperAdminDashboard } from '../types/SuperAdminDashboard';
import { useSuperAdminManifest } from '../hooks/useSuperAdminManifest';
import SimpleBarChart from '../components/SimpleBarChart';
import StackedBar from '../components/StackedBar';

type Periodo = 'hoje' | 'semana' | 'mes' | 'tudo';

const PALETA_SEGMENTOS = ['bg-orange-500', 'bg-gray-700', 'bg-amber-400', 'bg-emerald-500', 'bg-sky-500', 'bg-rose-400', 'bg-violet-400', 'bg-gray-400'];

const formatDataCurta = (iso: string) => {
  const [, mes, dia] = iso.split('-');
  return `${dia}/${mes}`;
};

const formatDataHora = (iso: string | null) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
};

const SuperAdminDashboardPage: React.FC = () => {
  useSuperAdminManifest();
  const navigate = useNavigate();
  const [authorized] = useState(() => !!getSuperAdminSession());
  const [periodo, setPeriodo] = useState<Periodo>('mes');
  const [data, setData] = useState<SuperAdminDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [navOpen, setNavOpen] = useState(true);

  useEffect(() => {
    if (!authorized) navigate('/super-admin', { replace: true });
  }, [authorized, navigate]);

  useEffect(() => {
    const handler = (e: Event) => {
      if ((e as CustomEvent).detail?.kind !== 'superadmin') return;
      signOutSuperAdmin();
      navigate('/super-admin', { replace: true });
    };
    window.addEventListener('kifood:session-expired', handler);
    return () => window.removeEventListener('kifood:session-expired', handler);
  }, [navigate]);

  const getRange = useCallback((): { de?: string; ate?: string } => {
    if (periodo === 'tudo') return {};
    const end = new Date();
    const start = new Date();
    if (periodo === 'semana') start.setDate(start.getDate() - 6);
    else if (periodo === 'mes') start.setDate(start.getDate() - 29);
    return { de: start.toISOString().slice(0, 10), ate: end.toISOString().slice(0, 10) };
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

  const handleLogout = () => {
    signOutSuperAdmin();
    navigate('/super-admin', { replace: true });
  };

  if (!authorized) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className={`transition-[margin] duration-300 ease-in-out ml-0 ${navOpen ? 'sm:ml-72' : 'sm:ml-16'}`}>
        <div className="border-b border-gray-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 shrink-0 rounded-xl bg-black p-1.5">
                  <img src="/logo.png" alt="SaltFood" className="h-full w-full rounded-md" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-orange-500">Super Admin</p>
                  <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <LayoutDashboard className="h-5 w-5 text-orange-500" /> Visão Geral da Plataforma
                  </h1>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleLogout}
                  title="Sair"
                  className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-semibold text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                </button>
                <SuperAdminNav onOpenChange={setNavOpen} />
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-wrap gap-2">
            {([
              { id: 'hoje', label: 'Hoje' },
              { id: 'semana', label: '7 dias' },
              { id: 'mes', label: 'Mês (30 dias)' },
              { id: 'tudo', label: 'Desde o início' },
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
            <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white py-16">
              <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
            </div>
          ) : !data ? (
            <p className="text-center text-gray-400 py-16">Não foi possível carregar os dados.</p>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gradient-to-r from-orange-500 to-orange-500 text-white p-5 rounded-2xl">
                  <p className="text-orange-100 text-xs mb-1 flex items-center gap-1"><Wallet className="h-3.5 w-3.5" /> GMV do período</p>
                  <p className="text-2xl font-bold">R$ {data.gmv.toFixed(2)}</p>
                </div>
                <div className="bg-white border border-gray-200 p-5 rounded-2xl">
                  <p className="text-gray-500 text-xs mb-1 flex items-center gap-1"><ShoppingBag className="h-3.5 w-3.5" /> Pedidos entregues</p>
                  <p className="text-2xl font-bold text-gray-800">{data.totalPedidos}</p>
                </div>
                <div className="bg-white border border-gray-200 p-5 rounded-2xl">
                  <p className="text-gray-500 text-xs mb-1 flex items-center gap-1"><TrendingUp className="h-3.5 w-3.5" /> Ticket médio</p>
                  <p className="text-2xl font-bold text-gray-800">R$ {data.ticketMedio.toFixed(2)}</p>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-2xl">
                  <p className="text-emerald-700 text-xs mb-1 flex items-center gap-1"><Percent className="h-3.5 w-3.5" /> Comissão recebida</p>
                  <p className="text-2xl font-bold text-emerald-800">R$ {data.comissaoTotal.toFixed(2)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <div className="bg-white border border-gray-200 p-5 rounded-2xl">
                  <p className="text-gray-500 text-xs mb-1 flex items-center gap-1"><Building2 className="h-3.5 w-3.5" /> Lojas ativas</p>
                  <p className="text-2xl font-bold text-gray-800">{data.empresasAtivas}<span className="text-sm text-gray-400 font-normal"> / {data.totalEmpresas}</span></p>
                </div>
                <div className="bg-white border border-gray-200 p-5 rounded-2xl">
                  <p className="text-gray-500 text-xs mb-1 flex items-center gap-1"><Building2 className="h-3.5 w-3.5" /> Lojas com venda</p>
                  <p className="text-2xl font-bold text-gray-800">{data.lojasComVendaNoPeriodo}</p>
                </div>
                <div className="bg-white border border-gray-200 p-5 rounded-2xl">
                  <p className="text-gray-500 text-xs mb-1 flex items-center gap-1"><Sparkles className="h-3.5 w-3.5" /> Novos tenants</p>
                  <p className="text-2xl font-bold text-gray-800">{data.novosTenantsNoPeriodo ?? 0}</p>
                </div>
                <div className="bg-white border border-gray-200 p-5 rounded-2xl">
                  <p className="text-gray-500 text-xs mb-1 flex items-center gap-1"><Users className="h-3.5 w-3.5" /> Clientes cadastrados</p>
                  <p className="text-2xl font-bold text-gray-800">{data.totalClientes}</p>
                </div>
                <div className="bg-white border border-gray-200 p-5 rounded-2xl">
                  <p className="text-gray-500 text-xs mb-1 flex items-center gap-1"><Bike className="h-3.5 w-3.5" /> Motoboys ativos</p>
                  <p className="text-2xl font-bold text-gray-800">{data.totalMotoboysAtivos}</p>
                </div>
              </div>

              <div className="mt-6 bg-white border border-gray-200 p-5 rounded-2xl">
                <p className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-1.5"><TrendingUp className="h-4 w-4 text-orange-500" /> Pedidos entregues por dia</p>
                <SimpleBarChart
                  data={(data.pedidosPorDia ?? []).map((d) => ({ label: formatDataCurta(d.data), value: d.pedidos }))}
                  formatValue={(v) => `${v} pedido${v === 1 ? '' : 's'}`}
                />
              </div>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white border border-gray-200 p-5 rounded-2xl">
                  <p className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-1.5"><Smartphone className="h-4 w-4 text-orange-500" /> Dispositivos</p>
                  {(data.dispositivos ?? []).length === 0 ? (
                    <p className="text-center text-gray-400 text-sm py-6">Sem dados neste período</p>
                  ) : (
                    <StackedBar
                      segments={(data.dispositivos ?? []).map((d, i) => ({ label: d.nome, value: d.quantidade, colorClass: PALETA_SEGMENTOS[i % PALETA_SEGMENTOS.length] }))}
                      formatValue={(v) => `${v} pedido${v === 1 ? '' : 's'}`}
                    />
                  )}
                </div>
                <div className="bg-white border border-gray-200 p-5 rounded-2xl">
                  <p className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-1.5"><Globe2 className="h-4 w-4 text-orange-500" /> Navegadores</p>
                  {(data.navegadores ?? []).length === 0 ? (
                    <p className="text-center text-gray-400 text-sm py-6">Sem dados neste período</p>
                  ) : (
                    <StackedBar
                      segments={(data.navegadores ?? []).map((d, i) => ({ label: d.nome, value: d.quantidade, colorClass: PALETA_SEGMENTOS[i % PALETA_SEGMENTOS.length] }))}
                      formatValue={(v) => `${v} pedido${v === 1 ? '' : 's'}`}
                    />
                  )}
                </div>
              </div>

              <div className="mt-6 bg-white border border-gray-200 p-5 rounded-2xl">
                <p className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-1.5"><ListChecks className="h-4 w-4 text-orange-500" /> Uso de funcionalidades</p>
                <div className="space-y-3">
                  {(data.usoFuncionalidades ?? []).map((f) => (
                    <div key={f.recurso} className="flex items-center gap-3">
                      <span className="w-40 shrink-0 text-sm text-gray-600 truncate">{f.recurso}</span>
                      <div className="flex-1 h-2.5 rounded-full bg-gray-100 overflow-hidden">
                        <div className="h-full rounded-full bg-orange-500" style={{ width: `${f.percentual}%` }} />
                      </div>
                      <span className="w-24 shrink-0 text-right text-xs text-gray-500">{f.tenantsUsando} tenant{f.tenantsUsando === 1 ? '' : 's'} ({f.percentual}%)</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 bg-white border border-gray-200 rounded-2xl overflow-hidden">
                <p className="text-sm font-semibold text-gray-700 px-5 pt-5 pb-4 flex items-center gap-1.5"><HeartPulse className="h-4 w-4 text-orange-500" /> Saúde por tenant</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-t border-gray-100 text-left text-xs uppercase tracking-wide text-gray-400">
                        <th className="px-5 py-2 font-medium">Tenant</th>
                        <th className="px-5 py-2 font-medium">Status</th>
                        <th className="px-5 py-2 font-medium text-right">Pedidos no período</th>
                        <th className="px-5 py-2 font-medium">Último pedido</th>
                        <th className="px-5 py-2 font-medium">Último acesso admin</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(data.porTenant ?? []).map((t) => (
                        <tr key={t.id} className="border-t border-gray-100">
                          <td className="px-5 py-3 font-medium text-gray-800">{t.nome}</td>
                          <td className="px-5 py-3">
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${t.ativo ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                              {t.ativo ? 'Ativa' : 'Inativa'}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-right text-gray-700">{t.pedidosNoPeriodo}</td>
                          <td className="px-5 py-3 text-gray-500">{formatDataHora(t.ultimoPedidoEm)}</td>
                          <td className="px-5 py-3 text-gray-500">{formatDataHora(t.ultimoAcessoAdminEm)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboardPage;
