import { useState, useEffect } from 'react';
import axios from 'axios';
import {
    BarChart3, Users, Zap, TrendingUp,
    MapPin, Search, ChevronRight, Briefcase, ArrowUpRight
} from 'lucide-react';
import config from '../../config';
import type { SNP, SNPPerformanceData } from '../../types';

export default function SNPPerformance() {
    const [snps, setSnps] = useState<SNP[]>([]);
    const [selectedSnp, setSelectedSnp] = useState<SNP | null>(null);
    const [performance, setPerformance] = useState<SNPPerformanceData | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await axios.get(`${config.API_BASE_URL}/snps/`);
                setSnps(res.data);
                if (res.data.length > 0) handleSelectSnp(res.data[0]);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleSelectSnp = async (snp: SNP) => {
        setSelectedSnp(snp);
        try {
            const res = await axios.get(`${config.API_BASE_URL}/analytics/snp-performance/${snp.snp_id}`);
            setPerformance(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const filtered = snps.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const parseJsonList = (jsonStr: string | null) => {
        if (!jsonStr) return [];
        try {
            const parsed = JSON.parse(jsonStr);
            return Array.isArray(parsed) ? parsed : [jsonStr];
        } catch {
            return (jsonStr || '').split(',').map(s => s.trim()).filter(Boolean);
        }
    };

    return (
        <div className="w-full space-y-6 pb-10">

            <div>
                <h1 className="text-xl font-bold text-slate-900">Partner performance</h1>
                <p className="text-slate-500 text-sm mt-0.5">View metrics for each network partner.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

                {/* SNP list */}
                <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col" style={{ height: '600px' }}>
                    <div className="p-4 border-b border-slate-100">
                        <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-2 text-sm outline-none focus:border-slate-400 transition-all"
                                placeholder="Search partners…" />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-3 space-y-1">
                        {loading ? (
                            Array(5).fill(0).map((_, i) => (
                                <div key={i} className="h-14 bg-slate-50 rounded-xl animate-pulse" />
                            ))
                        ) : filtered.map((snp: SNP) => (
                            <button key={snp.snp_id} onClick={() => handleSelectSnp(snp)}
                                className={`w-full text-left px-4 py-3 rounded-xl flex items-center justify-between transition-all ${selectedSnp?.snp_id === snp.snp_id ? 'bg-[#002147] text-white' : 'hover:bg-slate-50 text-slate-700'}`}>
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${selectedSnp?.snp_id === snp.snp_id ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-600'}`}>
                                        {snp.name[0]}
                                    </div>
                                    <div>
                                        <div className={`text-sm font-semibold ${selectedSnp?.snp_id === snp.snp_id ? 'text-white' : 'text-slate-900'}`}>{snp.name}</div>
                                        <div className={`text-xs ${selectedSnp?.snp_id === snp.snp_id ? 'text-white/50' : 'text-slate-400'}`}>{snp.city}</div>
                                    </div>
                                </div>
                                <ChevronRight size={14} className={selectedSnp?.snp_id === snp.snp_id ? 'text-white/50' : 'text-slate-300'} />
                            </button>
                        ))}
                    </div>
                </div>

                {/* Performance detail */}
                <div className="lg:col-span-8 space-y-5">
                    {selectedSnp && performance ? (
                        <>
                            {/* Stat cards */}
                            <div className="grid grid-cols-3 gap-4">
                                {[
                                    { label: 'Transaction volume', value: `₹${performance.total_volume.toLocaleString('en-IN')}`, icon: BarChart3, trend: performance.growth_rate },
                                    { label: 'Active enterprises', value: performance.active_mses, icon: Users, trend: '+5.4%' },
                                    { label: 'Fulfillment rate', value: performance.fulfillment_index, icon: Zap, trend: 'Stable' },
                                ].map((card, i) => (
                                    <div key={i} className="bg-white border border-slate-200 rounded-2xl p-5">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center">
                                                <card.icon size={16} className="text-slate-500" />
                                            </div>
                                            <span className="text-xs font-medium text-emerald-600 flex items-center gap-0.5">
                                                <ArrowUpRight size={12} /> {card.trend}
                                            </span>
                                        </div>
                                        <div className="text-xl font-bold text-slate-900">{card.value}</div>
                                        <div className="text-xs text-slate-400 mt-0.5">{card.label}</div>
                                    </div>
                                ))}
                            </div>

                            {/* Detail panel */}
                            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-base font-bold text-slate-900">{selectedSnp.name}</h3>
                                        <p className="text-xs text-slate-400 mt-0.5">{selectedSnp.type}</p>
                                    </div>
                                    <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-lg">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                        <span className="text-xs font-medium text-emerald-700">Rating: {selectedSnp.rating}/5.0</span>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                                            <span>Onboarding rate</span>
                                            <span className="font-medium text-slate-700">4.2 enterprises / day</span>
                                        </div>
                                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-[#002147] rounded-full" style={{ width: '75%' }} />
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                                            <span>Settlement time</span>
                                            <span className="font-medium text-slate-700">{performance.settlement_velocity}</span>
                                        </div>
                                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: '90%' }} />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                                        <MapPin size={14} className="text-slate-400 mb-2" />
                                        <div className="text-xs text-slate-400 mb-0.5">Coverage</div>
                                        <div className="text-sm font-medium text-slate-800">
                                            {parseJsonList(selectedSnp.pincode_expertise).join(', ') || 'National'}
                                        </div>
                                    </div>
                                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                                        <Briefcase size={14} className="text-slate-400 mb-2" />
                                        <div className="text-xs text-slate-400 mb-0.5">Commission</div>
                                        <div className="text-sm font-medium text-slate-800">{selectedSnp.commission_rate}%</div>
                                    </div>
                                </div>

                                {selectedSnp.supported_sectors && (
                                    <div>
                                        <p className="text-xs text-slate-400 mb-2">Sectors served</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {parseJsonList(selectedSnp.supported_sectors).map((s: string) => (
                                                <span key={s} className="px-2.5 py-1 bg-slate-100 text-slate-600 text-xs rounded-full">{s}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="h-80 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-center p-10">
                            <TrendingUp size={32} className="text-slate-200 mb-3" />
                            <p className="text-sm font-medium text-slate-500">Select a partner to see their metrics</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
