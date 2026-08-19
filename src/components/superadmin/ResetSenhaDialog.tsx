import React, { useState } from 'react';
import { KeyRound, Loader2, Eye, EyeOff, X } from 'lucide-react';

interface ResetSenhaDialogProps {
  isOpen: boolean;
  empresaNome: string;
  loading?: boolean;
  error?: string;
  onConfirm: (senha: string) => void;
  onCancel: () => void;
}

const ResetSenhaDialog: React.FC<ResetSenhaDialogProps> = ({
  isOpen, empresaNome, loading = false, error, onConfirm, onCancel,
}) => {
  const [senha, setSenha] = useState('');
  const [showSenha, setShowSenha] = useState(false);

  if (!isOpen) return null;

  const senhaValida = senha.length >= 6;

  const handleClose = () => {
    setSenha('');
    onCancel();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={loading ? undefined : handleClose} />

      <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl animate-scale-in">
        <button
          onClick={handleClose}
          disabled={loading}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 disabled:opacity-50"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-orange-100">
          <KeyRound className="h-5 w-5 text-orange-500" />
        </div>

        <h3 className="mt-4 text-lg font-bold text-gray-900">Redefinir senha</h3>
        <p className="mt-1.5 text-sm text-gray-500">
          Defina uma nova senha de acesso para <span className="font-semibold text-gray-700">{empresaNome}</span>.
        </p>

        <div className="mt-4 relative">
          <input
            type={showSenha ? 'text' : 'password'}
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            placeholder="Nova senha (mín. 6 caracteres)"
            autoFocus
            className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 pr-10 text-sm text-gray-900 placeholder:text-gray-400 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
          />
          <button
            type="button"
            onClick={() => setShowSenha((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>

        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-100 disabled:opacity-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => onConfirm(senha)}
            disabled={loading || !senhaValida}
            className="flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-orange-600 disabled:opacity-60 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Redefinir senha
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResetSenhaDialog;
