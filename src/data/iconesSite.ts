import {
  Store, Zap, MapPin, Wallet, Link2, HandCoins, ClipboardList, Bike, ShieldCheck,
  UtensilsCrossed, MessageSquarePlus, Sparkles, Star, Heart, Landmark, ChefHat, Boxes,
  Smartphone, Users, Globe, Rocket, CreditCard,
} from 'lucide-react';

/** Ícones disponíveis pra blocos do CMS do site público — mesmo padrão de data/funcionalidades.ts
 * (um mapa nome→componente, escolhido via <select> no admin, nunca texto livre). */
export const ICONES_SITE: Record<string, typeof Store> = {
  Store, Zap, MapPin, Wallet, Link2, HandCoins, ClipboardList, Bike, ShieldCheck,
  UtensilsCrossed, MessageSquarePlus, Sparkles, Star, Heart, Landmark, ChefHat, Boxes,
  Smartphone, Users, Globe, Rocket, CreditCard,
};

export const NOMES_ICONES_SITE = Object.keys(ICONES_SITE);

/** Nunca deixa um nome de ícone inválido/antigo vindo do banco quebrar o render. */
export function getIconeSite(nome?: string | null): typeof Store {
  return (nome && ICONES_SITE[nome]) || Store;
}
