import React, { useCallback, useEffect, useState } from 'react';
import { Table, Save, Loader2, Check, Percent, DollarSign } from 'lucide-react';
import { fetchProdutosAdminResumo, updateProduto } from '../../lib/produtos';
import { Produto } from '../../types/Produto';

interface TabelaPrecosTabProps {
  empresaId: string;
}

type TipoAjuste = 'percentual' | 'valor';

const TabelaPrecosTab: React.FC<TabelaPrecosTabProps> = ({ empresaId }) => {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [precos, setPrecos] = useState<Record<string, string>>({});
  const [precosPromo, setPrecosPromo] = useState<Record<string, string>>({});
  const [salvandoId, setSalvandoId] = useState<string | null>(null);
  const [salvosId, setSalvosId] = useState<Set<string>>(new Set());
  const [busca, setBusca] = useState('');
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());
  const [tipoAjuste, setTipoAjuste] = useState<TipoAjuste>('percentual');
  const [valorAjuste, setValorAjuste] = useState('');
  const [salvandoTodos, setSalvandoTodos] = useState(false);

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

  const salvarProduto = async (produto: Produto) => {
    const preco = parseFloat(precos[produto.id]);
    if (Number.isNaN(preco) || preco <= 0) return false;
    const precoPromocional = precosPromo[produto.id] ? parseFloat(precosPromo[produto.id]) : null;
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
    return true;
  };

  const handleSalvar = async (produto: Produto) => {
    setSalvandoId(produto.id);
    try {
      const ok = await salvarProduto(produto);
      if (!ok) {
        alert('Informe um preço válido.');
        return;
      }
      setSalvosId((prev) => new Set(prev).add(produto.id));
      setTimeout(() => setSalvosId((prev) => { const next = new Set(prev); next.delete(produto.id); return next; }), 2000);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao salvar preço');
    } finally {
      setSalvandoId(null);
    }
  };

  const produtosAlterados = produtos.filter(foiAlterado);

  const handleSalvarTodos = async () => {
    setSalvandoTodos(true);
    try {
      for (const produto of produtosAlterados) {
        await salvarProduto(produto);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao salvar alguns preços');
    } finally {
      setSalvandoTodos(false);
    }
  };

  const toggleSelecionado = (id: string) => {
    setSelecionados((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  /** Aplica o ajuste em lote (% ou R$, positivo aumenta / negativo diminui) só na tela — precisa salvar depois. */
  const handleAplicarAjuste = () => {
    const valor = parseFloat(valorAjuste);
    if (Number.isNaN(valor) || selecionados.size === 0) {
      alert('Escolha ao menos 1 produto e informe um valor de ajuste.');
      return;
    }
    setPrecos((prev) => {
      const next = { ...prev };
      for (const id of selecionados) {
        const atual = parseFloat(next[id] ?? '0');
        if (Number.isNaN(atual)) continue;
        const novo = tipoAjuste === 'percentual' ? atual * (1 + valor / 100) : atual + valor;
        next[id] = Math.max(0.01, novo).toFixed(2);
      }
      return next;
    });
  };

  const termo = busca.trim().toLowerCase();
  const filtrados = produtos.filter((p) => !termo || p.nome.toLowerCase().includes(termo));
  const todosSelecionados = filtrados.length > 0 && filtrados.every((p) => selecionados.has(p.id));

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2"><Table className="h-5 w-5 text-orange-600" /> Tabela de Preços</h2>
          <p className="text-sm text-gray-500">Ajuste preços individualmente ou em lote, por porcentagem ou valor fixo.</p>
        </div>
        {produtosAlterados.length > 0 && (
          <button
            onClick={handleSalvarTodos}
            disabled={salvandoTodos}
            className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white text-sm px-4 py-2 rounded-lg disabled:opacity-60"
          >
            {salvandoTodos ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Salvar {produtosAlterados.length} alteração{produtosAlterados.length > 1 ? 'ões' : ''}
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar produto..."
          className="flex-1 min-w-[200px] px-3 py-2.5 border border-gray-300 rounded-lg text-sm"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mb-4">
        <span className="text-sm font-medium text-gray-700">
          Ajuste coletivo {selecionados.size > 0 ? `(${selecionados.size} selecionado${selecionados.size > 1 ? 's' : ''})` : '— selecione produtos na tabela'}
        </span>
        <div className="flex border border-gray-300 rounded-lg overflow-hidden">
          <button
            onClick={() => setTipoAjuste('percentual')}
            className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium ${tipoAjuste === 'percentual' ? 'bg-orange-500 text-white' : 'bg-white text-gray-600'}`}
          >
            <Percent className="h-3.5 w-3.5" /> %
          </button>
          <button
            onClick={() => setTipoAjuste('valor')}
            className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium border-l border-gray-300 ${tipoAjuste === 'valor' ? 'bg-orange-500 text-white' : 'bg-white text-gray-600'}`}
          >
            <DollarSign className="h-3.5 w-3.5" /> R$
          </button>
        </div>
        <input
          type="number"
          step="0.01"
          value={valorAjuste}
          onChange={(e) => setValorAjuste(e.target.value)}
          placeholder={tipoAjuste === 'percentual' ? 'Ex: 10 (aumenta 10%) ou -10' : 'Ex: 2 (aumenta R$2) ou -2'}
          className="w-56 px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
        />
        <button
          onClick={handleAplicarAjuste}
          disabled={selecionados.size === 0 || !valorAjuste}
          className="text-xs font-semibold bg-gray-800 hover:bg-gray-900 text-white px-3 py-1.5 rounded-lg disabled:opacity-40"
        >
          Aplicar aos selecionados
        </button>
      </div>

      {loading ? (
        <p className="text-center text-gray-500 py-8">Carregando...</p>
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-gray-500 bg-gray-50">
                <th className="py-3 px-4 w-8">
                  <input
                    type="checkbox"
                    checked={todosSelecionados}
                    onChange={(e) => {
                      setSelecionados((prev) => {
                        const next = new Set(prev);
                        filtrados.forEach((p) => (e.target.checked ? next.add(p.id) : next.delete(p.id)));
                        return next;
                      });
                    }}
                  />
                </th>
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
                  <td className="py-2.5 px-4">
                    <input type="checkbox" checked={selecionados.has(produto.id)} onChange={() => toggleSelecionado(produto.id)} />
                  </td>
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
