import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Plus, Trash2, Pencil, X, Ticket, Search, Download, ChevronLeft, ChevronRight,
  LayoutGrid, Table as TableIcon, CheckCircle2, Clock, XCircle, BarChart3, Copy, Lightbulb, Percent,
} from 'lucide-react';
import { fetchCuponsAdminResumo, createCupom, updateCupom, setCupomStatus, deleteCupom } from '../../lib/cupons';
import { fetchClientes } from '../../lib/clientes';
import {
  Cupom, CupomInput, TipoCupom, TIPO_CUPOM_LABELS, StatusCupomCalculado, STATUS_CUPOM_LABELS,
  FormaPagamentoCupom, FORMA_PAGAMENTO_CUPOM_LABELS, DIAS_SEMANA_LABELS, CupomAdminStats,
} from '../../types/Cupom';
import { Cliente } from '../../types/Cliente';
import DonutChart from '../DonutChart';
import BottomSheet from '../BottomSheet';

interface CuponsTabProps {
  empresaId: string;
}

const emptyForm = {
  codigo: '',
  descricao: '',
  tipo: 'PERCENTUAL' as TipoCupom,
  valor: '',
  apenasPrimeiraCompra: false,
  valorMinimoPedido: '',
  usoMaximo: '',
  validoDe: '',
  validoAte: '',
  clienteAlvoId: '',
  formaPagamentoRestrita: '' as FormaPagamentoCupom | '',
  diaSemanaRestrito: '' as number | '',
  apenasClientesFieis: false,
  bairrosRestritos: [] as string[],
};

const STATUS_CORES: Record<StatusCupomCalculado, string> = {
  ATIVO: 'bg-emerald-100 text-emerald-800',
  AGENDADO: 'bg-amber-100 text-amber-800',
  EXPIRADO: 'bg-gray-200 text-gray-600',
  ESGOTADO: 'bg-gray-200 text-gray-600',
  INATIVO: 'bg-gray-200 text-gray-600',
};

const TIPO_CORES: Record<TipoCupom, string> = {
  PERCENTUAL: 'bg-purple-100 text-purple-700',
  VALOR_FIXO: 'bg-emerald-100 text-emerald-700',
  FRETE_GRATIS: 'bg-blue-100 text-blue-700',
};

const TIPO_DONUT_CORES: Record<TipoCupom, { colorClass: string; strokeClass: string }> = {
  PERCENTUAL: { colorClass: 'bg-purple-500', strokeClass: 'stroke-purple-500' },
  VALOR_FIXO: { colorClass: 'bg-emerald-500', strokeClass: 'stroke-emerald-500' },
  FRETE_GRATIS: { colorClass: 'bg-blue-500', strokeClass: 'stroke-blue-500' },
};

const formatData = (iso: string) => new Date(`${iso.slice(0, 10)}T00:00:00`).toLocaleDateString('pt-BR');

const publicoDoCupom = (cupom: Cupom, nomeCliente: (id: string) => string): string => {
  if (cupom.clienteAlvoId) return `Pessoal — ${nomeCliente(cupom.clienteAlvoId)}`;
  if (cupom.apenasPrimeiraCompra) return 'Novos clientes';
  if (cupom.apenasClientesFieis) return 'Clientes fiéis';
  if (cupom.formaPagamentoRestrita) return `Pagamento em ${FORMA_PAGAMENTO_CUPOM_LABELS[cupom.formaPagamentoRestrita]}`;
  return 'Todos';
};

const ITENS_POR_PAGINA = 8;

