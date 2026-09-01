import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2, Table2, ShoppingBag, PackageCheck, Search, Plus, LayoutGrid } from 'lucide-react';
import { fetchPedidos, finalizarVendaPdv, updatePedidoStatus, addItensPedido } from '../../lib/pedidos';
import { Pedido, FormaPagamento, TipoPedido, FORMA_PAGAMENTO_LABELS } from '../../types/Pedido';
import { Produto, Categoria } from '../../types/Produto';
import { fetchProdutos } from '../../lib/produtos';
import { fetchCategorias } from '../../lib/categorias';
import BottomSheet from '../BottomSheet';
import PdvOpcoesModal from './PdvOpcoesModal';

interface PdvPedidosAbertoTabProps {
  empresaId: string;
}

const TIPO_ICON: Record<TipoPedido, React.ElementType> = { BALCAO: ShoppingBag, MESA: Table2, RETIRADA: PackageCheck, DELIVERY: ShoppingBag };
const TIPO_LABEL: Record<string, string> = { BALCAO: 'Balcão', MESA: 'Mesa', RETIRADA: 'Retirada' };
const FORMAS_PAGAMENTO: FormaPagamento[] = ['PIX', 'DINHEIRO', 'CARTAO'];

const PdvPedidosAbertoTab: React.FC<PdvPedidosAbertoTabProps> = ({ empresaId }) => {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [pedidoFinalizando, setPedidoFinalizando] = useState<string | null>(null);
  const [formaEscolhida, setFormaEscolhida] = useState<FormaPagamento>('PIX');
  const [processando, setProcessando] = useState<string | null>(null);

  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [pedidoAdicionando, setPedidoAdicionando] = useState<Pedido | null>(null);
  const [buscaAdicionar, setBuscaAdicionar] = useState('');
  const [categoriaAdicionar, setCategoriaAdicionar] = useState('todas');
  const [produtoParaOpcoes, setProdutoParaOpcoes] = useState<Produto | null>(null);
  const [salvandoItem, setSalvandoItem] = useState(false);

  const load = useCallback(async () => {
    try {
      const [balcao, mesa, retirada] = await Promise.all([
        fetchPedidos(empresaId, { tipoPedido: 'BALCAO' }),
        fetchPedidos(empresaId, { tipoPedido: 'MESA' }),
        fetchPedidos(empresaId, { tipoPedido: 'RETIRADA' }),
      ]);
      const abertos = [...balcao, ...mesa, ...retirada]
        .filter((p) => p.status === 'RECEBIDO' || p.status === 'PREPARANDO')
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setPedidos(abertos);
    } catch {
      setPedidos([]);
    } finally {
      setLoading(false);
    }
  }, [empresaId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    fetchProdutos(empresaId, true).then(setProdutos).catch(() => setProdutos([]));
    fetchCategorias(empresaId).then(setCategorias).catch(() => setCategorias([]));
  }, [empresaId]);

  const produtosFiltrados = useMemo(() => {
    const termo = buscaAdicionar.trim().toLowerCase();
    return produtos.filter((p) => {
      if (categoriaAdicionar !== 'todas' && p.categoriaId !== categoriaAdicionar) return false;
      if (termo && !p.nome.toLowerCase().includes(termo) && !(p.codigo || '').toLowerCase().includes(termo)) return false;
      return true;
    });
  }, [produtos, categoriaAdicionar, buscaAdicionar]);

  const handleFinalizar = async (pedido: Pedido) => {
    setProcessando(pedido.id);
    try {
      await finalizarVendaPdv(empresaId, pedido.id, [{ formaPagamento: formaEscolhida, valor: pedido.total }]);
      setPedidoFinalizando(null);
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Não foi possível finalizar a venda.');
    } finally {
      setProcessando(null);
    }
  };

  const handleCancelar = async (pedido: Pedido) => {
    if (!window.confirm('Cancelar este pedido?')) return;
    setProcessando(pedido.id);
    try {
      await updatePedidoStatus(empresaId, pedido.id, 'CANCELADO');
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Não foi possível cancelar.');
    } finally {
      setProcessando(null);
    }
  };

  const handleAdicionarItem = async (produto: Produto, opcoesIds: string[], quantidade: number) => {
    if (!pedidoAdicionando) return;
    setSalvandoItem(true);
    try {
      const atualizado = await addItensPedido(empresaId, pedidoAdicionando.id, [{ produtoId: produto.id, quantidade, opcoes: opcoesIds }]);
      setPedidoAdicionando(atualizado);
      setPedidos((prev) => prev.map((p) => (p.id === atualizado.id ? atualizado : p)));
      setProdutoParaOpcoes(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Não foi possível adicionar o item.');
    } finally {
      setSalvandoItem(false);
    }
  };

  const handleClicarProdutoAdicionar = (produto: Produto) => {
    if ((produto.gruposOpcao || []).length > 0) setProdutoParaOpcoes(produto);
    else handleAdicionarItem(produto, [], 1);
  };

  if (loading) return <p className="text-center text-gray-500 py-8">Carregando...</p>;

  return (
    <div className="space-y-2.5">
      {pedidos.map((p) => {
        const Icon = TIPO_ICON[p.tipoPedido];
        return (
          <div key={p.id} className="border border-gray-200 rounded-xl p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Icon className="h-4 w-4 text-orange-500 shrink-0" />
                <div>
                  <p className="font-bold text-gray-800">#{p.numero} · {TIPO_LABEL[p.tipoPedido] || p.tipoPedido}{p.mesaIdentificador ? ` — ${p.mesaIdentificador}` : ''}</p>
                  <p className="text-xs text-gray-500">{p.clienteNome || 'Sem cliente'} · {p.itens.length} ite{p.itens.length !== 1 ? 'ns' : 'm'} · {new Date(p.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-orange-600">R$ {p.total.toFixed(2)}</span>
                {p.tipoPedido === 'MESA' && (
                  <button onClick={() => setPedidoAdicionando(p)} className="text-xs font-medium border border-gray-300 hover:bg-gray-50 text-gray-700 px-3 py-1.5 rounded-lg">Adicionar itens</button>
                )}
                <button onClick={() => handleCancelar(p)} disabled={!!processando} className="text-xs text-red-500 hover:underline disabled:opacity-50">Cancelar</button>
                <button onClick={() => setPedidoFinalizando(pedidoFinalizando === p.id ? null : p.id)} className="text-xs font-medium bg-gray-800 hover:bg-gray-900 text-white px-3 py-1.5 rounded-lg">
                  {p.tipoPedido === 'MESA' ? 'Fechar conta' : 'Finalizar'}
                </button>
              </div>
            </div>
            {pedidoFinalizando === p.id && (
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                <select value={formaEscolhida} onChange={(e) => setFormaEscolhida(e.target.value as FormaPagamento)} className="px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm bg-white">
                  {FORMAS_PAGAMENTO.map((f) => <option key={f} value={f}>{FORMA_PAGAMENTO_LABELS[f]}</option>)}
                </select>
                <button onClick={() => handleFinalizar(p)} disabled={processando === p.id} className="flex items-center gap-1 bg-orange-500 hover:bg-orange-600 text-white text-sm px-3 py-1.5 rounded-lg disabled:opacity-60">
                  {processando === p.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null} Confirmar recebimento
                </button>
              </div>
            )}
          </div>
        );
      })}
      {pedidos.length === 0 && <p className="text-center text-gray-500 py-10">Nenhum pedido em aberto no PDV.</p>}

      <BottomSheet isOpen={!!pedidoAdicionando} onClose={() => setPedidoAdicionando(null)} title={pedidoAdicionando ? `Adicionar itens · Mesa ${pedidoAdicionando.mesaIdentificador || ''}` : 'Adicionar itens'}>
        <div className="p-6">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input autoFocus value={buscaAdicionar} onChange={(e) => setBuscaAdicionar(e.target.value)} placeholder="Buscar produto..." className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div className="flex flex-wrap gap-1.5 mb-4">
            <button onClick={() => setCategoriaAdicionar('todas')} className={`px-3 py-1.5 rounded-full text-xs font-medium ${categoriaAdicionar === 'todas' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Todos</button>
            {categorias.map((c) => (
              <button key={c.id} onClick={() => setCategoriaAdicionar(c.id)} className={`px-3 py-1.5 rounded-full text-xs font-medium ${categoriaAdicionar === c.id ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{c.nome}</button>
            ))}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[50vh] overflow-y-auto">
            {produtosFiltrados.map((p) => (
              <button key={p.id} onClick={() => handleClicarProdutoAdicionar(p)} disabled={salvandoItem} className="text-left border border-gray-200 rounded-xl p-2.5 hover:border-orange-300 hover:shadow-sm transition-all relative disabled:opacity-50">
                {p.fotoUrl ? (
                  <img src={p.fotoUrl} alt={p.nome} className="w-full h-16 object-cover rounded-lg mb-1.5" />
                ) : (
                  <div className="w-full h-16 bg-gray-100 rounded-lg mb-1.5 flex items-center justify-center"><LayoutGrid className="h-5 w-5 text-gray-300" /></div>
                )}
                <p className="font-medium text-gray-800 text-xs truncate">{p.nome}</p>
                <p className="font-bold text-orange-600 text-sm">R$ {(p.precoPromocional ?? p.preco).toFixed(2)}</p>
                <span className="absolute bottom-2 right-2 h-6 w-6 rounded-full bg-orange-500 text-white flex items-center justify-center"><Plus className="h-3.5 w-3.5" /></span>
              </button>
            ))}
            {produtosFiltrados.length === 0 && <p className="col-span-full text-center text-gray-400 text-sm py-10">Nenhum produto encontrado</p>}
          </div>
        </div>
      </BottomSheet>

      <PdvOpcoesModal
        produto={produtoParaOpcoes}
        onClose={() => setProdutoParaOpcoes(null)}
        onConfirmar={(opcoesIds, quantidade) => {
          if (produtoParaOpcoes) handleAdicionarItem(produtoParaOpcoes, opcoesIds, quantidade);
        }}
      />
    </div>
  );
};

export default PdvPedidosAbertoTab;
