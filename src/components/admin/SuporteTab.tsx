import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { LifeBuoy, Package, Send, Headset, CheckCircle2, AlertTriangle, AlertOctagon } from 'lucide-react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import DOMPurify from 'dompurify';
import { fetchTicketsAsAdmin, updateTicket, abrirChamadoLojista } from '../../lib/tickets';
import {
  TicketSuporte, StatusTicketSuporte, STATUS_TICKET_LABELS,
  PrioridadeChamado, PRIORIDADE_CHAMADO_LABELS, PRIORIDADE_CHAMADO_SLA,
} from '../../types/Ticket';
import BottomSheet from '../BottomSheet';

interface SuporteTabProps {
  empresaId: string;
}

const STATUS_COLORS: Record<StatusTicketSuporte, string> = {
  ABERTO: 'bg-red-100 text-red-800',
  EM_ANDAMENTO: 'bg-amber-100 text-amber-800',
  RESOLVIDO: 'bg-green-100 text-green-800',
};

const PRIORIDADE_OPCOES: { valor: PrioridadeChamado; icon: typeof CheckCircle2; corCard: string; corIcone: string }[] = [
  { valor: 'RELEVANTE', icon: CheckCircle2, corCard: 'border-green-200 bg-green-50 hover:bg-green-100', corIcone: 'text-green-600' },
  { valor: 'PRIORITARIA', icon: AlertTriangle, corCard: 'border-amber-200 bg-amber-50 hover:bg-amber-100', corIcone: 'text-amber-600' },
  { valor: 'URGENTE', icon: AlertOctagon, corCard: 'border-red-200 bg-red-50 hover:bg-red-100', corIcone: 'text-red-600' },
];

const PRIORIDADE_BADGE: Record<PrioridadeChamado, string> = {
  RELEVANTE: 'bg-green-100 text-green-800',
  PRIORITARIA: 'bg-amber-100 text-amber-800',
  URGENTE: 'bg-red-100 text-red-800',
};

const SuporteTab: React.FC<SuporteTabProps> = ({ empresaId }) => {
  const [tickets, setTickets] = useState<TicketSuporte[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState<StatusTicketSuporte | ''>('');
  const [respostaDrafts, setRespostaDrafts] = useState<Record<string, string>>({});
  const [salvandoId, setSalvandoId] = useState<string | null>(null);

  const [drawerAberto, setDrawerAberto] = useState(false);
  const [novoAssunto, setNovoAssunto] = useState('');
  const [novaMensagem, setNovaMensagem] = useState('');
  const [novaPrioridade, setNovaPrioridade] = useState<PrioridadeChamado | null>(null);
  const [enviandoChamado, setEnviandoChamado] = useState(false);

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

  const fecharDrawer = () => {
    setDrawerAberto(false);
    setNovoAssunto('');
    setNovaMensagem('');
    setNovaPrioridade(null);
  };

  const handleAbrirChamado = async () => {
    const mensagemTexto = novaMensagem.replace(/<[^>]*>/g, '').trim();
    if (!novoAssunto.trim() || !mensagemTexto || !novaPrioridade) {
      alert('Preencha o assunto, a mensagem e escolha a prioridade.');
      return;
    }
    setEnviandoChamado(true);
    try {
      await abrirChamadoLojista(empresaId, { assunto: novoAssunto.trim(), mensagem: novaMensagem, prioridade: novaPrioridade });
      fecharDrawer();
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Não foi possível abrir o chamado.');
    } finally {
      setEnviandoChamado(false);
    }
  };

  const meusChamados = useMemo(() => tickets.filter((t) => t.clienteId === null), [tickets]);
  const ticketsClientes = useMemo(() => tickets.filter((t) => t.clienteId !== null), [tickets]);
  const filtrados = filtroStatus ? ticketsClientes.filter((t) => t.status === filtroStatus) : ticketsClientes;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <h3 className="font-bold text-gray-800 flex items-center gap-2">
          <LifeBuoy className="h-4 w-4 text-orange-600" /> Central de suporte
        </h3>
        <button
          onClick={() => setDrawerAberto(true)}
          className="flex items-center gap-1.5 bg-gray-900 hover:bg-black text-white text-sm px-4 py-2 rounded-lg"
        >
          <Headset className="h-4 w-4" /> Abrir chamado com a Sigma
        </button>
      </div>

      {meusChamados.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-bold text-gray-700 mb-3">Seus chamados com a Sigma</h4>
          <div className="space-y-3">
            {meusChamados.map((chamado) => (
              <div key={chamado.id} className="border border-gray-200 rounded-2xl p-4">
                <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                  <p className="font-bold text-gray-800 text-sm">{chamado.assunto}</p>
                  <div className="flex items-center gap-2 shrink-0">
                    {chamado.prioridade && (
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${PRIORIDADE_BADGE[chamado.prioridade]}`}>
                        {PRIORIDADE_CHAMADO_LABELS[chamado.prioridade]}
                      </span>
                    )}
                    {chamado.status === 'RESOLVIDO' && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-200 text-gray-600">Resolvido</span>
                    )}
                  </div>
                </div>
                <div className="text-sm text-gray-600 bg-gray-50 rounded-xl p-3 mb-2" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(chamado.mensagem) }} />
                {chamado.respostaAdmin && (
                  <p className="text-sm text-emerald-700 bg-emerald-50 rounded-xl p-3">
                    <strong>Resposta da Sigma:</strong> {chamado.respostaAdmin}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <h4 className="text-sm font-bold text-gray-700 mb-3">Chamados de clientes</h4>
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

      <BottomSheet isOpen={drawerAberto} onClose={fecharDrawer} title="Abrir chamado com a Sigma">
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Assunto</label>
            <input
              value={novoAssunto}
              onChange={(e) => setNovoAssunto(e.target.value)}
              placeholder="Ex: Caixa não fecha corretamente"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Mensagem</label>
            <ReactQuill theme="snow" value={novaMensagem} onChange={setNovaMensagem} placeholder="Descreva o problema ou a dúvida com detalhes..." />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-2">Prioridade</label>
            <div className="space-y-2">
              {PRIORIDADE_OPCOES.map(({ valor, icon: Icon, corCard, corIcone }) => (
                <button
                  key={valor}
                  type="button"
                  onClick={() => setNovaPrioridade(valor)}
                  className={`w-full flex items-center gap-3 border-2 rounded-xl px-4 py-3 text-left transition-colors ${corCard} ${
                    novaPrioridade === valor ? 'ring-2 ring-offset-1 ring-gray-800' : ''
                  }`}
                >
                  <Icon className={`h-5 w-5 shrink-0 ${corIcone}`} />
                  <div>
                    <p className="text-sm font-bold text-gray-800">{PRIORIDADE_CHAMADO_LABELS[valor]}</p>
                    <p className="text-xs text-gray-500">{PRIORIDADE_CHAMADO_SLA[valor]}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleAbrirChamado}
            disabled={enviandoChamado}
            className="w-full flex items-center justify-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-4 py-3 rounded-lg disabled:opacity-60"
          >
            <Send className="h-4 w-4" /> {enviandoChamado ? 'Enviando...' : 'Enviar chamado'}
          </button>
        </div>
      </BottomSheet>
    </div>
  );
};

export default SuporteTab;
