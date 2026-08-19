import { Link } from 'react-router-dom';
import { MapPin, Phone, Clock, Instagram, Facebook, Store } from 'lucide-react';
import { useTenant } from '../context/TenantContext';
import { maskTelefone } from '../lib/masks';

const Footer = () => {
  const { slug, empresa } = useTenant();
  const temContato = empresa.telefone || empresa.endereco || empresa.horarioFuncionamento;
  const temRedesSociais = empresa.instagramUrl || empresa.facebookUrl;

  return (
    <footer className="bg-gray-800 text-white py-10 mt-6">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Logo e descrição */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              {empresa.logoUrl ? (
                <img src={empresa.logoUrl} alt={`Logo ${empresa.nome}`} className="h-12 w-12 rounded-full object-cover" />
              ) : (
                <div className="h-12 w-12 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                  <Store className="h-6 w-6 text-[var(--cor-primaria)]" />
                </div>
              )}
              <div>
                <h3 className="text-xl font-bold">{empresa.nome}</h3>
                {empresa.descricao && <p className="text-[var(--cor-primaria)] text-sm">{empresa.descricao}</p>}
              </div>
            </div>
            {empresa.sobre && <p className="text-gray-300 leading-relaxed">{empresa.sobre}</p>}
          </div>

          {/* Contato */}
          {temContato && (
            <div className="space-y-4">
              <h4 className="text-lg font-bold text-[var(--cor-primaria)]">Contato</h4>
              <div className="space-y-3">
                {empresa.telefone && (
                  <div className="flex items-center space-x-3">
                    <Phone className="h-5 w-5 text-[var(--cor-primaria)] shrink-0" />
                    <span>{maskTelefone(empresa.telefone)}</span>
                  </div>
                )}
                {empresa.endereco && (
                  <div className="flex items-center space-x-3">
                    <MapPin className="h-5 w-5 text-[var(--cor-primaria)] shrink-0" />
                    <span>{empresa.endereco}</span>
                  </div>
                )}
                {empresa.horarioFuncionamento && (
                  <div className="flex items-center space-x-3">
                    <Clock className="h-5 w-5 text-[var(--cor-primaria)] shrink-0" />
                    <span>{empresa.horarioFuncionamento}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Redes sociais */}
          {temRedesSociais && (
            <div className="space-y-4">
              <h4 className="text-lg font-bold text-[var(--cor-primaria)]">Redes Sociais</h4>
              <div className="flex space-x-4">
                {empresa.instagramUrl && (
                  <a
                    href={empresa.instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-gradient-to-r from-pink-500 to-purple-600 p-3 rounded-full hover:scale-110 transition-transform duration-200"
                  >
                    <Instagram className="h-5 w-5" />
                  </a>
                )}
                {empresa.facebookUrl && (
                  <a
                    href={empresa.facebookUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-blue-600 p-3 rounded-full hover:scale-110 transition-transform duration-200"
                  >
                    <Facebook className="h-5 w-5" />
                  </a>
                )}
              </div>
              <p className="text-sm text-gray-400">
                Siga-nos nas redes sociais para acompanhar novidades e promoções!
              </p>
            </div>
          )}
        </div>

        <div className="border-t border-gray-700 mt-8 pt-8 text-center">
          <p className="text-gray-400">
            © {new Date().getFullYear()} {empresa.nome}. Todos os direitos reservados. Produzido Por:{' '}
            <a
              href="https://sigmasolucoesdigitais.com.br/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--cor-primaria)] hover:opacity-80 transition-opacity duration-200"
            >
              www.sigmasolucoesdigitais.com.br
            </a>
          </p>
          <p className="mt-2 space-x-3">
            <Link to={`/${slug}/termos`} className="text-gray-500 hover:text-gray-300 transition-colors text-xs">
              Termos de Uso e Privacidade
            </Link>
            <Link to={`/${slug}/admin`} className="text-gray-500 hover:text-gray-300 transition-colors text-xs">
              Acesso administrativo
            </Link>
            <Link to={`/${slug}/motoboy`} className="text-gray-500 hover:text-gray-300 transition-colors text-xs">
              Área do motoboy
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
