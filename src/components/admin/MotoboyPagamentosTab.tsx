import React, { useCallback, useEffect, useState } from 'react';
import { Bike, Clock3, HandCoins, Receipt } from 'lucide-react';
import { Motoboy } from '../../types/Motoboy';
import { MovimentoCaixa } from '../../types/MovimentoCaixa';
import { fetchMotoboys } from '../../lib/motoboysApi';
import { fetchPedidos, pagarMotoboy } from '../../lib/pedidos';
import { fetchMovimentosCaixa } from '../../lib/movimentosCaixa';

interface MotoboyPagamentosTabProps {
  empresaId: string;
}

interface ResumoMotoboy {
  motoboy: Motoboy;
  corridasPendentes: number;
  totalAReceber: number;
  totalPago: number;
  historico: MovimentoCaixa[];
}

const HISTORICO_LIMITE = 5;

/** dataMovimento vem como data pura (@db.Date, meia-noite UTC) — evita formatar via Date/fuso pra não voltar 1 dia. */
const formatData = (iso: string) => {
  const [ano, mes, dia] = iso.slice(0, 10).split('-');
  return `${dia}/${mes}/${ano}`;
};

const MotoboyPagamentosTab: React.FC<MotoboyPagamentosTabProps> = ({ empresaId }) => {
  const [resumos, setResumos] = useState<ResumoMotoboy[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagandoId, setPagandoId] = useState<string | null>(null);
  const [expandidoId, setExpandidoId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const motoboys = await fetchMotoboys(empresaId);
      const resultado = await Promise.all(
        motoboys.map(async (motoboy): Promise<ResumoMotoboy> => {
          const [pendentes, historico] = await Promise.all([
            fetchPedidos(empresaId, { motoboyId: motoboy.id, status: 'ENTREGUE', motoboyPago: false }),
            fetchMovimentosCaixa(empresaId, { motoboyId: motoboy.id, tipo: 'SAIDA' }),
          ]);
          return {
            motoboy,
            corridasPendentes: pendentes.length,
            totalAReceber: pendentes.reduce((soma, p) => soma + (p.taxaEntregaMotoboy ?? 0), 0),
            totalPago: historico.reduce((soma, m) => soma + m.valor, 0),
            historico,
          };
        })
      );
      resultado.sort((a, b) => b.totalAReceber - a.totalAReceber);
      setResumos(resultado);
    } catch {
      setResumos([]);
    } finally {
      setLoading(false);
    }
  }, [empresaId]);

  useEffect(() => {
    load();
  }, [load]);

  const handlePagar = async (motoboyId: string) => {
    setPagandoId(motoboyId);
    try {
      await pagarMotoboy(empresaId, motoboyId);
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao registrar pagamento');
    } finally {
      setPagandoId(null);
    }
  };

  if (loading) {
    return <p className="text-center text-gray-500 py-8">Carregando...</p>;
  }

  return (
    <div className="space-y-3">
      {resumos.map(({ motoboy, corridasPendentes, totalAReceber, totalPago, historico }) => (
        <div key={motoboy.id} className="border border-gray-200 rounded-2xl p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Bike className="h-4 w-4 text-orange-500" />
              <p className="font-bold text-gray-800">{motoboy.nome}</p>
              {!motoboy.ativo && (
                <span className="text-[11px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Inativo</span>
              )}
            </div>
            {totalAReceber > 0 && (
              <button
                onClick={() => handlePagar(motoboy.id)}
                disabled={pagandoId === motoboy.id}
                className="bg-gray-800 hover:bg-gray-900 text-white text-sm px-3 py-1.5 rounded-lg disabled:opacity-60"
              >
                {pagandoId === motoboy.id ? 'Pagando...' : `Pagar ${corridasPendentes} corrida${corridasPendentes > 1 ? 's' : ''}`}
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2.5 mt-3">
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
              <p className="flex items-center gap-1 text-amber-700 text-xs mb-1">
                <Clock3 className="h-3.5 w-3.5" /> A receber
              </p>
              <p className="text-lg font-bold text-amber-800">R$ {totalAReceber.toFixed(2)}</p>
            </div>
            <div className="bg-green-50 border border-green-100 rounded-xl p-3">
              <p className="flex items-center gap-1 text-green-700 text-xs mb-1">
                <HandCoins className="h-3.5 w-3.5" /> Já pago
              </p>
              <p className="text-lg font-bold text-green-800">R$ {totalPago.toFixed(2)}</p>
            </div>
          </div>

          {historico.length > 0 && (
            <div className="mt-3">
              <button
                onClick={() => setExpandidoId(expandidoId === motoboy.id ? null : motoboy.id)}
                className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700"
              >
                <Receipt className="h-3.5 w-3.5" />
                {expandidoId === motoboy.id ? 'Esconder histórico' : `Ver histórico de pagamentos (${historico.length})`}
              </button>
              {expandidoId === motoboy.id && (
                <div className="mt-2 space-y-1.5">
                  {historico.slice(0, HISTORICO_LIMITE).map((m) => (
                    <div key={m.id} className="flex items-center justify-between gap-3 text-xs bg-gray-50 rounded-lg px-3 py-2">
                      <span className="text-gray-600 truncate">{formatData(m.dataMovimento)} · {m.descricao}</span>
                      <span className="font-semibold text-green-700 shrink-0">R$ {m.valor.toFixed(2)}</span>
                    </div>
                  ))}
                  {historico.length > HISTORICO_LIMITE && (
                    <p className="text-[11px] text-gray-400 px-1">
                      + {historico.length - HISTORICO_LIMITE} pagamento(s) mais antigo(s)
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      ))}

      {resumos.length === 0 && <p className="text-center text-gray-500 py-8">Nenhum motoboy cadastrado ainda.</p>}
    </div>
  );
};

export default MotoboyPagamentosTab;
