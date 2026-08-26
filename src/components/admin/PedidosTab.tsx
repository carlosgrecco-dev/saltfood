import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ListChecks, PackageCheck, ChefHat, Truck, CheckCircle2, XCircle, Package, Printer, MessageCircle, BellOff, Layers, Gift, CalendarClock } from 'lucide-react';
import { Pedido, StatusPedido, STATUS_PEDIDO_LABELS, FORMA_PAGAMENTO_LABELS } from '../../types/Pedido';
import { Motoboy } from '../../types/Motoboy';
import { fetchPedidos, updatePedidoStatus, assignMotoboy, liberarResgateFidelidade } from '../../lib/pedidos';
import { fetchMotoboys } from '../../lib/motoboysApi';
import { useTenant } from '../../context/TenantContext';

interface PedidosTabProps {
  empresaId: string;
}

/** Mensagens padrão para o botão "Avisar via WhatsApp" — envio assistido (abre o WhatsApp com o texto pronto),
 * já que não há credenciais de API oficial (Meta/Twilio) configuradas para disparo automático. */
const MENSAGEM_POR_STATUS: Record<StatusPedido, (numero: number) => string> = {
  RECEBIDO: (n) => `Olá! Recebemos seu pedido #${String(n).padStart(4, '0')} e já vamos preparar. 🍽️`,
  PREPARANDO: (n) => `Seu pedido #${String(n).padStart(4, '0')} está sendo preparado! 👨‍🍳`,
  SAIU_ENTREGA: (n) => `Seu pedido #${String(n).padStart(4, '0')} saiu para entrega! 🛵`,
  ENTREGUE: (n) => `Seu pedido #${String(n).padStart(4, '0')} foi entregue. Bom apetite! 🎉`,
  CANCELADO: (n) => `Seu pedido #${String(n).padStart(4, '0')} foi cancelado. Qualquer dúvida, estamos à disposição.`,
};

const onlyDigits = (value: string) => value.replace(/\D/g, '');

