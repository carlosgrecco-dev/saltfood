import { Heart, RotateCcw, Medal, CalendarClock, Camera, Bell, Target, UserPlus, Star, LifeBuoy, ShoppingBag } from 'lucide-react';
import { FuncionalidadesConfigInput } from '../types/Empresa';

export type CampoFuncionalidade = Exclude<keyof FuncionalidadesConfigInput, 'indicacaoRecompensaUnidades'>;

/**
 * As 10 funcionalidades opt-in da loja — metadado único reaproveitado em 3 lugares: a aba
 * (somente leitura) do admin do lojista, o editor de pacote do plano e a exceção pontual por
 * loja no Super Admin. Espelha CAMPOS_FUNCIONALIDADES em api/src/lib/funcionalidades.js.
 */
export const FUNCOES: {
  campo: CampoFuncionalidade;
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
    campo: 'pdvHabilitado',
    titulo: 'PDV — balcão e mesa',
    descricao: 'Libera a aba de PDV no app do lojista: venda de balcão/mesa/retirada, pagamento e caixa.',
    icon: ShoppingBag,
  },
];
