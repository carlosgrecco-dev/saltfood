import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Star, MessageSquare, ThumbsUp, ImageIcon } from 'lucide-react';
import { Pedido } from '../../types/Pedido';
import { fetchPedidos } from '../../lib/pedidos';

interface AvaliacoesTabProps {
  empresaId: string;
}

const Estrelas: React.FC<{ nota: number | null; tamanho?: string }> = ({ nota, tamanho = 'h-4 w-4' }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((n) => (
      <Star key={n} className={`${tamanho} ${nota != null && n <= nota ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} />
    ))}
  </div>
);

const SubNota: React.FC<{ label: string; nota: number | null }> = ({ label, nota }) => {
  if (nota == null) return null;
  return (
    <span className="flex items-center gap-1 text-[11px] text-gray-500 bg-gray-50 border border-gray-100 rounded-full px-2 py-0.5">
      {label} <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" /> {nota}
    </span>
  );
};

const AvaliacoesTab: React.FC<AvaliacoesTabProps> = ({ empresaId }) => {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroNota, setFiltroNota] = useState<number | 'TODAS'>('TODAS');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const lista = await fetchPedidos(empresaId, { comAvaliacao: true });
      setPedidos(lista.sort((a, b) => new Date(b.avaliadoEm || b.createdAt).getTime() - new Date(a.avaliadoEm || a.createdAt).getTime()));
    } catch {
      setPedidos([]);
    } finally {
      setLoading(false);
    }
  }, [empresaId]);

  useEffect(() => {
    load();
  }, [load]);

  const filtrados = useMemo(
    () => (filtroNota === 'TODAS' ? pedidos : pedidos.filter((p) => p.notaPedido === filtroNota)),
    [pedidos, filtroNota]
  );

  const notaMedia = pedidos.length > 0 ? pedidos.reduce((s, p) => s + (p.notaPedido || 0), 0) / pedidos.length : 0;
  const positivas = pedidos.filter((p) => (p.notaPedido || 0) >= 4).length;
  const percentPositivas = pedidos.length > 0 ? (positivas / pedidos.length) * 100 : 0;

  const distribuicao = [5, 4, 3, 2, 1].map((n) => ({ nota: n, qtd: pedidos.filter((p) => p.notaPedido === n).length }));

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <p className="text-xs text-gray-500 flex items-center gap-1 mb-1"><Star className="h-3.5 w-3.5 text-amber-500" /> Nota média</p>
          <div className="flex items-center gap-2">
            <p className="text-2xl font-bold text-gray-800">{notaMedia.toFixed(1)}</p>
            <Estrelas nota={Math.round(notaMedia)} />
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <p className="text-xs text-gray-500 flex items-center gap-1 mb-1"><MessageSquare className="h-3.5 w-3.5 text-blue-500" /> Total de avaliações</p>
          <p className="text-2xl font-bold text-gray-800">{pedidos.length}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <p className="text-xs text-gray-500 flex items-center gap-1 mb-1"><ThumbsUp className="h-3.5 w-3.5 text-emerald-500" /> Positivas (4-5★)</p>
          <p className="text-2xl font-bold text-gray-800">{percentPositivas.toFixed(0)}%</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-4">
        <button onClick={() => setFiltroNota('TODAS')} className={`px-3 py-1.5 rounded-full text-xs font-medium ${filtroNota === 'TODAS' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
          Todas ({pedidos.length})
        </button>
        {distribuicao.map(({ nota, qtd }) => (
          <button
            key={nota}
            onClick={() => setFiltroNota(nota)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium ${filtroNota === nota ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            {nota} <Star className="h-3 w-3 fill-current" /> ({qtd})
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-center text-gray-500 py-8 text-sm">Carregando...</p>
      ) : (
        <div className="space-y-2.5">
          {filtrados.map((p) => (
            <div key={p.id} className="border border-gray-200 rounded-xl p-4">
              <div className="flex flex-wrap items-start justify-between gap-2 mb-1.5">
                <div>
                  <p className="font-bold text-gray-800 text-sm">{p.clienteNome || 'Cliente'} · Pedido #{p.numero}</p>
                  <p className="text-xs text-gray-400">{p.avaliadoEm ? new Date(p.avaliadoEm).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}</p>
                </div>
                <Estrelas nota={p.notaPedido} tamanho="h-5 w-5" />
              </div>
              {p.comentarioPedido && <p className="text-sm text-gray-700 mb-2">"{p.comentarioPedido}"</p>}
              <div className="flex flex-wrap gap-1.5 mb-2">
                <SubNota label="Comida" nota={p.notaComida} />
                <SubNota label="Embalagem" nota={p.notaEmbalagem} />
                <SubNota label="Tempo" nota={p.notaTempo} />
              </div>
              {p.fotosAvaliacao.length > 0 && (
                <div className="flex gap-2">
                  {p.fotosAvaliacao.map((url) => (
                    <a key={url} href={url} target="_blank" rel="noreferrer" className="block h-14 w-14 rounded-lg overflow-hidden border border-gray-200">
                      <img src={url} alt="Foto da avaliação" className="h-full w-full object-cover" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
          {filtrados.length === 0 && (
            <p className="text-center text-gray-500 py-10 text-sm flex flex-col items-center gap-2">
              <ImageIcon className="h-8 w-8 text-gray-300" />
              Nenhuma avaliação encontrada.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default AvaliacoesTab;
