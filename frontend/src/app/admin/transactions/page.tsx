'use client';

import { useState, useEffect } from 'react';
import { 
  Receipt, 
  DollarSign, 
  TrendingUp, 
  CreditCard, 
  Search, 
  Filter, 
  RefreshCw,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle2,
  Clock,
  XCircle
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { apiRequest } from '@/lib/api';

export default function AdminTransactionsPage() {
  const { admin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({
    totalVolume: 0,
    totalPlatformFee: 0,
    totalStripeFee: 0,
    totalNetProfit: 0,
  });
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (typeFilter) params.append('type', typeFilter);
      if (statusFilter) params.append('status', statusFilter);
      params.append('limit', '100');

      const data = await apiRequest<any>(`/admin/all-transactions?${params.toString()}`);
      if (data.success && data.data) {
        setTransactions(data.data.transactions || []);
        setSummary(data.data.summary || {});
      }
    } catch (err) {
      console.error('Error fetching transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [typeFilter, statusFilter]);

  const filteredTransactions = transactions.filter((t) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const senderName = t.sender?.fullName?.toLowerCase() || '';
    const receiverName = t.receiver?.fullName?.toLowerCase() || '';
    const senderTag = t.sender?.userTag?.toLowerCase() || '';
    const receiverTag = t.receiver?.userTag?.toLowerCase() || '';
    const remarks = t.remarks?.toLowerCase() || '';
    return senderName.includes(term) || receiverName.includes(term) || senderTag.includes(term) || receiverTag.includes(term) || remarks.includes(term);
  });

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Receipt className="w-7 h-7 text-[#5C7C89]" />
            Transaction Records & Revenue Analytics
          </h1>
          <p className="text-sm text-gray-400">
            Real-time record of all Customer to Host transfers, Deposits, Withdrawals, and Platform Fee Revenue.
          </p>
        </div>
        <button
          onClick={fetchTransactions}
          disabled={loading}
          className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 transition-all active:scale-95 shadow-md self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Records
        </button>
      </div>

      {/* Revenue Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Total Volume</span>
            <DollarSign className="w-5 h-5 text-indigo-400" />
          </div>
          <p className="text-2xl font-extrabold text-white mt-2">
            ${Number(summary.totalVolume || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <span className="text-xs text-indigo-300/80 mt-1 block">Total cash processed</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Platform Revenue Cut</span>
            <TrendingUp className="w-5 h-5 text-emerald-400" />
          </div>
          <p className="text-2xl font-extrabold text-emerald-400 mt-2">
            ${Number(summary.totalPlatformFee || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <span className="text-xs text-emerald-300/80 mt-1 block">Host 3% Platform Fee Collected</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Stripe Gateway Cost</span>
            <CreditCard className="w-5 h-5 text-amber-400" />
          </div>
          <p className="text-2xl font-extrabold text-amber-400 mt-2">
            ${Number(summary.totalStripeFee || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <span className="text-xs text-amber-300/80 mt-1 block">Estimated payment processing fee</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Net Platform Profit</span>
            <DollarSign className="w-5 h-5 text-cyan-400" />
          </div>
          <p className="text-2xl font-extrabold text-cyan-400 mt-2">
            ${Number(summary.totalNetProfit || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <span className="text-xs text-cyan-300/80 mt-1 block">Net earnings after gateway cost</span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row items-center gap-4 bg-slate-900/40 p-4 rounded-2xl border border-slate-800 backdrop-blur-md">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by user name, tag, or remarks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-white placeholder-gray-400 text-sm focus:outline-none focus:border-indigo-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="py-2.5 px-3 rounded-xl bg-slate-800/80 border border-slate-700/80 text-white text-sm focus:outline-none focus:border-indigo-500"
            >
              <option value="">All Types</option>
              <option value="transfer">Transfer (P2P)</option>
              <option value="deposit">Deposit</option>
              <option value="withdrawal">Withdrawal / Cashout</option>
            </select>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="py-2.5 px-3 rounded-xl bg-slate-800/80 border border-slate-700/80 text-white text-sm focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="declined">Declined</option>
          </select>
        </div>
      </div>

      {/* Transactions Data Table */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-md shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="bg-slate-800/80 text-xs uppercase tracking-wider text-gray-400 border-b border-slate-800">
              <tr>
                <th className="px-6 py-4 font-semibold">Date & Time</th>
                <th className="px-6 py-4 font-semibold">Type</th>
                <th className="px-6 py-4 font-semibold">Sender</th>
                <th className="px-6 py-4 font-semibold">Receiver</th>
                <th className="px-6 py-4 font-semibold">Amount</th>
                <th className="px-6 py-4 font-semibold">Platform Fee</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-400" />
                    Loading transaction records...
                  </td>
                </tr>
              ) : filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-400">
                    No transactions found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => {
                  const type = tx.type || 'transfer';
                  const isDeposit = type === 'deposit';
                  const isWithdrawal = type === 'withdrawal';
                  const isPending = tx.status === 'pending';
                  const isDeclined = tx.status === 'declined';

                  return (
                    <tr key={tx._id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-400">
                        {new Date(tx.createdAt).toLocaleString()}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                          isDeposit
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : isWithdrawal
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                        }`}>
                          {isDeposit ? <ArrowDownLeft className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                          {type.toUpperCase()}
                        </span>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        {tx.sender ? (
                          <div>
                            <p className="font-semibold text-white">{tx.sender.fullName}</p>
                            <p className="text-xs text-indigo-300">{tx.sender.userTag || tx.sender.email}</p>
                            <span className="text-[10px] uppercase font-bold text-gray-400">({tx.sender.role || 'customer'})</span>
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">External / Card</span>
                        )}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        {tx.receiver ? (
                          <div>
                            <p className="font-semibold text-white">{tx.receiver.fullName}</p>
                            <p className="text-xs text-indigo-300">{tx.receiver.userTag || tx.receiver.email}</p>
                            <span className="text-[10px] uppercase font-bold text-gray-400">({tx.receiver.role || 'customer'})</span>
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">Bank / Crypto Wallet</span>
                        )}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap font-bold text-white">
                        ${Number(tx.amount || 0).toFixed(2)}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        {Number(tx.platformFee || tx.fee || 0) > 0 ? (
                          <span className="text-emerald-400 font-bold">
                            +${Number(tx.platformFee || tx.fee).toFixed(2)} (3%)
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">FREE ($0.00)</span>
                        )}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                          isPending
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : isDeclined
                            ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        }`}>
                          {isPending ? <Clock className="w-3 h-3" /> : isDeclined ? <XCircle className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                          {tx.status?.toUpperCase() || 'COMPLETED'}
                        </span>
                      </td>

                      <td className="px-6 py-4 max-w-xs truncate text-xs text-gray-400" title={tx.remarks}>
                        {tx.remarks || 'N/A'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
