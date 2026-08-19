import { Outlet } from 'react-router-dom';
import { AlarmClockOff } from 'lucide-react';
import Header from './Header';
import BottomNav from './BottomNav';
import CartDrawer from './CartDrawer';
import CartToast from './CartToast';
import CustomerAuthModal from './CustomerAuthModal';
import CustomerArea from './CustomerArea';
import NotificacaoBell from './NotificacaoBell';
import { useCustomer } from '../context/CustomerContext';
import { useTenant } from '../context/TenantContext';

const Layout = () => {
  const { isCustomerAuthOpen, closeCustomerAuth, isCustomerAreaOpen, closeCustomerArea } = useCustomer();
  const { empresa } = useTenant();

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 pb-safe-nav">
      <Header rightExtra={<NotificacaoBell />} />

      {!empresa.abertaAgora && (
        <div className="bg-gray-800 text-white text-sm text-center py-2.5 px-4 flex items-center justify-center gap-2">
          <AlarmClockOff className="h-4 w-4 shrink-0" />
          <span>A loja está fechada no momento. Você pode navegar pelo cardápio, mas novos pedidos não estão sendo aceitos.</span>
        </div>
      )}

      <Outlet />

      <CustomerAuthModal isOpen={isCustomerAuthOpen} onClose={closeCustomerAuth} />
      <CustomerArea isOpen={isCustomerAreaOpen} onClose={closeCustomerArea} />

      <CartDrawer />
      <CartToast />

      <BottomNav />
    </div>
  );
};

export default Layout;
