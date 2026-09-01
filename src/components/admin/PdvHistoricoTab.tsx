import React, { useCallback, useEffect, useState } from 'react';
import { fetchPedidos } from '../../lib/pedidos';
import { Pedido } from '../../types/Pedido';
import { FORMA_PAGAMENTO_LABELS } from '../../types/Pedido';

interface PdvHistoricoTabProps {
  empresaId: string;
}

const todayISO = () => new Date().toISOString().slice(0, 10);
const TIPO_LABEL: Record<string, string> = { BALCAO: 'Balcão', MESA: 'Mesa', RETIRADA: 'Retirada' };

const PdvHistoricoTab: React.FC<PdvHistoricoTabProps> = ({ empresaId }) => {
  const [data, setData] = useState(todayISO());
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [balcao, mesa, retirada] = await Promise.all([
        fetchPedidos(empresaId, { tipoPedido: 'BALCAO', de: data, ate: data }),
        fetchPedidos(empresaId, { tipoPedido: 'MESA', de: data, ate: data }),
        fetchPedidos(empresaId, { tipoPedido: 'RETIRADA', de: data, ate: data }),
      ]);
      const vendidos = [...balcao, ...mesa, ...retirada]
        .filter((p) => p.status === 'ENTREGUE')
        .sort((a, b) => new Date(b.entregueEm || b.createdAt).getTime() - new Date(a.entregueEm || a.createdAt).getTime());
      setPedidos(vendidos);
    } catch {
      setPedidos([]);
    } finally {
      setLoading(false);
    }
  }, [empresaId, data]);

  useEffect(() => {
    load();
  }, [load]);

  const total = pedidos.reduce((s, p) => s + p.total, 0);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Data</label>
          <input type="date" value={data} onChange={(e) => setData(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
        </div>
        <p className="text-sm text-gray-600">{pedidos.length} venda{pedidos.length !== 1 ? 's' : ''} · <span className="font-bold text-gray-800">R$ {total.toFixed(2)}</span></p>
      </div>

      {loading ? (
        <p className="text-center text-gray-500 py-8">Carregando...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-gray-500 bg-gray-50">
                <th className="py-2.5 px-4">Pedido</th>
                <th className="py-2.5 px-4">Tipo</th>
                <th className="py-2.5 px-4">Cliente</th>
                <th className="py-2.5 px-4">Forma</th>
                <th className="py-2.5 px-4">Total</th>
                <th className="py-2.5 px-4">Hora</th>
              </tr>
            </thead>
            <tbody>
              {pedidos.map((p) => (
                <tr key={p.id} className="border-b border-gray-100">
                  <td className="py-2.5 px-4 font-mono text-xs">#{p.numero}</td>
                  <td className="py-2.5 px-4">{TIPO_LABEL[p.tipoPedido] || p.tipoPedido}{p.mesaIdentificador ? ` — ${p.mesaIdentificador}` : ''}</td>
                  <td className="py-2.5 px-4">{p.clienteNome || '—'}</td>
                  <td className="py-2.5 px-4">{FORMA_PAGAMENTO_LABELS[p.formaPagamento]}</td>
                  <td className="py-2.5 px-4 font-bold text-orange-600">R$ {p.total.toFixed(2)}</td>
                  <td className="py-2.5 px-4 text-xs text-gray-500">{new Date(p.entregueEm || p.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {pedidos.length === 0 && <p className="text-center text-gray-400 text-sm py-10">Nenhuma venda nesta data.</p>}
        </div>
      )}
    </div>
  );
};

export default PdvHistoricoTab;
