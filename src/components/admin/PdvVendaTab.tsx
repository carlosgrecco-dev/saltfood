import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Search, UserRound, Plus, Trash2, Minus, Eye, EyeOff, Wallet, TrendingUp, HandCoins,
  ArrowDownToLine, PiggyBank, Lock, Loader2, Pencil, Check, LayoutGrid, Maximize, Minimize,
  MinusCircle, PlusCircle,
} from 'lucide-react';
import { Produto, Categoria } from '../../types/Produto';
import { Cliente } from '../../types/Cliente';
import { CaixaSessao, ResumoCaixaSessao } from '../../types/CaixaSessao';
import { OperadorPdv } from '../../types/OperadorPdv';
import { FormaPagamento } from '../../types/Pedido';
import { fetchProdutos } from '../../lib/produtos';
import { fetchCategorias } from '../../lib/categorias';
import { fetchClientes, cadastroRapidoCliente } from '../../lib/clientes';
import { createPedidoComoAdmin, finalizarVendaPdv, PagamentoLinhaPdv } from '../../lib/pedidos';
import { validarCupom } from '../../lib/cupons';
import { fetchOperadoresPdv } from '../../lib/operadoresPdv';
import { fetchCaixaAberta, abrirCaixa, fetchResumoCaixaSessao } from '../../lib/caixaSessoes';
import { createMovimentoCaixa } from '../../lib/movimentosCaixa';
import { fetchEmpresaById } from '../../lib/empresas';
import { getAdminSession } from '../../lib/adminAuth';
import { CupomValidado } from '../../types/Cupom';
import BottomSheet from '../BottomSheet';
import PdvOpcoesModal from './PdvOpcoesModal';
import { salvarPreVenda } from '../../lib/pdvPreVendas';
import { useTenant } from '../../context/TenantContext';

interface PdvVendaTabProps {
  empresaId: string;
}

interface ItemCarrinho {
  uid: string;
  produto: Produto;
  quantidade: number;
  opcoesIds: string[];
  opcoesLabel: string;
  precoUnitario: number;
}

const BLUR_STORAGE_KEY = 'pdv_resumo_caixa_oculto';

