import React, { useCallback, useEffect, useState } from 'react';
import { Bike, Package, MapPin, Loader2 } from 'lucide-react';
import { Motoboy, StatusMotoboyCalculado, STATUS_MOTOBOY_LABELS } from '../../types/Motoboy';
import { Pedido } from '../../types/Pedido';
import { fetchMotoboysAdminResumo } from '../../lib/motoboysApi';
import { fetchPedidos, assignMotoboy } from '../../lib/pedidos';
import MultiTrackingMap, { MapaMarcador } from '../MultiTrackingMap';

interface LogisticaTabProps {
  empresaId: string;
}

const POLL_MS = 15000;

const STATUS_BADGE_CLASS: Record<StatusMotoboyCalculado, string> = {
  DISPONIVEL: 'bg-emerald-100 text-emerald-800',
  EM_ENTREGA: 'bg-blue-100 text-blue-800',
  OFFLINE: 'bg-gray-100 text-gray-500',
  INATIVO: 'bg-red-100 text-red-700',
};

const STATUS_COR_MAPA: Record<StatusMotoboyCalculado, string> = {
  DISPONIVEL: '#10b981',
  EM_ENTREGA: '#3b82f6',
  OFFLINE: '#9ca3af',
  INATIVO: '#ef4444',
};

const LogisticaTab: React.FC<LogisticaTabProps> = ({ empresaId }) => {
  const [motoboys, setMotoboys] = useState<Motoboy[]>([]);
  const [aguardando, setAguardando] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [pedidoAtribuindo, setPedidoAtribuindo] = useState<string | null>(null);
  const [motoboyEscolhido, setMotoboyEscolhido] = useState('');
  const [processando, setProcessando] = useState(false);

  const load = useCallback(async () => {
    try {
      const [resumo, recebidos, preparando] = await Promise.all([
        fetchMotoboysAdminResumo(empresaId),
        fetchPedidos(empresaId, { tipoPedido: 'DELIVERY', status: 'RECEBIDO' }),
        fetchPedidos(empresaId, { tipoPedido: 'DELIVERY', status: 'PREPARANDO' }),
      ]);
      setMotoboys(resumo.motoboys.filter((m) => m.ativo));
      setAguardando([...recebidos, ...preparando].filter((p) => !p.motoboyId).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()));
    } catch {
      setMotoboys([]);
      setAguardando([]);
    } finally {
      setLoading(false);
    }
  }, [empresaId]);

  useEffect(() => {
    load();
    const id = setInterval(load, POLL_MS);
    return () => clearInterval(id);
  }, [load]);

  const disponiveis = motoboys.filter((m) => m.statusCalculado === 'DISPONIVEL');

  const handleAtribuir = async (pedidoId: string) => {
    if (!motoboyEscolhido) return;
    setProcessando(true);
    try {
      await assignMotoboy(empresaId, pedidoId, motoboyEscolhido);
      setPedidoAtribuindo(null);
      setMotoboyEscolhido('');
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Não foi possível atribuir o motoboy.');
    } finally {
      setProcessando(false);
    }
  };

  if (loading) return <p className="text-center text-gray-500 py-8 text-sm">Carregando...</p>;

  const marcadores: MapaMarcador[] = motoboys
    .filter((m) => m.latitudeAtual != null && m.longitudeAtual != null)
    .map((m) => ({
      id: m.id,
      latitude: m.latitudeAtual as number,
      longitude: m.longitudeAtual as number,
      cor: STATUS_COR_MAPA[m.statusCalculado || 'OFFLINE'],
      label: `${m.nome} · ${STATUS_MOTOBOY_LABELS[m.statusCalculado || 'OFFLINE']}`,
    }));

  return (
    <div>
      <div className="grid grid-cols-1 xl:grid-cols-[1.3fr_1fr] gap-4">
        <div className="bg-white border border-gray-200 rounded-2xl p-3">
          {marcadores.length > 0 ? (
            <MultiTrackingMap marcadores={marcadores} />
          ) : (
            <div className="h-[420px] flex items-center justify-center text-sm text-gray-400">Nenhum motoboy com localização ao vivo agora.</div>
          )}
        </div>

        <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
          <div>
            <p className="font-bold text-gray-800 flex items-center gap-1.5 mb-2"><Bike className="h-4 w-4 text-orange-500" /> Motoboys ativos agora ({motoboys.length})</p>
            <div className="space-y-1.5">
              {motoboys.map((m) => (
                <div key={m.id} className="flex items-center justify-between gap-2 border border-gray-100 rounded-lg px-3 py-2">
                  <span className="text-sm text-gray-800">{m.nome}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${STATUS_BADGE_CLASS[m.statusCalculado || 'OFFLINE']}`}>
                    {STATUS_MOTOBOY_LABELS[m.statusCalculado || 'OFFLINE']}
                  </span>
                </div>
              ))}
              {motoboys.length === 0 && <p className="text-xs text-gray-400 text-center py-4">Nenhum motoboy ativo.</p>}
            </div>
          </div>

          <div>
            <p className="font-bold text-gray-800 flex items-center gap-1.5 mb-2"><Package className="h-4 w-4 text-orange-500" /> Aguardando atribuição ({aguardando.length})</p>
            <div className="space-y-2">
              {aguardando.map((p) => (
                <div key={p.id} className="border border-amber-200 bg-amber-50/40 rounded-lg p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-gray-800">Pedido #{p.numero}</p>
                    {pedidoAtribuindo !== p.id && (
                      <button onClick={() => setPedidoAtribuindo(p.id)} className="text-xs font-medium bg-gray-800 hover:bg-gray-900 text-white px-2.5 py-1 rounded-lg">Atribuir</button>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5"><MapPin className="h-3 w-3 shrink-0" /> {p.bairro || p.endereco}</p>
                  {pedidoAtribuindo === p.id && (
                    <div className="flex items-center gap-2 mt-2">
                      <select value={motoboyEscolhido} onChange={(e) => setMotoboyEscolhido(e.target.value)} className="flex-1 px-2 py-1.5 border border-gray-300 rounded-lg text-xs bg-white">
                        <option value="">Escolha um motoboy...</option>
                        {disponiveis.map((m) => <option key={m.id} value={m.id}>{m.nome}</option>)}
                      </select>
                      <button onClick={() => handleAtribuir(p.id)} disabled={!motoboyEscolhido || processando} className="flex items-center gap-1 bg-orange-500 hover:bg-orange-600 text-white text-xs px-2.5 py-1.5 rounded-lg disabled:opacity-60">
                        {processando ? <Loader2 className="h-3 w-3 animate-spin" /> : null} OK
                      </button>
                    </div>
                  )}
                </div>
              ))}
              {aguardando.length === 0 && <p className="text-xs text-gray-400 text-center py-4">Nenhum pedido aguardando motoboy.</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogisticaTab;
