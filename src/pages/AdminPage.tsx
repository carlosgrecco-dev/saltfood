import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Package, Bike, DollarSign, ShoppingBag, LogOut, ArrowLeft, UserCircle, Lock, Loader2, BarChart3, CreditCard, Palette, Ticket,
  Clock, MapPin, Store, PowerOff, Menu, X, Gift, Tag, ChevronLeft, ChevronRight, Mail, Phone, Sparkles, Target, LifeBuoy,
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
import ProdutosTab from '../components/admin/ProdutosTab';
import PedidosTab from '../components/admin/PedidosTab';
import MotoboysTab from '../components/admin/MotoboysTab';
import CaixaTab from '../components/admin/CaixaTab';
import CrmTab from '../components/admin/CrmTab';
import GatewaysTab from '../components/admin/GatewaysTab';
import AparenciaTab from '../components/admin/AparenciaTab';
import CuponsTab from '../components/admin/CuponsTab';
import OperacionalTab from '../components/admin/OperacionalTab';
import ZonasEntregaTab from '../components/admin/ZonasEntregaTab';
import FidelidadeTab from '../components/admin/FidelidadeTab';
import CategoriasTab from '../components/admin/CategoriasTab';
import FuncionalidadesTab from '../components/admin/FuncionalidadesTab';
import MissoesTab from '../components/admin/MissoesTab';
import SuporteTab from '../components/admin/SuporteTab';

type Tab = 'crm' | 'pedidos' | 'produtos' | 'categorias' | 'motoboys' | 'fechamento' | 'gateways' | 'cupons' | 'fidelidade' | 'operacional' | 'zonas-entrega' | 'aparencia' | 'funcionalidades' | 'missoes' | 'suporte';

const NAV_ITEMS: { id: Tab; label: string; icon: typeof Package }[] = [
  { id: 'crm', label: 'CRM', icon: BarChart3 },
  { id: 'pedidos', label: 'Pedidos', icon: Package },
  { id: 'produtos', label: 'Produtos', icon: ShoppingBag },
  { id: 'categorias', label: 'Categorias', icon: Tag },
  { id: 'motoboys', label: 'Motoboys', icon: Bike },
  { id: 'fechamento', label: 'Caixa', icon: DollarSign },
  { id: 'gateways', label: 'Gateways', icon: CreditCard },
  { id: 'cupons', label: 'Cupons', icon: Ticket },
  { id: 'fidelidade', label: 'Fidelidade', icon: Gift },
  { id: 'operacional', label: 'Operacional', icon: Clock },
  { id: 'zonas-entrega', label: 'Entrega & Frete', icon: MapPin },
  { id: 'aparencia', label: 'Aparência', icon: Palette },
  { id: 'funcionalidades', label: 'Funcionalidades', icon: Sparkles },
  { id: 'missoes', label: 'Missões', icon: Target },
  { id: 'suporte', label: 'Suporte', icon: LifeBuoy },
];

type LoginTab = 'admin' | 'usuario' | 'motoboy';

const DESKTOP_QUERY = '(min-width: 640px)';

const AdminPage: React.FC = () => {
  const { slug, empresa } = useTenant();
  const navigate = useNavigate();
  const [session, setSession] = useState<AdminSession | null>(() => getAdminSession(empresa.id));
  const [tab, setTab] = useState<Tab>('crm');
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
            <h1 className="text-xl font-bold text-gray-800 mb-1">Painel Administrativo</h1>
            <p className="text-sm text-gray-500 mb-6">{empresa.nome}</p>

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
      <Header
        rightExtra={
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setNavOpen((v) => !v)}
              aria-label={navOpen ? 'Fechar menu' : 'Abrir menu'}
              aria-expanded={navOpen}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-colors"
            >
              {navOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            {lojaAberta !== null && (
              <button
                onClick={handleToggleLoja}
                disabled={togglingLoja}
                title="Botão de emergência: fecha a loja para novos pedidos imediatamente"
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl transition-colors text-xs sm:text-sm font-medium disabled:opacity-60 ${
                  lojaAberta ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'
                }`}
              >
                {lojaAberta ? <Store className="h-4 w-4" /> : <PowerOff className="h-4 w-4" />}
                <span className="hidden sm:inline">{lojaAberta ? 'Loja Aberta' : 'Loja Fechada'}</span>
              </button>
            )}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 px-2.5 py-1.5 rounded-xl transition-colors text-xs sm:text-sm"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        }
      />

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
        <nav className="flex-1 overflow-y-auto py-2">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              title={!navOpen ? label : undefined}
              className={`flex w-full items-center gap-3 py-3 text-sm font-medium transition-colors ${
                navOpen ? 'px-5' : 'justify-center px-0'
              } ${
                tab === id
                  ? 'border-r-4 border-orange-500 bg-orange-50 text-orange-600'
                  : 'border-r-4 border-transparent text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {navOpen && <span className="truncate">{label}</span>}
            </button>
          ))}
        </nav>
      </div>

      {/* Empurra o conteúdo pela largura do rail (recolhido) ou do menu cheio (expandido). */}
      <div className={`flex-1 transition-[margin] duration-300 ease-in-out ml-0 ${navOpen ? 'sm:ml-72' : 'sm:ml-16'}`}>
      <div className="max-w-6xl mx-auto p-5 sm:p-8 w-full">
        <div className="mb-5">
          <Link to={`/${slug}`} className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 mb-0.5">
            <ArrowLeft className="h-4 w-4" /> Voltar para a loja
          </Link>
          <p className="text-gray-800 font-bold text-sm truncate">
            {NAV_ITEMS.find((i) => i.id === tab)?.label}
          </p>
        </div>

        {tab === 'crm' && <CrmTab empresaId={empresa.id} />}
        {tab === 'pedidos' && <PedidosTab empresaId={empresa.id} />}
        {tab === 'produtos' && <ProdutosTab empresaId={empresa.id} />}
        {tab === 'categorias' && <CategoriasTab empresaId={empresa.id} />}
        {tab === 'motoboys' && <MotoboysTab empresaId={empresa.id} />}
        {tab === 'fechamento' && <CaixaTab empresaId={empresa.id} />}
        {tab === 'gateways' && <GatewaysTab empresaId={empresa.id} />}
        {tab === 'cupons' && <CuponsTab empresaId={empresa.id} />}
        {tab === 'fidelidade' && <FidelidadeTab empresaId={empresa.id} />}
        {tab === 'operacional' && <OperacionalTab empresaId={empresa.id} />}
        {tab === 'zonas-entrega' && <ZonasEntregaTab empresaId={empresa.id} />}
        {tab === 'aparencia' && <AparenciaTab empresaId={empresa.id} />}
        {tab === 'funcionalidades' && <FuncionalidadesTab empresaId={empresa.id} />}
        {tab === 'missoes' && <MissoesTab empresaId={empresa.id} />}
        {tab === 'suporte' && <SuporteTab empresaId={empresa.id} />}
      </div>
      </div>
    </div>
  );
};

export default AdminPage;
