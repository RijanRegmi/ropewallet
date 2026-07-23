'use client';

import Sidebar from '@/components/Sidebar';

export default function ExportData() {
  const handleExportTransactions = () => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://ropewallet.com/api';
    // Open standard export endpoint
    window.open(`${apiBaseUrl}/admin/transactions/export`, '_blank');
  };

  return (
    <div className="min-h-screen bg-dark-bg flex">
      {/* Navigation Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 ml-64 p-8">
        <header className="mb-8">
          <h2 className="text-2xl font-bold text-dark-text">Data Export</h2>
          <p className="text-sm text-dark-text-secondary mt-1">
            Download financial reports and transaction audits for offline review
          </p>
        </header>

        <div className="max-w-2xl bg-dark-surface border border-dark-border rounded-2xl p-8 shadow-lg">
          <h3 className="font-bold text-lg mb-2">Financial Records</h3>
          <p className="text-xs text-dark-text-secondary mb-6 leading-relaxed">
            Generate a full audit log of all system transactions, including completed P2P payments, automated Stripe deposits, and administrative cash adjustments. Downloads as a standard CSV spreadsheet file.
          </p>

          <button
            onClick={handleExportTransactions}
            className="px-6 py-3 bg-primary hover:bg-primary-hover text-white text-sm font-bold rounded-xl active:scale-[0.98] transition-all cursor-pointer inline-flex items-center gap-2"
          >
            📥 Export Transactions (CSV)
          </button>
        </div>
      </div>
    </div>
  );
}
