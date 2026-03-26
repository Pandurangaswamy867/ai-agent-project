import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Sparkles, Trophy, MapPin, Building2, Search, Eye, Check, X, Users, RefreshCcw, Clock } from 'lucide-react';
import config from '../../config';
import { useMSE } from '../../context/MSEContext';
import { useToast } from '../../context/ToastContext';
import { useTranslation } from 'react-i18next';
import SNPProfileModal from './SNPProfileModal';
import type { MatchingScore } from '../../types';

interface Match extends MatchingScore {}

function statusLabel(match: Match, t: any) {
    if (match.partnership_status === 'active') return { text: t('integrated'), color: 'text-emerald-700 bg-emerald-50 border-emerald-100' };
    if (match.partnership_status === 'rejected') return { text: t('reject'), color: 'text-red-600 bg-red-50 border-red-100' };
    if (match.partnership_status === 'pending') {
        if (!match.mse_consent) return { text: t('pending_approval'), color: 'text-amber-700 bg-amber-50 border-amber-100' };
        return { text: t('sent'), color: 'text-blue-700 bg-blue-50 border-blue-100' };
    }
    return { text: t('request'), color: 'text-slate-600 bg-slate-50 border-slate-200' };
}

export default function MatchingDashboard() {
    const { selectedMseId, mses } = useMSE();
    const { showToast } = useToast();
    const { t } = useTranslation();
    const [matches, setMatches] = useState<Match[]>([]);
    const [loading, setLoading] = useState(false);
    const [assignedSnpId, setAssignedSnpId] = useState<number | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [minScore, setMinScore] = useState(0);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [profileSnpId, setProfileSnpId] = useState<number | null>(null);

    const fetchMatches = async () => {
        if (!selectedMseId) return;
        setLoading(true);
        try {
            const res = await axios.get(`${config.API_BASE_URL}/matching/${selectedMseId}`);
            console.log("Matching Fetch Result:", {
                mseId: selectedMseId,
                matches: res.data.matches.length
            });
            setMatches(res.data.matches);
        } catch (err) { 
            setMatches([]); 
            showToast(t('error_occurred'), 'error');
        }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchMatches(); }, [selectedMseId]);

    const handlePartnershipAction = async (partnershipId: number, action: 'approve' | 'reject') => {
        try {
            await axios.post(`${config.API_BASE_URL}/partnerships/${partnershipId}/action?action=${action}`);
            showToast(`Request ${action === 'approve' ? 'approved' : 'rejected'}`, 'success');
            fetchMatches();
        } catch (err) {
            showToast('Action failed', 'error');
        }
    };

    const handleAssign = async (snpId: number) => {
        const match = matches.find(m => m.snp_id === snpId);
        if (match?.partnership_status === 'pending' && !match.mse_consent && match.partnership_id) {
            handlePartnershipAction(match.partnership_id, 'approve');
            return;
        }
        try {
            await axios.post(`${config.API_BASE_URL}/matching/assign?mse_id=${selectedMseId}&snp_id=${snpId}`);
            setAssignedSnpId(snpId);
            setTimeout(() => setAssignedSnpId(null), 3000);
            showToast('Connection request sent', 'success');
            fetchMatches();
        } catch (err) {
            showToast('Failed to connect', 'error');
        }
    };

    const activeMse = mses.find(m => m.mse_id === selectedMseId);
    const filteredMatches = matches.filter(m => 
        m.snp_name.toLowerCase().includes(searchTerm.toLowerCase()) && 
        m.score >= minScore
    );

    const inboundRequests = matches.filter(m => m.partnership_status === 'pending' && !m.mse_consent);

    return (
        <div className="w-full space-y-6 pb-10">

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-slate-900">{t('partners')}</h1>
                    <p className="text-slate-500 text-sm mt-0.5">{activeMse?.name}</p>
                </div>
                <button onClick={fetchMatches}
                    className="p-2 text-slate-400 hover:text-slate-700 hover:bg-white border border-transparent hover:border-slate-200 rounded-xl transition-all">
                    <RefreshCcw size={18} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            {/* Inbound requests */}
            {inboundRequests.length > 0 && (
                <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
                        <span className="font-bold text-orange-900 text-sm uppercase tracking-wider">
                            Action Required: Connection Requests
                        </span>
                    </div>
                    <div className="space-y-3">
                        {inboundRequests.map(match => (
                            <div key={match.snp_id} className="bg-white rounded-xl border border-orange-100 px-5 py-4 flex flex-col md:flex-row md:items-center gap-4">
                                <div className="flex items-center gap-4 flex-1">
                                    <div className="w-10 h-10 rounded-xl bg-[#002147] text-white flex items-center justify-center font-bold text-sm shrink-0">
                                        {match.snp_name[0]}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-slate-900">{match.snp_name}</p>
                                        <p className="text-[10px] text-slate-500 mt-0.5 uppercase font-black tracking-widest">{match.score.toFixed(0)}% Compatibility</p>
                                    </div>
                                </div>

                                {/* Progress Tracker */}
                                <div className="flex items-center gap-3 flex-1 px-4">
                                    <div className="flex flex-col items-center gap-1">
                                        <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                                            <Check size={12} />
                                        </div>
                                        <span className="text-[8px] font-black text-slate-400 uppercase">Partner Sent</span>
                                    </div>
                                    <div className="flex-1 h-[1px] bg-slate-200 mb-3" />
                                    <div className="flex flex-col items-center gap-1">
                                        <div className="w-5 h-5 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-300">
                                            <Clock size={10} />
                                        </div>
                                        <span className="text-[8px] font-black text-slate-400 uppercase">Your Approval</span>
                                    </div>
                                </div>

                                <div className="flex gap-2 shrink-0">
                                    <button onClick={() => match.partnership_id && handlePartnershipAction(match.partnership_id, 'reject')}
                                        className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-red-600 transition-all">
                                        Decline
                                    </button>
                                    <button onClick={() => match.partnership_id && handlePartnershipAction(match.partnership_id, 'approve')}
                                        className="px-6 py-2 text-xs font-black uppercase tracking-widest text-white bg-[#002147] rounded-xl hover:bg-emerald-600 transition-all shadow-md active:scale-95">
                                        Connect Now
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Search + filter */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap items-center gap-4">
                <div className="flex-1 min-w-52 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                    <input type="text" placeholder={t('search_placeholder')} value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 pl-9 pr-4 text-sm outline-none focus:border-slate-400 transition-all" />
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-500">{t('min_score')}</span>
                    <input type="range" min="0" max="100" value={minScore}
                        onChange={e => setMinScore(Number(e.target.value))}
                        className="w-24 accent-[#002147]" />
                    <span className="text-xs font-semibold text-slate-700 w-8">{minScore}%</span>
                </div>
            </div>

            {/* Results table */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-3">
                    <div className="w-8 h-8 border-2 border-slate-200 border-t-[#002147] rounded-full animate-spin" />
                    <p className="text-sm text-slate-400">{t('scanning_nodes')}</p>
                </div>
            ) : (
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                    <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Sparkles size={14} className="text-emerald-500" />
                            <span className="font-semibold text-slate-900 text-sm">{t('compatibility_audit')}</span>
                        </div>
                        <span className="text-xs text-slate-400">{filteredMatches.length} results</span>
                    </div>

                    {filteredMatches.length === 0 ? (
                        <div className="py-16 text-center">
                            <Users size={32} className="text-slate-200 mx-auto mb-3" />
                            <p className="text-sm text-slate-500 font-medium">{t('no_partners')}</p>
                            <p className="text-xs text-slate-400 mt-1">Try adjusting your search or minimum match score.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {filteredMatches.map((match, index) => {
                                const score = Math.round(match.score);
                                const status = statusLabel(match, t);
                                return (

                                    <div key={match.snp_id}
                                        className={`px-5 py-4 flex items-start gap-4 hover:bg-slate-50 transition-colors ${match.partnership_status === 'rejected' ? 'opacity-50' : ''}`}>

                                        {/* Avatar + rank */}
                                        <div className="relative shrink-0">
                                            <div className="w-10 h-10 rounded-xl bg-[#002147] text-white flex items-center justify-center font-bold text-sm">
                                                {match.snp_name[0]}
                                            </div>
                                            {index === 0 && (
                                                <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center">
                                                    <Trophy size={10} className="text-white" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-sm font-semibold text-slate-900">{match.snp_name}</span>
                                                <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${status.color}`}>{status.text}</span>
                                            </div>
                                            <p className="text-xs text-slate-500 mt-1 leading-relaxed line-clamp-2">{match.reason}</p>
                                            {match.partnership_status && (
                                                <p className="text-[10px] text-slate-400 mt-1 italic">
                                                    Initiated by {match.initiated_by === 'mse' ? 'you' : match.initiated_by === 'system' ? 'AI Suggestion' : 'Partner'} on {match.initiated_at ? new Date(match.initiated_at).toLocaleDateString() : 'N/A'}
                                                </p>
                                            )}
                                        </div>

                                        {/* Score */}
                                        <div className="text-center shrink-0 hidden sm:block">
                                            <div className={`text-lg font-bold ${score >= 85 ? 'text-emerald-600' : score >= 60 ? 'text-amber-600' : 'text-slate-500'}`}>
                                                {score}%
                                            </div>
                                            <div className="text-[10px] text-slate-400">{t('match_score')}</div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-2 shrink-0">
                                            {match.partnership_status === 'active' && (
                                                <button onClick={() => {
                                                    alert(`OFFICIAL PARTNERSHIP PROOF\n\nPartner: ${match.snp_name}\nStatus: ACTIVE\nStarted on: ${match.approved_at ? new Date(match.approved_at).toLocaleString() : 'N/A'}\nApproved by: ${match.approved_by || 'System'}\nInitiated by: ${match.initiated_by || 'Unknown'}\nInitiated at: ${match.initiated_at ? new Date(match.initiated_at).toLocaleString() : 'N/A'}`);
                                                }}
                                                    className="px-3 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 border border-blue-100 hover:bg-blue-100 rounded-lg transition-all">
                                                    View Proof
                                                </button>
                                            )}
                                            <button onClick={() => { setProfileSnpId(match.snp_id); setIsProfileOpen(true); }}
                                                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all"
                                                title={t('view_profile')}>
                                                <Eye size={15} />
                                            </button>

                                            {match.partnership_status === 'pending' && !match.mse_consent && match.partnership_id && (
                                                <button onClick={() => match.partnership_id && handlePartnershipAction(match.partnership_id, 'reject')}
                                                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                                                    <X size={15} />
                                                </button>
                                            )}

                                            <button
                                                disabled={!!assignedSnpId || match.partnership_status === 'active' || (match.partnership_status === 'pending' && match.mse_consent)}
                                                onClick={() => handleAssign(match.snp_id)}
                                                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all disabled:opacity-50 whitespace-nowrap
                                                    ${match.partnership_status === 'active'
                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                        : match.partnership_status === 'pending' && match.mse_consent
                                                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                                        : match.partnership_status === 'pending' && !match.mse_consent
                                                        ? 'bg-[#002147] text-white hover:bg-emerald-600'
                                                        : 'bg-[#002147] text-white hover:bg-[#003366]'
                                                    }`}>
                                                {match.partnership_status === 'active' ? t('integrated')
                                                    : match.partnership_status === 'pending' && match.mse_consent ? t('sent')
                                                    : match.partnership_status === 'pending' && !match.mse_consent ? t('approve')
                                                    : t('request')}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {profileSnpId && (
                <SNPProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} snpId={profileSnpId} />
            )}
        </div>
    );
}
