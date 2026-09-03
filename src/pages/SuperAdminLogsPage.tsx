import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ScrollText, LogIn, AlertOctagon, ShieldAlert, Loader2, ArrowLeft, RefreshCw,
} from 'lucide-react';
import SuperAdminNav from '../components/superadmin/SuperAdminNav';
import { getSuperAdminSession, signOutSuperAdmin } from '../lib/superAdminAuth';
import { fetchLogs } from '../lib/logs';
import { LogAuditoria, TipoLog, TIPO_LOG_LABELS } from '../types/Log';
import { useSuperAdminManifest } from '../hooks/useSuperAdminManifest';

const TIPO_ICON: Record<TipoLog, typeof LogIn> = {
  ACESSO: LogIn,
  ERRO: AlertOctagon,
  ALTERACAO_CRITICA: ShieldAlert,
};

const TIPO_COLOR: Record<TipoLog, string> = {
  ACESSO: 'bg-blue-100 text-blue-700',
  ERRO: 'bg-red-100 text-red-700',
  ALTERACAO_CRITICA: 'bg-amber-100 text-amber-700',
};

const SuperAdminLogsPage: React.FC = () => {
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

  const [logs, setLogs] = useState<LogAuditoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [tipoFiltro, setTipoFiltro] = useState<TipoLog | ''>('');
  const [navOpen, setNavOpen] = useState(true);

  useEffect(() => {
    if (!authorized) navigate('/super-admin', { replace: true });
  }, [authorized, navigate]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setLogs(await fetchLogs({ tipo: tipoFiltro || undefined }));
    } catch {
      /* silencioso */
    } finally {
      setLoading(false);
    }
  }, [tipoFiltro]);

  useEffect(() => {
    if (authorized) load();
  }, [authorized, load]);

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
              <div className="h-11 w-11 shrink-0 rounded-xl bg-black p-1.5">
                <img src="/logo.png" alt="SaltFood" className="h-full w-full rounded-md" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-orange-500">Super Admin</p>
                <h1 className="text-xl font-bold text-gray-900">Logs de Auditoria &amp; Sistema</h1>
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
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h2 className="flex items-center gap-2 font-bold text-gray-800">
              <ScrollText className="h-4 w-4 text-orange-500" /> Registro de eventos
            </h2>
            <div className="flex items-center gap-2">
              <select value={tipoFiltro} onChange={(e) => setTipoFiltro(e.target.value as TipoLog | '')} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
                <option value="">Todos os tipos</option>
                <option value="ACESSO">Acessos</option>
                <option value="ERRO">Erros do servidor</option>
                <option value="ALTERACAO_CRITICA">Alterações críticas</option>
              </select>
              <button onClick={load} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-orange-500 border border-gray-200 px-3 py-2 rounded-lg">
                <RefreshCw className="h-3.5 w-3.5" /> Atualizar
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-orange-500" /></div>
          ) : logs.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-12">Nenhum log registrado ainda.</p>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {logs.map((log) => {
                const Icon = TIPO_ICON[log.tipo];
                return (
                  <div key={log.id} className="flex items-start gap-3 border border-gray-100 rounded-xl p-3">
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${TIPO_COLOR[log.tipo]}`}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold text-gray-500">{TIPO_LOG_LABELS[log.tipo]}</span>
                        {log.empresaNome && <span className="text-xs text-orange-500 font-medium">{log.empresaNome}</span>}
                        {log.ator && <span className="text-xs text-gray-400">por {log.ator}</span>}
                      </div>
                      <p className="text-sm text-gray-700 mt-0.5">{log.acao}</p>
                    </div>
                    <span className="shrink-0 text-xs text-gray-400 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString('pt-BR')}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
};

export default SuperAdminLogsPage;
