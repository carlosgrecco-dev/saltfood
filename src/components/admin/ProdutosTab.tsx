import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Plus, Trash2, Pencil, ImageOff, PackageX, Boxes, Layers, ListChecks, Loader2, Image as ImageIcon, Copy, AlertTriangle,
  Search, Package, CheckCircle2, XCircle, BarChart3, Upload, Download, ChevronLeft, ChevronRight, LayoutGrid, Table as TableIcon,
} from 'lucide-react';
import { Produto, ProdutoVariacao, ProdutoGrupoOpcao, Categoria, ProdutosAdminStats } from '../../types/Produto';
import { fetchProdutosAdminResumo, createProduto, updateProduto, setProdutoStatus, setProdutoEsgotado, deleteProduto } from '../../lib/produtos';
import { fetchProdutoVariacoes, createProdutoVariacao, updateProdutoVariacao, deleteProdutoVariacao } from '../../lib/produtoVariacoes';
import { fetchCategorias } from '../../lib/categorias';
import FotoInput from './FotoInput';
import BottomSheet from '../BottomSheet';
import {
  fetchProdutoGruposOpcao,
  createProdutoGrupoOpcao,
  updateProdutoGrupoOpcao,
  deleteProdutoGrupoOpcao,
  createProdutoOpcao,
  updateProdutoOpcao,
  deleteProdutoOpcao,
} from '../../lib/produtoGruposOpcao';

interface ProdutosTabProps {
  empresaId: string;
}

const emptyForm = {
  codigo: '',
  estoqueMinimo: '',
  nome: '',
  descricao: '',
  categoriaId: '',
  preco: '',
  precoPromocional: '',
  fotoUrl: '',
  controlarEstoque: false,
  estoqueQtd: '',
  ehCombo: false,
  vendeSaquinhoPrato: false,
  precoSaquinho: '',
  precoPrato: '',
  fotoSaquinho: '',
  fotoPrato: '',
  descricaoSaquinho: 'Prático e tradicional, servido em saquinho para levar',
  descricaoPrato: 'Experiência completa, servido no prato com acompanhamentos',
};

const GRUPO_FORMATO_NOME = 'Como você gostaria de receber seu pedido?';
const OPCAO_SAQUINHO_NOME = 'No Saquinho';
const OPCAO_PRATO_NOME = 'No Prato';

