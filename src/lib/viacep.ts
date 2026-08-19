export interface ViaCepAddress {
  cep: string;
  logradouro: string;
  bairro: string;
  localidade: string;
  uf: string;
}

/** Busca endereço pelo CEP na API pública ViaCEP. Retorna null se o CEP não existir. */
export async function fetchAddressByCep(cep: string): Promise<ViaCepAddress | null> {
  const digits = cep.replace(/\D/g, '');
  if (digits.length !== 8) return null;

  const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
  if (!response.ok) throw new Error('Não foi possível buscar o CEP.');

  const data = await response.json();
  if (data.erro) return null;

  return data as ViaCepAddress;
}
