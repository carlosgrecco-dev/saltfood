import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Search, UserRound, Plus, Trash2, Minus, Eye, EyeOff, Wallet, TrendingUp, HandCoins,
  ArrowDownToLine, PiggyBank, Lock, Loader2, Pencil, Check, LayoutGrid, Maximize, Minimize,
  MinusCircle, PlusCircle,
} from 'lucide-react';
import { Produto, Categoria } from '../../types/Produto';
import { Cliente } from '../../types/Cliente';
import { CaixaSessao, ResumoCaixaSessao } from '../../types/CaixaSessao';
import { Pedido, TipoPedido, FormaPagamento, TIPO_PEDIDO_LABELS, FORMA_PAGAMENTO_LABELS } from '../../types/Pedido';
import { fetchProdutos } from '../../lib/produtos';
import { fetchCategorias } from '../../lib/categorias';
import { fetchClientes, cadastroRapidoCliente } from '../../lib/clientes';
import { createPedidoComoAdmin, finalizarVendaPdv, PagamentoLinhaPdv } from '../../lib/pedidos';
import { validarCupom } from '../../lib/cupons';
import { fetchCaixaAberta, abrirCaixa, fetchResumoCaixaSessao } from '../../lib/caixaSessoes';
import { fetchOperadoresPdv } from '../../lib/operadoresPdv';
import { OperadorPdv } from '../../types/OperadorPdv';
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
const TIPOS_VENDA: TipoPedido[] = ['BALCAO', 'MESA', 'RETIRADA'];
const FORMAS_PAGAMENTO: FormaPagamento[] = ['PIX', 'DINHEIRO', 'CARTAO'];

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
  const [permiteMesaContinua, setPermiteMesaContinua] = useState(false);

  const [categoriaAtiva, setCategoriaAtiva] = useState<string>('todas');
  const [buscaProduto, setBuscaProduto] = useState('');
  const [produtoParaOpcoes, setProdutoParaOpcoes] = useState<Produto | null>(null);

  // Fluxo em 2 etapas, igual ao app: monta o carrinho (com tipo de venda e cliente), cria o
  // pedido ao avançar, e só então entra na etapa de pagamento (que já é sobre o pedido criado).
  const [etapa, setEtapa] = useState<'carrinho' | 'pagamento'>('carrinho');
  const [tipoVenda, setTipoVenda] = useState<TipoPedido>('BALCAO');
  const [mesaIdentificador, setMesaIdentificador] = useState('');

  const [itens, setItens] = useState<ItemCarrinho[]>([]);
  const [observacoes, setObservacoes] = useState('');
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [clienteSheetAberto, setClienteSheetAberto] = useState(false);

  const [cupomCodigo, setCupomCodigo] = useState('');
  const [cupomValidado, setCupomValidado] = useState<CupomValidado | null>(null);
  const [validandoCupom, setValidandoCupom] = useState(false);
  const [erroCupom, setErroCupom] = useState('');

  const [imprimirAposFinalizar, setImprimirAposFinalizar] = useState(true);
  const [processando, setProcessando] = useState<string | null>(null);
  const [criandoPedido, setCriandoPedido] = useState(false);

  const [pedidoAtual, setPedidoAtual] = useState<Pedido | null>(null);
  const [mesaAbertaDialogAberto, setMesaAbertaDialogAberto] = useState(false);
  const [mostrarAjuste, setMostrarAjuste] = useState(false);
  const [descontoManualDraft, setDescontoManualDraft] = useState('0');
  const [acrescimoManualDraft, setAcrescimoManualDraft] = useState('0');
  const [dividirPagamento, setDividirPagamento] = useState(false);
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
    fetchEmpresaById(empresaId)
      .then((e) => {
        setPermiteSplit(e.pdvPermiteSplitPagamento);
        setPermiteMesaContinua(e.pdvMesaAbertaContinua);
      })
      .catch(() => {
        setPermiteSplit(false);
        setPermiteMesaContinua(false);
      });
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

  const subtotalCarrinho = itens.reduce((s, i) => s + i.precoUnitario * i.quantidade, 0);
  const descontoCupom = cupomValidado ? (cupomValidado.freteGratis ? 0 : cupomValidado.desconto) : 0;
  const totalCarrinho = Math.max(0, subtotalCarrinho - descontoCupom);

  const handleAplicarCupom = async () => {
    if (!cupomCodigo.trim()) return;
    setValidandoCupom(true);
    setErroCupom('');
    try {
      const resultado = await validarCupom(empresaId, cupomCodigo.trim(), subtotalCarrinho);
      setCupomValidado(resultado);
    } catch (err) {
      setErroCupom(err instanceof Error ? err.message : 'Cupom inválido');
      setCupomValidado(null);
    } finally {
      setValidandoCupom(false);
    }
  };

  const handleCadastrarESelecionar = async (nome: string, telefone: string) => {
    try {
      const cliente = await cadastroRapidoCliente(empresaId, nome, telefone || undefined);
      setClientes((prev) => [...prev, cliente]);
      setClienteSelecionado(cliente);
      setClienteSheetAberto(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Não foi possível cadastrar o cliente.');
    }
  };

  const resetarParaNovaVenda = () => {
    setItens([]);
    setObservacoes('');
    setClienteSelecionado(null);
    setCupomCodigo('');
    setCupomValidado(null);
    setErroCupom('');
    setTipoVenda('BALCAO');
    setMesaIdentificador('');
    setPedidoAtual(null);
    setEtapa('carrinho');
    setMostrarAjuste(false);
    setDescontoManualDraft('0');
    setAcrescimoManualDraft('0');
    setDividirPagamento(false);
    setFormaSelecionada(null);
    setValorRecebidoDraft('');
  };

  const criarPedidoBase = async () => {
    return createPedidoComoAdmin(empresaId, {
      tipoPedido: tipoVenda,
      mesaIdentificador: tipoVenda === 'MESA' ? mesaIdentificador.trim() : undefined,
      clienteId: clienteSelecionado?.id,
      clienteNome: clienteSelecionado?.nome,
      formaPagamento: 'DINHEIRO', // placeholder — a forma real é definida na etapa de pagamento
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
      total: totalCarrinho,
    });
    resetarParaNovaVenda();
    alert('Pré-venda salva neste terminal — veja em "Pré-venda / Orçamento".');
  };

  const handleGuardarPedido = async () => {
    if (itens.length === 0) return;
    setProcessando('guardar');
    try {
      await criarPedidoBase();
      resetarParaNovaVenda();
      alert('Pedido guardado — veja em "Pedidos em aberto".');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Não foi possível guardar o pedido.');
    } finally {
      setProcessando(null);
    }
  };

  const handleContinuar = async () => {
    if (itens.length === 0) return;
    if (tipoVenda === 'MESA' && !mesaIdentificador.trim()) {
      alert('Informe a mesa / comanda.');
      return;
    }
    setCriandoPedido(true);
    try {
      const pedido = await criarPedidoBase();
      setPedidoAtual(pedido);
      if (tipoVenda === 'MESA' && permiteMesaContinua) {
        setMesaAbertaDialogAberto(true);
      } else {
        setEtapa('pagamento');
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Não foi possível criar o pedido.');
    } finally {
      setCriandoPedido(false);
    }
  };

  const handleDeixarMesaAberta = () => {
    setMesaAbertaDialogAberto(false);
    resetarParaNovaVenda();
    carregarCaixa();
  };

  const handleFecharMesaAgora = () => {
    setMesaAbertaDialogAberto(false);
    setEtapa('pagamento');
  };

  const handleCancelarVendaEmPagamento = () => {
    // O pedido já foi criado no backend — cancelar aqui não apaga ele, só volta pro carrinho em
    // branco. O pedido continua acessível (e finalizável) em "Pedidos em aberto".
    resetarParaNovaVenda();
  };

  const baseTotalPagamento = pedidoAtual?.total ?? 0;
  const descontoManualValor = Number(descontoManualDraft) || 0;
  const acrescimoManualValor = Number(acrescimoManualDraft) || 0;
  const totalAjustado = Math.max(0, baseTotalPagamento - descontoManualValor + acrescimoManualValor);
  const valorRecebido = Number(valorRecebidoDraft) || 0;
  const troco = formaSelecionada === 'DINHEIRO' && valorRecebido > totalAjustado ? valorRecebido - totalAjustado : 0;
  const somaSplit = splitLinhas.reduce((s, l) => s + (Number(l.valor) || 0), 0);

  const handleToggleDividirPagamento = (ativo: boolean) => {
    setDividirPagamento(ativo);
    if (ativo) setSplitLinhas([{ formaPagamento: 'PIX', valor: totalAjustado.toFixed(2) }]);
  };

  const handleConfirmarPagamento = async () => {
    if (!pedidoAtual) return;
    let pagamentos: PagamentoLinhaPdv[];
    if (dividirPagamento) {
      if (Math.abs(somaSplit - totalAjustado) > 0.01) return;
      pagamentos = splitLinhas.map((l) => ({ formaPagamento: l.formaPagamento, valor: Number(l.valor) || 0 }));
    } else {
      if (!formaSelecionada) return;
      const linha: PagamentoLinhaPdv = { formaPagamento: formaSelecionada, valor: totalAjustado };
      if (formaSelecionada === 'DINHEIRO' && valorRecebido > 0) linha.trocoPara = valorRecebido;
      pagamentos = [linha];
    }
    setProcessando('concluir');
    const redirecionarComanda = prepararJanelaComanda();
    try {
      const ajuste = (descontoManualValor > 0 || acrescimoManualValor > 0)
        ? { descontoManual: descontoManualValor, acrescimoManual: acrescimoManualValor, motivoAjusteManual: 'Ajuste no PDV' }
        : undefined;
      await finalizarVendaPdv(empresaId, pedidoAtual.id, pagamentos, ajuste);
      const pedidoId = pedidoAtual.id;
      resetarParaNovaVenda();
      await carregarCaixa();
      redirecionarComanda(pedidoId);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Não foi possível finalizar a venda.');
    } finally {
      setProcessando(null);
    }
  };

  const algumModalAberto = clienteSheetAberto || !!produtoParaOpcoes || !!acaoCaixaAberta || abrirCaixaAberto || mesaAbertaDialogAberto;

  useEffect(() => {
    if (!caixa) return;
    const handler = (e: KeyboardEvent) => {
      if (algumModalAberto) return;
      if (etapa === 'carrinho') {
        switch (true) {
          case e.key === 'F3':
            e.preventDefault();
            buscaProdutoRef.current?.focus();
            break;
          case e.key === 'F4':
            e.preventDefault();
            setClienteSheetAberto(true);
            break;
          case e.key === 'F6':
            e.preventDefault();
            resetarParaNovaVenda();
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
          default:
            break;
        }
      } else {
        switch (true) {
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
            if (permiteSplit) handleToggleDividirPagamento(!dividirPagamento);
            break;
          default:
            break;
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caixa, algumModalAberto, etapa, permiteSplit, dividirPagamento, itens, observacoes, clienteSelecionado, cupomValidado, tipoVenda, mesaIdentificador]);

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
      className={telaCheia ? 'bg-gray-50 p-4 overflow-y-auto h-screen w-screen' : ''}
    >
      {etapa === 'carrinho' ? (
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_1.1fr] gap-4">
          {/* Coluna esquerda: carrinho */}
          <div className="bg-white border border-gray-200 rounded-2xl p-4">
            <div className="mb-4">
              <p className="text-xs font-medium text-gray-500 mb-1.5">Tipo de venda</p>
              <div className="grid grid-cols-3 gap-2">
                {TIPOS_VENDA.map((tipo) => (
                  <button
                    key={tipo}
                    onClick={() => setTipoVenda(tipo)}
                    className={`text-sm font-medium py-2 rounded-lg border-2 transition-colors ${tipoVenda === tipo ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-gray-600 border-gray-200 hover:border-orange-300'}`}
                  >
                    {TIPO_PEDIDO_LABELS[tipo]}
                  </button>
                ))}
              </div>
              {tipoVenda === 'MESA' && (
                <input
                  value={mesaIdentificador}
                  onChange={(e) => setMesaIdentificador(e.target.value)}
                  placeholder="Mesa / comanda"
                  className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  autoFocus
                />
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2 min-w-0">
                <UserRound className="h-5 w-5 text-gray-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-gray-400">Cliente (opcional) · F4</p>
                  <p className="font-medium text-gray-800 truncate">{clienteSelecionado?.nome || 'Cliente não informado'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => setClienteSheetAberto(true)} className="flex items-center gap-1 text-xs border border-gray-300 rounded-lg px-2.5 py-1.5 text-gray-600 hover:bg-gray-50"><Search className="h-3.5 w-3.5" /> Buscar ou cadastrar cliente</button>
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

            <div className="mb-4">
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

            <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm mb-4">
              <div className="flex items-center justify-between"><span className="text-gray-500">Subtotal</span><span className="font-medium text-gray-800">R$ {subtotalCarrinho.toFixed(2)}</span></div>
              <div className="flex items-center justify-between"><span className="text-gray-500">Desconto</span><span className="font-medium text-emerald-600">- R$ {descontoCupom.toFixed(2)}</span></div>
              <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                <span className="font-bold text-gray-800">Total</span>
                <span className="font-bold text-orange-600 text-lg">R$ {totalCarrinho.toFixed(2)}</span>
              </div>
            </div>

            <label className="flex items-center gap-2 mb-4 cursor-pointer">
              <input type="checkbox" checked={imprimirAposFinalizar} onChange={(e) => setImprimirAposFinalizar(e.target.checked)} className="text-orange-600 rounded" />
              <span className="text-sm text-gray-600">Imprimir após finalizar</span>
            </label>

            <div className="grid grid-cols-3 gap-2 mb-3">
              <button onClick={resetarParaNovaVenda} className="border border-red-200 text-red-600 hover:bg-red-50 font-medium text-sm py-2.5 rounded-lg">
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

            <button
              onClick={handleContinuar}
              disabled={itens.length === 0 || criandoPedido || (tipoVenda === 'MESA' && !mesaIdentificador.trim())}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm py-3 rounded-lg disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {criandoPedido ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Continuar · {itens.length} item(ns) · R$ {totalCarrinho.toFixed(2)}
            </button>
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
        </div>
      ) : (
        <div className="max-w-xl mx-auto">
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-100">
              <div>
                <p className="text-xs text-gray-400">Pedido #{pedidoAtual?.numero}</p>
                <p className="text-sm text-gray-500">{TIPO_PEDIDO_LABELS[tipoVenda]}{tipoVenda === 'MESA' && mesaIdentificador ? ` · ${mesaIdentificador}` : ''}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400">Total a pagar</p>
                <p className="font-bold text-orange-600 text-2xl">R$ {totalAjustado.toFixed(2)}</p>
              </div>
            </div>

            <button onClick={() => setMostrarAjuste((v) => !v)} className="text-sm text-gray-600 hover:text-orange-600 flex items-center gap-1 mb-3">
              <Pencil className="h-3.5 w-3.5" /> Desconto ou acréscimo
            </button>
            {mostrarAjuste && (
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Desconto R$</label>
                  <input type="number" min={0} step="0.01" value={descontoManualDraft} onChange={(e) => setDescontoManualDraft(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Acréscimo R$</label>
                  <input type="number" min={0} step="0.01" value={acrescimoManualDraft} onChange={(e) => setAcrescimoManualDraft(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
              </div>
            )}

            {permiteSplit && (
              <label className="flex items-center gap-2 mb-4 cursor-pointer">
                <input type="checkbox" checked={dividirPagamento} onChange={(e) => handleToggleDividirPagamento(e.target.checked)} className="text-orange-600 rounded" />
                <span className="text-sm text-gray-600">Dividir em mais de uma forma <span className="text-[10px] text-gray-400">Alt+M</span></span>
              </label>
            )}

            {!dividirPagamento ? (
              <>
                <p className="text-xs font-medium text-gray-500 mb-1.5">Forma de pagamento</p>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {FORMAS_PAGAMENTO.map((forma, idx) => {
                    const cores: Record<FormaPagamento, string> = {
                      PIX: formaSelecionada === forma ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white text-emerald-700 border-emerald-200 hover:border-emerald-400',
                      DINHEIRO: formaSelecionada === forma ? 'bg-amber-500 text-white border-amber-500' : 'bg-white text-amber-700 border-amber-200 hover:border-amber-400',
                      CARTAO: formaSelecionada === forma ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-blue-700 border-blue-200 hover:border-blue-400',
                      MULTIPLO: '',
                    };
                    return (
                      <button
                        key={forma}
                        onClick={() => setFormaSelecionada(forma)}
                        className={`font-bold text-sm py-3 rounded-lg border-2 transition-colors ${cores[forma]}`}
                      >
                        {FORMA_PAGAMENTO_LABELS[forma]} <span className="block text-[10px] font-normal opacity-70">F{10 + idx}</span>
                      </button>
                    );
                  })}
                </div>

                {formaSelecionada === 'DINHEIRO' && (
                  <div className="flex items-center gap-3 mb-4 bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <div className="flex-1">
                      <label className="text-xs font-medium text-amber-700 mb-1 block">Valor recebido em dinheiro</label>
                      <input type="number" min={0} step="0.01" value={valorRecebidoDraft} onChange={(e) => setValorRecebidoDraft(e.target.value)} placeholder={`R$ ${totalAjustado.toFixed(2)}`} className="w-full px-3 py-1.5 border border-amber-300 rounded-lg text-sm bg-white" />
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-amber-700">Levar de troco</p>
                      <p className="font-bold text-amber-800">R$ {troco.toFixed(2)}</p>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="space-y-3 mb-4">
                {splitLinhas.map((linha, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <select value={linha.formaPagamento} onChange={(e) => setSplitLinhas((prev) => prev.map((l, idx) => (idx === i ? { ...l, formaPagamento: e.target.value as FormaPagamento } : l)))} className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
                      {FORMAS_PAGAMENTO.map((f) => <option key={f} value={f}>{FORMA_PAGAMENTO_LABELS[f]}</option>)}
                    </select>
                    <input type="number" step="0.01" value={linha.valor} onChange={(e) => setSplitLinhas((prev) => prev.map((l, idx) => (idx === i ? { ...l, valor: e.target.value } : l)))} className="w-28 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                    <button onClick={() => setSplitLinhas((prev) => prev.filter((_, idx) => idx !== i))} className="text-red-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                  </div>
                ))}
                <button onClick={() => setSplitLinhas((prev) => [...prev, { formaPagamento: 'DINHEIRO', valor: '0' }])} className="text-sm text-orange-600 hover:underline flex items-center gap-1"><Plus className="h-3.5 w-3.5" /> Adicionar forma</button>
                <div className={`flex items-center justify-between text-sm pt-3 border-t border-gray-100 ${Math.abs(somaSplit - totalAjustado) > 0.01 ? 'text-red-600' : 'text-emerald-600'}`}>
                  <span>Somado: R$ {somaSplit.toFixed(2)}</span>
                  <span>Total: R$ {totalAjustado.toFixed(2)}</span>
                </div>
              </div>
            )}

            <button
              onClick={handleConfirmarPagamento}
              disabled={!!processando || (dividirPagamento ? Math.abs(somaSplit - totalAjustado) > 0.01 : !formaSelecionada)}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm py-3 rounded-lg disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {processando === 'concluir' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Confirmar pagamento e concluir venda
            </button>
            <button onClick={handleCancelarVendaEmPagamento} className="w-full mt-2 border border-gray-300 text-gray-600 hover:bg-gray-50 font-medium text-sm py-2.5 rounded-lg">
              Cancelar venda
            </button>
            <p className="text-[11px] text-gray-400 text-center mt-1.5">O pedido fica salvo em "Pedidos em aberto"</p>
          </div>
        </div>
      )}

      <PdvOpcoesModal
        produto={produtoParaOpcoes}
        onClose={() => setProdutoParaOpcoes(null)}
        onConfirmar={(opcoesIds, quantidade) => {
          if (produtoParaOpcoes) adicionarAoCarrinho(produtoParaOpcoes, opcoesIds, quantidade);
          setProdutoParaOpcoes(null);
        }}
      />

      <BottomSheet isOpen={clienteSheetAberto} onClose={() => setClienteSheetAberto(false)} title="Buscar cliente">
        <ClienteSheetConteudo clientes={clientes} onSelecionar={(c) => { setClienteSelecionado(c); setClienteSheetAberto(false); }} onCadastrar={handleCadastrarESelecionar} />
      </BottomSheet>

      <BottomSheet isOpen={mesaAbertaDialogAberto} onClose={handleDeixarMesaAberta} title="Mesa aberta!">
        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-600">
            O pedido da mesa {mesaIdentificador} foi criado. Você pode deixá-la aberta e continuar
            vendendo (dá pra adicionar mais itens depois em "Pedidos em aberto"), ou fechar a conta agora.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={handleDeixarMesaAberta} className="border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium text-sm py-2.5 rounded-lg">Deixar aberta</button>
            <button onClick={handleFecharMesaAgora} className="bg-orange-500 hover:bg-orange-600 text-white font-medium text-sm py-2.5 rounded-lg">Fechar agora</button>
          </div>
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

const ClienteSheetConteudo: React.FC<{
  clientes: Cliente[];
  onSelecionar: (c: Cliente) => void;
  onCadastrar: (nome: string, telefone: string) => Promise<void>;
}> = ({ clientes, onSelecionar, onCadastrar }) => {
  const [busca, setBusca] = useState('');
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [cadastrando, setCadastrando] = useState(false);
  const termo = busca.trim().toLowerCase();
  const filtrados = termo ? clientes.filter((c) => c.nome.toLowerCase().includes(termo) || (c.telefone || '').includes(termo)) : clientes;

  const handleCadastrar = async () => {
    if (!nome.trim()) return;
    setCadastrando(true);
    try {
      await onCadastrar(nome.trim(), telefone.trim());
    } finally {
      setCadastrando(false);
    }
  };

  return (
    <div className="p-6 space-y-5">
      <div>
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input autoFocus value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Nome ou telefone..." className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm" />
        </div>
        <div className="space-y-1.5 max-h-[35vh] overflow-y-auto">
          {filtrados.slice(0, 30).map((c) => (
            <button key={c.id} onClick={() => onSelecionar(c)} className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-gray-50 flex items-center justify-between">
              <span className="font-medium text-gray-800 text-sm">{c.nome}</span>
              <span className="text-xs text-gray-400">{c.telefone}</span>
            </button>
          ))}
          {filtrados.length === 0 && <p className="text-center text-gray-400 text-sm py-6">Nenhum cliente encontrado</p>}
        </div>
      </div>

      <div className="pt-4 border-t border-gray-100">
        <p className="font-bold text-gray-800 text-sm mb-3">Cadastro rápido (cliente novo)</p>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Nome</label>
            <input value={nome} onChange={(e) => setNome(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Telefone (opcional)</label>
            <input value={telefone} onChange={(e) => setTelefone(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <button onClick={handleCadastrar} disabled={!nome.trim() || cadastrando} className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-2.5 rounded-lg disabled:opacity-60 flex items-center justify-center gap-1.5">
            {cadastrando ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Cadastrar e selecionar
          </button>
        </div>
      </div>
    </div>
  );
};

export default PdvVendaTab;
