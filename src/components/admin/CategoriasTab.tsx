import React, { useCallback, useEffect, useState } from 'react';
import { Plus, Trash2, ChevronUp, ChevronDown, Tag } from 'lucide-react';
import { Categoria } from '../../types/Produto';
import { fetchCategorias, createCategoria, updateCategoria, deleteCategoria } from '../../lib/categorias';

interface CategoriasTabProps {
  empresaId: string;
}

const CategoriasTab: React.FC<CategoriasTabProps> = ({ empresaId }) => {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [nome, setNome] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setCategorias(await fetchCategorias(empresaId));
    } catch {
      /* silencioso */
    } finally {
      setLoading(false);
    }
  }, [empresaId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) return;
    setError('');
    setSaving(true);
    try {
      await createCategoria(empresaId, { nome: nome.trim(), ordem: categorias.length });
      setNome('');
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar categoria');
    } finally {
      setSaving(false);
    }
  };

  const handleRenomear = async (categoria: Categoria, novoNome: string) => {
    if (!novoNome.trim() || novoNome === categoria.nome) return;
    await updateCategoria(empresaId, categoria.id, { nome: novoNome.trim(), ordem: categoria.ordem, ativo: categoria.ativo });
    load();
  };

  const handleToggleAtivo = async (categoria: Categoria) => {
    await updateCategoria(empresaId, categoria.id, { nome: categoria.nome, ordem: categoria.ordem, ativo: !categoria.ativo });
    load();
  };

  const handleDelete = async (categoria: Categoria) => {
    if (!window.confirm(`Remover a categoria "${categoria.nome}"? Os produtos vinculados a ela ficam sem categoria.`)) return;
    await deleteCategoria(empresaId, categoria.id);
    load();
  };

  const handleMove = async (index: number, direction: -1 | 1) => {
    const alvo = categorias[index + direction];
    const atual = categorias[index];
    if (!alvo) return;
    await Promise.all([
      updateCategoria(empresaId, atual.id, { nome: atual.nome, ordem: alvo.ordem, ativo: atual.ativo }),
      updateCategoria(empresaId, alvo.id, { nome: alvo.nome, ordem: atual.ordem, ativo: alvo.ativo }),
    ]);
    load();
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Tag className="h-5 w-5 text-gray-700" />
        <h2 className="text-lg font-bold text-gray-800">Categorias de produtos</h2>
      </div>
      <p className="text-sm text-gray-500 mb-4">
        Organize o cardápio em categorias (ex: Acarajés, Combos, Bebidas). A ordem definida aqui é a mesma exibida
        nas abas de filtro da loja pública.
      </p>

      <form onSubmit={handleAdd} className="bg-gray-50 p-4 rounded-xl mb-6 flex items-center gap-2">
        <input
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Nome da categoria (ex: Combos)"
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
        />
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white text-sm px-4 py-2 rounded-lg disabled:opacity-60 shrink-0"
        >
          <Plus className="h-4 w-4" /> Adicionar
        </button>
      </form>

      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

      {loading ? (
        <p className="text-center text-gray-500 py-8">Carregando...</p>
      ) : (
        <div className="space-y-2">
          {categorias.map((categoria, index) => (
            <div key={categoria.id} className="flex items-center gap-2 border border-gray-200 rounded-xl p-3">
              <div className="flex flex-col shrink-0">
                <button
                  onClick={() => handleMove(index, -1)}
                  disabled={index === 0}
                  className="text-gray-400 hover:text-gray-700 disabled:opacity-20"
                >
                  <ChevronUp className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleMove(index, 1)}
                  disabled={index === categorias.length - 1}
                  className="text-gray-400 hover:text-gray-700 disabled:opacity-20"
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>
              <input
                defaultValue={categoria.nome}
                onBlur={(e) => handleRenomear(categoria, e.target.value)}
                className="flex-1 min-w-0 px-2.5 py-1.5 border border-transparent hover:border-gray-300 focus:border-gray-300 rounded-lg text-sm font-medium text-gray-800"
              />
              <button
                onClick={() => handleToggleAtivo(categoria)}
                className={`px-3 py-1 rounded-full text-xs font-medium shrink-0 ${
                  categoria.ativo ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'
                }`}
              >
                {categoria.ativo ? 'Ativa' : 'Inativa'}
              </button>
              <button onClick={() => handleDelete(categoria)} className="text-red-500 hover:text-red-700 shrink-0">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          {categorias.length === 0 && (
            <p className="text-center text-gray-500 py-8">Nenhuma categoria cadastrada ainda.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default CategoriasTab;
