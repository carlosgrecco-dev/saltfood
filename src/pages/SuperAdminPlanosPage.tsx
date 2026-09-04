import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layers, Plus, Pencil, Trash2, X, ArrowLeft, Loader2, Building2, Star, ListChecks, Sparkles, Copy, MoreVertical, Receipt } from 'lucide-react';
import SuperAdminNav from '../components/superadmin/SuperAdminNav';
import { getSuperAdminSession, signOutSuperAdmin } from '../lib/superAdminAuth';
import { fetchPlanos, createPlano, updatePlano, setPlanoStatus, deletePlano } from '../lib/planos';
import { fetchEmpresas, setEmpresaPlano } from '../lib/empresas';
import { fetchFaturas } from '../lib/faturas';
import { Plano } from '../types/Plano';
import { Empresa } from '../types/Empresa';
import { Fatura, STATUS_FATURA_LABELS } from '../types/Fatura';
import { FUNCOES, CampoFuncionalidade } from '../data/funcionalidades';
import { useSuperAdminManifest } from '../hooks/useSuperAdminManifest';

type Feedback = { type: 'success' | 'error'; message: string } | null;

const funcionalidadesVazias = (): Record<CampoFuncionalidade, boolean> =>
  Object.fromEntries(FUNCOES.map((f) => [f.campo, false])) as Record<CampoFuncionalidade, boolean>;

const emptyForm = {
  nome: '', valorMensal: '', comissaoPercent: '', descricao: '', recursosText: '',
  limitePedidosMes: '', limiteProdutos: '', limiteUsuarios: '', limiteEntregadores: '', destaque: false,
  funcionalidades: funcionalidadesVazias(),
};

const formatLimite = (valor: number | null, sufixo: string) => (valor == null ? `${sufixo} ilimitado*` : `${valor} ${sufixo}`);

const STATUS_BADGE = {
  PENDENTE: 'bg-amber-100 text-amber-800',
  PAGO: 'bg-emerald-100 text-emerald-800',
  ATRASADO: 'bg-red-100 text-red-800',
} as const;

