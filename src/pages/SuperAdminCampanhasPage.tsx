import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Megaphone, Loader2, Plus, Pencil, Trash2, X } from 'lucide-react';
import SuperAdminNav from '../components/superadmin/SuperAdminNav';
import { getSuperAdminSession, signOutSuperAdmin } from '../lib/superAdminAuth';
import { fetchCampanhas, criarCampanha, atualizarCampanha, atualizarStatusCampanha, removerCampanha } from '../lib/superAdminCampanhas';
import { CampanhaMarketing, CampanhaMarketingInput, StatusCampanhaMarketing, STATUS_CAMPANHA_LABELS } from '../types/SuperAdminCampanha';
import { useSuperAdminManifest } from '../hooks/useSuperAdminManifest';

const STATUS_COLORS: Record<StatusCampanhaMarketing, string> = {
  RASCUNHO: 'bg-gray-100 text-gray-700',
  ATIVA: 'bg-emerald-100 text-emerald-800',
  PAUSADA: 'bg-amber-100 text-amber-800',
  ENCERRADA: 'bg-red-100 text-red-800',
};

const toDateInput = (iso: string | null) => (iso ? iso.slice(0, 10) : '');

const FORM_VAZIO = { nome: '', publicoAlvo: '', mensagem: '', dataInicio: '', dataFim: '' };