const CuponsTab: React.FC<CuponsTabProps> = ({ empresaId }) => {
  const [cupons, setCupons] = useState<Cupom[]>([]);
  const [stats, setStats] = useState<CupomAdminStats | null>(null);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [novoBairro, setNovoBairro] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<StatusCupomCalculado | ''>('');
  const [filtroTipo, setFiltroTipo] = useState<TipoCupom | ''>('');
  const [visao, setVisao] = useState<'tabela' | 'grade'>('tabela');
  const [pagina, setPagina] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [resumo, listaClientes] = await Promise.all([fetchCuponsAdminResumo(empresaId), fetchClientes(empresaId)]);
      setCupons(resumo.cupons);
      setStats(resumo.stats);
      setClientes(listaClientes);
    } catch {
      /* silencioso */
    } finally {
      setLoading(false);
    }
  }, [empresaId]);

  useEffect(() => {
    load();
  }, [load]);

  const nomeCliente = (id: string) => clientes.find((c) => c.id === id)?.nome || 'cliente removido';

  const resetForm = () => {
    setForm(emptyForm);
    setNovoBairro('');
    setEditingId(null);
    setError('');
  };

  const abrirNovo = () => {
    resetForm();
    setModalAberto(true);
  };

  const fecharModal = () => {
    setModalAberto(false);
    resetForm();
  };

  const handleEdit = (cupom: Cupom) => {
    setEditingId(cupom.id);
    setForm({
      codigo: cupom.codigo,
      descricao: cupom.descricao || '',
      tipo: cupom.tipo,
      valor: cupom.valor != null ? String(cupom.valor) : '',
      apenasPrimeiraCompra: cupom.apenasPrimeiraCompra,
      valorMinimoPedido: cupom.valorMinimoPedido != null ? String(cupom.valorMinimoPedido) : '',
      usoMaximo: cupom.usoMaximo != null ? String(cupom.usoMaximo) : '',
      validoDe: cupom.validoDe ? cupom.validoDe.slice(0, 10) : '',
      validoAte: cupom.validoAte ? cupom.validoAte.slice(0, 10) : '',
      clienteAlvoId: cupom.clienteAlvoId || '',
      formaPagamentoRestrita: cupom.formaPagamentoRestrita || '',
      diaSemanaRestrito: cupom.diaSemanaRestrito ?? '',
      apenasClientesFieis: cupom.apenasClientesFieis,
      bairrosRestritos: cupom.bairrosRestritos,
    });
    setModalAberto(true);
  };

  const adicionarBairro = () => {
    const nome = novoBairro.trim();
    if (!nome || form.bairrosRestritos.includes(nome)) return;
    setForm((prev) => ({ ...prev, bairrosRestritos: [...prev.bairrosRestritos, nome] }));
    setNovoBairro('');
  };

  const removerBairro = (nome: string) => {
    setForm((prev) => ({ ...prev, bairrosRestritos: prev.bairrosRestritos.filter((b) => b !== nome) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.codigo) {
      setError('Informe o código do cupom.');
      return;
    }
    if (form.tipo !== 'FRETE_GRATIS' && (!form.valor || Number(form.valor) <= 0)) {
      setError('Informe um valor maior que zero.');
      return;
    }

    const payload: CupomInput = {
      codigo: form.codigo,
      descricao: form.descricao || undefined,
      tipo: form.tipo,
      valor: form.tipo !== 'FRETE_GRATIS' ? Number(form.valor) : undefined,
      apenasPrimeiraCompra: form.apenasPrimeiraCompra,
      valorMinimoPedido: form.valorMinimoPedido ? Number(form.valorMinimoPedido) : undefined,
      usoMaximo: form.usoMaximo ? Number(form.usoMaximo) : undefined,
      validoDe: form.validoDe || undefined,
      validoAte: form.validoAte || undefined,
      clienteAlvoId: form.clienteAlvoId || null,
      formaPagamentoRestrita: form.formaPagamentoRestrita || null,
      diaSemanaRestrito: form.diaSemanaRestrito === '' ? null : Number(form.diaSemanaRestrito),
      apenasClientesFieis: form.apenasClientesFieis,
      bairrosRestritos: form.bairrosRestritos,
    };

    setSaving(true);
    try {
      if (editingId) {
        await updateCupom(empresaId, editingId, payload);
      } else {
        await createCupom(empresaId, payload);
      }
      fecharModal();
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar cupom');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleAtivo = async (cupom: Cupom) => {
    await setCupomStatus(empresaId, cupom.id, !cupom.ativo);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Remover este cupom?')) return;
    await deleteCupom(empresaId, id);
    load();
  };

  const handleDuplicar = (cupom: Cupom) => {
    setEditingId(null);
    setForm({
      codigo: `${cupom.codigo}_COPIA`,
      descricao: cupom.descricao || '',
      tipo: cupom.tipo,
      valor: cupom.valor != null ? String(cupom.valor) : '',
      apenasPrimeiraCompra: cupom.apenasPrimeiraCompra,
      valorMinimoPedido: cupom.valorMinimoPedido != null ? String(cupom.valorMinimoPedido) : '',
      usoMaximo: cupom.usoMaximo != null ? String(cupom.usoMaximo) : '',
      validoDe: '',
      validoAte: cupom.validoAte ? cupom.validoAte.slice(0, 10) : '',
      clienteAlvoId: cupom.clienteAlvoId || '',
      formaPagamentoRestrita: cupom.formaPagamentoRestrita || '',
      diaSemanaRestrito: cupom.diaSemanaRestrito ?? '',
      apenasClientesFieis: cupom.apenasClientesFieis,
      bairrosRestritos: cupom.bairrosRestritos,
    });
    setModalAberto(true);
  };

  const handleExportarCsv = () => {
    const csvField = (v: string | number) => {
      const str = String(v ?? '');
      return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
    };
    const cabecalho = ['Código', 'Tipo', 'Valor', 'Uso', 'Limite', 'Válido até', 'Status'];
    const linhas = cuponsFiltrados.map((c) => [
      c.codigo, TIPO_CUPOM_LABELS[c.tipo], c.valor ?? '', c.usosRealizados, c.usoMaximo ?? 'ilimitado',
      c.validoAte ? formatData(c.validoAte) : '', STATUS_CUPOM_LABELS[c.statusCalculado || 'ATIVO'],
    ]);
    const csv = [cabecalho, ...linhas].map((l) => l.map(csvField).join(',')).join('\r\n');
    const blob = new Blob(['﻿', csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cupons.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const cuponsFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return cupons.filter((c) => {
      if (termo && !c.codigo.toLowerCase().includes(termo) && !(c.descricao || '').toLowerCase().includes(termo)) return false;
      if (filtroStatus && c.statusCalculado !== filtroStatus) return false;
      if (filtroTipo && c.tipo !== filtroTipo) return false;
      return true;
    });
  }, [cupons, busca, filtroStatus, filtroTipo]);

  const totalPaginas = Math.max(1, Math.ceil(cuponsFiltrados.length / ITENS_POR_PAGINA));
  const paginaAtual = Math.min(pagina, totalPaginas);
  const cuponsPagina = cuponsFiltrados.slice((paginaAtual - 1) * ITENS_POR_PAGINA, paginaAtual * ITENS_POR_PAGINA);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <h2 className="text-lg font-bold text-gray-800">Cupons</h2>
          <p className="text-sm text-gray-500">Crie cupons de desconto e incentive ainda mais suas vendas</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleExportarCsv} className="flex items-center gap-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm px-3.5 py-2 rounded-lg">
            <Download className="h-4 w-4" /> Exportar
          </button>
          <button onClick={abrirNovo} className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white text-sm px-4 py-2 rounded-lg">
            <Plus className="h-4 w-4" /> Novo cupom
          </button>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-5">
          <div className="bg-white border border-gray-200 rounded-2xl p-4">
            <p className="text-xs text-gray-500 mb-1 flex items-center gap-1.5"><Ticket className="h-3.5 w-3.5 text-purple-500" /> Total de cupons</p>
            <p className="text-xl font-bold text-gray-800">{stats.total}</p>
            <p className="text-[11px] text-gray-400">Cadastrados</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-4">
            <p className="text-xs text-gray-500 mb-1 flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Ativos</p>
            <p className="text-xl font-bold text-gray-800">{stats.ativos}</p>
            <p className="text-[11px] text-gray-400">{stats.total > 0 ? ((stats.ativos / stats.total) * 100).toFixed(1) : 0}% do total</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-4">
            <p className="text-xs text-gray-500 mb-1 flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-amber-500" /> Agendados</p>
            <p className="text-xl font-bold text-gray-800">{stats.agendados}</p>
            <p className="text-[11px] text-gray-400">Para começar</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-4">
            <p className="text-xs text-gray-500 mb-1 flex items-center gap-1.5"><XCircle className="h-3.5 w-3.5 text-red-500" /> Expirados</p>
            <p className="text-xl font-bold text-gray-800">{stats.expirados}</p>
            <p className="text-[11px] text-gray-400">{stats.total > 0 ? ((stats.expirados / stats.total) * 100).toFixed(1) : 0}% do total</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-4">
            <p className="text-xs text-gray-500 mb-1 flex items-center gap-1.5"><BarChart3 className="h-3.5 w-3.5 text-blue-500" /> Usados este mês</p>
            <p className="text-xl font-bold text-gray-800">{stats.usosMesAtual.toLocaleString('pt-BR')}</p>
            {stats.usosMesAnterior > 0 && (
              <p className="text-[11px] text-emerald-600">↑ {(((stats.usosMesAtual - stats.usosMesAnterior) / stats.usosMesAnterior) * 100).toFixed(1)}% vs mês anterior</p>
            )}
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-4">
            <p className="text-xs text-gray-500 mb-1 flex items-center gap-1.5"><Percent className="h-3.5 w-3.5 text-purple-500" /> Desconto concedido</p>
            <p className="text-xl font-bold text-gray-800">R$ {stats.descontoMesAtual.toFixed(2)}</p>
            {stats.descontoMesAnterior > 0 && (
              <p className="text-[11px] text-emerald-600">↑ {(((stats.descontoMesAtual - stats.descontoMesAnterior) / stats.descontoMesAnterior) * 100).toFixed(1)}% vs mês anterior</p>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            value={busca}
            onChange={(e) => { setBusca(e.target.value); setPagina(1); }}
            placeholder="Buscar por código ou descrição..."
            className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm"
          />
        </div>
        <select value={filtroStatus} onChange={(e) => { setFiltroStatus(e.target.value as StatusCupomCalculado | ''); setPagina(1); }} className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white">
          <option value="">Todos os status</option>
          {(Object.keys(STATUS_CUPOM_LABELS) as StatusCupomCalculado[]).map((s) => (
            <option key={s} value={s}>{STATUS_CUPOM_LABELS[s]}</option>
          ))}
        </select>
        <select value={filtroTipo} onChange={(e) => { setFiltroTipo(e.target.value as TipoCupom | ''); setPagina(1); }} className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white">
          <option value="">Todos os tipos</option>
          {(Object.keys(TIPO_CUPOM_LABELS) as TipoCupom[]).map((t) => (
            <option key={t} value={t}>{TIPO_CUPOM_LABELS[t]}</option>
          ))}
        </select>
        <div className="flex border border-gray-300 rounded-lg overflow-hidden shrink-0">
          <button onClick={() => setVisao('tabela')} className={`p-2.5 ${visao === 'tabela' ? 'bg-orange-500 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}>
            <TableIcon className="h-4 w-4" />
          </button>
          <button onClick={() => setVisao('grade')} className={`p-2.5 border-l border-gray-300 ${visao === 'grade' ? 'bg-orange-500 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}>
            <LayoutGrid className="h-4 w-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-center text-gray-500 py-8">Carregando...</p>
      ) : visao === 'tabela' ? (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-gray-500 bg-gray-50">
                  <th className="py-3 px-4">Cupom</th>
                  <th className="py-3 px-4">Tipo</th>
                  <th className="py-3 px-4">Desconto</th>
                  <th className="py-3 px-4">Uso</th>
                  <th className="py-3 px-4">Validade</th>
                  <th className="py-3 px-4">Público</th>
                  <th className="py-3 px-4">Mínimo</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Ações</th>
                </tr>
              </thead>
              <tbody>
                {cuponsPagina.map((cupom) => {
                  const percentualUso = cupom.usoMaximo ? Math.min(100, (cupom.usosRealizados / cupom.usoMaximo) * 100) : 0;
                  return (
                    <tr key={cupom.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <p className="font-mono font-bold text-gray-800">{cupom.codigo}</p>
                        {cupom.descricao && <p className="text-xs text-gray-400">{cupom.descricao}</p>}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${TIPO_CORES[cupom.tipo]}`}>{TIPO_CUPOM_LABELS[cupom.tipo]}</span>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-medium text-gray-800">{cupom.tipo === 'PERCENTUAL' ? `${cupom.valor}%` : cupom.tipo === 'VALOR_FIXO' ? `R$ ${Number(cupom.valor).toFixed(2)}` : '100%'}</p>
                        {cupom.valorMinimoPedido != null && <p className="text-xs text-gray-400">Mín. R$ {Number(cupom.valorMinimoPedido).toFixed(2)}</p>}
                      </td>
                      <td className="py-3 px-4 min-w-[110px]">
                        <p className="text-gray-700">{cupom.usosRealizados} / {cupom.usoMaximo ?? '∞'}</p>
                        {cupom.usoMaximo != null && (
                          <div className="h-1.5 w-24 bg-gray-100 rounded-full overflow-hidden mt-1">
                            <div className="h-full bg-orange-500 rounded-full" style={{ width: `${percentualUso}%` }} />
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-xs text-gray-600">
                        {cupom.validoDe || cupom.validoAte ? (
                          <>
                            {cupom.validoDe ? formatData(cupom.validoDe) : '—'} a {cupom.validoAte ? formatData(cupom.validoAte) : '—'}
                          </>
                        ) : (
                          'Sem validade'
                        )}
                        {cupom.diaSemanaRestrito != null && <p className="text-gray-400">{DIAS_SEMANA_LABELS[cupom.diaSemanaRestrito]}</p>}
                      </td>
                      <td className="py-3 px-4 text-gray-700">
                        {publicoDoCupom(cupom, nomeCliente)}
                        {cupom.bairrosRestritos.length > 0 && (
                          <p className="text-xs text-gray-400 truncate max-w-[140px]">{cupom.bairrosRestritos.join(', ')}</p>
                        )}
                      </td>
                      <td className="py-3 px-4 text-gray-700">{cupom.valorMinimoPedido != null ? `R$ ${Number(cupom.valorMinimoPedido).toFixed(2)}` : '—'}</td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleToggleAtivo(cupom)}
                          className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_CORES[cupom.statusCalculado || (cupom.ativo ? 'ATIVO' : 'INATIVO')]}`}
                        >
                          {STATUS_CUPOM_LABELS[cupom.statusCalculado || (cupom.ativo ? 'ATIVO' : 'INATIVO')]}
                        </button>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <button onClick={() => handleDuplicar(cupom)} title="Duplicar" className="text-gray-400 hover:text-gray-700">
                            <Copy className="h-4 w-4" />
                          </button>
                          <span title={`${cupom.usosRealizados} usos no total`} className="text-gray-400"><BarChart3 className="h-4 w-4" /></span>
                          <button onClick={() => handleEdit(cupom)} className="text-gray-400 hover:text-gray-700"><Pencil className="h-4 w-4" /></button>
                          <button onClick={() => handleDelete(cupom.id)} className="text-red-500 hover:text-red-700"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {cuponsPagina.length === 0 && <p className="text-center text-gray-500 py-10">Nenhum cupom encontrado.</p>}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              Mostrando {cuponsFiltrados.length === 0 ? 0 : (paginaAtual - 1) * ITENS_POR_PAGINA + 1} a{' '}
              {Math.min(paginaAtual * ITENS_POR_PAGINA, cuponsFiltrados.length)} de {cuponsFiltrados.length} cupons
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPagina((p) => Math.max(1, p - 1))} disabled={paginaAtual === 1} className="p-2 border border-gray-300 rounded-lg disabled:opacity-40">
                <ChevronLeft className="h-4 w-4" />
              </button>
              {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((p) => (
                <button key={p} onClick={() => setPagina(p)} className={`h-8 w-8 rounded-lg text-sm font-medium ${p === paginaAtual ? 'bg-orange-500 text-white' : 'border border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
                  {p}
                </button>
              ))}
              <button onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))} disabled={paginaAtual === totalPaginas} className="p-2 border border-gray-300 rounded-lg disabled:opacity-40">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cuponsPagina.map((cupom) => (
            <div key={cupom.id} className="bg-white border border-gray-200 rounded-2xl p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-50">
                  <Ticket className="h-4 w-4 text-orange-500" />
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${STATUS_CORES[cupom.statusCalculado || (cupom.ativo ? 'ATIVO' : 'INATIVO')]}`}>
                  {STATUS_CUPOM_LABELS[cupom.statusCalculado || (cupom.ativo ? 'ATIVO' : 'INATIVO')]}
                </span>
              </div>
              <p className="font-mono font-bold text-gray-800">{cupom.codigo}</p>
              <p className="text-xs text-gray-400 mb-2">{cupom.descricao}</p>
              <p className="text-sm text-gray-600 mb-2">{cupom.usosRealizados} / {cupom.usoMaximo ?? '∞'} usos</p>
              <div className="flex items-center justify-end gap-2">
                <button onClick={() => handleEdit(cupom)} className="text-gray-400 hover:text-gray-700"><Pencil className="h-3.5 w-3.5" /></button>
                <button onClick={() => handleDelete(cupom.id)} className="text-red-500 hover:text-red-700"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            </div>
          ))}
          {cuponsPagina.length === 0 && <p className="col-span-full text-center text-gray-500 py-10">Nenhum cupom encontrado.</p>}
        </div>
      )}

      {stats && (
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-4">
            <h3 className="font-bold text-gray-800 mb-3 text-sm">Tipos de desconto</h3>
            <DonutChart
              formatValue={(v) => v.toFixed(0)}
              segments={stats.porTipo.map((t) => ({ label: TIPO_CUPOM_LABELS[t.tipo], value: t.quantidade, ...TIPO_DONUT_CORES[t.tipo] }))}
            />
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-4">
            <h3 className="font-bold text-gray-800 mb-3 text-sm">Top cupons por uso</h3>
            <div className="space-y-2">
              {stats.topCupons.map((c, i) => (
                <div key={c.codigo} className="flex items-center gap-2 text-sm">
                  <span className="text-gray-400 w-4">{i + 1}</span>
                  <span className="font-mono font-medium text-gray-800 flex-1 truncate">{c.codigo}</span>
                  <span className="text-gray-500">{c.usos} usos</span>
                </div>
              ))}
              {stats.topCupons.length === 0 && <p className="text-gray-400 text-sm">Nenhum cupom usado ainda</p>}
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-4">
            <h3 className="font-bold text-gray-800 mb-3 text-sm">Resumo de desempenho</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Total de usos</span><span className="font-bold text-gray-800">{stats.usosMesAtual.toLocaleString('pt-BR')}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Desconto concedido</span><span className="font-bold text-gray-800">R$ {stats.descontoMesAtual.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Ticket médio com cupom</span><span className="font-bold text-gray-800">R$ {stats.ticketMedioComCupom.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Economia média por pedido</span><span className="font-bold text-gray-800">R$ {stats.economiaMediaPorPedido.toFixed(2)}</span></div>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-4">
            <h3 className="font-bold text-gray-800 mb-3 text-sm flex items-center gap-1.5"><Lightbulb className="h-4 w-4 text-amber-500" /> Dicas para mais vendas</h3>
            <ul className="space-y-1.5 text-sm text-gray-600">
              <li>• Crie cupons exclusivos para novos clientes</li>
              <li>• Ofereça desconto progressivo por valor de compra</li>
              <li>• Use cupons com prazo limitado para gerar urgência</li>
            </ul>
          </div>
        </div>
      )}

      <BottomSheet isOpen={modalAberto} onClose={fecharModal} title={editingId ? 'Editar cupom' : 'Novo cupom'}>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid md:grid-cols-3 gap-3">
            <input
              placeholder="Código (ex: BEMVINDO10)"
              value={form.codigo}
              onChange={(e) => setForm({ ...form, codigo: e.target.value.toUpperCase() })}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm uppercase"
              required
            />
            <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value as TipoCupom })} className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
              <option value="PERCENTUAL">Percentual (%)</option>
              <option value="VALOR_FIXO">Valor fixo (R$)</option>
              <option value="FRETE_GRATIS">Frete grátis</option>
            </select>
            {form.tipo !== 'FRETE_GRATIS' && (
              <input
                type="number"
                step="0.01"
                placeholder={form.tipo === 'PERCENTUAL' ? 'Percentual (ex: 10)' : 'Valor em R$'}
                value={form.valor}
                onChange={(e) => setForm({ ...form, valor: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                required
              />
            )}
          </div>

          <input
            placeholder="Descrição (opcional)"
            value={form.descricao}
            onChange={(e) => setForm({ ...form, descricao: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />

          <div className="grid md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Pedido mínimo</label>
              <input type="number" step="0.01" placeholder="Opcional" value={form.valorMinimoPedido} onChange={(e) => setForm({ ...form, valorMinimoPedido: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Quantidade de cupons (limite de usos)</label>
              <input type="number" min={1} placeholder="Ilimitado" value={form.usoMaximo} onChange={(e) => setForm({ ...form, usoMaximo: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Dia da semana</label>
              <select value={form.diaSemanaRestrito} onChange={(e) => setForm({ ...form, diaSemanaRestrito: e.target.value === '' ? '' : Number(e.target.value) })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
                <option value="">Todos os dias</option>
                {DIAS_SEMANA_LABELS.map((d, i) => (
                  <option key={i} value={i}>{d}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Válido a partir de</label>
              <input type="date" value={form.validoDe} onChange={(e) => setForm({ ...form, validoDe: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Válido até</label>
              <input type="date" value={form.validoAte} onChange={(e) => setForm({ ...form, validoAte: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Forma de pagamento restrita</label>
            <select
              value={form.formaPagamentoRestrita}
              onChange={(e) => setForm({ ...form, formaPagamentoRestrita: e.target.value as FormaPagamentoCupom | '' })}
              className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
            >
              <option value="">Qualquer forma de pagamento</option>
              {(Object.keys(FORMA_PAGAMENTO_CUPOM_LABELS) as FormaPagamentoCupom[]).map((f) => (
                <option key={f} value={f}>{FORMA_PAGAMENTO_CUPOM_LABELS[f]}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Bairros/regiões restritas (vazio = vale em qualquer bairro)</label>
            <div className="flex gap-2 mb-2">
              <input
                value={novoBairro}
                onChange={(e) => setNovoBairro(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); adicionarBairro(); } }}
                placeholder="Digite um bairro e pressione Enter"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <button type="button" onClick={adicionarBairro} className="bg-gray-800 hover:bg-gray-900 text-white text-sm px-3 py-2 rounded-lg">Adicionar</button>
            </div>
            {form.bairrosRestritos.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {form.bairrosRestritos.map((b) => (
                  <span key={b} className="flex items-center gap-1 text-xs bg-orange-50 text-orange-700 px-2 py-1 rounded-full">
                    {b}
                    <button type="button" onClick={() => removerBairro(b)}><X className="h-3 w-3" /></button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer w-fit">
              <input type="checkbox" checked={form.apenasPrimeiraCompra} onChange={(e) => setForm({ ...form, apenasPrimeiraCompra: e.target.checked })} className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500" />
              <span className="text-sm text-gray-700">Válido apenas na primeira compra</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer w-fit">
              <input type="checkbox" checked={form.apenasClientesFieis} onChange={(e) => setForm({ ...form, apenasClientesFieis: e.target.checked })} className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500" />
              <span className="text-sm text-gray-700">Exclusivo para clientes fiéis</span>
            </label>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Cupom pessoal (opcional)</label>
            <select value={form.clienteAlvoId} onChange={(e) => setForm({ ...form, clienteAlvoId: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
              <option value="">Público — qualquer cliente pode usar</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>{c.nome} ({c.email})</option>
              ))}
            </select>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button type="submit" disabled={saving} className="w-full flex items-center justify-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-4 py-2.5 rounded-lg disabled:opacity-60">
            <Plus className="h-4 w-4" /> {saving ? 'Salvando...' : editingId ? 'Salvar alterações' : 'Criar cupom'}
          </button>
        </form>
      </BottomSheet>
    </div>
  );
};

export default CuponsTab;
