import { useEffect, useState } from 'react';

const DESKTOP_QUERY = '(min-width: 640px)';

/** true abaixo do breakpoint sm (640px) — mesmo corte usado no menu do admin/Super Admin. */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(() => !window.matchMedia(DESKTOP_QUERY).matches);

  useEffect(() => {
    const mq = window.matchMedia(DESKTOP_QUERY);
    const handler = (e: MediaQueryListEvent) => setIsMobile(!e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return isMobile;
}
