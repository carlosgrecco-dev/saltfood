import React, { useCallback, useEffect, useState } from 'react';
import { Bike, MapPin, Clock, Phone } from 'lucide-react';
import { Pedido } from '../../types/Pedido';
import { fetchPedidos } from '../../lib/pedidos';
import MultiTrackingMap, { MapaMarcador } from '../MultiTrackingMap';

interface EntregasTabProps {
  empresaId: string;
}

const POLL_MS = 15000;

const tempoDecorrido = (desde: string) => {
  const min = Math.floor((Date.now() - new Date(desde).getTime()) / 60000);
  if (min < 1) return 'agora mesmo';
  if (min < 60) return `${min} min`;
  return `${Math.floor(min / 60)}h ${min % 60}min`;
};

const EntregasTab: React.FC<EntregasTabProps> = ({ empresaId }) => {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const lista = await fetchPedidos(empresaId, { status: 'SAIU_ENTREGA' });
      setPedidos(lista.sort((a, b) => new Date(a.saiuEntregaEm || a.createdAt).getTime() - new Date(b.saiuEntregaEm || b.createdAt).getTime()));
    } catch {
      setPedidos([]);
    } finally {
      setLoading(false);
    }
  }, [empresaId]);

  useEffect(() => {
    load();
    const id = setInterval(load, POLL_MS);
    return () => clearInterval(id);
  }, [load]);

  if (loading) return <p className="text-center text-gray-500 py-8 text-sm">Carregando...</p>;

  const comLocalizacao = pedidos.filter((p) => p.motoboy?.latitudeAtual != null && p.motoboy?.longitudeAtual != null);
  const marcadores: MapaMarcador[] = comLocalizacao.map((p) => ({
    id: p.id,
    latitude: p.motoboy!.latitudeAtual as number,
    longitude: p.motoboy!.longitudeAtual as number,
    label: `${p.motoboy!.nome} · Pedido #${p.numero}`,
  }));

  return (
    <div>
      <div className="grid grid-cols-1 xl:grid-cols-[1.3fr_1fr] gap-4">
        <div className="bg-white border border-gray-200 rounded-2xl p-3">
          {marcadores.length > 0 ? (
            <MultiTrackingMap marcadores={marcadores} />
          ) : (
            <div className="h-[420px] flex items-center justify-center text-sm text-gray-400">
              Nenhum motoboy em rota com localização disponível agora.
            </div>
          )}
        </div>

        <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
          {pedidos.map((p) => (
            <div key={p.id} className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <p className="font-bold text-gray-800 flex items-center gap-1.5">
                  <Bike className="h-4 w-4 text-orange-500" /> Pedido #{p.numero}
                </p>
                <span className="text-xs text-gray-400 flex items-center gap-1"><Clock className="h-3 w-3" /> {p.saiuEntregaEm ? tempoDecorrido(p.saiuEntregaEm) : '—'}</span>
              </div>
              <p className="text-sm text-gray-600">{p.motoboy?.nome || 'Sem motoboy'}</p>
              <p className="text-xs text-gray-400 flex items-center gap-1 mt-1"><MapPin className="h-3 w-3 shrink-0" /> {p.endereco}{p.bairro ? `, ${p.bairro}` : ''}</p>
              <p className="text-xs text-gray-400 flex items-center gap-1"><Phone className="h-3 w-3 shrink-0" /> {p.clienteNome} · {p.clienteTelefone}</p>
              {!p.motoboy?.latitudeAtual && <p className="text-[11px] text-amber-600 mt-1">Sem localização ao vivo deste motoboy</p>}
            </div>
          ))}
          {pedidos.length === 0 && <p className="text-center text-gray-500 py-10 text-sm">Nenhum pedido saiu para entrega agora.</p>}
        </div>
      </div>
    </div>
  );
};

export default EntregasTab;
