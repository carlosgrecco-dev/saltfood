import React, { useEffect, useRef, useState } from 'react';
import { Search, Bell, HelpCircle, ChevronDown, Store, PowerOff, Menu, X, LogOut, UserCircle } from 'lucide-react';
import { AdminSession } from '../../lib/adminAuth';
import { TODOS_OS_ITENS, Tab } from './TenantAdminNav';

interface AdminHeaderProps {
  empresaNome: string;
  empresaSlug: string;
  empresaLogoUrl: string | null;
  session: AdminSession | null;
  navOpen: boolean;
  onToggleNav: () => void;
  lojaAberta: boolean | null;
  togglingLoja: boolean;
  onToggleLoja: () => void;
  onLogout: () => void;
  onSelectTab: (tab: Tab) => void;
}

const AdminHeader: React.FC<AdminHeaderProps> = ({
  empresaNome, empresaSlug, empresaLogoUrl, session, navOpen, onToggleNav,
  lojaAberta, togglingLoja, onToggleLoja, onLogout, onSelectTab,
}) => {
  const [buscaAberta, setBuscaAberta] = useState(false);
  const [busca, setBusca] = useState('');
  const [perfilAberto, setPerfilAberto] = useState(false);
  const buscaInputRef = useRef<HTMLInputElement>(null);
  const perfilRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setBuscaAberta(true);
        setTimeout(() => buscaInputRef.current?.focus(), 0);
      }
      if (e.key === 'Escape') setBuscaAberta(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (perfilRef.current && !perfilRef.current.contains(e.target as Node)) setPerfilAberto(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const termo = busca.trim().toLowerCase();
  const resultados = termo ? TODOS_OS_ITENS.filter((i) => i.label.toLowerCase().includes(termo)).slice(0, 8) : [];

  const irPara = (tab: Tab) => {
    onSelectTab(tab);
    setBusca('');
    setBuscaAberta(false);
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-100">
      <div className="flex items-center gap-3 h-16 px-4 sm:px-6">
        <button
          onClick={onToggleNav}
          aria-label={navOpen ? 'Fechar menu' : 'Abrir menu'}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors sm:hidden"
        >
          {navOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        <div className="flex items-center gap-2.5 shrink-0 min-w-0">
          {empresaLogoUrl ? (
            <img src={empresaLogoUrl} alt={empresaNome} className="h-8 w-8 rounded-lg shrink-0 object-cover" />
          ) : (
            <div className="h-8 w-8 rounded-lg shrink-0 bg-gray-100 flex items-center justify-center">
              <Store className="h-4 w-4 text-gray-400" />
            </div>
          )}
          <div className="min-w-0 leading-tight">
            <p className="font-bold text-gray-800 text-sm truncate">{empresaNome}</p>
            <p className="text-[11px] text-gray-400 truncate">@{empresaSlug}</p>
          </div>
          {lojaAberta !== null && (
            <button
              onClick={onToggleLoja}
              disabled={togglingLoja}
              title="Botão de emergência: fecha a loja para novos pedidos imediatamente"
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full transition-colors text-xs font-medium disabled:opacity-60 shrink-0 ${
                lojaAberta ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'
              }`}
            >
              {lojaAberta ? <Store className="h-3.5 w-3.5" /> : <PowerOff className="h-3.5 w-3.5" />}
              {lojaAberta ? 'Loja aberta' : 'Loja fechada'}
              <ChevronDown className="h-3 w-3" />
            </button>
          )}
        </div>

        <div className="flex-1 flex justify-center px-2 min-w-0 relative">
          <div className="w-full max-w-md relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              ref={buscaInputRef}
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              onFocus={() => setBuscaAberta(true)}
              placeholder="Buscar (Ctrl + K)"
              className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-200"
            />
            {buscaAberta && resultados.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden z-40">
                {resultados.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => irPara(id)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors"
                  >
                    <Icon className="h-4 w-4 shrink-0" /> {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button className="relative flex h-9 w-9 items-center justify-center rounded-xl text-gray-500 hover:bg-gray-50 transition-colors">
            <Bell className="h-4.5 w-4.5" />
          </button>
          <button className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-500 hover:bg-gray-50 transition-colors">
            <HelpCircle className="h-4.5 w-4.5" />
          </button>

          <div className="relative" ref={perfilRef}>
            <button
              onClick={() => setPerfilAberto((v) => !v)}
              className="flex items-center gap-2 pl-1.5 pr-2 py-1 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <UserCircle className="h-8 w-8 text-gray-400" />
              <div className="hidden md:block text-left leading-tight">
                <p className="text-xs font-bold text-gray-800">{session?.nome || 'Administrador'}</p>
                <p className="text-[10px] text-gray-400">Administrador</p>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-gray-400 hidden md:block" />
            </button>
            {perfilAberto && (
              <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden z-40">
                <button
                  onClick={onLogout}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <LogOut className="h-4 w-4" /> Sair
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
