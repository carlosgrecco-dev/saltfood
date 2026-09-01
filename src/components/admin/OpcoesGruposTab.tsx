import React, { useCallback, useEffect, useState } from 'react';
import { ListChecks, PlusCircle, CheckSquare, Square, Layers } from 'lucide-react';
import { fetchTodosGruposOpcao } from '../../lib/produtoGruposOpcao';
import { ProdutoGrupoOpcaoComProduto } from '../../types/Produto';

interface OpcoesGruposTabProps {
  empresaId: string;
  /** true = mostra só os grupos opcionais (obrigatorio=false) — usado pela aba "Adicionais". */
  somenteAdicionais?: boolean;
}

const OpcoesGruposTab: React.FC<OpcoesGruposTabProps> = ({ empresaId, somenteAdicionais }) => {
  const [grupos, setGrupos] = useState<ProdutoGrupoOpcaoComProduto[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setGrupos(await fetchTodosGruposOpcao(empresaId));
    } catch {
      /* silencioso */
    } finally {
      setLoading(false);
    }
  }, [empresaId]);

  useEffect(() => {
    load();
  }, [load]);

  const termo = busca.trim().toLowerCase();
  const filtrados = grupos
    .filter((g) => (somenteAdicionais ? !g.obrigatorio : true))
    .filter((g) => !termo || g.nome.toLowerCase().includes(termo) || g.produtoNome.toLowerCase().includes(termo));

  return (
    <div>
      <div className="mb-5">
        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          {somenteAdicionais ? <PlusCircle className="h-5 w-5 text-orange-600" /> : <ListChecks className="h-5 w-5 text-orange-600" />}
          {somenteAdicionais ? 'Adicionais' : 'Opções e Grupos'}
        </h2>
        <p className="text-sm text-gray-500">
          {somenteAdicionais
            ? 'Grupos opcionais (extras/adicionais) configurados em cada produto — pra editar, abra o produto na aba Produtos.'
            : 'Todos os grupos de opção/complemento cadastrados nos produtos, num lugar só — pra editar, abra o produto na aba Produtos.'}
        </p>
      </div>

      <input
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        placeholder="Buscar por grupo ou produto..."
        className="w-full max-w-md mb-5 px-3 py-2.5 border border-gray-300 rounded-lg text-sm"
      />

      {loading ? (
        <p className="text-center text-gray-500 py-8">Carregando...</p>
      ) : (
        <div className="space-y-3">
          {filtrados.map((grupo) => (
            <div key={grupo.id} className="bg-white border border-gray-200 rounded-2xl p-4">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div>
                  <p className="font-bold text-gray-800">{grupo.nome}</p>
                  <p className="text-xs text-gray-400 flex items-center gap-1">
                    <Layers className="h-3 w-3" /> {grupo.produtoNome}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${grupo.obrigatorio ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                    {grupo.obrigatorio ? 'Obrigatório' : 'Opcional'}
                  </span>
                  <span className="text-[11px] font-medium bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                    {grupo.selecaoMultipla ? 'Múltipla escolha' : 'Escolha única'}
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {grupo.opcoes.map((opcao) => (
                  <span key={opcao.id} className="flex items-center gap-1 text-xs bg-gray-50 border border-gray-200 rounded-full px-2.5 py-1">
                    {opcao.ativo ? <CheckSquare className="h-3 w-3 text-emerald-500" /> : <Square className="h-3 w-3 text-gray-300" />}
                    {opcao.nome}
                    {opcao.precoAdicional > 0 && <span className="text-orange-600 font-semibold">+R$ {opcao.precoAdicional.toFixed(2)}</span>}
                  </span>
                ))}
                {grupo.opcoes.length === 0 && <span className="text-xs text-gray-400">Nenhuma opção cadastrada</span>}
              </div>
            </div>
          ))}
          {filtrados.length === 0 && (
            <p className="text-center text-gray-500 py-10">
              {somenteAdicionais ? 'Nenhum grupo opcional cadastrado ainda.' : 'Nenhum grupo de opção cadastrado ainda.'}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default OpcoesGruposTab;
