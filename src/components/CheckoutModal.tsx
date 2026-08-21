import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Loader2, Search, Gift, MapPin, Check, Ticket, X, AlarmClockOff, Timer, CalendarClock, Wallet } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useCustomer } from '../context/CustomerContext';
import { useTenant } from '../context/TenantContext';
import { createPedido } from '../lib/pedidos';
import { fetchAddressByCep } from '../lib/viacep';
import { fetchEnderecos, createEndereco } from '../lib/enderecos';
import { validarCupom as validarCupomApi } from '../lib/cupons';
import { calcularFrete } from '../lib/frete';
import { salvarPedidoConvidado } from '../lib/guestOrders';
import { FormaPagamento } from '../types/Pedido';
import { loyaltyExpiracao } from '../types/Cliente';
import { EnderecoCliente } from '../types/Endereco';
import { CupomValidado } from '../types/Cupom';
import BottomSheet from './BottomSheet';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const NOVO_ENDERECO = 'novo';

const CheckoutModal: React.FC<CheckoutModalProps> = ({ isOpen, onClose }) => {
  const { items, subtotal, deliveryFee, total, clearCart, closeCart } = useCart();
  const { empresa, slug } = useTenant();
  const { customer, refreshCustomer } = useCustomer();
  const freeItemsAvailable = customer ? loyaltyExpiracao(customer, empresa).disponiveis : 0;

  const [useFreeItem, setUseFreeItem] = useState(false);
  const loyaltyDiscount = useFreeItem && items.length > 0 ? Math.min(...items.map((i) => i.unitPrice)) : 0;

  const [savedAddresses, setSavedAddresses] = useState<EnderecoCliente[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>(NOVO_ENDERECO);
  const [saveNewAddress, setSaveNewAddress] = useState(false);
  const [newAddressLabel, setNewAddressLabel] = useState('Casa');

  const [cupomInput, setCupomInput] = useState('');
  const [cupomAplicado, setCupomAplicado] = useState<CupomValidado | null>(null);
  const [validandoCupom, setValidandoCupom] = useState(false);
  const [cupomError, setCupomError] = useState('');

  const subtotalPosFidelidade = Math.max(0, subtotal - loyaltyDiscount);
  const cupomDesconto = cupomAplicado && !cupomAplicado.freteGratis
    ? Math.min(cupomAplicado.desconto, subtotalPosFidelidade)
    : 0;
  const freteGratisAplicado = Boolean(cupomAplicado?.freteGratis);
  const subtotalPosCupom = Math.max(0, subtotalPosFidelidade - cupomDesconto);

  const cashbackDisponivel = customer ? Number(customer.saldoCashback) : 0;
  const [usarCashback, setUsarCashback] = useState(false);
  const cashbackDesconto = usarCashback ? Math.min(cashbackDisponivel, subtotalPosCupom) : 0;

  const [taxaCalculada, setTaxaCalculada] = useState<number | null>(null);
  const deliveryFeeFinal = freteGratisAplicado ? 0 : (taxaCalculada ?? deliveryFee);
  const displayTotal = subtotalPosCupom - cashbackDesconto + deliveryFeeFinal;

  const pedidoMinimo = empresa.pedidoMinimo || 0;
  const abaixoDoPedidoMinimo = pedidoMinimo > 0 && subtotal < pedidoMinimo;
  const lojaFechada = !empresa.abertaAgora;

  const [form, setForm] = useState({
    name: '',
    phone: '',
    cep: '',
    address: '',
    number: '',
    neighborhood: '',
    city: '',
    reference: '',
    paymentMethod: '' as FormaPagamento | '',
    cashChangeFor: '',
    notes: '',
  });
  const [agendarPedido, setAgendarPedido] = useState(false);
  const [horarioAgendado, setHorarioAgendado] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successOrderId, setSuccessOrderId] = useState<{ numero: number; id: string } | null>(null);

  const [isCepLoading, setIsCepLoading] = useState(false);
  const [cepError, setCepError] = useState('');

  const handleCepChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 8);
    const formatted = digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
    setForm((f) => ({ ...f, cep: formatted }));
    setCepError('');
  };

  useEffect(() => {
    const digits = form.cep.replace(/\D/g, '');
    if (digits.length !== 8) return;

    let cancelled = false;
    setIsCepLoading(true);
    setCepError('');

    fetchAddressByCep(digits)
      .then((data) => {
        if (cancelled) return;
        if (!data) {
          setCepError('CEP não encontrado');
          return;
        }
        setForm((f) => ({
          ...f,
          address: data.logradouro || f.address,
          neighborhood: data.bairro || f.neighborhood,
          city: data.localidade ? `${data.localidade}/${data.uf}` : f.city,
        }));
      })
      .catch(() => {
        if (!cancelled) setCepError('Não foi possível buscar o CEP');
      })
      .finally(() => {
        if (!cancelled) setIsCepLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [form.cep]);

  useEffect(() => {
    if (isOpen && customer) {
      setForm((f) => ({ ...f, name: f.name || customer.nome, phone: f.phone || customer.telefone || '' }));
      fetchEnderecos(empresa.id, customer.id)
        .then((enderecos) => {
          setSavedAddresses(enderecos);
          const principal = enderecos.find((e) => e.principal);
          if (principal) setSelectedAddressId(principal.id);
        })
        .catch(() => setSavedAddresses([]));
    }
    if (!isOpen) {
      setUseFreeItem(false);
      setCupomInput('');
      setCupomAplicado(null);
      setCupomError('');
      setAgendarPedido(false);
      setHorarioAgendado('');
      setUsarCashback(false);
    }
  }, [isOpen, customer, empresa.id]);

  const handleAplicarCupom = async () => {
    if (!cupomInput.trim()) return;
    setCupomError('');
    setValidandoCupom(true);
    try {
      const resultado = await validarCupomApi(empresa.id, cupomInput.trim(), subtotalPosFidelidade);
      setCupomAplicado(resultado);
    } catch (err) {
      setCupomAplicado(null);
      setCupomError(err instanceof Error ? err.message : 'Cupom inválido');
    } finally {
      setValidandoCupom(false);
    }
  };

  const handleRemoverCupom = () => {
    setCupomAplicado(null);
    setCupomInput('');
    setCupomError('');
  };

  const enderecoSelecionado = savedAddresses.find((e) => e.id === selectedAddressId) || null;
  const usandoEnderecoSalvo = selectedAddressId !== NOVO_ENDERECO && Boolean(enderecoSelecionado);
  const bairroAtual = usandoEnderecoSalvo ? enderecoSelecionado?.bairro || '' : form.neighborhood;

  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      calcularFrete(empresa.id, bairroAtual || undefined, subtotalPosFidelidade - cupomDesconto)
        .then((resultado) => setTaxaCalculada(resultado.taxa))
        .catch(() => setTaxaCalculada(null));
    }, 400);
    return () => clearTimeout(timer);
  }, [isOpen, empresa.id, bairroAtual, subtotalPosFidelidade, cupomDesconto]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (agendarPedido && !horarioAgendado) {
      setError('Escolha o horário desejado para o agendamento.');
      return;
    }
    if (!form.paymentMethod) {
      setError('Escolha uma forma de pagamento.');
      return;
    }
    setIsSubmitting(true);
    try {
      const enderecoFinal = usandoEnderecoSalvo && enderecoSelecionado
        ? (enderecoSelecionado.numero ? `${enderecoSelecionado.endereco}, ${enderecoSelecionado.numero}` : enderecoSelecionado.endereco)
        : (form.number ? `${form.address}, ${form.number}` : form.address);
      const bairroFinal = usandoEnderecoSalvo && enderecoSelecionado ? enderecoSelecionado.bairro || undefined : form.neighborhood || undefined;
      const referenciaFinal = usandoEnderecoSalvo && enderecoSelecionado
        ? enderecoSelecionado.referencia || undefined
        : (form.city ? (form.reference ? `${form.reference} · ${form.city}` : form.city) : form.reference || undefined);

      const pedido = await createPedido(empresa.id, {
        clienteNome: form.name,
        clienteTelefone: form.phone,
        endereco: enderecoFinal,
        bairro: bairroFinal,
        referencia: referenciaFinal,
        formaPagamento: form.paymentMethod,
        trocoPara: form.cashChangeFor ? parseFloat(form.cashChangeFor) : undefined,
        observacoes: form.notes || undefined,
        clienteId: customer?.id,
        usarItemGratis: useFreeItem,
        cupomCodigo: cupomAplicado?.codigo,
        agendadoPara: agendarPedido && horarioAgendado ? new Date(horarioAgendado).toISOString() : undefined,
        usarCashback: cashbackDesconto > 0 ? cashbackDesconto : undefined,
        itens: items.map((item) => ({
          produtoId: item.productId,
          quantidade: item.quantity,
          observacoes: item.notes,
          opcoes: item.options && item.options.length > 0 ? item.options.map((o) => o.optionId) : undefined,
        })),
      });

      if (customer && !usandoEnderecoSalvo && saveNewAddress && form.address) {
        createEndereco(empresa.id, customer.id, {
          rotulo: newAddressLabel || 'Endereço',
          cep: form.cep || undefined,
          endereco: form.address,
          numero: form.number || undefined,
          bairro: form.neighborhood || undefined,
          cidade: form.city || undefined,
          referencia: form.reference || undefined,
        }).catch(() => {});
      }

      setSuccessOrderId({ numero: pedido.numero, id: pedido.id });
      clearCart();
      if (customer) refreshCustomer();
      else salvarPedidoConvidado(empresa.id, pedido.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar pedido. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseAll = () => {
    setSuccessOrderId(null);
    onClose();
    closeCart();
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={successOrderId ? undefined : 'Finalizar Pedido'}
      hideHeader={Boolean(successOrderId)}
      zIndexClass="z-[60]"
    >
      {successOrderId ? (
        <div className="p-8 text-center">
          <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Pedido enviado!</h2>
          <p className="text-gray-600 mb-2">
            Seu pedido foi recebido e já aparece no nosso painel. Em breve entraremos em contato para confirmar.
          </p>
          <p className="text-xs text-gray-400 font-mono mb-2">Pedido #{successOrderId.numero}</p>
          {agendarPedido && horarioAgendado && (
            <p className="flex items-center justify-center gap-1.5 text-sm text-gray-600 mb-2">
              <CalendarClock className="h-4 w-4 text-[var(--cor-primaria)]" />
              Agendado para {new Date(horarioAgendado).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
            </p>
          )}
          {(empresa.tempoEstimadoMin || empresa.tempoEstimadoMax) && (
            <p className="flex items-center justify-center gap-1.5 text-sm text-gray-600 mb-6">
              <Timer className="h-4 w-4 text-[var(--cor-primaria)]" />
              Tempo estimado: {empresa.tempoEstimadoMin && empresa.tempoEstimadoMax
                ? `${empresa.tempoEstimadoMin}–${empresa.tempoEstimadoMax} min`
                : `${empresa.tempoEstimadoMin ?? empresa.tempoEstimadoMax} min`}
            </p>
          )}
          {!(empresa.tempoEstimadoMin || empresa.tempoEstimadoMax) && <div className="mb-6" />}
          <Link
            to={`/${slug}/pedidos/${successOrderId.id}`}
            onClick={handleCloseAll}
            className="block w-full bg-gradient-to-r from-[var(--cor-primaria)] to-[var(--cor-secundaria)] text-white py-3 rounded-xl font-bold hover:brightness-110 transition-all mb-2"
          >
            Acompanhar pedido
          </Link>
          <button
            onClick={handleCloseAll}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-bold transition-all"
          >
            Fechar
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-gray-700 font-medium mb-1 text-sm">Nome completo</label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 bg-gray-50 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-gray-700 font-medium mb-1 text-sm">Telefone</label>
              <input
                required
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="(73) 99999-9999"
                className="w-full px-4 py-2.5 border border-gray-200 bg-gray-50 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
          </div>

          {customer && savedAddresses.length > 0 && (
            <div>
              <label className="block text-gray-700 font-medium mb-1.5 text-sm">Endereço de entrega</label>
              <div className="space-y-2">
                {savedAddresses.map((end) => (
                  <label
                    key={end.id}
                    className={`flex items-start gap-2.5 border rounded-xl px-3.5 py-2.5 cursor-pointer transition-colors ${
                      selectedAddressId === end.id ? 'border-[var(--cor-primaria)] bg-orange-50/40' : 'border-gray-200'
                    }`}
                  >
                    <input
                      type="radio"
                      name="endereco"
                      checked={selectedAddressId === end.id}
                      onChange={() => setSelectedAddressId(end.id)}
                      className="mt-1"
                    />
                    <MapPin className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-800">{end.rotulo}</p>
                      <p className="text-xs text-gray-500 truncate">
                        {end.endereco}{end.numero ? `, ${end.numero}` : ''}{end.bairro ? ` - ${end.bairro}` : ''}
                      </p>
                    </div>
                  </label>
                ))}
                <label
                  className={`flex items-center gap-2.5 border rounded-xl px-3.5 py-2.5 cursor-pointer transition-colors ${
                    selectedAddressId === NOVO_ENDERECO ? 'border-[var(--cor-primaria)] bg-orange-50/40' : 'border-gray-200'
                  }`}
                >
                  <input
                    type="radio"
                    name="endereco"
                    checked={selectedAddressId === NOVO_ENDERECO}
                    onChange={() => setSelectedAddressId(NOVO_ENDERECO)}
                  />
                  <span className="text-sm text-gray-700">Usar outro endereço</span>
                </label>
              </div>
            </div>
          )}

          {selectedAddressId === NOVO_ENDERECO && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 font-medium mb-1 text-sm">
                    CEP <span className="text-gray-400 font-normal">(opcional, ajuda a preencher o resto)</span>
                  </label>
                  <div className="relative">
                    <input
                      inputMode="numeric"
                      value={form.cep}
                      onChange={(e) => handleCepChange(e.target.value)}
                      placeholder="00000-000"
                      maxLength={9}
                      className="w-full px-4 py-2.5 pr-9 border border-gray-200 bg-gray-50 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                      {isCepLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                    </span>
                  </div>
                  {cepError && <p className="text-xs text-red-600 mt-1">{cepError}</p>}
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-1 text-sm">Número</label>
                  <input
                    required
                    value={form.number}
                    onChange={(e) => setForm({ ...form, number: e.target.value })}
                    placeholder="Ex: 123"
                    className="w-full px-4 py-2.5 border border-gray-200 bg-gray-50 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-1 text-sm">Endereço</label>
                <input
                  required
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="Preenchido automaticamente pelo CEP"
                  className="w-full px-4 py-2.5 border border-gray-200 bg-gray-50 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 font-medium mb-1 text-sm">Bairro</label>
                  <input
                    required
                    value={form.neighborhood}
                    onChange={(e) => setForm({ ...form, neighborhood: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 bg-gray-50 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-1 text-sm">Cidade</label>
                  <input
                    value={form.city}
                    readOnly
                    className="w-full px-4 py-2.5 border border-gray-200 bg-gray-100 text-gray-500 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-1 text-sm">Referência</label>
                <input
                  required
                  value={form.reference}
                  onChange={(e) => setForm({ ...form, reference: e.target.value })}
                  placeholder="Ex: próximo ao mercado tal"
                  className="w-full px-4 py-2.5 border border-gray-200 bg-gray-50 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              {customer && (
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={saveNewAddress}
                    onChange={(e) => setSaveNewAddress(e.target.checked)}
                    className="w-4 h-4 text-[var(--cor-primaria)] rounded focus:ring-orange-500"
                  />
                  <span className="text-sm text-gray-600">Salvar este endereço para próximos pedidos</span>
                  {saveNewAddress && (
                    <input
                      value={newAddressLabel}
                      onChange={(e) => setNewAddressLabel(e.target.value)}
                      placeholder="Rótulo"
                      className="w-28 px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs"
                    />
                  )}
                </label>
              )}
            </>
          )}

          {freeItemsAvailable > 0 && (
            <label className="flex items-center gap-3 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-300 rounded-xl px-4 py-3 cursor-pointer">
              <input
                type="checkbox"
                checked={useFreeItem}
                onChange={(e) => setUseFreeItem(e.target.checked)}
                className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
              />
              <Gift className="h-5 w-5 text-orange-600 shrink-0" />
              <span className="text-sm text-gray-700">
                Você tem <strong>{freeItemsAvailable}</strong> item{freeItemsAvailable > 1 ? 's' : ''} grátis da
                fidelidade — usar 1 neste pedido
              </span>
            </label>
          )}

          {cashbackDisponivel > 0 && (
            <label className="flex items-center gap-3 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-300 rounded-xl px-4 py-3 cursor-pointer">
              <input
                type="checkbox"
                checked={usarCashback}
                onChange={(e) => setUsarCashback(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
              />
              <Wallet className="h-5 w-5 text-emerald-600 shrink-0" />
              <span className="text-sm text-gray-700">
                Você tem <strong>R$ {cashbackDisponivel.toFixed(2)}</strong> de cashback — usar neste pedido
              </span>
            </label>
          )}

          <div>
            <label className="block text-gray-700 font-medium mb-1 text-sm">Cupom de desconto</label>
            {cupomAplicado ? (
              <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-4 py-2.5">
                <span className="flex items-center gap-2 text-sm text-green-700 font-semibold">
                  <Ticket className="h-4 w-4" /> {cupomAplicado.codigo} aplicado
                </span>
                <button type="button" onClick={handleRemoverCupom} className="text-green-700 hover:text-green-900">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  value={cupomInput}
                  onChange={(e) => setCupomInput(e.target.value.toUpperCase())}
                  placeholder="Digite o código"
                  className="flex-1 px-4 py-2.5 border border-gray-200 bg-gray-50 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent uppercase"
                />
                <button
                  type="button"
                  onClick={handleAplicarCupom}
                  disabled={validandoCupom || !cupomInput.trim()}
                  className="flex items-center gap-1.5 bg-gray-800 hover:bg-gray-900 text-white px-4 rounded-xl text-sm font-semibold disabled:opacity-60 transition-colors"
                >
                  {validandoCupom ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  Aplicar
                </button>
              </div>
            )}
            {cupomError && <p className="text-xs text-red-600 mt-1">{cupomError}</p>}
          </div>

          {empresa.habilitarAgendamento && (
          <div>
            <label className="block text-gray-700 font-medium mb-1.5 text-sm">Quando você quer receber?</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setAgendarPedido(false)}
                className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                  !agendarPedido ? 'border-[var(--cor-primaria)] bg-orange-50/40 text-gray-800' : 'border-gray-200 text-gray-500'
                }`}
              >
                <Timer className="h-4 w-4" /> Assim que possível
              </button>
              <button
                type="button"
                onClick={() => setAgendarPedido(true)}
                className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                  agendarPedido ? 'border-[var(--cor-primaria)] bg-orange-50/40 text-gray-800' : 'border-gray-200 text-gray-500'
                }`}
              >
                <CalendarClock className="h-4 w-4" /> Agendar horário
              </button>
            </div>
            {agendarPedido && (
              <input
                type="datetime-local"
                required
                value={horarioAgendado}
                onChange={(e) => setHorarioAgendado(e.target.value)}
                min={new Date(Date.now() + 30 * 60 * 1000).toISOString().slice(0, 16)}
                className="w-full mt-2 px-4 py-2.5 border border-gray-200 bg-gray-50 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            )}
          </div>
          )}

          <div>
            <label className="block text-gray-700 font-medium mb-1 text-sm">Forma de pagamento</label>
            <select
              required
              value={form.paymentMethod}
              onChange={(e) => setForm({ ...form, paymentMethod: e.target.value as FormaPagamento })}
              className="w-full px-4 py-2.5 border border-gray-200 bg-gray-50 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="" disabled>Selecione...</option>
              <option value="PIX">PIX</option>
              <option value="DINHEIRO">Dinheiro</option>
              <option value="CARTAO">Cartão na entrega</option>
            </select>
          </div>

          {form.paymentMethod === 'DINHEIRO' && (
            <div>
              <label className="block text-gray-700 font-medium mb-1 text-sm">Troco para quanto?</label>
              <input
                type="number"
                step="0.01"
                value={form.cashChangeFor}
                onChange={(e) => setForm({ ...form, cashChangeFor: e.target.value })}
                placeholder={`Ex: ${(total + 10).toFixed(2)}`}
                className="w-full px-4 py-2.5 border border-gray-200 bg-gray-50 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
          )}

          {form.paymentMethod === 'PIX' && (
            <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-xl border border-green-200 text-sm">
              <p className="font-bold text-green-800 mb-1">Dados PIX:</p>
              <p className="text-green-700">Combine a chave PIX com {empresa.nome} na confirmação do pedido.</p>
            </div>
          )}

          <div>
            <label className="block text-gray-700 font-medium mb-1 text-sm">Observações</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              className="w-full px-4 py-2.5 border border-gray-200 bg-gray-50 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          <div className="bg-gray-50 p-4 rounded-xl space-y-1 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>R$ {subtotal.toFixed(2)}</span>
            </div>
            {loyaltyDiscount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Item grátis (fidelidade)</span>
                <span>- R$ {loyaltyDiscount.toFixed(2)}</span>
              </div>
            )}
            {cupomDesconto > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Cupom {cupomAplicado?.codigo}</span>
                <span>- R$ {cupomDesconto.toFixed(2)}</span>
              </div>
            )}
            {cashbackDesconto > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Cashback</span>
                <span>- R$ {cashbackDesconto.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-gray-600">
              <span>Taxa de entrega</span>
              <span>
                {freteGratisAplicado ? (
                  <>
                    <span className="line-through text-gray-400 mr-1.5">R$ {(taxaCalculada ?? deliveryFee).toFixed(2)}</span>
                    <span className="text-green-600 font-semibold">Grátis</span>
                  </>
                ) : (
                  `R$ ${deliveryFeeFinal.toFixed(2)}`
                )}
              </span>
            </div>
            <div className="flex justify-between text-lg font-bold text-gray-800 pt-1 border-t border-gray-200">
              <span>Total</span>
              <span>R$ {displayTotal.toFixed(2)}</span>
            </div>
          </div>

          {lojaFechada && (
            <div className="flex items-center gap-2 bg-gray-100 border border-gray-300 text-gray-700 px-4 py-3 rounded-xl text-sm">
              <AlarmClockOff className="h-4 w-4 shrink-0" />
              A loja está fechada no momento e não está aceitando novos pedidos.
            </div>
          )}
          {!lojaFechada && abaixoDoPedidoMinimo && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl text-sm">
              Pedido mínimo de R$ {pedidoMinimo.toFixed(2)} — faltam R$ {(pedidoMinimo - subtotal).toFixed(2)}.
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>
          )}

          <button
            type="submit"
            disabled={isSubmitting || lojaFechada || abaixoDoPedidoMinimo}
            className="w-full bg-gradient-to-r from-[var(--cor-primaria)] to-[var(--cor-secundaria)] text-white py-3.5 rounded-xl font-bold text-base hover:brightness-110 disabled:opacity-60 transition-all duration-200 flex items-center justify-center space-x-2"
          >
            {isSubmitting && <Loader2 className="h-5 w-5 animate-spin" />}
            <span>{isSubmitting ? 'Enviando...' : 'Confirmar Pedido'}</span>
          </button>
        </form>
      )}
    </BottomSheet>
  );
};

export default CheckoutModal;
