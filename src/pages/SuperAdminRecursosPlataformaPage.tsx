import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles, Loader2, ChevronDown, Building2 } from 'lucide-react';
import SuperAdminNav from '../components/superadmin/SuperAdminNav';
import { getSuperAdminSession, signOutSuperAdmin } from '../lib/superAdminAuth';
import { fetchRecursosPlataforma } from '../lib/superAdminRecursos';
import { RecursosPlataformaResumo } from '../types/SuperAdminRecursos';
import { useSuperAdminManifest } from '../hooks/useSuperAdminManifest';

const SuperAdminRecursosPlataformaPage: React.FC = () => {
  useSuperAdminManifest();
  const navigate = useNavigate();
  const [authorized] = useState(() => !!getSuperAdminSession());
  const [dados, setDados] = useState<RecursosPlataformaResumo | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandido, setExpandido] = useState<string | null>(null);
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
    fetchRecursosPlataforma()
      .then(setDados)
      .catch(() => setDados(null))
      .finally(() => setLoading(false));
  }, [authorized]);

  if (!authorized) return null;

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
                  <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2"><Sparkles className="h-5 w-5 text-orange-500" /> Recursos da Plataforma</h1>
                  <p className="text-xs text-gray-400 mt-0.5">Catálogo das funcionalidades opt-in e quais lojas ligaram cada uma.</p>
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
          {loading ? (
            <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-orange-500" /></div>
          ) : !dados ? (
            <p className="text-center text-gray-400 py-16">Não foi possível carregar os dados.</p>
          ) : (
            <div className="space-y-2">
              {dados.recursos.map((r) => {
                const aberto = expandido === r.campo;
                return (
                  <div key={r.campo} className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                    <button
                      onClick={() => setExpandido(aberto ? null : r.campo)}
                      className="w-full flex items-center gap-4 p-4 text-left hover:bg-gray-50 transition-colors"
                    >
                      <span className="w-48 shrink-0 text-sm font-medium text-gray-800 truncate">{r.label}</span>
                      <div className="flex-1 h-2.5 rounded-full bg-gray-100 overflow-hidden">
                        <div className="h-full rounded-full bg-orange-500" style={{ width: `${r.percentual}%` }} />
                      </div>
                      <span className="w-32 shrink-0 text-right text-xs text-gray-500">{r.totalTenants} de {dados.totalEmpresas} ({r.percentual}%)</span>
                      <ChevronDown className={`h-4 w-4 text-gray-400 shrink-0 transition-transform ${aberto ? 'rotate-180' : ''}`} />
                    </button>
                    {aberto && (
                      <div className="px-4 pb-4 border-t border-gray-100 pt-3">
                        {r.tenants.length === 0 ? (
                          <p className="text-sm text-gray-400">Nenhuma loja ligou essa funcionalidade ainda.</p>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {r.tenants.map((t) => (
                              <button
                                key={t.id}
                                onClick={() => navigate('/super-admin/empresas')}
                                className="flex items-center gap-1.5 text-xs font-medium bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-full px-3 py-1.5 text-gray-700"
                              >
                                <Building2 className="h-3 w-3 text-gray-400" /> {t.nome}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SuperAdminRecursosPlataformaPage;