const gerarUid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const PdvVendaTab: React.FC<PdvVendaTabProps> = ({ empresaId }) => {
  const [caixa, setCaixa] = useState<CaixaSessao | null>(null);
  const [resumoCaixa, setResumoCaixa] = useState<ResumoCaixaSessao | null>(null);
  const [carregandoCaixa, setCarregandoCaixa] = useState(true);
  const [ocultarValores, setOcultarValores] = useState(() => localStorage.getItem(BLUR_STORAGE_KEY) === '1');

  const [abrirCaixaAberto, setAbrirCaixaAberto] = useState(false);
  const [fundoTrocoDraft, setFundoTrocoDraft] = useState('0');
  const [operadorAberturaId, setOperadorAberturaId] = useState('');
  const [abrindoCaixa, setAbrindoCaixa] = useState(false);

  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [operadores, setOperadores] = useState<OperadorPdv[]>([]);
  const [permiteSplit, setPermiteSplit] = useState(false);

  const [categoriaAtiva, setCategoriaAtiva] = useState<string>('todas');
  const [buscaProduto, setBuscaProduto] = useState('');
  const [produtoParaOpcoes, setProdutoParaOpcoes] = useState<Produto | null>(null);

  const [itens, setItens] = useState<ItemCarrinho[]>([]);
  const [observacoes, setObservacoes] = useState('');
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [buscaClienteAberta, setBuscaClienteAberta] = useState(false);
  const [novoClienteAberto, setNovoClienteAberto] = useState(false);
  const [novoClienteNome, setNovoClienteNome] = useState('');
  const [novoClienteTelefone, setNovoClienteTelefone] = useState('');

  const [cupomCodigo, setCupomCodigo] = useState('');
  const [cupomValidado, setCupomValidado] = useState<CupomValidado | null>(null);
  const [validandoCupom, setValidandoCupom] = useState(false);
  const [erroCupom, setErroCupom] = useState('');

  const [vendedorId, setVendedorId] = useState('');
  const [taxaEntregaManual, setTaxaEntregaManual] = useState('0');
  const [taxasServicos, setTaxasServicos] = useState('0');
  const [editandoTaxaEntrega, setEditandoTaxaEntrega] = useState(false);
  const [editandoTaxasServicos, setEditandoTaxasServicos] = useState(false);
  const [imprimirAposFinalizar, setImprimirAposFinalizar] = useState(true);

  const [processando, setProcessando] = useState<string | null>(null);
  const [splitAberto, setSplitAberto] = useState(false);
  const [splitLinhas, setSplitLinhas] = useState<{ formaPagamento: FormaPagamento; valor: string }[]>([]);

  const [formaSelecionada, setFormaSelecionada] = useState<FormaPagamento | null>(null);
  const [valorRecebidoDraft, setValorRecebidoDraft] = useState('');

  const [telaCheia, setTelaCheia] = useState(false);
  const buscaProdutoRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [acaoCaixaAberta, setAcaoCaixaAberta] = useState<'SANGRIA' | 'SUPRIMENTO' | null>(null);
  const [acaoCaixaValor, setAcaoCaixaValor] = useState('');
  const [acaoCaixaDescricao, setAcaoCaixaDescricao] = useState('');
  const [salvandoAcaoCaixa, setSalvandoAcaoCaixa] = useState(false);

  const sessaoAdmin = getAdminSession(empresaId);
  const { slug } = useTenant();

  /** Abre a janela ANTES de qualquer await — se abrir só depois (ex: após o await de
   * finalizarVendaPdv), o navegador entende que não veio direto do clique e bloqueia como popup.
   * Devolve uma função pra redirecionar essa mesma janela pro pedido certo assim que ele existir. */
  const prepararJanelaComanda = (): ((pedidoId: string) => void) => {
    if (!imprimirAposFinalizar) return () => {};
    const janela = window.open('', '_blank', 'width=400,height=680');
    return (pedidoId: string) => {
      if (janela) janela.location.href = `/${slug}/admin/pedidos/${pedidoId}/imprimir`;
    };
  };

  const carregarCaixa = useCallback(async () => {
    setCarregandoCaixa(true);
    try {
      const aberta = await fetchCaixaAberta(empresaId);
      setCaixa(aberta);
      if (aberta) setResumoCaixa(await fetchResumoCaixaSessao(empresaId, aberta.id));
      else setResumoCaixa(null);
    } catch {
      setCaixa(null);
      setResumoCaixa(null);
    } finally {
      setCarregandoCaixa(false);
    }
  }, [empresaId]);

  useEffect(() => {
    carregarCaixa();
  }, [carregarCaixa]);

  useEffect(() => {
    fetchProdutos(empresaId, true).then(setProdutos).catch(() => setProdutos([]));
    fetchCategorias(empresaId).then(setCategorias).catch(() => setCategorias([]));
    fetchOperadoresPdv(empresaId, true).then(setOperadores).catch(() => setOperadores([]));
    fetchClientes(empresaId).then(setClientes).catch(() => setClientes([]));
    fetchEmpresaById(empresaId).then((e) => setPermiteSplit(e.pdvPermiteSplitPagamento)).catch(() => setPermiteSplit(false));
  }, [empresaId]);

  const toggleOcultarValores = () => {
    setOcultarValores((v) => {
      localStorage.setItem(BLUR_STORAGE_KEY, !v ? '1' : '0');
      return !v;
    });
  };

  const handleAbrirCaixa = async () => {
    setAbrindoCaixa(true);
    try {
      const operador = operadores.find((o) => o.id === operadorAberturaId);
      await abrirCaixa(empresaId, {
        operadorId: operadorAberturaId || undefined,
        // Sem operador de PDV escolhido, a abertura fica no nome de quem está logado no admin agora.
        operadorNome: operador ? undefined : (sessaoAdmin?.nome || 'Administrador'),
        fundoTroco: Number(fundoTrocoDraft) || 0,
      });
      setAbrirCaixaAberto(false);
      await carregarCaixa();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Não foi possível abrir o caixa.');
    } finally {
      setAbrindoCaixa(false);
    }
  };

  useEffect(() => {
    const handler = () => setTelaCheia(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  const toggleTelaCheia = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      // Pede tela cheia só no container do PDV (não no documento inteiro) — assim o menu lateral
      // e o cabeçalho do admin somem de verdade, em vez de só esticar tudo junto.
      containerRef.current?.requestFullscreen().catch(() => {});
    }
  };

  const handleRegistrarAcaoCaixa = async () => {
    const valor = Number(acaoCaixaValor);
    if (!acaoCaixaAberta || !Number.isFinite(valor) || valor <= 0) return;
    setSalvandoAcaoCaixa(true);
    try {
      await createMovimentoCaixa(empresaId, {
        tipo: acaoCaixaAberta,
        valor,
        descricao: acaoCaixaDescricao || (acaoCaixaAberta === 'SANGRIA' ? 'Sangria de caixa' : 'Reforço de troco'),
      });
      setAcaoCaixaAberta(null);
      setAcaoCaixaValor('');
      setAcaoCaixaDescricao('');
      await carregarCaixa();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Não foi possível registrar.');
    } finally {
      setSalvandoAcaoCaixa(false);
    }
  };

  const produtosFiltrados = useMemo(() => {
    const termo = buscaProduto.trim().toLowerCase();
    return produtos.filter((p) => {
      if (categoriaAtiva !== 'todas' && p.categoriaId !== categoriaAtiva) return false;
      if (termo && !p.nome.toLowerCase().includes(termo) && !(p.codigo || '').toLowerCase().includes(termo)) return false;
      return true;
    });
  }, [produtos, categoriaAtiva, buscaProduto]);

  const adicionarAoCarrinho = (produto: Produto, opcoesIds: string[] = [], quantidade = 1, observacoesItem = '') => {
    const grupos = produto.gruposOpcao || [];
    const precoBase = produto.precoPromocional ?? produto.preco;
    const precoAdicional = grupos.reduce((soma, g) => soma + opcoesIds.reduce((s, id) => {
      const opcao = g.opcoes.find((o) => o.id === id);
      return s + (opcao ? opcao.precoAdicional : 0);
    }, 0), 0);
    const opcoesLabel = grupos.flatMap((g) => g.opcoes.filter((o) => opcoesIds.includes(o.id)).map((o) => o.nome)).join(', ');

    setItens((prev) => {
      if (opcoesIds.length === 0 && !observacoesItem) {
        const existente = prev.find((i) => i.produto.id === produto.id && i.opcoesIds.length === 0);
        if (existente) {
          return prev.map((i) => (i.uid === existente.uid ? { ...i, quantidade: i.quantidade + quantidade } : i));
        }
      }
      return [...prev, {
        uid: gerarUid(), produto, quantidade, opcoesIds, opcoesLabel,
        precoUnitario: precoBase + precoAdicional,
      }];
    });
  };

  const handleClicarProduto = (produto: Produto) => {
    if ((produto.gruposOpcao || []).length > 0) {
      setProdutoParaOpcoes(produto);
    } else {
      adicionarAoCarrinho(produto);
    }
  };

  const alterarQuantidade = (uid: string, delta: number) => {
    setItens((prev) => prev
      .map((i) => (i.uid === uid ? { ...i, quantidade: i.quantidade + delta } : i))
      .filter((i) => i.quantidade > 0));
  };

  const removerItem = (uid: string) => setItens((prev) => prev.filter((i) => i.uid !== uid));

  const subtotal = itens.reduce((s, i) => s + i.precoUnitario * i.quantidade, 0);
  const desconto = cupomValidado ? (cupomValidado.freteGratis ? 0 : cupomValidado.desconto) : 0;
  const taxaEntregaValor = Number(taxaEntregaManual) || 0;
  const taxasServicosValor = Number(taxasServicos) || 0;
  const total = Math.max(0, subtotal - desconto) + taxaEntregaValor + taxasServicosValor;

  const handleAplicarCupom = async () => {
    if (!cupomCodigo.trim()) return;
    setValidandoCupom(true);
    setErroCupom('');
    try {
      const resultado = await validarCupom(empresaId, cupomCodigo.trim(), subtotal);
      setCupomValidado(resultado);
    } catch (err) {
      setErroCupom(err instanceof Error ? err.message : 'Cupom inválido');
      setCupomValidado(null);
    } finally {
      setValidandoCupom(false);
    }
  };

  const handleNovoCliente = async () => {
    if (!novoClienteNome.trim()) return;
    try {
      const cliente = await cadastroRapidoCliente(empresaId, novoClienteNome.trim(), novoClienteTelefone.trim() || undefined);
      setClientes((prev) => [...prev, cliente]);
      setClienteSelecionado(cliente);
      setNovoClienteAberto(false);
      setNovoClienteNome('');
      setNovoClienteTelefone('');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Não foi possível cadastrar o cliente.');
    }
  };

  const limparVenda = () => {
    setItens([]);
    setObservacoes('');
    setClienteSelecionado(null);
    setCupomCodigo('');
    setCupomValidado(null);
    setErroCupom('');
    setTaxaEntregaManual('0');
    setTaxasServicos('0');
    setFormaSelecionada(null);
    setValorRecebidoDraft('');
  };

  const acrescimoManual = taxaEntregaValor + taxasServicosValor;

  const criarPedidoBase = async () => {
    const vendedorNome = operadores.find((o) => o.id === vendedorId)?.nome;
    return createPedidoComoAdmin(empresaId, {
      tipoPedido: 'BALCAO',
      clienteId: clienteSelecionado?.id,
      clienteNome: clienteSelecionado?.nome || vendedorNome,
      formaPagamento: 'DINHEIRO',
      observacoes: observacoes || undefined,
      cupomCodigo: cupomValidado ? cupomCodigo.trim() : undefined,
      itens: itens.map((i) => ({ produtoId: i.produto.id, quantidade: i.quantidade, opcoes: i.opcoesIds })),
    });
  };

  const handleSalvarPreVenda = () => {
    if (itens.length === 0) return;
    salvarPreVenda(empresaId, {
      clienteNome: clienteSelecionado?.nome || null,
      observacoes,
      itens: itens.map((i) => ({ produtoNome: i.produto.nome, quantidade: i.quantidade, opcoesLabel: i.opcoesLabel, precoUnitario: i.precoUnitario })),
      total,
    });
    limparVenda();
    alert('Pré-venda salva neste terminal — veja em "Pré-venda / Orçamento".');
  };

  const handleGuardarPedido = async () => {
    if (itens.length === 0) return;
    setProcessando('guardar');
    try {
      await criarPedidoBase();
      limparVenda();
      alert('Pedido guardado — veja em "Pedidos em aberto".');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Não foi possível guardar o pedido.');
    } finally {
      setProcessando(null);
    }
  };

  const valorRecebido = Number(valorRecebidoDraft) || 0;
  const troco = formaSelecionada === 'DINHEIRO' && valorRecebido > total ? valorRecebido - total : 0;

  const handleConcluirCompra = async () => {
    if (itens.length === 0 || !formaSelecionada) return;
    setProcessando('concluir');
    const redirecionarComanda = prepararJanelaComanda();
    try {
      const pedido = await criarPedidoBase();
      const linha: PagamentoLinhaPdv = { formaPagamento: formaSelecionada, valor: total };
      if (formaSelecionada === 'DINHEIRO' && valorRecebido > 0) linha.trocoPara = valorRecebido;
      await finalizarVendaPdv(empresaId, pedido.id, [linha], acrescimoManual > 0 ? { acrescimoManual, motivoAjusteManual: 'Taxa de entrega / serviço (PDV)' } : undefined);
      limparVenda();
      await carregarCaixa();
      redirecionarComanda(pedido.id);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Não foi possível finalizar a venda.');
    } finally {
      setProcessando(null);
    }
  };

  const abrirSplit = () => {
    setSplitLinhas([{ formaPagamento: 'PIX', valor: total.toFixed(2) }]);
    setSplitAberto(true);
  };

  const somaSplit = splitLinhas.reduce((s, l) => s + (Number(l.valor) || 0), 0);

  const handleConfirmarSplit = async () => {
    if (Math.abs(somaSplit - total) > 0.01) return;
    setProcessando('split');
    const redirecionarComanda = prepararJanelaComanda();
    try {
      const pedido = await criarPedidoBase();
      const pagamentos: PagamentoLinhaPdv[] = splitLinhas.map((l) => ({ formaPagamento: l.formaPagamento, valor: Number(l.valor) }));
      await finalizarVendaPdv(empresaId, pedido.id, pagamentos, acrescimoManual > 0 ? { acrescimoManual, motivoAjusteManual: 'Taxa de entrega / serviço (PDV)' } : undefined);
      setSplitAberto(false);
      limparVenda();
      await carregarCaixa();
      redirecionarComanda(pedido.id);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Não foi possível finalizar a venda.');
    } finally {
      setProcessando(null);
    }
  };

  const algumModalAberto = buscaClienteAberta || novoClienteAberto || splitAberto || !!produtoParaOpcoes || !!acaoCaixaAberta || abrirCaixaAberto;

  useEffect(() => {
    if (!caixa) return;
    const handler = (e: KeyboardEvent) => {
      if (algumModalAberto) return;
      switch (true) {
        case e.key === 'F3':
          e.preventDefault();
          buscaProdutoRef.current?.focus();
          break;
        case e.key === 'F4':
          e.preventDefault();
          setBuscaClienteAberta(true);
          break;
        case e.key === 'F6':
          e.preventDefault();
          limparVenda();
          break;
        case e.key === 'F7':
          e.preventDefault();
          handleGuardarPedido();
          break;
        case e.key === 'F8':
          e.preventDefault();
          handleSalvarPreVenda();
          break;
        case e.key === 'F9':
          e.preventDefault();
          toggleTelaCheia();
          break;
        case e.key === 'F10':
          e.preventDefault();
          setFormaSelecionada('PIX');
          break;
        case e.key === 'F11':
          e.preventDefault();
          setFormaSelecionada('DINHEIRO');
          break;
        case e.key === 'F12':
          e.preventDefault();
          setFormaSelecionada('CARTAO');
          break;
        case e.altKey && e.key.toLowerCase() === 'm':
          e.preventDefault();
          if (permiteSplit) abrirSplit();
          break;
        default:
          break;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caixa, algumModalAberto, permiteSplit, itens, observacoes, clienteSelecionado, cupomValidado, taxaEntregaManual, taxasServicos]);

  const valorClasse = ocultarValores ? 'blur-sm select-none' : '';

  if (carregandoCaixa) {
    return <p className="text-center text-gray-500 py-8">Carregando...</p>;
  }

  if (!caixa) {
    return (
      <div className="max-w-md mx-auto text-center py-16">
        <Lock className="h-10 w-10 text-gray-300 mx-auto mb-3" />
        <h3 className="font-bold text-gray-800 mb-1">Nenhum caixa aberto</h3>
        <p className="text-sm text-gray-500 mb-5">Abra o caixa pra começar a vender pelo PDV.</p>
        <button onClick={() => setAbrirCaixaAberto(true)} className="bg-orange-500 hover:bg-orange-600 text-white font-medium px-5 py-2.5 rounded-lg">
          Abrir caixa
        </button>

        <BottomSheet isOpen={abrirCaixaAberto} onClose={() => setAbrirCaixaAberto(false)} title="Abrir caixa">
          <div className="p-6 space-y-4">
            <div className="bg-gray-50 rounded-xl p-3 flex items-center gap-2.5">
              <UserRound className="h-5 w-5 text-gray-400 shrink-0" />
              <div>
                <p className="text-xs text-gray-500">Abrindo com o login de</p>
                <p className="font-bold text-gray-800 text-sm">{sessaoAdmin?.nome || 'Administrador'}</p>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Ou registrar em nome de um operador de PDV cadastrado</label>
              <select value={operadorAberturaId} onChange={(e) => setOperadorAberturaId(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
                <option value="">— usar meu login —</option>
                {operadores.map((o) => <option key={o.id} value={o.id}>{o.nome}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Fundo de troco inicial (R$)</label>
              <input type="number" min={0} step="0.01" value={fundoTrocoDraft} onChange={(e) => setFundoTrocoDraft(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
            <button onClick={handleAbrirCaixa} disabled={abrindoCaixa} className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-2.5 rounded-lg disabled:opacity-60 flex items-center justify-center gap-1.5">
              {abrindoCaixa ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Abrir caixa
            </button>
          </div>
        </BottomSheet>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`grid grid-cols-1 xl:grid-cols-[1fr_1.1fr] gap-4 ${telaCheia ? 'bg-gray-50 p-4 overflow-y-auto h-screen w-screen' : ''}`}
    >
      {/* Coluna esquerda: carrinho */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2 min-w-0">
            <UserRound className="h-5 w-5 text-gray-400 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-gray-400">Cliente (F4)</p>
              <p className="font-medium text-gray-800 truncate">{clienteSelecionado?.nome || 'Cliente não informado'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={() => setBuscaClienteAberta(true)} className="flex items-center gap-1 text-xs border border-gray-300 rounded-lg px-2.5 py-1.5 text-gray-600 hover:bg-gray-50"><Search className="h-3.5 w-3.5" /> Buscar</button>
            <button onClick={() => setNovoClienteAberto(true)} className="flex items-center gap-1 text-xs border border-gray-300 rounded-lg px-2.5 py-1.5 text-gray-600 hover:bg-gray-50"><Plus className="h-3.5 w-3.5" /> Novo</button>
            {clienteSelecionado && (
              <button onClick={() => setClienteSelecionado(null)} className="text-xs text-red-500 hover:underline">Remover</button>
            )}
          </div>
        </div>

        <p className="font-bold text-gray-800 text-sm mb-2">Itens do pedido ({itens.length})</p>
        <div className="space-y-2 mb-4 max-h-[280px] overflow-y-auto">
          {itens.map((item, i) => (
            <div key={item.uid} className="flex items-center gap-3 border border-gray-100 rounded-xl p-2.5">
              <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-700 text-[11px] font-bold flex items-center justify-center shrink-0">{i + 1}</span>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-gray-800 text-sm truncate">{item.produto.nome}</p>
                <p className="text-[11px] text-gray-400 truncate">{item.opcoesLabel || (item.produto.codigo ? `Código: ${item.produto.codigo}` : '')}</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button onClick={() => alterarQuantidade(item.uid, -1)} className="h-6 w-6 flex items-center justify-center border border-gray-300 rounded text-gray-500 hover:bg-gray-50"><Minus className="h-3 w-3" /></button>
                <span className="w-5 text-center text-sm">{item.quantidade}</span>
                <button onClick={() => alterarQuantidade(item.uid, 1)} className="h-6 w-6 flex items-center justify-center border border-gray-300 rounded text-gray-500 hover:bg-gray-50"><Plus className="h-3 w-3" /></button>
              </div>
              <span className="font-bold text-gray-800 text-sm w-16 text-right shrink-0">R$ {(item.precoUnitario * item.quantidade).toFixed(2)}</span>
              <button onClick={() => removerItem(item.uid)} className="text-red-400 hover:text-red-600 shrink-0"><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
          {itens.length === 0 && <p className="text-center text-gray-400 text-sm py-8">Adicione produtos pelo catálogo ao lado</p>}
        </div>

        <input
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
          placeholder="+ Adicionar observação ao pedido"
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm mb-4"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Cupom de desconto</label>
            <div className="flex items-center gap-1.5">
              <input value={cupomCodigo} onChange={(e) => setCupomCodigo(e.target.value.toUpperCase())} placeholder="Digite o código do cupom" className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm min-w-0" />
              <button onClick={handleAplicarCupom} disabled={validandoCupom || !cupomCodigo.trim()} className="text-sm font-medium bg-gray-800 hover:bg-gray-900 text-white px-3 py-2 rounded-lg disabled:opacity-60 shrink-0">
                {validandoCupom ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Aplicar'}
              </button>
            </div>
            {erroCupom && <p className="text-xs text-red-600 mt-1">{erroCupom}</p>}
            {cupomValidado && <p className="text-xs text-emerald-600 mt-1">Cupom {cupomValidado.codigo} aplicado</p>}
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Vendedor</label>
            <select value={vendedorId} onChange={(e) => setVendedorId(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
              <option value="">Administrador</option>
              {operadores.map((o) => <option key={o.id} value={o.id}>{o.nome}</option>)}
            </select>
          </div>
        </div>

        <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm mb-4">
          <div className="flex items-center justify-between"><span className="text-gray-500">Subtotal</span><span className="font-medium text-gray-800">R$ {subtotal.toFixed(2)}</span></div>
          <div className="flex items-center justify-between"><span className="text-gray-500">Desconto</span><span className="font-medium text-emerald-600">- R$ {desconto.toFixed(2)}</span></div>
          <div className="flex items-center justify-between">
            <span className="text-gray-500">Taxa de entrega</span>
            {editandoTaxaEntrega ? (
              <span className="flex items-center gap-1">
                <input autoFocus type="number" step="0.01" value={taxaEntregaManual} onChange={(e) => setTaxaEntregaManual(e.target.value)} onBlur={() => setEditandoTaxaEntrega(false)} className="w-20 px-1.5 py-0.5 border border-gray-300 rounded text-right text-sm" />
              </span>
            ) : (
              <button onClick={() => setEditandoTaxaEntrega(true)} className="flex items-center gap-1 font-medium text-gray-800 hover:text-orange-600">R$ {taxaEntregaValor.toFixed(2)} <Pencil className="h-3 w-3" /></button>
            )}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-500 flex items-center gap-1">Taxas e serviços</span>
            {editandoTaxasServicos ? (
              <input autoFocus type="number" step="0.01" value={taxasServicos} onChange={(e) => setTaxasServicos(e.target.value)} onBlur={() => setEditandoTaxasServicos(false)} className="w-20 px-1.5 py-0.5 border border-gray-300 rounded text-right text-sm" />
            ) : (
              <button onClick={() => setEditandoTaxasServicos(true)} className="flex items-center gap-1 font-medium text-gray-800 hover:text-orange-600">R$ {taxasServicosValor.toFixed(2)} <Pencil className="h-3 w-3" /></button>
            )}
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-gray-200">
            <span className="font-bold text-gray-800">Total</span>
            <span className="font-bold text-orange-600 text-lg">R$ {total.toFixed(2)}</span>
          </div>
        </div>

        <label className="flex items-center gap-2 mb-4 cursor-pointer">
          <input type="checkbox" checked={imprimirAposFinalizar} onChange={(e) => setImprimirAposFinalizar(e.target.checked)} className="text-orange-600 rounded" />
          <span className="text-sm text-gray-600">Imprimir após finalizar</span>
        </label>

        <div className="grid grid-cols-3 gap-2 mb-3">
          <button onClick={limparVenda} className="border border-red-200 text-red-600 hover:bg-red-50 font-medium text-sm py-2.5 rounded-lg">
            Cancelar <span className="block text-[10px] font-normal opacity-70">F6</span>
          </button>
          <button onClick={handleGuardarPedido} disabled={itens.length === 0 || processando === 'guardar'} className="border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium text-sm py-2.5 rounded-lg disabled:opacity-50 flex flex-col items-center justify-center gap-0.5">
            <span className="flex items-center gap-1.5">{processando === 'guardar' ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Guardar pedido</span>
            <span className="text-[10px] font-normal opacity-70">F7</span>
          </button>
          <button onClick={handleSalvarPreVenda} disabled={itens.length === 0} className="border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium text-sm py-2.5 rounded-lg disabled:opacity-50">
            Pré-venda <span className="block text-[10px] font-normal opacity-70">F8</span>
          </button>
        </div>

        <p className="text-xs font-medium text-gray-500 mb-1.5">Forma de pagamento</p>
        <div className="grid grid-cols-3 gap-2 mb-3">
          <button
            onClick={() => setFormaSelecionada('PIX')}
            disabled={itens.length === 0}
            className={`font-bold text-sm py-3 rounded-lg disabled:opacity-50 border-2 transition-colors ${formaSelecionada === 'PIX' ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white text-emerald-700 border-emerald-200 hover:border-emerald-400'}`}
          >
            PIX <span className="block text-[10px] font-normal opacity-70">F10</span>
          </button>
          <button
            onClick={() => setFormaSelecionada('DINHEIRO')}
            disabled={itens.length === 0}
            className={`font-bold text-sm py-3 rounded-lg disabled:opacity-50 border-2 transition-colors ${formaSelecionada === 'DINHEIRO' ? 'bg-amber-500 text-white border-amber-500' : 'bg-white text-amber-700 border-amber-200 hover:border-amber-400'}`}
          >
            Dinheiro <span className="block text-[10px] font-normal opacity-70">F11</span>
          </button>
          <button
            onClick={() => setFormaSelecionada('CARTAO')}
            disabled={itens.length === 0}
            className={`font-bold text-sm py-3 rounded-lg disabled:opacity-50 border-2 transition-colors ${formaSelecionada === 'CARTAO' ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-blue-700 border-blue-200 hover:border-blue-400'}`}
          >
            Cartão <span className="block text-[10px] font-normal opacity-70">F12</span>
          </button>
        </div>

        {formaSelecionada === 'DINHEIRO' && (
          <div className="flex items-center gap-3 mb-3 bg-amber-50 border border-amber-200 rounded-lg p-3">
            <div className="flex-1">
              <label className="text-xs font-medium text-amber-700 mb-1 block">Valor recebido (opcional)</label>
              <input type="number" min={0} step="0.01" value={valorRecebidoDraft} onChange={(e) => setValorRecebidoDraft(e.target.value)} placeholder={`R$ ${total.toFixed(2)}`} className="w-full px-3 py-1.5 border border-amber-300 rounded-lg text-sm bg-white" />
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs text-amber-700">Troco</p>
              <p className="font-bold text-amber-800">R$ {troco.toFixed(2)}</p>
            </div>
          </div>
        )}

        <button
          onClick={handleConcluirCompra}
          disabled={itens.length === 0 || !formaSelecionada || !!processando}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm py-3 rounded-lg disabled:opacity-50 flex items-center justify-center gap-1.5"
        >
          {processando === 'concluir' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Concluir compra
        </button>
        {permiteSplit && (
          <button onClick={abrirSplit} disabled={itens.length === 0 || !!processando} className="w-full mt-2 border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium text-sm py-2 rounded-lg disabled:opacity-50">
            Mais formas <span className="text-[10px] text-gray-400">Alt+M</span>
          </button>
        )}
      </div>

      {/* Coluna direita: produtos + caixa */}
      <div className="space-y-4">
        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input ref={buscaProdutoRef} value={buscaProduto} onChange={(e) => setBuscaProduto(e.target.value)} placeholder="Buscar produto (F3)" className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
            <button
              onClick={toggleTelaCheia}
              title={telaCheia ? 'Sair da tela cheia (F9)' : 'Tela cheia (F9)'}
              className="shrink-0 flex items-center justify-center h-9 w-9 border border-gray-300 rounded-lg text-gray-500 hover:bg-gray-50"
            >
              {telaCheia ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5 mb-4">
            <button onClick={() => setCategoriaAtiva('todas')} className={`px-3 py-1.5 rounded-full text-xs font-medium ${categoriaAtiva === 'todas' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Todos</button>
            {categorias.map((c) => (
              <button key={c.id} onClick={() => setCategoriaAtiva(c.id)} className={`px-3 py-1.5 rounded-full text-xs font-medium ${categoriaAtiva === c.id ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{c.nome}</button>
            ))}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[420px] overflow-y-auto">
            {produtosFiltrados.map((p) => (
              <button key={p.id} onClick={() => handleClicarProduto(p)} className="text-left border border-gray-200 rounded-xl p-2.5 hover:border-orange-300 hover:shadow-sm transition-all relative">
                {p.fotoUrl ? (
                  <img src={p.fotoUrl} alt={p.nome} className="w-full h-16 object-cover rounded-lg mb-1.5" />
                ) : (
                  <div className="w-full h-16 bg-gray-100 rounded-lg mb-1.5 flex items-center justify-center"><LayoutGrid className="h-5 w-5 text-gray-300" /></div>
                )}
                {p.ehCombo && <span className="absolute top-1.5 left-1.5 text-[9px] font-bold bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full">Combo</span>}
                <p className="font-medium text-gray-800 text-xs truncate">{p.nome}</p>
                <p className="font-bold text-orange-600 text-sm">R$ {(p.precoPromocional ?? p.preco).toFixed(2)}</p>
                <p className="text-[10px] text-gray-400">{p.codigo ? `Código: ${p.codigo}` : ''}</p>
                <span className="absolute bottom-2 right-2 h-6 w-6 rounded-full bg-orange-500 text-white flex items-center justify-center"><Plus className="h-3.5 w-3.5" /></span>
              </button>
            ))}
            {produtosFiltrados.length === 0 && <p className="col-span-full text-center text-gray-400 text-sm py-10">Nenhum produto encontrado</p>}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="font-bold text-gray-800">Resumo do caixa</p>
            <div className="flex items-center gap-2">
              <button onClick={() => setAcaoCaixaAberta('SUPRIMENTO')} title="Registrar suprimento (reforço de troco)" className="flex items-center gap-1 text-xs border border-gray-300 rounded-lg px-2 py-1 text-gray-600 hover:bg-gray-50">
                <PlusCircle className="h-3.5 w-3.5" /> Suprimento
              </button>
              <button onClick={() => setAcaoCaixaAberta('SANGRIA')} title="Registrar sangria" className="flex items-center gap-1 text-xs border border-gray-300 rounded-lg px-2 py-1 text-red-600 hover:bg-red-50">
                <MinusCircle className="h-3.5 w-3.5" /> Sangria
              </button>
              <button onClick={toggleOcultarValores} title={ocultarValores ? 'Mostrar valores' : 'Ocultar valores'} className="text-gray-400 hover:text-gray-700">
                {ocultarValores ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-[11px] text-gray-500 flex items-center gap-1"><Wallet className="h-3 w-3" /> Abertura</p>
              <p className={`text-sm font-bold text-gray-800 ${valorClasse}`}>R$ {caixa.fundoTroco.toFixed(2)}</p>
              <p className="text-[10px] text-gray-400 truncate">{caixa.operadorNome}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-[11px] text-gray-500 flex items-center gap-1"><TrendingUp className="h-3 w-3" /> Vendas</p>
              <p className={`text-sm font-bold text-emerald-600 ${valorClasse}`}>R$ {(resumoCaixa?.totalEntradas ?? 0).toFixed(2)}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-[11px] text-gray-500 flex items-center gap-1"><HandCoins className="h-3 w-3" /> Recebimentos</p>
              <p className={`text-sm font-bold text-gray-800 ${valorClasse}`}>R$ {(resumoCaixa?.totalEntradas ?? 0).toFixed(2)}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-[11px] text-gray-500 flex items-center gap-1"><ArrowDownToLine className="h-3 w-3" /> Sangrias</p>
              <p className={`text-sm font-bold text-red-500 ${valorClasse}`}>R$ {(resumoCaixa?.totalSangrias ?? 0).toFixed(2)}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-[11px] text-gray-500 flex items-center gap-1"><PiggyBank className="h-3 w-3" /> Troco</p>
              <p className={`text-sm font-bold text-gray-800 ${valorClasse}`}>R$ {(resumoCaixa?.totalSuprimentos ?? 0).toFixed(2)}</p>
            </div>
            <div className="bg-gray-800 rounded-xl p-3">
              <p className="text-[11px] text-gray-300">Total no caixa</p>
              <p className={`text-sm font-bold text-white ${valorClasse}`}>R$ {(resumoCaixa?.valorEsperado ?? caixa.fundoTroco).toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      <PdvOpcoesModal
        produto={produtoParaOpcoes}
        onClose={() => setProdutoParaOpcoes(null)}
        onConfirmar={(opcoesIds, quantidade) => {
          if (produtoParaOpcoes) adicionarAoCarrinho(produtoParaOpcoes, opcoesIds, quantidade);
          setProdutoParaOpcoes(null);
        }}
      />

      <BottomSheet isOpen={buscaClienteAberta} onClose={() => setBuscaClienteAberta(false)} title="Buscar cliente">
        <ClienteBusca clientes={clientes} onSelecionar={(c) => { setClienteSelecionado(c); setBuscaClienteAberta(false); }} />
      </BottomSheet>

      <BottomSheet isOpen={novoClienteAberto} onClose={() => setNovoClienteAberto(false)} title="Novo cliente">
        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Nome</label>
            <input value={novoClienteNome} onChange={(e) => setNovoClienteNome(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" autoFocus />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Telefone (opcional)</label>
            <input value={novoClienteTelefone} onChange={(e) => setNovoClienteTelefone(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <button onClick={handleNovoCliente} disabled={!novoClienteNome.trim()} className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-2.5 rounded-lg disabled:opacity-60">Cadastrar</button>
        </div>
      </BottomSheet>

      <BottomSheet isOpen={splitAberto} onClose={() => setSplitAberto(false)} title="Dividir pagamento">
        <div className="p-6 space-y-4">
          {splitLinhas.map((linha, i) => (
            <div key={i} className="flex items-center gap-2">
              <select value={linha.formaPagamento} onChange={(e) => setSplitLinhas((prev) => prev.map((l, idx) => (idx === i ? { ...l, formaPagamento: e.target.value as FormaPagamento } : l)))} className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
                <option value="PIX">PIX</option>
                <option value="DINHEIRO">Dinheiro</option>
                <option value="CARTAO">Cartão</option>
              </select>
              <input type="number" step="0.01" value={linha.valor} onChange={(e) => setSplitLinhas((prev) => prev.map((l, idx) => (idx === i ? { ...l, valor: e.target.value } : l)))} className="w-28 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              <button onClick={() => setSplitLinhas((prev) => prev.filter((_, idx) => idx !== i))} className="text-red-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
          <button onClick={() => setSplitLinhas((prev) => [...prev, { formaPagamento: 'DINHEIRO', valor: '0' }])} className="text-sm text-orange-600 hover:underline flex items-center gap-1"><Plus className="h-3.5 w-3.5" /> Adicionar forma</button>
          <div className={`flex items-center justify-between text-sm pt-3 border-t border-gray-100 ${Math.abs(somaSplit - total) > 0.01 ? 'text-red-600' : 'text-emerald-600'}`}>
            <span>Somado: R$ {somaSplit.toFixed(2)}</span>
            <span>Total: R$ {total.toFixed(2)}</span>
          </div>
          <button onClick={handleConfirmarSplit} disabled={Math.abs(somaSplit - total) > 0.01 || processando === 'split'} className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-2.5 rounded-lg disabled:opacity-60 flex items-center justify-center gap-1.5">
            {processando === 'split' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Confirmar pagamento
          </button>
        </div>
      </BottomSheet>

      <BottomSheet isOpen={!!acaoCaixaAberta} onClose={() => setAcaoCaixaAberta(null)} title={acaoCaixaAberta === 'SANGRIA' ? 'Registrar sangria' : 'Registrar suprimento'}>
        <div className="p-6 space-y-4">
          <p className="text-xs text-gray-500">
            {acaoCaixaAberta === 'SANGRIA'
              ? 'Retirada de dinheiro do caixa (ex: depósito no banco, pagamento avulso).'
              : 'Reforço de troco no meio do turno (ex: trazer mais dinheiro pro caixa).'}
          </p>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Valor (R$)</label>
            <input autoFocus type="number" min={0} step="0.01" value={acaoCaixaValor} onChange={(e) => setAcaoCaixaValor(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Descrição (opcional)</label>
            <input value={acaoCaixaDescricao} onChange={(e) => setAcaoCaixaDescricao(e.target.value)} placeholder={acaoCaixaAberta === 'SANGRIA' ? 'Ex: depósito no banco' : 'Ex: reforço de troco'} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <button
            onClick={handleRegistrarAcaoCaixa}
            disabled={salvandoAcaoCaixa || !Number(acaoCaixaValor)}
            className={`w-full font-medium py-2.5 rounded-lg disabled:opacity-60 flex items-center justify-center gap-1.5 text-white ${acaoCaixaAberta === 'SANGRIA' ? 'bg-red-500 hover:bg-red-600' : 'bg-orange-500 hover:bg-orange-600'}`}
          >
            {salvandoAcaoCaixa ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Registrar
          </button>
        </div>
      </BottomSheet>
    </div>
  );
};

const ClienteBusca: React.FC<{ clientes: Cliente[]; onSelecionar: (c: Cliente) => void }> = ({ clientes, onSelecionar }) => {
  const [busca, setBusca] = useState('');
  const termo = busca.trim().toLowerCase();
  const filtrados = termo ? clientes.filter((c) => c.nome.toLowerCase().includes(termo) || (c.telefone || '').includes(termo)) : clientes;
  return (
    <div className="p-6">
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input autoFocus value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Nome ou telefone..." className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm" />
      </div>
      <div className="space-y-1.5 max-h-[50vh] overflow-y-auto">
        {filtrados.slice(0, 30).map((c) => (
          <button key={c.id} onClick={() => onSelecionar(c)} className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-gray-50 flex items-center justify-between">
            <span className="font-medium text-gray-800 text-sm">{c.nome}</span>
            <span className="text-xs text-gray-400">{c.telefone}</span>
          </button>
        ))}
        {filtrados.length === 0 && <p className="text-center text-gray-400 text-sm py-6">Nenhum cliente encontrado</p>}
      </div>
    </div>
  );
};

export default PdvVendaTab;
