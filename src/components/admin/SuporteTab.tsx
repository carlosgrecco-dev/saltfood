import React, { useCallback, useEffect, useState } from 'react';
import { LifeBuoy, Package, Send } from 'lucide-react';
import { fetchTicketsAsAdmin, updateTicket } from '../../lib/tickets';
import { TicketSuporte, StatusTicketSuporte, STATUS_TICKET_LABELS } from '../../types/Ticket';

interface SuporteTabProps {
  empresaId: string;
}

const STATUS_COLORS: Record<StatusTicketSuporte, string> = {
  ABERTO: 'bg-red-100 text-red-800',
  EM_ANDAMENTO: 'bg-amber-100 text-amber-800',
  RESOLVIDO: 'bg-green-100 text-green-800',
};

const SuporteTab: React.FC<SuporteTabProps> = ({ empresaId }) => {
  const [tickets, setTickets] = useState<TicketSuporte[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState<StatusTicketSuporte | ''>('');
  const [respostaDrafts, setRespostaDrafts] = useState<Record<string, string>>({});
  const [salvandoId, setSalvandoId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setTickets(await fetchTicketsAsAdmin(empresaId));
    } catch {
      /* silencioso */
    } finally {
      setLoading(false);
    }
  }, [empresaId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleResponder = async (ticket: TicketSuporte, status: StatusTicketSuporte) => {
    setSalvandoId(ticket.id);
    try {
      await updateTicket(empresaId, ticket.id, { status, respostaAdmin: respostaDrafts[ticket.id] || ticket.respostaAdmin || undefined });
      setRespostaDrafts((prev) => ({ ...prev, [ticket.id]: '' }));
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Não foi possível atualizar o ticket.');
    } finally {
      setSalvandoId(null);
    }
  };

  const filtrados = filtroStatus ? tickets.filter((t) => t.status === filtroStatus) : tickets;

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-5">
        {(['', 'ABERTO', 'EM_ANDAMENTO', 'RESOLVIDO'] as const).map((s) => (
          <button
            key={s || 'todos'}
            onClick={() => setFiltroStatus(s)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filtroStatus === s ? 'bg-orange-600 text-white shadow' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {s ? STATUS_TICKET_LABELS[s] : 'Todos'}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-center text-gray-500 py-8">Carregando...</p>
      ) : (
        <div className="space-y-3">
          {filtrados.map((ticket) => (
            <div key={ticket.id} className="border border-gray-200 rounded-2xl p-4">
              <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                <div>
                  <p className="font-bold text-gray-800 text-sm">{ticket.assunto}</p>
                  <p className="text-xs text-gray-400">
                    {ticket.cliente?.nome} · {ticket.cliente?.telefone || ticket.cliente?.email}
                    {ticket.pedido && (
                      <span className="inline-flex items-center gap-1 ml-2 text-orange-600">
                        <Package className="h-3 w-3" /> #{String(ticket.pedido.numero).padStart(4, '0')}
                      </span>
                    )}
                  </p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium shrink-0 ${STATUS_COLORS[ticket.status]}`}>
                  {STATUS_TICKET_LABELS[ticket.status]}
                </span>
              </div>

              <p className="text-sm text-gray-600 bg-gray-50 rounded-xl p-3 mb-3">{ticket.mensagem}</p>

              {ticket.respostaAdmin && (
                <p className="text-sm text-emerald-700 bg-emerald-50 rounded-xl p-3 mb-3">
                  <strong>Sua resposta:</strong> {ticket.respostaAdmin}
                </p>
              )}

              {ticket.status !== 'RESOLVIDO' && (
                <div className="flex flex-wrap gap-2">
                  <input
                    placeholder="Escreva uma resposta (opcional)"
                    value={respostaDrafts[ticket.id] ?? ''}
                    onChange={(e) => setRespostaDrafts((prev) => ({ ...prev, [ticket.id]: e.target.value }))}
                    className="flex-1 min-w-[200px] px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                  {ticket.status === 'ABERTO' && (
                    <button
                      onClick={() => handleResponder(ticket, 'EM_ANDAMENTO')}
                      disabled={salvandoId === ticket.id}
                      className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs px-3 py-2 rounded-lg disabled:opacity-60"
                    >
                      <Send className="h-3.5 w-3.5" /> Responder
                    </button>
                  )}
                  <button
                    onClick={() => handleResponder(ticket, 'RESOLVIDO')}
                    disabled={salvandoId === ticket.id}
                    className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-2 rounded-lg disabled:opacity-60"
                  >
                    Marcar resolvido
                  </button>
                </div>
              )}
            </div>
          ))}
          {filtrados.length === 0 && (
            <div className="text-center py-12">
              <LifeBuoy className="h-8 w-8 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">Nenhum chamado por aqui.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SuporteTab;
