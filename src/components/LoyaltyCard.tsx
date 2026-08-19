import React, { useEffect, useState } from 'react';
import { Gift, Trophy, Bike, Clock, Check, Medal } from 'lucide-react';
import { useTenant } from '../context/TenantContext';
import {
  Cliente, loyaltyProgress, loyaltyExpiracao, LOYALTY_STAMPS_GOAL, loyaltyTier, LOYALTY_TIER_LABELS,
} from '../types/Cliente';

const TIER_COLORS: Record<ReturnType<typeof loyaltyTier>, string> = {
  BRONZE: 'text-amber-100',
  PRATA: 'text-slate-100',
  OURO: 'text-yellow-100',
};

interface LoyaltyCardProps {
  customer: Cliente;
}

/** Contagem regressiva em tempo real até a expiração do item grátis (Empresa.fidelidadeValidadeDias). */
const useCountdown = (target: Date | null) => {
  const targetMs = target ? target.getTime() : null;
  const [msLeft, setMsLeft] = useState<number | null>(() => (targetMs != null ? targetMs - Date.now() : null));

  useEffect(() => {
    if (targetMs == null) {
      setMsLeft(null);
      return;
    }
    const tick = () => setMsLeft(Math.max(0, targetMs - Date.now()));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [targetMs]);

  return msLeft;
};

const formatCountdown = (ms: number) => {
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  return `${minutes}m ${seconds}s`;
};

const LoyaltyCard: React.FC<LoyaltyCardProps> = ({ customer }) => {
  const { empresa } = useTenant();
  const { stamps } = loyaltyProgress(customer);
  const { disponiveis: available, expiraEm } = loyaltyExpiracao(customer, empresa);
  const faltam = LOYALTY_STAMPS_GOAL - stamps;
  const msLeft = useCountdown(available > 0 ? expiraEm : null);
  const logoUrl = empresa.fidelidadeLogoUrl || empresa.logoUrl;
  const progressPercent = available > 0 ? 100 : (stamps / LOYALTY_STAMPS_GOAL) * 100;
  const tier = loyaltyTier(customer);

  return (
    <div
      className="relative overflow-hidden rounded-3xl text-white shadow-lg"
      style={{ backgroundImage: 'linear-gradient(135deg, var(--cor-primaria), var(--cor-secundaria))' }}
    >
      {/* textura sutil de bolinhas, só decorativa */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.08]"
        style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '16px 16px' }}
      />

      {/* Cabeçalho: logo, nome da loja e selo de prêmios prontos */}
      <div className="relative flex items-center gap-3 p-5 pb-4">
        {logoUrl ? (
          <img
            src={logoUrl}
            alt={empresa.nome}
            className="h-11 w-11 shrink-0 rounded-full bg-white/10 object-cover ring-2 ring-white/40"
          />
        ) : (
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/15">
            <Bike className="h-5 w-5 text-white" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate font-extrabold text-sm">{empresa.nome}</p>
          <p className={`flex items-center gap-1 text-[11px] font-bold uppercase tracking-widest ${TIER_COLORS[tier]}`}>
            <Medal className="h-3 w-3" /> Nível {LOYALTY_TIER_LABELS[tier]}
          </p>
        </div>
        {available > 0 && (
          <span className="shrink-0 rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-bold backdrop-blur-sm">
            {available > 1 ? `${available} prêmios` : '1 prêmio'}
          </span>
        )}
      </div>

      {/* Linha picotada estilo bilhete, com recorte nas duas laterais */}
      <div className="relative mx-1">
        <div className="border-t-2 border-dashed border-white/30" />
        <div className="absolute left-0 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white" />
        <div className="absolute right-0 top-1/2 h-6 w-6 translate-x-1/2 -translate-y-1/2 rounded-full bg-white" />
      </div>

      <div className="relative p-5 pt-4">
        {/* Selos 1 a 10 + 11º grátis (troféu), como carimbos circulares */}
        <div className="mb-3 flex flex-wrap gap-2">
          {Array.from({ length: LOYALTY_STAMPS_GOAL }).map((_, i) => {
            const filled = i < stamps;
            return (
              <div
                key={i}
                className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-[10px] font-bold ${
                  filled ? 'border-white bg-white' : 'border-dashed border-white/30 bg-white/10 text-white/50'
                }`}
                style={filled ? { color: 'var(--cor-primaria)' } : undefined}
              >
                {filled ? <Check className="h-4 w-4" /> : i + 1}
              </div>
            );
          })}
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${
              available > 0 ? 'animate-glow-pulse border-white bg-white' : 'border-dashed border-white/30 bg-white/10'
            }`}
            style={available > 0 ? { color: 'var(--cor-primaria)' } : undefined}
            title="11º item — grátis!"
          >
            <Trophy className={`h-4 w-4 ${available > 0 ? '' : 'text-white/50'}`} />
          </div>
        </div>

        {/* Barra de progresso do ciclo atual */}
        <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-white/20">
          <div
            className="h-full rounded-full bg-white transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Caixa de recompensa */}
        <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/15 p-3 backdrop-blur-sm">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20">
            <Gift className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-white">Sua recompensa</p>
            <p className="text-[11px] leading-snug text-white/80">
              {available > 0
                ? `Você tem ${available} item${available > 1 ? 's' : ''} grátis para resgatar!`
                : stamps === 0
                  ? `Complete ${LOYALTY_STAMPS_GOAL} pedidos e o 11º é por nossa conta!`
                  : `Faltam ${faltam} pedido${faltam > 1 ? 's' : ''} para o próximo grátis`}
            </p>
            {available > 0 && msLeft != null && (
              <p className="mt-1 flex items-center gap-1 text-[11px] font-bold text-white">
                <Clock className="h-3 w-3" /> Expira em {formatCountdown(msLeft)}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoyaltyCard;
