import React, { useCallback, useEffect, useState } from 'react';
import { Save, Palette, Image as ImageIcon, LayoutTemplate, Plus, Trash2, Pencil, X, ShieldCheck, Star } from 'lucide-react';
import { fetchEmpresaById, updateAparencia } from '../../lib/empresas';
import { fetchHeroSlides, createHeroSlide, updateHeroSlide, setHeroSlideStatus, deleteHeroSlide } from '../../lib/heroSlides';
import { AparenciaInput } from '../../types/Empresa';
import { HeroSlide } from '../../types/HeroSlide';
import FotoInput from './FotoInput';

interface AparenciaTabProps {
  empresaId: string;
}

const emptyForm: AparenciaInput = {
  corPrimaria: '#f97316',
  corSecundaria: '#dc2626',
  logoUrl: '',
  faviconUrl: '',
  heroUsarCarrossel: false,
  heroTitulo: '',
  heroSubtitulo: '',
  heroBadgeLabel: '',
  heroImagemUrl: '',
  heroLinkUrl: '',
  termosConteudo: '',
  googleBusinessReviewUrl: '',
};

const emptySlideForm = { imagemUrl: '', titulo: '', subtitulo: '', badgeLabel: '', linkUrl: '' };

const AparenciaTab: React.FC<AparenciaTabProps> = ({ empresaId }) => {
  const [form, setForm] = useState<AparenciaInput>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [autoSalvando, setAutoSalvando] = useState<'logo' | 'favicon' | null>(null);
  const [autoSalvoMsg, setAutoSalvoMsg] = useState<'logo' | 'favicon' | null>(null);
  const [autoSalvoErro, setAutoSalvoErro] = useState('');

  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [slideForm, setSlideForm] = useState(emptySlideForm);
  const [editingSlideId, setEditingSlideId] = useState<string | null>(null);
  const [savingSlide, setSavingSlide] = useState(false);
  const [slideError, setSlideError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const empresa = await fetchEmpresaById(empresaId);
      setForm({
        corPrimaria: empresa.corPrimaria,
        corSecundaria: empresa.corSecundaria,
        logoUrl: empresa.logoUrl || '',
        faviconUrl: empresa.faviconUrl || '',
        heroUsarCarrossel: empresa.heroUsarCarrossel,
        heroTitulo: empresa.heroTitulo || '',
        heroSubtitulo: empresa.heroSubtitulo || '',
        heroBadgeLabel: empresa.heroBadgeLabel || '',
        heroImagemUrl: empresa.heroImagemUrl || '',
        heroLinkUrl: empresa.heroLinkUrl || '',
        termosConteudo: empresa.termosConteudo || '',
        googleBusinessReviewUrl: empresa.googleBusinessReviewUrl || '',
      });
    } catch {
      /* silencioso */
    } finally {
      setLoading(false);
    }
  }, [empresaId]);

  const loadSlides = useCallback(async () => {
    try {
      setSlides(await fetchHeroSlides(empresaId));
    } catch {
      /* silencioso */
    }
  }, [empresaId]);

  useEffect(() => {
    load();
    loadSlides();
  }, [load, loadSlides]);

  const set = <K extends keyof AparenciaInput>(key: K, value: AparenciaInput[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  /** Logo e favicon enviados do PC salvam sozinhos, sem depender do botão "Salvar aparência" lá
   * embaixo — antes disso, dava a impressão de que o upload "não salvava" (só atualizava a
   * prévia). Os outros campos do formulário continuam salvando juntos, como antes. */
  const handleImagemEnviada = async (campo: 'logoUrl' | 'faviconUrl', url: string) => {
    const proximo = { ...form, [campo]: url };
    setForm(proximo);
    setAutoSalvando(campo === 'logoUrl' ? 'logo' : 'favicon');
    setAutoSalvoErro('');
    setAutoSalvoMsg(null);
    try {
      await updateAparencia(empresaId, proximo);
      const chave = campo === 'logoUrl' ? 'logo' : 'favicon';
      setAutoSalvoMsg(chave);
      setTimeout(() => setAutoSalvoMsg((atual) => (atual === chave ? null : atual)), 3000);
    } catch (err) {
      setAutoSalvoErro(err instanceof Error ? err.message : 'Erro ao salvar imagem');
    } finally {
      setAutoSalvando(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setSaving(true);
    try {
      await updateAparencia(empresaId, form);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar aparência');
    } finally {
      setSaving(false);
    }
  };

  const resetSlideForm = () => {
    setSlideForm(emptySlideForm);
    setEditingSlideId(null);
    setSlideError('');
  };

  const handleEditSlide = (slide: HeroSlide) => {
    setEditingSlideId(slide.id);
    setSlideForm({
      imagemUrl: slide.imagemUrl,
      titulo: slide.titulo,
      subtitulo: slide.subtitulo || '',
      badgeLabel: slide.badgeLabel || '',
      linkUrl: slide.linkUrl || '',
    });
  };

  const handleSubmitSlide = async (e: React.FormEvent) => {
    e.preventDefault();
    setSlideError('');
    if (!slideForm.titulo || !slideForm.imagemUrl) {
      setSlideError('Informe ao menos título e imagem.');
      return;
    }
    setSavingSlide(true);
    try {
      const payload = {
        imagemUrl: slideForm.imagemUrl,
        titulo: slideForm.titulo,
        subtitulo: slideForm.subtitulo || undefined,
        badgeLabel: slideForm.badgeLabel || undefined,
        linkUrl: slideForm.linkUrl || undefined,
      };
      if (editingSlideId) {
        await updateHeroSlide(empresaId, editingSlideId, payload);
      } else {
        await createHeroSlide(empresaId, { ...payload, ordem: slides.length });
      }
      resetSlideForm();
      loadSlides();
    } catch (err) {
      setSlideError(err instanceof Error ? err.message : 'Erro ao salvar slide');
    } finally {
      setSavingSlide(false);
    }
  };

  const handleToggleSlideAtivo = async (slide: HeroSlide) => {
    await setHeroSlideStatus(empresaId, slide.id, !slide.ativo);
    loadSlides();
  };

  const handleDeleteSlide = async (id: string) => {
    if (!window.confirm('Remover este slide?')) return;
    await deleteHeroSlide(empresaId, id);
    if (editingSlideId === id) resetSlideForm();
    loadSlides();
  };

  if (loading) {
    return <p className="text-center text-gray-500 py-8">Carregando...</p>;
  }

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit} className="space-y-6">
        <section>
          <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
            <Palette className="h-4 w-4 text-orange-600" /> Cores da loja
          </h3>
          <div className="grid sm:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl">
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Cor primária (botões, destaques)</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={form.corPrimaria}
                  onChange={(e) => set('corPrimaria', e.target.value)}
                  className="h-10 w-14 rounded-lg border border-gray-300 cursor-pointer"
                />
                <input
                  value={form.corPrimaria}
                  onChange={(e) => set('corPrimaria', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Cor secundária (degradês)</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={form.corSecundaria}
                  onChange={(e) => set('corSecundaria', e.target.value)}
                  className="h-10 w-14 rounded-lg border border-gray-300 cursor-pointer"
                />
                <input
                  value={form.corSecundaria}
                  onChange={(e) => set('corSecundaria', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
                />
              </div>
            </div>
          </div>
        </section>

        <section>
          <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-orange-600" /> Logo e favicon
          </h3>
          <p className="text-xs text-gray-400 mb-2">Enviar do PC salva na hora — colar uma URL ainda precisa do "Salvar aparência" lá embaixo.</p>
          <div className="grid sm:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl">
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Logo</label>
              <FotoInput
                value={form.logoUrl}
                onChange={(url) => set('logoUrl', url)}
                onUploaded={(url) => handleImagemEnviada('logoUrl', url)}
                placeholder="URL do logo (opcional)"
              />
              {autoSalvando === 'logo' && <p className="text-xs text-gray-400 mt-1">Salvando...</p>}
              {autoSalvoMsg === 'logo' && <p className="text-xs text-emerald-600 mt-1">Salvo!</p>}
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Favicon</label>
              <FotoInput
                value={form.faviconUrl}
                onChange={(url) => set('faviconUrl', url)}
                onUploaded={(url) => handleImagemEnviada('faviconUrl', url)}
                placeholder="URL do favicon (opcional)"
              />
              {autoSalvando === 'favicon' && <p className="text-xs text-gray-400 mt-1">Salvando...</p>}
              {autoSalvoMsg === 'favicon' && <p className="text-xs text-emerald-600 mt-1">Salvo!</p>}
            </div>
          </div>
          {autoSalvoErro && <p className="text-xs text-red-600 mt-2">{autoSalvoErro}</p>}
        </section>

        <section>
          <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
            <LayoutTemplate className="h-4 w-4 text-orange-600" /> Hero (banner do topo)
          </h3>
          <div className="bg-gray-50 p-4 rounded-xl space-y-4">
            <label className="flex items-center gap-3 cursor-pointer w-fit">
              <input
                type="checkbox"
                checked={form.heroUsarCarrossel}
                onChange={(e) => set('heroUsarCarrossel', e.target.checked)}
                className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
              />
              <span className="text-sm text-gray-700">Usar carrossel com múltiplos slides (gerenciados abaixo)</span>
            </label>

            {!form.heroUsarCarrossel && (
              <div className="grid sm:grid-cols-2 gap-3">
                <input
                  value={form.heroTitulo}
                  onChange={(e) => set('heroTitulo', e.target.value)}
                  placeholder="Título (opcional, usa o nome da loja se vazio)"
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm sm:col-span-2"
                />
                <input
                  value={form.heroSubtitulo}
                  onChange={(e) => set('heroSubtitulo', e.target.value)}
                  placeholder="Subtítulo (opcional)"
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm sm:col-span-2"
                />
                <input
                  value={form.heroBadgeLabel}
                  onChange={(e) => set('heroBadgeLabel', e.target.value)}
                  placeholder="Selo (opcional, ex: Só hoje)"
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
                <input
                  value={form.heroLinkUrl}
                  onChange={(e) => set('heroLinkUrl', e.target.value)}
                  placeholder="Link ao tocar (opcional)"
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
                <div className="sm:col-span-2">
                  <FotoInput
                    value={form.heroImagemUrl}
                    onChange={(url) => set('heroImagemUrl', url)}
                    placeholder="URL da imagem de fundo (opcional — sem imagem usa gradiente das cores da loja)"
                  />
                </div>
              </div>
            )}
          </div>
        </section>

        <section>
          <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-orange-600" /> Termos de Uso e Privacidade
          </h3>
          <div className="bg-gray-50 p-4 rounded-xl">
            <textarea
              value={form.termosConteudo}
              onChange={(e) => set('termosConteudo', e.target.value)}
              rows={8}
              placeholder="Deixe em branco para usar um modelo padrão (LGPD) gerado automaticamente com os dados da sua loja."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white resize-y"
            />
            <p className="text-xs text-gray-400 mt-1.5">
              Exibido na página pública <span className="font-mono">/termos</span> da loja e linkado no rodapé.
            </p>
          </div>
        </section>

        <section>
          <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
            <Star className="h-4 w-4 text-orange-600" /> Avaliações no Google
          </h3>
          <div className="bg-gray-50 p-4 rounded-xl">
            <input
              value={form.googleBusinessReviewUrl}
              onChange={(e) => set('googleBusinessReviewUrl', e.target.value)}
              placeholder="https://g.page/r/.../review"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
            <p className="text-xs text-gray-400 mt-1.5">
              Link oficial de avaliação do seu Perfil da Empresa no Google (Google Meu Negócio → Compartilhar perfil
              → copiar link de avaliação). Quando o cliente avalia o pedido com nota alta, ele recebe um convite para
              também avaliar sua loja nesse link — o Google não permite que apps enviem avaliações/fotos automaticamente
              em nome do cliente, então o link abre a página oficial do Google, onde ele mesmo escreve e anexa fotos.
            </p>
          </div>
        </section>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>}
        {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm">Aparência salva com sucesso!</div>}

        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white text-sm px-5 py-2.5 rounded-lg disabled:opacity-60"
        >
          <Save className="h-4 w-4" /> {saving ? 'Salvando...' : 'Salvar aparência'}
        </button>
      </form>

      {form.heroUsarCarrossel && (
        <section className="border-t border-gray-200 pt-6">
          <h3 className="font-bold text-gray-800 mb-3">Slides do carrossel</h3>

          <form onSubmit={handleSubmitSlide} className="bg-gray-50 p-4 rounded-xl mb-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-gray-600">{editingSlideId ? 'Editar slide' : 'Novo slide'}</p>
              {editingSlideId && (
                <button type="button" onClick={resetSlideForm} className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1">
                  <X className="h-3.5 w-3.5" /> Cancelar
                </button>
              )}
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <input
                value={slideForm.titulo}
                onChange={(e) => setSlideForm({ ...slideForm, titulo: e.target.value })}
                placeholder="Título"
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                required
              />
              <input
                value={slideForm.badgeLabel}
                onChange={(e) => setSlideForm({ ...slideForm, badgeLabel: e.target.value })}
                placeholder="Selo (opcional)"
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <input
                value={slideForm.subtitulo}
                onChange={(e) => setSlideForm({ ...slideForm, subtitulo: e.target.value })}
                placeholder="Subtítulo (opcional)"
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm sm:col-span-2"
              />
              <div className="sm:col-span-2">
                <FotoInput
                  value={slideForm.imagemUrl}
                  onChange={(url) => setSlideForm({ ...slideForm, imagemUrl: url })}
                  placeholder="URL da imagem (obrigatório)"
                />
              </div>
              <input
                value={slideForm.linkUrl}
                onChange={(e) => setSlideForm({ ...slideForm, linkUrl: e.target.value })}
                placeholder="Link ao tocar (opcional)"
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm sm:col-span-2"
              />
            </div>
            {slideError && <p className="text-sm text-red-600">{slideError}</p>}
            <button
              type="submit"
              disabled={savingSlide}
              className="flex items-center gap-1.5 bg-gray-800 hover:bg-gray-900 text-white text-sm px-4 py-2 rounded-lg disabled:opacity-60"
            >
              <Plus className="h-4 w-4" /> {savingSlide ? 'Salvando...' : editingSlideId ? 'Salvar alterações' : 'Adicionar slide'}
            </button>
          </form>

          <div className="space-y-2">
            {slides.map((slide) => (
              <div key={slide.id} className="flex items-center gap-3 border border-gray-200 rounded-2xl p-3">
                <img src={slide.imagemUrl} alt={slide.titulo} className="w-16 h-16 rounded-lg object-cover shrink-0 bg-gray-100" />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-800 text-sm truncate">{slide.titulo}</p>
                  {slide.subtitulo && <p className="text-xs text-gray-400 truncate">{slide.subtitulo}</p>}
                </div>
                <button
                  onClick={() => handleToggleSlideAtivo(slide)}
                  className={`px-3 py-1 rounded-full text-xs font-medium shrink-0 ${
                    slide.ativo ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {slide.ativo ? 'Ativo' : 'Inativo'}
                </button>
                <button onClick={() => handleEditSlide(slide)} className="text-gray-400 hover:text-gray-700 shrink-0">
                  <Pencil className="h-4 w-4" />
                </button>
                <button onClick={() => handleDeleteSlide(slide.id)} className="text-red-500 hover:text-red-700 shrink-0">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            {slides.length === 0 && (
              <p className="text-center text-gray-500 py-8 text-sm">Nenhum slide cadastrado ainda.</p>
            )}
          </div>
        </section>
      )}
    </div>
  );
};

export default AparenciaTab;
