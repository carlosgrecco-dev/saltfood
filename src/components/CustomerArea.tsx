import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, LogOut, Package, MapPin, Ticket, Gift, Copy, Share2, Check, Heart, Wallet, Coins, Target, LifeBuoy, Award } from 'lucide-react';
import BottomSheet from './BottomSheet';
import LoyaltyCard from './LoyaltyCard';
import EnderecosSalvosModal from './EnderecosSalvosModal';
import CuponsDisponiveisModal from './CuponsDisponiveisModal';
import FavoritosModal from './FavoritosModal';
import MissoesModal from './MissoesModal';
import SuporteModal from './SuporteModal';
import VincularContaModal from './VincularContaModal';
import { useCustomer } from '../context/CustomerContext';
import { useTenant } from '../context/TenantContext';
import { indicadorNivel, NIVEL_INDICADOR_LABELS } from '../types/Cliente';

interface CustomerAreaProps {
  isOpen: boolean;
  onClose: () => void;
}

const CustomerArea: React.FC<CustomerAreaProps> = ({ isOpen, onClose }) => {
  const { customer, logoutCustomer } = useCustomer();
  const { slug, empresa } = useTenant();
  const navigate = useNavigate();
  const [isEnderecosOpen, setIsEnderecosOpen] = useState(false);
  const [isCuponsOpen, setIsCuponsOpen] = useState(false);
  const [isFavoritosOpen, setIsFavoritosOpen] = useState(false);
  const [isMissoesOpen, setIsMissoesOpen] = useState(false);
  const [isSuporteOpen, setIsSuporteOpen] = useState(false);
  const [isVincularContaOpen, setIsVincularContaOpen] = useState(false);
  const [copiado, setCopiado] = useState(false);

  const handleLogout = () => {
    logoutCustomer();
    onClose();
  };

  const handleGoToOrders = () => {
    onClose();
    navigate(`/${slug}/meus-pedidos`);
  };

  const handleShareIndicacao = async () => {
    if (!customer?.codigoIndicacao) return;
    const link = `${window.location.origin}/${slug}?ref=${customer.codigoIndicacao}`;
    const texto = `Peça na ${empresa.nome} pelo meu link e a gente ganha fidelidade os dois: ${link}`;
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ title: empresa.nome, text: texto, url: link });
      } catch {
        /* usuário cancelou o compartilhamento — sem erro */
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(link);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      /* clipboard indisponível — sem erro, o código já fica visível na tela */
    }
  };

  if (!customer) return null;

  return (
    <>
      <BottomSheet isOpen={isOpen} onClose={onClose} title="Minha Área">
        <div className="p-5 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-gray-800">{customer.nome}</p>
              <p className="text-sm text-gray-500">{customer.telefone || customer.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-600 bg-gray-100 hover:bg-red-50 px-3 py-2 rounded-xl transition-colors"
            >
              <LogOut className="h-4 w-4" /> Sair
            </button>
          </div>

          <LoyaltyCard customer={customer} />

          {customer.saldoCashback > 0 && (
            <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 rounded-2xl p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                <Wallet className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-emerald-700 font-medium">Seu saldo de cashback</p>
                <p className="text-lg font-bold text-emerald-800">R$ {customer.saldoCashback.toFixed(2)}</p>
              </div>
            </div>
          )}

          {customer.contaPlataformaDetectada && (
            <button
              onClick={() => setIsVincularContaOpen(true)}
              className="flex w-full items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4 text-left hover:bg-amber-100 transition-colors"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100">
                <Coins className="h-5 w-5 text-amber-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-amber-700 font-medium">Encontramos uma conta SaltFood Coins pra você</p>
                <p className="text-sm font-bold text-amber-800">Vincular e usar em outras lojas</p>
              </div>
              <ChevronRight className="h-4 w-4 text-amber-500 shrink-0" />
            </button>
          )}

          {customer.codigoIndicacao && (
            <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl p-4 text-white">
              <p className="flex items-center gap-1.5 font-bold text-sm mb-1">
                <Gift className="h-4 w-4" /> Indique e ganhe
              </p>
              <p className="text-xs text-white/85 mb-3">
                Compartilhe seu código — quando um amigo pedir pela primeira vez, vocês dois ganham fidelidade.
              </p>
              {empresa.habilitarIndicacaoAvancada && (
                <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-white/90 mb-2">
                  <Award className="h-3.5 w-3.5" />
                  Nível {NIVEL_INDICADOR_LABELS[indicadorNivel(customer).nivel]}
                  {indicadorNivel(customer).faltamProximoMarco != null && (
                    <span className="font-normal normal-case text-white/70">
                      · faltam {indicadorNivel(customer).faltamProximoMarco} pro próximo nível
                    </span>
                  )}
                </div>
              )}
              <div className="flex items-center gap-2">
                <span className="flex-1 bg-white/15 border border-white/25 rounded-xl px-3 py-2 font-mono font-bold tracking-widest text-center text-sm">
                  {customer.codigoIndicacao}
                </span>
                <button
                  onClick={handleShareIndicacao}
                  className="shrink-0 bg-white text-orange-600 rounded-xl p-2.5 hover:bg-orange-50 transition-colors"
                  aria-label="Compartilhar código de indicação"
                >
                  {copiado ? <Check className="h-4 w-4" /> : typeof navigator.share === 'function' ? <Share2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <button
              onClick={handleGoToOrders}
              className="w-full flex items-center justify-between bg-gray-50 hover:bg-gray-100 border border-gray-100 rounded-2xl p-4 transition-colors"
            >
              <span className="flex items-center gap-2 font-bold text-gray-800">
                <Package className="h-4 w-4 text-[var(--cor-primaria)]" /> Meus Pedidos
              </span>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </button>

            <button
              onClick={() => setIsEnderecosOpen(true)}
              className="w-full flex items-center justify-between bg-gray-50 hover:bg-gray-100 border border-gray-100 rounded-2xl p-4 transition-colors"
            >
              <span className="flex items-center gap-2 font-bold text-gray-800">
                <MapPin className="h-4 w-4 text-[var(--cor-primaria)]" /> Meus Endereços
              </span>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </button>

            <button
              onClick={() => setIsCuponsOpen(true)}
              className="w-full flex items-center justify-between bg-gray-50 hover:bg-gray-100 border border-gray-100 rounded-2xl p-4 transition-colors"
            >
              <span className="flex items-center gap-2 font-bold text-gray-800">
                <Ticket className="h-4 w-4 text-[var(--cor-primaria)]" /> Cupons Disponíveis
              </span>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </button>

            {empresa.habilitarFavoritos && (
              <button
                onClick={() => setIsFavoritosOpen(true)}
                className="w-full flex items-center justify-between bg-gray-50 hover:bg-gray-100 border border-gray-100 rounded-2xl p-4 transition-colors"
              >
                <span className="flex items-center gap-2 font-bold text-gray-800">
                  <Heart className="h-4 w-4 text-[var(--cor-primaria)]" /> Meus Favoritos
                </span>
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </button>
            )}

            {empresa.habilitarMissoes && (
              <button
                onClick={() => setIsMissoesOpen(true)}
                className="w-full flex items-center justify-between bg-gray-50 hover:bg-gray-100 border border-gray-100 rounded-2xl p-4 transition-colors"
              >
                <span className="flex items-center gap-2 font-bold text-gray-800">
                  <Target className="h-4 w-4 text-[var(--cor-primaria)]" /> Missões
                </span>
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </button>
            )}

            {empresa.habilitarCentralSuporte && (
              <button
                onClick={() => setIsSuporteOpen(true)}
                className="w-full flex items-center justify-between bg-gray-50 hover:bg-gray-100 border border-gray-100 rounded-2xl p-4 transition-colors"
              >
                <span className="flex items-center gap-2 font-bold text-gray-800">
                  <LifeBuoy className="h-4 w-4 text-[var(--cor-primaria)]" /> Central de Suporte
                </span>
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </button>
            )}
          </div>
        </div>
      </BottomSheet>

      <EnderecosSalvosModal isOpen={isEnderecosOpen} onClose={() => setIsEnderecosOpen(false)} />
      <CuponsDisponiveisModal isOpen={isCuponsOpen} onClose={() => setIsCuponsOpen(false)} />
      <FavoritosModal isOpen={isFavoritosOpen} onClose={() => setIsFavoritosOpen(false)} />
      <MissoesModal isOpen={isMissoesOpen} onClose={() => setIsMissoesOpen(false)} clienteId={customer.id} />
      <SuporteModal isOpen={isSuporteOpen} onClose={() => setIsSuporteOpen(false)} clienteId={customer.id} />
      <VincularContaModal isOpen={isVincularContaOpen} onClose={() => setIsVincularContaOpen(false)} />
    </>
  );
};

export default CustomerArea;
