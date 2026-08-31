import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  /** No mobile, 'auto' cresce com o conteúdo (até 92vh) e 'full' ocupa a tela toda; a partir de
   * sm: ambos viram um painel lateral com a altura cheia da tela — 'full' só fica mais largo. */
  height?: 'auto' | 'full';
  /** esconde o cabeçalho padrão (usado quando o conteúdo já tem seu próprio cabeçalho, ex: tela de sucesso) */
  hideHeader?: boolean;
  /** usado para empilhar um sheet sobre outro, ex: checkout aberto sobre o carrinho */
  zIndexClass?: string;
}

const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  children,
  title,
  height = 'auto',
  hideHeader = false,
  zIndexClass = 'z-50',
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 ${zIndexClass} flex items-end justify-center sm:items-stretch sm:justify-end`}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div
        className={`relative w-full bg-white shadow-2xl flex flex-col animate-slide-up sm:animate-slide-in-right
          sm:h-full sm:max-h-none
          rounded-t-3xl sm:rounded-tr-none sm:rounded-bl-3xl
          ${height === 'full' ? 'h-[100dvh] sm:max-w-3xl' : 'max-h-[92vh] sm:max-w-lg'}
        `}
      >
        {/* Alça de arrastar (só em telas pequenas, indica gesto de fechar) */}
        <div className="flex justify-center pt-2.5 pb-1 sm:hidden shrink-0">
          <div className="w-10 h-1.5 rounded-full bg-gray-300" />
        </div>

        {!hideHeader && title && (
          <div className="flex items-center justify-between px-6 py-3 border-b border-gray-100 shrink-0">
            <h2 className="text-xl font-bold text-gray-800">{title}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-full p-1.5 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto overscroll-contain">{children}</div>
      </div>
    </div>
  );
};

export default BottomSheet;
