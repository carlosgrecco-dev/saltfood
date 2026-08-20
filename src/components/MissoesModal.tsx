import React, { useEffect, useState } from 'react';
import { Target, Check, Loader2 } from 'lucide-react';
import BottomSheet from './BottomSheet';
import { useTenant } from '../context/TenantContext';
import { fetchMissoesComoCliente, aceitarMissao } from '../lib/missoes';
import { MissaoComProgresso } from '../types/Missao';

interface MissoesModalProps {
  isOpen: boolean;
  onClose: () => void;
  clienteId: string;
}

const formatDiasRestantes = (expiraEm: string) => {
  const dias = Math.ceil((new Date(expiraEm).getTime() - Date.now()) / 86400000);
  if (dias <= 0) return 'expira hoje';
  if (dias === 1) return 'falta 1 dia';
  return `faltam ${dias} dias`;
};

const MissoesModal: React.FC<MissoesModalProps> = ({ isOpen, onClose, clienteId }) => {
  const { empresa } = useTenant();
  const [missoes, setMissoes] = useState<MissaoComProgresso[]>([]);
  const [loading, setLoading] = useState(true);
  const [aceitandoId, setAceitandoId] = useState<string | null>(null);
  const [erro, setErro] = useState('');

  const load = () => {
    setLoading(true);
    fetchMissoesComoCliente(empresa.id)
      .then(setMissoes)
      .catch(() => setMissoes([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (isOpen) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, empresa.id, clienteId]);

  const handleAceitar = async (missaoId: string) => {
    setErro('');
    setAceitandoId(missaoId);
    try {
      await aceitarMissao(empresa.id, missaoId);
      load();
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não foi possível aceitar a missão.');
    } finally {
      setAceitandoId(null);
    }
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Missões" zIndexClass="z-[60]">
      <div className="p-5 space-y-3">
        {loading ? (
          <p className="text-center text-gray-400 text-sm py-6">Carregando...</p>
        ) : missoes.length === 0 ? (
          <div className="text-center py-10">
            <Target className="h-8 w-8 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">Nenhuma missão disponível no momento.</p>
          </div>
        ) : (
          missoes.map((missao) => {
            const participando = missao.participacaoAtual && !missao.participacaoAtual.concluidaEm && missao.progresso && !missao.progresso.expirada;
            const concluida = missao.participacaoAtual?.concluidaEm != null;
            return (
              <div key={missao.id} className="border border-gray-200 rounded-2xl p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold text-gray-800 text-sm">{missao.titulo}</p>
                    {missao.descricao && <p className="text-xs text-gray-500 mt-0.5">{missao.descricao}</p>}
                    <p className="text-xs text-gray-400 mt-1">
                      {missao.metaPedidos} pedido{missao.metaPedidos > 1 ? 's' : ''} em {missao.periodoDias} dia{missao.periodoDias > 1 ? 's' : ''}
                      {' · '}
                      <span className="text-orange-600 font-semibold">+{missao.recompensaUnidades} unidades</span>
                    </p>
                  </div>
                  {concluida && (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-green-700 bg-green-100 px-2 py-1 rounded-full shrink-0">
                      <Check className="h-3 w-3" /> Concluída
                    </span>
                  )}
                </div>

                {participando && missao.progresso && (
                  <div className="mt-3">
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full bg-orange-500 transition-all"
                        style={{ width: `${Math.min(100, (missao.progresso.pedidosCount / missao.metaPedidos) * 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {missao.progresso.pedidosCount}/{missao.metaPedidos} pedidos · {formatDiasRestantes(missao.progresso.expiraEm)}
                    </p>
                  </div>
                )}

                {!participando && !concluida && (
                  <button
                    onClick={() => handleAceitar(missao.id)}
                    disabled={aceitandoId === missao.id}
                    className="mt-3 w-full flex items-center justify-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white text-sm py-2 rounded-xl disabled:opacity-60"
                  >
                    {aceitandoId === missao.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Target className="h-4 w-4" />}
                    Aceitar missão
                  </button>
                )}
              </div>
            );
          })
        )}
        {erro && <p className="text-sm text-red-600">{erro}</p>}
      </div>
    </BottomSheet>
  );
};

export default MissoesModal;
