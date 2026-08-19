import React, { useEffect, useState } from 'react';
import { Gift, Copy, Check, Wallet } from 'lucide-react';
import { fetchEmpresaById } from '../../lib/empresas';
import { fetchConfiguracaoPublica } from '../../lib/configuracoesPlataforma';

interface IndicacaoEmpresaCardProps {
  empresaId: string;
}

/** Indicação tenant-a-tenant: cada loja pode indicar outros donos de loja pra plataforma e ganhar
 * crédito quando a loja indicada vira cliente pagante. Só aparece se o Super Admin configurou uma
 * recompensa > 0 — do contrário o programa está desativado e a loja não precisa saber que existe. */
const IndicacaoEmpresaCard: React.FC<IndicacaoEmpresaCardProps> = ({ empresaId }) => {
  const [codigo, setCodigo] = useState<string | null>(null);
  const [credito, setCredito] = useState(0);
  const [recompensa, setRecompensa] = useState(0);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    Promise.all([fetchEmpresaById(empresaId), fetchConfiguracaoPublica()])
      .then(([empresa, config]) => {
        setCodigo(empresa.codigoIndicacao);
        setCredito(empresa.creditoIndicacaoEmpresa);
        setRecompensa(config.recompensaIndicacaoEmpresaValor);
      })
      .catch(() => {});
  }, [empresaId]);

  const handleCopiar = () => {
    if (!codigo) return;
    navigator.clipboard?.writeText(codigo).catch(() => {});
    setCopiado(true);
    setTimeout(() => setCopiado(false), 1500);
  };

  if (recompensa <= 0) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6">
      <h3 className="font-bold text-gray-800 mb-1 flex items-center gap-2">
        <Gift className="h-4 w-4 text-orange-600" /> Indique outras lojas
      </h3>
      <p className="text-xs text-gray-500 mb-4">
        Conhece outro dono de restaurante? Compartilhe seu código — quando a loja indicada virar cliente pagante da
        SaltFood, você ganha <strong>R$ {recompensa.toFixed(2)}</strong> de crédito, aplicado automaticamente na sua próxima fatura.
      </p>
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="bg-gray-100 rounded-xl px-4 py-2.5 font-mono font-bold tracking-widest text-gray-800">
            {codigo || '...'}
          </span>
          <button
            onClick={handleCopiar}
            className="flex items-center gap-1.5 bg-gray-800 hover:bg-gray-900 text-white text-xs px-3 py-2.5 rounded-xl transition-colors"
          >
            {copiado ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />} {copiado ? 'Copiado' : 'Copiar'}
          </button>
        </div>
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-2.5">
          <Wallet className="h-4 w-4 text-emerald-600" />
          <span className="text-sm text-emerald-800">
            Crédito acumulado: <strong>R$ {credito.toFixed(2)}</strong>
          </span>
        </div>
      </div>
    </div>
  );
};

export default IndicacaoEmpresaCard;
