import React, { useEffect, useState } from 'react';
import { FormaPagamento, FORMA_PAGAMENTO_LABELS } from '../types/Pedido';

interface Props {
  formaPagamento: FormaPagamento;
  trocoPara: number | null;
  total: number;
  /** Chamado a cada mudança — `null` enquanto a confirmação não estiver marcada, valor confirmado quando estiver. */
  onChange: (valorRecebido: number | null) => void;
}

/**
 * Bloco de confirmação obrigatório antes de concluir uma entrega — o backend rejeita a transição
 * pra ENTREGUE sem essa confirmação (ver PATCH /pedidos/:id/status). Usado no portal do motoboy
 * e no admin web, sempre com a mesma regra de valor esperado.
 */
const ConfirmarPagamentoEntrega: React.FC<Props> = ({ formaPagamento, trocoPara, total, onChange }) => {
  const valorEsperado = formaPagamento === 'DINHEIRO' && trocoPara != null && trocoPara > total ? trocoPara : total;

  const [confirmado, setConfirmado] = useState(false);
  const [outroValor, setOutroValor] = useState(false);
  const [valor, setValor] = useState(valorEsperado);

  useEffect(() => {
    onChange(confirmado ? valor : null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [confirmado, valor]);

  return (
    <div className="bg-gray-50 rounded-xl p-3 space-y-1.5">
      <label className="flex items-start gap-2 text-sm text-gray-700 cursor-pointer">
        <input
          type="checkbox"
          checked={confirmado}
          onChange={(e) => setConfirmado(e.target.checked)}
          className="mt-0.5"
        />
        <span>
          Confirmo que recebi <strong>R$ {valorEsperado.toFixed(2)}</strong> ({FORMA_PAGAMENTO_LABELS[formaPagamento]})
        </span>
      </label>
      {confirmado && (
        outroValor ? (
          <div className="flex items-center gap-2 pl-6">
            <span className="text-xs text-gray-500">Valor recebido:</span>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={valor}
              onChange={(e) => setValor(Number(e.target.value))}
              className="w-24 border border-gray-300 rounded-lg px-2 py-1 text-sm"
            />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setOutroValor(true)}
            className="pl-6 text-xs text-blue-600 hover:underline"
          >
            Recebi um valor diferente
          </button>
        )
      )}
    </div>
  );
};

export default ConfirmarPagamentoEntrega;
