import React, { useCallback, useEffect, useState } from 'react';
import { Plus, Trash2, Phone, Tag, Truck, Power } from 'lucide-react';
import { Fornecedor } from '../../types/Fornecedor';
import { fetchFornecedores, createFornecedor, updateFornecedor, deleteFornecedor } from '../../lib/fornecedores';

interface FornecedoresTabProps {
  empresaId: string;
}

const emptyForm = { nome: '', contato: '', categoria: '', observacoes: '' };

const FornecedoresTab: React.FC<FornecedoresTabProps> = ({ empresaId }) => {
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [salvando, setSalvando] = useState(false);
  const [processandoId, setProcessandoId] = useState<string | null>(null);
  const [mostrarInativos, setMostrarInativos] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setFornecedores(await fetchFornecedores(empresaId, mostrarInativos ? undefined : true));
    } catch {
      setFornecedores([]);
    } finally {
      setLoading(false);
    }
  }, [empresaId, mostrarInativos]);

  useEffect(() => {
    load();
  }, [load]);

  const handleCriar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome.trim()) return;
    setSalvando(true);
    try {
      await createFornecedor(empresaId, {
        nome: form.nome.trim(),
        contato: form.contato.trim() || undefined,
        categoria: form.categoria.trim() || undefined,
        observacoes: form.observacoes.trim() || undefined,
      });
      setForm(emptyForm);
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Não foi possível cadastrar o fornecedor.');
    } finally {
      setSalvando(false);
    }
  };

  const handleAlternarAtivo = async (fornecedor: Fornecedor) => {
    setProcessandoId(fornecedor.id);
    try {
      await updateFornecedor(empresaId, fornecedor.id, { ativo: !fornecedor.ativo });
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Não foi possível atualizar o fornecedor.');
    } finally {
      setProcessandoId(null);
    }
  };

  const handleExcluir = async (id: string) => {
    if (!window.confirm('Remover este fornecedor?')) return;
    await deleteFornecedor(empresaId, id);
    await load();
  };

  return (
    <div>
      <form onSubmit={handleCriar} className="flex flex-wrap gap-3 mb-6 bg-gray-50 p-4 rounded-xl items-end">
        <div className="flex-1 min-w-[180px]">
          <label className="block text-xs text-gray-500 mb-1">Nome</label>
          <input
            value={form.nome}
            onChange={(e) => setForm({ ...form, nome: e.target.value })}
            placeholder="Ex: Distribuidora Nordeste"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            required
          />
        </div>
        <div className="min-w-[160px]">
          <label className="block text-xs text-gray-500 mb-1">Contato</label>
          <input
            value={form.contato}
            onChange={(e) => setForm({ ...form, contato: e.target.value })}
            placeholder="Telefone / WhatsApp"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>
        <div className="min-w-[140px]">
          <label className="block text-xs text-gray-500 mb-1">Categoria</label>
          <input
            value={form.categoria}
            onChange={(e) => setForm({ ...form, categoria: e.target.value })}
            placeholder="Ex: Bebidas, Embalagens..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>
        <button type="submit" disabled={salvando} className="flex items-center gap-1.5 bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-60">
          <Plus className="h-4 w-4" /> Cadastrar
        </button>
      </form>

      <label className="flex items-center gap-2 mb-4 cursor-pointer w-fit">
        <input type="checkbox" checked={mostrarInativos} onChange={(e) => setMostrarInativos(e.target.checked)} className="text-orange-600 rounded" />
        <span className="text-sm text-gray-600">Mostrar inativos</span>
      </label>

      {loading ? (
        <p className="text-center text-gray-500 py-8 text-sm">Carregando...</p>
      ) : (
        <div className="space-y-2">
          {fornecedores.map((f) => (
            <div key={f.id} className={`flex flex-wrap items-center justify-between gap-3 border rounded-xl px-4 py-3 ${f.ativo ? 'border-gray-200' : 'border-gray-100 bg-gray-50 opacity-60'}`}>
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-9 w-9 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                  <Truck className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-gray-800 text-sm truncate">{f.nome}</p>
                  <p className="text-xs text-gray-500 flex items-center gap-3">
                    {f.contato && <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {f.contato}</span>}
                    {f.categoria && <span className="flex items-center gap-1"><Tag className="h-3 w-3" /> {f.categoria}</span>}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleAlternarAtivo(f)}
                  disabled={processandoId === f.id}
                  className="flex items-center gap-1 text-xs font-medium border border-gray-300 text-gray-600 hover:bg-gray-50 px-2.5 py-1.5 rounded-lg disabled:opacity-60"
                >
                  <Power className="h-3.5 w-3.5" /> {f.ativo ? 'Desativar' : 'Ativar'}
                </button>
                <button onClick={() => handleExcluir(f.id)} className="text-red-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          ))}
          {fornecedores.length === 0 && <p className="text-center text-gray-500 py-10 text-sm">Nenhum fornecedor cadastrado.</p>}
        </div>
      )}
    </div>
  );
};

export default FornecedoresTab;
