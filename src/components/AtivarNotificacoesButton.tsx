import React, { useEffect, useState } from 'react';
import { Bell, BellRing, Loader2 } from 'lucide-react';
import { ativarNotificacoesPedido, suportaPush } from '../lib/push';

interface AtivarNotificacoesButtonProps {
  empresaId: string;
  pedidoId: string;
}

type Estado = 'idle' | 'carregando' | 'ativado' | 'erro';

const AtivarNotificacoesButton: React.FC<AtivarNotificacoesButtonProps> = ({ empresaId, pedidoId }) => {
  const [estado, setEstado] = useState<Estado>('idle');
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (suportaPush() && Notification.permission === 'granted') {
      navigator.serviceWorker.ready
        .then((reg) => reg.pushManager.getSubscription())
        .then((sub) => { if (sub) setEstado('ativado'); })
        .catch(() => {});
    }
  }, []);

  if (!suportaPush() || estado === 'ativado') {
    return estado === 'ativado' ? (
      <p className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
        <BellRing className="h-3.5 w-3.5" /> Notificações ativadas
      </p>
    ) : null;
  }

  const handleClick = async () => {
    setEstado('carregando');
    setErro('');
    try {
      await ativarNotificacoesPedido(empresaId, pedidoId);
      setEstado('ativado');
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não foi possível ativar as notificações.');
      setEstado('erro');
    }
  };

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={estado === 'carregando'}
        className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-full transition-colors disabled:opacity-60"
      >
        {estado === 'carregando' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Bell className="h-3.5 w-3.5" />}
        Avisar quando o status mudar
      </button>
      {erro && <p className="text-[11px] text-red-500 mt-1">{erro}</p>}
    </div>
  );
};

export default AtivarNotificacoesButton;
