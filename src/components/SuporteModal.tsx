import React, { useEffect, useState } from 'react';
import { LifeBuoy, Send, Loader2, Package } from 'lucide-react';
import BottomSheet from './BottomSheet';
import { useTenant } from '../context/TenantContext';
import { fetchMeusTickets, createTicket } from '../lib/tickets';
import { fetchMeusPedidos } from '../lib/clientes';
import { TicketSuporte, StatusTicketSuporte, STATUS_TICKET_LABELS } from '../types/Ticket';
import { Pedido } from '../types/Pedido';

interface SuporteModalProps {
  isOpen: boolean;
  onClose: () => void;
  clienteId: string;
}

const STATUS_COLORS: Record<StatusTicketSuporte, string> = {
  ABERTO: 'bg-red-100 text-red-700',
  EM_ANDAMENTO: 'bg-amber-100 text-amber-700',
  RESOLVIDO: 'bg-green-100 text-green-700',
};

const SuporteModal: React.FC<SuporteModalProps> = ({ isOpen, onClose, clienteId }) => {
  const { empresa } = useTenant();
  const [tickets, setTickets] = useState<TicketSuporte[]>([]);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [assunto, setAssunto] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [pedidoId, setPedidoId] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    Promise.all([fetchMeusTickets(empresa.id), fetchMeusPedidos(empresa.id, clienteId)])
      .then(([t, p]) => { setTickets(t); setPedidos(p.filter((ped) => ped.status !== 'CANCELADO').slice(0, 10)); })
      .catch(() => { setTickets([]); setPedidos([]); })
      .finally(() => setLoading(false));
  }, [isOpen, empresa.id, clienteId]);

  const handleEnviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    if (!assunto.trim() || !mensagem.trim()) {
      setErro('Preencha o assunto e a mensagem.');
      return;
    }
    setEnviando(true);
    try {
      const novo = await createTicket(empresa.id, { assunto: assunto.trim(), mensagem: mensagem.trim(), pedidoId: pedidoId || undefined });
      setTickets((prev) => [novo, ...prev]);
      setAssunto('');
      setMensagem('');
      setPedidoId('');
      setMostrarForm(false);
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não foi possível enviar seu chamado.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Central de Suporte" zIndexClass="z-[60]">
      <div className="p-5 space-y-3">
        {!mostrarForm && (
          <button
            onClick={() => setMostrarForm(true)}
            className="w-full flex items-center justify-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white text-sm py-2.5 rounded-xl"
          >
            <LifeBuoy className="h-4 w-4" /> Abrir novo chamado
          </button>
        )}

        {mostrarForm && (
          <form onSubmit={handleEnviar} className="bg-gray-50 rounded-2xl p-4 space-y-2.5">
            <input
              placeholder="Assunto (ex: item faltando)"
              value={assunto}
              onChange={(e) => setAssunto(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
            />
            <textarea
              placeholder="Conte o que aconteceu"
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
            />
            {pedidos.length > 0 && (
              <select
                value={pedidoId}
                onChange={(e) => setPedidoId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
              >
                <option value="">Sem pedido relacionado</option>
                {pedidos.map((p) => (
                  <option key={p.id} value={p.id}>Pedido #{String(p.numero).padStart(4, '0')}</option>
                ))}
              </select>
            )}
            {erro && <p className="text-xs text-red-600">{erro}</p>}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={enviando}
                className="flex-1 flex items-center justify-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white text-sm py-2 rounded-lg disabled:opacity-60"
              >
                {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Enviar
              </button>
              <button type="button" onClick={() => setMostrarForm(false)} className="px-4 text-sm text-gray-500 hover:text-gray-700">
                Cancelar
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <p className="text-center text-gray-400 text-sm py-6">Carregando...</p>
        ) : tickets.length === 0 && !mostrarForm ? (
          <div className="text-center py-10">
            <LifeBuoy className="h-8 w-8 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">Você ainda não abriu nenhum chamado.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {tickets.map((t) => (
              <div key={t.id} className="border border-gray-100 bg-gray-50 rounded-2xl p-3.5">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-bold text-gray-800 text-sm">{t.assunto}</p>
                  <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full shrink-0 ${STATUS_COLORS[t.status]}`}>
                    {STATUS_TICKET_LABELS[t.status]}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">{t.mensagem}</p>
                {t.pedido && (
                  <p className="flex items-center gap-1 text-[11px] text-gray-400 mt-1">
                    <Package className="h-3 w-3" /> Pedido #{String(t.pedido.numero).padStart(4, '0')}
                  </p>
                )}
                {t.respostaAdmin && (
                  <p className="text-xs text-emerald-700 bg-emerald-50 rounded-lg p-2 mt-2">
                    <strong>Resposta:</strong> {t.respostaAdmin}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </BottomSheet>
  );
};

export default SuporteModal;
