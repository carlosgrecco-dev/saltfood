import React, { useEffect, useState } from 'react';
import { Bike, CheckCircle2, ExternalLink, Send, Star } from 'lucide-react';
import BottomSheet from './BottomSheet';
import StarRating from './StarRating';
import { useTenant } from '../context/TenantContext';
import { useCustomer } from '../context/CustomerContext';
import { avaliarPedido, avaliarMotoboy } from '../lib/pedidos';
import { Pedido } from '../types/Pedido';

interface AvaliacaoPopupProps {
  isOpen: boolean;
  pedido: Pedido;
  onClose: () => void;
  onUpdated: (pedido: Pedido) => void;
}

interface RatingDraft {
  rating: number;
  comment: string;
}

const RatingBlock: React.FC<{
  titulo: string;
  icon?: React.ReactNode;
  notaAtual: number | null;
  comentarioAtual: string | null;
  draft: RatingDraft;
  onDraftChange: (draft: RatingDraft) => void;
  onSubmit: () => void;
  submitting: boolean;
}> = ({ titulo, icon, notaAtual, comentarioAtual, draft, onDraftChange, onSubmit, submitting }) => {
  if (notaAtual) {
    return (
      <div>
        <p className="text-xs text-gray-500 mb-1 flex items-center gap-1.5">{icon} {titulo}</p>
        <StarRating value={notaAtual} readOnly size="sm" />
        {comentarioAtual && <p className="text-xs text-gray-500 mt-1 italic">"{comentarioAtual}"</p>}
      </div>
    );
  }

  return (
    <div>
      <p className="text-sm text-gray-700 font-semibold mb-1.5 flex items-center gap-1.5">{icon} {titulo}</p>
      <StarRating value={draft.rating} onChange={(rating) => onDraftChange({ ...draft, rating })} size="md" />
      {draft.rating > 0 && (
        <div className="mt-2 flex gap-2">
          <input
            value={draft.comment}
            onChange={(e) => onDraftChange({ ...draft, comment: e.target.value })}
            placeholder="Conte o motivo da nota (opcional)"
            className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
          <button
            onClick={onSubmit}
            disabled={submitting}
            className="bg-orange-500 hover:bg-orange-600 text-white px-3 rounded-lg disabled:opacity-60"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
};

const emptyDraft: RatingDraft = { rating: 0, comment: '' };

const AvaliacaoPopup: React.FC<AvaliacaoPopupProps> = ({ isOpen, pedido, onClose, onUpdated }) => {
  const { empresa } = useTenant();
  const { customer } = useCustomer();

  const [pedidoDraft, setPedidoDraft] = useState<RatingDraft>(emptyDraft);
  const [motoboyDraft, setMotoboyDraft] = useState<RatingDraft>(emptyDraft);
  const [submittingPedido, setSubmittingPedido] = useState(false);
  const [submittingMotoboy, setSubmittingMotoboy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setPedidoDraft(emptyDraft);
      setMotoboyDraft(emptyDraft);
      setError('');
    }
  }, [isOpen, pedido.id]);

  const pedidoAnswered = !!pedido.notaPedido;
  const motoboyAnswered = !pedido.motoboyId || !!pedido.notaMotoboy;
  const allAnswered = pedidoAnswered && motoboyAnswered;
  const mostrarConviteGoogle = allAnswered && !!empresa.googleBusinessReviewUrl && (pedido.notaPedido ?? 0) >= 4;

  useEffect(() => {
    if (isOpen && allAnswered && !mostrarConviteGoogle) {
      const timer = setTimeout(onClose, 1800);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, allAnswered, mostrarConviteGoogle]);

  if (!customer) return null;

  const handleSubmitPedido = async () => {
    if (!pedidoDraft.rating) return;
    setError('');
    setSubmittingPedido(true);
    try {
      const atualizado = await avaliarPedido(empresa.id, pedido.id, pedidoDraft.rating, pedidoDraft.comment);
      onUpdated(atualizado);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível enviar sua avaliação.');
    } finally {
      setSubmittingPedido(false);
    }
  };

  const handleSubmitMotoboy = async () => {
    if (!motoboyDraft.rating) return;
    setError('');
    setSubmittingMotoboy(true);
    try {
      const atualizado = await avaliarMotoboy(empresa.id, pedido.id, motoboyDraft.rating, motoboyDraft.comment);
      onUpdated(atualizado);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível enviar sua avaliação do motoboy.');
    } finally {
      setSubmittingMotoboy(false);
    }
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={`Pedido #${String(pedido.numero).padStart(4, '0')} entregue!`} zIndexClass="z-[70]">
      <div className="p-5 space-y-5">
        {allAnswered ? (
          <div className="text-center py-2">
            <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto mb-2" />
            <p className="font-bold text-gray-800">Obrigado pela sua avaliação!</p>
          </div>
        ) : (
          <p className="text-sm text-gray-500">Seu pedido foi entregue. Conte pra gente como foi a experiência.</p>
        )}

        <RatingBlock
          titulo="Avalie este pedido"
          notaAtual={pedido.notaPedido}
          comentarioAtual={pedido.comentarioPedido}
          draft={pedidoDraft}
          onDraftChange={setPedidoDraft}
          onSubmit={handleSubmitPedido}
          submitting={submittingPedido}
        />

        {pedido.motoboyId && (
          <RatingBlock
            titulo="Avalie o atendimento do motoboy"
            icon={<Bike className="h-3.5 w-3.5" />}
            notaAtual={pedido.notaMotoboy}
            comentarioAtual={pedido.comentarioMotoboy}
            draft={motoboyDraft}
            onDraftChange={setMotoboyDraft}
            onSubmit={handleSubmitMotoboy}
            submitting={submittingMotoboy}
          />
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        {mostrarConviteGoogle && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4">
            <p className="flex items-center gap-1.5 font-bold text-gray-800 text-sm mb-1">
              <Star className="h-4 w-4 text-amber-500" fill="#F59E0B" /> Que bom que gostou!
            </p>
            <p className="text-xs text-gray-600 mb-3">
              Ajude outras pessoas a conhecerem {empresa.nome}: avalie-nos também no Google.
            </p>
            <a
              href={empresa.googleBusinessReviewUrl || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 w-full bg-white border border-amber-300 text-amber-700 font-bold text-sm py-2.5 rounded-lg hover:bg-amber-50 transition-colors"
            >
              Avaliar no Google <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        )}

        {(allAnswered) && (
          <button
            onClick={onClose}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-xl font-bold text-sm transition-colors"
          >
            Fechar
          </button>
        )}
      </div>
    </BottomSheet>
  );
};

export default AvaliacaoPopup;
