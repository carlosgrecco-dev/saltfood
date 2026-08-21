export interface SaltfoodCoinsReport {
  tenantsParticipando: number;
  totalContasPlataforma: number;
  saldoTotalAtual: number;
  totalGanhoPeriodo: number;
  totalGastoPeriodo: number;
  porLoja: {
    id: string;
    nome: string;
    slug: string;
    participa: boolean;
    percentual: number | null;
    ganhoNoPeriodo: number;
    gastoNoPeriodo: number;
    liquidoNoPeriodo: number;
  }[];
}
