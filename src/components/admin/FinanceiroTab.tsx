import React, { useState } from 'react';
import { LayoutDashboard, ClipboardList } from 'lucide-react';
import ResumoFinanceiroTab from './ResumoFinanceiroTab';
import CaixaTab from './CaixaTab';

interface FinanceiroTabProps {
  empresaId: string;
  onAbrirRelatorios?: () => void;
}

type SubTab = 'resumo' | 'lancamentos';

const FinanceiroTab: React.FC<FinanceiroTabProps> = ({ empresaId, onAbrirRelatorios }) => {
  const [subTab, setSubTab] = useState<SubTab>('resumo');

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-bold text-gray-800">Resumo Financeiro</h2>
        <p className="text-sm text-gray-500">
          {subTab === 'resumo'
            ? 'Acompanhe todas as movimentações financeiras da sua loja em tempo real.'
            : 'Lançamentos manuais do caixa e pagamentos a motoboys.'}
        </p>
      </div>

      <div className="flex bg-gray-100 rounded-xl p-1 mb-6 max-w-xs">
        <button
          type="button"
          onClick={() => setSubTab('resumo')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-colors ${
            subTab === 'resumo' ? 'bg-white shadow text-orange-600' : 'text-gray-500'
          }`}
        >
          <LayoutDashboard className="h-3.5 w-3.5" /> Resumo
        </button>
        <button
          type="button"
          onClick={() => setSubTab('lancamentos')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-colors ${
            subTab === 'lancamentos' ? 'bg-white shadow text-orange-600' : 'text-gray-500'
          }`}
        >
          <ClipboardList className="h-3.5 w-3.5" /> Lançamentos
        </button>
      </div>

      {subTab === 'resumo' ? (
        <ResumoFinanceiroTab empresaId={empresaId} onAbrirRelatorios={onAbrirRelatorios} />
      ) : (
        <CaixaTab empresaId={empresaId} />
      )}
    </div>
  );
};

export default FinanceiroTab;
