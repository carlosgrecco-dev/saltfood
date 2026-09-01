import React, { useCallback, useEffect, useState } from 'react';
import { Receipt, XCircle, Clock, Timer, Repeat } from 'lucide-react';
import { IndicadoresResumo } from '../../types/Indicadores';
import { fetchIndicadores } from '../../lib/crm';
import LineChart from '../LineChart';

interface IndicadoresTabProps {
  empresaId: string;
}

const todayISO = () => new Date().toISOString().slice(0, 10);
const diasAtras = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
};

const media = (valores: (number | null)[]) => {
  const validos = valores.filter((v): v is number => v != null);
  return validos.length > 0 ? validos.reduce((s, v) => s + v, 0) / validos.length : null;
};

const formatLabel = (date: string) => {
  const [, m, d] = date.split('-');
  return `${d}/${m}`;
};

const IndicadoresTab: React.FC<IndicadoresTabProps> = ({ empresaId }) => {
  const [de, setDe] = useState(diasAtras(13));
  const [ate, setAte] = useState(todayISO());
  const [dados, setDados] = useState<IndicadoresResumo | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setDados(await fetchIndicadores(empresaId, de, ate));
    } catch {
      setDados(null);
    } finally {
      setLoading(false);
    }
  }, [empresaId, de, ate]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading || !dados) {
    return <p className="text-center text-gray-500 py-8 text-sm">Carregando...</p>;
  }

  const labels = dados.serie.map((d) => formatLabel(d.date));
  const ticketMedioMedia = media(dados.serie.map((d) => d.ticketMedio));
  const cancelamentosMedia = media(dados.serie.map((d) => d.cancelamentosPercent));
  const tempoEntregaMedia = media(dados.serie.map((d) => d.tempoMedioEntregaMin));
  const noPrazoMedia = media(dados.serie.map((d) => d.entregasNoPrazoPercent));

  const cards = [
    {
      titulo: 'Ticket médio', icon: Receipt, cor: 'text-orange-500', strokeClass: 'stroke-orange-500', colorClass: 'bg-orange-500',
      valor: ticketMedioMedia != null ? `R$ ${ticketMedioMedia.toFixed(2)}` : '—',
      dados: dados.serie.map((d) => d.ticketMedio),
    },
    {
      titulo: 'Cancelamentos', icon: XCircle, cor: 'text-red-500', strokeClass: 'stroke-red-500', colorClass: 'bg-red-500',
      valor: cancelamentosMedia != null ? `${cancelamentosMedia.toFixed(1)}%` : '—',
      dados: dados.serie.map((d) => d.cancelamentosPercent),
    },
    {
      titulo: 'Tempo médio de entrega', icon: Clock, cor: 'text-blue-500', strokeClass: 'stroke-blue-500', colorClass: 'bg-blue-500',
      valor: tempoEntregaMedia != null ? `${tempoEntregaMedia.toFixed(0)} min` : '—',
      dados: dados.serie.map((d) => d.tempoMedioEntregaMin ?? 0),
    },
    {
      titulo: 'Entregas no prazo', icon: Timer, cor: 'text-emerald-500', strokeClass: 'stroke-emerald-500', colorClass: 'bg-emerald-500',
      valor: noPrazoMedia != null ? `${noPrazoMedia.toFixed(1)}%` : 'Sem prazo configurado',
      dados: dados.serie.map((d) => d.entregasNoPrazoPercent ?? 0),
    },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-end gap-3 mb-6">
        <div>
          <label className="block text-xs text-gray-500 mb-1">De</label>
          <input type="date" value={de} onChange={(e) => setDe(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Até</label>
          <input type="date" value={ate} onChange={(e) => setAte(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
        </div>
        <div className="ml-auto bg-gray-800 text-white rounded-2xl px-4 py-2.5 flex items-center gap-2">
          <Repeat className="h-4 w-4 text-gray-300" />
          <div>
            <p className="text-[11px] text-gray-300">Taxa de recompra no período</p>
            <p className="text-lg font-bold">{dados.taxaRecompraPercent.toFixed(1)}%</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {cards.map((c) => (
          <div key={c.titulo} className="bg-white border border-gray-200 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="font-bold text-gray-800 flex items-center gap-1.5"><c.icon className={`h-4 w-4 ${c.cor}`} /> {c.titulo}</p>
              <p className="text-xl font-bold text-gray-800">{c.valor}</p>
            </div>
            <LineChart labels={labels} series={[{ label: c.titulo, colorClass: c.colorClass, strokeClass: c.strokeClass, data: c.dados }]} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default IndicadoresTab;
