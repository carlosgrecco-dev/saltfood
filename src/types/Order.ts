export type PaymentMethod = 'pix' | 'dinheiro' | 'cartao' | 'pagseguro' | 'mercadopago' | 'stripe';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type OrderStatus = 'received' | 'preparing' | 'out_for_delivery' | 'delivered' | 'cancelled';

export interface CartItemOption {
  optionId: string;
  groupName: string;
  optionName: string;
  additionalPrice: number;
}

export interface CartItem {
  cartItemId: string; // id único da linha no carrinho (permite 2x o mesmo produto com observações/opções diferentes)
  productId: string;
  name: string;
  unitPrice: number; // já inclui o preço adicional das opções selecionadas
  quantity: number;
  notes?: string; // observações do item, ex: "sem cebola, bem passado"
  image?: string;
  options?: CartItemOption[];
}

export interface OrderItemRow {
  id: string;
  order_id: string;
  product_id: number | null;
  product_name: string;
  unit_price: number;
  quantity: number;
  drink_label: string | null;
  drink_price: number | null;
  ingredients: string | null;
  notes: string | null;
  created_at: string;
}

/**
 * Pedido no histórico "Meus Pedidos" do cliente logado (Supabase / legado).
 * Novos pedidos passam a ser criados via API própria (ver types/Pedido.ts) —
 * este tipo permanece só para não quebrar o histórico já existente no Supabase.
 */
export interface OrderRow {
  id: string;
  customer_name: string;
  customer_phone: string;
  address: string;
  neighborhood: string | null;
  reference: string | null;
  subtotal: number;
  delivery_fee: number;
  total: number;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  pagseguro_charge_id: string | null;
  cash_change_for: number | null;
  order_status: OrderStatus;
  motoboy_id: string | null;
  customer_id: string | null;
  free_item_redeemed: boolean;
  loyalty_units_credited: number | null;
  notes: string | null;
  created_at: string;
  preparing_at: string | null;
  out_for_delivery_at: string | null;
  delivered_at: string | null;
  rating: number | null;
  rating_comment: string | null;
  rated_at: string | null;
  order_number: number;
  delivery_code: string | null;
  motoboy_rating: number | null;
  motoboy_rating_comment: string | null;
  motoboy_rated_at: string | null;
  order_items?: OrderItemRow[];
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  received: 'Recebido',
  preparing: 'Em preparo',
  out_for_delivery: 'Saiu para entrega',
  delivered: 'Entregue',
  cancelled: 'Cancelado',
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  pix: 'PIX',
  dinheiro: 'Dinheiro',
  cartao: 'Cartão',
  pagseguro: 'PagSeguro',
  mercadopago: 'Mercado Pago',
  stripe: 'Stripe',
};

// ---------------------------------------------------------------------------
// Área do cliente / cartão fidelidade (Supabase — não migrado nesta fase)
// ---------------------------------------------------------------------------

export interface Customer {
  id: string;
  auth_user_id: string;
  name: string;
  phone: string | null;
  email: string | null;
  total_units_purchased: number;
  free_items_earned: number;
  free_items_redeemed: number;
  created_at: string;
}

export const LOYALTY_STAMPS_GOAL = 10;

export function loyaltyProgress(customer: Pick<Customer, 'total_units_purchased'>) {
  const currentCycle = customer.total_units_purchased % LOYALTY_STAMPS_GOAL;
  return {
    stamps: currentCycle,
    goal: LOYALTY_STAMPS_GOAL,
    remaining: currentCycle === 0 ? LOYALTY_STAMPS_GOAL : LOYALTY_STAMPS_GOAL - currentCycle,
  };
}

export function loyaltyFreeItemsAvailable(customer: Pick<Customer, 'free_items_earned' | 'free_items_redeemed'>) {
  return Math.max(0, customer.free_items_earned - customer.free_items_redeemed);
}
