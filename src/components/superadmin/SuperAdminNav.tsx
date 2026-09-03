import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Building2, Wallet, Layers, ScrollText, Settings, Menu, X, Plus, ChevronLeft, ChevronRight,
  LayoutDashboard, Coins, Inbox, Globe, Headset, Bell, Sparkles, CreditCard,
} from 'lucide-react';
import InstallAppButton from '../InstallAppButton';
import { getSuperAdminSession } from '../../lib/superAdminAuth';

type NavEntry = { path: string; label: string; icon: typeof Building2 };
type NavGroup = { id: string; label: string; items: NavEntry[] };

/**
 * 5 grupos sempre visíveis (sem colapsar), mesmo padrão de `TenantAdminNav.tsx` — cada item já é
 * uma página real, sem placeholder. Conforme novas telas do Super Admin forem construídas
 * (Recursos da Plataforma, Integrações, Relatórios, Monitoramento, Notificações, Marketing &
 * Campanhas), entram no grupo certo aqui.
 */
const GRUPOS: NavGroup[] = [
  {
    id: 'principal',
    label: 'Principal',
    items: [{ path: '/super-admin/dashboard', label: 'Dashboard', icon: LayoutDashboard }],
  },
  {
    id: 'gestao',
    label: 'Gestão',
    items: [
      { path: '/super-admin/empresas', label: 'Empresas', icon: Building2 },
      { path: '/super-admin/planos', label: 'Planos', icon: Layers },
      { path: '/super-admin/financeiro', label: 'Financeiro', icon: Wallet },
      { path: '/super-admin/saltfood-coins', label: 'SaltFood Coins', icon: Coins },
      { path: '/super-admin/leads', label: 'Leads', icon: Inbox },
    ],
  },
  {
    id: 'plataforma',
    label: 'Plataforma',
    items: [
      { path: '/super-admin/recursos-plataforma', label: 'Recursos da Plataforma', icon: Sparkles },
      { path: '/super-admin/integracoes', label: 'Integrações', icon: CreditCard },
      { path: '/super-admin/logs', label: 'Logs do Sistema', icon: ScrollText },
      { path: '/super-admin/configuracoes', label: 'Configurações', icon: Settings },
    ],
  },
  {
    id: 'suporte',
    label: 'Suporte e Relatórios',
    items: [{ path: '/super-admin/chamados', label: 'Chamados', icon: Headset }],
  },
  {
    id: 'outros',
    label: 'Outros',
    items: [
      { path: '/super-admin/notificacoes', label: 'Notificações', icon: Bell },
      { path: '/super-admin/site', label: 'Site público', icon: Globe },
    ],
  },
];

const TODOS_OS_ITENS: NavEntry[] = GRUPOS.flatMap((g) => g.items);

interface SuperAdminNavProps {
  /** Avisa a página quando o menu expande/recolhe, para ajustar a largura do conteúdo ao lado. */
  onOpenChange?: (open: boolean) => void;
}

const DESKTOP_QUERY = '(min-width: 640px)';

const SuperAdminNav: React.FC<SuperAdminNavProps> = ({ onOpenChange }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const session = getSuperAdminSession();
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
            <div className="h-9 w-9 shrink-0 rounded-lg bg-black p-1">
              <img src="/logo.png" alt="SaltFood" className="h-full w-full rounded-sm" />
            </div>
            {open && (
              <div className="min-w-0">
                <span className="block font-bold text-gray-800 truncate">SaltFood Admin</span>
                {session && <span className="block text-xs text-gray-400 truncate">Olá, {session.usuario}</span>}
              </div>
            )}
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
          {!open ? (
            // Recolhido: sem espaço pra cabeçalho de grupo, todos os itens viram um rail plano de ícones.
            TODOS_OS_ITENS.map(({ path, label, icon: Icon }) => {
              const active = location.pathname.startsWith(path);
              return (
                <button
                  key={path}
                  onClick={() => navigate(path)}
                  title={label}
                  className={`flex w-full items-center justify-center py-3 text-sm font-medium transition-colors ${
                    active
                      ? 'border-r-4 border-orange-500 bg-orange-50 text-orange-500'
                      : 'border-r-4 border-transparent text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                </button>
              );
            })
          ) : (
            <>
              {GRUPOS.map((grupo, i) => (
                <div key={grupo.id} className={i > 0 ? 'mt-4' : ''}>
                  <p className="px-5 mb-1 text-[11px] font-bold uppercase tracking-wide text-gray-400">{grupo.label}</p>
                  {grupo.items.map(({ path, label, icon: Icon }) => {
                    const active = location.pathname.startsWith(path);
                    return (
                      <button
                        key={path}
                        onClick={() => navigate(path)}
                        className={`flex w-full items-center gap-3 py-2.5 px-5 text-sm font-medium transition-colors ${
                          active
                            ? 'border-r-[3px] border-orange-500 bg-orange-50 text-orange-500'
                            : 'border-r-[3px] border-transparent text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span className="truncate">{label}</span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </>
          )}
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
