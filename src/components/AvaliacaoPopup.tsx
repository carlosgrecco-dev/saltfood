import React, { useEffect, useRef, useState } from 'react';
import { Bike, CheckCircle2, ExternalLink, Send, Star, Camera, X, Loader2, UtensilsCrossed, Package, Timer } from 'lucide-react';
import BottomSheet from './BottomSheet';
import StarRating from './StarRating';
import { useTenant } from '../context/TenantContext';
import { useCustomer } from '../context/CustomerContext';
import { avaliarPedido, avaliarMotoboy } from '../lib/pedidos';
import { uploadImagemComToken } from '../lib/upload';
import { getClienteSession } from '../lib/clienteSession';
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
  fotosExistentes?: string[];
  fotos?: string[];
  onAddFoto?: (file: File) => void;
  onRemoveFoto?: (url: string) => void;
  uploadingFoto?: boolean;
  extraExistente?: React.ReactNode;
  extraDraft?: React.ReactNode;
}> = ({
  titulo, icon, notaAtual, comentarioAtual, draft, onDraftChange, onSubmit, submitting,
  fotosExistentes, fotos, onAddFoto, onRemoveFoto, uploadingFoto, extraExistente, extraDraft,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (notaAtual) {
    return (
      <div>
        <p className="text-xs text-gray-500 mb-1 flex items-center gap-1.5">{icon} {titulo}</p>
        <StarRating value={notaAtual} readOnly size="sm" />
        {comentarioAtual && <p className="text-xs text-gray-500 mt-1 italic">"{comentarioAtual}"</p>}
        {fotosExistentes && fotosExistentes.length > 0 && (
          <div className="flex gap-1.5 mt-2">
            {fotosExistentes.map((url) => (
              <img key={url} src={url} alt="Foto da avaliação" className="h-14 w-14 rounded-lg object-cover" />
            ))}
          </div>
        )}
        {extraExistente}
      </div>
    );
  }

  return (
    <div>
      <p className="text-sm text-gray-700 font-semibold mb-1.5 flex items-center gap-1.5">{icon} {titulo}</p>
      <StarRating value={draft.rating} onChange={(rating) => onDraftChange({ ...draft, rating })} size="md" />
      {draft.rating > 0 && (
        <div className="mt-2 space-y-2">
          {extraDraft}
          <div className="flex gap-2">
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

          {onAddFoto && (
            <div className="flex items-center gap-2">
              {fotos?.map((url) => (
                <div key={url} className="relative">
                  <img src={url} alt="Foto anexada" className="h-12 w-12 rounded-lg object-cover" />
                  <button
                    onClick={() => onRemoveFoto?.(url)}
                    className="absolute -top-1.5 -right-1.5 bg-gray-800 text-white rounded-full p-0.5"
                    aria-label="Remover foto"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </div>
              ))}
              {(fotos?.length ?? 0) < 3 && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingFoto}
                  className="flex h-12 w-12 items-center justify-center rounded-lg border-2 border-dashed border-gray-300 text-gray-400 hover:border-orange-400 hover:text-orange-500 transition-colors disabled:opacity-50"
                  aria-label="Anexar foto"
                >
                  {uploadingFoto ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) onAddFoto(file);
                  e.target.value = '';
                }}
              />
            </div>
          )}
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
  const [fotos, setFotos] = useState<string[]>([]);
  const [uploadingFoto, setUploadingFoto] = useState(false);
  const [notaComida, setNotaComida] = useState(0);
  const [notaEmbalagem, setNotaEmbalagem] = useState(0);
  const [notaTempo, setNotaTempo] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setPedidoDraft(emptyDraft);
      setMotoboyDraft(emptyDraft);
      setError('');
      setFotos([]);
      setNotaComida(0);
      setNotaEmbalagem(0);
      setNotaTempo(0);
    }
  }, [isOpen, pedido.id]);

  const handleAddFoto = async (file: File) => {
    const session = getClienteSession(empresa.id);
    if (!session) return;
    setUploadingFoto(true);
    setError('');
    try {
      const url = await uploadImagemComToken(file, session.token);
      setFotos((prev) => [...prev, url]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível enviar a foto.');
    } finally {
      setUploadingFoto(false);
    }
  };

  const handleRemoveFoto = (url: string) => {
    setFotos((prev) => prev.filter((f) => f !== url));
  };

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
      const atualizado = await avaliarPedido(empresa.id, pedido.id, pedidoDraft.rating, {
        comentario: pedidoDraft.comment,
        fotos,
        ...(empresa.habilitarAvaliacaoDetalhada && notaComida > 0 ? { notaComida } : {}),
        ...(empresa.habilitarAvaliacaoDetalhada && notaEmbalagem > 0 ? { notaEmbalagem } : {}),
        ...(empresa.habilitarAvaliacaoDetalhada && notaTempo > 0 ? { notaTempo } : {}),
      });
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
          fotosExistentes={pedido.fotosAvaliacao}
          fotos={fotos}
          onAddFoto={empresa.habilitarAvaliacaoComFotos ? handleAddFoto : undefined}
          onRemoveFoto={handleRemoveFoto}
          uploadingFoto={uploadingFoto}
          extraExistente={empresa.habilitarAvaliacaoDetalhada && (pedido.notaComida || pedido.notaEmbalagem || pedido.notaTempo) ? (
            <div className="flex flex-wrap gap-3 mt-2">
              {pedido.notaComida != null && (
                <span className="flex items-center gap-1 text-[11px] text-gray-500"><UtensilsCrossed className="h-3 w-3" /> Comida: {pedido.notaComida}/5</span>
              )}
              {pedido.notaEmbalagem != null && (
                <span className="flex items-center gap-1 text-[11px] text-gray-500"><Package className="h-3 w-3" /> Embalagem: {pedido.notaEmbalagem}/5</span>
              )}
              {pedido.notaTempo != null && (
                <span className="flex items-center gap-1 text-[11px] text-gray-500"><Timer className="h-3 w-3" /> Tempo: {pedido.notaTempo}/5</span>
              )}
            </div>
          ) : undefined}
          extraDraft={empresa.habilitarAvaliacaoDetalhada ? (
            <div className="space-y-1.5 border-t border-gray-100 pt-2">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs text-gray-600"><UtensilsCrossed className="h-3.5 w-3.5" /> Comida</span>
                <StarRating value={notaComida} onChange={setNotaComida} size="sm" />
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs text-gray-600"><Package className="h-3.5 w-3.5" /> Embalagem</span>
                <StarRating value={notaEmbalagem} onChange={setNotaEmbalagem} size="sm" />
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs text-gray-600"><Timer className="h-3.5 w-3.5" /> Tempo de entrega</span>
                <StarRating value={notaTempo} onChange={setNotaTempo} size="sm" />
              </div>
            </div>
          ) : undefined}
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
