import React, { useCallback, useEffect, useState } from 'react';
import { Plus, Trash2, Pencil, X, Target } from 'lucide-react';
import { fetchMissoesAsAdmin, createMissao, updateMissao, setMissaoStatus, deleteMissao } from '../../lib/missoes';
import { Missao, MissaoInput } from '../../types/Missao';

interface MissoesTabProps {
  empresaId: string;
}

const emptyForm = {
  titulo: '',
  descricao: '',
  metaPedidos: '2',
  periodoDias: '7',
  recompensaUnidades: '5',
};

const MissoesTab: React.FC<MissoesTabProps> = ({ empresaId }) => {
  const [missoes, setMissoes] = useState<Missao[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setMissoes(await fetchMissoesAsAdmin(empresaId));
    } catch {
      /* silencioso */
    } finally {
      setLoading(false);
    }
  }, [empresaId]);

  useEffect(() => {
    load();
  }, [load]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setError('');
  };

  const handleEdit = (missao: Missao) => {
    setEditingId(missao.id);
    setForm({
      titulo: missao.titulo,
      descricao: missao.descricao || '',
      metaPedidos: String(missao.metaPedidos),
      periodoDias: String(missao.periodoDias),
      recompensaUnidades: String(missao.recompensaUnidades),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.titulo) {
      setError('Informe o título da missão.');
      return;
    }
    const payload: MissaoInput = {
      titulo: form.titulo,
      descricao: form.descricao || undefined,
      metaPedidos: Number(form.metaPedidos),
      periodoDias: Number(form.periodoDias),
      recompensaUnidades: Number(form.recompensaUnidades),
    };

    setSaving(true);
    try {
      if (editingId) {
        await updateMissao(empresaId, editingId, payload);
      } else {
        await createMissao(empresaId, payload);
      }
      resetForm();
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar missão');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleAtivo = async (missao: Missao) => {
    await setMissaoStatus(empresaId, missao.id, !missao.ativo);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Remover esta missão?')) return;
    await deleteMissao(empresaId, id);
    if (editingId === id) resetForm();
    load();
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded-xl mb-6 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-gray-800 text-sm">{editingId ? 'Editar missão' : 'Nova missão'}</h3>
          {editingId && (
            <button type="button" onClick={resetForm} className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1">
              <X className="h-3.5 w-3.5" /> Cancelar edição
            </button>
          )}
        </div>

        <input
          placeholder="Título (ex: Peça 2x essa semana)"
          value={form.titulo}
          onChange={(e) => setForm({ ...form, titulo: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          required
        />
        <input
          placeholder="Descrição (opcional)"
          value={form.descricao}
          onChange={(e) => setForm({ ...form, descricao: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
        />

        <div className="grid md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Meta de pedidos</label>
            <input
              type="number"
              min={1}
              value={form.metaPedidos}
              onChange={(e) => setForm({ ...form, metaPedidos: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Prazo (dias)</label>
            <input
              type="number"
              min={1}
              value={form.periodoDias}
              onChange={(e) => setForm({ ...form, periodoDias: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Recompensa (unidades)</label>
            <input
              type="number"
              min={1}
              value={form.recompensaUnidades}
              onChange={(e) => setForm({ ...form, recompensaUnidades: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              required
            />
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white text-sm px-4 py-2 rounded-lg disabled:opacity-60"
        >
          <Plus className="h-4 w-4" /> {saving ? 'Salvando...' : editingId ? 'Salvar alterações' : 'Criar missão'}
        </button>
      </form>

      {loading ? (
        <p className="text-center text-gray-500 py-8">Carregando...</p>
      ) : (
        <div className="space-y-2">
          {missoes.map((missao) => (
            <div key={missao.id} className="flex items-center gap-3 border border-gray-200 rounded-2xl p-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50">
                <Target className="h-5 w-5 text-orange-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-800 text-sm">{missao.titulo}</p>
                <p className="text-xs text-gray-400">
                  {missao.metaPedidos} pedido{missao.metaPedidos > 1 ? 's' : ''} em {missao.periodoDias} dia{missao.periodoDias > 1 ? 's' : ''}
                  {' · '}+{missao.recompensaUnidades} unidades
                </p>
              </div>
              <button
                onClick={() => handleToggleAtivo(missao)}
                className={`px-3 py-1 rounded-full text-xs font-medium shrink-0 ${
                  missao.ativo ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'
                }`}
              >
                {missao.ativo ? 'Ativa' : 'Inativa'}
              </button>
              <button onClick={() => handleEdit(missao)} className="text-gray-400 hover:text-gray-700 shrink-0">
                <Pencil className="h-4 w-4" />
              </button>
              <button onClick={() => handleDelete(missao.id)} className="text-red-500 hover:text-red-700 shrink-0">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          {missoes.length === 0 && (
            <p className="text-center text-gray-500 py-8">Nenhuma missão cadastrada ainda.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default MissoesTab;
