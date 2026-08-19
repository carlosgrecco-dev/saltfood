import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, LogOut, Package, MapPin, Ticket } from 'lucide-react';
import BottomSheet from './BottomSheet';
import LoyaltyCard from './LoyaltyCard';
import EnderecosSalvosModal from './EnderecosSalvosModal';
import CuponsDisponiveisModal from './CuponsDisponiveisModal';
import { useCustomer } from '../context/CustomerContext';
import { useTenant } from '../context/TenantContext';

interface CustomerAreaProps {
  isOpen: boolean;
  onClose: () => void;
}

const CustomerArea: React.FC<CustomerAreaProps> = ({ isOpen, onClose }) => {
  const { customer, logoutCustomer } = useCustomer();
  const { slug } = useTenant();
  const navigate = useNavigate();
  const [isEnderecosOpen, setIsEnderecosOpen] = useState(false);
  const [isCuponsOpen, setIsCuponsOpen] = useState(false);

  const handleLogout = () => {
    logoutCustomer();
    onClose();
  };

  const handleGoToOrders = () => {
    onClose();
    navigate(`/${slug}/meus-pedidos`);
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
          </div>
        </div>
      </BottomSheet>

      <EnderecosSalvosModal isOpen={isEnderecosOpen} onClose={() => setIsEnderecosOpen(false)} />
      <CuponsDisponiveisModal isOpen={isCuponsOpen} onClose={() => setIsCuponsOpen(false)} />
    </>
  );
};

export default CustomerArea;
