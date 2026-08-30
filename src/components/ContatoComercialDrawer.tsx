import React, { useEffect, useState } from 'react';
import { CheckCircle2, Send } from 'lucide-react';
import BottomSheet from './BottomSheet';
import { enviarLeadComercial } from '../lib/leadsComerciais';
import { fetchPlanosPublico } from '../lib/planos';
import { PlanoPublico } from '../types/Plano';

interface ContatoComercialDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  /** De qual página pública o drawer foi aberto — só pra saber o que está convertendo. */
  origem: 'landing' | 'parceiro' | 'recursos' | 'politica-privacidade';
  /** Pré-seleciona um plano quando o drawer é aberto a partir de um card de plano específico. */
  planoIdInicial?: string;
}

/** Painel de contato comercial — preenche e vira um LeadComercial visível só pro Super Admin
 * (ver front/src/pages/SuperAdminLeadsPage.tsx). Reaproveita o mesmo BottomSheet do carrinho do
 * cliente, mas sem nenhuma dependência de tema por tenant (--cor-primaria) — é uma página da
 * própria plataforma, não de uma loja. */
const ContatoComercialDrawer: React.FC<ContatoComercialDrawerProps> = ({ isOpen, onClose, origem, planoIdInicial }) => {
  const [planos, setPlanos] = useState<PlanoPublico[]>([]);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [planoInteresseId, setPlanoInteresseId] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchPlanosPublico().then(setPlanos).catch(() => setPlanos([]));
      setPlanoInteresseId(planoIdInicial || '');
    }
  }, [isOpen, planoIdInicial]);

  const handleClose = () => {
    onClose();
    // Reseta pro próximo uso, com um pequeno atraso pra não "piscar" o formulário limpo antes do
    // sheet terminar a animação de fechar.
    setTimeout(() => {
      setNome('');
      setEmail('');
      setTelefone('');
      setMensagem('');
      setEnviado(false);
      setErro('');
    }, 300);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setEnviando(true);
    try {
      await enviarLeadComercial({
        nome,
        email,
        telefone: telefone || undefined,
        mensagem: mensagem || undefined,
        planoInteresseId: planoInteresseId || undefined,
        origem,
        _hp: honeypot,
      });
      setEnviado(true);
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não foi possível enviar. Tente de novo.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={handleClose} title={enviado ? undefined : 'Fale com a gente'} hideHeader={enviado}>
      {enviado ? (
        <div className="p-8 text-center">
          <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-900">Recebemos seu contato!</h3>
          <p className="text-sm text-slate-500 mt-2">Alguém da nossa equipe volta pra você em breve.</p>
          <button
            onClick={handleClose}
            className="mt-6 bg-slate-900 text-white text-sm font-semibold px-6 py-2.5 rounded-xl"
          >
            Fechar
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-sm text-slate-500 -mt-1">
            Conta um pouco pra gente e te chamamos pra falar sobre o SaltFood na sua loja.
          </p>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Nome</label>
            <input
              required
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">E-mail</label>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Telefone (opcional)</label>
            <input
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
            />
          </div>
          {planos.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Qual plano te interessa? (opcional)</label>
              <select
                value={planoInteresseId}
                onChange={(e) => setPlanoInteresseId(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
              >
                <option value="">Ainda não sei</option>
                {planos.map((p) => (
                  <option key={p.id} value={p.id}>{p.nome}</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Mensagem (opcional)</label>
            <textarea
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value)}
              rows={3}
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none resize-none"
            />
          </div>

          {/* Campo-armadilha anti-bot: fora da tela, nunca visível/preenchível por uma pessoa de verdade. */}
          <input
            type="text"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
            tabIndex={-1}
            autoComplete="off"
            className="absolute -left-[9999px] w-px h-px opacity-0"
            aria-hidden="true"
          />

          {erro && <p className="text-sm text-red-600">{erro}</p>}

          <button
            type="submit"
            disabled={enviando}
            className="w-full flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white font-semibold text-sm py-3 rounded-xl transition-colors"
          >
            <Send className="h-4 w-4" /> {enviando ? 'Enviando...' : 'Enviar'}
          </button>
        </form>
      )}
    </BottomSheet>
  );
};

export default ContatoComercialDrawer;
