import React, { useCallback, useEffect, useState } from 'react';
import {
  Save, ImageIcon, Clock, BellRing, Tag, Users, Settings, Wallet, Star, Gift, Medal,
  FileText, RotateCcw, SlidersHorizontal, Download, Power, Loader2, Coins, Stamp,
} from 'lucide-react';
import { fetchEmpresaById, updateFidelidadeConfig } from '../../lib/empresas';
import { fetchClientes, zerarFidelidade, ajustarFidelidadeEmLote } from '../../lib/clientes';
import { LOYALTY_STAMPS_GOAL } from '../../types/Cliente';
import { FidelidadeMetodo } from '../../types/Fidelidade';
import FidelidadeClientesTab from './FidelidadeClientesTab';

interface FidelidadeTabProps {
  empresaId: string;
}

type SubTab = 'config' | 'clientes';
type ConfigSubTab = 'geral' | 'pontuacao' | 'resgates' | 'niveis' | 'comunicacao' | 'termos';

const CONFIG_SUB_TABS: { id: ConfigSubTab; label: string }[] = [
  { id: 'geral', label: 'Geral' },
  { id: 'pontuacao', label: 'Regras de Pontuação' },
  { id: 'resgates', label: 'Resgates e Recompensas' },
  { id: 'niveis', label: 'Níveis & Benefícios' },
  { id: 'comunicacao', label: 'Comunicação' },
  { id: 'termos', label: 'Notas e Termos' },
];

const Toggle: React.FC<{ checked: boolean; onChange: (v: boolean) => void }> = ({ checked, onChange }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${checked ? 'bg-emerald-500' : 'bg-gray-300'}`}
  >
    <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : ''}`} />
  </button>
);

