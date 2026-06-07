import { useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { formatMoney, getInstitutionCurrency } from '../utils/formatMoney';

export function useFormatMoney() {
  const { institution } = useAuth();
  const currency = getInstitutionCurrency(institution);

  const format = useCallback(
    (amount: number | string | null | undefined) => formatMoney(amount, currency, institution),
    [currency, institution],
  );

  return { formatMoney: format, currency };
}
