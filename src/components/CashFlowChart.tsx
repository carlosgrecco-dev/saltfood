import React from 'react';

interface CashFlowPoint {
  label: string;
  entradas: number;
  saidas: number;
  saldoAcumulado: number;
}

interface CashFlowChartProps {
  data: CashFlowPoint[];
}

const WIDTH = 600;
const HEIGHT = 200;
const PADDING_X = 8;
const PADDING_Y = 10;

const CashFlowChart: React.FC<CashFlowChartProps> = ({ data }) => {
  if (data.length === 0) {
    return <p className="text-center text-gray-400 text-sm py-10">Sem dados neste período</p>;
  }

  const max = Math.max(1, ...data.flatMap((d) => [d.entradas, d.saidas, Math.abs(d.saldoAcumulado)]));
  const n = data.length;
  const plotWidth = WIDTH - PADDING_X * 2;
  const plotHeight = HEIGHT - PADDING_Y * 2;
  const slot = plotWidth / n;
  const barWidth = Math.max(1, slot * 0.32);

  const yDe = (v: number) => HEIGHT - PADDING_Y - (Math.max(0, v) / max) * plotHeight;
  const alturaDe = (v: number) => (Math.max(0, v) / max) * plotHeight;

  const linhaPontos = data
    .map((d, i) => {
      const x = PADDING_X + slot * i + slot / 2;
      const y = yDe(d.saldoAcumulado);
      return `${x},${y}`;
    })
    .join(' ');

  const passo = n > 12 ? Math.ceil(n / 8) : 1;

  return (
    <div>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full h-52">
        {[0.25, 0.5, 0.75].map((f) => (
          <line key={f} x1={0} x2={WIDTH} y1={HEIGHT * f} y2={HEIGHT * f} stroke="#F3F4F6" strokeWidth={1} />
        ))}
        {data.map((d, i) => {
          const xCentro = PADDING_X + slot * i + slot / 2;
          return (
            <g key={i}>
              <rect
                x={xCentro - barWidth - 1}
                y={yDe(d.entradas)}
                width={barWidth}
                height={alturaDe(d.entradas)}
                className="fill-emerald-500"
                rx={1.5}
              >
                <title>{`${d.label} — Entradas: R$ ${d.entradas.toFixed(2)}`}</title>
              </rect>
              <rect
                x={xCentro + 1}
                y={yDe(d.saidas)}
                width={barWidth}
                height={alturaDe(d.saidas)}
                className="fill-red-400"
                rx={1.5}
              >
                <title>{`${d.label} — Saídas: R$ ${d.saidas.toFixed(2)}`}</title>
              </rect>
            </g>
          );
        })}
        <polyline points={linhaPontos} fill="none" className="stroke-gray-800" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        {data.map((d, i) => {
          if (i % passo !== 0 && i !== n - 1) return null;
          const x = PADDING_X + slot * i + slot / 2;
          return <circle key={i} cx={x} cy={yDe(d.saldoAcumulado)} r={2} className="fill-gray-800" />;
        })}
      </svg>
      <div className="flex justify-between text-[10px] text-gray-400 mt-1 px-1">
        {data.map((d, i) => (i % passo === 0 || i === n - 1 ? <span key={i}>{d.label}</span> : null))}
      </div>
      <div className="flex flex-wrap gap-4 mt-3">
        <div className="flex items-center gap-1.5 text-xs">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span className="text-gray-600">Entradas</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
          <span className="text-gray-600">Saídas</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <span className="w-2.5 h-2.5 rounded-full bg-gray-800" />
          <span className="text-gray-600">Saldo acumulado</span>
        </div>
      </div>
    </div>
  );
};

export default CashFlowChart;
