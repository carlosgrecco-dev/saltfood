import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Coins, LogIn, ChevronRight } from 'lucide-react';
import VincularContaModal from '../components/VincularContaModal';
import { useCustomer } from '../context/CustomerContext';
import { useTenant } from '../context/TenantContext';

const SaltfoodCoinsPage: React.FC = () => {
  const { customer, isLoading, openCustomerAuth } = useCustomer();
  const { slug, empresa } = useTenant();
  const [isVincularContaOpen, setIsVincularContaOpen] = useState(false);

  const saldo = customer?.saldoCoinsPlataforma ?? 0;

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl min-h-[70vh]">
      <div className="flex items-center gap-3 mb-6">
        <Link
          to={`/${slug}`}
          className="text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-full p-2 transition-colors shrink-0"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <Coins className="h-5 w-5 text-amber-600" /> SaltFood Coins
        </h1>
      </div>

      <div className="bg-gradient-to-br from-amber-500 to-yellow-600 rounded-2xl p-5 text-white mb-5">
        <p className="font-bold text-lg mb-1">Uma carteira que vale em toda a rede SaltFood</p>
        <p className="text-sm text-white/90">
          Ganhe coins pedindo em qualquer loja SaltFood participante e use o saldo pra pagar em outra — o saldo é
          seu, não da loja.
        </p>
      </div>

      {!customer && !isLoading && (
        <div className="text-center bg-white border border-gray-100 rounded-2xl p-5 mb-5">
          <p className="text-sm text-gray-600 mb-3">Entre na sua conta pra ver e usar seu saldo de SaltFood Coins.</p>
          <button
            onClick={openCustomerAuth}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:from-orange-600 hover:to-red-600 transition-all"
          >
            <LogIn className="h-4 w-4" /> Entrar / Criar conta
          </button>
        </div>
      )}

      {customer && (
        <>
          <div className="bg-white border border-amber-200 rounded-2xl p-5 mb-5 flex items-center gap-4">
            <div className="h-14 w-14 shrink-0 rounded-full bg-amber-100 flex items-center justify-center">
              <Coins className="h-7 w-7 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-amber-700 font-semibold uppercase tracking-wide">Seu saldo</p>
              <p className="text-3xl font-bold text-amber-800">R$ {saldo.toFixed(2)}</p>
            </div>
          </div>

          {customer.contaPlataformaDetectada && (
            <button
              onClick={() => setIsVincularContaOpen(true)}
              className="flex w-full items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-5 text-left hover:bg-amber-100 transition-colors"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100">
                <Coins className="h-5 w-5 text-amber-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-amber-700 font-medium">Encontramos uma conta SaltFood Coins pra você</p>
                <p className="text-sm font-bold text-amber-800">Vincular e unificar o saldo</p>
              </div>
              <ChevronRight className="h-4 w-4 text-amber-500 shrink-0" />
            </button>
          )}
        </>
      )}

      <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4">
        <p className="text-sm font-bold text-gray-800 mb-1">Como funciona nesta loja</p>
        {empresa.participaSaltfoodCoins ? (
          <p className="text-sm text-gray-600">
            Você ganha <strong>{empresa.saltfoodCoinsPercent}%</strong> em SaltFood Coins sobre o valor de cada
            pedido, creditado assim que ele é entregue — e pode usar seu saldo, ganho em qualquer loja
            participante, como desconto aqui também.
          </p>
        ) : (
          <p className="text-sm text-gray-600">
            Esta loja ainda não participa do SaltFood Coins. Seu saldo continua valendo nas lojas que participam.
          </p>
        )}
      </div>

      <VincularContaModal isOpen={isVincularContaOpen} onClose={() => setIsVincularContaOpen(false)} />
    </div>
  );
};

export default SaltfoodCoinsPage;
