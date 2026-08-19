import React from 'react';
import { Download } from 'lucide-react';
import { useInstallPrompt } from '../context/InstallPromptContext';

interface InstallAppButtonProps {
  className?: string;
}

/** Só renderiza algo quando o navegador sinalizou que a página é instalável e ainda não foi instalada. */
const InstallAppButton: React.FC<InstallAppButtonProps> = ({ className }) => {
  const { canInstall, promptInstall } = useInstallPrompt();

  if (!canInstall) return null;

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
