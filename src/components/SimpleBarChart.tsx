import React from 'react';

interface BarChartItem {
  label: string;
  value: number;
}

interface SimpleBarChartProps {
  data: BarChartItem[];
  valuePrefix?: string;
  formatValue?: (value: number) => string;
  color?: string;
}

const SimpleBarChart: React.FC<SimpleBarChartProps> = ({
  data,
  formatValue = (v) => v.toFixed(2),
  color = 'bg-orange-500',
}) => {
  const max = Math.max(1, ...data.map((d) => d.value));

  if (data.length === 0) {
    return <p className="text-center text-gray-400 text-sm py-10">Sem dados neste período</p>;
  }

  return (
    <div className="flex items-end gap-1.5 h-40 overflow-x-auto pb-1">
      {data.map((d, i) => (
        <div key={i} className="flex flex-col items-center gap-1 min-w-[28px] flex-1 group relative">
          <div className="relative w-full flex-1 flex items-end">
            <div
              className={`w-full rounded-t-md ${color} transition-all group-hover:opacity-80`}
              style={{ height: `${Math.max(2, (d.value / max) * 100)}%` }}
              title={`${d.label}: ${formatValue(d.value)}`}
            />
          </div>
          <span className="text-[10px] text-gray-500 whitespace-nowrap">{d.label}</span>
        </div>
      ))}
    </div>
  );
};

export default SimpleBarChart;
