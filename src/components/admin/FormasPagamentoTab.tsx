import React, { useEffect, useState } from 'react';
import { QrCode, Banknote, CreditCard, Loader2, Check } from 'lucide-react';
import { Empresa } from '../../types/Empresa';
import { fetchEmpresaById, setFormasPagamento } from '../../lib/empresas';

interface FormasPagamentoTabProps {
  empresaId: string;
}

const FORMAS = [
  { campo: 'aceitaPix' as const, label: 'PIX', descricao: 'Cliente combina a chave PIX com você na confirmação do pedido.', icon: QrCode, cor: 'emerald' },
  { campo: 'aceitaDinheiro' as const, label: 'Dinheiro', descricao: 'Pagamento na entrega, com opção de informar troco.', icon: Banknote, cor: 'amber' },
  { campo: 'aceitaCartao' as const, label: 'Cartão na entrega', descricao: 'Maquininha do motoboy ou do balcão, na hora da entrega.', icon: CreditCard, cor: 'blue' },
] as const;

const CORES: Record<string, { ativo: string; inativo: string; icone: string }> = {
  emerald: { ativo: 'border-emerald-400 bg-emerald-50', inativo: 'border-gray-200', icone: 'text-emerald-600' },
  amber: { ativo: 'border-amber-400 bg-amber-50', inativo: 'border-gray-200', icone: 'text-amber-600' },
  blue: { ativo: 'border-blue-400 bg-blue-50', inativo: 'border-gray-200', icone: 'text-blue-600' },
};

const FormasPagamentoTab: React.FC<FormasPagamentoTabProps> = ({ empresaId }) => {
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [loading, setLoading] = useState(true);
  const [salvandoCampo, setSalvandoCampo] = useState<string | null>(null);
  const [erro, setErro] = useState('');

  useEffect(() => {
    fetchEmpresaById(empresaId)
      .then(setEmpresa)
      .catch(() => setEmpresa(null))
      .finally(() => setLoading(false));
  }, [empresaId]);

  const handleAlternar = async (campo: 'aceitaPix' | 'aceitaDinheiro' | 'aceitaCartao', valorAtual: boolean) => {
    if (!empresa) return;
    setErro('');
    setSalvandoCampo(campo);
    try {
      const atualizado = await setFormasPagamento(empresaId, { [campo]: !valorAtual });
      setEmpresa(atualizado);
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não foi possível atualizar.');
    } finally {
      setSalvandoCampo(null);
    }
  };

  if (loading || !empresa) {
    return <p className="text-center text-gray-500 py-8 text-sm">Carregando...</p>;
  }

  return (
    <div>
      <p className="text-sm text-gray-500 mb-5">
        Escolha quais formas de pagamento aparecem no checkout do seu cardápio online. Isso não afeta o PDV (balcão/mesa),
        que sempre pode usar qualquer forma.
      </p>

      <div className="space-y-3 max-w-xl">
        {FORMAS.map(({ campo, label, descricao, icon: Icon, cor }) => {
          const ativo = empresa[campo];
          const cores = CORES[cor];
          return (
            <div key={campo} className={`flex items-center gap-4 border-2 rounded-2xl p-4 transition-colors ${ativo ? cores.ativo : cores.inativo}`}>
              <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${ativo ? 'bg-white' : 'bg-gray-100'}`}>
                <Icon className={`h-5 w-5 ${ativo ? cores.icone : 'text-gray-400'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-800">{label}</p>
                <p className="text-xs text-gray-500">{descricao}</p>
              </div>
              <button
                onClick={() => handleAlternar(campo, ativo)}
                disabled={salvandoCampo === campo}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold disabled:opacity-60 ${
                  ativo ? 'bg-gray-800 text-white hover:bg-gray-900' : 'border border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {salvandoCampo === campo ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : ativo ? <Check className="h-3.5 w-3.5" /> : null}
                {ativo ? 'Ativo' : 'Inativo'}
              </button>
            </div>
          );
        })}
      </div>

      {erro && <p className="text-sm text-red-600 mt-3">{erro}</p>}
    </div>
  );
};

export default FormasPagamentoTab;
