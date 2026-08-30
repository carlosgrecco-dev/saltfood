import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Inbox, Layers, Loader2, Mail, Phone, RefreshCw } from 'lucide-react';
import SuperAdminNav from '../components/superadmin/SuperAdminNav';
import { getSuperAdminSession, signOutSuperAdmin } from '../lib/superAdminAuth';
import { fetchLeadsComerciais, updateLeadComercial } from '../lib/leadsComerciais';
import { LeadComercial, StatusLeadComercial, STATUS_LEAD_LABELS } from '../types/LeadComercial';
import { useSuperAdminManifest } from '../hooks/useSuperAdminManifest';

const STATUS_COLORS: Record<StatusLeadComercial, string> = {
  NOVO: 'bg-blue-100 text-blue-800',
  CONTATADO: 'bg-amber-100 text-amber-800',
  CONVERTIDO: 'bg-green-100 text-green-800',
  DESCARTADO: 'bg-gray-200 text-gray-600',
};

const SuperAdminLeadsPage: React.FC = () => {
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

  const [leads, setLeads] = useState<LeadComercial[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState<StatusLeadComercial | ''>('');
  const [notaDrafts, setNotaDrafts] = useState<Record<string, string>>({});
  const [salvandoId, setSalvandoId] = useState<string | null>(null);
  const [navOpen, setNavOpen] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setLeads(await fetchLeadsComerciais());
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

  const handleAtualizar = async (lead: LeadComercial, status: StatusLeadComercial) => {
    setSalvandoId(lead.id);
    try {
      await updateLeadComercial(lead.id, { status, notaInterna: notaDrafts[lead.id] ?? lead.notaInterna ?? undefined });
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Não foi possível atualizar o lead.');
    } finally {
      setSalvandoId(null);
    }
  };

  const filtrados = filtroStatus ? leads.filter((l) => l.status === filtroStatus) : leads;

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
                  <h1 className="text-xl font-bold text-gray-900">Leads comerciais</h1>
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
                {(['', 'NOVO', 'CONTATADO', 'CONVERTIDO', 'DESCARTADO'] as const).map((s) => (
                  <button
                    key={s || 'todos'}
                    onClick={() => setFiltroStatus(s)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      filtroStatus === s ? 'bg-orange-600 text-white shadow' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {s ? STATUS_LEAD_LABELS[s] : 'Todos'}
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
                {filtrados.map((lead) => (
                  <div key={lead.id} className="border border-gray-200 rounded-2xl p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                      <div>
                        <p className="font-bold text-gray-800 text-sm">{lead.nome}</p>
                        <p className="text-xs text-gray-400 flex flex-wrap items-center gap-x-3 gap-y-1 mt-0.5">
                          <span className="inline-flex items-center gap-1"><Mail className="h-3 w-3" /> {lead.email}</span>
                          {lead.telefone && <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" /> {lead.telefone}</span>}
                          {lead.planoInteresse && (
                            <span className="inline-flex items-center gap-1 text-orange-600">
                              <Layers className="h-3 w-3" /> {lead.planoInteresse.nome}
                            </span>
                          )}
                          {lead.origem && <span>· via {lead.origem}</span>}
                        </p>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium shrink-0 ${STATUS_COLORS[lead.status]}`}>
                        {STATUS_LEAD_LABELS[lead.status]}
                      </span>
                    </div>

                    {lead.mensagem && (
                      <p className="text-sm text-gray-600 bg-gray-50 rounded-xl p-3 mb-3">{lead.mensagem}</p>
                    )}

                    <div className="flex flex-wrap gap-2">
                      <input
                        placeholder="Nota interna (opcional)"
                        value={notaDrafts[lead.id] ?? lead.notaInterna ?? ''}
                        onChange={(e) => setNotaDrafts((prev) => ({ ...prev, [lead.id]: e.target.value }))}
                        className="flex-1 min-w-[200px] px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                      {lead.status === 'NOVO' && (
                        <button
                          onClick={() => handleAtualizar(lead, 'CONTATADO')}
                          disabled={salvandoId === lead.id}
                          className="bg-amber-500 hover:bg-amber-600 text-white text-xs px-3 py-2 rounded-lg disabled:opacity-60"
                        >
                          Marcar contatado
                        </button>
                      )}
                      {lead.status !== 'CONVERTIDO' && (
                        <button
                          onClick={() => handleAtualizar(lead, 'CONVERTIDO')}
                          disabled={salvandoId === lead.id}
                          className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-2 rounded-lg disabled:opacity-60"
                        >
                          Marcar convertido
                        </button>
                      )}
                      {lead.status !== 'DESCARTADO' && (
                        <button
                          onClick={() => handleAtualizar(lead, 'DESCARTADO')}
                          disabled={salvandoId === lead.id}
                          className="bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs px-3 py-2 rounded-lg disabled:opacity-60"
                        >
                          Descartar
                        </button>
                      )}
                      {(notaDrafts[lead.id] !== undefined && notaDrafts[lead.id] !== (lead.notaInterna ?? '')) && (
                        <button
                          onClick={() => handleAtualizar(lead, lead.status)}
                          disabled={salvandoId === lead.id}
                          className="bg-slate-900 hover:bg-slate-800 text-white text-xs px-3 py-2 rounded-lg disabled:opacity-60"
                        >
                          Salvar nota
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {filtrados.length === 0 && (
                  <div className="text-center py-12">
                    <Inbox className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">Nenhum lead por aqui.</p>
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

export default SuperAdminLeadsPage;