const VariacoesManager: React.FC<{ empresaId: string; produtoId: string }> = ({ empresaId, produtoId }) => {
  const [variacoes, setVariacoes] = useState<ProdutoVariacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [nome, setNome] = useState('');
  const [estoqueQtd, setEstoqueQtd] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setVariacoes(await fetchProdutoVariacoes(empresaId, produtoId));
    } catch {
      /* silencioso */
    } finally {
      setLoading(false);
    }
  }, [empresaId, produtoId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome) return;
    await createProdutoVariacao(empresaId, produtoId, { nome, estoqueQtd: estoqueQtd ? Number(estoqueQtd) : null });
    setNome('');
    setEstoqueQtd('');
    load();
  };

  const handleUpdateEstoque = async (variacao: ProdutoVariacao, novoEstoque: string) => {
    await updateProdutoVariacao(empresaId, produtoId, variacao.id, {
      nome: variacao.nome,
      estoqueQtd: novoEstoque === '' ? null : Number(novoEstoque),
    });
    load();
  };

  const handleDelete = async (id: string) => {
    await deleteProdutoVariacao(empresaId, produtoId, id);
    load();
  };

  if (loading) return <p className="text-xs text-gray-400 py-2">Carregando variações...</p>;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-3 space-y-2">
      <form onSubmit={handleAdd} className="flex flex-wrap items-center gap-2">
        <input
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Sabor/variação (ex: Camarão)"
          className="px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs flex-1 min-w-[140px]"
        />
        <input
          type="number"
          value={estoqueQtd}
          onChange={(e) => setEstoqueQtd(e.target.value)}
          placeholder="Estoque"
          className="px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs w-24"
        />
        <button type="submit" className="bg-gray-800 hover:bg-gray-900 text-white text-xs px-3 py-1.5 rounded-lg flex items-center gap-1">
          <Plus className="h-3.5 w-3.5" /> Adicionar
        </button>
      </form>
      {variacoes.map((v) => (
        <div key={v.id} className="flex items-center gap-2 text-xs">
          <span className="flex-1 text-gray-700">{v.nome}</span>
          <input
            type="number"
            defaultValue={v.estoqueQtd ?? ''}
            onBlur={(e) => handleUpdateEstoque(v, e.target.value)}
            placeholder="sem controle"
            className="px-2 py-1 border border-gray-300 rounded-lg w-24"
          />
          <button onClick={() => handleDelete(v.id)} className="text-red-500 hover:text-red-700">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
      {variacoes.length === 0 && <p className="text-xs text-gray-400">Nenhuma variação cadastrada.</p>}
    </div>
  );
};

interface NovaOpcaoForm {
  nome: string;
  precoAdicional: string;
  temPrecoExtra: boolean;
  selecionadoPorPadrao: boolean;
  fotoUrl: string;
  descricao: string;
}

const novaOpcaoVazia: NovaOpcaoForm = {
  nome: '',
  precoAdicional: '',
  temPrecoExtra: false,
  selecionadoPorPadrao: false,
  fotoUrl: '',
  descricao: '',
};

const GruposOpcaoManager: React.FC<{ empresaId: string; produtoId: string }> = ({ empresaId, produtoId }) => {
  const [grupos, setGrupos] = useState<ProdutoGrupoOpcao[]>([]);
  const [loading, setLoading] = useState(true);
  const [novoGrupo, setNovoGrupo] = useState({ nome: '', obrigatorio: false, selecaoMultipla: true, minSelecoes: '0', maxSelecoes: '' });
  const [novaOpcao, setNovaOpcao] = useState<Record<string, NovaOpcaoForm>>({});
  const [precoExtraAberto, setPrecoExtraAberto] = useState<Record<string, boolean>>({});
  const [detalhesAbertos, setDetalhesAbertos] = useState<Record<string, boolean>>({});
  const [novaOpcaoDetalhesAberto, setNovaOpcaoDetalhesAberto] = useState<Record<string, boolean>>({});

  const updateNovaOpcao = (grupoId: string, patch: Partial<NovaOpcaoForm>) => {
    setNovaOpcao((prev) => ({ ...prev, [grupoId]: { ...novaOpcaoVazia, ...prev[grupoId], ...patch } }));
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setGrupos(await fetchProdutoGruposOpcao(empresaId, produtoId));
    } catch {
      /* silencioso */
    } finally {
      setLoading(false);
    }
  }, [empresaId, produtoId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleAddGrupo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoGrupo.nome) return;
    await createProdutoGrupoOpcao(empresaId, produtoId, {
      nome: novoGrupo.nome,
      obrigatorio: novoGrupo.obrigatorio,
      selecaoMultipla: novoGrupo.selecaoMultipla,
      minSelecoes: Number(novoGrupo.minSelecoes) || 0,
      maxSelecoes: novoGrupo.maxSelecoes ? Number(novoGrupo.maxSelecoes) : null,
    });
    setNovoGrupo({ nome: '', obrigatorio: false, selecaoMultipla: true, minSelecoes: '0', maxSelecoes: '' });
    load();
  };

  const handleUpdateGrupo = async (grupo: ProdutoGrupoOpcao, patch: Partial<ProdutoGrupoOpcao>) => {
    const atualizado = { ...grupo, ...patch };
    await updateProdutoGrupoOpcao(empresaId, produtoId, grupo.id, {
      nome: atualizado.nome,
      obrigatorio: atualizado.obrigatorio,
      selecaoMultipla: atualizado.selecaoMultipla,
      minSelecoes: atualizado.minSelecoes,
      maxSelecoes: atualizado.maxSelecoes,
    });
    load();
  };

  const handleDeleteGrupo = async (id: string) => {
    if (!window.confirm('Remover este grupo de opções e todas as suas opções?')) return;
    await deleteProdutoGrupoOpcao(empresaId, produtoId, id);
    load();
  };

  const handleAddOpcao = async (grupoId: string) => {
    const dados = novaOpcao[grupoId];
    if (!dados?.nome) return;
    await createProdutoOpcao(empresaId, produtoId, grupoId, {
      nome: dados.nome,
      precoAdicional: dados.temPrecoExtra && dados.precoAdicional ? Number(dados.precoAdicional) : 0,
      selecionadoPorPadrao: dados.selecionadoPorPadrao,
      fotoUrl: dados.fotoUrl || null,
      descricao: dados.descricao || null,
    });
    setNovaOpcao((prev) => ({ ...prev, [grupoId]: novaOpcaoVazia }));
    setNovaOpcaoDetalhesAberto((prev) => ({ ...prev, [grupoId]: false }));
    load();
  };

  const handleUpdateOpcaoDetalhes = async (
    grupoId: string,
    opcao: ProdutoGrupoOpcao['opcoes'][number],
    patch: { fotoUrl?: string; descricao?: string }
  ) => {
    await updateProdutoOpcao(empresaId, produtoId, grupoId, opcao.id, {
      nome: opcao.nome,
      precoAdicional: opcao.precoAdicional,
      ativo: opcao.ativo,
      fotoUrl: patch.fotoUrl ?? opcao.fotoUrl,
      descricao: patch.descricao ?? opcao.descricao,
    });
    load();
  };

  const handleTogglePadrao = async (grupoId: string, opcao: ProdutoGrupoOpcao['opcoes'][number]) => {
    await updateProdutoOpcao(empresaId, produtoId, grupoId, opcao.id, {
      nome: opcao.nome,
      precoAdicional: opcao.precoAdicional,
      ativo: opcao.ativo,
      selecionadoPorPadrao: !opcao.selecionadoPorPadrao,
    });
    load();
  };

  const handleTogglePrecoExtra = async (grupoId: string, opcao: ProdutoGrupoOpcao['opcoes'][number], ligado: boolean) => {
    setPrecoExtraAberto((prev) => ({ ...prev, [opcao.id]: ligado }));
    if (!ligado && opcao.precoAdicional !== 0) {
      await updateProdutoOpcao(empresaId, produtoId, grupoId, opcao.id, {
        nome: opcao.nome,
        precoAdicional: 0,
        ativo: opcao.ativo,
      });
      load();
    }
  };

  const handleToggleOpcaoAtivo = async (grupoId: string, opcao: ProdutoGrupoOpcao['opcoes'][number]) => {
    await updateProdutoOpcao(empresaId, produtoId, grupoId, opcao.id, {
      nome: opcao.nome,
      precoAdicional: opcao.precoAdicional,
      ativo: !opcao.ativo,
    });
    load();
  };

  const handleUpdateOpcaoPreco = async (grupoId: string, opcao: ProdutoGrupoOpcao['opcoes'][number], novoPreco: string) => {
    await updateProdutoOpcao(empresaId, produtoId, grupoId, opcao.id, {
      nome: opcao.nome,
      precoAdicional: novoPreco ? Number(novoPreco) : 0,
      ativo: opcao.ativo,
    });
    load();
  };

  const handleDeleteOpcao = async (grupoId: string, id: string) => {
    await deleteProdutoOpcao(empresaId, produtoId, grupoId, id);
    load();
  };

  if (loading) return <p className="text-xs text-gray-400 py-2">Carregando opções...</p>;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-3 space-y-3">
      <form onSubmit={handleAddGrupo} className="space-y-2 pb-3 border-b border-gray-100">
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={novoGrupo.nome}
            onChange={(e) => setNovoGrupo({ ...novoGrupo, nome: e.target.value })}
            placeholder='Nome do grupo (ex: "Monte seu acarajé")'
            className="px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs flex-1 min-w-[160px]"
          />
          <input
            type="number"
            min={0}
            value={novoGrupo.minSelecoes}
            onChange={(e) => setNovoGrupo({ ...novoGrupo, minSelecoes: e.target.value })}
            placeholder="Mín."
            className="px-2 py-1.5 border border-gray-300 rounded-lg text-xs w-16"
          />
          <input
            type="number"
            min={1}
            value={novoGrupo.maxSelecoes}
            onChange={(e) => setNovoGrupo({ ...novoGrupo, maxSelecoes: e.target.value })}
            placeholder="Máx."
            className="px-2 py-1.5 border border-gray-300 rounded-lg text-xs w-16"
          />
          <button type="submit" className="bg-gray-800 hover:bg-gray-900 text-white text-xs px-3 py-1.5 rounded-lg flex items-center gap-1">
            <Plus className="h-3.5 w-3.5" /> Grupo
          </button>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 cursor-pointer text-xs text-gray-600">
            <input
              type="checkbox"
              checked={novoGrupo.obrigatorio}
              onChange={(e) => setNovoGrupo({ ...novoGrupo, obrigatorio: e.target.checked })}
              className="w-3.5 h-3.5 text-orange-600 rounded"
            />
            Obrigatório
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer text-xs text-gray-600">
            <input
              type="checkbox"
              checked={novoGrupo.selecaoMultipla}
              onChange={(e) => setNovoGrupo({ ...novoGrupo, selecaoMultipla: e.target.checked })}
              className="w-3.5 h-3.5 text-orange-600 rounded"
            />
            Permite múltiplas escolhas (senão, é seleção única)
          </label>
        </div>
      </form>

      {grupos.map((grupo) => (
        <div key={grupo.id} className="border border-gray-200 rounded-lg p-2.5 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <input
              defaultValue={grupo.nome}
              onBlur={(e) => e.target.value && e.target.value !== grupo.nome && handleUpdateGrupo(grupo, { nome: e.target.value })}
              className="text-xs font-semibold text-gray-800 border border-transparent hover:border-gray-300 focus:border-gray-300 rounded px-1.5 py-1 flex-1 min-w-[120px]"
            />
            <label className="flex items-center gap-1 cursor-pointer text-[11px] text-gray-500">
              <input
                type="checkbox"
                checked={grupo.obrigatorio}
                onChange={(e) => handleUpdateGrupo(grupo, { obrigatorio: e.target.checked })}
                className="w-3.5 h-3.5 text-orange-600 rounded"
              />
              Obrigatório
            </label>
            <label className="flex items-center gap-1 cursor-pointer text-[11px] text-gray-500">
              <input
                type="checkbox"
                checked={grupo.selecaoMultipla}
                onChange={(e) => handleUpdateGrupo(grupo, { selecaoMultipla: e.target.checked })}
                className="w-3.5 h-3.5 text-orange-600 rounded"
              />
              Múltiplas
            </label>
            <span className="text-[11px] text-gray-400">min {grupo.minSelecoes} / máx {grupo.maxSelecoes ?? '∞'}</span>
            <button onClick={() => handleDeleteGrupo(grupo.id)} className="text-red-500 hover:text-red-700 ml-auto">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="pl-2 space-y-1.5">
            {grupo.opcoes.map((opcao) => {
              const precoExtraLigado = precoExtraAberto[opcao.id] ?? opcao.precoAdicional > 0;
              const detalhesLigado = detalhesAbertos[opcao.id] ?? Boolean(opcao.fotoUrl || opcao.descricao);
              return (
                <div key={opcao.id} className="space-y-1.5 border-b border-gray-100 pb-1.5 last:border-0 last:pb-0">
                  <div className="flex items-center gap-2 text-xs flex-wrap">
                    <input
                      type="checkbox"
                      checked={opcao.ativo}
                      onChange={() => handleToggleOpcaoAtivo(grupo.id, opcao)}
                      title="Ativa/inativa"
                      className="w-3.5 h-3.5 text-orange-600 rounded"
                    />
                    <span className={`flex-1 min-w-[80px] ${opcao.ativo ? 'text-gray-700' : 'text-gray-400 line-through'}`}>{opcao.nome}</span>
                    <label className="flex items-center gap-1 text-[11px] text-gray-500 cursor-pointer" title="O item já vem marcado no modal do cliente; ele desmarca o que não quiser">
                      <input
                        type="checkbox"
                        checked={opcao.selecionadoPorPadrao}
                        onChange={() => handleTogglePadrao(grupo.id, opcao)}
                        className="w-3.5 h-3.5 text-orange-600 rounded"
                      />
                      Vem incluso
                    </label>
                    <label className="flex items-center gap-1 text-[11px] text-gray-500 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={precoExtraLigado}
                        onChange={(e) => handleTogglePrecoExtra(grupo.id, opcao, e.target.checked)}
                        className="w-3.5 h-3.5 text-orange-600 rounded"
                      />
                      Tem valor extra
                    </label>
                    {precoExtraLigado && (
                      <>
                        <span className="text-gray-400">R$</span>
                        <input
                          type="number"
                          step="0.01"
                          min={0}
                          defaultValue={opcao.precoAdicional || ''}
                          onBlur={(e) => handleUpdateOpcaoPreco(grupo.id, opcao, e.target.value)}
                          className="px-2 py-1 border border-gray-300 rounded-lg w-20"
                        />
                      </>
                    )}
                    <button
                      onClick={() => setDetalhesAbertos((prev) => ({ ...prev, [opcao.id]: !detalhesLigado }))}
                      title="Foto e subtítulo (para exibir como cartão, ex: No Saquinho x No Prato)"
                      className={`p-1 rounded ${detalhesLigado ? 'text-[var(--cor-primaria,#ea580c)] bg-orange-50' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                      <ImageIcon className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => handleDeleteOpcao(grupo.id, opcao.id)} className="text-red-500 hover:text-red-700">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  {detalhesLigado && (
                    <div className="pl-5 space-y-1.5">
                      <FotoInput
                        value={opcao.fotoUrl ?? ''}
                        onChange={(url) => handleUpdateOpcaoDetalhes(grupo.id, opcao, { fotoUrl: url })}
                      />
                      <input
                        defaultValue={opcao.descricao ?? ''}
                        onBlur={(e) => handleUpdateOpcaoDetalhes(grupo.id, opcao, { descricao: e.target.value })}
                        placeholder="Subtítulo (ex: Prático e tradicional, servido em saquinho para levar)"
                        className="w-full px-2 py-1 border border-gray-300 rounded-lg text-xs"
                      />
                    </div>
                  )}
                </div>
              );
            })}
            {grupo.opcoes.length === 0 && <p className="text-[11px] text-gray-400">Nenhuma opção cadastrada.</p>}

            <div className="space-y-1.5 pt-1">
              <div className="flex items-center gap-2 flex-wrap">
                <input
                  value={novaOpcao[grupo.id]?.nome ?? ''}
                  onChange={(e) => updateNovaOpcao(grupo.id, { nome: e.target.value })}
                  placeholder="Opção (ex: Camarão)"
                  className="px-2 py-1 border border-gray-300 rounded-lg text-xs flex-1 min-w-[100px]"
                />
                <label className="flex items-center gap-1 text-[11px] text-gray-500 cursor-pointer" title="O item já vem marcado no modal do cliente; ele desmarca o que não quiser">
                  <input
                    type="checkbox"
                    checked={novaOpcao[grupo.id]?.selecionadoPorPadrao ?? false}
                    onChange={(e) => updateNovaOpcao(grupo.id, { selecionadoPorPadrao: e.target.checked })}
                    className="w-3.5 h-3.5 text-orange-600 rounded"
                  />
                  Vem incluso
                </label>
                <label className="flex items-center gap-1 text-[11px] text-gray-500 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={novaOpcao[grupo.id]?.temPrecoExtra ?? false}
                    onChange={(e) => updateNovaOpcao(grupo.id, { temPrecoExtra: e.target.checked })}
                    className="w-3.5 h-3.5 text-orange-600 rounded"
                  />
                  Tem valor extra
                </label>
                {(novaOpcao[grupo.id]?.temPrecoExtra ?? false) && (
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    value={novaOpcao[grupo.id]?.precoAdicional ?? ''}
                    onChange={(e) => updateNovaOpcao(grupo.id, { precoAdicional: e.target.value })}
                    placeholder="+R$"
                    className="px-2 py-1 border border-gray-300 rounded-lg text-xs w-20"
                  />
                )}
                <button
                  onClick={() => setNovaOpcaoDetalhesAberto((prev) => ({ ...prev, [grupo.id]: !prev[grupo.id] }))}
                  title="Foto e subtítulo (para exibir como cartão, ex: No Saquinho x No Prato)"
                  className={`p-1 rounded ${novaOpcaoDetalhesAberto[grupo.id] ? 'text-[var(--cor-primaria,#ea580c)] bg-orange-50' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <ImageIcon className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => handleAddOpcao(grupo.id)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs px-2.5 py-1 rounded-lg flex items-center gap-1 shrink-0"
                >
                  <Plus className="h-3 w-3" /> Opção
                </button>
              </div>
              {novaOpcaoDetalhesAberto[grupo.id] && (
                <div className="pl-5 space-y-1.5">
                  <FotoInput
                    value={novaOpcao[grupo.id]?.fotoUrl ?? ''}
                    onChange={(url) => updateNovaOpcao(grupo.id, { fotoUrl: url })}
                  />
                  <input
                    value={novaOpcao[grupo.id]?.descricao ?? ''}
                    onChange={(e) => updateNovaOpcao(grupo.id, { descricao: e.target.value })}
                    placeholder="Subtítulo (ex: Prático e tradicional, servido em saquinho para levar)"
                    className="w-full px-2 py-1 border border-gray-300 rounded-lg text-xs"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
      {grupos.length === 0 && <p className="text-xs text-gray-400">Nenhum grupo de opções cadastrado.</p>}
    </div>
  );
};

type VisaoLista = 'tabela' | 'grade';
const ITENS_POR_PAGINA = 8;

const ProdutosTab: React.FC<ProdutosTabProps> = ({ empresaId }) => {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [stats, setStats] = useState<ProdutosAdminStats | null>(null);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [modalAberto, setModalAberto] = useState(false);
  const [duplicandoId, setDuplicandoId] = useState<string | null>(null);
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());

  const [busca, setBusca] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<'' | 'ativo' | 'inativo'>('');
  const [visao, setVisao] = useState<VisaoLista>('tabela');
  const [pagina, setPagina] = useState(1);
  const [importando, setImportando] = useState(false);

  useEffect(() => {
    fetchCategorias(empresaId)
      .then(setCategorias)
      .catch(() => setCategorias([]));
  }, [empresaId]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const resumo = await fetchProdutosAdminResumo(empresaId);
      setProdutos(resumo.produtos);
      setStats(resumo.stats);
    } catch {
      /* silencioso */
    } finally {
      setLoading(false);
    }
  }, [empresaId]);

  useEffect(() => {
    load();
  }, [load]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setError('');
  };

  const abrirNovoProduto = () => {
    resetForm();
    setModalAberto(true);
  };

  const fecharModal = () => {
    setModalAberto(false);
    resetForm();
  };

  const handleEdit = (produto: Produto) => {
    setEditingId(produto.id);

    const grupoFormato = (produto.gruposOpcao ?? []).find(
      (g) => g.opcoes.some((o) => o.nome === OPCAO_SAQUINHO_NOME) && g.opcoes.some((o) => o.nome === OPCAO_PRATO_NOME)
    );
    const opcaoSaquinho = grupoFormato?.opcoes.find((o) => o.nome === OPCAO_SAQUINHO_NOME);
    const opcaoPrato = grupoFormato?.opcoes.find((o) => o.nome === OPCAO_PRATO_NOME);
    const vendeSaquinhoPrato = Boolean(opcaoSaquinho && opcaoPrato);

    setForm({
      nome: produto.nome,
      codigo: produto.codigo || '',
      descricao: produto.descricao || '',
      categoriaId: produto.categoriaId || '',
      preco: String(produto.preco),
      precoPromocional: produto.precoPromocional != null ? String(produto.precoPromocional) : '',
      fotoUrl: produto.fotoUrl || '',
      controlarEstoque: produto.controlarEstoque,
      estoqueQtd: produto.estoqueQtd != null ? String(produto.estoqueQtd) : '',
      estoqueMinimo: produto.estoqueMinimo != null ? String(produto.estoqueMinimo) : '',
      ehCombo: produto.ehCombo,
      vendeSaquinhoPrato,
      precoSaquinho: vendeSaquinhoPrato ? String(produto.preco + (opcaoSaquinho?.precoAdicional ?? 0)) : '',
      precoPrato: vendeSaquinhoPrato ? String(produto.preco + (opcaoPrato?.precoAdicional ?? 0)) : '',
      fotoSaquinho: opcaoSaquinho?.fotoUrl || '',
      fotoPrato: opcaoPrato?.fotoUrl || '',
      descricaoSaquinho: opcaoSaquinho?.descricao || emptyForm.descricaoSaquinho,
      descricaoPrato: opcaoPrato?.descricao || emptyForm.descricaoPrato,
    });
    setModalAberto(true);
  };

  const sincronizarFormatoSaquinhoPrato = async (produtoId: string, precoBase: number, precoPrato: number) => {
    const grupos = await fetchProdutoGruposOpcao(empresaId, produtoId);
    let grupo = grupos.find(
      (g) => g.opcoes.some((o) => o.nome === OPCAO_SAQUINHO_NOME) && g.opcoes.some((o) => o.nome === OPCAO_PRATO_NOME)
    );

    if (!grupo) {
      grupo = await createProdutoGrupoOpcao(empresaId, produtoId, {
        nome: GRUPO_FORMATO_NOME,
        obrigatorio: true,
        selecaoMultipla: false,
        minSelecoes: 1,
        maxSelecoes: null,
      });
    }

    const opcaoSaquinho = grupo.opcoes.find((o) => o.nome === OPCAO_SAQUINHO_NOME);
    const dadosSaquinho = {
      nome: OPCAO_SAQUINHO_NOME,
      precoAdicional: 0,
      selecionadoPorPadrao: true,
      fotoUrl: form.fotoSaquinho || null,
      descricao: form.descricaoSaquinho || null,
      ativo: true,
    };
    if (opcaoSaquinho) {
      await updateProdutoOpcao(empresaId, produtoId, grupo.id, opcaoSaquinho.id, dadosSaquinho);
    } else {
      await createProdutoOpcao(empresaId, produtoId, grupo.id, dadosSaquinho);
    }

    const opcaoPrato = grupo.opcoes.find((o) => o.nome === OPCAO_PRATO_NOME);
    const dadosPrato = {
      nome: OPCAO_PRATO_NOME,
      precoAdicional: precoPrato - precoBase,
      selecionadoPorPadrao: false,
      fotoUrl: form.fotoPrato || null,
      descricao: form.descricaoPrato || null,
      ativo: true,
    };
    if (opcaoPrato) {
      await updateProdutoOpcao(empresaId, produtoId, grupo.id, opcaoPrato.id, dadosPrato);
    } else {
      await createProdutoOpcao(empresaId, produtoId, grupo.id, dadosPrato);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const preco = form.vendeSaquinhoPrato ? parseFloat(form.precoSaquinho) : parseFloat(form.preco);
    const precoPrato = form.vendeSaquinhoPrato ? parseFloat(form.precoPrato) : null;

    if (!form.nome || Number.isNaN(preco) || preco <= 0) {
      setError('Informe nome e um preço válido.');
      return;
    }
    if (form.vendeSaquinhoPrato && (precoPrato === null || Number.isNaN(precoPrato) || precoPrato <= 0)) {
      setError('Informe o preço no prato.');
      return;
    }

    const payload = {
      nome: form.nome,
      codigo: form.codigo || null,
      descricao: form.descricao || null,
      categoriaId: form.categoriaId || null,
      preco,
      precoPromocional: form.precoPromocional ? parseFloat(form.precoPromocional) : null,
      fotoUrl: form.fotoUrl || null,
      controlarEstoque: form.controlarEstoque,
      estoqueQtd: form.controlarEstoque && form.estoqueQtd ? Number(form.estoqueQtd) : null,
      estoqueMinimo: form.controlarEstoque && form.estoqueMinimo ? Number(form.estoqueMinimo) : null,
      ehCombo: form.ehCombo,
    };

    setSaving(true);
    try {
      let produtoId = editingId;
      if (editingId) {
        await updateProduto(empresaId, editingId, payload);
      } else {
        const criado = await createProduto(empresaId, payload);
        produtoId = criado.id;
      }

      if (form.vendeSaquinhoPrato && produtoId && precoPrato !== null) {
        await sincronizarFormatoSaquinhoPrato(produtoId, preco, precoPrato);
      }

      fecharModal();
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar produto');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleAtivo = async (produto: Produto) => {
    await setProdutoStatus(empresaId, produto.id, !produto.ativo);
    load();
  };

  const handleToggleEsgotado = async (produto: Produto) => {
    await setProdutoEsgotado(empresaId, produto.id, !produto.esgotadoHoje);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Remover este produto?')) return;
    await deleteProduto(empresaId, id);
    if (editingId === id) fecharModal();
    load();
  };

  const handleDuplicar = async (produto: Produto) => {
    setDuplicandoId(produto.id);
    try {
      const copia = await createProduto(empresaId, {
        nome: `${produto.nome} (cópia)`,
        descricao: produto.descricao,
        categoriaId: produto.categoriaId,
        preco: produto.preco,
        precoPromocional: produto.precoPromocional,
        fotoUrl: produto.fotoUrl,
        ativo: false,
        controlarEstoque: produto.controlarEstoque,
        estoqueQtd: null,
        ehCombo: produto.ehCombo,
      });

      for (const grupo of produto.gruposOpcao ?? []) {
        const novoGrupo = await createProdutoGrupoOpcao(empresaId, copia.id, {
          nome: grupo.nome,
          obrigatorio: grupo.obrigatorio,
          selecaoMultipla: grupo.selecaoMultipla,
          minSelecoes: grupo.minSelecoes,
          maxSelecoes: grupo.maxSelecoes,
        });
        for (const opcao of grupo.opcoes) {
          await createProdutoOpcao(empresaId, copia.id, novoGrupo.id, {
            nome: opcao.nome,
            precoAdicional: opcao.precoAdicional,
            selecionadoPorPadrao: opcao.selecionadoPorPadrao,
            fotoUrl: opcao.fotoUrl,
            descricao: opcao.descricao,
            ativo: opcao.ativo,
          });
        }
      }

      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao duplicar produto');
    } finally {
      setDuplicandoId(null);
    }
  };

  const toggleSelecionado = (id: string) => {
    setSelecionados((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkAtivo = async (ativo: boolean) => {
    await Promise.all(Array.from(selecionados).map((id) => setProdutoStatus(empresaId, id, ativo)));
    setSelecionados(new Set());
    load();
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Remover ${selecionados.size} produto(s) selecionado(s)?`)) return;
    await Promise.all(Array.from(selecionados).map((id) => deleteProduto(empresaId, id)));
    setSelecionados(new Set());
    load();
  };

  /** Escapa um campo pra CSV — mesmo padrão usado no export de pedidos (crm.js). */
  const csvField = (value: string | number) => {
    const str = String(value ?? '');
    if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
    return str;
  };

  const handleExportarCsv = () => {
    const cabecalho = ['Nome', 'Código', 'Categoria', 'Preço', 'Estoque', 'Status', 'Vendas'];
    const linhas = produtosFiltrados.map((p) => [
      p.nome,
      p.codigo || '',
      p.categoria?.nome || '',
      p.preco.toFixed(2),
      p.controlarEstoque ? String(p.estoqueQtd ?? 0) : 'não controlado',
      p.ativo ? 'Ativo' : 'Inativo',
      String(p.vendasTotais ?? 0),
    ]);
    const csv = [cabecalho, ...linhas].map((linha) => linha.map(csvField).join(',')).join('\r\n');
    const blob = new Blob(['﻿', csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'produtos.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  /** Importa um CSV simples (Nome,Código,Categoria,Preço) — uma linha de cabeçalho + 1 produto por linha. */
  const handleImportarCsv = async (file: File) => {
    setImportando(true);
    setError('');
    try {
      const texto = await file.text();
      const linhas = texto.split(/\r?\n/).filter((l) => l.trim());
      const linhasProdutos = linhas.slice(1); // pula o cabeçalho

      for (const linha of linhasProdutos) {
        const [nome, codigo, categoriaNome, precoStr] = linha.split(',').map((v) => v.trim());
        const preco = parseFloat(precoStr);
        if (!nome || Number.isNaN(preco) || preco <= 0) continue;
        const categoria = categoriaNome ? categorias.find((c) => c.nome.toLowerCase() === categoriaNome.toLowerCase()) : undefined;
        await createProduto(empresaId, {
          nome,
          codigo: codigo || null,
          categoriaId: categoria?.id || null,
          preco,
          descricao: null,
          precoPromocional: null,
          fotoUrl: null,
        });
      }
      load();
    } catch {
      setError('Não foi possível importar a planilha. Confira o formato: Nome,Código,Categoria,Preço.');
    } finally {
      setImportando(false);
    }
  };

  const produtosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return produtos.filter((p) => {
      if (termo && !p.nome.toLowerCase().includes(termo) && !(p.codigo || '').toLowerCase().includes(termo) && !(p.descricao || '').toLowerCase().includes(termo)) {
        return false;
      }
      if (filtroCategoria && p.categoriaId !== filtroCategoria) return false;
      if (filtroStatus === 'ativo' && !p.ativo) return false;
      if (filtroStatus === 'inativo' && p.ativo) return false;
      return true;
    });
  }, [produtos, busca, filtroCategoria, filtroStatus]);

  const totalPaginas = Math.max(1, Math.ceil(produtosFiltrados.length / ITENS_POR_PAGINA));
  const paginaAtual = Math.min(pagina, totalPaginas);
  const produtosPagina = produtosFiltrados.slice((paginaAtual - 1) * ITENS_POR_PAGINA, paginaAtual * ITENS_POR_PAGINA);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <h2 className="text-lg font-bold text-gray-800">Produtos</h2>
          <p className="text-sm text-gray-500">Gerencie todos os produtos do seu cardápio</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm px-3.5 py-2 rounded-lg cursor-pointer disabled:opacity-60">
            <Upload className="h-4 w-4" /> {importando ? 'Importando...' : 'Importar planilha'}
            <input
              type="file"
              accept=".csv"
              disabled={importando}
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImportarCsv(file);
                e.target.value = '';
              }}
            />
          </label>
          <button
            onClick={handleExportarCsv}
            className="flex items-center gap-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm px-3.5 py-2 rounded-lg"
          >
            <Download className="h-4 w-4" /> Exportar
          </button>
          <button
            onClick={abrirNovoProduto}
            className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white text-sm px-4 py-2 rounded-lg"
          >
            <Plus className="h-4 w-4" /> Novo produto
          </button>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-4">
            <p className="text-xs text-gray-500 mb-1 flex items-center gap-1.5"><Package className="h-3.5 w-3.5" /> Total de produtos</p>
            <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-4">
            <p className="text-xs text-gray-500 mb-1 flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Produtos ativos</p>
            <p className="text-2xl font-bold text-gray-800">{stats.ativos}</p>
            <p className="text-[11px] text-gray-400">{stats.total > 0 ? ((stats.ativos / stats.total) * 100).toFixed(1) : 0}% do total</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-4">
            <p className="text-xs text-gray-500 mb-1 flex items-center gap-1.5"><XCircle className="h-3.5 w-3.5 text-gray-400" /> Produtos inativos</p>
            <p className="text-2xl font-bold text-gray-800">{stats.inativos}</p>
            <p className="text-[11px] text-gray-400">{stats.total > 0 ? ((stats.inativos / stats.total) * 100).toFixed(1) : 0}% do total</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-4">
            <p className="text-xs text-gray-500 mb-1 flex items-center gap-1.5"><AlertTriangle className="h-3.5 w-3.5 text-amber-500" /> Em estoque baixo</p>
            <p className="text-2xl font-bold text-gray-800">{stats.estoqueBaixo}</p>
            {stats.estoqueBaixo > 0 && <p className="text-[11px] text-amber-600">Precisa de atenção</p>}
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-4">
            <p className="text-xs text-gray-500 mb-1 flex items-center gap-1.5"><BarChart3 className="h-3.5 w-3.5" /> Produto mais vendido</p>
            <p className="font-bold text-gray-800 truncate">{stats.maisVendido?.nome || '—'}</p>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            value={busca}
            onChange={(e) => { setBusca(e.target.value); setPagina(1); }}
            placeholder="Buscar por nome, descrição ou código..."
            className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm"
          />
        </div>
        <select
          value={filtroCategoria}
          onChange={(e) => { setFiltroCategoria(e.target.value); setPagina(1); }}
          className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white"
        >
          <option value="">Todas as categorias</option>
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>{c.nome}</option>
          ))}
        </select>
        <select
          value={filtroStatus}
          onChange={(e) => { setFiltroStatus(e.target.value as typeof filtroStatus); setPagina(1); }}
          className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white"
        >
          <option value="">Todos os status</option>
          <option value="ativo">Ativo</option>
          <option value="inativo">Inativo</option>
        </select>
        <div className="flex border border-gray-300 rounded-lg overflow-hidden shrink-0">
          <button
            onClick={() => setVisao('tabela')}
            title="Ver em tabela"
            className={`p-2.5 ${visao === 'tabela' ? 'bg-orange-500 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
          >
            <TableIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => setVisao('grade')}
            title="Ver em grade"
            className={`p-2.5 border-l border-gray-300 ${visao === 'grade' ? 'bg-orange-500 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
        </div>
      </div>

      {selecionados.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 bg-orange-50 border border-orange-200 rounded-xl px-4 py-2.5 mb-4">
          <span className="text-sm font-medium text-orange-800">{selecionados.size} selecionado{selecionados.size > 1 ? 's' : ''}</span>
          <button onClick={() => handleBulkAtivo(true)} className="text-xs font-semibold bg-white border border-gray-300 hover:bg-gray-50 px-3 py-1.5 rounded-lg">
            Ativar
          </button>
          <button onClick={() => handleBulkAtivo(false)} className="text-xs font-semibold bg-white border border-gray-300 hover:bg-gray-50 px-3 py-1.5 rounded-lg">
            Desativar
          </button>
          <button onClick={handleBulkDelete} className="text-xs font-semibold bg-white border border-red-300 text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg">
            Excluir
          </button>
          <button onClick={() => setSelecionados(new Set())} className="text-xs text-orange-700 hover:underline ml-auto">
            Limpar seleção
          </button>
        </div>
      )}

      {loading ? (
        <p className="text-center text-gray-500 py-8">Carregando...</p>
      ) : visao === 'tabela' ? (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-gray-500 bg-gray-50">
                  <th className="py-3 px-4 w-8">
                    <input
                      type="checkbox"
                      checked={produtosPagina.length > 0 && produtosPagina.every((p) => selecionados.has(p.id))}
                      onChange={(e) => {
                        setSelecionados((prev) => {
                          const next = new Set(prev);
                          produtosPagina.forEach((p) => (e.target.checked ? next.add(p.id) : next.delete(p.id)));
                          return next;
                        });
                      }}
                    />
                  </th>
                  <th className="py-3 px-4">Produto</th>
                  <th className="py-3 px-4">Categoria</th>
                  <th className="py-3 px-4">Preço</th>
                  <th className="py-3 px-4">Estoque</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Vendas</th>
                  <th className="py-3 px-4">Ações</th>
                </tr>
              </thead>
              <tbody>
                {produtosPagina.map((produto) => {
                  const semEstoque = produto.controlarEstoque && (produto.estoqueQtd ?? 0) <= 0;
                  const estoqueBaixo = produto.controlarEstoque && !semEstoque && produto.estoqueMinimo != null && (produto.estoqueQtd ?? 0) <= produto.estoqueMinimo;
                  return (
                    <tr key={produto.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <input type="checkbox" checked={selecionados.has(produto.id)} onChange={() => toggleSelecionado(produto.id)} />
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3 min-w-[220px]">
                          {produto.fotoUrl ? (
                            <img src={produto.fotoUrl} alt={produto.nome} className="w-11 h-11 rounded-lg object-cover shrink-0" />
                          ) : (
                            <div className="w-11 h-11 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                              <ImageOff className="h-4 w-4 text-gray-300" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-bold text-gray-800 truncate flex items-center gap-1.5">
                              {produto.nome}
                              {produto.ehCombo && (
                                <span className="flex items-center gap-1 text-[10px] font-medium bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full shrink-0">
                                  <Layers className="h-2.5 w-2.5" /> Combo
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-gray-400">#{produto.codigo || produto.id.slice(0, 6).toUpperCase()}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-xs font-medium bg-orange-50 text-orange-700 px-2.5 py-1 rounded-full">
                          {produto.categoria?.nome || 'Sem categoria'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {produto.precoPromocional != null && (
                          <span className="text-xs text-gray-400 line-through block">R$ {produto.preco.toFixed(2)}</span>
                        )}
                        <span className="font-medium text-gray-800">R$ {(produto.precoPromocional ?? produto.preco).toFixed(2)}</span>
                      </td>
                      <td className="py-3 px-4">
                        {!produto.controlarEstoque ? (
                          <span className="text-gray-400">—</span>
                        ) : (
                          <>
                            <p className="text-gray-800">{produto.estoqueQtd ?? 0}</p>
                            <p className={`text-xs ${semEstoque ? 'text-red-600' : estoqueBaixo ? 'text-amber-600' : 'text-emerald-600'}`}>
                              {semEstoque ? 'Sem estoque' : estoqueBaixo ? 'Estoque baixo' : 'Em estoque'}
                            </p>
                          </>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleToggleAtivo(produto)}
                          className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                            produto.ativo ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-600'
                          }`}
                        >
                          {produto.ativo ? 'Ativo' : 'Inativo'}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{(produto.vendasTotais ?? 0).toLocaleString('pt-BR')} vendas</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <span title={`${(produto.vendasTotais ?? 0).toLocaleString('pt-BR')} vendas no histórico`} className="text-gray-400">
                            <BarChart3 className="h-4 w-4" />
                          </span>
                          <button
                            onClick={() => handleDuplicar(produto)}
                            disabled={duplicandoId === produto.id}
                            title="Duplicar produto"
                            className="text-gray-400 hover:text-gray-700 disabled:opacity-50"
                          >
                            {duplicandoId === produto.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Copy className="h-4 w-4" />}
                          </button>
                          <button onClick={() => handleEdit(produto)} className="text-gray-400 hover:text-gray-700">
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button onClick={() => handleDelete(produto.id)} className="text-red-500 hover:text-red-700">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {produtosPagina.length === 0 && (
              <p className="text-center text-gray-500 py-10">Nenhum produto encontrado.</p>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              Mostrando {produtosFiltrados.length === 0 ? 0 : (paginaAtual - 1) * ITENS_POR_PAGINA + 1} a{' '}
              {Math.min(paginaAtual * ITENS_POR_PAGINA, produtosFiltrados.length)} de {produtosFiltrados.length} produtos
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPagina((p) => Math.max(1, p - 1))}
                disabled={paginaAtual === 1}
                className="p-2 border border-gray-300 rounded-lg disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              {Array.from({ length: totalPaginas }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPaginas || Math.abs(p - paginaAtual) <= 1)
                .map((p, i, arr) => (
                  <React.Fragment key={p}>
                    {i > 0 && arr[i - 1] !== p - 1 && <span className="px-1 text-gray-400">…</span>}
                    <button
                      onClick={() => setPagina(p)}
                      className={`h-8 w-8 rounded-lg text-sm font-medium ${p === paginaAtual ? 'bg-orange-500 text-white' : 'border border-gray-300 text-gray-600 hover:bg-gray-50'}`}
                    >
                      {p}
                    </button>
                  </React.Fragment>
                ))}
              <button
                onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                disabled={paginaAtual === totalPaginas}
                className="p-2 border border-gray-300 rounded-lg disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {produtosPagina.map((produto) => (
            <div key={produto.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
              {produto.fotoUrl ? (
                <img src={produto.fotoUrl} alt={produto.nome} className="w-full h-28 object-cover" />
              ) : (
                <div className="w-full h-28 bg-gray-100 flex items-center justify-center">
                  <ImageOff className="h-6 w-6 text-gray-300" />
                </div>
              )}
              <div className="p-3">
                <p className="font-bold text-gray-800 text-sm truncate">{produto.nome}</p>
                <p className="text-orange-600 font-bold text-sm">R$ {(produto.precoPromocional ?? produto.preco).toFixed(2)}</p>
                <div className="flex items-center justify-between mt-2">
                  <button
                    onClick={() => handleToggleAtivo(produto)}
                    className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${produto.ativo ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-600'}`}
                  >
                    {produto.ativo ? 'Ativo' : 'Inativo'}
                  </button>
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleEdit(produto)} className="text-gray-400 hover:text-gray-700"><Pencil className="h-3.5 w-3.5" /></button>
                    <button onClick={() => handleDelete(produto.id)} className="text-red-500 hover:text-red-700"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {produtosPagina.length === 0 && <p className="col-span-full text-center text-gray-500 py-10">Nenhum produto encontrado.</p>}
        </div>
      )}

      <BottomSheet isOpen={modalAberto} onClose={fecharModal} title={editingId ? 'Editar produto' : 'Novo produto'}>
        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          <div className="grid md:grid-cols-2 gap-3">
            <input
              placeholder="Nome do produto"
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              required
            />
            <input
              placeholder="Código/SKU (opcional)"
              value={form.codigo}
              onChange={(e) => setForm({ ...form, codigo: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            <select
              value={form.categoriaId}
              onChange={(e) => setForm({ ...form, categoriaId: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
            >
              <option value="">Sem categoria</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </select>
            {categorias.length === 0 && (
              <p className="text-xs text-gray-400 self-center">Nenhuma categoria cadastrada ainda — crie uma na aba "Categorias".</p>
            )}
          </div>

          <textarea
            placeholder="Descrição (opcional)"
            value={form.descricao}
            onChange={(e) => setForm({ ...form, descricao: e.target.value })}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none"
          />

          <div className="grid md:grid-cols-2 gap-3">
            {!form.vendeSaquinhoPrato && (
              <input
                type="number"
                step="0.01"
                placeholder="Preço"
                value={form.preco}
                onChange={(e) => setForm({ ...form, preco: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                required
              />
            )}
            <input
              type="number"
              step="0.01"
              placeholder="Preço promocional (opcional)"
              value={form.precoPromocional}
              onChange={(e) => setForm({ ...form, precoPromocional: e.target.value })}
              className={`px-3 py-2 border border-gray-300 rounded-lg text-sm ${form.vendeSaquinhoPrato ? 'md:col-span-2' : ''}`}
            />
          </div>

          <FotoInput value={form.fotoUrl} onChange={(url) => setForm({ ...form, fotoUrl: url })} />

          <div className="flex items-center gap-3 flex-wrap">
            <label className="flex items-center gap-2 cursor-pointer w-fit">
              <input
                type="checkbox"
                checked={form.controlarEstoque}
                onChange={(e) => setForm({ ...form, controlarEstoque: e.target.checked })}
                className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
              />
              <span className="text-sm text-gray-700">Controlar estoque</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer w-fit">
              <input
                type="checkbox"
                checked={form.ehCombo}
                onChange={(e) => setForm({ ...form, ehCombo: e.target.checked })}
                className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
              />
              <span className="text-sm text-gray-700">Este produto é um combo</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer w-fit">
              <input
                type="checkbox"
                checked={form.vendeSaquinhoPrato}
                onChange={(e) => setForm({ ...form, vendeSaquinhoPrato: e.target.checked })}
                className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
              />
              <span className="text-sm text-gray-700">Vende no saquinho e no prato (preços diferentes)</span>
            </label>
          </div>

          {editingId && (() => {
            const produtoEmEdicao = produtos.find((p) => p.id === editingId);
            if (!produtoEmEdicao) return null;
            return (
              <button
                type="button"
                onClick={() => handleToggleEsgotado(produtoEmEdicao)}
                title="Pausar rapidamente sem desativar o produto"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium w-fit ${
                  produtoEmEdicao.esgotadoHoje ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                <PackageX className="h-3.5 w-3.5" /> {produtoEmEdicao.esgotadoHoje ? 'Esgotado hoje (clique pra retomar)' : 'Marcar como esgotado hoje'}
              </button>
            );
          })()}

          {form.controlarEstoque && (
            <div className="grid md:grid-cols-2 gap-3">
              <input
                type="number"
                min={0}
                placeholder="Quantidade em estoque"
                value={form.estoqueQtd}
                onChange={(e) => setForm({ ...form, estoqueQtd: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <input
                type="number"
                min={0}
                placeholder="Estoque mínimo (alerta no dashboard)"
                value={form.estoqueMinimo}
                onChange={(e) => setForm({ ...form, estoqueMinimo: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
          )}

          {form.vendeSaquinhoPrato && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 space-y-3">
              <p className="text-xs font-semibold text-gray-600">
                O cliente vai escolher "No Saquinho" ou "No Prato" antes de adicionar ao carrinho — informe o preço de cada formato.
              </p>
              <div className="grid md:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-gray-500">Preço no Saquinho</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Ex: 32.00"
                    value={form.precoSaquinho}
                    onChange={(e) => setForm({ ...form, precoSaquinho: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    required
                  />
                  <FotoInput value={form.fotoSaquinho} onChange={(url) => setForm({ ...form, fotoSaquinho: url })} />
                  <input
                    value={form.descricaoSaquinho}
                    onChange={(e) => setForm({ ...form, descricaoSaquinho: e.target.value })}
                    placeholder="Subtítulo (opcional)"
                    className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-gray-500">Preço no Prato</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Ex: 36.00"
                    value={form.precoPrato}
                    onChange={(e) => setForm({ ...form, precoPrato: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    required
                  />
                  <FotoInput value={form.fotoPrato} onChange={(url) => setForm({ ...form, fotoPrato: url })} />
                  <input
                    value={form.descricaoPrato}
                    onChange={(e) => setForm({ ...form, descricaoPrato: e.target.value })}
                    placeholder="Subtítulo (opcional)"
                    className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full flex items-center justify-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-4 py-2.5 rounded-lg disabled:opacity-60"
          >
            <Plus className="h-4 w-4" /> {saving ? 'Salvando...' : editingId ? 'Salvar alterações' : 'Adicionar produto'}
          </button>

          {editingId && (
            <div className="pt-3 mt-3 border-t border-gray-100 space-y-4">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-2 flex items-center gap-1.5">
                  <Boxes className="h-3.5 w-3.5" /> Variações
                </h4>
                <VariacoesManager empresaId={empresaId} produtoId={editingId} />
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-2 flex items-center gap-1.5">
                  <ListChecks className="h-3.5 w-3.5" /> Opções e grupos
                </h4>
                <GruposOpcaoManager empresaId={empresaId} produtoId={editingId} />
              </div>
            </div>
          )}
        </form>
      </BottomSheet>
    </div>
  );
};

export default ProdutosTab;
