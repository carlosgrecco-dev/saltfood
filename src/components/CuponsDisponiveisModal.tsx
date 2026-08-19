import React, { useEffect, useState } from 'react';
import { Ticket, Copy, Check } from 'lucide-react';
import BottomSheet from './BottomSheet';
import { useTenant } from '../context/TenantContext';
import { fetchCupons } from '../lib/cupons';
import { Cupom } from '../types/Cupom';

interface CuponsDisponiveisModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const descricaoCupom = (cupom: Cupom): string => {
  if (cupom.tipo === 'FRETE_GRATIS') return 'Frete grátis';
  if (cupom.tipo === 'PERCENTUAL') return `${cupom.valor}% de desconto`;
  return `R$ ${Number(cupom.valor).toFixed(2)} de desconto`;
};

const CuponsDisponiveisModal: React.FC<CuponsDisponiveisModalProps> = ({ isOpen, onClose }) => {
  const { empresa } = useTenant();
  const [cupons, setCupons] = useState<Cupom[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    fetchCupons(empresa.id, true)
      .then(setCupons)
      .catch(() => setCupons([]))
      .finally(() => setLoading(false));
  }, [isOpen, empresa.id]);

  const handleCopy = (codigo: string) => {
    navigator.clipboard?.writeText(codigo).catch(() => {});
    setCopiedCode(codigo);
    setTimeout(() => setCopiedCode(null), 1500);
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Cupons Disponíveis" zIndexClass="z-[60]">
      <div className="p-5 space-y-3">
        {loading ? (
          <p className="text-center text-gray-400 text-sm py-6">Carregando...</p>
        ) : cupons.length === 0 ? (
          <div className="text-center py-10">
            <Ticket className="h-8 w-8 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">Nenhum cupom disponível no momento.</p>
          </div>
        ) : (
          cupons.map((cupom) => (
            <div
              key={cupom.id}
              className="flex items-center gap-3 border-2 border-dashed border-gray-200 rounded-2xl p-4"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--cor-primaria)] text-white">
                <Ticket className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-mono font-bold text-gray-800">{cupom.codigo}</p>
                <p className="text-xs text-gray-500">
                  {descricaoCupom(cupom)}
                  {cupom.apenasPrimeiraCompra && ' · só na 1ª compra'}
                  {cupom.valorMinimoPedido ? ` · pedido mín. R$ ${Number(cupom.valorMinimoPedido).toFixed(2)}` : ''}
                </p>
                {cupom.descricao && <p className="text-xs text-gray-400 mt-0.5">{cupom.descricao}</p>}
              </div>
              <button
                onClick={() => handleCopy(cupom.codigo)}
                className="shrink-0 flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-[var(--cor-primaria)] bg-gray-100 hover:bg-gray-200 px-2.5 py-1.5 rounded-lg transition-colors"
              >
                {copiedCode === cupom.codigo ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copiedCode === cupom.codigo ? 'Copiado' : 'Copiar'}
              </button>
            </div>
          ))
        )}
      </div>
    </BottomSheet>
  );
};

export default CuponsDisponiveisModal;
