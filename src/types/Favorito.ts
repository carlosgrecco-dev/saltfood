import { Produto } from './Produto';

export interface Favorito {
  id: string;
  clienteId: string;
  produtoId: string;
  produto: Produto;
  createdAt: string;
}
