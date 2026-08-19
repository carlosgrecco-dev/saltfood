import React, { useState } from 'react';
import { Plus, Minus, Trash2, ShoppingBag, Truck } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useTenant } from '../context/TenantContext';
import BottomSheet from './BottomSheet';
import CheckoutModal from './CheckoutModal';

const CartDrawer: React.FC = () => {
  const { items, isCartOpen, closeCart, removeItem, updateQuantity, subtotal, deliveryFee, total } = useCart();
  const { empresa } = useTenant();
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  const freteGratisAcimaDe = empresa.freteGratisAcimaDe;
  const faltaProFreteGratis = freteGratisAcimaDe != null ? Math.max(0, freteGratisAcimaDe - subtotal) : null;

  return (
    <>
      <BottomSheet isOpen={isCartOpen} onClose={closeCart} title="Seu Carrinho">
        <div className="p-5 space-y-3">
          {items.length > 0 && freteGratisAcimaDe != null && (
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-3.5 py-2.5">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                <Truck className="h-3.5 w-3.5 shrink-0" />
                {faltaProFreteGratis === 0
                  ? 'Você ganhou frete grátis neste pedido!'
                  : `Falta R$ ${faltaProFreteGratis!.toFixed(2)} para o frete grátis`}
              </p>
              <div className="mt-1.5 h-1.5 w-full rounded-full bg-emerald-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                  style={{ width: `${Math.min(100, (subtotal / freteGratisAcimaDe) * 100)}%` }}
                />
              </div>
            </div>
          )}

          {items.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <ShoppingBag className="h-10 w-10 mx-auto mb-3 text-gray-300" />
              <p>Seu carrinho está vazio.</p>
            </div>
          )}

          {items.map((item) => (
            <div key={item.cartItemId} className="border border-gray-100 bg-gray-50 rounded-2xl p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-bold text-gray-800 text-sm">{item.name}</p>
                  {item.options && item.options.length > 0 && (
                    <ul className="text-xs text-gray-500 mt-0.5 space-y-0.5">
                      {item.options.map((opt) => (
                        <li key={opt.optionId}>
                          + {opt.optionName}
                          {opt.additionalPrice > 0 && ` (+R$ ${opt.additionalPrice.toFixed(2)})`}
                        </li>
                      ))}
                    </ul>
                  )}
                  {item.notes && (
                    <p className="text-xs text-[var(--cor-primaria)] italic mt-0.5">Obs: {item.notes}</p>
                  )}
                </div>
                <button
                  onClick={() => removeItem(item.cartItemId)}
                  className="text-red-400 hover:text-red-600"
                  title="Remover item"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 bg-white rounded-full px-2 py-1 border border-gray-200">
                  <button
                    onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)}
                    className="hover:bg-gray-100 rounded-full p-1"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="font-semibold w-5 text-center text-sm">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}
                    className="hover:bg-gray-100 rounded-full p-1"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
                <p className="font-bold text-[var(--cor-primaria)] text-sm">
                  R$ {(item.unitPrice * item.quantity).toFixed(2)}
                </p>
              </div>
            </div>
          ))}
        </div>

        {items.length > 0 && (
          <div className="sticky bottom-0 bg-white border-t border-gray-100 p-5 space-y-1.5 safe-bottom">
            <div className="flex justify-between text-gray-500 text-sm">
              <span>Subtotal</span>
              <span>R$ {subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-500 text-sm">
              <span>Taxa de entrega</span>
              <span>R$ {deliveryFee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold text-gray-800 pt-1.5 border-t border-gray-100">
              <span>Total</span>
              <span>R$ {total.toFixed(2)}</span>
            </div>
            <button
              onClick={() => setIsCheckoutOpen(true)}
              className="w-full bg-gradient-to-r from-[var(--cor-primaria)] to-[var(--cor-secundaria)] text-white py-3.5 rounded-xl font-bold hover:brightness-110 transition-all duration-200 mt-3"
            >
              Continuar para o Checkout
            </button>
          </div>
        )}
      </BottomSheet>

      <CheckoutModal isOpen={isCheckoutOpen} onClose={() => setIsCheckoutOpen(false)} />
    </>
  );
};

export default CartDrawer;
