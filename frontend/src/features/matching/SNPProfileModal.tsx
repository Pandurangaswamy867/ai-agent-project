import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, MapPin, Star, Phone, Mail, CreditCard, Percent, Building2 } from 'lucide-react';
import config from '../../config';

interface SNPProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    snpId: number;
}

export default function SNPProfileModal({ isOpen, onClose, snpId }: SNPProfileModalProps) {
    const [snp, setSnp] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen && snpId) {
            setLoading(true);
            axios.get(`${config.API_BASE_URL}/snps/${snpId}`)
                .then(res => setSnp(res.data))
                .catch(err => console.error(err))
                .finally(() => setLoading(false));
        }
    }, [isOpen, snpId]);

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) {
            window.addEventListener('keydown', handleEsc);
        }
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden">

                {/* Header */}
                <div className="bg-[#002147] px-6 py-5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-xl bg-white/10 text-white flex items-center justify-center font-bold text-lg">
                            {snp?.name?.[0] || '?'}
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-white">{snp?.name || '—'}</h2>
                            <p className="text-white/50 text-xs mt-0.5">{snp?.type}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-all">
                        <X size={18} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {loading ? (
                        <div className="py-16 flex flex-col items-center gap-3">
                            <div className="w-7 h-7 border-2 border-slate-200 border-t-[#002147] rounded-full animate-spin" />
                            <p className="text-sm text-slate-400">Loading profile…</p>
                        </div>
                    ) : (
                        <div className="space-y-5">
                            {/* Key stats */}
                            <div className="grid grid-cols-3 gap-3">
                                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 text-center">
                                    <div className="flex items-center justify-center gap-1 text-amber-500 mb-1">
                                        <Star size={13} className="fill-amber-500" />
                                        <span className="text-base font-bold text-slate-900">{snp?.rating || '—'}</span>
                                    </div>
                                    <div className="text-xs text-slate-400">Rating</div>
                                </div>
                                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 text-center">
                                    <div className="flex items-center justify-center gap-1 mb-1">
                                        <Percent size={13} className="text-slate-400" />
                                        <span className="text-base font-bold text-slate-900">{snp?.commission_rate ?? '—'}</span>
                                    </div>
                                    <div className="text-xs text-slate-400">Commission</div>
                                </div>
                                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 text-center">
                                    <div className="flex items-center justify-center gap-1 mb-1">
                                        <span className="text-xs text-slate-500">₹</span>
                                        <span className="text-base font-bold text-slate-900">{snp?.onboarding_fee ?? '—'}</span>
                                    </div>
                                    <div className="text-xs text-slate-400">Onboarding fee</div>
                                </div>
                            </div>

                            {/* Contact */}
                            <div className="space-y-2">
                                <p className="text-xs font-medium text-slate-400">Contact details</p>
                                <div className="space-y-2">
                                    {snp?.email && (
                                        <div className="flex items-center gap-2.5 text-sm text-slate-700">
                                            <Mail size={14} className="text-slate-300 shrink-0" /> {snp.email}
                                        </div>
                                    )}
                                    {snp?.phone && (
                                        <div className="flex items-center gap-2.5 text-sm text-slate-700">
                                            <Phone size={14} className="text-slate-300 shrink-0" /> {snp.phone}
                                        </div>
                                    )}
                                    {snp?.city && (
                                        <div className="flex items-center gap-2.5 text-sm text-slate-700">
                                            <MapPin size={14} className="text-slate-300 shrink-0" /> {snp.city}
                                        </div>
                                    )}
                                    {snp?.contact_person && (
                                        <div className="flex items-center gap-2.5 text-sm text-slate-700">
                                            <Building2 size={14} className="text-slate-300 shrink-0" /> {snp.contact_person}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Sectors */}
                            {snp?.supported_sectors && (
                                <div className="space-y-2">
                                    <p className="text-xs font-medium text-slate-400">Sectors served</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {snp.supported_sectors.split(',').map((s: string) => (
                                            <span key={s} className="px-2.5 py-1 bg-slate-100 text-slate-600 text-xs rounded-full">{s.trim()}</span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <button onClick={onClose}
                                className="w-full py-2.5 text-sm font-semibold text-white bg-[#002147] rounded-xl hover:bg-[#003366] transition-all mt-2">
                                Close
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
