import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { CartItem } from '../types/Order';
import { useTenant } from './TenantContext';

export interface CartToast {
  id: number;
  message: string;
}

interface CartContextValue {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'cartItemId'>) => void;
  removeItem: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  clearCart: () => void;
  subtotal: number;
  deliveryFee: number;
  total: number;
  itemCount: number;
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toast: CartToast | null;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { empresa } = useTenant();
  const deliveryFee = empresa.taxaEntrega;

  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [toast, setToast] = useState<CartToast | null>(null);
  const toastIdRef = useRef(0);

  const addItem = (item: Omit<CartItem, 'cartItemId'>) => {
    const cartItemId = `${item.productId}-${item.notes ?? 'sem-obs'}-${Date.now()}`;
    setItems((prev) => [...prev, { ...item, cartItemId }]);
    toastIdRef.current += 1;
    setToast({ id: toastIdRef.current, message: 'Adicionado com sucesso!' });
  };

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(timer);
  }, [toast]);

  const removeItem = (cartItemId: string) => {
    setItems((prev) => prev.filter((i) => i.cartItemId !== cartItemId));
  };

  const updateQuantity = (cartItemId: string, quantity: number) => {
    if (quantity < 1) return;
    setItems((prev) => prev.map((i) => (i.cartItemId === cartItemId ? { ...i, quantity } : i)));
  };

  const clearCart = () => setItems([]);

  const subtotal = useMemo(
    () => items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0),
    [items]
  );

  const total = subtotal + (items.length > 0 ? deliveryFee : 0);
  const itemCount = useMemo(() => items.reduce((sum, i) => sum + i.quantity, 0), [items]);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        subtotal,
        deliveryFee,
        total,
        itemCount,
        isCartOpen,
        openCart: () => setIsCartOpen(true),
        closeCart: () => setIsCartOpen(false),
        toast,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextValue => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart deve ser usado dentro de um <CartProvider>');
  return ctx;
};
