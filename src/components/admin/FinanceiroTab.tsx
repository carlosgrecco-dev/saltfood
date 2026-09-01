import React, { useState } from 'react';
import { LayoutDashboard, ClipboardList, Wallet2, HandCoins, ScrollText } from 'lucide-react';
import ResumoFinanceiroTab from './ResumoFinanceiroTab';
import CaixaTab from './CaixaTab';
import ContasPagarTab from './ContasPagarTab';
import ContasReceberTab from './ContasReceberTab';
import ExtratoTab from './ExtratoTab';

interface FinanceiroTabProps {
  empresaId: string;
  onAbrirRelatorios?: () => void;
}

type SubTab = 'resumo' | 'lancamentos' | 'contas-pagar' | 'contas-receber' | 'extrato';

const SUB_TABS: { id: SubTab; label: string; icon: typeof LayoutDashboard; descricao: string }[] = [
  { id: 'resumo', label: 'Resumo', icon: LayoutDashboard, descricao: 'Acompanhe todas as movimentações financeiras da sua loja em tempo real.' },
  { id: 'lancamentos', label: 'Lançamentos', icon: ClipboardList, descricao: 'Lançamentos manuais do caixa e pagamentos a motoboys.' },
  { id: 'contas-pagar', label: 'Contas a Pagar', icon: Wallet2, descricao: 'Fornecedores, aluguel, tarifas e outras contas da loja — registre e marque como paga quando pagar de fato.' },
  { id: 'contas-receber', label: 'Contas a Receber', icon: HandCoins, descricao: 'Fiado, encomendas ou acertos combinados fora do gateway de pagamento.' },
  { id: 'extrato', label: 'Extrato', icon: ScrollText, descricao: 'Histórico cronológico do caixa e das contas já baixadas, com saldo acumulado.' },
];

const FinanceiroTab: React.FC<FinanceiroTabProps> = ({ empresaId, onAbrirRelatorios }) => {
  const [subTab, setSubTab] = useState<SubTab>('resumo');

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-bold text-gray-800">Financeiro</h2>
        <p className="text-sm text-gray-500">{SUB_TABS.find((t) => t.id === subTab)?.descricao}</p>
      </div>

      <div className="flex flex-wrap bg-gray-100 rounded-xl p-1 mb-6 gap-1">
        {SUB_TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setSubTab(id)}
            className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              subTab === id ? 'bg-white shadow text-orange-600' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon className="h-3.5 w-3.5" /> {label}
          </button>
        ))}
      </div>

      {subTab === 'resumo' && <ResumoFinanceiroTab empresaId={empresaId} onAbrirRelatorios={onAbrirRelatorios} />}
      {subTab === 'lancamentos' && <CaixaTab empresaId={empresaId} />}
      {subTab === 'contas-pagar' && <ContasPagarTab empresaId={empresaId} />}
      {subTab === 'contas-receber' && <ContasReceberTab empresaId={empresaId} />}
      {subTab === 'extrato' && <ExtratoTab empresaId={empresaId} />}
    </div>
  );
};

export default FinanceiroTab;
