import React, { useState, useEffect } from 'react';
import { X, Hash, CheckCircle2, AlertCircle, Calendar } from 'lucide-react';
import axios from 'axios';
import config from '../../config';

interface TransactionModalProps {
    isOpen: boolean;
    onClose: () => void;
    mseName?: string;
    mseId?: number;
    snpId: number;
    onSuccess: () => void;
}

export default function TransactionModal({ isOpen, onClose, mseName, mseId, snpId, onSuccess }: TransactionModalProps) {
    const [selectedMse, setSelectedMse] = useState<{ id: number, name: string } | null>(
        mseId ? { id: mseId, name: mseName || '' } : null
    );
    const [partners, setPartners] = useState<{ mse_id: number, mse: { name: string } }[]>([]);

    useEffect(() => {
        if (isOpen && !mseId) fetchPartners();
    }, [isOpen]);

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) {
            window.addEventListener('keydown', handleEsc);
        }
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    const fetchPartners = async () => {
        try {
            const res = await axios.get(`${config.API_BASE_URL}/partnerships/${snpId}`);
            setPartners(res.data.filter((p: any) => p.status === 'active'));
        } catch (err) {
            console.error(err);
        }
    };

    const [formData, setFormData] = useState({
        order_id: `ORD-${Math.floor(Math.random() * 100000)}`,
        amount: '',
        transaction_date: new Date().toISOString().split('T')[0],
        status: 'pending'
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!formData.amount || isNaN(Number(formData.amount)) || Number(formData.amount) <= 0) {
            setError("Please enter a valid amount.");
            return;
        }

        const targetMseId = mseId || selectedMse?.id;
        if (!targetMseId) {
            setError("Please select an enterprise.");
            return;
        }

        setIsSubmitting(true);
        try {
            await axios.post(`${config.API_BASE_URL}/transactions/`, {
                mse_id: targetMseId,
                snp_id: snpId,
                order_id: formData.order_id,
                amount: Number(formData.amount),
                status: formData.status,
                transaction_date: new Date(formData.transaction_date).toISOString()
            });
            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.response?.data?.detail || "Failed to record payment. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

            <div className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="text-base font-bold text-slate-900">Add payment</h3>
                    <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all">
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2.5 text-red-600">
                            <AlertCircle size={15} />
                            <span className="text-sm">{error}</span>
                        </div>
                    )}

                    {/* Enterprise selector */}
                    <div>
                        <label htmlFor="mse-select" className="block text-xs font-medium text-slate-500 mb-1.5">Enterprise</label>
                        {mseId ? (
                            <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700">
                                {mseName}
                            </div>
                        ) : (
                            <select
                                id="mse-select"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-slate-400 transition-all"
                                onChange={e => {
                                    const p = partners.find(p => p.mse_id === Number(e.target.value));
                                    if (p) setSelectedMse({ id: p.mse_id, name: p.mse.name });
                                }}
                                value={selectedMse?.id || ''}
                            >
                                <option value="" disabled>Select enterprise…</option>
                                {partners.map(p => (
                                    <option key={p.mse_id} value={p.mse_id}>{p.mse.name}</option>
                                ))}
                            </select>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        {/* Order ID */}
                        <div>
                            <label htmlFor="order-id" className="block text-xs font-medium text-slate-500 mb-1.5">Order ID</label>
                            <div className="relative">
                                <Hash size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input id="order-id" type="text" value={formData.order_id}
                                    onChange={e => setFormData({ ...formData, order_id: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-8 pr-3 text-sm outline-none focus:border-slate-400 transition-all" />
                            </div>
                        </div>

                        {/* Amount */}
                        <div>
                            <label htmlFor="amount" className="block text-xs font-medium text-slate-500 mb-1.5">Amount (₹)</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">₹</span>
                                <input id="amount" type="number" required value={formData.amount}
                                    onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-7 pr-3 text-sm outline-none focus:border-slate-400 transition-all"
                                    placeholder="0.00" />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        {/* Date */}
                        <div>
                            <label htmlFor="date" className="block text-xs font-medium text-slate-500 mb-1.5">Date</label>
                            <div className="relative">
                                <Calendar size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input id="date" type="date" value={formData.transaction_date}
                                    onChange={e => setFormData({ ...formData, transaction_date: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-8 pr-3 text-sm outline-none focus:border-slate-400 transition-all" />
                            </div>
                        </div>

                        {/* Status */}
                        <div>
                            <label htmlFor="status" className="block text-xs font-medium text-slate-500 mb-1.5">Status</label>
                            <select id="status" value={formData.status}
                                onChange={e => setFormData({ ...formData, status: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-slate-400 transition-all">
                                <option value="pending">Pending</option>
                                <option value="completed">Completed</option>
                            </select>
                        </div>
                    </div>

                    <button type="submit" disabled={isSubmitting}
                        className="w-full bg-[#002147] hover:bg-emerald-600 text-white font-semibold py-2.5 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm mt-1">
                        {isSubmitting
                            ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            : <><CheckCircle2 size={15} /> Save payment</>}
                    </button>
                </form>
            </div>
        </div>
    );
}
