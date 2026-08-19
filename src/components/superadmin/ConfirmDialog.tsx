import React from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  tone?: 'danger' | 'default';
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  description,
  confirmLabel = 'Confirmar',
  tone = 'default',
  loading = false,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  const confirmClasses = tone === 'danger'
    ? 'bg-red-600 hover:bg-red-700 focus-visible:ring-red-500'
    : 'bg-orange-500 hover:bg-orange-600 focus-visible:ring-orange-500';

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={loading ? undefined : onCancel} />

      <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl animate-scale-in">
        <div className={`flex h-11 w-11 items-center justify-center rounded-full ${tone === 'danger' ? 'bg-red-100' : 'bg-orange-100'}`}>
          <AlertTriangle className={`h-5 w-5 ${tone === 'danger' ? 'text-red-600' : 'text-orange-500'}`} />
        </div>

        <h3 className="mt-4 text-lg font-bold text-gray-900">{title}</h3>
        <p className="mt-1.5 text-sm text-gray-500">{description}</p>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-100 disabled:opacity-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${confirmClasses}`}
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
