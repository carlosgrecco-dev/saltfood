import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Plus, Trash2, ArrowUp, ArrowDown, Save } from 'lucide-react';
import SuperAdminNav from '../components/superadmin/SuperAdminNav';
import { getSuperAdminSession, signOutSuperAdmin } from '../lib/superAdminAuth';
import { fetchSiteBlocos, createSiteBloco, updateSiteBloco, setSiteBlocoStatus, deleteSiteBloco } from '../lib/siteBlocos';
import { CTA_ABRIR_CONTATO, ItemListaIcones, PaginaSite, SiteBloco, TipoBlocoSite } from '../types/SiteBloco';
import { NOMES_ICONES_SITE, getIconeSite } from '../data/iconesSite';
import { useSuperAdminManifest } from '../hooks/useSuperAdminManifest';

const PAGINAS: { valor: PaginaSite; label: string }[] = [
  { valor: 'LANDING', label: 'Landing' },
  { valor: 'PARCEIRO', label: 'Parceiro' },
  { valor: 'PLANOS', label: 'Planos' },
  { valor: 'RECURSOS', label: 'Recursos' },
  { valor: 'POLITICA_PRIVACIDADE', label: 'Política de Privacidade' },
];

/** Slots fixos que cada página realmente lê — nunca uma chave digitável livremente, porque só
 * tem efeito visual se o front souber ler aquela chave (ver SiteBloco no schema). */
const BLOCOS_ESPERADOS: Record<PaginaSite, { chave: string; tipo: TipoBlocoSite; label: string }[]> = {
  LANDING: [
    { chave: 'hero', tipo: 'HERO', label: 'Hero (topo da página)' },
    { chave: 'features', tipo: 'LISTA_ICONES', label: 'Diferenciais' },
    { chave: 'cta-rodape', tipo: 'CTA_BANNER', label: 'Banner de CTA (rodapé)' },
  ],
  PARCEIRO: [
    { chave: 'hero', tipo: 'HERO', label: 'Hero (topo da página)' },
  ],
  PLANOS: [
    { chave: 'hero', tipo: 'HERO', label: 'Hero (topo da página)' },
    { chave: 'vantagens', tipo: 'LISTA_ICONES', label: 'Vantagens' },
    { chave: 'cta-rodape', tipo: 'CTA_BANNER', label: 'Banner de CTA (rodapé)' },
  ],
  RECURSOS: [
    { chave: 'hero', tipo: 'HERO', label: 'Hero (topo da página)' },
    { chave: 'cta-cadastro', tipo: 'CTA_BANNER', label: 'Banner de CTA (logo após o hero)' },
    { chave: 'cta-rodape', tipo: 'CTA_BANNER', label: 'Banner de CTA (rodapé, "ficou com dúvida")' },
  ],
  POLITICA_PRIVACIDADE: [
    { chave: 'cta-rodape', tipo: 'CTA_BANNER', label: 'Banner de CTA (rodapé)' },
  ],
};

interface FormState {
  eyebrow: string;
  titulo: string;
  subtitulo: string;
  icone: string;
  texto: string;
  textoBotao: string;
  linkModo: 'contato' | 'pagina';
  linkValor: string;
  itens: ItemListaIcones[];
}

const formVazio = (): FormState => ({
  eyebrow: '', titulo: '', subtitulo: '', icone: 'Store', texto: '', textoBotao: '',
  linkModo: 'pagina', linkValor: '/parceiro', itens: [],
});

const formDoBloco = (bloco: SiteBloco | undefined): FormState => {
  if (!bloco) return formVazio();
  return {
    eyebrow: bloco.eyebrow || '',
    titulo: bloco.titulo || '',
    subtitulo: bloco.subtitulo || '',
    icone: bloco.icone || 'Store',
    texto: bloco.texto || '',
    textoBotao: bloco.textoBotao || '',
    linkModo: bloco.linkBotao === CTA_ABRIR_CONTATO ? 'contato' : 'pagina',
    linkValor: bloco.linkBotao && bloco.linkBotao !== CTA_ABRIR_CONTATO ? bloco.linkBotao : '/parceiro',
    itens: bloco.itens || [],
  };
};

