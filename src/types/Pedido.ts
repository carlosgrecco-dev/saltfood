export type FormaPagamento = 'PIX' | 'DINHEIRO' | 'CARTAO' | 'MULTIPLO';
export type StatusPedido = 'RECEBIDO' | 'PREPARANDO' | 'SAIU_ENTREGA' | 'ENTREGUE' | 'CANCELADO';
export type TipoPedido = 'DELIVERY' | 'BALCAO' | 'MESA' | 'RETIRADA';

export const TIPO_PEDIDO_LABELS: Record<TipoPedido, string> = {
  DELIVERY: 'Delivery',
  BALCAO: 'Balcão',
  MESA: 'Mesa',
  RETIRADA: 'Retirada',
};

export const FORMA_PAGAMENTO_LABELS: Record<FormaPagamento, string> = {
  PIX: 'PIX',
  DINHEIRO: 'Dinheiro',
  CARTAO: 'Cartão na entrega',
  MULTIPLO: 'Múltiplas formas',
};

export const STATUS_PEDIDO_LABELS: Record<StatusPedido, string> = {
  RECEBIDO: 'Recebido',
  PREPARANDO: 'Em preparo',
  SAIU_ENTREGA: 'Saiu para entrega',
  ENTREGUE: 'Entregue',
  CANCELADO: 'Cancelado',
};

export interface PedidoItemOpcao {
  id: string;
  pedidoItemId: string;
  opcaoId: string | null;
  nomeGrupo: string;
  nomeOpcao: string;
  precoAdicional: number;
}

export interface PedidoItem {
  id: string;
  pedidoId: string;
  produtoId: string | null;
  nomeProduto: string;
  ehCombo: boolean;
  precoUnitario: number;
  quantidade: number;
  observacoes: string | null;
  opcoesSelecionadas: PedidoItemOpcao[];
  createdAt: string;
}

export interface Pedido {
  id: string;
  empresaId: string;
  numero: number;
  tipoPedido: TipoPedido;
  mesaIdentificador: string | null;
  clienteNome: string | null;
  clienteTelefone: string | null;
  endereco: string | null;
  bairro: string | null;
  referencia: string | null;
  subtotal: number;
  taxaEntrega: number;
  total: number;
  formaPagamento: FormaPagamento;
  trocoPara: number | null;
  pagamentoConfirmado: boolean;
  valorRecebido: number | null;
  status: StatusPedido;
  observacoes: string | null;
  agendadoPara: string | null;
  motoboyId: string | null;
  motoboy: {
    id: string;
    nome: string;
    latitudeAtual: number | null;
    longitudeAtual: number | null;
    localizacaoAtualizadaEm: string | null;
  } | null;
  taxaEntregaMotoboy: number | null;
  motoboyPago: boolean;
  fotoEntrega: string | null;
  clienteId: string | null;
  itemGratisResgatado: boolean;
  unidadesFidelidadeCreditadas: number | null;
  cupomId: string | null;
  cupomCodigo: string | null;
  descontoCupom: number | null;
  cashbackUsado: number | null;
  cashbackCreditado: number | null;
  coinsUsado: number | null;
  coinsCreditado: number | null;
  notaPedido: number | null;
  comentarioPedido: string | null;
  fotosAvaliacao: string[];
  notaComida: number | null;
  notaEmbalagem: number | null;
  notaTempo: number | null;
  avaliadoEm: string | null;
  notaMotoboy: number | null;
  comentarioMotoboy: string | null;
  motoboyAvaliadoEm: string | null;
  createdAt: string;
  preparandoEm: string | null;
  saiuEntregaEm: string | null;
  entregueEm: string | null;
  canceladoEm: string | null;
  itens: PedidoItem[];
}

export interface PedidoItemInput {
  produtoId: string;
  quantidade: number;
  observacoes?: string;
  opcoes?: string[];
}

export interface PedidoInput {
  /** Obrigatório só quando tipoPedido=DELIVERY (padrão); BALCAO/MESA/RETIRADA (só admin) dispensam. */
  clienteNome?: string;
  clienteTelefone?: string;
  endereco?: string;
  bairro?: string;
  referencia?: string;
  formaPagamento: FormaPagamento;
  trocoPara?: number;
  observacoes?: string;
  clienteId?: string;
  usarItemGratis?: boolean;
  cupomCodigo?: string;
  agendadoPara?: string;
  usarCashback?: number;
  usarCoins?: number;
  /** Só o admin (PDV/painel) pode enviar — checkout público sempre é DELIVERY. */
  tipoPedido?: TipoPedido;
  mesaIdentificador?: string;
  itens: PedidoItemInput[];
}
