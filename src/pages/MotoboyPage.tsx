import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, Bike, Loader2, Lock, LogOut, Phone, RefreshCcw, CheckCircle2, Truck, MapPin, Navigation, NavigationOff, Camera,
} from 'lucide-react';
import { loginMotoboy, updateMotoboyLocalizacao, setMotoboyDisponibilidade } from '../lib/motoboysApi';
import { getMotoboySession, saveMotoboySession, clearMotoboySession } from '../lib/motoboySession';
import { fetchPedidos, updatePedidoStatus } from '../lib/pedidos';
import { uploadImagemComToken } from '../lib/upload';
import { Pedido } from '../types/Pedido';
import { FORMA_PAGAMENTO_LABELS } from '../types/Pedido';
import { MotoboySession } from '../types/Motoboy';
import { useTenant } from '../context/TenantContext';
import Header from '../components/Header';
import MotoboyDashboard from '../components/MotoboyDashboard';

const POLL_INTERVAL_MS = 12000;

const MotoboyPage: React.FC = () => {
  const { slug, empresa } = useTenant();
  const [session, setSession] = useState<MotoboySession | null>(() => getMotoboySession(empresa.id));

  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(false);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [fotosEntrega, setFotosEntrega] = useState<Record<string, string>>({});
  const [uploadingFotoId, setUploadingFotoId] = useState<string | null>(null);
  const [togglingDisponibilidade, setTogglingDisponibilidade] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { kind?: string; empresaId?: string } | undefined;
      if (detail?.kind === 'motoboy' && detail.empresaId === empresa.id) {
        setSession(null);
        setPedidos([]);
      }
    };
    window.addEventListener('kifood:session-expired', handler);
    return () => window.removeEventListener('kifood:session-expired', handler);
  }, [empresa.id]);

  const loadPedidos = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    try {
      setPedidos(await fetchPedidos(empresa.id, { motoboyId: session.motoboyId }));
    } catch {
      setPedidos([]);
    } finally {
      setLoading(false);
    }
  }, [session, empresa.id]);

  useEffect(() => {
    loadPedidos();
    const interval = setInterval(loadPedidos, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [loadPedidos]);

  const emAndamento = pedidos.filter((p) => p.status === 'SAIU_ENTREGA');

  const [locationStatus, setLocationStatus] = useState<'idle' | 'sharing' | 'error' | 'unsupported'>('idle');
  const watchIdRef = useRef<number | null>(null);
  const lastSentAtRef = useRef(0);

  useEffect(() => {
    if (!session || emAndamento.length === 0) {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      setLocationStatus('idle');
      return;
    }

    if (!('geolocation' in navigator)) {
      setLocationStatus('unsupported');
      return;
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        setLocationStatus('sharing');
        const now = Date.now();
        if (now - lastSentAtRef.current < 15000) return;
        lastSentAtRef.current = now;
        updateMotoboyLocalizacao(empresa.id, session.motoboyId, position.coords.latitude, position.coords.longitude).catch(() => {});
      },
      () => setLocationStatus('error'),
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 20000 },
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [session, emAndamento.length, empresa.id]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);
    try {
      const motoboy = await loginMotoboy(empresa.id, phone, pin);
      const novaSessao: MotoboySession = {
        motoboyId: motoboy.id, motoboyNome: motoboy.nome, empresaId: empresa.id, token: motoboy.token, disponivel: motoboy.disponivel,
      };
      saveMotoboySession(novaSessao);
      setSession(novaSessao);
      setPhone('');
      setPin('');
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : 'Telefone ou PIN incorretos');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    clearMotoboySession(empresa.id);
    setSession(null);
    setPedidos([]);
  };

  const handleConfirm = async (pedidoId: string) => {
    setConfirmingId(pedidoId);
    try {
      await updatePedidoStatus(empresa.id, pedidoId, 'ENTREGUE', fotosEntrega[pedidoId]);
      setFotosEntrega((prev) => {
        const { [pedidoId]: _removida, ...resto } = prev;
        return resto;
      });
      loadPedidos();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Não foi possível confirmar a entrega.');
    } finally {
      setConfirmingId(null);
    }
  };

  const handleFotoEntrega = async (pedidoId: string, file: File) => {
    if (!session) return;
    setUploadingFotoId(pedidoId);
    try {
      const url = await uploadImagemComToken(file, session.token);
      setFotosEntrega((prev) => ({ ...prev, [pedidoId]: url }));
    } catch {
      alert('Não foi possível enviar a foto. Tente de novo.');
    } finally {
      setUploadingFotoId(null);
    }
  };

  const handleToggleDisponibilidade = async () => {
    if (!session) return;
    const novoValor = !session.disponivel;
    setTogglingDisponibilidade(true);
    try {
      await setMotoboyDisponibilidade(empresa.id, session.motoboyId, novoValor);
      const novaSessao = { ...session, disponivel: novoValor };
      saveMotoboySession(novaSessao);
      setSession(novaSessao);
    } catch {
      /* falha silenciosa — o toggle continua refletindo o último estado confirmado pelo servidor */
    } finally {
      setTogglingDisponibilidade(false);
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-6 sm:p-8">
            <Link to={`/${slug}`} className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 mb-6">
              <ArrowLeft className="h-4 w-4" /> Voltar para a loja
            </Link>
            <div className="flex items-center gap-2 mb-1">
              <Bike className="h-5 w-5 text-orange-600" />
              <h1 className="text-xl font-bold text-gray-800">Área do Motoboy</h1>
            </div>
            <p className="text-sm text-gray-500 mb-6">Entre com o telefone cadastrado e o PIN que o admin te passou.</p>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-gray-700 font-medium mb-2 text-sm">Telefone</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(73) 99999-9999"
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 bg-gray-50 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2 text-sm">PIN</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={6}
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="PIN de 4 a 6 dígitos"
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 bg-gray-50 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                    required
                  />
                </div>
              </div>

              {loginError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{loginError}</div>
              )}

              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-3.5 rounded-xl font-bold hover:from-orange-600 hover:to-red-600 disabled:opacity-60 transition-all duration-200 flex items-center justify-center space-x-2"
              >
                {isLoggingIn && <Loader2 className="h-5 w-5 animate-spin" />}
                <span>Entrar</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <div className="max-w-2xl mx-auto p-5 sm:p-8 w-full flex-1">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link to={`/${slug}`} className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 mb-1">
              <ArrowLeft className="h-4 w-4" /> Voltar para a loja
            </Link>
            <h1 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <Bike className="h-5 w-5 text-orange-600" /> Olá, {session.motoboyNome}
            </h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={loadPedidos}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 p-2 rounded-xl transition-colors"
              title="Atualizar"
            >
              <RefreshCcw className="h-5 w-5" />
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-xl transition-colors text-sm"
            >
              <LogOut className="h-4 w-4" /> Sair
            </button>
          </div>
        </div>

        <button
          onClick={handleToggleDisponibilidade}
          disabled={togglingDisponibilidade}
          className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold mb-6 transition-colors disabled:opacity-60 ${
            session.disponivel ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
          }`}
        >
          <span className={`h-2 w-2 rounded-full ${session.disponivel ? 'bg-green-500' : 'bg-gray-400'}`} />
          {session.disponivel ? 'Disponível para corridas' : 'Indisponível no momento'}
        </button>

        {loading && <p className="text-gray-500 mb-4">Carregando...</p>}

        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-gray-700 flex items-center gap-2">
            <Truck className="h-4 w-4 text-blue-600" /> Em rota de entrega
          </h2>
          {emAndamento.length > 0 && (
            <span
              className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
                locationStatus === 'sharing'
                  ? 'bg-green-100 text-green-700'
                  : locationStatus === 'error' || locationStatus === 'unsupported'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-gray-100 text-gray-500'
              }`}
            >
              {locationStatus === 'sharing' ? <Navigation className="h-3 w-3" /> : <NavigationOff className="h-3 w-3" />}
              {locationStatus === 'sharing' && 'Compartilhando localização'}
              {locationStatus === 'error' && 'Permita a localização no navegador'}
              {locationStatus === 'unsupported' && 'Localização indisponível'}
              {locationStatus === 'idle' && 'Aguardando GPS...'}
            </span>
          )}
        </div>
        <div className="space-y-3 mb-8">
          {emAndamento.map((p) => (
            <div key={p.id} className="bg-white border border-blue-200 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs font-bold text-orange-600">#{String(p.numero).padStart(4, '0')}</span>
                <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-purple-100 text-purple-800">
                  {FORMA_PAGAMENTO_LABELS[p.formaPagamento]}
                </span>
              </div>
              <p className="font-bold text-gray-800">{p.clienteNome}</p>
              <p className="text-sm text-gray-500 flex items-start gap-1 mt-0.5">
                <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                {p.endereco}{p.bairro ? ` - ${p.bairro}` : ''}
                {p.referencia ? ` (${p.referencia})` : ''}
              </p>
              <p className="text-sm text-gray-500">{p.clienteTelefone}</p>
              <p className="font-bold text-orange-600 mt-1">R$ {p.total.toFixed(2)}</p>

              <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                {fotosEntrega[p.id] ? (
                  <div className="flex items-center gap-2">
                    <img src={fotosEntrega[p.id]} alt="Comprovante de entrega" className="h-12 w-12 rounded-lg object-cover" />
                    <label className="text-xs text-gray-500 hover:text-gray-700 cursor-pointer">
                      Trocar foto
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFotoEntrega(p.id, f); e.target.value = ''; }}
                      />
                    </label>
                  </div>
                ) : (
                  <label className="flex items-center justify-center gap-1.5 w-full bg-gray-50 hover:bg-gray-100 text-gray-600 text-sm px-4 py-2 rounded-xl cursor-pointer transition-colors">
                    {uploadingFotoId === p.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                    {uploadingFotoId === p.id ? 'Enviando foto...' : 'Foto do comprovante (opcional)'}
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      disabled={uploadingFotoId === p.id}
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFotoEntrega(p.id, f); e.target.value = ''; }}
                    />
                  </label>
                )}
                <button
                  onClick={() => handleConfirm(p.id)}
                  disabled={confirmingId === p.id}
                  className="w-full flex items-center justify-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-sm px-4 py-2.5 rounded-xl disabled:opacity-60"
                >
                  <CheckCircle2 className="h-4 w-4" /> {confirmingId === p.id ? 'Confirmando...' : 'Confirmar entrega'}
                </button>
              </div>
            </div>
          ))}

          {emAndamento.length === 0 && !loading && (
            <p className="text-center text-gray-400 py-6 text-sm">Nenhuma entrega em rota no momento.</p>
          )}
        </div>

        <MotoboyDashboard empresaId={empresa.id} motoboyId={session.motoboyId} pedidos={pedidos} />
      </div>
    </div>
  );
};

export default MotoboyPage;
