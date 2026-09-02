import React, { useCallback, useEffect, useState } from 'react';
import { Webhook, Copy, RefreshCw, Check, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { WebhookResumo, EventoWebhook, EVENTO_WEBHOOK_LABELS } from '../../types/Webhook';
import { fetchWebhook, salvarWebhook, regenerarSecretWebhook } from '../../lib/webhook';

interface WebhookTabProps {
  empresaId: string;
}

const WebhookTab: React.FC<WebhookTabProps> = ({ empresaId }) => {
  const [resumo, setResumo] = useState<WebhookResumo | null>(null);
  const [loading, setLoading] = useState(true);
  const [url, setUrl] = useState('');
  const [eventos, setEventos] = useState<EventoWebhook[]>([]);
  const [ativo, setAtivo] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [regenerando, setRegenerando] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [erro, setErro] = useState('');

  const load = useCallback(async () => {
    try {
      const dados = await fetchWebhook(empresaId);
      setResumo(dados);
      setUrl(dados.config?.url || '');
      setEventos(dados.config?.eventos || []);
      setAtivo(dados.config?.ativo ?? false);
    } catch {
      setResumo(null);
    } finally {
      setLoading(false);
    }
  }, [empresaId]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleEvento = (evento: EventoWebhook) => {
    setEventos((prev) => (prev.includes(evento) ? prev.filter((e) => e !== evento) : [...prev, evento]));
  };

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setSalvando(true);
    try {
      await salvarWebhook(empresaId, { url, eventos, ativo });
      await load();
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não foi possível salvar.');
    } finally {
      setSalvando(false);
    }
  };

  const handleRegenerarSecret = async () => {
    if (!window.confirm('Gerar um novo secret? O antigo deixa de funcionar imediatamente.')) return;
    setRegenerando(true);
    try {
      await regenerarSecretWebhook(empresaId);
      await load();
    } finally {
      setRegenerando(false);
    }
  };

  const handleCopiarSecret = () => {
    if (!resumo?.config?.secret) return;
    navigator.clipboard.writeText(resumo.config.secret);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  if (loading || !resumo) {
    return <p className="text-center text-gray-500 py-8 text-sm">Carregando...</p>;
  }

  return (
    <div>
      <p className="text-sm text-gray-500 mb-5 max-w-xl">
        Notifique um sistema externo quando eventos importantes acontecerem na loja. A gente assina
        cada envio com HMAC-SHA256 (header <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">X-Webhook-Signature</code>)
        usando o secret abaixo, pra você validar que veio mesmo da SaltFood.
      </p>

      <form onSubmit={handleSalvar} className="max-w-xl bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 block">URL de destino</label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://seusistema.com/webhooks/saltfood"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            required
          />
        </div>

        <div>
          <label className="text-xs font-medium text-gray-500 mb-2 block">Eventos</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {resumo.eventosDisponiveis.map((evento) => (
              <label key={evento} className={`flex items-center gap-2 border rounded-lg px-3 py-2 text-sm cursor-pointer ${eventos.includes(evento) ? 'border-orange-300 bg-orange-50/60 text-orange-700' : 'border-gray-200 text-gray-600'}`}>
                <input type="checkbox" checked={eventos.includes(evento)} onChange={() => toggleEvento(evento)} className="text-orange-600 rounded" />
                {EVENTO_WEBHOOK_LABELS[evento]}
              </label>
            ))}
          </div>
        </div>

        <label className="flex items-center gap-2 cursor-pointer w-fit">
          <input type="checkbox" checked={ativo} onChange={(e) => setAtivo(e.target.checked)} className="text-orange-600 rounded" />
          <span className="text-sm text-gray-600">Ativo</span>
        </label>

        {resumo.config?.secret && (
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Secret</label>
            <div className="flex items-center gap-2">
              <input readOnly value={resumo.config.secret} className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-xs font-mono bg-gray-50 min-w-0" />
              <button type="button" onClick={handleCopiarSecret} className="shrink-0 flex items-center gap-1 text-xs border border-gray-300 rounded-lg px-2.5 py-2 text-gray-600 hover:bg-gray-50">
                {copiado ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
              <button type="button" onClick={handleRegenerarSecret} disabled={regenerando} className="shrink-0 flex items-center gap-1 text-xs border border-gray-300 rounded-lg px-2.5 py-2 text-gray-600 hover:bg-gray-50 disabled:opacity-60">
                {regenerando ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>
        )}

        {erro && <p className="text-xs text-red-600">{erro}</p>}

        <button type="submit" disabled={salvando} className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white font-medium px-4 py-2.5 rounded-lg text-sm disabled:opacity-60">
          {salvando ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Salvar
        </button>
      </form>

      {resumo.config && (
        <div className="max-w-xl mt-6">
          <p className="font-bold text-gray-800 flex items-center gap-1.5 mb-3"><Webhook className="h-4 w-4 text-orange-500" /> Últimos disparos</p>
          <div className="space-y-1.5">
            {resumo.logs.map((log) => (
              <div key={log.id} className="flex items-center justify-between gap-2 border border-gray-100 rounded-lg px-3 py-2 text-sm">
                <span className="flex items-center gap-2 text-gray-700">
                  {log.sucesso ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" /> : <XCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />}
                  {EVENTO_WEBHOOK_LABELS[log.evento as EventoWebhook] || log.evento}
                </span>
                <span className="text-xs text-gray-400 shrink-0">{log.statusCode ?? log.erro ?? '—'} · {new Date(log.createdAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            ))}
            {resumo.logs.length === 0 && <p className="text-center text-gray-400 text-sm py-6">Nenhum disparo ainda.</p>}
          </div>
        </div>
      )}
    </div>
  );
};

export default WebhookTab;