const SuperAdminCampanhasPage: React.FC = () => {
  useSuperAdminManifest();
  const navigate = useNavigate();
  const [authorized] = useState(() => !!getSuperAdminSession());
  const [campanhas, setCampanhas] = useState<CampanhaMarketing[]>([]);
  const [loading, setLoading] = useState(true);
  const [navOpen, setNavOpen] = useState(true);
  const [formAberto, setFormAberto] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [form, setForm] = useState(FORM_VAZIO);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

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
      setCampanhas(await fetchCampanhas());
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

  const abrirNova = () => {
    setEditandoId(null);
    setForm(FORM_VAZIO);
    setErro('');
    setFormAberto(true);
  };

  const abrirEdicao = (c: CampanhaMarketing) => {
    setEditandoId(c.id);
    setForm({
      nome: c.nome,
      publicoAlvo: c.publicoAlvo,
      mensagem: c.mensagem,
      dataInicio: toDateInput(c.dataInicio),
      dataFim: toDateInput(c.dataFim),
    });
    setErro('');
    setFormAberto(true);
  };

  const handleSalvar = async () => {
    if (!form.nome.trim() || !form.publicoAlvo.trim() || !form.mensagem.trim() || !form.dataInicio) {
      setErro('Preencha nome, público-alvo, mensagem e data de início.');
      return;
    }
    setSalvando(true);
    setErro('');
    const input: CampanhaMarketingInput = {
      nome: form.nome.trim(),
      publicoAlvo: form.publicoAlvo.trim(),
      mensagem: form.mensagem.trim(),
      dataInicio: new Date(form.dataInicio).toISOString(),
      dataFim: form.dataFim ? new Date(form.dataFim).toISOString() : null,
    };
    try {
      if (editandoId) {
        await atualizarCampanha(editandoId, input);
      } else {
        await criarCampanha(input);
      }
      setFormAberto(false);
      await load();
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não foi possível salvar a campanha.');
    } finally {
      setSalvando(false);
    }
  };

  const handleStatus = async (c: CampanhaMarketing, status: StatusCampanhaMarketing) => {
    try {
      await atualizarStatusCampanha(c.id, status);
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Não foi possível atualizar o status.');
    }
  };

  const handleRemover = async (c: CampanhaMarketing) => {
    if (!window.confirm(`Remover a campanha "${c.nome}"?`)) return;
    try {
      await removerCampanha(c.id);
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Não foi possível remover a campanha.');
    }
  };

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
                  <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2"><Megaphone className="h-5 w-5 text-orange-500" /> Marketing & Campanhas</h1>
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

        <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8 space-y-4">
          <p className="text-xs text-gray-400 bg-gray-100 rounded-xl px-4 py-3">
            Aqui você registra e acompanha campanhas de marketing manualmente. Não há disparo automático de
            e-mail/push — é só um cadastro de controle.
          </p>

          <div className="flex justify-end">
            <button
              onClick={abrirNova}
              className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white font-medium text-sm px-4 py-2.5 rounded-lg"
            >
              <Plus className="h-4 w-4" /> Nova campanha
            </button>
          </div>

          {formAberto && (
            <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <p className="font-bold text-gray-800">{editandoId ? 'Editar campanha' : 'Nova campanha'}</p>
                <button onClick={() => setFormAberto(false)} className="text-gray-400 hover:text-gray-600"><X className="h-4 w-4" /></button>
              </div>
              {erro && <p className="text-xs text-red-600">{erro}</p>}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Nome</label>
                  <input
                    value={form.nome}
                    onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    placeholder="Ex: Reativação de tenants inativos"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Público-alvo</label>
                  <input
                    value={form.publicoAlvo}
                    onChange={(e) => setForm((f) => ({ ...f, publicoAlvo: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    placeholder="Ex: Tenants sem acesso há 30+ dias"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Mensagem</label>
                  <textarea
                    value={form.mensagem}
                    onChange={(e) => setForm((f) => ({ ...f, mensagem: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    placeholder="Texto da campanha"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Data de início</label>
                  <input
                    type="date"
                    value={form.dataInicio}
                    onChange={(e) => setForm((f) => ({ ...f, dataInicio: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Data de fim (opcional)</label>
                  <input
                    type="date"
                    value={form.dataFim}
                    onChange={(e) => setForm((f) => ({ ...f, dataFim: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button onClick={() => setFormAberto(false)} className="px-4 py-2.5 rounded-lg text-sm font-semibold text-gray-500 hover:bg-gray-100">
                  Cancelar
                </button>
                <button
                  onClick={handleSalvar}
                  disabled={salvando}
                  className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white font-medium text-sm px-4 py-2.5 rounded-lg disabled:opacity-60"
                >
                  {salvando && <Loader2 className="h-4 w-4 animate-spin" />} Salvar
                </button>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-orange-500" /></div>
          ) : (
            <div className="space-y-3">
              {campanhas.map((c) => (
                <div key={c.id} className="bg-white border border-gray-200 rounded-2xl p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <p className="font-bold text-gray-800 text-sm truncate">{c.nome}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{c.publicoAlvo}</p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium shrink-0 ${STATUS_COLORS[c.status]}`}>
                      {STATUS_CAMPANHA_LABELS[c.status]}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 bg-gray-50 rounded-xl p-3 mb-3">{c.mensagem}</p>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs text-gray-400">
                      {new Date(c.dataInicio).toLocaleDateString('pt-BR')}
                      {c.dataFim ? ` até ${new Date(c.dataFim).toLocaleDateString('pt-BR')}` : ' — sem data de fim'}
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <select
                        value={c.status}
                        onChange={(e) => handleStatus(c, e.target.value as StatusCampanhaMarketing)}
                        className="text-xs border border-gray-300 rounded-lg px-2 py-1.5"
                      >
                        {(Object.keys(STATUS_CAMPANHA_LABELS) as StatusCampanhaMarketing[]).map((s) => (
                          <option key={s} value={s}>{STATUS_CAMPANHA_LABELS[s]}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => abrirEdicao(c)}
                        className="flex items-center gap-1 text-xs font-medium border border-gray-300 text-gray-600 hover:bg-gray-50 px-2.5 py-1.5 rounded-lg"
                      >
                        <Pencil className="h-3.5 w-3.5" /> Editar
                      </button>
                      <button
                        onClick={() => handleRemover(c)}
                        className="flex items-center gap-1 text-xs font-medium border border-red-200 text-red-600 hover:bg-red-50 px-2.5 py-1.5 rounded-lg"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Remover
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {campanhas.length === 0 && (
                <div className="text-center py-12 bg-white border border-gray-200 rounded-2xl">
                  <Megaphone className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">Nenhuma campanha cadastrada ainda.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SuperAdminCampanhasPage;
