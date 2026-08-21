import React, { useCallback, useEffect, useState } from 'react';
import { Save, Heart, RotateCcw, Medal, CalendarClock, Camera, Bell, Target, UserPlus, Star, LifeBuoy, Coins } from 'lucide-react';
import { fetchEmpresaById, updateFuncionalidadesConfig } from '../../lib/empresas';
import { FuncionalidadesConfigInput } from '../../types/Empresa';

interface FuncionalidadesTabProps {
  empresaId: string;
}

type CampoToggle = Exclude<keyof FuncionalidadesConfigInput, 'indicacaoRecompensaUnidades'>;

const FUNCOES: {
  campo: CampoToggle;
  titulo: string;
  descricao: string;
  icon: typeof Heart;
}[] = [
  {
    campo: 'habilitarFavoritos',
    titulo: 'Favoritos',
    descricao: 'Cliente pode marcar produtos com ❤ no cardápio e ver a lista em "Meus Favoritos".',
    icon: Heart,
  },
  {
    campo: 'habilitarPedirDeNovo',
    titulo: 'Peça de novo',
    descricao: 'Tira com os produtos mais comprados na home, e o botão "Pedir de novo" em Meus Pedidos.',
    icon: RotateCcw,
  },
  {
    campo: 'habilitarRankingFidelidade',
    titulo: 'Nível de fidelidade',
    descricao: 'Selo Bronze/Prata/Ouro no cartão fidelidade, calculado sobre o histórico de compras.',
    icon: Medal,
  },
  {
    campo: 'habilitarAgendamento',
    titulo: 'Agendar pedido',
    descricao: 'Cliente escolhe "assim que possível" ou marca um horário no checkout.',
    icon: CalendarClock,
  },
  {
    campo: 'habilitarAvaliacaoComFotos',
    titulo: 'Fotos na avaliação',
    descricao: 'Cliente pode anexar até 3 fotos ao avaliar o pedido entregue.',
    icon: Camera,
  },
  {
    campo: 'habilitarNotificacoesInApp',
    titulo: 'Central de notificações',
    descricao: 'Sininho com o histórico de atualizações do pedido — funciona mesmo sem o cliente ativar o push.',
    icon: Bell,
  },
  {
    campo: 'habilitarMissoes',
    titulo: 'Missões de fidelidade',
    descricao: 'Ex: "peça 2x essa semana e ganhe 5 unidades" — você cria as missões na aba Missões.',
    icon: Target,
  },
  {
    campo: 'habilitarIndicacaoAvancada',
    titulo: 'Indicação avançada',
    descricao: 'Recompensa configurável por indicação + bônus de marco (3/10/25 indicações concluídas).',
    icon: UserPlus,
  },
  {
    campo: 'habilitarAvaliacaoDetalhada',
    titulo: 'Avaliação detalhada',
    descricao: 'Além da nota geral, cliente avalia separadamente comida, embalagem e tempo de entrega.',
    icon: Star,
  },
  {
    campo: 'habilitarCentralSuporte',
    titulo: 'Central de suporte',
    descricao: 'Cliente abre um chamado (opcionalmente ligado a um pedido) e você responde pelo admin.',
    icon: LifeBuoy,
  },
  {
    campo: 'participaSaltfoodCoins',
    titulo: 'SaltFood Coins',
    descricao: 'Sua loja passa a participar da carteira de coins válida em outras lojas da plataforma — clientes ganham e/ou gastam aqui, conforme o percentual configurado na aba Fidelidade.',
    icon: Coins,
  },
];

const FuncionalidadesTab: React.FC<FuncionalidadesTabProps> = ({ empresaId }) => {
  const [config, setConfig] = useState<FuncionalidadesConfigInput | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const empresa = await fetchEmpresaById(empresaId);
      setConfig({
        habilitarFavoritos: empresa.habilitarFavoritos,
        habilitarPedirDeNovo: empresa.habilitarPedirDeNovo,
        habilitarRankingFidelidade: empresa.habilitarRankingFidelidade,
        habilitarAgendamento: empresa.habilitarAgendamento,
        habilitarAvaliacaoComFotos: empresa.habilitarAvaliacaoComFotos,
        habilitarNotificacoesInApp: empresa.habilitarNotificacoesInApp,
        habilitarMissoes: empresa.habilitarMissoes,
        habilitarIndicacaoAvancada: empresa.habilitarIndicacaoAvancada,
        habilitarAvaliacaoDetalhada: empresa.habilitarAvaliacaoDetalhada,
        habilitarCentralSuporte: empresa.habilitarCentralSuporte,
        participaSaltfoodCoins: empresa.participaSaltfoodCoins,
        indicacaoRecompensaUnidades: empresa.indicacaoRecompensaUnidades,
      });
    } catch {
      /* silencioso */
    } finally {
      setLoading(false);
    }
  }, [empresaId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleToggle = (campo: CampoToggle) => {
    setConfig((prev) => (prev ? { ...prev, [campo]: !prev[campo] } : prev));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config) return;
    setError('');
    setSuccess(false);
    setSaving(true);
    try {
      await updateFuncionalidadesConfig(empresaId, config);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar funcionalidades');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !config) {
    return <p className="text-center text-gray-500 py-8">Carregando...</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <p className="text-sm text-gray-500">
        Funções novas nascem desligadas — ligue aqui as que fazem sentido pra sua loja. O que estiver desligado
        não aparece pros seus clientes.
      </p>

      <div className="space-y-3">
        {FUNCOES.map(({ campo, titulo, descricao, icon: Icon }) => (
          <React.Fragment key={campo}>
            <label
              className={`flex items-start gap-3 border rounded-xl p-4 cursor-pointer transition-colors ${
                config[campo] ? 'border-orange-300 bg-orange-50/40' : 'border-gray-200 bg-gray-50'
              }`}
            >
              <input
                type="checkbox"
                checked={config[campo]}
                onChange={() => handleToggle(campo)}
                className="mt-1 w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
              />
              <Icon className="h-5 w-5 text-orange-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-gray-800 text-sm">{titulo}</p>
                <p className="text-xs text-gray-500 mt-0.5">{descricao}</p>
              </div>
            </label>

            {campo === 'habilitarIndicacaoAvancada' && config.habilitarIndicacaoAvancada && (
              <div className="ml-7 flex items-center gap-2 -mt-1">
                <span className="text-sm text-gray-500">Unidades por indicação concluída:</span>
                <input
                  type="number"
                  min={1}
                  value={config.indicacaoRecompensaUnidades}
                  onChange={(e) => setConfig((prev) => (prev ? { ...prev, indicacaoRecompensaUnidades: Number(e.target.value) || 1 } : prev))}
                  className="w-20 px-2 py-1.5 border border-gray-300 rounded-lg text-sm text-center"
                />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>}
      {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm">Funcionalidades salvas com sucesso!</div>}

      <button
        type="submit"
        disabled={saving}
        className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white text-sm px-5 py-2.5 rounded-lg disabled:opacity-60"
      >
        <Save className="h-4 w-4" /> {saving ? 'Salvando...' : 'Salvar funcionalidades'}
      </button>
    </form>
  );
};

export default FuncionalidadesTab;
