import React, { useEffect, useState } from 'react';
import { Gift } from 'lucide-react';
import { useCustomer } from '../context/CustomerContext';
import { useTenant } from '../context/TenantContext';
import { loyaltyProgress, loyaltyExpiracao, LOYALTY_STAMPS_GOAL } from '../types/Cliente';
import BottomSheet from './BottomSheet';

/** Aviso "faltam X para o prêmio", configurado pelo admin da loja (Empresa.fidelidadeAvisoFaltam). */
const FidelidadeAvisoModal: React.FC = () => {
  const { customer } = useCustomer();
  const { empresa } = useTenant();
  const [isOpen, setIsOpen] = useState(false);

  const { stamps } = customer ? loyaltyProgress(customer) : { stamps: 0 };
  const faltam = LOYALTY_STAMPS_GOAL - stamps;
  const nomeItem = empresa.fidelidadeNomeItem || 'itens';

  useEffect(() => {
    if (!customer || !empresa.fidelidadeAvisoFaltam || stamps === 0) return;

    const { disponiveis } = loyaltyExpiracao(customer, empresa);
    if (disponiveis > 0) return; // já tem prêmio pronto, não faz sentido avisar "falta"
    if (faltam !== empresa.fidelidadeAvisoFaltam) return;

    const chave = `fidelidade-aviso-${customer.id}-${customer.itensGratisGanhos}-${stamps}`;
    if (sessionStorage.getItem(chave)) return;

    sessionStorage.setItem(chave, '1');
    setIsOpen(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customer?.id, customer?.itensGratisGanhos, stamps, empresa.fidelidadeAvisoFaltam]);

  return (
    <BottomSheet isOpen={isOpen} onClose={() => setIsOpen(false)} hideHeader>
      <div className="p-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-50">
          <Gift className="h-8 w-8 text-[var(--cor-primaria)]" />
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Você está quase lá!</h2>
        <p className="text-gray-600 mb-6">
          Faltam <strong>{faltam}</strong> {nomeItem} para o seu prêmio grátis!
        </p>
        <button
          onClick={() => setIsOpen(false)}
          className="w-full bg-gradient-to-r from-[var(--cor-primaria)] to-[var(--cor-secundaria)] text-white py-3 rounded-xl font-bold hover:brightness-110 transition-all"
        >
          Ver cardápio
        </button>
      </div>
    </BottomSheet>
  );
};

export default FidelidadeAvisoModal;
