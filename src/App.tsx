import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import OrdersPage from './pages/OrdersPage';
import SaltfoodCoinsPage from './pages/SaltfoodCoinsPage';
import AdminPage from './pages/AdminPage';
import MotoboyPage from './pages/MotoboyPage';
import PedidoAcompanhamentoPage from './pages/PedidoAcompanhamentoPage';
import ComandaImpressaoPage from './pages/ComandaImpressaoPage';
import TermosPage from './pages/TermosPage';
import LandingPage from './pages/LandingPage';
import ParceiroPage from './pages/ParceiroPage';
import PoliticaPrivacidadePage from './pages/PoliticaPrivacidadePage';
import SuperAdminLoginPage from './pages/SuperAdminLoginPage';
import SuperAdminDashboardPage from './pages/SuperAdminDashboardPage';
import SuperAdminEmpresasPage from './pages/SuperAdminEmpresasPage';
import SuperAdminNovaEmpresaPage from './pages/SuperAdminNovaEmpresaPage';
import SuperAdminFinanceiroPage from './pages/SuperAdminFinanceiroPage';
import SuperAdminSaltfoodCoinsPage from './pages/SuperAdminSaltfoodCoinsPage';
import SuperAdminPlanosPage from './pages/SuperAdminPlanosPage';
import SuperAdminLogsPage from './pages/SuperAdminLogsPage';
import SuperAdminConfiguracoesPage from './pages/SuperAdminConfiguracoesPage';
import NotFoundPage from './pages/NotFoundPage';
import TenantProvider, { useTenant } from './context/TenantContext';
import { CartProvider } from './context/CartContext';
import { CustomerProvider } from './context/CustomerContext';
import { InstallPromptProvider } from './context/InstallPromptContext';

/** Carrinho e sessão do cliente são reiniciados a cada troca de loja (key={slug}). */
const StorefrontProviders = () => {
  const { slug } = useTenant();
  return (
    <CartProvider key={slug}>
      <CustomerProvider>
        <Outlet />
      </CustomerProvider>
    </CartProvider>
  );
};

function App() {
  return (
    <InstallPromptProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/super-admin" element={<SuperAdminLoginPage />} />
          <Route path="/super-admin/dashboard" element={<SuperAdminDashboardPage />} />
          <Route path="/super-admin/empresas" element={<SuperAdminEmpresasPage />} />
          <Route path="/super-admin/empresas/nova" element={<SuperAdminNovaEmpresaPage />} />
          <Route path="/super-admin/financeiro" element={<SuperAdminFinanceiroPage />} />
          <Route path="/super-admin/saltfood-coins" element={<SuperAdminSaltfoodCoinsPage />} />
          <Route path="/super-admin/planos" element={<SuperAdminPlanosPage />} />
          <Route path="/super-admin/logs" element={<SuperAdminLogsPage />} />
          <Route path="/super-admin/configuracoes" element={<SuperAdminConfiguracoesPage />} />

          <Route path="/:slug" element={<TenantProvider />}>
            <Route path="admin" element={<AdminPage />} />
            <Route path="admin/pedidos/:pedidoId/imprimir" element={<ComandaImpressaoPage />} />
            <Route path="motoboy" element={<MotoboyPage />} />
            <Route path="termos" element={<TermosPage />} />
            <Route element={<StorefrontProviders />}>
              <Route path="pedidos/:pedidoId" element={<PedidoAcompanhamentoPage />} />
              <Route element={<Layout />}>
                <Route index element={<HomePage />} />
                <Route path="meus-pedidos" element={<OrdersPage />} />
                <Route path="saltfood-coins" element={<SaltfoodCoinsPage />} />
              </Route>
            </Route>
          </Route>

          <Route path="/" element={<LandingPage />} />
          <Route path="/parceiro" element={<ParceiroPage />} />
          <Route path="/politica-de-privacidade" element={<PoliticaPrivacidadePage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </InstallPromptProvider>
  );
}

export default App;
