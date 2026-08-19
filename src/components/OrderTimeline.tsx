import React from 'react';
import { CheckCircle2, ChefHat, PackageCheck, Truck, XCircle } from 'lucide-react';
import { Pedido } from '../types/Pedido';

interface OrderTimelineProps {
  order: Pick<Pedido, 'status' | 'createdAt' | 'preparandoEm' | 'saiuEntregaEm' | 'entregueEm'>;
}

const formatTime = (iso: string | null) => {
  if (!iso) return null;
  return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
};

const OrderTimeline: React.FC<OrderTimelineProps> = ({ order }) => {
  if (order.status === 'CANCELADO') {
    return (
      <div className="flex items-center gap-2 text-red-600 bg-red-50 px-3 py-2 rounded-xl text-sm">
        <XCircle className="h-4 w-4" />
        <span>Pedido cancelado</span>
      </div>
    );
  }

  const steps = [
    { key: 'RECEBIDO', label: 'Recebido', icon: PackageCheck, time: order.createdAt },
    { key: 'PREPARANDO', label: 'Em preparo', icon: ChefHat, time: order.preparandoEm },
    { key: 'SAIU_ENTREGA', label: 'Saiu para entrega', icon: Truck, time: order.saiuEntregaEm },
    { key: 'ENTREGUE', label: 'Entregue', icon: CheckCircle2, time: order.entregueEm },
  ];

  // índice do último passo já alcançado (tudo antes dele fica "concluído")
  const reachedIndex = steps.reduce((acc, step, i) => (step.time ? i : acc), 0);

  return (
    <div className="flex items-start">
      {steps.map((step, i) => {
        const Icon = step.icon;
        const done = i <= reachedIndex && Boolean(step.time);
        const isLast = i === steps.length - 1;
        return (
          <div key={step.key} className={`flex items-center ${isLast ? '' : 'flex-1'}`}>
            <div className="flex flex-col items-center text-center w-16 shrink-0">
              <div
                className={`rounded-full p-2 ${
                  done ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-400'
                }`}
              >
                <Icon className="h-4 w-4" />
              </div>
              <span className={`text-[10px] mt-1 leading-tight ${done ? 'text-gray-700 font-medium' : 'text-gray-400'}`}>
                {step.label}
              </span>
              {step.time && <span className="text-[9px] text-gray-400">{formatTime(step.time)}</span>}
            </div>
            {!isLast && (
              <div className={`h-0.5 flex-1 -mt-5 ${i < reachedIndex ? 'bg-orange-500' : 'bg-gray-200'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default OrderTimeline;
