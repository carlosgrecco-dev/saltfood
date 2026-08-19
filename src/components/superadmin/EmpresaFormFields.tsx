import React from 'react';

export const Field: React.FC<{
  label: string;
  icon: React.ReactNode;
  error?: string;
  children: React.ReactNode;
}> = ({ label, icon, error, children }) => (
  <div>
    <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
      {icon}
      {label}
    </label>
    {children}
    {error && <p className="mt-1 text-xs font-medium text-red-600">{error}</p>}
  </div>
);

export const inputClasses = (readOnly: boolean, hasError: boolean) => `
  w-full rounded-xl border px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition-colors
  focus:outline-none focus:ring-2 focus:ring-orange-500/20
  ${readOnly ? 'bg-gray-50 border-gray-200 text-gray-500 cursor-default' : 'bg-white border-gray-200 focus:border-orange-500'}
  ${hasError ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : ''}
`;
