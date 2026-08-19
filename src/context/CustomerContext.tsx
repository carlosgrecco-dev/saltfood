import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { ClienteAuth, fetchClientePerfil } from '../lib/clientes';
import { getClienteId, saveClienteSession, clearClienteId } from '../lib/clienteSession';
import { Cliente } from '../types/Cliente';
import { useTenant } from './TenantContext';

interface CustomerContextValue {
  customer: Cliente | null;
  isLoading: boolean;
  refreshCustomer: () => Promise<void>;
  setCustomerSession: (cliente: ClienteAuth) => void;
  logoutCustomer: () => void;
  isCustomerAreaOpen: boolean;
  openCustomerArea: () => void;
  closeCustomerArea: () => void;
  isCustomerAuthOpen: boolean;
  openCustomerAuth: () => void;
  closeCustomerAuth: () => void;
}

const CustomerContext = createContext<CustomerContextValue | undefined>(undefined);

export const CustomerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { empresa } = useTenant();
  const [customer, setCustomer] = useState<Cliente | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCustomerAreaOpen, setIsCustomerAreaOpen] = useState(false);
  const [isCustomerAuthOpen, setIsCustomerAuthOpen] = useState(false);

  const refreshCustomer = useCallback(async () => {
    const clienteId = getClienteId(empresa.id);
    if (!clienteId) {
      setCustomer(null);
      setIsLoading(false);
      return;
    }
    try {
      const perfil = await fetchClientePerfil(empresa.id, clienteId);
      setCustomer(perfil);
    } catch {
      clearClienteId(empresa.id);
      setCustomer(null);
    } finally {
      setIsLoading(false);
    }
  }, [empresa.id]);

  useEffect(() => {
    refreshCustomer();
  }, [refreshCustomer]);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { kind?: string; empresaId?: string } | undefined;
      if (detail?.kind === 'cliente' && detail.empresaId === empresa.id) {
        setCustomer(null);
      }
    };
    window.addEventListener('kifood:session-expired', handler);
    return () => window.removeEventListener('kifood:session-expired', handler);
  }, [empresa.id]);

  const setCustomerSession = (cliente: ClienteAuth) => {
    saveClienteSession(empresa.id, { clienteId: cliente.id, token: cliente.token });
    setCustomer(cliente);
  };

  const logoutCustomer = () => {
    clearClienteId(empresa.id);
    setCustomer(null);
  };

  return (
    <CustomerContext.Provider
      value={{
        customer,
        isLoading,
        refreshCustomer,
        setCustomerSession,
        logoutCustomer,
        isCustomerAreaOpen,
        openCustomerArea: () => setIsCustomerAreaOpen(true),
        closeCustomerArea: () => setIsCustomerAreaOpen(false),
        isCustomerAuthOpen,
        openCustomerAuth: () => setIsCustomerAuthOpen(true),
        closeCustomerAuth: () => setIsCustomerAuthOpen(false),
      }}
    >
      {children}
    </CustomerContext.Provider>
  );
};

export const useCustomer = (): CustomerContextValue => {
  const ctx = useContext(CustomerContext);
  if (!ctx) throw new Error('useCustomer deve ser usado dentro de um <CustomerProvider>');
  return ctx;
};
