import React from 'react';

interface FunnelStage {
  label: string;
  value: number;
}

interface FunnelChartProps {
  /** Em ordem sequencial, ex: Recebidos, Preparando, Saiu p/ entrega, Entregues. */
  stages: FunnelStage[];
  /** Mostrado separado do funil sequencial — não dá pra saber em qual etapa cada um cancelou. */
  cancelados?: number;
}

const FunnelChart: React.FC<FunnelChartProps> = ({ stages, cancelados }) => {
  const max = Math.max(1, ...stages.map((s) => s.value));

  return (
    <div className="space-y-2">
      {stages.map((s, i) => {
        const largura = s.value > 0 ? Math.max(8, (s.value / max) * 100) : 0;
        const anterior = i > 0 ? stages[i - 1].value : null;
        const retencao = anterior && anterior > 0 ? (s.value / anterior) * 100 : null;
        return (
          <div key={s.label} className="flex items-center gap-3">
            <span className="w-32 shrink-0 text-xs text-gray-500 text-right">{s.label}</span>
            <div className="flex-1 flex justify-center">
              <div
                className="h-8 rounded-md bg-gradient-to-r from-orange-500 to-orange-400 flex items-center justify-center text-white text-xs font-bold transition-all min-w-[2rem]"
                style={{ width: `${largura}%` }}
              >
                {s.value}
              </div>
            </div>
            <span className="w-12 shrink-0 text-xs text-gray-400">{retencao != null ? `${retencao.toFixed(0)}%` : ''}</span>
          </div>
        );
      })}
      {cancelados != null && cancelados > 0 && (
        <div className="flex items-center gap-3 pt-2 mt-2 border-t border-gray-100">
          <span className="w-32 shrink-0 text-xs text-red-500 text-right">Cancelados</span>
          <div className="flex-1 flex justify-center">
            <div
              className="h-6 rounded-md bg-red-100 border border-red-200 flex items-center justify-center text-red-700 text-xs font-bold min-w-[2rem]"
              style={{ width: `${Math.max(8, (cancelados / max) * 100)}%` }}
            >
              {cancelados}
            </div>
          </div>
          <span className="w-12 shrink-0" />
        </div>
      )}
    </div>
  );
};

export default FunnelChart;
