import React from 'react';
import { Store } from 'lucide-react';

const NotFoundPage: React.FC = () => (
  <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-slate-50 px-4 text-center">
    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100">
      <Store className="h-7 w-7 text-indigo-500" />
    </div>
    <h1 className="text-lg font-bold text-slate-800">Página não encontrada</h1>
    <p className="max-w-sm text-sm text-slate-500">
      Cada loja tem seu próprio endereço, no formato <span className="font-mono text-slate-600">/sua-loja</span>.
      Confira o link com o restaurante ou entre em contato para saber o endereço correto.
    </p>
  </div>
);

export default NotFoundPage;
