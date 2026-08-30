import React, { useCallback, useEffect, useState } from 'react';
import { Save, ShoppingBag, Table2, SplitSquareHorizontal } from 'lucide-react';
import { fetchEmpresaById, updatePdvConfig } from '../../lib/empresas';

interface PdvConfigTabProps {
  empresaId: string;
}

const PdvConfigTab: React.FC<PdvConfigTabProps> = ({ empresaId }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [pdvHabilitado, setPdvHabilitado] = useState(false);
  const [mesaAbertaContinua, setMesaAbertaContinua] = useState(false);
  const [permiteSplitPagamento, setPermiteSplitPagamento] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const empresa = await fetchEmpresaById(empresaId);
      setPdvHabilitado(empresa.pdvHabilitado);
      setMesaAbertaContinua(empresa.pdvMesaAbertaContinua);
      setPermiteSplitPagamento(empresa.pdvPermiteSplitPagamento);
    } catch {
      /* silencioso */
    } finally {
      setLoading(false);
    }
  }, [empresaId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setSaving(true);
    try {
      await updatePdvConfig(empresaId, {
        pdvMesaAbertaContinua: mesaAbertaContinua,
        pdvPermiteSplitPagamento: permiteSplitPagamento,
      });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-center text-gray-500 py-8">Carregando...</p>;
  }

  if (!pdvHabilitado) {
    return (
      <div className="bg-gray-50 border border-gray-100 rounded-2xl p-6 text-center max-w-lg mx-auto">
        <ShoppingBag className="h-8 w-8 text-gray-400 mx-auto mb-3" />
        <h3 className="font-bold text-gray-800 mb-1">PDV ainda não está liberado pra sua loja</h3>
        <p className="text-sm text-gray-500">
          A venda de balcão/mesa é uma função do plano — fale com o suporte da plataforma pra liberar.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <section>
        <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
          <ShoppingBag className="h-4 w-4 text-orange-600" /> Como o PDV funciona na sua loja
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          Essas duas opções são só sua — escolha o que se adequa melhor ao jeito que sua loja atende.
        </p>

        <div className="bg-gray-50 p-4 rounded-xl mb-3">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={mesaAbertaContinua}
              onChange={(e) => setMesaAbertaContinua(e.target.checked)}
              className="w-4 h-4 mt-0.5 text-orange-600 rounded focus:ring-orange-500"
            />
            <span>
              <span className="flex items-center gap-1.5 font-semibold text-gray-800 text-sm">
                <Table2 className="h-4 w-4 text-orange-600" /> Mesa aberta contínua
              </span>
              <span className="block text-xs text-gray-500 mt-1">
                Ligado: a mesa fica aberta recebendo pedidos aos poucos (entrada, prato principal, sobremesa) e só fecha a conta no final.
                Desligado: a mesa funciona como uma venda de balcão nomeada — lança tudo de uma vez e fecha na hora.
              </span>
            </span>
          </label>
        </div>

        <div className="bg-gray-50 p-4 rounded-xl">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={permiteSplitPagamento}
              onChange={(e) => setPermiteSplitPagamento(e.target.checked)}
              className="w-4 h-4 mt-0.5 text-orange-600 rounded focus:ring-orange-500"
            />
            <span>
              <span className="flex items-center gap-1.5 font-semibold text-gray-800 text-sm">
                <SplitSquareHorizontal className="h-4 w-4 text-orange-600" /> Dividir pagamento em mais de uma forma
              </span>
              <span className="block text-xs text-gray-500 mt-1">
                Permite fechar uma venda com parte em Pix e parte em dinheiro/cartão, por exemplo. Desligado, cada venda usa uma forma só.
              </span>
            </span>
          </label>
        </div>
      </section>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>}
      {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm">Configurações salvas com sucesso!</div>}

      <button
        type="submit"
        disabled={saving}
        className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white text-sm px-5 py-2.5 rounded-lg disabled:opacity-60"
      >
        <Save className="h-4 w-4" /> {saving ? 'Salvando...' : 'Salvar configurações'}
      </button>
    </form>
  );
};

export default PdvConfigTab;
