import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTenant } from '../context/TenantContext';
import { fetchPedidoById } from '../lib/pedidos';
import { Pedido, FORMA_PAGAMENTO_LABELS } from '../types/Pedido';

const formatarData = (iso: string) => new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

const ComandaImpressaoPage: React.FC = () => {
  const { empresa } = useTenant();
  const { pedidoId } = useParams<{ pedidoId: string }>();
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (!pedidoId) return;
    fetchPedidoById(empresa.id, pedidoId)
      .then(setPedido)
      .catch((err) => setErro(err instanceof Error ? err.message : 'Erro ao carregar pedido'));
  }, [empresa.id, pedidoId]);

  useEffect(() => {
    if (pedido) {
      const timer = setTimeout(() => window.print(), 300);
      return () => clearTimeout(timer);
    }
  }, [pedido]);

  if (erro) return <p className="p-4 text-red-600 text-sm">{erro}</p>;
  if (!pedido) return <p className="p-4 text-gray-500 text-sm">Carregando comanda...</p>;

  return (
    <>
      <style>{`
        @page { size: 80mm auto; margin: 2mm; }
        @media print {
          body { margin: 0; }
          .no-print { display: none !important; }
        }
      `}</style>
      <div className="max-w-[80mm] mx-auto p-3 font-mono text-[12px] leading-tight text-black bg-white">
        <button
          onClick={() => window.print()}
          className="no-print w-full mb-3 bg-gray-800 text-white text-sm py-2 rounded-lg"
        >
          Imprimir
        </button>

        <div className="text-center border-b border-dashed border-black pb-2 mb-2">
          <p className="font-bold text-sm uppercase">{empresa.nome}</p>
          <p>COMANDA · Pedido #{String(pedido.numero).padStart(4, '0')}</p>
          <p>{formatarData(pedido.createdAt)}</p>
        </div>

        <div className="border-b border-dashed border-black pb-2 mb-2">
          <p className="font-bold">{pedido.clienteNome}</p>
          <p>{pedido.clienteTelefone}</p>
          <p>{pedido.endereco}{pedido.bairro ? ` - ${pedido.bairro}` : ''}</p>
          {pedido.referencia && <p>Ref: {pedido.referencia}</p>}
        </div>

        <div className="border-b border-dashed border-black pb-2 mb-2">
          {pedido.itens.map((item) => (
            <div key={item.id} className="mb-1">
              <div className="flex justify-between">
                <span>{item.quantidade}x {item.nomeProduto}{item.ehCombo ? ' (COMBO)' : ''}</span>
                <span>R$ {(item.precoUnitario * item.quantidade).toFixed(2)}</span>
              </div>
              {item.opcoesSelecionadas.length > 0 && (
                <p className="pl-2">
                  {item.opcoesSelecionadas.map((opt) => `+ ${opt.nomeOpcao}`).join(', ')}
                </p>
              )}
              {item.observacoes && <p className="pl-2">Obs: {item.observacoes}</p>}
            </div>
          ))}
          {pedido.observacoes && <p className="mt-1">Pedido: {pedido.observacoes}</p>}
        </div>

        <div className="border-b border-dashed border-black pb-2 mb-2">
          <div className="flex justify-between"><span>Subtotal</span><span>R$ {pedido.subtotal.toFixed(2)}</span></div>
          {pedido.descontoCupom != null && pedido.descontoCupom > 0 && (
            <div className="flex justify-between"><span>Cupom {pedido.cupomCodigo}</span><span>-R$ {pedido.descontoCupom.toFixed(2)}</span></div>
          )}
          <div className="flex justify-between"><span>Entrega</span><span>R$ {pedido.taxaEntrega.toFixed(2)}</span></div>
          <div className="flex justify-between font-bold text-sm"><span>TOTAL</span><span>R$ {pedido.total.toFixed(2)}</span></div>
        </div>

        <div>
          <p>Pagamento: {FORMA_PAGAMENTO_LABELS[pedido.formaPagamento]}</p>
          {pedido.trocoPara != null && <p>Troco para: R$ {pedido.trocoPara.toFixed(2)}</p>}
          {pedido.motoboy && <p>Motoboy: {pedido.motoboy.nome}</p>}
        </div>
      </div>
    </>
  );
};

export default ComandaImpressaoPage;
