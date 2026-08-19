import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, LogIn, Package, Star, Clock, Layers, RotateCcw } from 'lucide-react';
import OrderTimeline from '../components/OrderTimeline';
import AvaliacaoPopup from '../components/AvaliacaoPopup';
import { useCustomer } from '../context/CustomerContext';
import { useTenant } from '../context/TenantContext';
import { useCart } from '../context/CartContext';
import { fetchMeusPedidos } from '../lib/clientes';
import { Pedido, STATUS_PEDIDO_LABELS, FORMA_PAGAMENTO_LABELS, StatusPedido } from '../types/Pedido';

const STATUS_COLORS: Record<StatusPedido, string> = {
  RECEBIDO: 'bg-gray-100 text-gray-800',
  PREPARANDO: 'bg-yellow-100 text-yellow-800',
  SAIU_ENTREGA: 'bg-blue-100 text-blue-800',
  ENTREGUE: 'bg-green-100 text-green-800',
  CANCELADO: 'bg-red-100 text-red-800',
};

/** Falta pelo menos uma avaliação (do pedido ou do motoboy) a ser feita. */
const faltaAvaliar = (order: Pedido) =>
  order.status === 'ENTREGUE' && (!order.notaPedido || (!!order.motoboyId && !order.notaMotoboy));

const OrdersPage: React.FC = () => {
  const { customer, isLoading, openCustomerAuth } = useCustomer();
  const { slug, empresa } = useTenant();
  const navigate = useNavigate();
  const { addItem, openCart } = useCart();
  const [orders, setOrders] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(false);
  const [avaliandoPedido, setAvaliandoPedido] = useState<Pedido | null>(null);

  /** Recoloca os itens do pedido no carrinho a partir do snapshot salvo — a validação de disponibilidade
   * atual (produto/opção ainda existem e ativos) acontece no checkout, igual num pedido novo qualquer. */
  const handleReorder = (order: Pedido) => {
    const itensValidos = order.itens.filter((item) => item.produtoId);
    for (const item of itensValidos) {
      addItem({
        productId: item.produtoId as string,
        name: item.nomeProduto,
        unitPrice: item.precoUnitario,
        quantity: item.quantidade,
        notes: item.observacoes || undefined,
        options: item.opcoesSelecionadas.map((opt) => ({
          optionId: opt.opcaoId || '',
          groupName: opt.nomeGrupo,
          optionName: opt.nomeOpcao,
          additionalPrice: opt.precoAdicional,
        })),
      });
    }
    navigate(`/${slug}`);
    openCart();
  };

  useEffect(() => {
    if (!customer) return;
    setLoading(true);
    fetchMeusPedidos(empresa.id, customer.id)
      .then(setOrders)
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [customer, empresa.id]);

  const handleAvaliacaoAtualizada = (atualizado: Pedido) => {
    setOrders((prev) => prev.map((o) => (o.id === atualizado.id ? atualizado : o)));
    setAvaliandoPedido(atualizado);
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl min-h-[70vh]">
      <div className="flex items-center gap-3 mb-6">
        <Link
          to={`/${slug}`}
          className="text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-full p-2 transition-colors shrink-0"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <Package className="h-5 w-5 text-orange-600" /> Meus Pedidos
        </h1>
      </div>

      {!isLoading && !customer && (
        <div className="text-center bg-white border border-gray-100 rounded-2xl p-8">
          <p className="text-gray-600 mb-4">Entre na sua conta para ver o histórico dos seus pedidos.</p>
          <button
            onClick={openCustomerAuth}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 text-white px-5 py-3 rounded-xl font-bold hover:from-orange-600 hover:to-red-600 transition-all"
          >
            <LogIn className="h-4 w-4" /> Entrar / Criar conta
          </button>
        </div>
      )}

      {customer && (
        <div className="space-y-3">
          {loading && <p className="text-sm text-gray-500">Carregando...</p>}

          {orders.map((order) => (
            <div key={order.id} className="border border-gray-100 bg-white shadow-sm rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <span className="font-mono font-bold text-orange-600">#{String(order.numero).padStart(4, '0')}</span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    {new Date(order.createdAt).toLocaleString('pt-BR')}
                  </span>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[11px] font-medium ${STATUS_COLORS[order.status]}`}>
                  {STATUS_PEDIDO_LABELS[order.status]}
                </span>
              </div>

              <div className="my-3">
                <OrderTimeline order={order} />
              </div>

              <div className="text-sm text-gray-600 space-y-0.5 mb-2">
                {order.itens.map((item) => (
                  <div key={item.id}>
                    <p className="flex items-center gap-1.5">
                      {item.quantidade}x {item.nomeProduto}
                      {item.ehCombo && (
                        <span className="flex items-center gap-1 text-[10px] font-medium bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full">
                          <Layers className="h-2.5 w-2.5" /> Combo
                        </span>
                      )}
                    </p>
                    {item.opcoesSelecionadas.length > 0 && (
                      <ul className="text-xs text-gray-500 pl-3">
                        {item.opcoesSelecionadas.map((opt) => (
                          <li key={opt.id}>
                            + {opt.nomeOpcao}
                            {opt.precoAdicional > 0 && ` (+R$ ${opt.precoAdicional.toFixed(2)})`}
                          </li>
                        ))}
                      </ul>
                    )}
                    {item.observacoes && <p className="text-xs text-orange-600 italic">Obs: {item.observacoes}</p>}
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <span className="text-xs text-gray-500">
                  {FORMA_PAGAMENTO_LABELS[order.formaPagamento]}
                  {order.itemGratisResgatado ? ' · 🎁 item grátis usado' : ''}
                </span>
                <span className="font-bold text-orange-600">R$ {order.total.toFixed(2)}</span>
              </div>

              <div className="mt-3 flex gap-2">
                {order.status !== 'CANCELADO' && order.itens.some((i) => i.produtoId) && (
                  <button
                    onClick={() => handleReorder(order)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-medium bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    <RotateCcw className="h-3.5 w-3.5" /> Pedir de novo
                  </button>
                )}
                {order.status === 'ENTREGUE' && (
                  <button
                    onClick={() => setAvaliandoPedido(order)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-medium transition-colors ${
                      faltaAvaliar(order)
                        ? 'bg-orange-50 text-orange-700 hover:bg-orange-100'
                        : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    <Star className="h-3.5 w-3.5" />
                    {faltaAvaliar(order) ? 'Avaliar pedido' : 'Ver avaliação'}
                  </button>
                )}
              </div>
            </div>
          ))}

          {!loading && orders.length === 0 && (
            <p className="text-center text-gray-400 py-12 text-sm">Você ainda não fez nenhum pedido.</p>
          )}
        </div>
      )}

      {avaliandoPedido && (
        <AvaliacaoPopup
          isOpen={!!avaliandoPedido}
          pedido={avaliandoPedido}
          onClose={() => setAvaliandoPedido(null)}
          onUpdated={handleAvaliacaoAtualizada}
        />
      )}
    </div>
  );
};

export default OrdersPage;
