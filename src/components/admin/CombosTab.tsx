import React, { useCallback, useEffect, useState } from 'react';
import { Plus, Layers, Pencil, Trash2, ImageOff, X } from 'lucide-react';
import { fetchProdutosAdminResumo, createProduto, updateProduto, setProdutoStatus, deleteProduto } from '../../lib/produtos';
import { fetchCategorias } from '../../lib/categorias';
import { Produto, Categoria } from '../../types/Produto';
import FotoInput from './FotoInput';

interface CombosTabProps {
  empresaId: string;
}

const emptyForm = { nome: '', categoriaId: '', preco: '', precoPromocional: '', fotoUrl: '', descricao: '' };

const CombosTab: React.FC<CombosTabProps> = ({ empresaId }) => {
  const [combos, setCombos] = useState<Produto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const resumo = await fetchProdutosAdminResumo(empresaId);
      setCombos(resumo.produtos.filter((p) => p.ehCombo));
    } catch {
      /* silencioso */
    } finally {
      setLoading(false);
    }
  }, [empresaId]);

  useEffect(() => {
    load();
    fetchCategorias(empresaId).then(setCategorias).catch(() => setCategorias([]));
  }, [empresaId, load]);

  const abrirNovo = () => {
    setForm(emptyForm);
    setEditingId(null);
    setError('');
    setModalAberto(true);
  };

  const abrirEdicao = (combo: Produto) => {
    setForm({
      nome: combo.nome,
      categoriaId: combo.categoriaId || '',
      preco: String(combo.preco),
      precoPromocional: combo.precoPromocional != null ? String(combo.precoPromocional) : '',
      fotoUrl: combo.fotoUrl || '',
      descricao: combo.descricao || '',
    });
    setEditingId(combo.id);
    setError('');
    setModalAberto(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const preco = parseFloat(form.preco);
    if (!form.nome || Number.isNaN(preco) || preco <= 0) {
      setError('Informe nome e um preço válido.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        nome: form.nome,
        categoriaId: form.categoriaId || null,
        preco,
        precoPromocional: form.precoPromocional ? parseFloat(form.precoPromocional) : null,
        fotoUrl: form.fotoUrl || null,
        descricao: form.descricao || null,
        ehCombo: true,
      };
      if (editingId) {
        await updateProduto(empresaId, editingId, payload);
      } else {
        await createProduto(empresaId, payload);
      }
      setModalAberto(false);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar combo');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleAtivo = async (combo: Produto) => {
    await setProdutoStatus(empresaId, combo.id, !combo.ativo);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Remover este combo?')) return;
    await deleteProduto(empresaId, id);
    load();
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2"><Layers className="h-5 w-5 text-orange-600" /> Combos</h2>
          <p className="text-sm text-gray-500">Produtos marcados como combo — para adicionais/opções, use a aba Produtos.</p>
        </div>
        <button onClick={abrirNovo} className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white text-sm px-4 py-2 rounded-lg">
          <Plus className="h-4 w-4" /> Novo combo
        </button>
      </div>

      {loading ? (
        <p className="text-center text-gray-500 py-8">Carregando...</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {combos.map((combo) => (
            <div key={combo.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
              {combo.fotoUrl ? (
                <img src={combo.fotoUrl} alt={combo.nome} className="w-full h-32 object-cover" />
              ) : (
                <div className="w-full h-32 bg-gray-100 flex items-center justify-center">
                  <ImageOff className="h-6 w-6 text-gray-300" />
                </div>
              )}
              <div className="p-3">
                <p className="font-bold text-gray-800 truncate">{combo.nome}</p>
                <p className="text-orange-600 font-bold text-sm">R$ {(combo.precoPromocional ?? combo.preco).toFixed(2)}</p>
                <div className="flex items-center justify-between mt-2">
                  <button
                    onClick={() => handleToggleAtivo(combo)}
                    className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${combo.ativo ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-600'}`}
                  >
                    {combo.ativo ? 'Ativo' : 'Inativo'}
                  </button>
                  <div className="flex items-center gap-2">
                    <button onClick={() => abrirEdicao(combo)} className="text-gray-400 hover:text-gray-700"><Pencil className="h-3.5 w-3.5" /></button>
                    <button onClick={() => handleDelete(combo.id)} className="text-red-500 hover:text-red-700"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {combos.length === 0 && <p className="col-span-full text-center text-gray-500 py-10">Nenhum combo cadastrado ainda.</p>}
        </div>
      )}

      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setModalAberto(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-800">{editingId ? 'Editar combo' : 'Novo combo'}</h3>
              <button onClick={() => setModalAberto(false)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                placeholder="Nome do combo"
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                required
              />
              <select
                value={form.categoriaId}
                onChange={(e) => setForm({ ...form, categoriaId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
              >
                <option value="">Sem categoria</option>
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </select>
              <textarea
                placeholder="Descrição (opcional)"
                value={form.descricao}
                onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  step="0.01"
                  placeholder="Preço"
                  value={form.preco}
                  onChange={(e) => setForm({ ...form, preco: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  required
                />
                <input
                  type="number"
                  step="0.01"
                  placeholder="Preço promocional"
                  value={form.precoPromocional}
                  onChange={(e) => setForm({ ...form, precoPromocional: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <FotoInput value={form.fotoUrl} onChange={(url) => setForm({ ...form, fotoUrl: url })} />
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button
                type="submit"
                disabled={saving}
                className="w-full flex items-center justify-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-4 py-2.5 rounded-lg disabled:opacity-60"
              >
                <Plus className="h-4 w-4" /> {saving ? 'Salvando...' : editingId ? 'Salvar alterações' : 'Adicionar combo'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CombosTab;
