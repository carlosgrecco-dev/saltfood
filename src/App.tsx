import { useEffect } from 'react';
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
import PlanosPage from './pages/PlanosPage';
import RecursosPage from './pages/RecursosPage';
import PoliticaPrivacidadePage from './pages/PoliticaPrivacidadePage';
import SuperAdminLoginPage from './pages/SuperAdminLoginPage';
import SuperAdminDashboardPage from './pages/SuperAdminDashboardPage';
import SuperAdminEmpresasPage from './pages/SuperAdminEmpresasPage';
import SuperAdminNovaEmpresaPage from './pages/SuperAdminNovaEmpresaPage';
import SuperAdminFinanceiroPage from './pages/SuperAdminFinanceiroPage';
import SuperAdminFinanceiroFaturamentoPage from './pages/SuperAdminFinanceiroFaturamentoPage';
import SuperAdminFinanceiroComissoesPage from './pages/SuperAdminFinanceiroComissoesPage';
import SuperAdminFinanceiroFaturasPage from './pages/SuperAdminFinanceiroFaturasPage';
import SuperAdminFinanceiroTransacoesPage from './pages/SuperAdminFinanceiroTransacoesPage';
import SuperAdminFinanceiroExtratoPage from './pages/SuperAdminFinanceiroExtratoPage';
import SuperAdminSaltfoodCoinsPage from './pages/SuperAdminSaltfoodCoinsPage';
import SuperAdminPlanosPage from './pages/SuperAdminPlanosPage';
import SuperAdminLogsPage from './pages/SuperAdminLogsPage';
import SuperAdminLeadsPage from './pages/SuperAdminLeadsPage';
import SuperAdminChamadosLojistasPage from './pages/SuperAdminChamadosLojistasPage';
import SuperAdminSitePage from './pages/SuperAdminSitePage';
import SuperAdminConfiguracoesPage from './pages/SuperAdminConfiguracoesPage';
import SuperAdminNotificacoesPage from './pages/SuperAdminNotificacoesPage';
import SuperAdminRecursosPlataformaPage from './pages/SuperAdminRecursosPlataformaPage';
import SuperAdminIntegracoesPage from './pages/SuperAdminIntegracoesPage';
import SuperAdminRelatoriosPage from './pages/SuperAdminRelatoriosPage';
import SuperAdminMonitoramentoPage from './pages/SuperAdminMonitoramentoPage';
import SuperAdminCampanhasPage from './pages/SuperAdminCampanhasPage';
import StatusPage from './pages/StatusPage';
import NotFoundPage from './pages/NotFoundPage';
import TenantProvider, { useTenant } from './context/TenantContext';
import { CartProvider } from './context/CartContext';
import { CustomerProvider } from './context/CustomerContext';
import { InstallPromptProvider } from './context/InstallPromptContext';
import { pingPresence } from './lib/dashboard';

const PRESENCE_PING_INTERVAL_MS = 30000;

/** Carrinho e sessão do cliente são reiniciados a cada troca de loja (key={slug}). */
const StorefrontProviders = () => {
  const { slug, empresa } = useTenant();

  useEffect(() => {
    pingPresence(empresa.id);
    const interval = setInterval(() => pingPresence(empresa.id), PRESENCE_PING_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [empresa.id]);

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
          <Route path="/super-admin/financeiro/faturamento" element={<SuperAdminFinanceiroFaturamentoPage />} />
          <Route path="/super-admin/financeiro/comissoes" element={<SuperAdminFinanceiroComissoesPage />} />
          <Route path="/super-admin/financeiro/faturas" element={<SuperAdminFinanceiroFaturasPage />} />
          <Route path="/super-admin/financeiro/transacoes" element={<SuperAdminFinanceiroTransacoesPage />} />
          <Route path="/super-admin/financeiro/extrato" element={<SuperAdminFinanceiroExtratoPage />} />
          <Route path="/super-admin/saltfood-coins" element={<SuperAdminSaltfoodCoinsPage />} />
          <Route path="/super-admin/planos" element={<SuperAdminPlanosPage />} />
          <Route path="/super-admin/logs" element={<SuperAdminLogsPage />} />
          <Route path="/super-admin/leads" element={<SuperAdminLeadsPage />} />
          <Route path="/super-admin/chamados" element={<SuperAdminChamadosLojistasPage />} />
          <Route path="/super-admin/site" element={<SuperAdminSitePage />} />
          <Route path="/super-admin/notificacoes" element={<SuperAdminNotificacoesPage />} />
          <Route path="/super-admin/recursos-plataforma" element={<SuperAdminRecursosPlataformaPage />} />
          <Route path="/super-admin/integracoes" element={<SuperAdminIntegracoesPage />} />
          <Route path="/super-admin/relatorios" element={<SuperAdminRelatoriosPage />} />
          <Route path="/super-admin/monitoramento" element={<SuperAdminMonitoramentoPage />} />
          <Route path="/super-admin/campanhas" element={<SuperAdminCampanhasPage />} />
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
          <Route path="/planos" element={<PlanosPage />} />
          <Route path="/recursos" element={<RecursosPage />} />
          <Route path="/politica-de-privacidade" element={<PoliticaPrivacidadePage />} />
          <Route path="/status" element={<StatusPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </InstallPromptProvider>
  );
}

export default App;
