import React from 'react';

interface DonutSegment {
  label: string;
  value: number;
  /** classe Tailwind bg-* pro marcador da legenda, ex: 'bg-orange-500' */
  colorClass: string;
  /** classe Tailwind stroke-* pro arco do SVG, ex: 'stroke-orange-500' */
  strokeClass: string;
}

interface DonutChartProps {
  segments: DonutSegment[];
  formatValue?: (value: number) => string;
  centerLabel?: string;
}

const SIZE = 160;
const STROKE_WIDTH = 22;
const RADIUS = (SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const DonutChart: React.FC<DonutChartProps> = ({ segments, formatValue = (v) => v.toFixed(0), centerLabel }) => {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  let acumulado = 0;

  return (
    <div className="flex flex-wrap items-center gap-6">
      <div className="relative shrink-0" style={{ width: SIZE, height: SIZE }}>
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="-rotate-90">
          <circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} fill="none" stroke="#F3F4F6" strokeWidth={STROKE_WIDTH} />
          {total > 0 && segments.filter((s) => s.value > 0).map((s) => {
            const fracao = s.value / total;
            const dash = fracao * CIRCUMFERENCE;
            const offset = -acumulado * CIRCUMFERENCE;
            acumulado += fracao;
            return (
              <circle
                key={s.label}
                cx={SIZE / 2}
                cy={SIZE / 2}
                r={RADIUS}
                fill="none"
                className={s.strokeClass}
                strokeWidth={STROKE_WIDTH}
                strokeDasharray={`${dash} ${CIRCUMFERENCE - dash}`}
                strokeDashoffset={offset}
              >
                <title>{`${s.label}: ${formatValue(s.value)}`}</title>
              </circle>
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-bold text-gray-800">{formatValue(total)}</span>
          {centerLabel && <span className="text-[10px] text-gray-400 text-center px-2">{centerLabel}</span>}
        </div>
      </div>
      <div className="flex flex-col gap-1.5 min-w-[140px]">
        {segments.map((s) => (
          <div key={s.label} className="flex items-center gap-1.5 text-xs">
            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${s.colorClass}`} />
            <span className="text-gray-600 flex-1">{s.label}</span>
            <span className="font-bold text-gray-800">{formatValue(s.value)}</span>
            <span className="text-gray-400 w-10 text-right">({total > 0 ? ((s.value / total) * 100).toFixed(0) : 0}%)</span>
          </div>
        ))}
        {segments.length === 0 && <p className="text-gray-400 text-sm">Sem dados neste período</p>}
      </div>
    </div>
  );
};

export default DonutChart;
