import { useState, useEffect } from 'react';
import axios from 'axios';
import { RefreshCcw, CheckCircle2, AlertTriangle, Clock, ExternalLink } from 'lucide-react';
import config from '../../config';
import { useMSE } from '../../context/MSEContext';
import { useToast } from '../../context/ToastContext';
import type { Transaction } from '../../types';
import AddPaymentForm from '../../components/AddPaymentForm';

const API_BASE_URL = 'http://localhost:8000';  // backend URL

export const addTransaction = async (transactionData: any) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/v1/transactions/`,
      transactionData
    );
    return response.data;
  } catch (error) {
    console.error('Error adding transaction:', error);
    throw error;
  }
};
export default function TransactionLedger() {
  const { selectedMseId, mses } = useMSE();
  const { showToast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState<number | null>(null);

  const activeMse = mses.find(m => m.mse_id === selectedMseId);

  const isJwtValid = (token: string) => {
    try {
      const payloadPart = token.split('.')[1];
      if (!payloadPart) return false;
      const base64 = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
      const json = JSON.parse(atob(base64));
      if (!json?.exp) return false;
      return Date.now() < json.exp * 1000;
    } catch {
      return false;
    }
  };

  const fetchTransactions = async () => {
    if (!selectedMseId) return;
    setLoading(true);
    try {
      const res = await axios.get(`${config.API_BASE_URL}/transactions/?mse_id=${selectedMseId}`);
      setTransactions(res.data);
    } catch {
      showToast('Failed to load transactions', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();

    const token = localStorage.getItem('authToken');
    if (!token) return;
    if (!isJwtValid(token)) {
      localStorage.removeItem('authToken');
      window.dispatchEvent(new CustomEvent('session-expired'));
      showToast('Session expired. Please login again.', 'error');
      return;
    }

    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsParams = config.API_BASE_URL.replace('http://', '').replace('https://', '');
    const ws = new WebSocket(`${wsProtocol}//${wsParams}/transactions/ws?token=${encodeURIComponent(token)}`);

    ws.onopen = () => {
      try { ws.send('ping'); } catch {}
    };
    ws.onerror = (event) => { console.warn('Ledger WebSocket error', event); };
    ws.onclose = (event) => { console.warn('Ledger WebSocket closed', { code: event.code, reason: event.reason }); };
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.event === 'new_transaction') fetchTransactions();
      } catch {}
    };

    return () => { try { ws.close(); } catch {} };
  }, [selectedMseId]);

  const handleVerify = async (txId: number) => {
    setVerifying(txId);
    try {
      await axios.post(`${config.API_BASE_URL}/transactions/${txId}/verify`);
      showToast('Payment verified successfully', 'success');
      await fetchTransactions();
    } catch { showToast('Could not verify payment', 'error'); }
    finally { setVerifying(null); }
  };

  const handleDispute = async (txId: number) => {
    const desc = prompt('What is the issue with this payment? (e.g. wrong amount, unauthorised charge)');
    if (!desc) return;
    try {
      await axios.post(`${config.API_BASE_URL}/transactions/${txId}/dispute`, { type: 'amount_mismatch', description: desc });
      showToast('Dispute raised successfully', 'success');
      await fetchTransactions();
    } catch { showToast('Could not raise dispute', 'error'); }
  };

  if (!selectedMseId) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center">
          <Clock className="text-slate-400" size={28} />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-900">No enterprise selected</h2>
          <p className="text-slate-500 text-sm mt-1">Select an enterprise to view transactions.</p>
        </div>
      </div>
    );
  }

  const pending = transactions.filter(tx => tx.status === 'pending').length;

  return (
    <div className="w-full space-y-6 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Transactions</h1>
          <p className="text-slate-500 text-sm mt-0.5">{activeMse?.name}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchTransactions}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-white border border-transparent hover:border-slate-200 rounded-lg transition-all">
            <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Add Payment Form */}
      <AddPaymentForm mseId={selectedMseId} onSuccess={fetchTransactions} />

      {/* Pending alert */}
      {pending > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-3">
          <AlertTriangle size={16} className="text-amber-500 shrink-0" />
          <p className="text-sm text-amber-800 flex-1">
            <span className="font-semibold">{pending} payment{pending > 1 ? 's' : ''}</span> waiting for your confirmation.
          </p>
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
          <span className="font-semibold text-slate-900 text-sm">All payments</span>
          <span className="text-xs text-slate-400">{transactions.length} total</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs text-slate-400 font-medium">
                <th className="px-5 py-3">Order ID</th>
                <th className="px-5 py-3">Partner</th>
                <th className="px-5 py-3">Amount</th>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading && transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center">
                    <div className="w-6 h-6 border-2 border-slate-200 border-t-[#002147] rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-sm text-slate-400">Loading transactions…</p>
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center">
                    <Clock size={32} className="text-slate-200 mx-auto mb-3" />
                    <p className="text-sm font-medium text-slate-700">No transactions yet</p>
                    <p className="text-xs text-slate-400 mt-1">Payments from your partners will appear here.</p>
                  </td>
                </tr>
              ) : transactions.map(tx => (
                <tr key={tx.transaction_id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3.5 font-mono text-xs text-slate-500">{tx.order_id}</td>
                  <td className="px-5 py-3.5 text-slate-600 text-xs">Partner #{tx.snp_id}</td>
                  <td className="px-5 py-3.5 font-semibold text-slate-900">
                    ₹{tx.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-5 py-3.5 text-slate-500 text-xs">
                    {new Date(tx.transaction_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-5 py-3.5">
                    {tx.status === 'verified' ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                        <CheckCircle2 size={11} /> Verified
                      </span>
                    ) : tx.status === 'pending' ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-100">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                        Pending
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-orange-700 bg-orange-50 px-2.5 py-1 rounded-full border border-orange-100">
                        <ExternalLink size={11} /> Disputed
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    {tx.status === 'pending' && (
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleDispute(tx.transaction_id)}
                          className="px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-red-500 hover:bg-red-50 border border-slate-200 hover:border-red-200 rounded-lg transition-all">
                          Dispute
                        </button>
                        <button
                          onClick={() => handleVerify(tx.transaction_id)}
                          disabled={verifying === tx.transaction_id}
                          className="px-3 py-1.5 text-xs font-semibold text-white bg-[#002147] hover:bg-emerald-600 rounded-lg transition-all disabled:opacity-50 flex items-center gap-1.5">
                          {verifying === tx.transaction_id
                            ? <RefreshCcw size={11} className="animate-spin" />
                            : <CheckCircle2 size={11} />}
                          Confirm
                        </button>
                      </div>
                    )}
                    {tx.status === 'verified' && (
                      <CheckCircle2 size={16} className="text-emerald-400 ml-auto" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}