import React, { useCallback, useEffect, useState } from 'react';
import { ShoppingBag, Truck, TrendingUp, Star, Percent, Trophy, Clock3, XCircle, Download, MapPin, CalendarDays, Users, Ticket } from 'lucide-react';
import SimpleBarChart from '../SimpleBarChart';
import StackedBar from '../StackedBar';
import { fetchCrmResumo, baixarCrmCsv } from '../../lib/crm';
import { CrmSummary } from '../../types/Crm';
import IndicacaoEmpresaCard from './IndicacaoEmpresaCard';
import { FORMA_PAGAMENTO_LABELS, FormaPagamento, StatusPedido, STATUS_PEDIDO_LABELS } from '../../types/Pedido';

interface CrmTabProps {
  empresaId: string;
}

type Periodo = 'hoje' | 'semana' | 'quinzena' | 'mes' | 'personalizado';

const todayISO = () => new Date().toISOString().slice(0, 10);
const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const CrmTab: React.FC<CrmTabProps> = ({ empresaId }) => {
  const [periodo, setPeriodo] = useState<Periodo>('semana');
  const [customStart, setCustomStart] = useState(todayISO());
  const [customEnd, setCustomEnd] = useState(todayISO());
  const [data, setData] = useState<CrmSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [exportando, setExportando] = useState(false);

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

  const handleExportarCsv = async () => {
    const { de, ate } = getRange();
    setExportando(true);
    try {
      await baixarCrmCsv(empresaId, de, ate);
    } catch {
      alert('Não foi possível exportar o CSV. Tente novamente.');
    } finally {
      setExportando(false);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
      <div className="flex flex-wrap items-center gap-2">
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
        <button
          onClick={handleExportarCsv}
          disabled={exportando || !data}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium bg-gray-800 hover:bg-gray-900 text-white disabled:opacity-60 transition-colors"
        >
          <Download className="h-3.5 w-3.5" /> {exportando ? 'Exportando...' : 'Exportar CSV'}
        </button>
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

          <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <XCircle className="h-4 w-4 text-orange-600" /> Pedidos por Status
            </h3>
            <div className="flex flex-wrap gap-3">
              {data.porStatus.map((s) => (
                <div
                  key={s.status}
                  className={`px-4 py-2.5 rounded-xl border ${
                    s.status === 'CANCELADO' ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-100'
                  }`}
                >
                  <p className={`text-xs mb-0.5 ${s.status === 'CANCELADO' ? 'text-red-600' : 'text-gray-500'}`}>
                    {STATUS_PEDIDO_LABELS[s.status as StatusPedido] || s.status}
                  </p>
                  <p className={`text-lg font-bold ${s.status === 'CANCELADO' ? 'text-red-700' : 'text-gray-800'}`}>
                    {s.quantidade}
                  </p>
                </div>
              ))}
              {data.porStatus.length === 0 && <p className="text-gray-400 text-sm">Nenhum pedido neste período</p>}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Users className="h-4 w-4 text-orange-600" /> Novos vs Recorrentes
            </h3>
            <div className="flex flex-wrap gap-3">
              <div className="bg-blue-50 border border-blue-100 rounded-xl px-5 py-3">
                <p className="text-xs text-blue-700 mb-0.5">Clientes novos</p>
                <p className="text-xl font-bold text-blue-800">{data.novosVsRecorrentes.novos}</p>
              </div>
              <div className="bg-gray-50 border border-gray-100 rounded-xl px-5 py-3">
                <p className="text-xs text-gray-600 mb-0.5">Clientes recorrentes</p>
                <p className="text-xl font-bold text-gray-800">{data.novosVsRecorrentes.recorrentes}</p>
              </div>
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

          <IndicacaoEmpresaCard empresaId={empresaId} />

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

          <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Trophy className="h-4 w-4 text-orange-600" /> Produtos Mais Vendidos
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-gray-500">
                    <th className="py-2 px-3">#</th>
                    <th className="py-2 px-3">Produto</th>
                    <th className="py-2 px-3">Unidades</th>
                    <th className="py-2 px-3">Receita</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topProdutos.map((p, i) => (
                    <tr key={p.produtoId} className="border-b border-gray-100">
                      <td className="py-2 px-3 text-gray-400">{i + 1}º</td>
                      <td className="py-2 px-3 font-medium">{p.nome}</td>
                      <td className="py-2 px-3">{p.quantidade}</td>
                      <td className="py-2 px-3 font-bold text-orange-600">R$ {p.receita.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {data.topProdutos.length === 0 && (
                <p className="text-center text-gray-400 text-sm py-6">Nenhuma venda entregue neste período</p>
              )}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Clock3 className="h-4 w-4 text-orange-600" /> Horários de Pico
            </h3>
            <SimpleBarChart
              data={data.porHora.map((h) => ({ label: `${h.hora}h`, value: h.pedidos }))}
              formatValue={(v) => `${v} pedido${v === 1 ? '' : 's'}`}
            />
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-orange-600" /> Pedidos por Dia da Semana
            </h3>
            <SimpleBarChart
              data={data.porDiaSemana.map((d) => ({ label: DIAS_SEMANA[d.dia], value: d.pedidos }))}
              formatValue={(v) => `${v} pedido${v === 1 ? '' : 's'}`}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-orange-600" /> Top Bairros
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-left text-gray-500">
                      <th className="py-2 px-3">Bairro</th>
                      <th className="py-2 px-3">Pedidos</th>
                      <th className="py-2 px-3">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.porBairro.map((b) => (
                      <tr key={b.bairro} className="border-b border-gray-100">
                        <td className="py-2 px-3 font-medium">{b.bairro}</td>
                        <td className="py-2 px-3">{b.pedidos}</td>
                        <td className="py-2 px-3 font-bold text-orange-600">R$ {b.total.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {data.porBairro.length === 0 && (
                  <p className="text-center text-gray-400 text-sm py-6">Nenhuma venda entregue neste período</p>
                )}
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Ticket className="h-4 w-4 text-orange-600" /> Cupons Usados
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-left text-gray-500">
                      <th className="py-2 px-3">Código</th>
                      <th className="py-2 px-3">Usos</th>
                      <th className="py-2 px-3">Desconto total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.cuponsUsados.map((c) => (
                      <tr key={c.codigo} className="border-b border-gray-100">
                        <td className="py-2 px-3 font-mono font-medium">{c.codigo}</td>
                        <td className="py-2 px-3">{c.usos}</td>
                        <td className="py-2 px-3 font-bold text-orange-600">R$ {c.descontoTotal.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {data.cuponsUsados.length === 0 && (
                  <p className="text-center text-gray-400 text-sm py-6">Nenhum cupom usado neste período</p>
                )}
              </div>
            </div>
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
