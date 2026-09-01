import React, { useCallback, useEffect, useState } from 'react';
import { Table, Save, Loader2, Check } from 'lucide-react';
import { fetchProdutosAdminResumo, updateProduto } from '../../lib/produtos';
import { Produto } from '../../types/Produto';

interface TabelaPrecosTabProps {
  empresaId: string;
}

const TabelaPrecosTab: React.FC<TabelaPrecosTabProps> = ({ empresaId }) => {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [precos, setPrecos] = useState<Record<string, string>>({});
  const [precosPromo, setPrecosPromo] = useState<Record<string, string>>({});
  const [salvandoId, setSalvandoId] = useState<string | null>(null);
  const [salvosId, setSalvosId] = useState<Set<string>>(new Set());
  const [busca, setBusca] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const resumo = await fetchProdutosAdminResumo(empresaId);
      setProdutos(resumo.produtos);
      setPrecos(Object.fromEntries(resumo.produtos.map((p) => [p.id, String(p.preco)])));
      setPrecosPromo(Object.fromEntries(resumo.produtos.map((p) => [p.id, p.precoPromocional != null ? String(p.precoPromocional) : ''])));
    } catch {
      /* silencioso */
    } finally {
      setLoading(false);
    }
  }, [empresaId]);

  useEffect(() => {
    load();
  }, [load]);

  const foiAlterado = (produto: Produto) => {
    const precoAtual = precos[produto.id] ?? '';
    const promoAtual = precosPromo[produto.id] ?? '';
    const precoOriginal = String(produto.preco);
    const promoOriginal = produto.precoPromocional != null ? String(produto.precoPromocional) : '';
    return precoAtual !== precoOriginal || promoAtual !== promoOriginal;
  };

  const handleSalvar = async (produto: Produto) => {
    const preco = parseFloat(precos[produto.id]);
    if (Number.isNaN(preco) || preco <= 0) {
      alert('Informe um preço válido.');
      return;
    }
    const precoPromocional = precosPromo[produto.id] ? parseFloat(precosPromo[produto.id]) : null;
    setSalvandoId(produto.id);
    try {
      await updateProduto(empresaId, produto.id, {
        nome: produto.nome,
        codigo: produto.codigo,
        categoriaId: produto.categoriaId,
        preco,
        precoPromocional,
        fotoUrl: produto.fotoUrl,
        descricao: produto.descricao,
        ehCombo: produto.ehCombo,
      });
      setProdutos((prev) => prev.map((p) => (p.id === produto.id ? { ...p, preco, precoPromocional } : p)));
      setSalvosId((prev) => new Set(prev).add(produto.id));
      setTimeout(() => setSalvosId((prev) => { const next = new Set(prev); next.delete(produto.id); return next; }), 2000);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao salvar preço');
    } finally {
      setSalvandoId(null);
    }
  };

  const termo = busca.trim().toLowerCase();
  const filtrados = produtos.filter((p) => !termo || p.nome.toLowerCase().includes(termo));

  return (
    <div>
      <div className="mb-5">
        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2"><Table className="h-5 w-5 text-orange-600" /> Tabela de Preços</h2>
        <p className="text-sm text-gray-500">Ajuste o preço e o preço promocional de vários produtos de uma vez.</p>
      </div>

      <input
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        placeholder="Buscar produto..."
        className="w-full max-w-md mb-5 px-3 py-2.5 border border-gray-300 rounded-lg text-sm"
      />

      {loading ? (
        <p className="text-center text-gray-500 py-8">Carregando...</p>
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-gray-500 bg-gray-50">
                <th className="py-3 px-4">Produto</th>
                <th className="py-3 px-4">Categoria</th>
                <th className="py-3 px-4">Preço</th>
                <th className="py-3 px-4">Preço promocional</th>
                <th className="py-3 px-4 w-24">Ação</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((produto) => (
                <tr key={produto.id} className="border-b border-gray-100">
                  <td className="py-2.5 px-4 font-medium text-gray-800">{produto.nome}</td>
                  <td className="py-2.5 px-4 text-gray-500">{produto.categoria?.nome || 'Sem categoria'}</td>
                  <td className="py-2.5 px-4">
                    <input
                      type="number"
                      step="0.01"
                      value={precos[produto.id] ?? ''}
                      onChange={(e) => setPrecos((prev) => ({ ...prev, [produto.id]: e.target.value }))}
                      className="w-28 px-2 py-1.5 border border-gray-300 rounded-lg text-sm"
                    />
                  </td>
                  <td className="py-2.5 px-4">
                    <input
                      type="number"
                      step="0.01"
                      placeholder="—"
                      value={precosPromo[produto.id] ?? ''}
                      onChange={(e) => setPrecosPromo((prev) => ({ ...prev, [produto.id]: e.target.value }))}
                      className="w-28 px-2 py-1.5 border border-gray-300 rounded-lg text-sm"
                    />
                  </td>
                  <td className="py-2.5 px-4">
                    {salvosId.has(produto.id) ? (
                      <span className="flex items-center gap-1 text-emerald-600 text-xs font-medium"><Check className="h-4 w-4" /> Salvo</span>
                    ) : (
                      <button
                        onClick={() => handleSalvar(produto)}
                        disabled={!foiAlterado(produto) || salvandoId === produto.id}
                        className="flex items-center gap-1 text-xs font-medium bg-gray-800 hover:bg-gray-900 text-white px-2.5 py-1.5 rounded-lg disabled:opacity-40"
                      >
                        {salvandoId === produto.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} Salvar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtrados.length === 0 && <p className="text-center text-gray-500 py-10">Nenhum produto encontrado.</p>}
        </div>
      )}
    </div>
  );
};

export default TabelaPrecosTab;
