import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Building2, Wallet, Layers, ScrollText, Settings, Menu, X, Plus, ChevronLeft, ChevronRight, LayoutDashboard } from 'lucide-react';
import InstallAppButton from '../InstallAppButton';

const ITEMS = [
  { path: '/super-admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/super-admin/empresas', label: 'Empresas', icon: Building2 },
  { path: '/super-admin/financeiro', label: 'Financeiro', icon: Wallet },
  { path: '/super-admin/planos', label: 'Planos', icon: Layers },
  { path: '/super-admin/logs', label: 'Logs', icon: ScrollText },
  { path: '/super-admin/configuracoes', label: 'Configurações', icon: Settings },
];

interface SuperAdminNavProps {
  /** Avisa a página quando o menu expande/recolhe, para ajustar a largura do conteúdo ao lado. */
  onOpenChange?: (open: boolean) => void;
}

const DESKTOP_QUERY = '(min-width: 640px)';

const SuperAdminNav: React.FC<SuperAdminNavProps> = ({ onOpenChange }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(() => !window.matchMedia(DESKTOP_QUERY).matches);
  // Desktop começa expandido; mobile começa totalmente retraído — some por completo até o admin
  // tocar no hambúrguer.
  const [open, setOpen] = useState(() => window.matchMedia(DESKTOP_QUERY).matches);

  useEffect(() => {
    onOpenChange?.(open);
  }, [open, onOpenChange]);

  // Só no mobile o menu some por completo quando fechado; no desktop ele sempre fica visível
  // (recolhe pra modo ícone, mas nunca desaparece da tela).
  useEffect(() => {
    const mq = window.matchMedia(DESKTOP_QUERY);
    const handler = (e: MediaQueryListEvent) => {
      setIsMobile(!e.matches);
      setOpen(e.matches);
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Recolher menu' : 'Expandir menu'}
        aria-expanded={open}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-colors"
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Drawer vertical do lado esquerdo. No desktop, recolhido vira um rail só com os ícones e
          expandido mostra os rótulos — nunca some da tela. No mobile, começa totalmente retraído
          (fora da tela) e só aparece quando o admin toca no hambúrguer. */}
      <div
        className={`fixed inset-y-0 left-0 z-50 flex h-full flex-col bg-white shadow-2xl transition-[width,transform] duration-300 ease-in-out overflow-hidden ${
          isMobile ? 'w-72' : open ? 'w-72' : 'w-16'
        } ${isMobile && !open ? '-translate-x-full' : 'translate-x-0'}`}
      >
        <div className={`flex items-center border-b border-gray-100 py-4 ${open ? 'justify-between px-5' : 'justify-center px-2'}`}>
          <div className="flex items-center gap-2.5 min-w-0">
            <img src="/saltfood-icon.png" alt="SaltFood" className="h-9 w-9 shrink-0" />
            {open && <span className="font-bold text-gray-800 truncate">SaltFood Admin</span>}
          </div>
          {open && (
            <button onClick={() => setOpen(false)} aria-label="Recolher menu" className="shrink-0 text-gray-400 hover:text-gray-700 p-1">
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}
        </div>

        {!open && (
          <button
            onClick={() => setOpen(true)}
            aria-label="Expandir menu"
            title="Expandir menu"
            className="flex items-center justify-center py-2 text-gray-400 hover:text-gray-700"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        )}

        <div className={open ? 'px-3 pt-3' : 'px-2 pt-3'}>
          <button
            onClick={() => navigate('/super-admin/empresas/nova')}
            title={!open ? 'Nova Empresa' : undefined}
            className={`flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 transition-colors ${
              open ? 'px-4' : 'px-0'
            }`}
          >
            <Plus className="h-4 w-4 shrink-0" />
            {open && 'Nova Empresa'}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-3">
          {ITEMS.map(({ path, label, icon: Icon }) => {
            const active = location.pathname.startsWith(path);
            return (
              <button
                key={path}
                onClick={() => navigate(path)}
                title={!open ? label : undefined}
                className={`flex w-full items-center gap-3 py-3 text-sm font-medium transition-colors ${open ? 'px-5' : 'justify-center px-0'} ${
                  active
                    ? 'border-r-4 border-orange-500 bg-orange-50 text-orange-500'
                    : 'border-r-4 border-transparent text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {open && <span>{label}</span>}
              </button>
            );
          })}
        </nav>

        {open && (
          <div className="border-t border-gray-100 px-3 py-3 space-y-2">
            <InstallAppButton className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-700 py-2.5 text-sm font-semibold transition-colors" />
            <p className="text-center text-[11px] text-gray-300">uma plataforma Sigma Soluções Digitais</p>
          </div>
        )}
      </div>
    </>
  );
};

export default SuperAdminNav;
