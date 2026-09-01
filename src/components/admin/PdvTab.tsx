import React, { useCallback, useEffect, useState } from 'react';
import { ShoppingCart, ClipboardList, History, FileText, Settings, ShoppingBag } from 'lucide-react';
import { fetchEmpresaById } from '../../lib/empresas';
import PdvVendaTab from './PdvVendaTab';
import PdvPedidosAbertoTab from './PdvPedidosAbertoTab';
import PdvHistoricoTab from './PdvHistoricoTab';
import PdvPreVendaTab from './PdvPreVendaTab';
import PdvConfigTab from './PdvConfigTab';

interface PdvTabProps {
  empresaId: string;
}

type SubTab = 'venda' | 'abertos' | 'historico' | 'pre-venda' | 'config';

const PdvTab: React.FC<PdvTabProps> = ({ empresaId }) => {
  const [subTab, setSubTab] = useState<SubTab>('venda');
  const [habilitado, setHabilitado] = useState<boolean | null>(null);

  const load = useCallback(async () => {
    try {
      const empresa = await fetchEmpresaById(empresaId);
      setHabilitado(empresa.pdvHabilitado);
    } catch {
      setHabilitado(false);
    }
  }, [empresaId]);

  useEffect(() => {
    load();
  }, [load]);

  const abas: { id: SubTab; label: string; icon: React.ElementType }[] = [
    { id: 'venda', label: 'Venda', icon: ShoppingCart },
    { id: 'abertos', label: 'Pedidos em aberto', icon: ClipboardList },
    { id: 'historico', label: 'Histórico de vendas', icon: History },
    { id: 'pre-venda', label: 'Pré-venda / Orçamento', icon: FileText },
    { id: 'config', label: 'Configurações', icon: Settings },
  ];

  if (habilitado === null) {
    return <p className="text-center text-gray-500 py-8">Carregando...</p>;
  }

  if (!habilitado) {
    return (
      <div className="bg-gray-50 border border-gray-100 rounded-2xl p-6 text-center max-w-lg mx-auto">
        <ShoppingBag className="h-8 w-8 text-gray-400 mx-auto mb-3" />
        <h3 className="font-bold text-gray-800 mb-1">PDV ainda não está liberado pra sua loja</h3>
        <p className="text-sm text-gray-500">A venda de balcão/mesa é uma função do plano — fale com o suporte da plataforma pra liberar.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-bold text-gray-800">PDV</h2>
        <p className="text-sm text-gray-500">Venda rápida e inteligente</p>
      </div>

      <div className="flex flex-wrap items-center gap-1 mb-6 border-b border-gray-200">
        {abas.map((a) => (
          <button
            key={a.id}
            onClick={() => setSubTab(a.id)}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              subTab === a.id ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <a.icon className="h-3.5 w-3.5" /> {a.label}
          </button>
        ))}
      </div>

      {subTab === 'venda' && <PdvVendaTab empresaId={empresaId} />}
      {subTab === 'abertos' && <PdvPedidosAbertoTab empresaId={empresaId} />}
      {subTab === 'historico' && <PdvHistoricoTab empresaId={empresaId} />}
      {subTab === 'pre-venda' && <PdvPreVendaTab empresaId={empresaId} />}
      {subTab === 'config' && <PdvConfigTab empresaId={empresaId} />}
    </div>
  );
};

export default PdvTab;
