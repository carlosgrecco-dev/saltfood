import React from 'react';

interface HeatmapCell {
  dia: number;
  hora: number;
  pedidos: number;
}

interface HeatmapGridProps {
  data: HeatmapCell[];
}

const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const HORAS_COM_LABEL = new Set([0, 4, 8, 12, 16, 20]);

const corPara = (valor: number, max: number) => {
  if (valor === 0) return 'bg-gray-100';
  const intensidade = valor / max;
  if (intensidade > 0.75) return 'bg-orange-600';
  if (intensidade > 0.5) return 'bg-orange-500';
  if (intensidade > 0.25) return 'bg-orange-300';
  return 'bg-orange-200';
};

const HeatmapGrid: React.FC<HeatmapGridProps> = ({ data }) => {
  const max = Math.max(1, ...data.map((d) => d.pedidos));
  const porChave = new Map(data.map((d) => [`${d.dia}-${d.hora}`, d.pedidos]));

  if (data.every((d) => d.pedidos === 0)) {
    return <p className="text-center text-gray-400 text-sm py-10">Sem dados neste período</p>;
  }

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[640px]">
        <div className="grid grid-cols-[36px_repeat(24,1fr)] gap-[3px] mb-1">
          <div />
          {Array.from({ length: 24 }, (_, hora) => (
            <div key={hora} className="text-center text-[9px] text-gray-400">
              {HORAS_COM_LABEL.has(hora) ? `${hora}h` : ''}
            </div>
          ))}
        </div>
        {DIAS.map((diaLabel, dia) => (
          <div key={dia} className="grid grid-cols-[36px_repeat(24,1fr)] gap-[3px] mb-[3px]">
            <div className="text-[10px] text-gray-500 flex items-center">{diaLabel}</div>
            {Array.from({ length: 24 }, (_, hora) => {
              const valor = porChave.get(`${dia}-${hora}`) || 0;
              return (
                <div
                  key={hora}
                  className={`aspect-square rounded-sm ${corPara(valor, max)}`}
                  title={`${diaLabel} ${hora}h: ${valor} pedido${valor === 1 ? '' : 's'}`}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default HeatmapGrid;
