import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Search, Minus, Plus, PackageX, PackageCheck, AlertTriangle, Loader2 } from 'lucide-react';
import { Produto } from '../../types/Produto';
import { fetchProdutos, updateProduto } from '../../lib/produtos';

interface EstoqueTabProps {
  empresaId: string;
}

const payloadCompleto = (p: Produto, alteracoes: Partial<Produto>) => ({
  nome: p.nome,
  codigo: p.codigo,
  descricao: p.descricao,
  categoriaId: p.categoriaId,
  preco: p.preco,
  precoPromocional: p.precoPromocional,
  fotoUrl: p.fotoUrl,
  ativo: p.ativo,
  ordem: p.ordem,
  ehCombo: p.ehCombo,
  controlarEstoque: p.controlarEstoque,
  estoqueQtd: p.estoqueQtd,
  estoqueMinimo: p.estoqueMinimo,
  ...alteracoes,
});

const EstoqueTab: React.FC<EstoqueTabProps> = ({ empresaId }) => {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [mostrarTodos, setMostrarTodos] = useState(false);
  const [salvandoId, setSalvandoId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setProdutos(await fetchProdutos(empresaId));
    } catch {
      setProdutos([]);
    } finally {
      setLoading(false);
    }
  }, [empresaId]);

  useEffect(() => {
    load();
  }, [load]);

  const aplicar = async (produto: Produto, alteracoes: Partial<Produto>) => {
    setSalvandoId(produto.id);
    try {
      const atualizado = await updateProduto(empresaId, produto.id, payloadCompleto(produto, alteracoes));
      setProdutos((prev) => prev.map((p) => (p.id === atualizado.id ? atualizado : p)));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Não foi possível atualizar o produto.');
    } finally {
      setSalvandoId(null);
    }
  };

  const ajustarQtd = (produto: Produto, delta: number) => {
    const atual = produto.estoqueQtd ?? 0;
    aplicar(produto, { estoqueQtd: Math.max(0, atual + delta) });
  };

  const listados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return produtos
      .filter((p) => (mostrarTodos ? true : p.controlarEstoque))
      .filter((p) => !termo || p.nome.toLowerCase().includes(termo))
      .sort((a, b) => {
        const baixoA = a.controlarEstoque && a.estoqueMinimo != null && (a.estoqueQtd ?? 0) <= a.estoqueMinimo;
        const baixoB = b.controlarEstoque && b.estoqueMinimo != null && (b.estoqueQtd ?? 0) <= b.estoqueMinimo;
        if (baixoA !== baixoB) return baixoA ? -1 : 1;
        return a.nome.localeCompare(b.nome);
      });
  }, [produtos, busca, mostrarTodos]);

  const monitorados = produtos.filter((p) => p.controlarEstoque);
  const emFalta = monitorados.filter((p) => p.estoqueMinimo != null && (p.estoqueQtd ?? 0) <= p.estoqueMinimo);

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <p className="text-xs text-gray-500 flex items-center gap-1"><PackageCheck className="h-3.5 w-3.5" /> Produtos monitorados</p>
          <p className="text-xl font-bold text-gray-800">{monitorados.length}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <p className="text-xs text-gray-500 flex items-center gap-1"><AlertTriangle className="h-3.5 w-3.5 text-amber-500" /> Estoque baixo</p>
          <p className="text-xl font-bold text-amber-600">{emFalta.length}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar produto..." className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm" />
        </div>
        <label className="flex items-center gap-2 cursor-pointer shrink-0">
          <input type="checkbox" checked={mostrarTodos} onChange={(e) => setMostrarTodos(e.target.checked)} className="text-orange-600 rounded" />
          <span className="text-sm text-gray-600">Mostrar todos os produtos (não só os monitorados)</span>
        </label>
      </div>

      {loading ? (
        <p className="text-center text-gray-500 py-8 text-sm">Carregando...</p>
      ) : (
        <div className="space-y-2">
          {listados.map((p) => {
            const baixo = p.controlarEstoque && p.estoqueMinimo != null && (p.estoqueQtd ?? 0) <= p.estoqueMinimo;
            return (
              <div key={p.id} className={`flex flex-wrap items-center justify-between gap-3 border rounded-xl px-4 py-3 ${baixo ? 'border-amber-300 bg-amber-50/50' : 'border-gray-200'}`}>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-800 text-sm truncate flex items-center gap-1.5">
                    {p.nome}
                    {baixo && <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">Estoque baixo</span>}
                  </p>
                  <p className="text-xs text-gray-400">{p.categoria?.nome || 'Sem categoria'}</p>
                </div>

                {!p.controlarEstoque ? (
                  <button
                    onClick={() => aplicar(p, { controlarEstoque: true, estoqueQtd: 0 })}
                    disabled={salvandoId === p.id}
                    className="flex items-center gap-1.5 text-xs font-medium border border-gray-300 text-gray-600 hover:bg-gray-50 px-3 py-1.5 rounded-lg disabled:opacity-60 shrink-0"
                  >
                    {salvandoId === p.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <PackageCheck className="h-3.5 w-3.5" />} Controlar estoque
                  </button>
                ) : (
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => ajustarQtd(p, -1)} disabled={salvandoId === p.id} className="h-7 w-7 flex items-center justify-center border border-gray-300 rounded text-gray-500 hover:bg-gray-50 disabled:opacity-50"><Minus className="h-3.5 w-3.5" /></button>
                      <input
                        type="number"
                        min={0}
                        value={p.estoqueQtd ?? 0}
                        onChange={(e) => aplicar(p, { estoqueQtd: Math.max(0, Number(e.target.value) || 0) })}
                        className="w-16 text-center px-1 py-1 border border-gray-300 rounded text-sm"
                      />
                      <button onClick={() => ajustarQtd(p, 1)} disabled={salvandoId === p.id} className="h-7 w-7 flex items-center justify-center border border-gray-300 rounded text-gray-500 hover:bg-gray-50 disabled:opacity-50"><Plus className="h-3.5 w-3.5" /></button>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <label className="text-[11px] text-gray-400">mín.</label>
                      <input
                        type="number"
                        min={0}
                        value={p.estoqueMinimo ?? ''}
                        placeholder="—"
                        onChange={(e) => aplicar(p, { estoqueMinimo: e.target.value === '' ? null : Math.max(0, Number(e.target.value) || 0) })}
                        className="w-14 text-center px-1 py-1 border border-gray-300 rounded text-sm"
                      />
                    </div>
                    <button
                      onClick={() => aplicar(p, { controlarEstoque: false })}
                      disabled={salvandoId === p.id}
                      title="Parar de controlar estoque deste produto"
                      className="text-gray-400 hover:text-red-500 disabled:opacity-50"
                    >
                      <PackageX className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
          {listados.length === 0 && (
            <p className="text-center text-gray-500 py-10 text-sm">
              {mostrarTodos ? 'Nenhum produto encontrado.' : 'Nenhum produto com controle de estoque ainda — marque "Mostrar todos" pra ativar em algum.'}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default EstoqueTab;
