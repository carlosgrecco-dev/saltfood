export type EscopoBackup = 'PLATAFORMA' | 'TENANT';

/** Devolvido por GET /super-admin/backups (lista) — já vem com o escopo derivado do nome do arquivo. */
export interface BackupInfo {
  nomeArquivo: string;
  tamanho: number;
  criadoEm: string;
  escopo: EscopoBackup;
  empresaId: string | null;
  empresaNome: string | null;
}

/** Devolvido pelos POST de geração — `empresaId`/`empresaNome` só vêm no backup de tenant. */
export interface BackupGerado {
  nomeArquivo: string;
  tamanho: number;
  criadoEm: string;
  totalTabelas: number;
  empresaId?: string;
  empresaNome?: string;
}
