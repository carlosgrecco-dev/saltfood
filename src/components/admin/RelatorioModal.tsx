import React from 'react';
import { X, Printer, Store } from 'lucide-react';
import { useTenant } from '../../context/TenantContext';

interface RelatorioModalProps {
  isOpen: boolean;
  onClose: () => void;
  titulo: string;
  periodoLabel?: string;
  children: React.ReactNode;
}

/** Overlay de relatório detalhado, com cabeçalho (logo + nome da loja) e botão Imprimir/Exportar PDF
 * (usa o diálogo de impressão do navegador — "Salvar como PDF" já é uma opção nativa nele). O CSS
 * global (@media print em index.css) esconde tudo que não estiver dentro de .print-area. */
const RelatorioModal: React.FC<RelatorioModalProps> = ({ isOpen, onClose, titulo, periodoLabel, children }) => {
  const { empresa } = useTenant();

  if (!isOpen) return null;

  const geradoEm = new Date().toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="fixed inset-0 z-50 bg-white overflow-y-auto">
      <div className="no-print sticky top-0 z-10 flex items-center justify-between gap-3 px-4 sm:px-8 py-3 bg-white border-b border-gray-100">
        <p className="font-bold text-gray-800 truncate">{titulo}</p>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium px-4 py-2 rounded-lg"
          >
            <Printer className="h-4 w-4" /> Imprimir / Exportar PDF
          </button>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-full p-2">
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="print-area max-w-4xl mx-auto p-6 sm:p-8">
        <div className="flex items-center gap-3 pb-4 mb-6 border-b-2 border-gray-800">
          {empresa.logoUrl ? (
            <img src={empresa.logoUrl} alt={empresa.nome} className="h-12 w-12 rounded-lg object-cover shrink-0" />
          ) : (
            <div className="h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
              <Store className="h-6 w-6 text-gray-400" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="font-bold text-gray-900 text-lg truncate">{empresa.nome}</p>
            <p className="text-sm text-gray-500 truncate">{titulo}</p>
          </div>
          <div className="text-right text-xs text-gray-400 shrink-0">
            {periodoLabel && <p>Período: {periodoLabel}</p>}
            <p>Gerado em {geradoEm}</p>
          </div>
        </div>

        {children}
      </div>
    </div>
  );
};

export default RelatorioModal;
