import React, { useCallback, useEffect, useState } from 'react';
import { Check, Lock } from 'lucide-react';
import { fetchEmpresaById } from '../../lib/empresas';
import { Empresa } from '../../types/Empresa';
import { FUNCOES } from '../../data/funcionalidades';

interface FuncionalidadesTabProps {
  empresaId: string;
}

const FuncionalidadesTab: React.FC<FuncionalidadesTabProps> = ({ empresaId }) => {
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const dados = await fetchEmpresaById(empresaId);
      setEmpresa(dados);
    } catch {
      /* silencioso */
    } finally {
      setLoading(false);
    }
  }, [empresaId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading || !empresa) {
    return <p className="text-center text-gray-500 py-8">Carregando...</p>;
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-500">
        Essas funcionalidades são definidas pelo pacote do seu plano — não são autoatendimento aqui. Se quiser
        mudar alguma, fale com o suporte da plataforma.
      </p>

      <div className="space-y-3">
        {FUNCOES.map(({ campo, titulo, descricao, icon: Icon }) => {
          const ativo = empresa[campo];
          return (
            <React.Fragment key={campo}>
              <div
                className={`flex items-start gap-3 border rounded-xl p-4 ${
                  ativo ? 'border-orange-200 bg-orange-50/40' : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${ativo ? 'bg-orange-100' : 'bg-gray-200'}`}>
                  {ativo ? <Check className="h-3.5 w-3.5 text-orange-600" /> : <Lock className="h-3 w-3 text-gray-400" />}
                </div>
                <Icon className={`h-5 w-5 shrink-0 mt-0.5 ${ativo ? 'text-orange-600' : 'text-gray-400'}`} />
                <div>
                  <p className={`font-bold text-sm ${ativo ? 'text-gray-800' : 'text-gray-500'}`}>{titulo}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{descricao}</p>
                </div>
              </div>

              {campo === 'habilitarIndicacaoAvancada' && ativo && (
                <div className="ml-9 -mt-1 text-sm text-gray-500">
                  Unidades por indicação concluída: <span className="font-semibold text-gray-700">{empresa.indicacaoRecompensaUnidades}</span>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default FuncionalidadesTab;
