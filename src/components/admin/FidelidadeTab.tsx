import React, { useCallback, useEffect, useState } from 'react';
import { Save, ImageIcon, Clock, BellRing, Tag, Users, Settings, Wallet, Coins } from 'lucide-react';
import { fetchEmpresaById, updateFidelidadeConfig } from '../../lib/empresas';
import { LOYALTY_STAMPS_GOAL } from '../../types/Cliente';
import FidelidadeClientesTab from './FidelidadeClientesTab';

interface FidelidadeTabProps {
  empresaId: string;
}

type SubTab = 'config' | 'clientes';

const FidelidadeTab: React.FC<FidelidadeTabProps> = ({ empresaId }) => {
  const [subTab, setSubTab] = useState<SubTab>('config');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const [fidelidadeLogoUrl, setFidelidadeLogoUrl] = useState('');
  const [fidelidadeValidadeDias, setFidelidadeValidadeDias] = useState('');
  const [fidelidadeAvisoFaltam, setFidelidadeAvisoFaltam] = useState('');
  const [fidelidadeNomeItem, setFidelidadeNomeItem] = useState('');
  const [cashbackPercent, setCashbackPercent] = useState('');
  const [saltfoodCoinsPercent, setSaltfoodCoinsPercent] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const empresa = await fetchEmpresaById(empresaId);
      setFidelidadeLogoUrl(empresa.fidelidadeLogoUrl || '');
      setFidelidadeValidadeDias(empresa.fidelidadeValidadeDias != null ? String(empresa.fidelidadeValidadeDias) : '');
      setFidelidadeAvisoFaltam(empresa.fidelidadeAvisoFaltam != null ? String(empresa.fidelidadeAvisoFaltam) : '');
      setFidelidadeNomeItem(empresa.fidelidadeNomeItem || '');
      setCashbackPercent(empresa.cashbackPercent != null ? String(empresa.cashbackPercent) : '');
      setSaltfoodCoinsPercent(empresa.saltfoodCoinsPercent != null ? String(empresa.saltfoodCoinsPercent) : '');
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

    if (fidelidadeAvisoFaltam && (Number(fidelidadeAvisoFaltam) < 1 || Number(fidelidadeAvisoFaltam) > LOYALTY_STAMPS_GOAL - 1)) {
      setError(`O aviso deve ser entre 1 e ${LOYALTY_STAMPS_GOAL - 1}`);
      return;
    }
    if (cashbackPercent && (Number(cashbackPercent) < 0 || Number(cashbackPercent) > 100)) {
      setError('O percentual de cashback deve ser entre 0 e 100');
      return;
    }
    if (saltfoodCoinsPercent && (Number(saltfoodCoinsPercent) < 0 || Number(saltfoodCoinsPercent) > 100)) {
      setError('O percentual de SaltFood Coins deve ser entre 0 e 100');
      return;
    }

    setSaving(true);
    try {
      await updateFidelidadeConfig(empresaId, {
        fidelidadeLogoUrl: fidelidadeLogoUrl || null,
        fidelidadeValidadeDias: fidelidadeValidadeDias ? Number(fidelidadeValidadeDias) : null,
        fidelidadeAvisoFaltam: fidelidadeAvisoFaltam ? Number(fidelidadeAvisoFaltam) : null,
        fidelidadeNomeItem: fidelidadeNomeItem || null,
        cashbackPercent: cashbackPercent ? Number(cashbackPercent) : null,
        saltfoodCoinsPercent: saltfoodCoinsPercent ? Number(saltfoodCoinsPercent) : null,
      });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar configurações de fidelidade');
    } finally {
      setSaving(false);
    }
  };

  const switcher = (
    <div className="flex bg-gray-100 rounded-xl p-1 mb-6 max-w-xs">
      <button
        type="button"
        onClick={() => setSubTab('config')}
        className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-colors ${
          subTab === 'config' ? 'bg-white shadow text-orange-600' : 'text-gray-500'
        }`}
      >
        <Settings className="h-3.5 w-3.5" /> Configurações
      </button>
      <button
        type="button"
        onClick={() => setSubTab('clientes')}
        className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-colors ${
          subTab === 'clientes' ? 'bg-white shadow text-orange-600' : 'text-gray-500'
        }`}
      >
        <Users className="h-3.5 w-3.5" /> Clientes
      </button>
    </div>
  );

  if (subTab === 'clientes') {
    return (
      <div>
        {switcher}
        <FidelidadeClientesTab empresaId={empresaId} />
      </div>
    );
  }

  if (loading) {
    return (
      <div>
        {switcher}
        <p className="text-center text-gray-500 py-8">Carregando...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {switcher}
      <section>
        <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
          <ImageIcon className="h-4 w-4 text-orange-600" /> Logo do cartão fidelidade
        </h3>
        <div className="bg-gray-50 p-4 rounded-xl">
          <input
            value={fidelidadeLogoUrl}
            onChange={(e) => setFidelidadeLogoUrl(e.target.value)}
            placeholder="https://... (deixe em branco para usar o logo padrão da loja)"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
          <p className="text-xs text-gray-400 mt-1.5">
            Exibido no topo do cartão de fidelidade do cliente. Se vazio, usa o logo definido na aba Aparência.
          </p>
        </div>
      </section>

      <section>
        <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
          <Clock className="h-4 w-4 text-orange-600" /> Prazo para resgatar o item grátis
        </h3>
        <div className="bg-gray-50 p-4 rounded-xl">
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              value={fidelidadeValidadeDias}
              onChange={(e) => setFidelidadeValidadeDias(e.target.value)}
              placeholder="Sem prazo"
              className="w-32 px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
            <span className="text-sm text-gray-500">dias após completar {LOYALTY_STAMPS_GOAL} pedidos</span>
          </div>
          <p className="text-xs text-gray-400 mt-1.5">
            Se o cliente não resgatar o 11º item dentro do prazo, ele expira. Deixe em branco para não ter prazo.
            O cliente vê uma contagem regressiva no cartão de fidelidade.
          </p>
        </div>
      </section>

      <section>
        <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
          <BellRing className="h-4 w-4 text-orange-600" /> Aviso de proximidade do prêmio
        </h3>
        <div className="bg-gray-50 p-4 rounded-xl">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Mostrar um aviso na loja quando faltarem</span>
            <input
              type="number"
              min={1}
              max={LOYALTY_STAMPS_GOAL - 1}
              value={fidelidadeAvisoFaltam}
              onChange={(e) => setFidelidadeAvisoFaltam(e.target.value)}
              placeholder="—"
              className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-sm text-center"
            />
            <span className="text-sm text-gray-500">unidades para o prêmio</span>
          </div>
          <p className="text-xs text-gray-400 mt-1.5">
            Deixe em branco para não mostrar o aviso. Ex: 3 avisa o cliente quando faltarem 3 unidades para o 11º grátis.
          </p>
        </div>
      </section>

      <section>
        <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
          <Tag className="h-4 w-4 text-orange-600" /> Nome do item nas mensagens
        </h3>
        <div className="bg-gray-50 p-4 rounded-xl">
          <input
            value={fidelidadeNomeItem}
            onChange={(e) => setFidelidadeNomeItem(e.target.value)}
            placeholder="Ex: lanches, pizzas, açaís..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
          <p className="text-xs text-gray-400 mt-1.5">
            Usado no aviso, por exemplo: "Faltam 3 {fidelidadeNomeItem || 'itens'} para seu prêmio!"
          </p>
        </div>
      </section>

      <section>
        <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
          <Wallet className="h-4 w-4 text-orange-600" /> Cashback
        </h3>
        <div className="bg-gray-50 p-4 rounded-xl">
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              max={100}
              step="0.1"
              value={cashbackPercent}
              onChange={(e) => setCashbackPercent(e.target.value)}
              placeholder="0"
              className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
            <span className="text-sm text-gray-500">% do subtotal, creditado como saldo quando o pedido é entregue</span>
          </div>
          <p className="text-xs text-gray-400 mt-1.5">
            O cliente pode usar o saldo acumulado como desconto num pedido futuro. Deixe em branco ou 0 para desativar.
          </p>
        </div>
      </section>

      <section>
        <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
          <Coins className="h-4 w-4 text-amber-600" /> SaltFood Coins
        </h3>
        <div className="bg-gray-50 p-4 rounded-xl">
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              max={100}
              step="0.1"
              value={saltfoodCoinsPercent}
              onChange={(e) => setSaltfoodCoinsPercent(e.target.value)}
              placeholder="0"
              className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
            <span className="text-sm text-gray-500">% do subtotal, creditado na carteira SaltFood Coins quando o pedido é entregue</span>
          </div>
          <p className="text-xs text-gray-400 mt-1.5">
            Diferente do cashback acima, o saldo de SaltFood Coins vale em qualquer loja da plataforma que também
            participar. Só tem efeito com "SaltFood Coins" ligado na aba Funcionalidades. Deixe em branco ou 0 para desativar.
          </p>
        </div>
      </section>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>}
      {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm">Configurações de fidelidade salvas com sucesso!</div>}

      <button
        type="submit"
        disabled={saving}
        className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white text-sm px-5 py-2.5 rounded-lg disabled:opacity-60"
      >
        <Save className="h-4 w-4" /> {saving ? 'Salvando...' : 'Salvar fidelidade'}
      </button>
    </form>
  );
};

export default FidelidadeTab;
