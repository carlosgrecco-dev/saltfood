import React, { useEffect, useState } from 'react';
import { User, Mail, Phone, Loader2, Save, Palette, CreditCard, Sparkles, Clock, ChevronRight } from 'lucide-react';
import { Empresa } from '../../types/Empresa';
import { fetchEmpresaById, setDadosContato } from '../../lib/empresas';
import { maskTelefone, onlyDigits } from '../../lib/masks';
import { Tab } from './TenantAdminNav';

interface ConfiguracoesTabProps {
  empresaId: string;
  onNavigate: (tab: Tab) => void;
}

const ATALHOS: { tab: Tab; label: string; descricao: string; icon: typeof Palette }[] = [
  { tab: 'aparencia', label: 'Aparência', descricao: 'Logo, cores, favicon e banner do cardápio', icon: Palette },
  { tab: 'operacional', label: 'Horários', descricao: 'Funcionamento, tempo estimado e pedido mínimo', icon: Clock },
  { tab: 'gateways', label: 'Integrações', descricao: 'Gateways de pagamento aceitos na loja', icon: CreditCard },
  { tab: 'funcionalidades', label: 'Funcionalidades', descricao: 'O que o seu plano libera pro cardápio', icon: Sparkles },
];

const ConfiguracoesTab: React.FC<ConfiguracoesTabProps> = ({ empresaId, onNavigate }) => {
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [loading, setLoading] = useState(true);
  const [responsavelNome, setResponsavelNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState(false);

  useEffect(() => {
    fetchEmpresaById(empresaId).then((e) => {
      setEmpresa(e);
      setResponsavelNome(e.responsavelNome);
      setEmail(e.email);
      setTelefone(maskTelefone(e.telefone));
    }).catch(() => setEmpresa(null)).finally(() => setLoading(false));
  }, [empresaId]);

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setSucesso(false);
    setSalvando(true);
    try {
      const atualizado = await setDadosContato(empresaId, { responsavelNome, email, telefone: onlyDigits(telefone) });
      setEmpresa(atualizado);
      setSucesso(true);
      setTimeout(() => setSucesso(false), 3000);
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não foi possível salvar.');
    } finally {
      setSalvando(false);
    }
  };

  if (loading || !empresa) {
    return <p className="text-center text-gray-500 py-8 text-sm">Carregando...</p>;
  }

  return (
    <div>
      <div className="max-w-xl bg-white border border-gray-200 rounded-2xl p-5 mb-6">
        <h3 className="font-bold text-gray-800 mb-1">Dados de contato</h3>
        <p className="text-xs text-gray-500 mb-4">
          Nome da loja, CNPJ/CPF, endereço do cardápio (slug) e usuário de login são alterados só pelo suporte da plataforma.
        </p>
        <form onSubmit={handleSalvar} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 flex items-center gap-1"><User className="h-3 w-3" /> Nome do responsável</label>
            <input value={responsavelNome} onChange={(e) => setResponsavelNome(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" required />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 flex items-center gap-1"><Mail className="h-3 w-3" /> E-mail</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" required />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 flex items-center gap-1"><Phone className="h-3 w-3" /> Telefone / WhatsApp</label>
            <input value={telefone} onChange={(e) => setTelefone(maskTelefone(e.target.value))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" required />
          </div>
          {erro && <p className="text-xs text-red-600">{erro}</p>}
          <button type="submit" disabled={salvando} className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white font-medium px-4 py-2.5 rounded-lg text-sm disabled:opacity-60">
            {salvando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Salvar
          </button>
          {sucesso && <span className="text-xs text-emerald-600 ml-2">Salvo!</span>}
        </form>
      </div>

      <div className="max-w-xl space-y-2">
        {ATALHOS.map(({ tab, label, descricao, icon: Icon }) => (
          <button
            key={tab}
            onClick={() => onNavigate(tab)}
            className="w-full flex items-center gap-3 bg-white border border-gray-200 hover:border-orange-300 rounded-xl p-4 text-left transition-colors"
          >
            <div className="h-9 w-9 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center shrink-0">
              <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-gray-800 text-sm">{label}</p>
              <p className="text-xs text-gray-400 truncate">{descricao}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-gray-300 shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
};

export default ConfiguracoesTab;
