import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useTenant } from '../context/TenantContext';
import { maskTelefone } from '../lib/masks';

const TermosPage: React.FC = () => {
  const { slug, empresa } = useTenant();

  const conteudoPadrao = `
Estes Termos de Uso e esta Política de Privacidade regulam o uso da loja online de ${empresa.nome}.

1. Dados coletados
Ao fazer um pedido ou criar uma conta, coletamos nome, telefone, e-mail e endereço de entrega, usados exclusivamente para processar seus pedidos, contato sobre o status da entrega e, se você optar, seu cadastro no programa de fidelidade.

2. Uso dos dados
Seus dados não são vendidos a terceiros. São usados somente para viabilizar o funcionamento do pedido (produção, entrega, cobrança) e comunicação relacionada a ele.

3. Armazenamento e segurança
Os dados são armazenados de forma segura e mantidos pelo tempo necessário para cumprir finalidades legais, fiscais e de atendimento.

4. Seus direitos (LGPD)
Você pode solicitar a qualquer momento a exclusão, correção ou exportação dos seus dados pessoais entrando em contato pelo telefone ${maskTelefone(empresa.telefone)}.

5. Cookies
Este site pode usar armazenamento local do navegador para manter seu carrinho e sessão de login — nenhum dado é compartilhado com redes de publicidade.

6. Pedidos e pagamentos
Os preços e formas de pagamento exibidos no momento da finalização do pedido são os válidos para aquela compra. ${empresa.nome} pode entrar em contato para confirmar detalhes do pedido antes da entrega.

7. Contato
Dúvidas sobre estes termos podem ser esclarecidas pelo telefone ${maskTelefone(empresa.telefone)}.
  `.trim();

  const conteudo = empresa.termosConteudo || conteudoPadrao;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <div className="max-w-2xl mx-auto p-5 sm:p-8 w-full flex-1">
        <Link
          to={`/${slug}`}
          className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 mb-6"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar para a loja
        </Link>

        <div className="bg-white border border-gray-100 rounded-3xl shadow-sm p-6 sm:p-8">
          <div className="flex items-center gap-2 mb-6">
            <ShieldCheck className="h-5 w-5 text-[var(--cor-primaria)]" />
            <h1 className="text-lg font-bold text-gray-800">Termos de Uso e Política de Privacidade</h1>
          </div>

          <div className="prose prose-sm max-w-none text-gray-600 whitespace-pre-line leading-relaxed">
            {conteudo}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default TermosPage;
