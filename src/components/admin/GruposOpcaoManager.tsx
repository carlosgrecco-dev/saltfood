import React, { useCallback, useEffect, useState } from 'react';
import { Plus, Trash2, Image as ImageIcon } from 'lucide-react';
import { ProdutoGrupoOpcao } from '../../types/Produto';
import {
  fetchProdutoGruposOpcao,
  createProdutoGrupoOpcao,
  updateProdutoGrupoOpcao,
  deleteProdutoGrupoOpcao,
  createProdutoOpcao,
  updateProdutoOpcao,
  deleteProdutoOpcao,
} from '../../lib/produtoGruposOpcao';
import FotoInput from './FotoInput';

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

interface GruposOpcaoManagerProps {
  empresaId: string;
  produtoId: string;
  /** Chamado sempre que os grupos mudam (criado/editado/removido) — usado por quem exibe uma visão cross-produto, pra recarregar a lista geral. */
  onChange?: () => void;
}

const GruposOpcaoManager: React.FC<GruposOpcaoManagerProps> = ({ empresaId, produtoId, onChange }) => {
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

  const recarregar = () => {
    load();
    onChange?.();
  };

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
    recarregar();
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
    recarregar();
  };

  const handleDeleteGrupo = async (id: string) => {
    if (!window.confirm('Remover este grupo de opções e todas as suas opções?')) return;
    await deleteProdutoGrupoOpcao(empresaId, produtoId, id);
    recarregar();
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
    recarregar();
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
    recarregar();
  };

  const handleTogglePadrao = async (grupoId: string, opcao: ProdutoGrupoOpcao['opcoes'][number]) => {
    await updateProdutoOpcao(empresaId, produtoId, grupoId, opcao.id, {
      nome: opcao.nome,
      precoAdicional: opcao.precoAdicional,
      ativo: opcao.ativo,
      selecionadoPorPadrao: !opcao.selecionadoPorPadrao,
    });
    recarregar();
  };

  const handleTogglePrecoExtra = async (grupoId: string, opcao: ProdutoGrupoOpcao['opcoes'][number], ligado: boolean) => {
    setPrecoExtraAberto((prev) => ({ ...prev, [opcao.id]: ligado }));
    if (!ligado && opcao.precoAdicional !== 0) {
      await updateProdutoOpcao(empresaId, produtoId, grupoId, opcao.id, {
        nome: opcao.nome,
        precoAdicional: 0,
        ativo: opcao.ativo,
      });
      recarregar();
    }
  };

  const handleToggleOpcaoAtivo = async (grupoId: string, opcao: ProdutoGrupoOpcao['opcoes'][number]) => {
    await updateProdutoOpcao(empresaId, produtoId, grupoId, opcao.id, {
      nome: opcao.nome,
      precoAdicional: opcao.precoAdicional,
      ativo: !opcao.ativo,
    });
    recarregar();
  };

  const handleUpdateOpcaoPreco = async (grupoId: string, opcao: ProdutoGrupoOpcao['opcoes'][number], novoPreco: string) => {
    await updateProdutoOpcao(empresaId, produtoId, grupoId, opcao.id, {
      nome: opcao.nome,
      precoAdicional: novoPreco ? Number(novoPreco) : 0,
      ativo: opcao.ativo,
    });
    recarregar();
  };

  const handleDeleteOpcao = async (grupoId: string, id: string) => {
    await deleteProdutoOpcao(empresaId, produtoId, grupoId, id);
    recarregar();
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

export default GruposOpcaoManager;
