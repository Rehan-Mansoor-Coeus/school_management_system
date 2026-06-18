const DEFAULT_CURRENCY = 'USD';

export function getInstitutionCurrency(institution?: Record<string, unknown> | null): string {
  const fromInstitution = institution?.currency;
  if (typeof fromInstitution === 'string' && fromInstitution.trim()) {
    return fromInstitution.trim().toUpperCase();
  }

  const feeStructure = institution?.settings as { fee_structure?: { currency?: string } } | undefined;
  const fromSettings = feeStructure?.fee_structure?.currency;
  if (typeof fromSettings === 'string' && fromSettings.trim()) {
    return fromSettings.trim().toUpperCase();
  }

  try {
    const raw = localStorage.getItem('institution');
    if (raw) {
      return getInstitutionCurrency(JSON.parse(raw) as Record<string, unknown>);
    }
  } catch {
    // ignore
  }

  return DEFAULT_CURRENCY;
}

export function formatMoney(
  amount: number | string | null | undefined,
  currencyCode?: string,
  institution?: Record<string, unknown> | null,
): string {
  const code = (currencyCode || getInstitutionCurrency(institution)).toUpperCase();
  const value = Number(amount ?? 0);

  if (Number.isNaN(value)) {
    return `${code} 0`;
  }

  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: code,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${code} ${value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  }
}
