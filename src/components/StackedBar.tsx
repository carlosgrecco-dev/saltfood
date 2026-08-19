import React from 'react';

interface Segment {
  label: string;
  value: number;
  colorClass: string;
}

interface StackedBarProps {
  segments: Segment[];
  formatValue?: (value: number) => string;
}

const StackedBar: React.FC<StackedBarProps> = ({ segments, formatValue = (v) => `R$ ${v.toFixed(2)}` }) => {
  const total = segments.reduce((sum, s) => sum + s.value, 0) || 1;

  return (
    <div>
      <div className="flex w-full h-4 rounded-full overflow-hidden bg-gray-100">
        {segments
          .filter((s) => s.value > 0)
          .map((s, i) => (
            <div
              key={i}
              className={s.colorClass}
              style={{ width: `${(s.value / total) * 100}%` }}
              title={`${s.label}: ${formatValue(s.value)}`}
            />
          ))}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3">
        {segments.map((s, i) => (
          <div key={i} className="flex items-center gap-1.5 text-xs">
            <span className={`w-2.5 h-2.5 rounded-full ${s.colorClass}`} />
            <span className="text-gray-600">{s.label}</span>
            <span className="font-bold text-gray-800">{formatValue(s.value)}</span>
            <span className="text-gray-400">({total > 0 ? ((s.value / total) * 100).toFixed(0) : 0}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StackedBar;
