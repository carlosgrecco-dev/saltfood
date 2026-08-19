import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { useCart } from '../context/CartContext';

/** Confirmação rápida ao adicionar um item — some sozinho, não exige nenhuma ação do cliente. */
const CartToast: React.FC = () => {
  const { toast } = useCart();

  if (!toast) return null;

  return (
    <div
      key={toast.id}
      className="fixed bottom-20 inset-x-0 z-40 flex justify-center px-4 pointer-events-none animate-fade-in"
    >
      <div className="flex items-center gap-2 bg-gray-900 text-white text-sm font-medium px-4 py-2.5 rounded-full shadow-lg">
        <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
        {toast.message}
      </div>
    </div>
  );
};

export default CartToast;
