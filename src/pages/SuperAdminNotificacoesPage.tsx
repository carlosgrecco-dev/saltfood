import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, Loader2, RefreshCw, Wallet, UserPlus, Headset, Building } from 'lucide-react';
import SuperAdminNav from '../components/superadmin/SuperAdminNav';
import { getSuperAdminSession, signOutSuperAdmin } from '../lib/superAdminAuth';
import { fetchSuperAdminNotificacoes } from '../lib/superAdminNotificacoes';
import { SuperAdminNotificacao, TipoNotificacaoSuperAdmin } from '../types/SuperAdminNotificacao';
import { useSuperAdminManifest } from '../hooks/useSuperAdminManifest';

const ICONE_POR_TIPO: Record<TipoNotificacaoSuperAdmin, React.ElementType> = {
  FATURA_PENDENTE: Wallet,
  LEAD_NOVO: UserPlus,
  CHAMADO_ABERTO: Headset,
  TENANT_INATIVO: Building,
};

const LABEL_POR_TIPO: Record<TipoNotificacaoSuperAdmin, string> = {
  FATURA_PENDENTE: 'Fatura pendente',
  LEAD_NOVO: 'Lead novo',
  CHAMADO_ABERTO: 'Chamado aberto',
  TENANT_INATIVO: 'Tenant inativo',
};

const SuperAdminNotificacoesPage: React.FC = () => {
  useSuperAdminManifest();
  const navigate = useNavigate();
  const [authorized] = useState(() => !!getSuperAdminSession());
  const [notificacoes, setNotificacoes] = useState<SuperAdminNotificacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroTipo, setFiltroTipo] = useState<TipoNotificacaoSuperAdmin | ''>('');
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

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetchSuperAdminNotificacoes();
      setNotificacoes(r.notificacoes);
    } catch {
      setNotificacoes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authorized) load();
  }, [authorized, load]);

  if (!authorized) return null;

  const filtradas = filtroTipo ? notificacoes.filter((n) => n.tipo === filtroTipo) : notificacoes;
  const tiposPresentes = Array.from(new Set(notificacoes.map((n) => n.tipo)));

  return (
    <div className="min-h-screen bg-gray-50">
      <div className={`transition-[margin] duration-300 ease-in-out ml-0 ${navOpen ? 'sm:ml-72' : 'sm:ml-16'}`}>
        <div className="border-b border-gray-200 bg-white">
          <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
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
                  <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2"><Bell className="h-5 w-5 text-orange-500" /> Notificações</h1>
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

        <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setFiltroTipo('')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${filtroTipo === '' ? 'bg-orange-600 text-white shadow' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  Todas ({notificacoes.length})
                </button>
                {tiposPresentes.map((t) => (
                  <button
                    key={t}
                    onClick={() => setFiltroTipo(t)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${filtroTipo === t ? 'bg-orange-600 text-white shadow' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  >
                    {LABEL_POR_TIPO[t]} ({notificacoes.filter((n) => n.tipo === t).length})
                  </button>
                ))}
              </div>
              <button onClick={load} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-orange-500 border border-gray-200 px-3 py-2 rounded-lg">
                <RefreshCw className="h-3.5 w-3.5" /> Atualizar
              </button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-orange-500" /></div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filtradas.map((n, i) => {
                  const Icon = ICONE_POR_TIPO[n.tipo];
                  return (
                    <div key={i} className="flex items-start gap-3 py-3.5">
                      <div className="h-8 w-8 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-gray-800">{n.descricao}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{LABEL_POR_TIPO[n.tipo]} · {new Date(n.data).toLocaleDateString('pt-BR')}</p>
                      </div>
                    </div>
                  );
                })}
                {filtradas.length === 0 && (
                  <div className="text-center py-12">
                    <Bell className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">Nada pra ver aqui — tudo em dia.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminNotificacoesPage;
