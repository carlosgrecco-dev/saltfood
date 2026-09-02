import React, { useEffect, useState } from 'react';
import { Printer, Smartphone, Trash2, Loader2 } from 'lucide-react';
import { Empresa } from '../../types/Empresa';
import { fetchEmpresaById, setImpressoraConfig } from '../../lib/empresas';

interface ImpressorasTabProps {
  empresaId: string;
}

const ImpressorasTab: React.FC<ImpressorasTabProps> = ({ empresaId }) => {
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [loading, setLoading] = useState(true);
  const [limpando, setLimpando] = useState(false);

  useEffect(() => {
    fetchEmpresaById(empresaId)
      .then(setEmpresa)
      .catch(() => setEmpresa(null))
      .finally(() => setLoading(false));
  }, [empresaId]);

  const handleLimpar = async () => {
    if (!window.confirm('Limpar a impressora configurada? No próximo login do app, o operador vai precisar parear a impressora de novo pelo celular.')) return;
    setLimpando(true);
    try {
      const atualizado = await setImpressoraConfig(empresaId, { nome: null, macAddress: null });
      setEmpresa(atualizado);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Não foi possível limpar a configuração.');
    } finally {
      setLimpando(false);
    }
  };

  if (loading || !empresa) {
    return <p className="text-center text-gray-500 py-8 text-sm">Carregando...</p>;
  }

  const configurada = !!empresa.impressoraMacAddress;

  return (
    <div>
      <p className="text-sm text-gray-500 mb-5 max-w-xl">
        O pareamento da impressora térmica Bluetooth é feito direto no app do celular (Configurações → Impressora),
        já que Bluetooth é local ao aparelho — não dá pra parear pela web. Aqui você só acompanha qual impressora
        está configurada e pode resetar remotamente se precisar (ex: trocou de aparelho ou de impressora).
      </p>

      <div className="max-w-xl bg-white border border-gray-200 rounded-2xl p-5">
        <div className="flex items-center gap-4">
          <div className={`h-12 w-12 rounded-full flex items-center justify-center shrink-0 ${configurada ? 'bg-emerald-100' : 'bg-gray-100'}`}>
            <Printer className={`h-6 w-6 ${configurada ? 'text-emerald-600' : 'text-gray-400'}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-800">{empresa.impressoraNome || 'Nenhuma impressora configurada'}</p>
            <p className="text-xs text-gray-400 font-mono">{empresa.impressoraMacAddress || '—'}</p>
          </div>
        </div>

        {configurada && (
          <button
            onClick={handleLimpar}
            disabled={limpando}
            className="mt-4 flex items-center gap-1.5 text-xs font-medium border border-red-200 text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg disabled:opacity-60"
          >
            {limpando ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />} Limpar configuração
          </button>
        )}

        <div className="mt-4 pt-4 border-t border-gray-100 flex items-start gap-2 text-xs text-gray-500">
          <Smartphone className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          Pra parear ou trocar a impressora, abra o app no celular e vá em Configurações → Impressora.
        </div>
      </div>
    </div>
  );
};

export default ImpressorasTab;
