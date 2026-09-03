import React, { useEffect, useRef, useState } from 'react';
import { Bell, Wallet, UserPlus, Headset, Building } from 'lucide-react';
import { fetchSuperAdminNotificacoes } from '../../lib/superAdminNotificacoes';
import { SuperAdminNotificacao, TipoNotificacaoSuperAdmin } from '../../types/SuperAdminNotificacao';

const ICONE_POR_TIPO: Record<TipoNotificacaoSuperAdmin, React.ElementType> = {
  FATURA_PENDENTE: Wallet,
  LEAD_NOVO: UserPlus,
  CHAMADO_ABERTO: Headset,
  TENANT_INATIVO: Building,
};

const POLL_MS = 60000;

const NotificacoesBell: React.FC = () => {
  const [notificacoes, setNotificacoes] = useState<SuperAdminNotificacao[]>([]);
  const [aberto, setAberto] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = () => {
      fetchSuperAdminNotificacoes()
        .then((r) => setNotificacoes(r.notificacoes))
        .catch(() => setNotificacoes([]));
    };
    load();
    const id = setInterval(load, POLL_MS);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setAberto(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setAberto((v) => !v)}
        title="Notificações"
        className="relative flex items-center justify-center gap-2 rounded-xl border border-gray-200 h-[42px] w-[42px] text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
      >
        <Bell className="h-4 w-4" />
        {notificacoes.length > 0 && (
          <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {notificacoes.length > 9 ? '9+' : notificacoes.length}
          </span>
        )}
      </button>

      {aberto && (
        <div className="absolute right-0 top-12 z-50 w-80 max-h-96 overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-xl">
          <p className="px-4 py-3 text-sm font-bold text-gray-800 border-b border-gray-100">Notificações</p>
          <div className="divide-y divide-gray-50">
            {notificacoes.map((n, i) => {
              const Icon = ICONE_POR_TIPO[n.tipo] || Bell;
              return (
                <div key={i} className="flex items-start gap-2.5 px-4 py-3">
                  <Icon className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-sm text-gray-700">{n.descricao}</p>
                    <p className="text-[11px] text-gray-400">{new Date(n.data).toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>
              );
            })}
            {notificacoes.length === 0 && <p className="text-center text-gray-400 text-sm py-8">Nada pra ver aqui — tudo em dia.</p>}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificacoesBell;
