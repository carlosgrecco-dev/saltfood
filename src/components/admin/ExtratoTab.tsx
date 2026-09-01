import React, { useCallback, useEffect, useState } from 'react';
import { ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { ExtratoLancamento } from '../../types/ContaFinanceira';
import { fetchExtrato } from '../../lib/financeiro';

interface ExtratoTabProps {
  empresaId: string;
}

const todayISO = () => new Date().toISOString().slice(0, 10);

const ORIGEM_LABEL: Record<string, string> = {
  CAIXA: 'Caixa',
  CONTA_PAGAR: 'Conta a pagar',
  CONTA_RECEBER: 'Conta a receber',
};

const ExtratoTab: React.FC<ExtratoTabProps> = ({ empresaId }) => {
  const [de, setDe] = useState(todayISO());
  const [ate, setAte] = useState(todayISO());
  const [lancamentos, setLancamentos] = useState<ExtratoLancamento[]>([]);
  const [saldoFinal, setSaldoFinal] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const resumo = await fetchExtrato(empresaId, de, ate);
      setLancamentos(resumo.lancamentos);
      setSaldoFinal(resumo.saldoFinal);
    } catch {
      setLancamentos([]);
      setSaldoFinal(0);
    } finally {
      setLoading(false);
    }
  }, [empresaId, de, ate]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <div className="flex flex-wrap items-end gap-3 mb-6">
        <div>
          <label className="block text-xs text-gray-500 mb-1">De</label>
          <input type="date" value={de} onChange={(e) => setDe(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Até</label>
          <input type="date" value={ate} onChange={(e) => setAte(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
        </div>
        <div className="ml-auto bg-gray-800 text-white rounded-2xl px-4 py-2.5">
          <p className="text-[11px] text-gray-300">Saldo do período</p>
          <p className={`text-lg font-bold ${saldoFinal >= 0 ? 'text-white' : 'text-red-300'}`}>R$ {saldoFinal.toFixed(2)}</p>
        </div>
      </div>

      {loading ? (
        <p className="text-center text-gray-500 py-8 text-sm">Carregando...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-gray-500 bg-gray-50">
                <th className="py-2.5 px-4">Data</th>
                <th className="py-2.5 px-4">Origem</th>
                <th className="py-2.5 px-4">Descrição</th>
                <th className="py-2.5 px-4 text-right">Valor</th>
                <th className="py-2.5 px-4 text-right">Saldo acumulado</th>
              </tr>
            </thead>
            <tbody>
              {lancamentos.map((l) => (
                <tr key={l.id} className="border-b border-gray-100">
                  <td className="py-2.5 px-4 text-xs text-gray-500">{new Date(l.data).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</td>
                  <td className="py-2.5 px-4 text-xs text-gray-500">{ORIGEM_LABEL[l.origem] || l.origem}</td>
                  <td className="py-2.5 px-4">{l.descricao}</td>
                  <td className={`py-2.5 px-4 text-right font-bold flex items-center justify-end gap-1 ${l.sinal > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {l.sinal > 0 ? <ArrowUpCircle className="h-3.5 w-3.5" /> : <ArrowDownCircle className="h-3.5 w-3.5" />}
                    {l.sinal > 0 ? '+' : '-'} R$ {l.valor.toFixed(2)}
                  </td>
                  <td className="py-2.5 px-4 text-right font-medium text-gray-700">R$ {l.saldoAcumulado.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {lancamentos.length === 0 && <p className="text-center text-gray-400 text-sm py-10">Nenhum lançamento neste período.</p>}
        </div>
      )}
    </div>
  );
};

export default ExtratoTab;
