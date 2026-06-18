import React, { useState, useEffect } from 'react';
import { CreditCard, CheckCircle, XCircle } from 'lucide-react';
import AdmissionsService from '../services/AdmissionsService';
import { useFormatMoney } from '../../../hooks/useFormatMoney';

interface PaymentPageProps {
  applicationId: number;
}

export const PaymentPage: React.FC<PaymentPageProps> = ({ applicationId }) => {
  const { formatMoney } = useFormatMoney();
  const [loading, setLoading] = useState(false);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'completed' | 'failed' | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  const initializePayment = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await AdmissionsService.initializePayment(applicationId);
      setPaymentData(response.data);

      // Open Flutterwave link
      if (response.data.payment_link) {
        window.open(response.data.payment_link, '_blank');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to initialize payment');
    } finally {
      setLoading(false);
    }
  };

  const verifyPayment = async () => {
    if (!paymentData?.payment_id) return;

    setLoading(true);
    try {
      const response = await AdmissionsService.verifyPayment(
        paymentData.payment_id
      );

      if (response.data?.status === 'success') {
        setPaymentStatus('completed');
      } else {
        setPaymentStatus('failed');
        setError('Payment verification failed');
      }
    } catch (err: any) {
      setPaymentStatus('failed');
      setError('Failed to verify payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <div className="bg-white rounded-lg shadow p-6">
        {paymentStatus === null ? (
          <>
            <div className="flex items-center justify-center mb-6">
              <div className="bg-blue-100 p-4 rounded-full">
                <CreditCard size={32} className="text-blue-600" />
              </div>
            </div>

            <h1 className="text-2xl font-bold text-gray-800 mb-2 text-center">
              Application Fee Payment
            </h1>

            {paymentData && (
              <div className="bg-gray-50 rounded-lg p-4 mb-6 text-center">
                <p className="text-gray-600 text-sm mb-1">Amount Due</p>
                <p className="text-3xl font-bold text-gray-800">
                  {formatMoney(paymentData.amount)}
                </p>
              </div>
            )}

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
                {error}
              </div>
            )}

            <button
              onClick={initializePayment}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard size={20} />
                  Pay Now
                </>
              )}
            </button>

            <p className="text-xs text-gray-600 text-center mt-4">
              You will be redirected to Flutterwave to complete your payment securely.
            </p>
          </>
        ) : paymentStatus === 'completed' ? (
          <>
            <div className="flex items-center justify-center mb-6">
              <div className="bg-green-100 p-4 rounded-full">
                <CheckCircle size={32} className="text-green-600" />
              </div>
            </div>

            <h1 className="text-2xl font-bold text-gray-800 mb-2 text-center">
              Payment Successful
            </h1>

            <div className="bg-green-50 rounded-lg p-4 mb-6">
              <p className="text-green-800 text-center">
                Your application fee has been received. Please wait for the admission board to review your application.
              </p>
            </div>

            <button
              onClick={() => (window.location.href = '/admissions/my-applications')}
              className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-green-700"
            >
              Back to Applications
            </button>
          </>
        ) : (
          <>
            <div className="flex items-center justify-center mb-6">
              <div className="bg-red-100 p-4 rounded-full">
                <XCircle size={32} className="text-red-600" />
              </div>
            </div>

            <h1 className="text-2xl font-bold text-gray-800 mb-2 text-center">
              Payment Failed
            </h1>

            <div className="bg-red-50 rounded-lg p-4 mb-6">
              <p className="text-red-800 text-center">
                {error || 'Your payment could not be processed. Please try again.'}
              </p>
            </div>

            <button
              onClick={() => setPaymentStatus(null)}
              className="w-full bg-red-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-red-700 mb-2"
            >
              Try Again
            </button>

            <button
              onClick={() => (window.location.href = '/admissions/my-applications')}
              className="w-full bg-gray-200 text-gray-800 py-3 px-4 rounded-lg font-semibold hover:bg-gray-300"
            >
              Cancel
            </button>
          </>
        )}
      </div>
    </div>
  );
};
