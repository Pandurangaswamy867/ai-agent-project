import { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Users, CheckCircle2,
    MapPin, Search,
    Clock, Plus, Download, Edit2, TrendingUp, X
} from 'lucide-react';
import config from '../../config';
import TransactionModal from './TransactionModal';
import SNPProfileEditModal from './SNPProfileEditModal';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import type { SNP, Partnership, SNPPerformanceData, SNPTrendDay } from '../../types';

const EMPTY_PERFORMANCE: SNPPerformanceData = {
    total_volume: 0, active_mses: 0, growth_rate: '+0.0%',
    fulfillment_index: '0.0%', settlement_velocity: 'N/A',
    capacity: 0, current_load: 0, capacity_pct: 0,
    rating: 0, type: '', commission_rate: 0,
    supported_sectors: '[]', avg_feedback: 0, feedback_count: 0,
};

function StarRow({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'lg' }) {
    const sz = size === 'lg' ? 'text-xl' : 'text-sm';
    return (
        <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map(i => (
                <span key={i} className={`${sz} ${i <= Math.round(rating) ? 'text-amber-400' : 'text-slate-200'}`}>★</span>
            ))}
            <span className="text-xs text-slate-500 ml-1 font-semibold">{rating != null ? rating.toFixed(1) : '—'}</span>
        </div>
    );
}

function parseJsonList(raw: string | undefined | null): string[] {
    try { return JSON.parse(raw || '[]'); } catch { return []; }
}

