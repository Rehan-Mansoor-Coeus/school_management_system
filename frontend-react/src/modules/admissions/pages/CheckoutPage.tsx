import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { PaymentPage } from '../components/PaymentPage';

export const CheckoutPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const applicationId = parseInt(searchParams.get('id') || '0');

  return (
    <div className="min-h-screen bg-gray-100 flex items-center">
      <PaymentPage applicationId={applicationId} />
    </div>
  );
};
