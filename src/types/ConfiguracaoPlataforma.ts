export interface ConfiguracaoPlataforma {
  id: string;
  nomeEmpresa: string;
  documento: string | null;
  emailSuporte: string | null;
  telefoneSuporte: string | null;
  endereco: string | null;
  termosPadraoLojistas: string | null;
  chavesGlobais: Record<string, string> | null;
  updatedAt: string;
}

export interface ConfiguracaoPlataformaInput {
  nomeEmpresa: string;
  documento: string;
  emailSuporte: string;
  telefoneSuporte: string;
  endereco: string;
  termosPadraoLojistas: string;
  chavesGlobais: Record<string, string>;
}