const downloadCsv = (nomeArquivo: string, linhas: string[][]) => {
  const csv = linhas.map((l) => l.join(';')).join('\n');
  const blob = new Blob(['﻿', csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nomeArquivo;
  a.click();
  URL.revokeObjectURL(url);
};

const FidelidadeTab: React.FC<FidelidadeTabProps> = ({ empresaId }) => {
  const [subTab, setSubTab] = useState<SubTab>('clientes');
  const [configSubTab, setConfigSubTab] = useState<ConfigSubTab>('geral');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [nomeLoja, setNomeLoja] = useState('');

  const [fidelidadeMetodo, setFidelidadeMetodo] = useState<FidelidadeMetodo>('CARIMBO');
  const [fidelidadeAtiva, setFidelidadeAtiva] = useState(true);
  const [fidelidadeNomePrograma, setFidelidadeNomePrograma] = useState('');
  const [fidelidadeLogoUrl, setFidelidadeLogoUrl] = useState('');
  const [fidelidadeValidadeDias, setFidelidadeValidadeDias] = useState('');
  const [fidelidadeAvisoFaltam, setFidelidadeAvisoFaltam] = useState('');
  const [fidelidadeNomeItem, setFidelidadeNomeItem] = useState('');
  const [fidelidadeTermos, setFidelidadeTermos] = useState('');
  const [fidelidadeLimitePrata, setFidelidadeLimitePrata] = useState('20');
  const [fidelidadeLimiteOuro, setFidelidadeLimiteOuro] = useState('50');
  const [pontosNomeMoeda, setPontosNomeMoeda] = useState('pts');
  const [pontosPorReal, setPontosPorReal] = useState('1');
  const [pontosValidadeMeses, setPontosValidadeMeses] = useState('');
  const [pontosResgateMinimo, setPontosResgateMinimo] = useState('');
  const [pontosValorReal, setPontosValorReal] = useState('');
  const [cashbackPercent, setCashbackPercent] = useState('');
  const [indicacaoRecompensaUnidades, setIndicacaoRecompensaUnidades] = useState('3');

  const [zerando, setZerando] = useState(false);
  const [ajusteValor, setAjusteValor] = useState('');
  const [ajustando, setAjustando] = useState(false);
  const [exportando, setExportando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const empresa = await fetchEmpresaById(empresaId);
      setNomeLoja(empresa.nome);
      setFidelidadeMetodo(empresa.fidelidadeMetodo);
      setFidelidadeAtiva(empresa.fidelidadeAtiva);
      setFidelidadeNomePrograma(empresa.fidelidadeNomePrograma || '');
      setFidelidadeLogoUrl(empresa.fidelidadeLogoUrl || '');
      setFidelidadeValidadeDias(empresa.fidelidadeValidadeDias != null ? String(empresa.fidelidadeValidadeDias) : '');
      setFidelidadeAvisoFaltam(empresa.fidelidadeAvisoFaltam != null ? String(empresa.fidelidadeAvisoFaltam) : '');
      setFidelidadeNomeItem(empresa.fidelidadeNomeItem || '');
      setFidelidadeTermos(empresa.fidelidadeTermos || '');
      setFidelidadeLimitePrata(String(empresa.fidelidadeLimitePrata));
      setFidelidadeLimiteOuro(String(empresa.fidelidadeLimiteOuro));
      setPontosNomeMoeda(empresa.pontosNomeMoeda || 'pts');
      setPontosPorReal(empresa.pontosPorReal != null ? String(empresa.pontosPorReal) : '1');
      setPontosValidadeMeses(empresa.pontosValidadeMeses != null ? String(empresa.pontosValidadeMeses) : '');
      setPontosResgateMinimo(empresa.pontosResgateMinimo != null ? String(empresa.pontosResgateMinimo) : '');
      setPontosValorReal(empresa.pontosValorReal != null ? String(empresa.pontosValorReal) : '');
      setCashbackPercent(empresa.cashbackPercent != null ? String(empresa.cashbackPercent) : '');
      setIndicacaoRecompensaUnidades(String(empresa.indicacaoRecompensaUnidades));
    } catch {
      /* silencioso */
    } finally {
      setLoading(false);
    }
  }, [empresaId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (fidelidadeAvisoFaltam && (Number(fidelidadeAvisoFaltam) < 1 || Number(fidelidadeAvisoFaltam) > LOYALTY_STAMPS_GOAL - 1)) {
      setError(`O aviso deve ser entre 1 e ${LOYALTY_STAMPS_GOAL - 1}`);
      return;
    }
    if (cashbackPercent && (Number(cashbackPercent) < 0 || Number(cashbackPercent) > 100)) {
      setError('O percentual de cashback deve ser entre 0 e 100');
      return;
    }
    if (Number(fidelidadeLimiteOuro) <= Number(fidelidadeLimitePrata)) {
      setError('O limite do nível Ouro deve ser maior que o do nível Prata');
      return;
    }

    setSaving(true);
    try {
      await updateFidelidadeConfig(empresaId, {
        fidelidadeMetodo,
        fidelidadeAtiva,
        fidelidadeNomePrograma: fidelidadeNomePrograma || null,
        fidelidadeLogoUrl: fidelidadeLogoUrl || null,
        fidelidadeValidadeDias: fidelidadeValidadeDias ? Number(fidelidadeValidadeDias) : null,
        fidelidadeAvisoFaltam: fidelidadeAvisoFaltam ? Number(fidelidadeAvisoFaltam) : null,
        fidelidadeNomeItem: fidelidadeNomeItem || null,
        fidelidadeTermos: fidelidadeTermos || null,
        fidelidadeLimitePrata: Number(fidelidadeLimitePrata),
        fidelidadeLimiteOuro: Number(fidelidadeLimiteOuro),
        pontosNomeMoeda: pontosNomeMoeda || null,
        pontosPorReal: pontosPorReal ? Number(pontosPorReal) : null,
        pontosValidadeMeses: pontosValidadeMeses ? Number(pontosValidadeMeses) : null,
        pontosResgateMinimo: pontosResgateMinimo ? Number(pontosResgateMinimo) : null,
        pontosValorReal: pontosValorReal ? Number(pontosValorReal) : null,
        cashbackPercent: cashbackPercent ? Number(cashbackPercent) : null,
        indicacaoRecompensaUnidades: Number(indicacaoRecompensaUnidades),
      });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar configurações de fidelidade');
    } finally {
      setSaving(false);
    }
  };

  const handleZerar = async () => {
    const alvo = fidelidadeMetodo === 'PONTOS' ? 'os pontos' : 'os carimbos';
    if (!window.confirm(`Zerar ${alvo} de TODOS os clientes da loja? Essa ação não pode ser desfeita.`)) return;
    setZerando(true);
    try {
      await zerarFidelidade(empresaId);
      alert('Progresso de fidelidade zerado para todos os clientes.');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao zerar o progresso.');
    } finally {
      setZerando(false);
    }
  };

  const handleAjustar = async () => {
    const valor = Number(ajusteValor);
    if (!Number.isInteger(valor) || valor === 0) {
      alert('Digite um número inteiro diferente de zero (negativo pra subtrair).');
      return;
    }
    const alvo = fidelidadeMetodo === 'PONTOS' ? pontosNomeMoeda : 'carimbos';
    if (!window.confirm(`Aplicar ${valor > 0 ? '+' : ''}${valor} ${alvo} pra TODOS os clientes da loja?`)) return;
    setAjustando(true);
    try {
      await ajustarFidelidadeEmLote(empresaId, valor);
      setAjusteValor('');
      alert('Ajuste aplicado a todos os clientes.');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao ajustar em lote.');
    } finally {
      setAjustando(false);
    }
  };

  const handleExportarClientes = async () => {
    setExportando(true);
    try {
      const clientes = await fetchClientes(empresaId);
      const linhas = clientes.map((c) => [
        c.nome, c.telefone || '', c.email || '', String(c.totalUnidadesCompradas), String(c.saldoPontos), c.saldoCashback.toFixed(2),
      ]);
      downloadCsv('clientes-fidelidade.csv', [
        ['Nome', 'Telefone', 'Email', 'Unidades compradas', 'Saldo de pontos', 'Saldo de cashback'],
        ...linhas,
      ]);
    } catch {
      alert('Não foi possível exportar os clientes.');
    } finally {
      setExportando(false);
    }
  };

  const handleExcluirPrograma = async () => {
    if (!window.confirm('Desativar o programa de fidelidade? O cartão deixa de aparecer para os clientes até você reativar em "Status do programa".')) return;
    setExcluindo(true);
    try {
      await updateFidelidadeConfig(empresaId, { fidelidadeAtiva: false });
      setFidelidadeAtiva(false);
      alert('Programa de fidelidade desativado.');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao desativar o programa.');
    } finally {
      setExcluindo(false);
    }
  };

  const switcher = (
    <div className="flex bg-gray-100 rounded-xl p-1 mb-6 max-w-xs">
      <button
        type="button"
        onClick={() => setSubTab('clientes')}
        className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-colors ${
          subTab === 'clientes' ? 'bg-white shadow text-orange-600' : 'text-gray-500'
        }`}
      >
        <Users className="h-3.5 w-3.5" /> Clientes
      </button>
      <button
        type="button"
        onClick={() => setSubTab('config')}
        className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-colors ${
          subTab === 'config' ? 'bg-white shadow text-orange-600' : 'text-gray-500'
        }`}
      >
        <Settings className="h-3.5 w-3.5" /> Configurações
      </button>
    </div>
  );

  const header = (
    <div className="mb-4">
      <h2 className="text-lg font-bold text-gray-800">Fidelidade</h2>
      <p className="text-sm text-gray-500">
        {subTab === 'clientes'
          ? 'Veja seus clientes fiéis e gerencie o programa de fidelidade da sua loja'
          : 'Configure as regras e preferências do programa de fidelidade da sua loja'}
      </p>
    </div>
  );

  if (subTab === 'clientes') {
    return (
      <div>
        {header}
        {switcher}
        <FidelidadeClientesTab empresaId={empresaId} onAbrirConfiguracoes={() => setSubTab('config')} />
      </div>
    );
  }

  if (loading) {
    return (
      <div>
        {header}
        {switcher}
        <p className="text-center text-gray-500 py-8">Carregando...</p>
      </div>
    );
  }

  const ehPontos = fidelidadeMetodo === 'PONTOS';

  return (
    <div>
      {header}
      {switcher}

      <div className="flex flex-wrap items-center gap-1 mb-6 border-b border-gray-200">
        {CONFIG_SUB_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setConfigSubTab(t.id)}
            className={`px-3.5 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              configSubTab === t.id ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4 items-start">
          <div className="space-y-6">
            {configSubTab === 'geral' && (
              <>
                <section>
                  <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <Settings className="h-4 w-4 text-orange-600" /> Configurações gerais do programa
                  </h3>
                  <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-4">
                    <div className="flex flex-wrap items-end justify-between gap-3">
                      <div className="flex-1 min-w-[220px]">
                        <label className="text-xs font-medium text-gray-500 mb-1 block">Nome do programa</label>
                        <input
                          value={fidelidadeNomePrograma}
                          onChange={(e) => setFidelidadeNomePrograma(e.target.value)}
                          placeholder={`Fidelidade ${nomeLoja}`}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-sm text-gray-600">{fidelidadeAtiva ? 'Ativo' : 'Inativo'}</span>
                        <Toggle checked={fidelidadeAtiva} onChange={setFidelidadeAtiva} />
                      </div>
                    </div>
                    <p className="text-xs text-gray-400">
                      Programa {fidelidadeAtiva ? 'ativo e disponível' : 'desativado — o cartão não aparece'} para os clientes.
                    </p>
                  </div>
                </section>

                <section>
                  <h3 className="font-bold text-gray-800 mb-3">Método de fidelidade</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setFidelidadeMetodo('CARIMBO')}
                      className={`text-left bg-white border-2 rounded-2xl p-4 transition-colors ${fidelidadeMetodo === 'CARIMBO' ? 'border-orange-500' : 'border-gray-200 hover:border-gray-300'}`}
                    >
                      <p className="flex items-center gap-1.5 font-bold text-gray-800"><Stamp className="h-4 w-4 text-orange-600" /> Carimbos</p>
                      <p className="text-xs text-gray-500 mt-1">A cada {LOYALTY_STAMPS_GOAL} compras, a {LOYALTY_STAMPS_GOAL + 1}ª unidade é grátis.</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFidelidadeMetodo('PONTOS')}
                      className={`text-left bg-white border-2 rounded-2xl p-4 transition-colors ${fidelidadeMetodo === 'PONTOS' ? 'border-orange-500' : 'border-gray-200 hover:border-gray-300'}`}
                    >
                      <p className="flex items-center gap-1.5 font-bold text-gray-800"><Coins className="h-4 w-4 text-orange-600" /> Pontos</p>
                      <p className="text-xs text-gray-500 mt-1">Cada R$ gasto vira pontos, trocáveis por desconto em dinheiro.</p>
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    O nível do cliente (Bronze/Prata/Ouro) continua contando pelo total de unidades compradas nos dois métodos.
                  </p>
                </section>

                <section>
                  <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <ImageIcon className="h-4 w-4 text-orange-600" /> Logo do cartão fidelidade
                  </h3>
                  <div className="bg-white border border-gray-200 rounded-2xl p-4">
                    <input
                      value={fidelidadeLogoUrl}
                      onChange={(e) => setFidelidadeLogoUrl(e.target.value)}
                      placeholder="https://... (deixe em branco para usar o logo padrão da loja)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                    <p className="text-xs text-gray-400 mt-1.5">
                      Exibido no topo do cartão de fidelidade do cliente. Se vazio, usa o logo definido na aba Aparência.
                    </p>
                  </div>
                </section>
              </>
            )}

            {configSubTab === 'pontuacao' && (
              ehPontos ? (
                <section>
                  <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <Star className="h-4 w-4 text-orange-600" /> Regra de pontuação
                  </h3>
                  <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-4">
                    <div>
                      <label className="text-xs font-medium text-gray-500 mb-1 block">Moeda de pontos</label>
                      <input
                        value={pontosNomeMoeda}
                        onChange={(e) => setPontosNomeMoeda(e.target.value)}
                        placeholder="pts"
                        className="w-40 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                      <p className="text-xs text-gray-400 mt-1.5">Como os pontos aparecem pro cliente, ex: "pts", "estrelas".</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 mb-1 block">Quanto o cliente ganha</label>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">R$ 1,00 =</span>
                        <input
                          type="number"
                          min={0.01}
                          step="0.01"
                          value={pontosPorReal}
                          onChange={(e) => setPontosPorReal(e.target.value)}
                          className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                        <span className="text-sm text-gray-600">{pontosNomeMoeda || 'pts'}</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1.5">Calculado sobre o subtotal do pedido, creditado quando ele é entregue.</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 mb-1 block">Validade dos pontos</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={1}
                          value={pontosValidadeMeses}
                          onChange={(e) => setPontosValidadeMeses(e.target.value)}
                          placeholder="Sem validade"
                          className="w-32 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                        <span className="text-sm text-gray-500">meses</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1.5">
                        Política declarada ao cliente. A expiração automática de pontos antigos ainda não é aplicada pelo sistema.
                      </p>
                    </div>
                  </div>
                </section>
              ) : (
                <section>
                  <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <Stamp className="h-4 w-4 text-orange-600" /> Regra de carimbos
                  </h3>
                  <div className="bg-white border border-gray-200 rounded-2xl p-4">
                    <p className="text-sm text-gray-700">
                      A cada <span className="font-bold">{LOYALTY_STAMPS_GOAL}</span> unidades compradas em pedidos entregues, a próxima unidade é liberada como item grátis.
                    </p>
                    <p className="text-xs text-gray-400 mt-1.5">
                      Essa regra é fixa no método Carimbos. Pra ter uma taxa de acúmulo configurável (ex: R$ gasto = pontos), mude o método pra "Pontos" na aba Geral.
                    </p>
                  </div>
                </section>
              )
            )}

            {configSubTab === 'resgates' && (
              <>
                {ehPontos ? (
                  <section>
                    <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                      <Gift className="h-4 w-4 text-orange-600" /> Resgate de pontos
                    </h3>
                    <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-4">
                      <div>
                        <label className="text-xs font-medium text-gray-500 mb-1 block">Resgate mínimo</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min={1}
                            value={pontosResgateMinimo}
                            onChange={(e) => setPontosResgateMinimo(e.target.value)}
                            placeholder="Sem mínimo"
                            className="w-32 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          />
                          <span className="text-sm text-gray-500">{pontosNomeMoeda || 'pts'}</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1.5">Saldo mínimo que o cliente precisa ter pra poder resgatar.</p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500 mb-1 block">Valor de cada {(pontosNomeMoeda || 'ponto').replace(/s$/, '')}</label>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">R$</span>
                          <input
                            type="number"
                            min={0.01}
                            step="0.01"
                            value={pontosValorReal}
                            onChange={(e) => setPontosValorReal(e.target.value)}
                            className="w-28 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          />
                        </div>
                        <p className="text-xs text-gray-400 mt-1.5">Usado como desconto em dinheiro no checkout, até o valor do pedido.</p>
                      </div>
                    </div>
                  </section>
                ) : (
                  <>
                    <section>
                      <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                        <Clock className="h-4 w-4 text-orange-600" /> Prazo para resgatar o item grátis
                      </h3>
                      <div className="bg-white border border-gray-200 rounded-2xl p-4">
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min={1}
                            value={fidelidadeValidadeDias}
                            onChange={(e) => setFidelidadeValidadeDias(e.target.value)}
                            placeholder="Sem prazo"
                            className="w-32 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          />
                          <span className="text-sm text-gray-500">dias após completar {LOYALTY_STAMPS_GOAL} unidades</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1.5">
                          Se o cliente não resgatar dentro do prazo, o item expira. Deixe em branco pra não ter prazo.
                        </p>
                      </div>
                    </section>
                    <section>
                      <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                        <Tag className="h-4 w-4 text-orange-600" /> Nome do item nas mensagens
                      </h3>
                      <div className="bg-white border border-gray-200 rounded-2xl p-4">
                        <input
                          value={fidelidadeNomeItem}
                          onChange={(e) => setFidelidadeNomeItem(e.target.value)}
                          placeholder="Ex: lanches, pizzas, açaís..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                        <p className="text-xs text-gray-400 mt-1.5">
                          Usado no aviso, por exemplo: "Faltam 3 {fidelidadeNomeItem || 'itens'} para seu prêmio!"
                        </p>
                      </div>
                    </section>
                  </>
                )}

                <section>
                  <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-orange-600" /> Cashback
                  </h3>
                  <div className="bg-white border border-gray-200 rounded-2xl p-4">
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step="0.1"
                        value={cashbackPercent}
                        onChange={(e) => setCashbackPercent(e.target.value)}
                        placeholder="0"
                        className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                      <span className="text-sm text-gray-500">% do subtotal, creditado como saldo quando o pedido é entregue</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1.5">
                      Independente do método acima — o cliente usa esse saldo como desconto em R$ num pedido futuro. Deixe em branco ou 0 pra desativar.
                    </p>
                  </div>
                </section>
              </>
            )}

            {configSubTab === 'niveis' && (
              <section>
                <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <Medal className="h-4 w-4 text-orange-600" /> Níveis e benefícios
                </h3>
                <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-gray-500 mb-1 block">Nível Prata a partir de</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={1}
                          value={fidelidadeLimitePrata}
                          onChange={(e) => setFidelidadeLimitePrata(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                        <span className="text-xs text-gray-500 shrink-0">unid.</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 mb-1 block">Nível Ouro a partir de</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={1}
                          value={fidelidadeLimiteOuro}
                          onChange={(e) => setFidelidadeLimiteOuro(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                        <span className="text-xs text-gray-500 shrink-0">unid.</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400">Baseado no total histórico de unidades compradas pelo cliente (cosmético — não altera nenhuma regra de resgate).</p>

                  <div className="pt-2 border-t border-gray-100">
                    <label className="text-xs font-medium text-gray-500 mb-1 block">Bônus por indicação</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        value={indicacaoRecompensaUnidades}
                        onChange={(e) => setIndicacaoRecompensaUnidades(e.target.value)}
                        className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                      <span className="text-sm text-gray-500">unidades pros dois lados quando a indicação vira a 1ª compra</span>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {configSubTab === 'comunicacao' && (
              <section>
                <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <BellRing className="h-4 w-4 text-orange-600" /> Aviso de proximidade do prêmio
                </h3>
                <div className="bg-white border border-gray-200 rounded-2xl p-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Mostrar um aviso na loja quando faltarem</span>
                    <input
                      type="number"
                      min={1}
                      max={LOYALTY_STAMPS_GOAL - 1}
                      value={fidelidadeAvisoFaltam}
                      onChange={(e) => setFidelidadeAvisoFaltam(e.target.value)}
                      placeholder="—"
                      className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-sm text-center"
                    />
                    <span className="text-sm text-gray-500">unidades para o prêmio</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1.5">
                    Deixe em branco pra não mostrar o aviso. {ehPontos && 'Esse aviso hoje só é exibido no cartão de carimbos — no método Pontos ele fica sem efeito visível pro cliente.'}
                  </p>
                </div>
              </section>
            )}

            {configSubTab === 'termos' && (
              <section>
                <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-orange-600" /> Termos e condições do programa
                </h3>
                <div className="bg-white border border-gray-200 rounded-2xl p-4">
                  <textarea
                    value={fidelidadeTermos}
                    onChange={(e) => setFidelidadeTermos(e.target.value)}
                    rows={6}
                    placeholder="Ex: Pontos/carimbos não são transferíveis entre clientes, não têm valor em dinheiro fora do resgate na loja..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                  <p className="text-xs text-gray-400 mt-1.5">Texto livre, opcional — fica disponível pro cliente consultar as regras do programa.</p>
                </div>
              </section>
            )}

            {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>}
            {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm">Configurações de fidelidade salvas com sucesso!</div>}

            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white text-sm px-5 py-2.5 rounded-lg disabled:opacity-60"
            >
              <Save className="h-4 w-4" /> {saving ? 'Salvando...' : 'Salvar fidelidade'}
            </button>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-4">
            <p className="font-bold text-gray-800 mb-3">Resumo das configurações</p>
            <div className="space-y-2.5 text-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="text-gray-500">Status</span>
                <span className={`font-medium ${fidelidadeAtiva ? 'text-emerald-600' : 'text-gray-500'}`}>{fidelidadeAtiva ? 'Ativo' : 'Inativo'}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-gray-500">Método</span>
                <span className="font-medium text-gray-800">{ehPontos ? 'Pontos' : 'Carimbos'}</span>
              </div>
              {ehPontos ? (
                <>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-gray-500">Regra</span>
                    <span className="font-medium text-gray-800">R$1 = {pontosPorReal || 1} {pontosNomeMoeda || 'pts'}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-gray-500">Validade</span>
                    <span className="font-medium text-gray-800">{pontosValidadeMeses ? `${pontosValidadeMeses} meses` : 'Sem validade'}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-gray-500">Resgate mínimo</span>
                    <span className="font-medium text-gray-800">{pontosResgateMinimo ? `${pontosResgateMinimo} ${pontosNomeMoeda || 'pts'}` : 'Sem mínimo'}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-gray-500">Valor do ponto</span>
                    <span className="font-medium text-gray-800">R$ {pontosValorReal ? Number(pontosValorReal).toFixed(2) : '0,00'}</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-gray-500">Prazo de resgate</span>
                    <span className="font-medium text-gray-800">{fidelidadeValidadeDias ? `${fidelidadeValidadeDias} dias` : 'Sem prazo'}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-gray-500">Item do prêmio</span>
                    <span className="font-medium text-gray-800 truncate max-w-[130px] text-right">{fidelidadeNomeItem || 'Não definido'}</span>
                  </div>
                </>
              )}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-100">
                <span className="text-gray-500">Nível Prata/Ouro</span>
                <span className="font-medium text-gray-800">{fidelidadeLimitePrata}/{fidelidadeLimiteOuro} unid.</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-gray-500">Cashback</span>
                <span className="font-medium text-gray-800">{cashbackPercent && Number(cashbackPercent) > 0 ? `${cashbackPercent}%` : 'Desativado'}</span>
              </div>
            </div>
          </div>
        </div>
      </form>

      <div className="mt-6">
        <h3 className="font-bold text-gray-800 mb-3">Ações do programa</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-red-200 rounded-2xl p-4">
            <p className="flex items-center gap-1.5 font-bold text-gray-800 text-sm"><RotateCcw className="h-4 w-4 text-red-500" /> Zerar {ehPontos ? pontosNomeMoeda : 'carimbos'}</p>
            <p className="text-xs text-gray-500 mt-1 mb-3">Remove o progresso de fidelidade de todos os clientes.</p>
            <button
              onClick={handleZerar}
              disabled={zerando}
              className="w-full flex items-center justify-center gap-1.5 border border-red-300 text-red-600 hover:bg-red-50 text-sm font-medium px-3 py-2 rounded-lg disabled:opacity-60"
            >
              {zerando ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Zerar
            </button>
          </div>

          <div className="bg-white border border-amber-200 rounded-2xl p-4">
            <p className="flex items-center gap-1.5 font-bold text-gray-800 text-sm"><SlidersHorizontal className="h-4 w-4 text-amber-500" /> Ajustar em lote</p>
            <p className="text-xs text-gray-500 mt-1 mb-2">Soma (ou subtrai) de todos os clientes de uma vez.</p>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                value={ajusteValor}
                onChange={(e) => setAjusteValor(e.target.value)}
                placeholder="Ex: 5 ou -5"
                className="w-full px-2.5 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <button
                onClick={handleAjustar}
                disabled={ajustando || !ajusteValor}
                className="flex items-center gap-1 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium px-3 py-2 rounded-lg disabled:opacity-60 shrink-0"
              >
                {ajustando ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Ajustar'}
              </button>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-4">
            <p className="flex items-center gap-1.5 font-bold text-gray-800 text-sm"><Download className="h-4 w-4 text-blue-500" /> Exportar clientes</p>
            <p className="text-xs text-gray-500 mt-1 mb-3">Baixa a lista de clientes e progresso em CSV.</p>
            <button
              onClick={handleExportarClientes}
              disabled={exportando}
              className="w-full flex items-center justify-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium px-3 py-2 rounded-lg disabled:opacity-60"
            >
              {exportando ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Exportar
            </button>
          </div>

          <div className="bg-white border border-red-200 rounded-2xl p-4">
            <p className="flex items-center gap-1.5 font-bold text-gray-800 text-sm"><Power className="h-4 w-4 text-red-500" /> Excluir programa</p>
            <p className="text-xs text-gray-500 mt-1 mb-3">Desativa e remove o programa de fidelidade da loja.</p>
            <button
              onClick={handleExcluirPrograma}
              disabled={excluindo || !fidelidadeAtiva}
              className="w-full flex items-center justify-center gap-1.5 border border-red-300 text-red-600 hover:bg-red-50 text-sm font-medium px-3 py-2 rounded-lg disabled:opacity-60"
            >
              {excluindo ? <Loader2 className="h-4 w-4 animate-spin" /> : null} {fidelidadeAtiva ? 'Desativar' : 'Já desativado'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FidelidadeTab;
