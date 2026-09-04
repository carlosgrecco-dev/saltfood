import React, { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import PublicHeader from '../components/PublicHeader';
import PlatformFooter from '../components/PlatformFooter';
import { fetchStatusPublico, StatusPublico } from '../lib/statusPublico';

const POLL_MS = 30000;

const StatusPage: React.FC = () => {
  const [status, setStatus] = useState<StatusPublico | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = () => {
      fetchStatusPublico()
        .then(setStatus)
        .catch(() => setStatus({ operacional: false, verificadoEm: new Date().toISOString() }))
        .finally(() => setLoading(false));
    };
    load();
    const id = setInterval(load, POLL_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <PublicHeader />

      <main className="max-w-2xl mx-auto px-6 pb-16 pt-10 w-full flex-1">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Status da Plataforma</h1>
        <p className="text-sm text-slate-400 mb-8">Verificação em tempo real da disponibilidade do SaltFood.</p>

        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-orange-500" /></div>
        ) : status ? (
          <div className={`rounded-2xl border p-6 flex items-center gap-4 ${status.operacional ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
            {status.operacional ? (
              <CheckCircle2 className="h-10 w-10 text-emerald-600 shrink-0" />
            ) : (
              <XCircle className="h-10 w-10 text-red-600 shrink-0" />
            )}
            <div>
              <p className={`text-lg font-bold ${status.operacional ? 'text-emerald-800' : 'text-red-800'}`}>
                {status.operacional ? 'Todos os sistemas operacionais' : 'Instabilidade detectada'}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                Última verificação: {new Date(status.verificadoEm).toLocaleString('pt-BR')}
              </p>
            </div>
          </div>
        ) : null}

        <p className="text-xs text-slate-400 mt-6">
          Esta página verifica a conexão da plataforma com o banco de dados a cada 30 segundos. Pra reportar um
          problema que não aparece aqui, fale com o suporte.
        </p>
      </main>

      <PlatformFooter />
    </div>
  );
};

export default StatusPage;
