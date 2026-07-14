'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ApiClient } from '@/lib/api';

interface PaymentDetails {
  _id: string;
  amount: number;
  status: string;
  receiver: {
    fullName?: string;
    firstName: string;
    lastName: string;
    userTag: string;
  };
}

function SuccessContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [data, setData] = useState<PaymentDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    const fetchDetails = async () => {
      const res = await ApiClient.get<PaymentDetails>(`/p2p/request/${token}`);
      if (res.success && res.data) {
        setData(res.data);
      }
      setLoading(false);
    };

    fetchDetails();
  }, [token]);

  return (
    <div className="flex min-h-screen bg-dark-bg items-center justify-center p-4">
      <div className="w-full max-w-[420px] bg-dark-surface border border-dark-border rounded-3xl p-10 text-center shadow-[0_20px_50px_rgba(0,0,0,0.5)] space-y-6">
        {/* Success checkmark */}
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-success/15 border border-success/35 text-success rounded-full flex items-center justify-center text-3xl animate-bounce">
            ✓
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-extrabold text-dark-text">Payment Successful!</h2>
          <p className="text-sm text-dark-text-secondary">
            Thank you! Your automated checkout has been verified and processed.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-primary border-r-2" />
          </div>
        ) : (
          data && (
            <div className="bg-dark-bg border border-dark-border/60 rounded-2xl p-5 space-y-3.5 text-xs text-left">
              <div className="flex justify-between items-center">
                <span className="text-dark-text-secondary uppercase tracking-wider font-bold">Recipient</span>
                <span className="font-semibold text-dark-text text-sm">
                  {data.receiver.fullName || `${data.receiver.firstName} ${data.receiver.lastName}`}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-dark-text-secondary uppercase tracking-wider font-bold">User Tag</span>
                <span className="font-bold text-primary-hover">@{data.receiver.userTag}</span>
              </div>
              {data.amount && (
                <div className="flex justify-between items-center border-t border-dark-border/40 pt-3.5">
                  <span className="text-dark-text-secondary uppercase tracking-wider font-bold text-sm">Amount Paid</span>
                  <span className="text-lg font-black text-success">${Number(data.amount).toFixed(2)}</span>
                </div>
              )}
            </div>
          )
        )}

        <div className="text-[10px] text-dark-text-secondary font-medium tracking-wide uppercase">
          🔒 Secured by RopeWallet &bull; Instant Settlement
        </div>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen bg-dark-bg items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary border-r-2" />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
