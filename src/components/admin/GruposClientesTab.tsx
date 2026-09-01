import React, { useEffect, useState } from 'react';
import { Users, Download, Phone, Mail } from 'lucide-react';
import { RfmResumo, RfmSegmento, RFM_SEGMENT_BADGE_CLASSES } from '../../types/Rfm';
import { fetchRfm } from '../../lib/rfm';

interface GruposClientesTabProps {
  empresaId: string;
}

const SEGMENTO_DESCRICAO: Record<RfmSegmento, string> = {
  CAMPEOES: 'Compraram recentemente, compram com frequência e gastam bem — seus melhores clientes.',
  FIEIS: 'Compram com frequência e gastam bem, mesmo sem ser os mais recentes.',
  POTENCIAIS: 'Compraram recentemente, mas ainda não têm frequência ou gasto alto — dá pra fidelizar.',
  EM_RISCO: 'Já foram bons clientes (frequência ou gasto), mas sumiram há um tempo.',
  PERDIDOS: 'Sem compras recentes, baixa frequência e baixo gasto.',
};

const SEGMENTO_ORDEM: RfmSegmento[] = ['CAMPEOES', 'FIEIS', 'POTENCIAIS', 'EM_RISCO', 'PERDIDOS'];

const GruposClientesTab: React.FC<GruposClientesTabProps> = ({ empresaId }) => {
  const [resumo, setResumo] = useState<RfmResumo | null>(null);
  const [loading, setLoading] = useState(true);
  const [segmentoAtivo, setSegmentoAtivo] = useState<RfmSegmento>('CAMPEOES');

  useEffect(() => {
    fetchRfm(empresaId)
      .then(setResumo)
      .catch(() => setResumo(null))
      .finally(() => setLoading(false));
  }, [empresaId]);

  if (loading) return <p className="text-center text-gray-500 py-8 text-sm">Carregando...</p>;
  if (!resumo || resumo.totalClientes === 0) {
    return <p className="text-center text-gray-500 py-10 text-sm">Ainda não há pedidos entregues suficientes pra calcular os grupos.</p>;
  }

  const grupoAtivo = resumo.segmentos.find((s) => s.segmento === segmentoAtivo);
  const clientes = grupoAtivo?.clientes ?? [];

  const handleExportarCsv = () => {
    const linhas = clientes.map((c) => [c.nome, c.telefone || '', c.email || '', c.frequencia, c.monetario.toFixed(2), c.recenciaDias, c.ultimaCompraEm ? new Date(c.ultimaCompraEm).toLocaleDateString('pt-BR') : '']);
    const csv = [
      ['Nome', 'Telefone', 'Email', 'Pedidos entregues', 'Total gasto', 'Dias desde última compra', 'Última compra'],
      ...linhas,
    ].map((l) => l.join(';')).join('\n');
    const blob = new Blob(['﻿', csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `clientes-${(grupoAtivo?.label || 'grupo').toLowerCase()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        {SEGMENTO_ORDEM.map((seg) => {
          const grupo = resumo.segmentos.find((s) => s.segmento === seg);
          const qtd = grupo?.clientes.length ?? 0;
          return (
            <button
              key={seg}
              onClick={() => setSegmentoAtivo(seg)}
              className={`text-left border-2 rounded-2xl p-3 transition-colors ${segmentoAtivo === seg ? RFM_SEGMENT_BADGE_CLASSES[seg] : 'border-gray-200 bg-white hover:border-gray-300'}`}
            >
              <p className="text-xs font-bold uppercase tracking-wide">{grupo?.label || seg}</p>
              <p className="text-xl font-bold">{qtd}</p>
            </button>
          );
        })}
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-bold text-gray-800 flex items-center gap-1.5"><Users className="h-4 w-4 text-orange-500" /> {grupoAtivo?.label}</p>
            <p className="text-xs text-gray-500 mt-0.5">{SEGMENTO_DESCRICAO[segmentoAtivo]}</p>
          </div>
          <button onClick={handleExportarCsv} disabled={clientes.length === 0} className="flex items-center gap-1.5 text-xs font-medium border border-gray-300 text-gray-600 hover:bg-gray-50 px-3 py-1.5 rounded-lg disabled:opacity-50">
            <Download className="h-3.5 w-3.5" /> Exportar CSV
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-gray-500 bg-gray-50">
                <th className="py-2.5 px-4">Cliente</th>
                <th className="py-2.5 px-4">Pedidos</th>
                <th className="py-2.5 px-4">Total gasto</th>
                <th className="py-2.5 px-4">Última compra</th>
              </tr>
            </thead>
            <tbody>
              {clientes.map((c) => (
                <tr key={c.clienteId} className="border-b border-gray-100">
                  <td className="py-2.5 px-4">
                    <p className="font-medium text-gray-800">{c.nome}</p>
                    <p className="text-xs text-gray-400 flex items-center gap-2.5">
                      {c.telefone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {c.telefone}</span>}
                      {c.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {c.email}</span>}
                    </p>
                  </td>
                  <td className="py-2.5 px-4">{c.frequencia}</td>
                  <td className="py-2.5 px-4 font-medium text-gray-800">R$ {c.monetario.toFixed(2)}</td>
                  <td className="py-2.5 px-4 text-xs text-gray-500">{c.recenciaDias >= 9999 ? '—' : `há ${c.recenciaDias} dia(s)`}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {clientes.length === 0 && <p className="text-center text-gray-400 text-sm py-10">Nenhum cliente neste grupo.</p>}
        </div>
      </div>
    </div>
  );
};

export default GruposClientesTab;