const SuperAdminPlanosPage: React.FC = () => {
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

  const [planos, setPlanos] = useState<Plano[]>([]);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<Feedback>(null);

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [navOpen, setNavOpen] = useState(true);
  const [menuAbertoId, setMenuAbertoId] = useState<string | null>(null);
  const [faturas, setFaturas] = useState<Fatura[]>([]);

  useEffect(() => {
    if (!authorized) navigate('/super-admin', { replace: true });
  }, [authorized, navigate]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [p, e, f] = await Promise.all([fetchPlanos(), fetchEmpresas(), fetchFaturas()]);
      setPlanos(p);
      setEmpresas(e);
      setFaturas(f);
    } catch (err) {
      setFeedback({ type: 'error', message: err instanceof Error ? err.message : 'Erro ao carregar dados' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authorized) load();
  }, [authorized, load]);

  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => setFeedback(null), 4000);
    return () => clearTimeout(timer);
  }, [feedback]);

  useEffect(() => {
    if (!menuAbertoId) return;
    const handler = () => setMenuAbertoId(null);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [menuAbertoId]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setError('');
  };

  const handleEdit = (plano: Plano) => {
    setEditingId(plano.id);
    setForm({
      nome: plano.nome,
      valorMensal: String(plano.valorMensal),
      comissaoPercent: String(plano.comissaoPercent),
      descricao: plano.descricao || '',
      recursosText: plano.recursos.join('\n'),
      limitePedidosMes: plano.limitePedidosMes != null ? String(plano.limitePedidosMes) : '',
      limiteProdutos: plano.limiteProdutos != null ? String(plano.limiteProdutos) : '',
      limiteUsuarios: plano.limiteUsuarios != null ? String(plano.limiteUsuarios) : '',
      limiteEntregadores: plano.limiteEntregadores != null ? String(plano.limiteEntregadores) : '',
      destaque: plano.destaque,
      funcionalidades: Object.fromEntries(FUNCOES.map((f) => [f.campo, plano[f.campo]])) as Record<CampoFuncionalidade, boolean>,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const comissao = Number(form.comissaoPercent);
    if (!form.nome || Number.isNaN(comissao) || comissao < 0 || comissao > 100) {
      setError('Informe o nome e um percentual de comissão válido (0 a 100).');
      return;
    }

    const payload = {
      nome: form.nome,
      valorMensal: form.valorMensal ? Number(form.valorMensal) : 0,
      comissaoPercent: comissao,
      descricao: form.descricao || undefined,
      recursos: form.recursosText.split('\n').map((r) => r.trim()).filter(Boolean),
      limitePedidosMes: form.limitePedidosMes ? Number(form.limitePedidosMes) : null,
      limiteProdutos: form.limiteProdutos ? Number(form.limiteProdutos) : null,
      limiteUsuarios: form.limiteUsuarios ? Number(form.limiteUsuarios) : null,
      limiteEntregadores: form.limiteEntregadores ? Number(form.limiteEntregadores) : null,
      destaque: form.destaque,
      ...form.funcionalidades,
    };

    setSaving(true);
    try {
      if (editingId) {
        await updatePlano(editingId, payload);
      } else {
        await createPlano(payload);
      }
      resetForm();
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar plano');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleAtivo = async (plano: Plano) => {
    await setPlanoStatus(plano.id, !plano.ativo);
    load();
  };

  const handleDelete = async (plano: Plano) => {
    setMenuAbertoId(null);
    if (!window.confirm(`Remover o plano "${plano.nome}"? As empresas vinculadas ficarão sem plano.`)) return;
    try {
      await deletePlano(plano.id);
      if (editingId === plano.id) resetForm();
      load();
    } catch (err) {
      setFeedback({ type: 'error', message: err instanceof Error ? err.message : 'Erro ao remover plano' });
    }
  };

  const handleDuplicar = async (plano: Plano) => {
    setMenuAbertoId(null);
    try {
      await createPlano({
        nome: `${plano.nome} (cópia)`,
        valorMensal: plano.valorMensal,
        comissaoPercent: plano.comissaoPercent,
        descricao: plano.descricao || undefined,
        recursos: plano.recursos,
        limitePedidosMes: plano.limitePedidosMes,
        limiteProdutos: plano.limiteProdutos,
        limiteUsuarios: plano.limiteUsuarios,
        limiteEntregadores: plano.limiteEntregadores,
        destaque: false,
        ...Object.fromEntries(FUNCOES.map((f) => [f.campo, plano[f.campo]])),
      });
      setFeedback({ type: 'success', message: `"${plano.nome}" duplicado com sucesso.` });
      load();
    } catch (err) {
      setFeedback({ type: 'error', message: err instanceof Error ? err.message : 'Erro ao duplicar plano' });
    }
  };

  const handleAtribuir = async (empresaId: string, planoId: string) => {
    try {
      await setEmpresaPlano(empresaId, planoId || null);
      setFeedback({ type: 'success', message: 'Plano atribuído com sucesso — comissão e funcionalidades sincronizadas.' });
      load();
    } catch (err) {
      setFeedback({ type: 'error', message: err instanceof Error ? err.message : 'Erro ao atribuir plano' });
    }
  };

  if (!authorized) return null;

  const planosPorId = new Map(planos.map((p) => [p.id, p]));
  const ultimaFaturaPorEmpresa = new Map<string, Fatura>();
  for (const f of faturas) {
    const atual = ultimaFaturaPorEmpresa.get(f.empresaId);
    if (!atual || new Date(f.createdAt) > new Date(atual.createdAt)) {
      ultimaFaturaPorEmpresa.set(f.empresaId, f);
    }
  }

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
                <h1 className="text-xl font-bold text-gray-900">Planos e Assinaturas</h1>
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
        {feedback && (
          <div className={`rounded-xl px-4 py-3 text-sm font-medium ${feedback.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
            {feedback.message}
          </div>
        )}

        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="flex items-center gap-2 font-bold text-gray-800">
              <Layers className="h-4 w-4 text-orange-500" /> {editingId ? 'Editar plano' : 'Novo plano'}
            </h2>
            {editingId && (
              <button onClick={resetForm} className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1">
                <X className="h-3.5 w-3.5" /> Cancelar edição
              </button>
            )}
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Nome</label>
                <input
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  placeholder="Ex: Básico"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Mensalidade (R$)</label>
                <input
                  type="number" min={0} step="0.01"
                  value={form.valorMensal}
                  onChange={(e) => setForm({ ...form, valorMensal: e.target.value })}
                  placeholder="99.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Comissão (%)</label>
                <input
                  type="number" min={0} max={100} step="0.1"
                  value={form.comissaoPercent}
                  onChange={(e) => setForm({ ...form, comissaoPercent: e.target.value })}
                  placeholder="5"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Descrição (opcional)</label>
                <input
                  value={form.descricao}
                  onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer w-fit">
              <input
                type="checkbox"
                checked={form.destaque}
                onChange={(e) => setForm({ ...form, destaque: e.target.checked })}
                className="w-4 h-4 text-orange-500 rounded focus:ring-orange-500"
              />
              <span className="text-sm text-gray-600 flex items-center gap-1"><Star className="h-3.5 w-3.5 text-amber-500" /> Mais Popular</span>
            </label>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Limite de pedidos/mês</label>
                    <input
                      type="number" min={0}
                      value={form.limitePedidosMes}
                      onChange={(e) => setForm({ ...form, limitePedidosMes: e.target.value })}
                      placeholder="Ilimitado"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Limite de produtos</label>
                    <input
                      type="number" min={0}
                      value={form.limiteProdutos}
                      onChange={(e) => setForm({ ...form, limiteProdutos: e.target.value })}
                      placeholder="Ilimitado"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Usuários inclusos</label>
                    <input
                      type="number" min={0}
                      value={form.limiteUsuarios}
                      onChange={(e) => setForm({ ...form, limiteUsuarios: e.target.value })}
                      placeholder="Ilimitado"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Entregadores</label>
                    <input
                      type="number" min={0}
                      value={form.limiteEntregadores}
                      onChange={(e) => setForm({ ...form, limiteEntregadores: e.target.value })}
                      placeholder="Ilimitado"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-1">Recursos inclusos (um por linha, só texto pra vitrine do plano)</label>
                  <textarea
                    value={form.recursosText}
                    onChange={(e) => setForm({ ...form, recursosText: e.target.value })}
                    rows={6}
                    placeholder={'Gestão de pedidos\nDashboard\nPIX\n...'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-y"
                  />
                </div>
              </div>

              <div className="lg:col-span-1">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 mb-2">
                  <Sparkles className="h-3.5 w-3.5 text-orange-500" /> Recursos disponíveis
                </label>
                <p className="text-xs text-gray-400 mb-2">
                  Selecione os recursos que estarão inclusos neste plano. Ao atribuir a uma loja, essas funções
                  ligam automaticamente (dá pra ajustar uma exceção pontual depois, sem mudar o plano da loja).
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {FUNCOES.map(({ campo, titulo, icon: Icon }) => (
                    <label
                      key={campo}
                      className={`flex items-center gap-1.5 border rounded-lg px-2.5 py-2 cursor-pointer text-xs transition-colors ${
                        form.funcionalidades[campo] ? 'border-orange-300 bg-orange-50/60 text-orange-700' : 'border-gray-200 text-gray-600'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={form.funcionalidades[campo]}
                        onChange={(e) => setForm({ ...form, funcionalidades: { ...form.funcionalidades, [campo]: e.target.checked } })}
                        className="w-3.5 h-3.5 text-orange-500 rounded focus:ring-orange-500"
                      />
                      <Icon className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{titulo}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
              <button type="button" onClick={resetForm} className="px-4 py-2.5 rounded-lg text-sm font-semibold text-gray-500 hover:bg-gray-100">
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-4 py-2.5 rounded-lg disabled:opacity-60"
              >
                <Plus className="h-4 w-4" /> {saving ? 'Salvando...' : editingId ? 'Salvar' : 'Criar plano'}
              </button>
            </div>
          </form>
          {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <h2 className="font-bold text-gray-800 mb-4">Planos cadastrados</h2>
          {loading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-orange-500" /></div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {planos.map((plano) => (
                <div
                  key={plano.id}
                  className={`relative border rounded-2xl p-4 ${plano.destaque ? 'border-orange-300 ring-2 ring-orange-100' : 'border-gray-200'}`}
                >
                  {plano.destaque && (
                    <span className="absolute -top-2.5 left-4 flex items-center gap-1 bg-orange-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
                      <Star className="h-3 w-3" /> MAIS POPULAR
                    </span>
                  )}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-bold text-gray-800">{plano.nome}</p>
                      <p className="text-2xl font-bold text-orange-500 mt-1">R$ {plano.valorMensal.toFixed(2)}<span className="text-xs font-normal text-gray-400">/mês</span></p>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {plano.comissaoPercent > 0 ? `+ ${plano.comissaoPercent}% de comissão` : 'sem comissão sobre vendas'}
                      </p>
                    </div>
                    <button
                      onClick={() => handleToggleAtivo(plano)}
                      className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-medium ${plano.ativo ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-600'}`}
                    >
                      {plano.ativo ? 'Ativo' : 'Inativo'}
                    </button>
                  </div>
                  {plano.descricao && <p className="text-xs text-gray-400 mt-2">{plano.descricao}</p>}

                  {(plano.limitePedidosMes || plano.limiteProdutos || plano.limiteUsuarios || plano.limiteEntregadores) && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {plano.limitePedidosMes != null && (
                        <span className="text-[11px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{formatLimite(plano.limitePedidosMes, 'pedidos/mês')}</span>
                      )}
                      {plano.limiteProdutos != null && (
                        <span className="text-[11px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{formatLimite(plano.limiteProdutos, 'produtos')}</span>
                      )}
                      {plano.limiteUsuarios != null && (
                        <span className="text-[11px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{formatLimite(plano.limiteUsuarios, 'usuários')}</span>
                      )}
                      {plano.limiteEntregadores != null && (
                        <span className="text-[11px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{formatLimite(plano.limiteEntregadores, 'entregadores')}</span>
                      )}
                    </div>
                  )}

                  {plano.recursos.length > 0 && (
                    <ul className="mt-3 space-y-1 max-h-40 overflow-y-auto pr-1">
                      {plano.recursos.map((recurso, idx) => (
                        <li key={idx} className="flex items-start gap-1.5 text-xs text-gray-600">
                          <ListChecks className="h-3 w-3 mt-0.5 shrink-0 text-orange-500" />
                          <span>{recurso}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  <p className="text-xs text-gray-400 mt-3 flex items-center gap-1">
                    <Building2 className="h-3 w-3" /> {plano._count?.empresas ?? 0} loja(s) neste plano
                  </p>
                  <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                    <Sparkles className="h-3 w-3" /> {FUNCOES.filter((f) => plano[f.campo]).length} de {FUNCOES.length} funcionalidades
                  </p>
                  <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-100">
                    <button onClick={() => handleEdit(plano)} className="flex items-center gap-1 text-xs text-gray-500 hover:text-orange-500">
                      <Pencil className="h-3.5 w-3.5" /> Editar
                    </button>
                    <button onClick={() => handleDuplicar(plano)} className="flex items-center gap-1 text-xs text-gray-500 hover:text-orange-500">
                      <Copy className="h-3.5 w-3.5" /> Duplicar
                    </button>
                    <button onClick={() => handleToggleAtivo(plano)} className="flex items-center gap-1 text-xs text-gray-500 hover:text-orange-500">
                      {plano.ativo ? 'Desativar' : 'Ativar'}
                    </button>
                    <div className="relative ml-auto">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuAbertoId((atual) => (atual === plano.id ? null : plano.id));
                        }}
                        className="text-gray-400 hover:text-gray-600 p-1"
                        aria-label="Mais ações"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                      {menuAbertoId === plano.id && (
                        <div className="absolute right-0 bottom-full mb-1 w-36 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10">
                          <button
                            onClick={() => handleDelete(plano)}
                            className="flex w-full items-center gap-1.5 px-3 py-2 text-xs text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" /> Remover
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {planos.length === 0 && <p className="text-sm text-gray-400 col-span-full text-center py-8">Nenhum plano cadastrado ainda.</p>}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <h2 className="font-bold text-gray-800 mb-4">Planos atribuídos às lojas</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <th className="py-2 pr-3">Empresa</th>
                  <th className="py-2 pr-3">Plano</th>
                  <th className="py-2 pr-3">Mensalidade</th>
                  <th className="py-2 pr-3">Comissão</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 pr-3">Última fatura</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {empresas.map((emp) => {
                  const plano = emp.planoId ? planosPorId.get(emp.planoId) : null;
                  const ultimaFatura = ultimaFaturaPorEmpresa.get(emp.id);
                  return (
                    <tr key={emp.id}>
                      <td className="py-2.5 pr-3 font-medium text-gray-700">{emp.nome}</td>
                      <td className="py-2.5 pr-3">
                        <select
                          defaultValue={emp.planoId || ''}
                          onChange={(e) => handleAtribuir(emp.id, e.target.value)}
                          className="px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm"
                        >
                          <option value="">Sem plano</option>
                          {planos.map((p) => (
                            <option key={p.id} value={p.id}>{p.nome} (R$ {p.valorMensal.toFixed(2)} + {p.comissaoPercent}%)</option>
                          ))}
                        </select>
                      </td>
                      <td className="py-2.5 pr-3 text-gray-500">{plano ? `R$ ${plano.valorMensal.toFixed(2)}` : '—'}</td>
                      <td className="py-2.5 pr-3 text-gray-500">{emp.comissaoPercent}%</td>
                      <td className="py-2.5 pr-3">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${emp.empresaAtiva ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                          {emp.empresaAtiva ? 'Ativa' : 'Bloqueada'}
                        </span>
                      </td>
                      <td className="py-2.5 pr-3 text-xs">
                        {ultimaFatura ? (
                          <span className="flex items-center gap-1.5 text-gray-500">
                            <Receipt className="h-3 w-3 shrink-0" />
                            {new Date(ultimaFatura.vencimento).toLocaleDateString('pt-BR')}
                            <span className={`rounded-full px-2 py-0.5 font-semibold ${STATUS_BADGE[ultimaFatura.status]}`}>
                              {STATUS_FATURA_LABELS[ultimaFatura.status]}
                            </span>
                          </span>
                        ) : (
                          <span className="text-gray-400">Nenhuma</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {empresas.length === 0 && <p className="text-sm text-gray-400 text-center py-8">Nenhuma empresa cadastrada ainda.</p>}
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};

export default SuperAdminPlanosPage;
