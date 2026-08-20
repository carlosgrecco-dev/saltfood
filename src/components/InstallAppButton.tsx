import React from 'react';
import { Download } from 'lucide-react';
import { useInstallPrompt } from '../context/InstallPromptContext';
import { useIsMobile } from '../hooks/useIsMobile';

interface InstallAppButtonProps {
  className?: string;
}

/** Só renderiza algo no mobile, quando o navegador sinalizou que a página é instalável (pra esta
 * loja/contexto específica) e ainda não foi instalada — instalar como app faz sentido em celular,
 * não em desktop. */
const InstallAppButton: React.FC<InstallAppButtonProps> = ({ className }) => {
  const { canInstall, promptInstall } = useInstallPrompt();
  const isMobile = useIsMobile();

  if (!canInstall || !isMobile) return null;

  return (
    <button
      onClick={promptInstall}
      title="Instalar como aplicativo"
      className={
        className ||
        'flex items-center gap-1.5 bg-orange-50 hover:bg-orange-100 text-orange-700 px-2.5 py-1.5 rounded-xl transition-colors text-xs sm:text-sm font-medium'
      }
    >
      <Download className="h-4 w-4" />
      <span className="hidden sm:inline">Instalar app</span>
    </button>
  );
};

export default InstallAppButton;
