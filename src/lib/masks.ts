export function onlyDigits(value: string): string {
  return value.replace(/\D/g, '');
}

/** Aplica mascara de CPF (11 digitos) ou CNPJ (14 digitos) conforme a quantidade digitada. */
export function maskDocumento(value: string): string {
  const digits = onlyDigits(value).slice(0, 14);

  if (digits.length <= 11) {
    return digits
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  }

  return digits
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
}

export function documentoLabel(digits: string): 'CPF' | 'CNPJ' {
  return onlyDigits(digits).length > 11 ? 'CNPJ' : 'CPF';
}

/** Aplica mascara de telefone/WhatsApp: (99) 99999-9999 ou (99) 9999-9999. */
export function maskTelefone(value: string): string {
  const digits = onlyDigits(value).slice(0, 11);

  if (digits.length <= 10) {
    return digits
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d{1,4})$/, '$1-$2');
  }

  return digits
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d{1,4})$/, '$1-$2');
}

/** Converte texto livre em slug: minusculas, sem acento, apenas letras/numeros/hifens. */
export function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
