export interface EnderecoCliente {
  id: string;
  clienteId: string;
  rotulo: string;
  cep: string | null;
  endereco: string;
  numero: string | null;
  bairro: string | null;
  cidade: string | null;
  referencia: string | null;
  principal: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EnderecoInput {
  rotulo: string;
  cep?: string;
  endereco: string;
  numero?: string;
  bairro?: string;
  cidade?: string;
  referencia?: string;
  principal?: boolean;
}
