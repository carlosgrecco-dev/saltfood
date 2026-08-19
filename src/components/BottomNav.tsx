import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { UtensilsCrossed, ShoppingBag, Package, Heart } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useCustomer } from '../context/CustomerContext';
import { useTenant } from '../context/TenantContext';

const BottomNav: React.FC = () => {
  const { itemCount, openCart } = useCart();
  const { customer, openCustomerArea, openCustomerAuth } = useCustomer();
  const { slug } = useTenant();
  const location = useLocation();
  const navigate = useNavigate();
  const homePath = `/${slug}`;
  const ordersPath = `/${slug}/meus-pedidos`;

  const scrollToMenu = () => {
    if (location.pathname !== homePath) {
      navigate(homePath);
      setTimeout(() => document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' }), 100);
    } else {
      document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleLoyaltyClick = () => {
    if (customer) {
      openCustomerArea();
    } else {
      openCustomerAuth();
    }
  };

  const isOrdersActive = location.pathname === ordersPath;

  return (
    <nav className="fixed bottom-0 inset-x-0 z-30 bg-white border-t border-gray-200 safe-bottom">
      <div className="max-w-3xl mx-auto grid grid-cols-4">
        <button
          onClick={scrollToMenu}
          className="flex flex-col items-center justify-center gap-1 py-3 text-gray-500 hover:text-[var(--cor-primaria)] transition-colors"
        >
          <UtensilsCrossed className="h-5 w-5" />
          <span className="text-xs font-medium">Cardápio</span>
        </button>

        <button
          onClick={openCart}
          className="relative flex flex-col items-center justify-center gap-1 py-3 text-gray-500 hover:text-[var(--cor-primaria)] transition-colors"
        >
          <div className="relative">
            <ShoppingBag className="h-5 w-5" />
            {itemCount > 0 && (
              <span className="absolute -top-2 -right-2.5 bg-[var(--cor-primaria)] text-white text-[10px] font-bold rounded-full h-4 min-w-[16px] px-1 flex items-center justify-center">
                {itemCount}
              </span>
            )}
          </div>
          <span className="text-xs font-medium">Carrinho</span>
        </button>

        <button
          onClick={handleLoyaltyClick}
          className={`relative flex flex-col items-center justify-center gap-1 py-3 transition-colors ${
            customer ? 'text-[var(--cor-primaria)]' : 'text-gray-500 hover:text-[var(--cor-primaria)]'
          }`}
        >
          <Heart className="h-5 w-5" />
          <span className="text-xs font-medium">Fidelidade</span>
        </button>

        <Link
          to={ordersPath}
          className={`flex flex-col items-center justify-center gap-1 py-3 transition-colors ${
            isOrdersActive ? 'text-[var(--cor-primaria)]' : 'text-gray-500 hover:text-[var(--cor-primaria)]'
          }`}
        >
          <Package className="h-5 w-5" />
          <span className="text-xs font-medium">Meus Pedidos</span>
        </Link>
      </div>
    </nav>
  );
};

export default BottomNav;
