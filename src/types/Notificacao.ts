export interface NotificacaoCliente {
  id: string;
  clienteId: string;
  titulo: string;
  corpo: string;
  url: string | null;
  lida: boolean;
  createdAt: string;
}