const linkWhatsapp = (telefone: string, mensagem: string) => {
  const digits = onlyDigits(telefone);
  if (!digits) return null;
  const numero = digits.startsWith('55') ? digits : `55${digits}`;
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`;
};

const STATUS_ICONS: Record<StatusPedido, typeof Package> = {
  RECEBIDO: PackageCheck,
  PREPARANDO: ChefHat,
  SAIU_ENTREGA: Truck,
  ENTREGUE: CheckCircle2,
  CANCELADO: XCircle,
};

const STATUS_COLORS: Record<StatusPedido, string> = {
  RECEBIDO: 'bg-yellow-100 text-yellow-800',
  PREPARANDO: 'bg-orange-100 text-orange-800',
  SAIU_ENTREGA: 'bg-blue-100 text-blue-800',
  ENTREGUE: 'bg-green-100 text-green-800',
  CANCELADO: 'bg-red-100 text-red-800',
};

const STATUS_BORDER_COLORS: Record<StatusPedido, string> = {
  RECEBIDO: 'border-l-yellow-400',
  PREPARANDO: 'border-l-orange-400',
  SAIU_ENTREGA: 'border-l-blue-400',
  ENTREGUE: 'border-l-green-400',
  CANCELADO: 'border-l-red-400',
};

const POLL_INTERVAL_MS = 10000;

const PedidosTab: React.FC<PedidosTabProps> = ({ empresaId }) => {
  const { slug } = useTenant();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [motoboys, setMotoboys] = useState<Motoboy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [subTab, setSubTab] = useState<'todos' | StatusPedido>('todos');
  const [alarmeAtivo, setAlarmeAtivo] = useState(false);

  const idsConhecidosRef = useRef<Set<string> | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const tocarBip = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioCtxRef.current) audioCtxRef.current = new AudioCtx();
      const ctx = audioCtxRef.current;
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = 880;
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start();
      oscillator.stop(ctx.currentTime + 0.18);
    } catch {
      /* ambiente sem suporte a áudio, ignora silenciosamente */
    }
  }, []);

  const load = useCallback(async () => {
    try {
      const dados = await fetchPedidos(empresaId);
      const idsAtuais = new Set(dados.map((p) => p.id));
      if (idsConhecidosRef.current) {
        const chegouNovo = dados.some((p) => p.status === 'RECEBIDO' && !idsConhecidosRef.current!.has(p.id));
        if (chegouNovo) setAlarmeAtivo(true);
      }
      idsConhecidosRef.current = idsAtuais;
      setPedidos(dados);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar pedidos');
    } finally {
      setLoading(false);
    }
  }, [empresaId]);

  useEffect(() => {
    fetchMotoboys(empresaId, true).then(setMotoboys).catch(() => setMotoboys([]));
  }, [empresaId]);

  useEffect(() => {
    load();
    const interval = setInterval(load, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [load]);

  useEffect(() => {
    if (!alarmeAtivo) return;
    tocarBip();
    const interval = setInterval(tocarBip, 2000);
    return () => clearInterval(interval);
  }, [alarmeAtivo, tocarBip]);

  const filtrados = useMemo(
    () => pedidos.filter((p) => subTab === 'todos' || p.status === subTab),
    [pedidos, subTab]
  );

  const handleAvancar = async (pedido: Pedido, status: StatusPedido) => {
    await updatePedidoStatus(empresaId, pedido.id, status);
    load();
  };

  const handleCancelar = async (pedido: Pedido) => {
    if (!window.confirm('Cancelar este pedido?')) return;
    await updatePedidoStatus(empresaId, pedido.id, 'CANCELADO');
    load();
  };

  const handleAssign = async (pedido: Pedido, motoboyId: string) => {
    if (!motoboyId) return;
    await assignMotoboy(empresaId, pedido.id, motoboyId);
    load();
  };

  const handleLiberarResgate = async (pedido: Pedido) => {
    if (!window.confirm(`Liberar o item grátis da fidelidade no pedido #${String(pedido.numero).padStart(4, '0')}?`)) return;
    try {
      await liberarResgateFidelidade(empresaId, pedido.id);
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Não foi possível liberar o resgate.');
    }
  };

  return (
    <div>
      {alarmeAtivo && (
        <div className="flex items-center justify-between gap-3 bg-orange-100 border border-orange-300 text-orange-800 px-4 py-3 rounded-xl mb-4 animate-pulse">
          <span className="font-medium text-sm">🔔 Novo pedido recebido!</span>
          <button
            onClick={() => setAlarmeAtivo(false)}
            className="flex items-center gap-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs px-3 py-1.5 rounded-lg"
          >
            <BellOff className="h-3.5 w-3.5" /> Silenciar
          </button>
        </div>
      )}
      {error && <p className="text-red-600 mb-4">{error}</p>}
      {loading && <p className="text-gray-500 mb-4">Carregando...</p>}

      <div className="flex flex-wrap gap-2 mb-5">
        {([
          { id: 'todos', label: 'Todos', icon: ListChecks },
          { id: 'RECEBIDO', label: STATUS_PEDIDO_LABELS.RECEBIDO, icon: STATUS_ICONS.RECEBIDO },
          { id: 'PREPARANDO', label: STATUS_PEDIDO_LABELS.PREPARANDO, icon: STATUS_ICONS.PREPARANDO },
          { id: 'SAIU_ENTREGA', label: STATUS_PEDIDO_LABELS.SAIU_ENTREGA, icon: STATUS_ICONS.SAIU_ENTREGA },
          { id: 'ENTREGUE', label: STATUS_PEDIDO_LABELS.ENTREGUE, icon: STATUS_ICONS.ENTREGUE },
          { id: 'CANCELADO', label: STATUS_PEDIDO_LABELS.CANCELADO, icon: STATUS_ICONS.CANCELADO },
        ] as { id: 'todos' | StatusPedido; label: string; icon: typeof Package }[]).map(({ id, label, icon: Icon }) => {
          const count = id === 'todos' ? pedidos.length : pedidos.filter((p) => p.status === id).length;
          return (
            <button
              key={id}
              onClick={() => setSubTab(id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium transition-colors ${
                subTab === id ? 'bg-orange-600 text-white shadow' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Icon className="h-3.5 w-3.5" /> {label}
              <span className={`text-[11px] rounded-full px-1.5 ${subTab === id ? 'bg-white/25' : 'bg-white text-gray-500'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="space-y-4">
        {filtrados.map((pedido) => (
          <div
            key={pedido.id}
            className={`border border-gray-200 border-l-4 rounded-2xl p-5 ${
              pedido.status !== 'ENTREGUE' && pedido.status !== 'CANCELADO' ? 'bg-orange-50/40' : ''
            } ${STATUS_BORDER_COLORS[pedido.status]}`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div>
                <span className="font-mono text-xs font-bold text-orange-600">#{String(pedido.numero).padStart(4, '0')}</span>
                <p className="font-bold text-gray-800">{pedido.clienteNome} · {pedido.clienteTelefone}</p>
                <p className="text-sm text-gray-500">
                  {pedido.endereco}{pedido.bairro ? ` - ${pedido.bairro}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[pedido.status]}`}>
                  {STATUS_PEDIDO_LABELS[pedido.status]}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  {FORMA_PAGAMENTO_LABELS[pedido.formaPagamento]}
                </span>
                {pedido.formaPagamento === 'DINHEIRO' && pedido.trocoPara != null && (
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
                    Cliente paga com R$ {pedido.trocoPara.toFixed(2)}
                    {pedido.trocoPara > pedido.total && ` — leve R$ ${(pedido.trocoPara - pedido.total).toFixed(2)} de troco`}
                  </span>
                )}
                {pedido.itemGratisResgatado && (
                  <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                    <Gift className="h-3 w-3" /> item grátis
                  </span>
                )}
                {pedido.agendadoPara && (
                  <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    <CalendarClock className="h-3 w-3" /> {new Date(pedido.agendadoPara).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>
            </div>

            <div className="text-sm text-gray-600 mb-3 space-y-1">
              {pedido.itens.map((item) => (
                <div key={item.id}>
                  <div className="flex justify-between">
                    <span className="flex items-center gap-1.5">
                      {item.quantidade}x {item.nomeProduto}
                      {item.ehCombo && (
                        <span className="flex items-center gap-1 text-[10px] font-medium bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full">
                          <Layers className="h-2.5 w-2.5" /> Combo
                        </span>
                      )}
                    </span>
                    <span>R$ {(item.precoUnitario * item.quantidade).toFixed(2)}</span>
                  </div>
                  {item.opcoesSelecionadas.length > 0 && (
                    <ul className="text-xs text-gray-500 pl-3">
                      {item.opcoesSelecionadas.map((opt) => (
                        <li key={opt.id}>
                          + {opt.nomeOpcao}
                          {opt.precoAdicional > 0 && ` (+R$ ${opt.precoAdicional.toFixed(2)})`}
                        </li>
                      ))}
                    </ul>
                  )}
                  {item.observacoes && <p className="text-xs text-orange-600 italic">Obs: {item.observacoes}</p>}
                </div>
              ))}
              {pedido.observacoes && (
                <p className="text-xs text-gray-500 italic pt-1">Pedido: {pedido.observacoes}</p>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-gray-100">
              <p className="font-bold text-lg text-orange-600">R$ {pedido.total.toFixed(2)}</p>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => window.open(`/${slug}/admin/pedidos/${pedido.id}/imprimir`, '_blank', 'noopener,noreferrer')}
                  title="Imprimir comanda (58/80mm)"
                  className="flex items-center gap-1 text-gray-500 hover:text-gray-800 border border-gray-200 px-2.5 py-1.5 rounded-lg text-sm"
                >
                  <Printer className="h-4 w-4" />
                </button>

                {(() => {
                  const link = linkWhatsapp(pedido.clienteTelefone, MENSAGEM_POR_STATUS[pedido.status](pedido.numero));
                  if (!link) return null;
                  return (
                    <a
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Avisar cliente via WhatsApp"
                      className="flex items-center gap-1 text-green-600 hover:text-green-800 border border-green-200 px-2.5 py-1.5 rounded-lg text-sm"
                    >
                      <MessageCircle className="h-4 w-4" />
                    </a>
                  );
                })()}

                {pedido.clienteId && !pedido.itemGratisResgatado && pedido.status !== 'ENTREGUE' && pedido.status !== 'CANCELADO' && (
                  <button
                    onClick={() => handleLiberarResgate(pedido)}
                    title="Liberar o item grátis da fidelidade neste pedido, quando o cliente pedir por fora do checkout"
                    className="flex items-center gap-1 text-orange-600 hover:text-orange-800 border border-orange-200 px-2.5 py-1.5 rounded-lg text-sm"
                  >
                    <Gift className="h-4 w-4" /> <span>Liberar resgate</span>
                  </button>
                )}

                {pedido.status === 'RECEBIDO' && (
                  <button
                    onClick={() => handleAvancar(pedido, 'PREPARANDO')}
                    className="flex items-center space-x-1 bg-yellow-500 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-yellow-600"
                  >
                    <ChefHat className="h-4 w-4" /> <span>Preparar</span>
                  </button>
                )}

                {(pedido.status === 'PREPARANDO' || pedido.status === 'RECEBIDO') && (
                  <select
                    defaultValue=""
                    onChange={(e) => handleAssign(pedido, e.target.value)}
                    className="text-sm border border-gray-300 rounded-lg px-2 py-1.5"
                  >
                    <option value="" disabled>Atribuir motoboy…</option>
                    {motoboys.map((m) => (
                      <option key={m.id} value={m.id}>{m.nome} (R$ {m.taxaPadrao.toFixed(2)})</option>
                    ))}
                  </select>
                )}

                {pedido.status === 'PREPARANDO' && pedido.motoboyId && (
                  <button
                    onClick={() => handleAvancar(pedido, 'SAIU_ENTREGA')}
                    className="flex items-center space-x-1 bg-blue-500 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-blue-600"
                  >
                    <Truck className="h-4 w-4" /> <span>Saiu para entrega</span>
                  </button>
                )}

                {pedido.status === 'SAIU_ENTREGA' && (
                  <button
                    onClick={() => handleAvancar(pedido, 'ENTREGUE')}
                    className="flex items-center space-x-1 bg-green-500 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-green-600"
                  >
                    <CheckCircle2 className="h-4 w-4" /> <span>Confirmar entrega</span>
                  </button>
                )}

                {pedido.status !== 'ENTREGUE' && pedido.status !== 'CANCELADO' && (
                  <button onClick={() => handleCancelar(pedido)} className="text-sm text-red-600 hover:text-red-800 px-2">
                    Cancelar
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {!loading && filtrados.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>Nenhum pedido nesta situação</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PedidosTab;
