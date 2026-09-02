import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, UserCircle, Lock, Loader2,
  ChevronLeft, ChevronRight, Mail, Phone,
} from 'lucide-react';
import { useTenant } from '../context/TenantContext';
import { getAdminSession, loginAdmin, logoutAdmin, AdminSession } from '../lib/adminAuth';
import { fetchEmpresaById, setLojaAberta } from '../lib/empresas';
import { loginCliente } from '../lib/clientes';
import { saveClienteSession } from '../lib/clienteSession';
import { loginMotoboy } from '../lib/motoboysApi';
import { saveMotoboySession } from '../lib/motoboySession';
import { MotoboySession } from '../types/Motoboy';
import Header from '../components/Header';
import AdminHeader from '../components/admin/AdminHeader';
import ProdutosTab from '../components/admin/ProdutosTab';
import PedidosTab from '../components/admin/PedidosTab';
import MotoboysTab from '../components/admin/MotoboysTab';
import FinanceiroTab from '../components/admin/FinanceiroTab';
import CrmTab from '../components/admin/CrmTab';
import GatewaysTab from '../components/admin/GatewaysTab';
import AparenciaTab from '../components/admin/AparenciaTab';
import CuponsTab from '../components/admin/CuponsTab';
import OperacionalTab from '../components/admin/OperacionalTab';
import PdvTab from '../components/admin/PdvTab';
import ZonasEntregaTab from '../components/admin/ZonasEntregaTab';
import FidelidadeTab from '../components/admin/FidelidadeTab';
import CategoriasTab from '../components/admin/CategoriasTab';
import FuncionalidadesTab from '../components/admin/FuncionalidadesTab';
import MissoesTab from '../components/admin/MissoesTab';
import SuporteTab from '../components/admin/SuporteTab';
import AppLojistaTab from '../components/admin/AppLojistaTab';
import DashboardTab from '../components/admin/DashboardTab';
import CombosTab from '../components/admin/CombosTab';
import OpcoesGruposTab from '../components/admin/OpcoesGruposTab';
import TabelaPrecosTab from '../components/admin/TabelaPrecosTab';
import TenantAdminNav, { Tab, TODOS_OS_ITENS } from '../components/admin/TenantAdminNav';
import EstoqueTab from '../components/admin/EstoqueTab';
import FornecedoresTab from '../components/admin/FornecedoresTab';
import AvaliacoesTab from '../components/admin/AvaliacoesTab';
import GruposClientesTab from '../components/admin/GruposClientesTab';
import IndicadoresTab from '../components/admin/IndicadoresTab';
import FormasPagamentoTab from '../components/admin/FormasPagamentoTab';
import EntregasTab from '../components/admin/EntregasTab';
import LogisticaTab from '../components/admin/LogisticaTab';

type LoginTab = 'admin' | 'usuario' | 'motoboy';

const TITULO_LOGIN_POR_TAB: Record<LoginTab, string> = {
  admin: 'Administração',
  usuario: 'Portal do Cliente',
  motoboy: 'Portal do Motoboy',
};

const DESKTOP_QUERY = '(min-width: 640px)';

