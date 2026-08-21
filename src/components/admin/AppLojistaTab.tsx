import React from 'react';
import { Smartphone, Download, ShieldAlert, LogIn, Printer, Bell } from 'lucide-react';

const APK_URL = '/downloads/saltfood-pedidos.apk';
const APP_VERSION = '1.0.0';

const AppLojistaTab: React.FC = () => {
  return (
    <div className="space-y-6 max-w-2xl">
      <section>
        <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
          <Smartphone className="h-4 w-4 text-orange-600" /> App SaltFood Pedidos
        </h3>
        <div className="bg-gray-50 p-5 rounded-2xl">
          <p className="text-sm text-gray-600 mb-4">
            Instale o app no celular da loja pra receber os pedidos em tempo real, com aviso sonoro, e imprimir a
            comanda direto na impressora térmica. É o mesmo app pra todas as lojas da plataforma — depois de entrar
            com o usuário e senha do seu admin, ele já carrega o nome e o logo da sua loja automaticamente.
          </p>
          <a
            href={APK_URL}
            download
            className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold px-5 py-3 rounded-xl transition-colors"
          >
            <Download className="h-4 w-4" /> Baixar app (Android) — v{APP_VERSION}
          </a>
          <p className="text-xs text-gray-400 mt-2">Arquivo .apk, cerca de 55 MB. Só funciona em aparelhos Android.</p>
        </div>
      </section>

      <section>
        <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-orange-600" /> Como instalar
        </h3>
        <div className="bg-gray-50 p-5 rounded-2xl">
          <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside">
            <li>Toque no botão acima pra baixar o arquivo pelo navegador do celular.</li>
            <li>
              Abra o arquivo baixado. Como o app não vem da Play Store, o Android vai pedir permissão pra "instalar
              apps de fontes desconhecidas" — autorize só pra este arquivo.
            </li>
            <li>Confirme a instalação e abra o app.</li>
          </ol>
        </div>
      </section>

      <section>
        <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
          <LogIn className="h-4 w-4 text-orange-600" /> Depois de instalado
        </h3>
        <div className="bg-gray-50 p-5 rounded-2xl space-y-3">
          <p className="text-sm text-gray-600">Entre com o mesmo usuário e senha que você usa aqui no admin da loja.</p>
          <div className="flex items-start gap-2.5 text-sm text-gray-600">
            <Bell className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" />
            <span>Deixe o app aberto no celular da loja — ele avisa na hora que um pedido novo chega.</span>
          </div>
          <div className="flex items-start gap-2.5 text-sm text-gray-600">
            <Printer className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" />
            <span>Conecte a impressora térmica Bluetooth nas configurações do app pra imprimir a comanda automaticamente.</span>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AppLojistaTab;
