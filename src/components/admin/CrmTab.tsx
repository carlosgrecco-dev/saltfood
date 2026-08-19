import React, { useCallback, useEffect, useState } from 'react';
import { ShoppingBag, Truck, TrendingUp, Star, Percent } from 'lucide-react';
import SimpleBarChart from '../SimpleBarChart';
import StackedBar from '../StackedBar';
import { fetchCrmResumo } from '../../lib/crm';
import { CrmSummary } from '../../types/Crm';
import { FORMA_PAGAMENTO_LABELS, FormaPagamento } from '../../types/Pedido';

interface CrmTabProps {
  empresaId: string;
}

type Periodo = 'hoje' | 'semana' | 'quinzena' | 'mes' | 'personalizado';

const todayISO = () => new Date().toISOString().slice(0, 10);

const CrmTab: React.FC<CrmTabProps> = ({ empresaId }) => {
  const [periodo, setPeriodo] = useState<Periodo>('semana');
  const [customStart, setCustomStart] = useState(todayISO());
  const [customEnd, setCustomEnd] = useState(todayISO());
  const [data, setData] = useState<CrmSummary | null>(null);
  const [loading, setLoading] = useState(false);

  const getRange = useCallback((): { de: string; ate: string } => {
    const end = new Date();
    const start = new Date();
    switch (periodo) {
      case 'hoje':
        break;
      case 'semana':
        start.setDate(start.getDate() - 6);
        break;
      case 'quinzena':
        start.setDate(start.getDate() - 14);
        break;
      case 'mes':
        start.setDate(start.getDate() - 29);
        break;
      case 'personalizado':
        return { de: customStart, ate: customEnd };
    }
    return { de: start.toISOString().slice(0, 10), ate: end.toISOString().slice(0, 10) };
  }, [periodo, customStart, customEnd]);

  useEffect(() => {
    const { de, ate } = getRange();
    setLoading(true);
    fetchCrmResumo(empresaId, de, ate)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [empresaId, getRange]);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-6">
        {([
          { id: 'hoje', label: 'Hoje' },
          { id: 'semana', label: '7 dias' },
          { id: 'quinzena', label: 'Quinzena (15 dias)' },
          { id: 'mes', label: 'Mês (30 dias)' },
          { id: 'personalizado', label: 'Personalizado' },
        ] as { id: Periodo; label: string }[]).map((p) => (
          <button
            key={p.id}
            onClick={() => setPeriodo(p.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              periodo === p.id ? 'bg-orange-600 text-white shadow' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {periodo === 'personalizado' && (
        <div className="flex flex-wrap items-center gap-3 mb-6 bg-gray-50 p-4 rounded-xl">
          <div>
            <label className="block text-xs text-gray-500 mb-1">De</label>
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Até</label>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        </div>
      )}

      {loading && <p className="text-gray-500 mb-4">Carregando...</p>}

      {!loading && data && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-5 rounded-2xl">
              <p className="text-orange-100 text-xs mb-1">Total Vendido</p>
              <p className="text-2xl font-bold">R$ {data.totalRevenue.toFixed(2)}</p>
            </div>
            <div className="bg-white border border-gray-200 p-5 rounded-2xl">
              <p className="text-gray-500 text-xs mb-1 flex items-center gap-1">
                <ShoppingBag className="h-3.5 w-3.5" /> Unidades Vendidas
              </p>
              <p className="text-2xl font-bold text-gray-800">{data.totalUnits}</p>
            </div>
            <div className="bg-white border border-gray-200 p-5 rounded-2xl">
              <p className="text-gray-500 text-xs mb-1 flex items-center gap-1">
                <Truck className="h-3.5 w-3.5" /> Entregas
              </p>
              <p className="text-2xl font-bold text-gray-800">{data.totalOrders}</p>
            </div>
            <div className="bg-white border border-gray-200 p-5 rounded-2xl">
              <p className="text-gray-500 text-xs mb-1 flex items-center gap-1">
                <TrendingUp className="h-3.5 w-3.5" /> Ticket Médio
              </p>
              <p className="text-2xl font-bold text-gray-800">R$ {data.ticketMedio.toFixed(2)}</p>
            </div>
            <div className="bg-white border border-gray-200 p-5 rounded-2xl">
              <p className="text-gray-500 text-xs mb-1 flex items-center gap-1">
                <Star className="h-3.5 w-3.5" /> Avaliação Média
              </p>
              <p className="text-2xl font-bold text-gray-800">
                {data.ratingCount > 0 ? data.avgRating.toFixed(1) : '—'}
                <span className="text-xs text-gray-400 font-normal ml-1">
                  {data.ratingCount > 0 && `(${data.ratingCount})`}
                </span>
              </p>
            </div>
          </div>

          {data.mostrarComissao && (
            <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6">
              <h3 className="font-bold text-gray-800 mb-1 flex items-center gap-2">
                <Percent className="h-4 w-4 text-orange-600" /> Comissão da plataforma
              </h3>
              <p className="text-xs text-gray-500 mb-4">
                Percentual definido pela plataforma sobre as vendas entregues no período selecionado.
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <div className="bg-gray-100 rounded-xl px-5 py-3">
                  <p className="text-xs text-gray-500 mb-0.5">Percentual contratado</p>
                  <p className="text-xl font-bold text-gray-800">{data.comissaoPercent.toFixed(1)}%</p>
                </div>
                <div className="bg-orange-50 border border-orange-200 rounded-xl px-5 py-3">
                  <p className="text-xs text-orange-700 mb-0.5">Comissão do período selecionado</p>
                  <p className="text-xl font-bold text-orange-700">R$ {data.comissaoValor.toFixed(2)}</p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6">
            <h3 className="font-bold text-gray-800 mb-4">Vendas por Forma de Pagamento</h3>
            <StackedBar
              segments={data.byPayment.map((p, i) => ({
                label: FORMA_PAGAMENTO_LABELS[p.formaPagamento as FormaPagamento] || p.formaPagamento,
                value: p.total,
                colorClass: ['bg-green-500', 'bg-blue-500', 'bg-purple-500', 'bg-yellow-500'][i % 4],
              }))}
            />
            {data.byPayment.length === 0 && (
              <p className="text-center text-gray-400 text-sm py-6">Nenhuma venda entregue neste período</p>
            )}
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6">
            <h3 className="font-bold text-gray-800 mb-4">Vendas por Dia</h3>
            <SimpleBarChart
              data={data.daily.map((d) => ({
                label: new Date(`${d.date}T00:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
                value: d.total,
              }))}
              formatValue={(v) => `R$ ${v.toFixed(2)}`}
            />
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <h3 className="font-bold text-gray-800 mb-4">Valores a Pagar por Motoboy (no período)</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-gray-500">
                    <th className="py-2 px-3">Motoboy</th>
                    <th className="py-2 px-3">Corridas concluídas</th>
                    <th className="py-2 px-3">Canceladas</th>
                    <th className="py-2 px-3">Total a pagar</th>
                  </tr>
                </thead>
                <tbody>
                  {data.motoboyClosing.map((m) => (
                    <tr key={m.motoboyId} className="border-b border-gray-100">
                      <td className="py-2 px-3 font-medium">{m.motoboyNome}</td>
                      <td className="py-2 px-3">{m.corridasConcluidas}</td>
                      <td className="py-2 px-3">{m.corridasCanceladas}</td>
                      <td className="py-2 px-3 font-bold text-orange-600">R$ {m.totalAPagar.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {data.motoboyClosing.length === 0 && (
                <p className="text-center text-gray-400 text-sm py-6">Nenhuma corrida neste período</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CrmTab;
