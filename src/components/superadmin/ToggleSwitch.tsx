import React from 'react';

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  activeLabel?: string;
  inactiveLabel?: string;
  disabled?: boolean;
  size?: 'sm' | 'md';
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  checked,
  onChange,
  label,
  activeLabel = 'Ativo',
  inactiveLabel = 'Inativo',
  disabled = false,
  size = 'md',
}) => {
  const track = size === 'sm' ? 'w-9 h-5' : 'w-11 h-6';
  const thumb = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';
  const translate = size === 'sm' ? 'translate-x-4' : 'translate-x-5';

  return (
    <div className="flex items-center gap-2.5">
      {label && <span className="text-sm font-medium text-slate-700">{label}</span>}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex ${track} shrink-0 items-center rounded-full transition-colors duration-200 ease-in-out
          focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500
          disabled:opacity-50 disabled:cursor-not-allowed
          ${checked ? 'bg-emerald-500' : 'bg-slate-300'}`}
      >
        <span
          className={`inline-block ${thumb} transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out
            ${checked ? translate : 'translate-x-1'}`}
        />
      </button>
      <span className={`text-xs font-semibold ${checked ? 'text-emerald-600' : 'text-slate-400'}`}>
        {checked ? activeLabel : inactiveLabel}
      </span>
    </div>
  );
};

export default ToggleSwitch;
