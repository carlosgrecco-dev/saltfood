import { useEffect, useState } from 'react';
import { fetchSiteBlocosPublico } from '../lib/siteBlocos';
import { PaginaSite, SiteBlocoPublico } from '../types/SiteBloco';

/** Busca os blocos ativos de uma página pública uma vez, no mount, e devolve indexados por chave.
 * Falha de rede é silenciosa — cada renderer (BlocoHero/BlocoListaIcones/BlocoCtaBanner) já cai
 * pro próprio fallback hardcoded quando a chave não aparece aqui. */
export function useSiteBlocos(pagina: PaginaSite): Record<string, SiteBlocoPublico> {
  const [porChave, setPorChave] = useState<Record<string, SiteBlocoPublico>>({});

  useEffect(() => {
    let cancelado = false;
    fetchSiteBlocosPublico(pagina)
      .then((blocos) => {
        if (cancelado) return;
        setPorChave(Object.fromEntries(blocos.map((b) => [b.chave, b])));
      })
      .catch(() => { /* silencioso — fallback hardcoded assume */ });
    return () => { cancelado = true; };
  }, [pagina]);

  return porChave;
}
