import React from 'react';

interface LineSeries {
  label: string;
  /** classe Tailwind bg-* pro marcador da legenda, ex: 'bg-orange-500' */
  colorClass: string;
  /** classe Tailwind stroke-* pra linha do SVG, ex: 'stroke-orange-500' */
  strokeClass: string;
  data: number[];
}

interface LineChartProps {
  /** Eixo X — mesmo tamanho de cada series[].data. */
  labels: string[];
  series: LineSeries[];
}

const WIDTH = 600;
const HEIGHT = 180;
const PADDING = 8;

const LineChart: React.FC<LineChartProps> = ({ labels, series }) => {
  const n = labels.length;
  const max = Math.max(1, ...series.flatMap((s) => s.data));

  if (n === 0) {
    return <p className="text-center text-gray-400 text-sm py-10">Sem dados neste período</p>;
  }

  const pontosDe = (data: number[]) =>
    data
      .map((v, i) => {
        const x = n > 1 ? PADDING + (i / (n - 1)) * (WIDTH - PADDING * 2) : WIDTH / 2;
        const y = HEIGHT - PADDING - (v / max) * (HEIGHT - PADDING * 2);
        return `${x},${y}`;
      })
      .join(' ');

  return (
    <div>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full h-44">
        {[0.25, 0.5, 0.75].map((f) => (
          <line key={f} x1={0} x2={WIDTH} y1={HEIGHT * f} y2={HEIGHT * f} stroke="#F3F4F6" strokeWidth={1} />
        ))}
        {series.map((s) => (
          <polyline
            key={s.label}
            points={pontosDe(s.data)}
            fill="none"
            className={s.strokeClass}
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ))}
      </svg>
      <div className="flex justify-between text-[10px] text-gray-400 mt-1 px-1">
        <span>{labels[0]}</span>
        {labels.length > 2 && <span>{labels[Math.floor(labels.length / 2)]}</span>}
        <span>{labels[labels.length - 1]}</span>
      </div>
      <div className="flex flex-wrap gap-4 mt-3">
        {series.map((s) => (
          <div key={s.label} className="flex items-center gap-1.5 text-xs">
            <span className={`w-2.5 h-2.5 rounded-full ${s.colorClass}`} />
            <span className="text-gray-600">{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LineChart;
