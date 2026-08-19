import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, LogOut, Wallet, ShoppingBag, TrendingUp, Percent, Building2, Users, Bike, Loader2,
} from 'lucide-react';
import SuperAdminNav from '../components/superadmin/SuperAdminNav';
import { getSuperAdminSession, signOutSuperAdmin } from '../lib/superAdminAuth';
import { fetchSuperAdminDashboard } from '../lib/superAdminDashboard';
import { SuperAdminDashboard } from '../types/SuperAdminDashboard';

type Periodo = 'hoje' | 'semana' | 'mes' | 'tudo';

const todayISO = () => new Date().toISOString().slice(0, 10);

const SuperAdminDashboardPage: React.FC = () => {
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
    <div className="min-h-screen bg-slate-50">
      <div className={`transition-[margin] duration-300 ease-in-out ml-16 ${navOpen ? 'sm:ml-72' : ''}`}>
        <div className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <img src="/saltfood-icon.png" alt="SaltFood" className="h-11 w-11" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Super Admin</p>
                  <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <LayoutDashboard className="h-5 w-5 text-indigo-500" /> Visão Geral da Plataforma
                  </h1>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleLogout}
                  title="Sair"
                  className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
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
                  periodo === p.id ? 'bg-indigo-600 text-white shadow' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white py-16">
              <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
            </div>
          ) : !data ? (
            <p className="text-center text-slate-400 py-16">Não foi possível carregar os dados.</p>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 text-white p-5 rounded-2xl">
                  <p className="text-indigo-100 text-xs mb-1 flex items-center gap-1"><Wallet className="h-3.5 w-3.5" /> GMV do período</p>
                  <p className="text-2xl font-bold">R$ {data.gmv.toFixed(2)}</p>
                </div>
                <div className="bg-white border border-slate-200 p-5 rounded-2xl">
                  <p className="text-slate-500 text-xs mb-1 flex items-center gap-1"><ShoppingBag className="h-3.5 w-3.5" /> Pedidos entregues</p>
                  <p className="text-2xl font-bold text-slate-800">{data.totalPedidos}</p>
                </div>
                <div className="bg-white border border-slate-200 p-5 rounded-2xl">
                  <p className="text-slate-500 text-xs mb-1 flex items-center gap-1"><TrendingUp className="h-3.5 w-3.5" /> Ticket médio</p>
                  <p className="text-2xl font-bold text-slate-800">R$ {data.ticketMedio.toFixed(2)}</p>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-2xl">
                  <p className="text-emerald-700 text-xs mb-1 flex items-center gap-1"><Percent className="h-3.5 w-3.5" /> Comissão recebida</p>
                  <p className="text-2xl font-bold text-emerald-800">R$ {data.comissaoTotal.toFixed(2)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200 p-5 rounded-2xl">
                  <p className="text-slate-500 text-xs mb-1 flex items-center gap-1"><Building2 className="h-3.5 w-3.5" /> Lojas ativas</p>
                  <p className="text-2xl font-bold text-slate-800">{data.empresasAtivas}<span className="text-sm text-slate-400 font-normal"> / {data.totalEmpresas}</span></p>
                </div>
                <div className="bg-white border border-slate-200 p-5 rounded-2xl">
                  <p className="text-slate-500 text-xs mb-1 flex items-center gap-1"><Building2 className="h-3.5 w-3.5" /> Lojas com venda</p>
                  <p className="text-2xl font-bold text-slate-800">{data.lojasComVendaNoPeriodo}</p>
                </div>
                <div className="bg-white border border-slate-200 p-5 rounded-2xl">
                  <p className="text-slate-500 text-xs mb-1 flex items-center gap-1"><Users className="h-3.5 w-3.5" /> Clientes cadastrados</p>
                  <p className="text-2xl font-bold text-slate-800">{data.totalClientes}</p>
                </div>
                <div className="bg-white border border-slate-200 p-5 rounded-2xl">
                  <p className="text-slate-500 text-xs mb-1 flex items-center gap-1"><Bike className="h-3.5 w-3.5" /> Motoboys ativos</p>
                  <p className="text-2xl font-bold text-slate-800">{data.totalMotoboysAtivos}</p>
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
