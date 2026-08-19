import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Plus, Trash2, Pencil, X, ImageOff, PackageX, Boxes, ChevronUp, Layers, ListChecks, Upload, Loader2, Image as ImageIcon, Copy } from 'lucide-react';
import { Produto, ProdutoVariacao, ProdutoGrupoOpcao, Categoria } from '../../types/Produto';
import { fetchProdutos, createProduto, updateProduto, setProdutoStatus, setProdutoEsgotado, deleteProduto } from '../../lib/produtos';
import { fetchProdutoVariacoes, createProdutoVariacao, updateProdutoVariacao, deleteProdutoVariacao } from '../../lib/produtoVariacoes';
import { fetchCategorias } from '../../lib/categorias';
import { uploadImagem } from '../../lib/upload';
import {
  fetchProdutoGruposOpcao,
  createProdutoGrupoOpcao,
  updateProdutoGrupoOpcao,
  deleteProdutoGrupoOpcao,
  createProdutoOpcao,
  updateProdutoOpcao,
  deleteProdutoOpcao,
} from '../../lib/produtoGruposOpcao';

const FotoInput: React.FC<{ value: string; onChange: (url: string) => void }> = ({ value, onChange }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setErro('');
    setEnviando(true);
    try {
      const url = await uploadImagem(file);
      onChange(url);
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao enviar imagem');
    } finally {
      setEnviando(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        {value ? (
          <img src={value} alt="Prévia" className="w-10 h-10 rounded-lg object-cover border border-gray-200 shrink-0" />
        ) : (
          <div className="w-10 h-10 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center shrink-0">
            <ImageOff className="h-4 w-4 text-gray-300" />
          </div>
        )}
        <input
          placeholder="URL da foto (opcional)"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm min-w-0"
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={enviando}
          className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm px-3 py-2 rounded-lg shrink-0 disabled:opacity-60"
        >
          {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {enviando ? 'Enviando...' : 'Enviar do PC'}
        </button>
      </div>
      {erro && <p className="text-xs text-red-600">{erro}</p>}
    </div>
  );
};

interface ProdutosTabProps {
  empresaId: string;
}

const emptyForm = {
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

const ProdutosTab: React.FC<ProdutosTabProps> = ({ empresaId }) => {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [variacoesAbertas, setVariacoesAbertas] = useState<string | null>(null);
  const [opcoesAbertas, setOpcoesAbertas] = useState<string | null>(null);
  const [duplicandoId, setDuplicandoId] = useState<string | null>(null);

  useEffect(() => {
    fetchCategorias(empresaId)
      .then(setCategorias)
      .catch(() => setCategorias([]));
  }, [empresaId]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setProdutos(await fetchProdutos(empresaId));
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
      descricao: produto.descricao || '',
      categoriaId: produto.categoriaId || '',
      preco: String(produto.preco),
      precoPromocional: produto.precoPromocional != null ? String(produto.precoPromocional) : '',
      fotoUrl: produto.fotoUrl || '',
      controlarEstoque: produto.controlarEstoque,
      estoqueQtd: produto.estoqueQtd != null ? String(produto.estoqueQtd) : '',
      ehCombo: produto.ehCombo,
      vendeSaquinhoPrato,
      precoSaquinho: vendeSaquinhoPrato ? String(produto.preco + (opcaoSaquinho?.precoAdicional ?? 0)) : '',
      precoPrato: vendeSaquinhoPrato ? String(produto.preco + (opcaoPrato?.precoAdicional ?? 0)) : '',
      fotoSaquinho: opcaoSaquinho?.fotoUrl || '',
      fotoPrato: opcaoPrato?.fotoUrl || '',
      descricaoSaquinho: opcaoSaquinho?.descricao || emptyForm.descricaoSaquinho,
      descricaoPrato: opcaoPrato?.descricao || emptyForm.descricaoPrato,
    });
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
      descricao: form.descricao || null,
      categoriaId: form.categoriaId || null,
      preco,
      precoPromocional: form.precoPromocional ? parseFloat(form.precoPromocional) : null,
      fotoUrl: form.fotoUrl || null,
      controlarEstoque: form.controlarEstoque,
      estoqueQtd: form.controlarEstoque && form.estoqueQtd ? Number(form.estoqueQtd) : null,
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

      resetForm();
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
    if (editingId === id) resetForm();
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

  return (
    <div>
      <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded-xl mb-6 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-gray-800 text-sm">{editingId ? 'Editar produto' : 'Novo produto'}</h3>
          {editingId && (
            <button type="button" onClick={resetForm} className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1">
              <X className="h-3.5 w-3.5" /> Cancelar edição
            </button>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-3">
          <input
            placeholder="Nome do produto"
            value={form.nome}
            onChange={(e) => setForm({ ...form, nome: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            required
          />
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
            <p className="md:col-span-2 text-xs text-gray-400 -mt-1">
              Nenhuma categoria cadastrada ainda — crie uma na aba "Categorias".
            </p>
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
          {form.controlarEstoque && (
            <input
              type="number"
              min={0}
              placeholder="Quantidade em estoque"
              value={form.estoqueQtd}
              onChange={(e) => setForm({ ...form, estoqueQtd: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm w-48"
            />
          )}
        </div>

        {form.vendeSaquinhoPrato && (
          <div className="bg-white border border-gray-200 rounded-xl p-3 space-y-3">
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
          className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white text-sm px-4 py-2 rounded-lg disabled:opacity-60"
        >
          <Plus className="h-4 w-4" /> {saving ? 'Salvando...' : editingId ? 'Salvar alterações' : 'Adicionar produto'}
        </button>
      </form>

      {loading ? (
        <p className="text-center text-gray-500 py-8">Carregando...</p>
      ) : (
        <div className="space-y-2">
          {produtos.map((produto) => (
            <div key={produto.id} className="border border-gray-200 rounded-2xl overflow-hidden">
              <div className="flex items-center gap-3 p-3">
                {produto.fotoUrl ? (
                  <img src={produto.fotoUrl} alt={produto.nome} className="w-14 h-14 rounded-lg object-cover shrink-0" />
                ) : (
                  <div className="w-14 h-14 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                    <ImageOff className="h-6 w-6 text-gray-300" />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-800 text-sm truncate flex items-center gap-1.5">
                    {produto.nome}
                    {produto.ehCombo && (
                      <span className="flex items-center gap-1 text-[10px] font-medium bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full shrink-0">
                        <Layers className="h-2.5 w-2.5" /> Combo
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-gray-400">
                    {produto.categoria?.nome || 'Sem categoria'}
                    {produto.controlarEstoque && ` · estoque: ${produto.estoqueQtd ?? 0}`}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {produto.precoPromocional != null && (
                      <span className="text-xs text-gray-400 line-through">R$ {produto.preco.toFixed(2)}</span>
                    )}
                    <span className="text-orange-600 font-bold text-sm">
                      R$ {(produto.precoPromocional ?? produto.preco).toFixed(2)}
                    </span>
                    {!produto.disponivel && (
                      <span className="text-[10px] font-medium bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Indisponível</span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => handleToggleEsgotado(produto)}
                  title="Pausar rapidamente sem excluir o produto"
                  className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium shrink-0 ${
                    produto.esgotadoHoje ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  <PackageX className="h-3.5 w-3.5" /> {produto.esgotadoHoje ? 'Esgotado hoje' : 'Esgotar hoje'}
                </button>

                <button
                  onClick={() => handleToggleAtivo(produto)}
                  className={`px-3 py-1 rounded-full text-xs font-medium shrink-0 ${
                    produto.ativo ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {produto.ativo ? 'Ativo' : 'Inativo'}
                </button>

                <button
                  onClick={() => {
                    setOpcoesAbertas(null);
                    setVariacoesAbertas(variacoesAbertas === produto.id ? null : produto.id);
                  }}
                  title="Variações/sabores com estoque próprio"
                  className="text-gray-400 hover:text-gray-700 shrink-0"
                >
                  {variacoesAbertas === produto.id ? <ChevronUp className="h-4 w-4" /> : <Boxes className="h-4 w-4" />}
                </button>
                <button
                  onClick={() => {
                    setVariacoesAbertas(null);
                    setOpcoesAbertas(opcoesAbertas === produto.id ? null : produto.id);
                  }}
                  title="Opções/complementos (ex: monte seu acarajé)"
                  className="text-gray-400 hover:text-gray-700 shrink-0"
                >
                  {opcoesAbertas === produto.id ? <ChevronUp className="h-4 w-4" /> : <ListChecks className="h-4 w-4" />}
                </button>
                <button
                  onClick={() => handleDuplicar(produto)}
                  disabled={duplicandoId === produto.id}
                  title="Duplicar produto"
                  className="text-gray-400 hover:text-gray-700 shrink-0 disabled:opacity-50"
                >
                  {duplicandoId === produto.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Copy className="h-4 w-4" />}
                </button>
                <button onClick={() => handleEdit(produto)} className="text-gray-400 hover:text-gray-700 shrink-0">
                  <Pencil className="h-4 w-4" />
                </button>
                <button onClick={() => handleDelete(produto.id)} className="text-red-500 hover:text-red-700 shrink-0">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {variacoesAbertas === produto.id && (
                <div className="bg-gray-50 border-t border-gray-200 p-3">
                  <VariacoesManager empresaId={empresaId} produtoId={produto.id} />
                </div>
              )}
              {opcoesAbertas === produto.id && (
                <div className="bg-gray-50 border-t border-gray-200 p-3">
                  <GruposOpcaoManager empresaId={empresaId} produtoId={produto.id} />
                </div>
              )}
            </div>
          ))}

          {produtos.length === 0 && (
            <p className="text-center text-gray-500 py-8">Nenhum produto cadastrado ainda.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default ProdutosTab;