export default function SNPDashboard() {
    const { userId, profileId, role } = useAuth();
    const { showToast } = useToast();
    const activeSnpId = profileId;

    const [partnerships, setPartnerships] = useState<Partnership[]>([]);
    const [performance, setPerformance] = useState<SNPPerformanceData>(EMPTY_PERFORMANCE);
    const [trend, setTrend] = useState<SNPTrendDay[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isTxModalOpen, setIsTxModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [proofPartnership, setProofPartnership] = useState<Partnership | null>(null);
    const [txTargetMse, setTxTargetMse] = useState<{ id: number; name: string } | null>(null);
    const [snpData, setSnpData] = useState<SNP | null>(null);
    const [snpStatus, setSnpStatus] = useState('active');
    const [activeTab, setActiveTab] = useState<'partners' | 'handshakes'>('partners');

    useEffect(() => {
        if (activeSnpId) {
            fetchPartnerships();
            fetchPerformance();
            fetchSnpData();
            fetchTrend();
        }
    }, [activeSnpId, profileId, role]);

    const fetchSnpData = async () => {
        if (!activeSnpId) return;
        try {
            const res = await axios.get(`${config.API_BASE_URL}/snps/${activeSnpId}`);
            setSnpData(res.data);
            setSnpStatus(res.data.status);
        } catch {
            showToast('Failed to load profile data', 'error');
        }
    };

    const fetchPerformance = async () => {
        if (!activeSnpId) return;
        try {
            const res = await axios.get(`${config.API_BASE_URL}/analytics/snp-performance/${activeSnpId}`);
            setPerformance(res.data);
        } catch {
            showToast('Failed to load performance metrics', 'error');
        }
    };

    const fetchTrend = async () => {
        if (!activeSnpId) return;
        try {
            const res = await axios.get(`${config.API_BASE_URL}/analytics/snp-trend/${activeSnpId}`);
            setTrend(res.data || []);
        } catch {
            // silent — chart just stays empty
        }
    };

    const fetchPartnerships = async () => {
        if (!activeSnpId) return;
        try {
            const res = await axios.get(`${config.API_BASE_URL}/partnerships/${activeSnpId}`);
            setPartnerships(res.data);
        } catch {
            showToast('Failed to load partners list', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (pId: number, action: 'approve' | 'reject') => {
        try {
            await axios.post(`${config.API_BASE_URL}/partnerships/${pId}/action?action=${action}`);
            showToast(`Request ${action === 'approve' ? 'approved' : 'rejected'}`, 'success');
            fetchPartnerships();
        } catch {
            showToast('Action failed. Please try again.', 'error');
        }
    };

    const handleCreateTransaction = (mseId: number, mseName: string) => {
        setTxTargetMse({ id: mseId, name: mseName });
        setIsTxModalOpen(true);
    };

    const toggleSnpStatus = async () => {
        if (!activeSnpId) return;
        const newStatus = snpStatus === 'active' ? 'inactive' : 'active';
        try {
            await axios.put(`${config.API_BASE_URL}/snps/${activeSnpId}/status?status=${newStatus}`);
            setSnpStatus(newStatus);
            showToast(`Status updated to ${newStatus}`, 'success');
        } catch {
            showToast('Failed to update status. Please try again.', 'error');
        }
    };

    const handleExportCSV = () => {
        if (!partnerships || partnerships.length === 0) {
            showToast('No data to export.', 'error');
            return;
        }
        const exportData = partnerships.map(p => ({
            'Partnership ID': p.partnership_id,
            'MSE Name': p.mse?.name || 'Unknown',
            'Location': `${p.mse?.city}, ${p.mse?.state}`,
            'Match Score': p.match_score != null ? `${p.match_score.toFixed(0)}%` : '—',
            'AI Reasoning': p.ai_reasoning,
            'Status': p.status,
            'Created At': p.created_at,
        }));
        const headers = Object.keys(exportData[0]).join(',');
        const rows = exportData.map(obj =>
            Object.values(obj).map(val => `"${String(val).replace(/"/g, '""')}"`).join(',')
        ).join('\n');
        const link = document.createElement('a');
        link.setAttribute('href', encodeURI(`data:text/csv;charset=utf-8,${headers}\n${rows}`));
        link.setAttribute('download', `partnerships_${Date.now()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const pendingCount = partnerships.filter(p => p.status === 'pending').length;
    const supportedSectors = parseJsonList(snpData?.supported_sectors);
    const pincodes = parseJsonList(snpData?.pincode_expertise);
    const estimatedCommission = (performance.total_volume * (performance.commission_rate || 0)) / 100;
    const maxTrendVol = trend.length > 0 ? Math.max(...trend.map(d => d.volume), 1) : 1;
    const capacityColor = performance.capacity_pct >= 90 ? 'bg-red-500' : performance.capacity_pct >= 70 ? 'bg-amber-500' : 'bg-emerald-500';
    const capacityBadge = performance.capacity_pct >= 90 ? 'bg-red-50 text-red-700' : performance.capacity_pct >= 70 ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700';

    if (!activeSnpId) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center text-center space-y-5 py-20">
                <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center">
                    <Users className="text-slate-400" size={28} />
                </div>
                <div>
                    <h2 className="text-lg font-semibold text-slate-900">Access Denied</h2>
                    <p className="text-slate-500 text-sm mt-1">Please login as a Network Partner to access this dashboard.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full space-y-6 pb-10">

            {/* Header — 4A */}
            <div className="flex items-start justify-between flex-wrap gap-3">
                <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className="w-12 h-12 bg-[#002147] rounded-2xl flex items-center justify-center text-white font-bold text-xl shrink-0">
                        {snpData?.name?.[0]?.toUpperCase() || 'N'}
                    </div>
                    <div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <h1 className="text-xl font-bold text-slate-900">{snpData?.name || 'Network Partner'}</h1>
                            {snpData?.type && (
                                <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full uppercase tracking-widest">
                                    {snpData.type}
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                            <span className="text-xs text-slate-500 flex items-center gap-1">
                                <MapPin size={10} /> {snpData?.city || '—'}
                            </span>
                            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                                ★ {snpData?.rating?.toFixed(1) || '—'} / 5.0
                            </span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <button onClick={toggleSnpStatus}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${snpStatus === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                        {snpStatus === 'active' ? 'Accepting partners' : 'Paused'}
                    </button>
                    <button onClick={() => setIsEditModalOpen(true)}
                        className="p-2 text-slate-400 hover:text-slate-700 hover:bg-white border border-transparent hover:border-slate-200 rounded-lg transition-all"
                        title="Edit profile">
                        <Edit2 size={16} />
                    </button>
                    <button onClick={handleExportCSV}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-all">
                        <Download size={15} /> Export
                    </button>
                    <button onClick={() => setIsTxModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-[#002147] text-white rounded-lg text-sm font-semibold hover:bg-[#003366] transition-all">
                        <Plus size={15} /> Add payment
                    </button>
                </div>
            </div>

            {/* Supported Sectors — 4G */}
            {supportedSectors.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {supportedSectors.map((sector, i) => (
                        <span key={i} className="text-xs font-medium bg-slate-100 text-slate-600 px-3 py-1 rounded-full">
                            {sector}
                        </span>
                    ))}
                </div>
            )}

            {/* Stats grid — 4B (5 cards) */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-white border border-slate-200 rounded-2xl p-5">
                    <div className="text-2xl font-bold text-slate-900">{performance.active_mses}</div>
                    <div className="text-xs text-slate-500 mt-0.5">Active enterprises</div>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-5">
                    <div className="flex items-start justify-between">
                        <div className="text-2xl font-bold text-slate-900">₹{performance.total_volume.toLocaleString('en-IN')}</div>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ml-1 ${performance.growth_rate.startsWith('+') ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                            {performance.growth_rate}
                        </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">Transaction volume</div>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-5">
                    <div className="text-2xl font-bold text-slate-900">{performance.fulfillment_index}</div>
                    <div className="text-xs text-slate-500 mt-0.5">Fulfillment rate</div>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-5">
                    <div className="text-2xl font-bold text-slate-900">{performance.settlement_velocity}</div>
                    <div className="text-xs text-slate-500 mt-0.5">Avg settlement time</div>
                </div>
                {/* Capacity card */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5">
                    <div className="flex items-start justify-between mb-2">
                        <div className="text-2xl font-bold text-slate-900">{performance.capacity_pct?.toFixed(0) ?? '0'}%</div>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ml-1 ${capacityBadge}`}>
                            {Math.max(performance.capacity - performance.current_load, 0)} free
                        </span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mb-1.5">
                        <div className={`h-full rounded-full transition-all ${capacityColor}`}
                            style={{ width: `${Math.min(performance.capacity_pct, 100)}%` }} />
                    </div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Capacity</div>
                </div>
            </div>

            {/* 7-Day Trend Chart — 4C */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-5">
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                        <TrendingUp size={16} className="text-teal-600" /> 7-Day Transaction Trend
                    </h3>
                    {trend.length > 0 && (
                        <span className="text-xs text-slate-400">
                            {trend.reduce((s, d) => s + d.count, 0)} txns · ₹{trend.reduce((s, d) => s + d.volume, 0).toLocaleString('en-IN')}
                        </span>
                    )}
                </div>
                {trend.length > 0 ? (
                    <div className="flex items-end gap-1.5 h-20">
                        {trend.map((day, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                                <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                    ₹{day.volume.toLocaleString('en-IN')} · {day.count} txns
                                </div>
                                <div
                                    className="w-full bg-teal-600 hover:bg-teal-500 rounded-t-sm transition-colors cursor-default"
                                    style={{ height: `${Math.max((day.volume / maxTrendVol) * 100, 5)}%` }}
                                />
                                <span className="text-[9px] text-slate-400 font-medium shrink-0">
                                    {new Date(day.date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short' })}
                                </span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="h-20 flex items-center justify-center">
                        <p className="text-slate-400 text-sm">No transaction data for this period</p>
                    </div>
                )}
            </div>

            {/* Commission & Coverage — 4D */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white border border-slate-200 rounded-2xl p-6">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Estimated Commission Earnings</p>
                    <div className="text-3xl font-black text-slate-900">
                        ₹{Math.round(estimatedCommission).toLocaleString('en-IN')}
                    </div>
                    <p className="text-xs text-slate-400 mt-1.5">
                        ₹{performance.total_volume.toLocaleString('en-IN')} volume × {performance.commission_rate}% rate
                    </p>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-6">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Coverage Areas</p>
                    {pincodes.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {pincodes.map((pin, i) => (
                                <span key={i} className="text-xs font-mono font-bold bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg">
                                    {pin}
                                </span>
                            ))}
                        </div>
                    ) : (
                        <p className="text-slate-400 text-sm">No coverage areas specified</p>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-6 border-b border-slate-100">
                <button onClick={() => setActiveTab('partners')}
                    className={`pb-3 text-sm font-bold transition-all relative ${activeTab === 'partners' ? 'text-[#002147]' : 'text-slate-400 hover:text-slate-600'}`}>
                    Connected Businesses
                    {activeTab === 'partners' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#002147]" />}
                </button>
                <button onClick={() => setActiveTab('handshakes')}
                    className={`pb-3 text-sm font-bold transition-all relative ${activeTab === 'handshakes' ? 'text-[#002147]' : 'text-slate-400 hover:text-slate-600'}`}>
                    New Requests
                    {pendingCount > 0 && <span className="ml-2 px-1.5 py-0.5 bg-orange-500 text-white text-[10px] rounded-full">{pendingCount}</span>}
                    {activeTab === 'handshakes' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#002147]" />}
                </button>
            </div>

            {activeTab === 'partners' ? (
                /* Partners table — with feedback column (4F) */
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-4 flex-wrap">
                        <span className="font-semibold text-slate-900 text-sm">
                            Partners
                            <span className="ml-2 text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{partnerships.filter(p => p.status === 'active').length}</span>
                        </span>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                            <input placeholder="Search enterprise…" value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="bg-slate-50 border border-slate-200 rounded-lg py-2 pl-8 pr-4 text-sm outline-none focus:border-slate-400 transition-all w-52" />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-slate-100 text-xs text-slate-400 font-medium">
                                    <th className="px-5 py-3">Enterprise</th>
                                    <th className="px-5 py-3">Match</th>
                                    <th className="px-5 py-3">Sector</th>
                                    <th className="px-5 py-3">Status</th>
                                    <th className="px-5 py-3">Feedback</th>
                                    <th className="px-5 py-3 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="px-5 py-16 text-center">
                                            <div className="w-6 h-6 border-2 border-slate-200 border-t-[#002147] rounded-full animate-spin mx-auto mb-3" />
                                            <p className="text-sm text-slate-400">Loading partners…</p>
                                        </td>
                                    </tr>
                                ) : partnerships.filter(p => p.status === 'active').length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-5 py-16 text-center">
                                            <Users size={32} className="text-slate-200 mx-auto mb-3" />
                                            <p className="text-sm font-medium text-slate-700">No active partners yet</p>
                                            <p className="text-xs text-slate-400 mt-1">Accept connection requests to see them here.</p>
                                        </td>
                                    </tr>
                                ) : partnerships
                                    .filter(p => p.status === 'active' && (p.mse?.name || '').toLowerCase().includes(searchTerm.toLowerCase()))
                                    .map((p) => (
                                        <tr key={p.partnership_id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-xl bg-[#002147] text-white flex items-center justify-center font-bold text-sm shrink-0">
                                                        {p.mse?.name?.[0] || '?'}
                                                    </div>
                                                    <div>
                                                        <div className="text-slate-900 font-semibold text-sm">{p.mse?.name}</div>
                                                        <div className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
                                                            <MapPin size={10} /> {p.mse?.city}, {p.mse?.state}
                                                        </div>
                                                        <div className="text-[10px] text-slate-400 mt-1 italic">
                                                            Connected {p.approved_at ? new Date(p.approved_at).toLocaleDateString() : 'N/A'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                        <div className="h-full bg-[#002147] rounded-full" style={{ width: `${p.match_score}%` }} />
                                                    </div>
                                                    <span className={`text-xs font-semibold ${(p.match_score ?? 0) >= 85 ? 'text-emerald-600' : (p.match_score ?? 0) >= 60 ? 'text-amber-600' : 'text-slate-500'}`}>
                                                        {p.match_score != null ? `${p.match_score.toFixed(0)}%` : '—'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{p.mse?.sector || 'General'}</span>
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                                                    <CheckCircle2 size={11} /> Connected
                                                </span>
                                            </td>
                                            {/* Feedback column — 4F */}
                                            <td className="px-5 py-4">
                                                {p.feedback_rating !== null ? (
                                                    <StarRow rating={p.feedback_rating!} />
                                                ) : (
                                                    <span className="text-xs text-slate-300">No feedback</span>
                                                )}
                                            </td>
                                            <td className="px-5 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button onClick={() => setProofPartnership(p)}
                                                        className="px-3 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 border border-blue-100 hover:bg-blue-100 rounded-lg transition-all">
                                                        Details
                                                    </button>
                                                    <button onClick={() => handleCreateTransaction(p.mse_id, p.mse?.name || 'Unknown')}
                                                        className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-all">
                                                        Add payment
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                /* Requests list */
                <div className="space-y-4">
                    {partnerships.filter(p => p.status === 'pending').length === 0 ? (
                        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
                            <Clock size={32} className="text-slate-200 mx-auto mb-3" />
                            <p className="text-sm font-medium text-slate-700">No new requests</p>
                            <p className="text-xs text-slate-400 mt-1">You are all caught up with your connections.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {partnerships.filter(p => p.status === 'pending').map(p => (
                                <div key={p.partnership_id} className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col md:flex-row md:items-center gap-6">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-[#002147]">
                                                {p.mse?.name?.[0]}
                                            </div>
                                            <h4 className="font-bold text-slate-900">{p.mse?.name}</h4>
                                        </div>
                                        <div className="flex items-center gap-4 text-xs text-slate-500">
                                            <span className="flex items-center gap-1"><MapPin size={12} /> {p.mse?.city}</span>
                                            <span className="flex items-center gap-1"><Clock size={12} /> Requested {new Date(p.initiated_at || p.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 flex-1 max-w-md">
                                        <div className="flex-1 h-1 bg-slate-100 rounded-full relative overflow-hidden">
                                            <div className={`h-full transition-all duration-1000 ${p.mse_consent && p.snp_consent ? 'bg-emerald-500 w-full' : (p.mse_consent || p.snp_consent) ? 'bg-orange-400 w-1/2' : 'w-0'}`} />
                                        </div>
                                        <div className="flex items-center gap-4 shrink-0">
                                            <div className="flex flex-col items-center gap-1">
                                                <div className={`w-5 h-5 rounded-full flex items-center justify-center border ${p.mse_consent ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-slate-200 text-slate-300'}`}>
                                                    <CheckCircle2 size={12} />
                                                </div>
                                                <span className="text-[9px] font-bold uppercase text-slate-400">Business</span>
                                            </div>
                                            <div className="w-4 h-[1px] bg-slate-200 mt-[-10px]" />
                                            <div className="flex flex-col items-center gap-1">
                                                <div className={`w-5 h-5 rounded-full flex items-center justify-center border ${p.snp_consent ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-slate-200 text-slate-300'}`}>
                                                    <CheckCircle2 size={12} />
                                                </div>
                                                <span className="text-[9px] font-bold uppercase text-slate-400">Partner</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button onClick={() => handleAction(p.partnership_id, 'reject')}
                                            className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-red-600 transition-colors">
                                            Decline
                                        </button>
                                        <button onClick={() => handleAction(p.partnership_id, 'approve')}
                                            disabled={p.snp_consent}
                                            className={`px-6 py-2 rounded-xl text-sm font-black uppercase tracking-widest transition-all ${p.snp_consent ? 'bg-slate-100 text-slate-400' : 'bg-[#002147] text-white hover:bg-emerald-600 shadow-md active:scale-95'}`}>
                                            {p.snp_consent ? 'Waiting for Business' : 'Accept Request'}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ── Modals ─────────────────────────────────────────────── */}

            {/* Partnership Certificate Modal — 4E */}
            {proofPartnership && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setProofPartnership(null)}>
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-[#002147] text-white flex items-center justify-center font-bold text-lg">
                                    {proofPartnership.mse?.name?.[0] || '?'}
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900">Partnership Certificate</h3>
                                    <p className="text-xs text-slate-500">{proofPartnership.mse?.name}</p>
                                </div>
                            </div>
                            <button onClick={() => setProofPartnership(null)} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg transition-colors">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Connected Since</p>
                                    <p className="text-sm font-semibold text-slate-900 mt-0.5">
                                        {proofPartnership.approved_at ? new Date(proofPartnership.approved_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'N/A'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Match Score</p>
                                    <p className="text-sm font-semibold text-slate-900 mt-0.5">{proofPartnership.match_score != null ? `${proofPartnership.match_score.toFixed(0)}%` : '—'}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Approved By</p>
                                    <p className="text-sm font-semibold text-slate-900 mt-0.5 capitalize">{proofPartnership.approved_by || 'System'}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</p>
                                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full mt-0.5">
                                        <CheckCircle2 size={10} /> Active
                                    </span>
                                </div>
                            </div>

                            {proofPartnership.feedback_rating !== null && (
                                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Enterprise Feedback</p>
                                    <StarRow rating={proofPartnership.feedback_rating!} size="lg" />
                                    {proofPartnership.feedback_text && (
                                        <p className="text-sm text-slate-600 italic mt-2">"{proofPartnership.feedback_text}"</p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {isTxModalOpen && (
                <TransactionModal
                    isOpen={isTxModalOpen}
                    onClose={() => { setIsTxModalOpen(false); setTxTargetMse(null); }}
                    mseId={txTargetMse?.id}
                    mseName={txTargetMse?.name}
                    snpId={activeSnpId || 0}
                    onSuccess={() => {
                        fetchPerformance();
                        fetchTrend();
                        showToast('Payment recorded successfully', 'success');
                    }}
                />
            )}

            {isEditModalOpen && (
                <SNPProfileEditModal
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    snpId={activeSnpId || 0}
                    initialData={snpData}
                    onSuccess={() => {
                        fetchSnpData();
                        showToast('Profile updated successfully', 'success');
                    }}
                />
            )}
        </div>
    );
}
