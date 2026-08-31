import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { ArrowLeft, Building2, Headset, Loader2, RefreshCw } from 'lucide-react';
import SuperAdminNav from '../components/superadmin/SuperAdminNav';
import { getSuperAdminSession, signOutSuperAdmin } from '../lib/superAdminAuth';
import { fetchChamadosLojistas, updateChamadoLojista } from '../lib/tickets';
import {
  TicketSuporte, StatusTicketSuporte, STATUS_TICKET_LABELS,
  PrioridadeChamado, PRIORIDADE_CHAMADO_LABELS,
} from '../types/Ticket';
import { useSuperAdminManifest } from '../hooks/useSuperAdminManifest';

const STATUS_COLORS: Record<StatusTicketSuporte, string> = {
  ABERTO: 'bg-red-100 text-red-800',
  EM_ANDAMENTO: 'bg-amber-100 text-amber-800',
  RESOLVIDO: 'bg-green-100 text-green-800',
};

const PRIORIDADE_COLORS: Record<PrioridadeChamado, string> = {
  RELEVANTE: 'bg-green-100 text-green-800',
  PRIORITARIA: 'bg-amber-100 text-amber-800',
  URGENTE: 'bg-red-100 text-red-800',
};

const SuperAdminChamadosLojistasPage: React.FC = () => {
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

  useEffect(() => {
    if (!authorized) navigate('/super-admin', { replace: true });
  }, [authorized, navigate]);

  const [chamados, setChamados] = useState<TicketSuporte[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState<StatusTicketSuporte | ''>('');
  const [filtroPrioridade, setFiltroPrioridade] = useState<PrioridadeChamado | ''>('');
  const [respostaDrafts, setRespostaDrafts] = useState<Record<string, string>>({});
  const [salvandoId, setSalvandoId] = useState<string | null>(null);
  const [navOpen, setNavOpen] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setChamados(await fetchChamadosLojistas());
    } catch {
      /* silencioso */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authorized) load();
  }, [authorized, load]);

  if (!authorized) return null;

  const handleResponder = async (chamado: TicketSuporte, status: StatusTicketSuporte) => {
    setSalvandoId(chamado.id);
    try {
      await updateChamadoLojista(chamado.id, { status, respostaAdmin: respostaDrafts[chamado.id] || chamado.respostaAdmin || undefined });
      setRespostaDrafts((prev) => ({ ...prev, [chamado.id]: '' }));
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Não foi possível atualizar o chamado.');
    } finally {
      setSalvandoId(null);
    }
  };

  const filtrados = chamados
    .filter((c) => !filtroStatus || c.status === filtroStatus)
    .filter((c) => !filtroPrioridade || c.prioridade === filtroPrioridade);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className={`transition-[margin] duration-300 ease-in-out ml-0 ${navOpen ? 'sm:ml-72' : 'sm:ml-16'}`}>
        <div className="border-b border-gray-200 bg-white">
          <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
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
                  <h1 className="text-xl font-bold text-gray-900">Chamados dos lojistas</h1>
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

        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex flex-wrap gap-2">
                {(['', 'ABERTO', 'EM_ANDAMENTO', 'RESOLVIDO'] as const).map((s) => (
                  <button
                    key={s || 'todos-status'}
                    onClick={() => setFiltroStatus(s)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      filtroStatus === s ? 'bg-orange-600 text-white shadow' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {s ? STATUS_TICKET_LABELS[s] : 'Todos os status'}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                {(['', 'RELEVANTE', 'PRIORITARIA', 'URGENTE'] as const).map((p) => (
                  <button
                    key={p || 'todas-prioridades'}
                    onClick={() => setFiltroPrioridade(p)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      filtroPrioridade === p ? 'bg-gray-900 text-white shadow' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {p ? PRIORIDADE_CHAMADO_LABELS[p] : 'Todas as prioridades'}
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
              <div className="space-y-3">
                {filtrados.map((chamado) => (
                  <div key={chamado.id} className="border border-gray-200 rounded-2xl p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                      <div>
                        <p className="font-bold text-gray-800 text-sm">{chamado.assunto}</p>
                        <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                          <Building2 className="h-3 w-3" /> {chamado.empresa?.nome || '—'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {chamado.prioridade && (
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${PRIORIDADE_COLORS[chamado.prioridade]}`}>
                            {PRIORIDADE_CHAMADO_LABELS[chamado.prioridade]}
                          </span>
                        )}
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[chamado.status]}`}>
                          {STATUS_TICKET_LABELS[chamado.status]}
                        </span>
                      </div>
                    </div>

                    <div
                      className="text-sm text-gray-600 bg-gray-50 rounded-xl p-3 mb-3"
                      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(chamado.mensagem) }}
                    />

                    {chamado.respostaAdmin && (
                      <p className="text-sm text-emerald-700 bg-emerald-50 rounded-xl p-3 mb-3">
                        <strong>Sua resposta:</strong> {chamado.respostaAdmin}
                      </p>
                    )}

                    {chamado.status !== 'RESOLVIDO' && (
                      <div className="flex flex-wrap gap-2">
                        <input
                          placeholder="Escreva uma resposta (opcional)"
                          value={respostaDrafts[chamado.id] ?? ''}
                          onChange={(e) => setRespostaDrafts((prev) => ({ ...prev, [chamado.id]: e.target.value }))}
                          className="flex-1 min-w-[200px] px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                        {chamado.status === 'ABERTO' && (
                          <button
                            onClick={() => handleResponder(chamado, 'EM_ANDAMENTO')}
                            disabled={salvandoId === chamado.id}
                            className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs px-3 py-2 rounded-lg disabled:opacity-60"
                          >
                            Responder
                          </button>
                        )}
                        <button
                          onClick={() => handleResponder(chamado, 'RESOLVIDO')}
                          disabled={salvandoId === chamado.id}
                          className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-2 rounded-lg disabled:opacity-60"
                        >
                          Marcar resolvido
                        </button>
                      </div>
                    )}
                  </div>
                ))}
                {filtrados.length === 0 && (
                  <div className="text-center py-12">
                    <Headset className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">Nenhum chamado de lojista por aqui.</p>
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

export default SuperAdminChamadosLojistasPage;
