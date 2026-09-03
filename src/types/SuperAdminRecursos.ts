export interface RecursoPlataforma {
  campo: string;
  label: string;
  totalTenants: number;
  percentual: number;
  tenants: { id: string; nome: string; slug: string }[];
}

export interface RecursosPlataformaResumo {
  totalEmpresas: number;
  recursos: RecursoPlataforma[];
}
