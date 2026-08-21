import React, { useState } from 'react';
import { Coins, Loader2, X, Eye, EyeOff } from 'lucide-react';
import { useCustomer } from '../context/CustomerContext';
import { useTenant } from '../context/TenantContext';
import { vincularContaPlataforma } from '../lib/clientes';
import { getClienteId } from '../lib/clienteSession';

interface VincularContaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/** Aparece quando o backend sinaliza contaPlataformaDetectada — já existe uma conta SaltFood Coins
 * com este e-mail em outra loja, mas ninguém provou ainda que é a mesma pessoa. Pede a senha usada
 * lá (não a desta loja) pra confirmar o vínculo — nunca vincula só por bater o e-mail. */
const VincularContaModal: React.FC<VincularContaModalProps> = ({ isOpen, onClose }) => {
  const { customer, refreshCustomer } = useCustomer();
  const { empresa } = useTenant();
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !customer) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const clienteId = getClienteId(empresa.id);
    if (!clienteId) return;

    setLoading(true);
    try {
      await vincularContaPlataforma(empresa.id, clienteId, customer.email, senha);
      await refreshCustomer();
      setSenha('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível vincular');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={loading ? undefined : onClose} />

      <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 disabled:opacity-50"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-100">
          <Coins className="h-5 w-5 text-amber-600" />
        </div>

        <h3 className="mt-4 text-lg font-bold text-gray-900">Vincular SaltFood Coins</h3>
        <p className="mt-1.5 text-sm text-gray-500">
          Encontramos uma conta SaltFood com o e-mail <span className="font-semibold text-gray-700">{customer.email}</span> em
          outra loja. Informe a senha que você usa lá pra unificar o saldo de coins.
        </p>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div className="relative">
            <input
              type={mostrarSenha ? 'text' : 'password'}
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="Senha da outra loja"
              autoFocus
              required
              className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 pr-10 text-sm text-gray-900 placeholder:text-gray-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
            <button
              type="button"
              onClick={() => setMostrarSenha((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {mostrarSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-100 disabled:opacity-50 transition-colors"
            >
              Agora não
            </button>
            <button
              type="submit"
              disabled={loading || !senha}
              className="flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-amber-600 disabled:opacity-60 transition-colors"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Vincular
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VincularContaModal;
