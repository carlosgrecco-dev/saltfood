import React, { useEffect, useState } from 'react';
import { ScrollText, XCircle, Plus, Trash2, Wallet2, UserPlus, UserMinus } from 'lucide-react';
import { LogAtividadeLoja, TIPO_LOG_ATIVIDADE_LABELS, TipoLogAtividadeLoja } from '../../types/LogAtividade';
import { fetchLogsAtividade } from '../../lib/logsAtividade';

interface LogsAtividadeTabProps {
  empresaId: string;
}

const ICONE_POR_TIPO: Record<TipoLogAtividadeLoja, React.ElementType> = {
  PEDIDO_CANCELADO: XCircle,
  PRODUTO_CRIADO: Plus,
  PRODUTO_REMOVIDO: Trash2,
  CONFIG_PAGAMENTO_ALTERADA: Wallet2,
  USUARIO_ADMIN_CRIADO: UserPlus,
  USUARIO_ADMIN_REMOVIDO: UserMinus,
};

const COR_POR_TIPO: Record<TipoLogAtividadeLoja, string> = {
  PEDIDO_CANCELADO: 'bg-red-100 text-red-600',
  PRODUTO_CRIADO: 'bg-emerald-100 text-emerald-600',
  PRODUTO_REMOVIDO: 'bg-red-100 text-red-600',
  CONFIG_PAGAMENTO_ALTERADA: 'bg-blue-100 text-blue-600',
  USUARIO_ADMIN_CRIADO: 'bg-emerald-100 text-emerald-600',
  USUARIO_ADMIN_REMOVIDO: 'bg-red-100 text-red-600',
};

const LogsAtividadeTab: React.FC<LogsAtividadeTabProps> = ({ empresaId }) => {
  const [logs, setLogs] = useState<LogAtividadeLoja[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogsAtividade(empresaId)
      .then(setLogs)
      .catch(() => setLogs([]))
      .finally(() => setLoading(false));
  }, [empresaId]);

  return (
    <div>
      <p className="text-sm text-gray-500 mb-5 max-w-xl">
        Registro das ações mais importantes da loja: pedidos cancelados, produtos criados/removidos,
        mudanças na configuração de pagamento e usuários de equipe criados/removidos.
      </p>

      {loading ? (
        <p className="text-center text-gray-500 py-8 text-sm">Carregando...</p>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => {
            const Icon = ICONE_POR_TIPO[log.tipo];
            return (
              <div key={log.id} className="flex items-center gap-3 border border-gray-200 rounded-xl px-4 py-3">
                <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${COR_POR_TIPO[log.tipo]}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-gray-800">{log.descricao}</p>
                  <p className="text-xs text-gray-400">{TIPO_LOG_ATIVIDADE_LABELS[log.tipo]}{log.ator ? ` · ${log.ator}` : ''}</p>
                </div>
                <span className="text-xs text-gray-400 shrink-0">
                  {new Date(log.createdAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            );
          })}
          {logs.length === 0 && (
            <p className="text-center text-gray-500 py-10 text-sm flex flex-col items-center gap-2">
              <ScrollText className="h-8 w-8 text-gray-300" />
              Nenhuma atividade registrada ainda.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default LogsAtividadeTab;
