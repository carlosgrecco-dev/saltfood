import React, { useEffect, useState } from 'react';
import { Trash2, FileText } from 'lucide-react';
import { listarPreVendas, removerPreVenda, PreVenda } from '../../lib/pdvPreVendas';

interface PdvPreVendaTabProps {
  empresaId: string;
}

const PdvPreVendaTab: React.FC<PdvPreVendaTabProps> = ({ empresaId }) => {
  const [preVendas, setPreVendas] = useState<PreVenda[]>([]);

  useEffect(() => {
    setPreVendas(listarPreVendas(empresaId));
  }, [empresaId]);

  const handleRemover = (id: string) => {
    removerPreVenda(empresaId, id);
    setPreVendas(listarPreVendas(empresaId));
  };

  return (
    <div>
      <p className="text-xs text-gray-400 mb-4">
        Pré-vendas ficam salvas só neste terminal (não sincronizam com outros dispositivos) — use pra guardar um orçamento sem gerar um pedido de verdade ainda.
      </p>
      <div className="space-y-2.5">
        {preVendas.map((p) => (
          <div key={p.id} className="border border-gray-200 rounded-xl p-4">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-gray-400 shrink-0" />
                <div>
                  <p className="font-bold text-gray-800">{p.clienteNome || 'Cliente não informado'}</p>
                  <p className="text-xs text-gray-500">{new Date(p.criadaEm).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold text-orange-600">R$ {p.total.toFixed(2)}</span>
                <button onClick={() => handleRemover(p.id)} className="text-red-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
            <div className="text-sm text-gray-600 space-y-0.5">
              {p.itens.map((item, i) => (
                <p key={i}>{item.quantidade}x {item.produtoNome}{item.opcoesLabel ? ` (${item.opcoesLabel})` : ''} — R$ {(item.precoUnitario * item.quantidade).toFixed(2)}</p>
              ))}
            </div>
            {p.observacoes && <p className="text-xs text-gray-400 mt-2">Obs: {p.observacoes}</p>}
          </div>
        ))}
        {preVendas.length === 0 && <p className="text-center text-gray-500 py-10">Nenhuma pré-venda salva neste terminal.</p>}
      </div>
    </div>
  );
};

export default PdvPreVendaTab;
