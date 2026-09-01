import React, { useCallback, useEffect, useState } from 'react';
import { Loader2, Table2, ShoppingBag, PackageCheck } from 'lucide-react';
import { fetchPedidos, finalizarVendaPdv, updatePedidoStatus } from '../../lib/pedidos';
import { Pedido, FormaPagamento, TipoPedido } from '../../types/Pedido';

interface PdvPedidosAbertoTabProps {
  empresaId: string;
}

const TIPO_ICON: Record<TipoPedido, React.ElementType> = { BALCAO: ShoppingBag, MESA: Table2, RETIRADA: PackageCheck, DELIVERY: ShoppingBag };
const TIPO_LABEL: Record<string, string> = { BALCAO: 'Balcão', MESA: 'Mesa', RETIRADA: 'Retirada' };

const PdvPedidosAbertoTab: React.FC<PdvPedidosAbertoTabProps> = ({ empresaId }) => {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [pedidoFinalizando, setPedidoFinalizando] = useState<string | null>(null);
  const [formaEscolhida, setFormaEscolhida] = useState<FormaPagamento>('PIX');
  const [processando, setProcessando] = useState<string | null>(null);

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
                <button onClick={() => handleCancelar(p)} disabled={!!processando} className="text-xs text-red-500 hover:underline disabled:opacity-50">Cancelar</button>
                <button onClick={() => setPedidoFinalizando(pedidoFinalizando === p.id ? null : p.id)} className="text-xs font-medium bg-gray-800 hover:bg-gray-900 text-white px-3 py-1.5 rounded-lg">Finalizar</button>
              </div>
            </div>
            {pedidoFinalizando === p.id && (
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                <select value={formaEscolhida} onChange={(e) => setFormaEscolhida(e.target.value as FormaPagamento)} className="px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm bg-white">
                  <option value="PIX">PIX</option>
                  <option value="DINHEIRO">Dinheiro</option>
                  <option value="CARTAO">Cartão</option>
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
    </div>
  );
};

export default PdvPedidosAbertoTab;
