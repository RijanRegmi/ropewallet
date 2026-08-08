'use client';

import { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Search, 
  RefreshCw, 
  UserCheck, 
  UserX, 
  CheckCircle, 
  XCircle, 
  Clock, 
  UserPlus, 
  Sliders 
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { apiRequest } from '@/lib/api';

export default function AdminAuditLogsPage() {
  const { admin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      const data = await apiRequest<any>('/admin/audit-logs?limit=100');
      if (data.success && data.data) {
        setLogs(data.data.logs || []);
      }
    } catch (err) {
      console.error('Error fetching audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const filteredLogs = logs.filter((log) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const adminName = log.admin?.fullName?.toLowerCase() || '';
    const action = log.action?.toLowerCase() || '';
    const details = log.details?.toLowerCase() || '';
    const targetName = log.targetUser?.fullName?.toLowerCase() || '';
    return adminName.includes(term) || action.includes(term) || details.includes(term) || targetName.includes(term);
  });

  const getActionIcon = (action: string) => {
    const act = action.toUpperCase();
    if (act.includes('APPROVE')) return <CheckCircle className="w-4 h-4 text-emerald-400" />;
    if (act.includes('DECLINE')) return <XCircle className="w-4 h-4 text-red-400" />;
    if (act.includes('FREEZE')) return <UserX className="w-4 h-4 text-amber-400" />;
    if (act.includes('UNFREEZE')) return <UserCheck className="w-4 h-4 text-emerald-400" />;
    if (act.includes('ROLE')) return <Sliders className="w-4 h-4 text-indigo-400" />;
    if (act.includes('CREATE')) return <UserPlus className="w-4 h-4 text-cyan-400" />;
    return <Clock className="w-4 h-4 text-slate-400" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-[#5C7C89]" />
            Super Admin Activity Audit Logs
          </h1>
          <p className="text-sm text-gray-400">
            Immutable log system tracking every payout approval, declination, role update, and administrative action.
          </p>
        </div>
        <button
          onClick={fetchAuditLogs}
          disabled={loading}
          className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 transition-all active:scale-95 shadow-md self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Audit Logs
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-slate-900/40 p-4 rounded-2xl border border-slate-800 backdrop-blur-md">
        <div className="relative w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by Admin name, action, or target user..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-white placeholder-gray-400 text-sm focus:outline-none focus:border-indigo-500 transition-all"
          />
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-md shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="bg-slate-800/80 text-xs uppercase tracking-wider text-gray-400 border-b border-slate-800">
              <tr>
                <th className="px-6 py-4 font-semibold">Timestamp</th>
                <th className="px-6 py-4 font-semibold">Super Admin</th>
                <th className="px-6 py-4 font-semibold">Action</th>
                <th className="px-6 py-4 font-semibold">Action Description</th>
                <th className="px-6 py-4 font-semibold">Target User</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-400" />
                    Loading audit activity records...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                    No admin audit logs found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-400">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      {log.admin ? (
                        <div>
                          <p className="font-semibold text-white">{log.admin.fullName}</p>
                          <p className="text-xs text-indigo-300">{log.admin.email}</p>
                          <span className="text-[10px] uppercase font-bold text-indigo-400">({log.admin.role || 'superadmin'})</span>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">System Auto</span>
                      )}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800 text-slate-200 border border-slate-700">
                        {getActionIcon(log.action)}
                        {log.action}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-200 font-medium">
                      {log.details}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-xs">
                      {log.targetUser ? (
                        <div>
                          <p className="font-semibold text-white">{log.targetUser.fullName}</p>
                          <p className="text-xs text-gray-400">{log.targetUser.userTag || log.targetUser.email}</p>
                        </div>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
