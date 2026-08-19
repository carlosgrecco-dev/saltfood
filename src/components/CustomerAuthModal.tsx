import React, { useEffect, useState } from 'react';
import { Mail, Lock, User, Phone, Loader2, Gift } from 'lucide-react';
import BottomSheet from './BottomSheet';
import { signUpCliente, loginCliente } from '../lib/clientes';
import { useCustomer } from '../context/CustomerContext';
import { useTenant } from '../context/TenantContext';

interface CustomerAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Mode = 'login' | 'signup';

/** Link de indicação chega como ?ref=CODIGO — pré-preenche o campo pra quem clicou não precisar digitar. */
const codigoIndicacaoDaUrl = () => new URLSearchParams(window.location.search).get('ref') ?? '';

const CustomerAuthModal: React.FC<CustomerAuthModalProps> = ({ isOpen, onClose }) => {
  const { setCustomerSession } = useCustomer();
  const { empresa } = useTenant();
  const [mode, setMode] = useState<Mode>('login');
  const [form, setForm] = useState({ name: '', phone: '', email: '', password: '', referral: '' });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const codigo = codigoIndicacaoDaUrl();
    if (codigo) {
      setForm((f) => ({ ...f, referral: codigo }));
      setMode('signup');
    }
  }, []);

  const resetAndClose = () => {
    setForm({ name: '', phone: '', email: '', password: '', referral: '' });
    setError('');
    setMode('login');
    onClose();
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const cliente = await loginCliente(empresa.id, form.email, form.password);
      setCustomerSession(cliente);
      resetAndClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível entrar.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const cliente = await signUpCliente(empresa.id, {
        nome: form.name,
        telefone: form.phone,
        email: form.email,
        senha: form.password,
        indicadoPor: form.referral.trim() || undefined,
      });
      setCustomerSession(cliente);
      resetAndClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível criar sua conta.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={resetAndClose} title="Área do Cliente">
      <div className="p-5">
        <div className="flex bg-gray-100 rounded-xl p-1 mb-5">
          <button
            onClick={() => setMode('login')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              mode === 'login' ? 'bg-white shadow text-orange-600' : 'text-gray-500'
            }`}
          >
            Entrar
          </button>
          <button
            onClick={() => setMode('signup')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              mode === 'signup' ? 'bg-white shadow text-orange-600' : 'text-gray-500'
            }`}
          >
            Criar conta
          </button>
        </div>

        <form onSubmit={mode === 'login' ? handleLogin : handleSignup} className="space-y-4">
          {mode === 'signup' && (
            <>
              <div>
                <label className="block text-gray-700 font-medium mb-1 text-sm">Nome completo</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-200 bg-gray-50 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-1 text-sm">Telefone</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    required
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="(73) 99999-9999"
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-200 bg-gray-50 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-1 text-sm">
                  Código de indicação <span className="font-normal text-gray-400">(opcional)</span>
                </label>
                <div className="relative">
                  <Gift className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    value={form.referral}
                    onChange={(e) => setForm({ ...form, referral: e.target.value.toUpperCase() })}
                    placeholder="Ex: AB12CD"
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-200 bg-gray-50 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent uppercase"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-gray-700 font-medium mb-1 text-sm">E-mail</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                required
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 bg-gray-50 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-1 text-sm">Senha</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                required
                type="password"
                minLength={6}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 bg-gray-50 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-3.5 rounded-xl font-bold hover:from-orange-600 hover:to-red-600 disabled:opacity-60 transition-all duration-200 flex items-center justify-center space-x-2"
          >
            {isSubmitting && <Loader2 className="h-5 w-5 animate-spin" />}
            <span>{mode === 'login' ? 'Entrar' : 'Criar minha conta'}</span>
          </button>
        </form>
      </div>
    </BottomSheet>
  );
};

export default CustomerAuthModal;