interface BlocoCardProps {
  pagina: PaginaSite;
  chave: string;
  tipo: TipoBlocoSite;
  label: string;
  existente: SiteBloco | undefined;
  onSaved: (bloco: SiteBloco | null) => void;
}

const BlocoCard: React.FC<BlocoCardProps> = ({ pagina, chave, tipo, label, existente, onSaved }) => {
  const [form, setForm] = useState<FormState>(() => formDoBloco(existente));
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  const handleSalvar = async () => {
    setErro('');
    setSalvando(true);
    try {
      const payload = {
        pagina, chave, tipo,
        eyebrow: tipo === 'HERO' ? (form.eyebrow || null) : undefined,
        titulo: tipo !== 'LISTA_ICONES' ? form.titulo : undefined,
        subtitulo: tipo === 'HERO' ? form.subtitulo : undefined,
        icone: tipo === 'CTA_BANNER' ? form.icone : undefined,
        texto: tipo === 'CTA_BANNER' ? form.texto : undefined,
        textoBotao: tipo === 'CTA_BANNER' ? form.textoBotao : undefined,
        linkBotao: tipo === 'CTA_BANNER' ? (form.linkModo === 'contato' ? CTA_ABRIR_CONTATO : form.linkValor) : undefined,
        itens: tipo === 'LISTA_ICONES' ? form.itens : undefined,
      };
      const salvo = existente ? await updateSiteBloco(existente.id, payload) : await createSiteBloco(payload);
      onSaved(salvo);
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao salvar bloco');
    } finally {
      setSalvando(false);
    }
  };

  const handleStatus = async () => {
    if (!existente) return;
    try {
      const atualizado = await setSiteBlocoStatus(existente.id, !existente.ativo);
      onSaved(atualizado);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Não foi possível atualizar o status.');
    }
  };

  const handleRemover = async () => {
    if (!existente) return;
    if (!window.confirm(`Remover o bloco "${label}"? A página volta a mostrar o texto padrão.`)) return;
    try {
      await deleteSiteBloco(existente.id);
      onSaved(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Não foi possível remover o bloco.');
    }
  };

  const atualizarItem = (index: number, patch: Partial<ItemListaIcones>) => {
    setForm((prev) => ({ ...prev, itens: prev.itens.map((it, i) => (i === index ? { ...it, ...patch } : it)) }));
  };

  const moverItem = (index: number, direcao: -1 | 1) => {
    setForm((prev) => {
      const alvo = index + direcao;
      if (alvo < 0 || alvo >= prev.itens.length) return prev;
      const itens = [...prev.itens];
      [itens[index], itens[alvo]] = [itens[alvo], itens[index]];
      return { ...prev, itens };
    });
  };

  const removerItem = (index: number) => {
    setForm((prev) => ({ ...prev, itens: prev.itens.filter((_, i) => i !== index) }));
  };

  const adicionarItem = () => {
    setForm((prev) => ({ ...prev, itens: [...prev.itens, { icone: 'Store', titulo: '', texto: '' }] }));
  };

  return (
    <div className="border border-gray-200 rounded-2xl p-4">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div>
          <p className="font-bold text-gray-800 text-sm">{label}</p>
          <p className="text-xs text-gray-400">chave: {chave} · tipo: {tipo}</p>
        </div>
        <div className="flex items-center gap-2">
          {existente ? (
            <>
              <button
                onClick={handleStatus}
                className={`px-2.5 py-1 rounded-full text-xs font-medium ${existente.ativo ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-600'}`}
              >
                {existente.ativo ? 'Ativo' : 'Inativo'}
              </button>
              <button onClick={handleRemover} className="text-red-400 hover:text-red-600 p-1.5" title="Remover bloco">
                <Trash2 className="h-4 w-4" />
              </button>
            </>
          ) : (
            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">Ainda não criado</span>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {tipo === 'HERO' && (
          <>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Eyebrow (opcional)</label>
              <input
                value={form.eyebrow}
                onChange={(e) => setForm((p) => ({ ...p, eyebrow: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Título</label>
              <input
                value={form.titulo}
                onChange={(e) => setForm((p) => ({ ...p, titulo: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Subtítulo</label>
              <textarea
                value={form.subtitulo}
                onChange={(e) => setForm((p) => ({ ...p, subtitulo: e.target.value }))}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none"
              />
            </div>
          </>
        )}

        {tipo === 'CTA_BANNER' && (
          <>
            <div className="flex gap-3">
              <div className="w-32 shrink-0">
                <label className="block text-xs font-medium text-gray-600 mb-1">Ícone</label>
                <select
                  value={form.icone}
                  onChange={(e) => setForm((p) => ({ ...p, icone: e.target.value }))}
                  className="w-full px-2 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                >
                  {NOMES_ICONES_SITE.map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div className="flex items-end pb-2">
                {React.createElement(getIconeSite(form.icone), { className: 'h-5 w-5 text-orange-600' })}
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-600 mb-1">Título</label>
                <input
                  value={form.titulo}
                  onChange={(e) => setForm((p) => ({ ...p, titulo: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Texto</label>
              <textarea
                value={form.texto}
                onChange={(e) => setForm((p) => ({ ...p, texto: e.target.value }))}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none"
              />
            </div>
            <div className="flex gap-3 flex-wrap">
              <div className="flex-1 min-w-[180px]">
                <label className="block text-xs font-medium text-gray-600 mb-1">Texto do botão</label>
                <input
                  value={form.textoBotao}
                  onChange={(e) => setForm((p) => ({ ...p, textoBotao: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div className="flex-1 min-w-[220px]">
                <label className="block text-xs font-medium text-gray-600 mb-1">Ao clicar no botão</label>
                <div className="flex gap-2">
                  <select
                    value={form.linkModo}
                    onChange={(e) => setForm((p) => ({ ...p, linkModo: e.target.value as 'contato' | 'pagina' }))}
                    className="px-2 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                  >
                    <option value="pagina">Ir para uma página</option>
                    <option value="contato">Abrir formulário de contato</option>
                  </select>
                  {form.linkModo === 'pagina' && (
                    <input
                      value={form.linkValor}
                      onChange={(e) => setForm((p) => ({ ...p, linkValor: e.target.value }))}
                      placeholder="/parceiro"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {tipo === 'LISTA_ICONES' && (
          <div className="space-y-2">
            {form.itens.map((item, i) => (
              <div key={i} className="flex flex-wrap items-start gap-2 border border-gray-100 rounded-xl p-3">
                <select
                  value={item.icone}
                  onChange={(e) => atualizarItem(i, { icone: e.target.value })}
                  className="px-2 py-2 border border-gray-300 rounded-lg text-sm bg-white w-28 shrink-0"
                >
                  {NOMES_ICONES_SITE.map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
                <input
                  value={item.titulo}
                  onChange={(e) => atualizarItem(i, { titulo: e.target.value })}
                  placeholder="Título"
                  className="flex-1 min-w-[140px] px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
                <textarea
                  value={item.texto}
                  onChange={(e) => atualizarItem(i, { texto: e.target.value })}
                  placeholder="Texto"
                  rows={1}
                  className="flex-1 min-w-[200px] px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none"
                />
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => moverItem(i, -1)} disabled={i === 0} className="p-1.5 text-gray-400 hover:text-gray-700 disabled:opacity-30">
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => moverItem(i, 1)} disabled={i === form.itens.length - 1} className="p-1.5 text-gray-400 hover:text-gray-700 disabled:opacity-30">
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => removerItem(i)} className="p-1.5 text-red-400 hover:text-red-600">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
            <button
              onClick={adicionarItem}
              className="flex items-center gap-1.5 text-xs text-orange-600 hover:text-orange-700 font-medium px-3 py-2 border border-dashed border-orange-300 rounded-lg"
            >
              <Plus className="h-3.5 w-3.5" /> Adicionar item
            </button>
          </div>
        )}

        {erro && <p className="text-sm text-red-600">{erro}</p>}

        <button
          onClick={handleSalvar}
          disabled={salvando}
          className="flex items-center gap-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold px-3 py-2 rounded-lg disabled:opacity-60"
        >
          <Save className="h-3.5 w-3.5" /> {salvando ? 'Salvando...' : 'Salvar'}
        </button>
      </div>
    </div>
  );
};

const SuperAdminSitePage: React.FC = () => {
  useSuperAdminManifest();
  const navigate = useNavigate();
  const [authorized] = useState(() => !!getSuperAdminSession());

  useEffect(() => {
    const handler = (e: Event) => {
      if ((e as CustomEvent).detail?.kind !== 'superadmin') return;
      signOutSuperAdmin();
      navigate('/super-admin', { replace: true });
    };
    window.addEventListener('kifood:session-expired', handler);
    return () => window.removeEventListener('kifood:session-expired', handler);
  }, [navigate]);

  useEffect(() => {
    if (!authorized) navigate('/super-admin', { replace: true });
  }, [authorized, navigate]);

  const [paginaAtiva, setPaginaAtiva] = useState<PaginaSite>('LANDING');
  const [blocosPorChave, setBlocosPorChave] = useState<Record<string, SiteBloco>>({});
  const [loading, setLoading] = useState(true);
  const [navOpen, setNavOpen] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const blocos = await fetchSiteBlocos(paginaAtiva);
      setBlocosPorChave(Object.fromEntries(blocos.map((b) => [b.chave, b])));
    } catch {
      /* silencioso */
    } finally {
      setLoading(false);
    }
  }, [paginaAtiva]);

  useEffect(() => {
    if (authorized) load();
  }, [authorized, load]);

  if (!authorized) return null;

  const handleSaved = (chave: string, bloco: SiteBloco | null) => {
    setBlocosPorChave((prev) => {
      const next = { ...prev };
      if (bloco) next[chave] = bloco;
      else delete next[chave];
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className={`transition-[margin] duration-300 ease-in-out ml-0 ${navOpen ? 'sm:ml-72' : 'sm:ml-16'}`}>
        <div className="border-b border-gray-200 bg-white">
          <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
            <button
              onClick={() => navigate('/super-admin/empresas')}
              className="mb-3 inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" /> Voltar
            </button>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 shrink-0 rounded-xl bg-black p-1.5">
                  <img src="/logo.png" alt="SaltFood" className="h-full w-full rounded-md" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-orange-500">Super Admin</p>
                  <h1 className="text-xl font-bold text-gray-900">Conteúdo do site público</h1>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { signOutSuperAdmin(); navigate('/super-admin', { replace: true }); }}
                  className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-semibold text-gray-500 hover:bg-gray-100 transition-colors"
                >
                  Sair
                </button>
                <SuperAdminNav onOpenChange={setNavOpen} />
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <div className="flex flex-wrap gap-2 mb-5">
              {PAGINAS.map((p) => (
                <button
                  key={p.valor}
                  onClick={() => setPaginaAtiva(p.valor)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    paginaAtiva === p.valor ? 'bg-orange-600 text-white shadow' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-orange-500" /></div>
            ) : (
              <div className="space-y-4">
                {BLOCOS_ESPERADOS[paginaAtiva].map((slot) => (
                  <BlocoCard
                    key={`${paginaAtiva}-${slot.chave}`}
                    pagina={paginaAtiva}
                    chave={slot.chave}
                    tipo={slot.tipo}
                    label={slot.label}
                    existente={blocosPorChave[slot.chave]}
                    onSaved={(bloco) => handleSaved(slot.chave, bloco)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminSitePage;
