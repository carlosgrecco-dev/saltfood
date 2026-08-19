import React, { Suspense, lazy, useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Package, Bike, MessageCircle, Loader2, AlertTriangle, Radio, Layers, CalendarClock } from 'lucide-react';
import Header from '../components/Header';
import OrderTimeline from '../components/OrderTimeline';
import AvaliacaoPopup from '../components/AvaliacaoPopup';
import AtivarNotificacoesButton from '../components/AtivarNotificacoesButton';
import NotificacaoBell from '../components/NotificacaoBell';

const LiveTrackingMap = lazy(() => import('../components/LiveTrackingMap'));
import { useTenant } from '../context/TenantContext';
import { useCustomer } from '../context/CustomerContext';
import { fetchPedidoById } from '../lib/pedidos';
import { Pedido, STATUS_PEDIDO_LABELS, FORMA_PAGAMENTO_LABELS } from '../types/Pedido';
import { onlyDigits } from '../lib/masks';

const POLL_INTERVAL_MS = 8000;

const PedidoAcompanhamentoPage: React.FC = () => {
  const { slug, empresa } = useTenant();
  const { customer } = useCustomer();
  const { pedidoId = '' } = useParams<{ pedidoId: string }>();
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [avaliacaoOpen, setAvaliacaoOpen] = useState(false);
  const [avaliacaoDismissed, setAvaliacaoDismissed] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await fetchPedidoById(empresa.id, pedidoId);
      setPedido(data);
      setError('');
    } catch {
      setError('Não foi possível encontrar este pedido.');
    } finally {
      setLoading(false);
    }
  }, [empresa.id, pedidoId]);

  useEffect(() => {
    load();
    const interval = setInterval(load, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [load]);

  // Ao finalizar a entrega (pelo motoboy), abre o popup de avaliação — fica visível até ser respondido ou fechado.
  useEffect(() => {
    if (!pedido || !customer || avaliacaoDismissed) return;
    if (pedido.clienteId !== customer.id || pedido.status !== 'ENTREGUE') return;
    const faltaAvaliarPedido = !pedido.notaPedido;
    const faltaAvaliarMotoboy = !!pedido.motoboyId && !pedido.notaMotoboy;
    if (faltaAvaliarPedido || faltaAvaliarMotoboy) {
      setAvaliacaoOpen(true);
    }
  }, [pedido, customer, avaliacaoDismissed]);

  const whatsappUrl = (() => {
    const digits = onlyDigits(empresa.telefone);
    if (!digits) return null;
    const numero = digits.startsWith('55') ? digits : `55${digits}`;
    const texto = pedido ? `Olá! Gostaria de falar sobre o meu pedido #${pedido.numero}.` : 'Olá!';
    return `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`;
  })();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header rightExtra={<NotificacaoBell />} />
      <div className="max-w-xl mx-auto p-5 sm:p-8 w-full flex-1">
        <Link
          to={`/${slug}`}
          className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 mb-6"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar para a loja
        </Link>

        {loading && (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        )}

        {!loading && error && (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <AlertTriangle className="h-8 w-8 text-red-400" />
            <p className="text-gray-600">{error}</p>
          </div>
        )}

        {!loading && pedido && (
          <div className="bg-white border border-gray-100 rounded-3xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-1">
              <h1 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Package className="h-5 w-5 text-[var(--cor-primaria)]" /> Pedido #{pedido.numero}
              </h1>
              <span className="text-xs font-bold uppercase tracking-wide text-[var(--cor-primaria)]">
                {STATUS_PEDIDO_LABELS[pedido.status]}
              </span>
            </div>
            <p className="text-sm text-gray-400 mb-3">
              Feito em {new Date(pedido.createdAt).toLocaleString('pt-BR')}
            </p>

            {pedido.agendadoPara && (
              <p className="flex items-center gap-1.5 text-sm text-blue-700 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2 mb-3">
                <CalendarClock className="h-4 w-4 shrink-0" />
                Agendado para {new Date(pedido.agendadoPara).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
              </p>
            )}

            {pedido.status !== 'ENTREGUE' && pedido.status !== 'CANCELADO' && (
              <div className="mb-6">
                <AtivarNotificacoesButton empresaId={empresa.id} pedidoId={pedido.id} />
              </div>
            )}

            <div className="mb-6">
              <OrderTimeline order={pedido} />
            </div>

            {pedido.motoboy && (pedido.status === 'SAIU_ENTREGA' || pedido.status === 'ENTREGUE') && (
              <div className="mb-6">
                <div className="flex items-center gap-2.5 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 mb-3">
                  <Bike className="h-4 w-4 text-blue-600 shrink-0" />
                  <p className="text-sm text-blue-800">
                    <strong>{pedido.motoboy.nome}</strong> está com a sua entrega.
                  </p>
                </div>

                {pedido.status === 'SAIU_ENTREGA' && (
                  pedido.motoboy.latitudeAtual != null && pedido.motoboy.longitudeAtual != null ? (
                    <div>
                      <Suspense fallback={<div className="w-full h-56 rounded-xl bg-gray-100 animate-pulse" />}>
                        <LiveTrackingMap
                          latitude={pedido.motoboy.latitudeAtual}
                          longitude={pedido.motoboy.longitudeAtual}
                          label={pedido.motoboy.nome}
                          corPrimaria={empresa.corPrimaria}
                        />
                      </Suspense>
                      <p className="flex items-center gap-1.5 text-[11px] text-gray-400 mt-1.5">
                        <Radio className="h-3 w-3 animate-pulse text-green-500" />
                        Localização em tempo real · atualiza a cada {POLL_INTERVAL_MS / 1000}s
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 text-center py-3">Aguardando o motoboy compartilhar a localização...</p>
                  )
                )}

                {pedido.status === 'ENTREGUE' && pedido.fotoEntrega && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1.5">Comprovante de entrega</p>
                    <img src={pedido.fotoEntrega} alt="Comprovante de entrega" className="w-full max-h-64 object-cover rounded-xl" />
                  </div>
                )}
              </div>
            )}

            <div className="border-t border-gray-100 pt-4 space-y-1 mb-4">
              {pedido.itens.map((item) => (
                <div key={item.id} className="text-sm text-gray-600">
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
                    <ul className="text-xs text-gray-400 pl-3">
                      {item.opcoesSelecionadas.map((opt) => (
                        <li key={opt.id}>
                          + {opt.nomeOpcao}
                          {opt.precoAdicional > 0 && ` (+R$ ${opt.precoAdicional.toFixed(2)})`}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>

            <div className="border-t border-gray-100 pt-4 flex items-center justify-between">
              <div className="text-xs text-gray-500">
                <p>{pedido.endereco}{pedido.bairro ? ` - ${pedido.bairro}` : ''}</p>
                <p>{FORMA_PAGAMENTO_LABELS[pedido.formaPagamento]}</p>
              </div>
              <p className="font-bold text-lg text-[var(--cor-primaria)]">R$ {pedido.total.toFixed(2)}</p>
            </div>

            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 flex items-center justify-center gap-2 w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl font-bold text-sm transition-colors"
              >
                <MessageCircle className="h-4 w-4" /> Falar com {empresa.nome} no WhatsApp
              </a>
            )}
          </div>
        )}
      </div>

      {pedido && (
        <AvaliacaoPopup
          isOpen={avaliacaoOpen}
          pedido={pedido}
          onClose={() => { setAvaliacaoOpen(false); setAvaliacaoDismissed(true); }}
          onUpdated={setPedido}
        />
      )}
    </div>
  );
};

export default PedidoAcompanhamentoPage;
