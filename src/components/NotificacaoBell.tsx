import React, { useCallback, useEffect, useState } from 'react';
import { Bell, CheckCheck, Inbox } from 'lucide-react';
import BottomSheet from './BottomSheet';
import { useTenant } from '../context/TenantContext';
import { useCustomer } from '../context/CustomerContext';
import { fetchNotificacoes, marcarNotificacaoLida, marcarTodasNotificacoesLidas } from '../lib/notificacoes';
import { NotificacaoCliente } from '../types/Notificacao';

const POLL_INTERVAL_MS = 30000;

const tempoRelativo = (iso: string): string => {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutos = Math.floor(diffMs / 60000);
  if (minutos < 1) return 'agora';
  if (minutos < 60) return `há ${minutos} min`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `há ${horas}h`;
  const dias = Math.floor(horas / 24);
  return `há ${dias}d`;
};

const NotificacaoBell: React.FC = () => {
  const { empresa } = useTenant();
  const { customer } = useCustomer();
  const [notificacoes, setNotificacoes] = useState<NotificacaoCliente[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const load = useCallback(() => {
    if (!customer || !empresa.habilitarNotificacoesInApp) return;
    fetchNotificacoes(empresa.id, customer.id).then(setNotificacoes).catch(() => {});
  }, [empresa.id, empresa.habilitarNotificacoesInApp, customer]);

  useEffect(() => {
    load();
    const interval = setInterval(load, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [load]);

  if (!customer || !empresa.habilitarNotificacoesInApp) return null;

  const naoLidas = notificacoes.filter((n) => !n.lida).length;

  const handleClickNotificacao = async (n: NotificacaoCliente) => {
    if (!n.lida) {
      try {
        await marcarNotificacaoLida(empresa.id, customer.id, n.id);
        setNotificacoes((prev) => prev.map((item) => (item.id === n.id ? { ...item, lida: true } : item)));
      } catch {
        /* falha silenciosa — o item continua marcado como não lido, sem travar a navegação */
      }
    }
    if (n.url) window.location.href = n.url;
  };

  const handleMarcarTodas = async () => {
    try {
      await marcarTodasNotificacoesLidas(empresa.id, customer.id);
      setNotificacoes((prev) => prev.map((item) => ({ ...item, lida: true })));
    } catch {
      /* falha silenciosa */
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="relative p-2 text-gray-500 hover:text-gray-700 transition-colors"
        aria-label="Notificações"
      >
        <Bell className="h-5 w-5" />
        {naoLidas > 0 && (
          <span className="absolute top-0.5 right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {naoLidas > 9 ? '9+' : naoLidas}
          </span>
        )}
      </button>

      <BottomSheet isOpen={isOpen} onClose={() => setIsOpen(false)} title="Notificações" zIndexClass="z-[60]">
        <div className="p-5">
          {naoLidas > 0 && (
            <button
              onClick={handleMarcarTodas}
              className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 mb-3 ml-auto"
            >
              <CheckCheck className="h-3.5 w-3.5" /> Marcar todas como lidas
            </button>
          )}

          {notificacoes.length === 0 ? (
            <div className="text-center py-10">
              <Inbox className="h-8 w-8 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">Nenhuma notificação por aqui ainda.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {notificacoes.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleClickNotificacao(n)}
                  className={`w-full text-left rounded-2xl p-3.5 transition-colors ${
                    n.lida ? 'bg-gray-50 hover:bg-gray-100' : 'bg-orange-50 hover:bg-orange-100 border border-orange-100'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-bold text-gray-800 text-sm">{n.titulo}</p>
                    {!n.lida && <span className="mt-1 h-2 w-2 rounded-full bg-orange-500 shrink-0" />}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{n.corpo}</p>
                  <p className="text-[11px] text-gray-400 mt-1">{tempoRelativo(n.createdAt)}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </BottomSheet>
    </>
  );
};

export default NotificacaoBell;
