import React, { useCallback, useEffect, useState } from 'react';
import { CreditCard, Eye, EyeOff, Save } from 'lucide-react';
import { fetchGatewaysPagamento, updateGatewayPagamento } from '../../lib/gatewaysPagamento';
import { GatewayPagamento } from '../../types/GatewayPagamento';

interface GatewaysTabProps {
  empresaId: string;
}

const GatewaysTab: React.FC<GatewaysTabProps> = ({ empresaId }) => {
  const [gateways, setGateways] = useState<GatewayPagamento[]>([]);
  const [drafts, setDrafts] = useState<Record<string, { chavePublica: string; chaveSecreta: string; webhookSecret: string }>>({});
  const [visibleSecrets, setVisibleSecrets] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await fetchGatewaysPagamento(empresaId);
      setGateways(data);
      setDrafts((prev) => {
        const next = { ...prev };
        for (const gw of data) {
          if (!next[gw.provider]) {
            next[gw.provider] = {
              chavePublica: gw.chavePublica || '',
              chaveSecreta: '',
              webhookSecret: '',
            };
          }
        }
        return next;
      });
    } catch {
      /* silencioso */
    }
  }, [empresaId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleToggleAtivo = async (gw: GatewayPagamento) => {
    setGateways((prev) => prev.map((g) => (g.provider === gw.provider ? { ...g, ativo: !g.ativo } : g)));
    await updateGatewayPagamento(empresaId, gw.provider, { ativo: !gw.ativo });
    load();
  };

  const handleSave = async (gw: GatewayPagamento) => {
    setSaving(gw.provider);
    try {
      const draft = drafts[gw.provider];
      await updateGatewayPagamento(empresaId, gw.provider, {
        ativo: gw.ativo,
        chavePublica: draft?.chavePublica,
        ...(draft?.chaveSecreta ? { chaveSecreta: draft.chaveSecreta } : {}),
        ...(draft?.webhookSecret ? { webhookSecret: draft.webhookSecret } : {}),
      });
      load();
    } finally {
      setSaving(null);
    }
  };

  return (
    <div>
      <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-xl mb-6 text-sm">
        Cadastre aqui as credenciais de cada gateway de pagamento. Ative apenas os que já tiver conta — os
        desativados ficam prontos, só esperando as chaves. Chaves já salvas aparecem mascaradas; para trocar,
        digite uma nova.
      </div>

      <div className="space-y-4">
        {gateways.map((gw) => (
          <div key={gw.provider} className="border border-gray-200 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <CreditCard className="h-5 w-5 text-orange-600" />
                <p className="font-bold text-gray-800">{gw.nomeExibicao}</p>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <span className="text-xs text-gray-500">{gw.ativo ? 'Ativado' : 'Desativado'}</span>
                <input
                  type="checkbox"
                  checked={gw.ativo}
                  onChange={() => handleToggleAtivo(gw)}
                  className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
                />
              </label>
            </div>

            {gw.provider !== 'PIX_MANUAL' ? (
              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Chave pública / Client ID</label>
                  <input
                    value={drafts[gw.provider]?.chavePublica ?? ''}
                    onChange={(e) =>
                      setDrafts((prev) => ({ ...prev, [gw.provider]: { ...prev[gw.provider], chavePublica: e.target.value } }))
                    }
                    placeholder="pk_live_..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Chave secreta / Token {gw.chaveSecreta && <span className="text-gray-400">(já configurada)</span>}
                  </label>
                  <div className="relative">
                    <input
                      type={visibleSecrets[gw.provider] ? 'text' : 'password'}
                      value={drafts[gw.provider]?.chaveSecreta ?? ''}
                      onChange={(e) =>
                        setDrafts((prev) => ({ ...prev, [gw.provider]: { ...prev[gw.provider], chaveSecreta: e.target.value } }))
                      }
                      placeholder={gw.chaveSecreta ? '••••••••' : 'sk_live_...'}
                      className="w-full px-3 py-2 pr-9 border border-gray-300 rounded-lg text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setVisibleSecrets((p) => ({ ...p, [gw.provider]: !p[gw.provider] }))}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {visibleSecrets[gw.provider] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs text-gray-500 mb-1">
                    Webhook secret (opcional) {gw.webhookSecret && <span className="text-gray-400">(já configurada)</span>}
                  </label>
                  <input
                    value={drafts[gw.provider]?.webhookSecret ?? ''}
                    onChange={(e) =>
                      setDrafts((prev) => ({ ...prev, [gw.provider]: { ...prev[gw.provider], webhookSecret: e.target.value } }))
                    }
                    placeholder={gw.webhookSecret ? '••••••••' : ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                Usa a chave PIX combinada diretamente com o cliente no checkout — nenhuma credencial de API necessária.
              </p>
            )}

            {gw.provider !== 'PIX_MANUAL' && (
              <button
                onClick={() => handleSave(gw)}
                disabled={saving === gw.provider}
                className="mt-4 flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white text-sm px-4 py-2 rounded-lg disabled:opacity-60"
              >
                <Save className="h-4 w-4" />
                {saving === gw.provider ? 'Salvando...' : 'Salvar'}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default GatewaysTab;