const AdminPage: React.FC = () => {
  const { slug, empresa } = useTenant();
  const navigate = useNavigate();
  const [session, setSession] = useState<AdminSession | null>(() => getAdminSession(empresa.id));
  const [tab, setTab] = useState<Tab>('dashboard');
  const [loginTab, setLoginTab] = useState<LoginTab>('admin');

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { kind?: string; empresaId?: string } | undefined;
      if (detail?.kind === 'admin' && detail.empresaId === empresa.id) {
        setSession(null);
      }
    };
    window.addEventListener('kifood:session-expired', handler);
    return () => window.removeEventListener('kifood:session-expired', handler);
  }, [empresa.id]);

  // No desktop o menu sempre fica visível (só alterna entre rail de ícones e expandido); no mobile
  // ele começa totalmente retraído (fora da tela) e só aparece ao tocar no hambúrguer — mesmo
  // padrão usado no menu do Super Admin (SuperAdminNav.tsx).
  const [isMobile, setIsMobile] = useState(() => !window.matchMedia(DESKTOP_QUERY).matches);
  const [navOpen, setNavOpen] = useState(() => window.matchMedia(DESKTOP_QUERY).matches);

  useEffect(() => {
    const mq = window.matchMedia(DESKTOP_QUERY);
    const handler = (e: MediaQueryListEvent) => {
      setIsMobile(!e.matches);
      setNavOpen(e.matches);
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const [lojaAberta, setLojaAbertaState] = useState<boolean | null>(null);
  const [togglingLoja, setTogglingLoja] = useState(false);

  const carregarStatusLoja = useCallback(async () => {
    try {
      const dados = await fetchEmpresaById(empresa.id);
      setLojaAbertaState(dados.lojaAbertaManual);
    } catch {
      /* silencioso */
    }
  }, [empresa.id]);

  useEffect(() => {
    if (session) carregarStatusLoja();
  }, [session, carregarStatusLoja]);

  const handleToggleLoja = async () => {
    if (lojaAberta === null) return;
    setTogglingLoja(true);
    try {
      const atualizado = await setLojaAberta(empresa.id, !lojaAberta);
      setLojaAbertaState(atualizado.lojaAbertaManual);
    } finally {
      setTogglingLoja(false);
    }
  };

  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);
    try {
      const novaSessao = await loginAdmin(empresa.id, usuario, senha);
      setSession(novaSessao);
      setUsuario('');
      setSenha('');
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : 'Usuário ou senha incorretos');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    logoutAdmin(empresa.id);
    setSession(null);
  };

  const [clienteEmail, setClienteEmail] = useState('');
  const [clienteSenha, setClienteSenha] = useState('');
  const [clienteLoginError, setClienteLoginError] = useState('');
  const [clienteLoggingIn, setClienteLoggingIn] = useState(false);

  const handleClienteLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setClienteLoginError('');
    setClienteLoggingIn(true);
    try {
      const cliente = await loginCliente(empresa.id, clienteEmail, clienteSenha);
      saveClienteSession(empresa.id, { clienteId: cliente.id, token: cliente.token });
      navigate(`/${slug}`);
    } catch (err) {
      setClienteLoginError(err instanceof Error ? err.message : 'E-mail ou senha incorretos');
    } finally {
      setClienteLoggingIn(false);
    }
  };

  const [motoboyPhone, setMotoboyPhone] = useState('');
  const [motoboyPin, setMotoboyPin] = useState('');
  const [motoboyLoginError, setMotoboyLoginError] = useState('');
  const [motoboyLoggingIn, setMotoboyLoggingIn] = useState(false);

  const handleMotoboyLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setMotoboyLoginError('');
    setMotoboyLoggingIn(true);
    try {
      const motoboy = await loginMotoboy(empresa.id, motoboyPhone, motoboyPin);
      const novaSessao: MotoboySession = { motoboyId: motoboy.id, motoboyNome: motoboy.nome, empresaId: empresa.id, token: motoboy.token, disponivel: motoboy.disponivel };
      saveMotoboySession(novaSessao);
      navigate(`/${slug}/motoboy`);
    } catch (err) {
      setMotoboyLoginError(err instanceof Error ? err.message : 'Telefone ou PIN incorretos');
    } finally {
      setMotoboyLoggingIn(false);
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-6 sm:p-8">
            <Link to={`/${slug}`} className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 mb-6">
              <ArrowLeft className="h-4 w-4" /> Voltar para a loja
            </Link>
            <h1 className="text-xl font-bold text-gray-800 mb-1">{empresa.nome}</h1>
            <p className="text-sm text-gray-500 mb-6">{TITULO_LOGIN_POR_TAB[loginTab]}</p>

            <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
              {([
                { id: 'admin', label: 'Admin' },
                { id: 'usuario', label: 'Usuário' },
                { id: 'motoboy', label: 'Motoboy' },
              ] as { id: LoginTab; label: string }[]).map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setLoginTab(id)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                    loginTab === id ? 'bg-white shadow text-orange-600' : 'text-gray-500'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {loginTab === 'admin' && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-gray-700 font-medium mb-2 text-sm">Usuário</label>
                  <div className="relative">
                    <UserCircle className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                      value={usuario}
                      onChange={(e) => setUsuario(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 bg-gray-50 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                      placeholder="usuario.loja"
                      autoComplete="username"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2 text-sm">Senha</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                      type="password"
                      value={senha}
                      onChange={(e) => setSenha(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 bg-gray-50 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                      placeholder="Digite sua senha"
                      autoComplete="current-password"
                      required
                    />
                  </div>
                </div>

                {loginError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{loginError}</div>
                )}

                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-3.5 rounded-xl font-bold hover:from-orange-600 hover:to-red-600 disabled:opacity-60 transition-all duration-200 flex items-center justify-center space-x-2"
                >
                  {isLoggingIn && <Loader2 className="h-5 w-5 animate-spin" />}
                  <span>Entrar</span>
                </button>
              </form>
            )}

            {loginTab === 'usuario' && (
              <form onSubmit={handleClienteLogin} className="space-y-4">
                <p className="text-xs text-gray-400 -mt-2">Entre com o e-mail e senha da sua conta de cliente.</p>
                <div>
                  <label className="block text-gray-700 font-medium mb-2 text-sm">E-mail</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                      type="email"
                      value={clienteEmail}
                      onChange={(e) => setClienteEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 bg-gray-50 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                      autoComplete="email"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2 text-sm">Senha</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                      type="password"
                      value={clienteSenha}
                      onChange={(e) => setClienteSenha(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 bg-gray-50 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                      autoComplete="current-password"
                      required
                    />
                  </div>
                </div>

                {clienteLoginError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{clienteLoginError}</div>
                )}

                <button
                  type="submit"
                  disabled={clienteLoggingIn}
                  className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-3.5 rounded-xl font-bold hover:from-orange-600 hover:to-red-600 disabled:opacity-60 transition-all duration-200 flex items-center justify-center space-x-2"
                >
                  {clienteLoggingIn && <Loader2 className="h-5 w-5 animate-spin" />}
                  <span>Entrar</span>
                </button>
              </form>
            )}

            {loginTab === 'motoboy' && (
              <form onSubmit={handleMotoboyLogin} className="space-y-4">
                <p className="text-xs text-gray-400 -mt-2">Entre com o telefone cadastrado e o PIN que o admin te passou.</p>
                <div>
                  <label className="block text-gray-700 font-medium mb-2 text-sm">Telefone</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                      type="tel"
                      value={motoboyPhone}
                      onChange={(e) => setMotoboyPhone(e.target.value)}
                      placeholder="(73) 99999-9999"
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 bg-gray-50 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2 text-sm">PIN</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                      type="password"
                      inputMode="numeric"
                      maxLength={6}
                      value={motoboyPin}
                      onChange={(e) => setMotoboyPin(e.target.value.replace(/\D/g, ''))}
                      placeholder="PIN de 4 a 6 dígitos"
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 bg-gray-50 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                      required
                    />
                  </div>
                </div>

                {motoboyLoginError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{motoboyLoginError}</div>
                )}

                <button
                  type="submit"
                  disabled={motoboyLoggingIn}
                  className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-3.5 rounded-xl font-bold hover:from-orange-600 hover:to-red-600 disabled:opacity-60 transition-all duration-200 flex items-center justify-center space-x-2"
                >
                  {motoboyLoggingIn && <Loader2 className="h-5 w-5 animate-spin" />}
                  <span>Entrar</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <AdminHeader
        empresaNome={empresa.nome}
        empresaSlug={slug}
        empresaLogoUrl={empresa.logoUrl}
        session={session}
        navOpen={navOpen}
        onToggleNav={() => setNavOpen((v) => !v)}
        lojaAberta={lojaAberta}
        togglingLoja={togglingLoja}
        onToggleLoja={handleToggleLoja}
        onLogout={handleLogout}
        onSelectTab={setTab}
      />

      {/* No mobile, o menu aberto cobre a tela — toca fora (nesse fundo escurecido) pra fechar. */}
      {isMobile && navOpen && (
        <div
          onClick={() => setNavOpen(false)}
          aria-hidden="true"
          className="fixed inset-0 z-40 bg-gray-900/40"
        />
      )}

      {/* Drawer vertical do lado esquerdo. No desktop, recolhido vira um rail só com os ícones e
          expandido mostra os rótulos — nunca some da tela. No mobile, começa totalmente retraído
          (fora da tela) e só aparece quando o admin toca no hambúrguer (no Header). */}
      <div
        className={`fixed inset-y-0 left-0 z-50 flex h-full flex-col bg-white shadow-2xl transition-[width,transform] duration-300 ease-in-out overflow-hidden ${
          isMobile ? 'w-72' : navOpen ? 'w-72' : 'w-16'
        } ${isMobile && !navOpen ? '-translate-x-full' : 'translate-x-0'}`}
      >
        <div className={`flex items-center border-b border-gray-100 py-4 ${navOpen ? 'justify-between px-5' : 'justify-center px-2'}`}>
          {navOpen && (
            <div className="min-w-0">
              <p className="text-xs text-gray-400">Painel administrativo</p>
              <p className="font-bold text-gray-800 truncate">{empresa.nome}</p>
              {session && <p className="text-xs text-gray-400 truncate">Olá, {session.nome}</p>}
            </div>
          )}
          <button
            onClick={() => setNavOpen((v) => !v)}
            aria-label={navOpen ? 'Recolher menu' : 'Expandir menu'}
            title={navOpen ? 'Recolher menu' : 'Expandir menu'}
            className="shrink-0 text-gray-400 hover:text-gray-700 p-1"
          >
            {navOpen ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
          </button>
        </div>
        <TenantAdminNav
          tab={tab}
          onSelectTab={setTab}
          navOpen={navOpen}
          isMobile={isMobile}
          onCloseMobile={() => setNavOpen(false)}
        />
      </div>

      {/* Empurra o conteúdo pela largura do rail (recolhido) ou do menu cheio (expandido). */}
      <div className={`flex-1 transition-[margin] duration-300 ease-in-out ml-0 ${navOpen ? 'sm:ml-72' : 'sm:ml-16'}`}>
      <div className="max-w-6xl mx-auto p-5 sm:p-8 w-full">
        <div className="mb-5">
          <Link to={`/${slug}`} className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 mb-0.5">
            <ArrowLeft className="h-4 w-4" /> Voltar para a loja
          </Link>
          <p className="text-gray-800 font-bold text-sm truncate">
            {TODOS_OS_ITENS.find((i) => i.id === tab)?.label}
          </p>
        </div>

        {tab === 'dashboard' && <DashboardTab empresaId={empresa.id} />}
        {tab === 'crm' && <CrmTab empresaId={empresa.id} onAbrirFinanceiro={() => setTab('fechamento')} />}
        {tab === 'pedidos' && <PedidosTab empresaId={empresa.id} initialBucket="todos" />}
        {tab === 'pedidos-em-andamento' && <PedidosTab empresaId={empresa.id} initialBucket="em_andamento" />}
        {tab === 'pedidos-prontos' && <PedidosTab empresaId={empresa.id} initialBucket="prontos" />}
        {tab === 'pedidos-entregues' && <PedidosTab empresaId={empresa.id} initialBucket="entregues" />}
        {tab === 'pedidos-cancelados' && <PedidosTab empresaId={empresa.id} initialBucket="cancelados" />}
        {tab === 'produtos' && <ProdutosTab empresaId={empresa.id} />}
        {tab === 'categorias' && <CategoriasTab empresaId={empresa.id} />}
        {tab === 'combos' && <CombosTab empresaId={empresa.id} />}
        {tab === 'adicionais' && <OpcoesGruposTab empresaId={empresa.id} somenteAdicionais />}
        {tab === 'opcoes-grupos' && <OpcoesGruposTab empresaId={empresa.id} />}
        {tab === 'tabela-precos' && <TabelaPrecosTab empresaId={empresa.id} />}
        {tab === 'motoboys' && <MotoboysTab empresaId={empresa.id} />}
        {tab === 'fechamento' && <FinanceiroTab empresaId={empresa.id} onAbrirRelatorios={() => setTab('crm')} />}
        {tab === 'gateways' && <GatewaysTab empresaId={empresa.id} />}
        {tab === 'cupons' && <CuponsTab empresaId={empresa.id} />}
        {tab === 'formas-pagamento' && <FormasPagamentoTab empresaId={empresa.id} />}
        {tab === 'fidelidade' && <FidelidadeTab empresaId={empresa.id} />}
        {tab === 'pdv' && <PdvTab empresaId={empresa.id} />}
        {tab === 'estoque' && <EstoqueTab empresaId={empresa.id} />}
        {tab === 'fornecedores' && <FornecedoresTab empresaId={empresa.id} />}
        {tab === 'operacional' && <OperacionalTab empresaId={empresa.id} />}
        {tab === 'zonas-entrega' && <ZonasEntregaTab empresaId={empresa.id} />}
        {tab === 'entregas' && <EntregasTab empresaId={empresa.id} />}
        {tab === 'logistica' && <LogisticaTab empresaId={empresa.id} />}
        {tab === 'aparencia' && <AparenciaTab empresaId={empresa.id} />}
        {tab === 'funcionalidades' && <FuncionalidadesTab empresaId={empresa.id} />}
        {tab === 'missoes' && <MissoesTab empresaId={empresa.id} />}
        {tab === 'avaliacoes' && <AvaliacoesTab empresaId={empresa.id} />}
        {tab === 'grupos-clientes' && <GruposClientesTab empresaId={empresa.id} />}
        {tab === 'indicadores' && <IndicadoresTab empresaId={empresa.id} />}
        {tab === 'suporte' && <SuporteTab empresaId={empresa.id} />}
        {tab === 'app-lojista' && <AppLojistaTab />}
      </div>
      </div>
    </div>
  );
};

export default AdminPage;
