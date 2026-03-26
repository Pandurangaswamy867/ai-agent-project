import { useTranslation } from "react-i18next";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useState, useEffect, useRef } from 'react';
import { Link, Navigate } from 'react-router-dom';
import axios from 'axios';
import {
    Users, Package, CreditCard, ShieldCheck,
    Building2, Download, TrendingUp, MapPin, Clock, Check, X, Sparkles, Globe, RefreshCcw, Bell, FileCheck
} from 'lucide-react';
import config from '../../config';
import { useMSE } from '../../context/MSEContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/UI/Button';
import { Card, CardBody } from '../../components/UI/Card';
import type { Partnership, Transaction } from '../../types';

type SalesTrendDay = { date: string; sales: number; orders: number };
type Performance = { revenue: number; orders: number; avg_value: number; settlement_delay: string };
type Compliance = {
    overall_status: 'compliant' | 'partial' | 'non_compliant';
    registration: { status: string; label: string };
    documents: { total: number; verified: number; pending: number; failed: number };
    claims: { total: number; verified: number; pending: number; rejected: number };
};
type Activity = { type: string; title: string; content: string; timestamp: string };

function StatusIcon({ status, total = -1 }: { status: string; total?: number }) {
    if (total === 0)
        return <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center"><span className="text-slate-300 text-xs font-bold">—</span></div>;
    if (status === 'approved' || status === 'verified')
        return <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center"><Check size={11} className="text-emerald-600" /></div>;
    if (status === 'rejected')
        return <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center"><X size={11} className="text-red-600" /></div>;
    return <div className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center"><Clock size={11} className="text-amber-600" /></div>;
}

function activityDot(type: string) {
    if (type === 'transaction') return 'bg-emerald-500';
    if (type === 'partnership') return 'bg-blue-500';
    return 'bg-amber-500';
}

export default function HomeDashboard() {
    const { selectedMseId, mses } = useMSE();
    const { role } = useAuth();
    const { showToast } = useToast();

    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [counts, setCounts] = useState({ snps: 0, products: 0, claims: 0, total_tx: 0, verified_tx: 0 });
    const [insights, setInsights] = useState<any[]>([]);
    const [trustScore, setTrustScore] = useState<number | null>(null);
    const [salesTrend, setSalesTrend] = useState<SalesTrendDay[]>([]);
    const [performance, setPerformance] = useState<Performance | null>(null);
    const [compliance, setCompliance] = useState<Compliance | null>(null);
    const [mseActivities, setMseActivities] = useState<Activity[]>([]);
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [inboundPartnerships, setInboundPartnerships] = useState<Partnership[]>([]);
    const [outboundPartnerships, setOutboundPartnerships] = useState<Partnership[]>([]);

    const activeMse = mses.find(m => m.mse_id === selectedMseId);
    const [editFormData, setEditFormData] = useState<any>(null);
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (activeMse) {
            setEditFormData({
                name: activeMse.name,
                contact_person: activeMse.contact_person,
                email: activeMse.email,
                phone: activeMse.phone,
                address: activeMse.address,
                city: activeMse.city,
                state: activeMse.state,
                pincode: activeMse.pincode,
                sector: activeMse.sector,
                description: activeMse.description
            });
        }
    }, [activeMse]);

    useEffect(() => {
        if (role === 'snp') return;

        const fetchData = async () => {
            if (!selectedMseId) {
                if (role === 'mse' || mses.length === 0) setIsInitialLoading(false);
                return;
            }

            try {
                const canViewMseScoped = role === 'mse' || role === 'nsic' || role === 'admin';

                const [snpsRes, productsRes, ledgerRes, insightsRes, salesTrendRes, performanceRes, complianceRes, activitiesRes] = await Promise.all([
                    axios.get(`${config.API_BASE_URL}/snps/`),
                    canViewMseScoped
                        ? axios.get(`${config.API_BASE_URL}/products/${selectedMseId}/products`).catch(() => ({ data: [] }))
                        : Promise.resolve({ data: [] }),
                    axios.get(`${config.API_BASE_URL}/transactions/?mse_id=${selectedMseId}`).catch(() => ({ data: [] })),
                    canViewMseScoped
                        ? axios.get(`${config.API_BASE_URL}/matching/${selectedMseId}/insights`).catch(() => ({ data: [] }))
                        : Promise.resolve({ data: [] }),
                    canViewMseScoped
                        ? axios.get(`${config.API_BASE_URL}/analytics/${selectedMseId}/sales_trend`).catch(() => ({ data: [] }))
                        : Promise.resolve({ data: [] }),
                    canViewMseScoped
                        ? axios.get(`${config.API_BASE_URL}/analytics/${selectedMseId}/performance`).catch(() => ({ data: null }))
                        : Promise.resolve({ data: null }),
                    canViewMseScoped
                        ? axios.get(`${config.API_BASE_URL}/analytics/mse-compliance/${selectedMseId}`).catch(() => ({ data: null }))
                        : Promise.resolve({ data: null }),
                    canViewMseScoped
                        ? axios.get(`${config.API_BASE_URL}/analytics/mse-activity/${selectedMseId}`).catch(() => ({ data: [] }))
                        : Promise.resolve({ data: [] }),
                ]);

                const partnersRes = await axios.get(`${config.API_BASE_URL}/partnerships/mse/${selectedMseId}`).catch(() => ({ data: [] }));
                const partnerData = partnersRes.data;
                const inbound = partnerData.filter((p: Partnership) => p.status === 'pending' && !p.mse_consent && p.snp_consent);
                const outbound = partnerData.filter((p: Partnership) => p.status === 'pending' && p.mse_consent && !p.snp_consent);
                setInboundPartnerships(inbound);
                setOutboundPartnerships(outbound);

                const txs: Transaction[] = ledgerRes.data;
                const verified = txs.filter((tx: Transaction) => tx.status === 'verified' || tx.status === 'completed').length;
                const pending = txs.filter((tx: Transaction) => tx.status === 'pending').length;

                let displaySnps = snpsRes.data.length;
                if (role === 'mse') {
                    displaySnps = partnerData.filter((p: Partnership) => p.status === 'active').length;
                }

                setCounts({ snps: displaySnps, products: productsRes.data.length, claims: pending, total_tx: txs.length, verified_tx: verified });
                setInsights(insightsRes.data);
                setTrustScore(txs.length > 0 ? Math.round((verified / txs.length) * 100) : null);
                setSalesTrend(salesTrendRes.data || []);
                setPerformance(performanceRes.data);
                setCompliance(complianceRes.data);
                setMseActivities(activitiesRes.data || []);
            } catch (err) {
                console.error("Dashboard Fetch Error:", err);
                showToast('Failed to load dashboard data', 'error');
            } finally {
                setIsInitialLoading(false);
            }
        };
        fetchData();
    }, [selectedMseId, role, mses.length]);

    const handleForceSync = () => {
        localStorage.removeItem('selectedMseId');
        localStorage.removeItem('authProfileId');
        window.location.reload();
    };

    const handleExportCSV = async () => {
        try {
            const res = await axios.get(`${config.API_BASE_URL}/analytics/${selectedMseId}/sales_trend/export`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `mse_${selectedMseId}_sales.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch {
            showToast('Export failed', 'error');
        }
    };

    if (role === 'snp') return <Navigate to="/snp/dashboard" replace />;
    if (role === 'nsic' || role === 'admin') return <Navigate to="/nsic" replace />;

    if (isInitialLoading) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center py-20">
                <div className="w-12 h-12 border-4 border-slate-100 border-t-[#002147] rounded-full animate-spin mb-4" />
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Synchronizing ONDC Context...</p>
            </div>
        );
    }

    if (!selectedMseId) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center text-center space-y-5 py-20">
                <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center">
                    <Building2 className="text-slate-500" size={28} />
                </div>
                <div>
                    <h2 className="text-lg font-semibold text-slate-900">Enterprise Context Required</h2>
                    <p className="text-slate-600 text-sm mt-1 max-w-xs">Select or register an enterprise to access the mission headquarters.</p>
                </div>
                <div className="flex flex-col gap-3">
                    <Link to="/onboarding" className="px-6 py-3 bg-[#002147] text-white font-bold rounded-xl text-sm hover:bg-[#003366] transition-all">
                        Register Enterprise
                    </Link>
                    <button onClick={handleForceSync} className="text-xs text-slate-400 hover:text-slate-600 font-bold uppercase tracking-widest flex items-center justify-center gap-2">
                        <RefreshCcw size={12} /> Force Sync Account
                    </button>
                </div>
            </div>
        );
    }

    const pendingPartnerCount = inboundPartnerships.length + outboundPartnerships.length;
    const maxVol = salesTrend.length > 0 ? Math.max(...salesTrend.map(d => d.sales), 1) : 1;
    const expansionInsight = insights.find((i: any) => i.type === 'expansion');
    const bannerContent = expansionInsight?.content ||
        `Explore growth opportunities in the ${activeMse?.sector || 'your'} sector across ${activeMse?.state || 'your region'}.`;

    return (
        <div className="w-full space-y-6 pb-10">

            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-[#1E3A8A] rounded-2xl flex items-center justify-center text-white shadow-lg">
                        <Building2 size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 leading-none">{activeMse?.name || 'Loading profile...'}</h1>
                        <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                                <MapPin size={10} aria-hidden="true" /> {activeMse?.city}, {activeMse?.state}
                            </span>
                            <span className="text-xs text-slate-300" aria-hidden="true">|</span>
                            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded uppercase tracking-wider">{activeMse?.sector}</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={handleForceSync}
                        className="p-2 text-slate-400 hover:text-slate-700 hover:bg-white border border-transparent hover:border-slate-200 rounded-xl transition-all"
                        title="Force Data Sync">
                        <RefreshCcw size={18} />
                    </button>
                    <Button variant="outline" size="sm" onClick={() => setIsEditingProfile(true)} aria-label="Edit enterprise profile">
                        Edit profile
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => {}} aria-label="Export report" icon={<Download size={16} aria-hidden="true" />}>
                        Export
                    </Button>
                </div>
            </div>

            {/* Inbound requests alert */}
            {inboundPartnerships.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-4 shadow-sm animate-in fade-in slide-in-from-top-2 duration-500" role="alert">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                        <Bell className="text-amber-600" size={20} />
                    </div>
                    <div className="flex-1">
                        <h4 className="text-sm font-bold text-amber-900">New Partnership Request</h4>
                        <p className="text-xs text-amber-700 mt-0.5">
                            {inboundPartnerships.length === 1 ? 'A partner is' : `${inboundPartnerships.length} partners are`} waiting for your approval.
                        </p>
                        <div className="flex gap-3 mt-3">
                            <Link to="/matching" className="text-xs font-black uppercase tracking-widest text-amber-900 hover:underline">Review Request</Link>
                        </div>
                    </div>
                </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Active Partners */}
                <Card>
                    <CardBody className="p-5">
                        <div className="flex items-center justify-between mb-3">
                            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                                <Users size={18} />
                            </div>
                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">ACTIVE</span>
                        </div>
                        <div className="text-2xl font-black text-slate-900">{counts.snps}</div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Active Partners</p>
                        {pendingPartnerCount > 0 && (
                            <p className="text-[10px] text-amber-600 font-bold mt-1">{pendingPartnerCount} pending</p>
                        )}
                    </CardBody>
                </Card>

                {/* Products Listed */}
                <Card>
                    <CardBody className="p-5">
                        <div className="flex items-center justify-between mb-3">
                            <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600">
                                <Package size={18} />
                            </div>
                        </div>
                        <div className="text-2xl font-black text-slate-900">{counts.products}</div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Products Listed</p>
                    </CardBody>
                </Card>

                {/* Total Revenue */}
                <Card>
                    <CardBody className="p-5">
                        <div className="flex items-center justify-between mb-3">
                            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                                <CreditCard size={18} />
                            </div>
                        </div>
                        <div className="text-2xl font-black text-slate-900">
                            {performance ? `₹${Math.round(performance.revenue).toLocaleString('en-IN')}` : '--'}
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Total Revenue</p>
                        {performance && (
                            <p className="text-[10px] text-slate-400 mt-0.5">from {performance.orders} orders</p>
                        )}
                    </CardBody>
                </Card>

                {/* Trust Score */}
                <Card>
                    <CardBody className="p-5">
                        <div className="flex items-center justify-between mb-3">
                            <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
                                <ShieldCheck size={18} />
                            </div>
                        </div>
                        <div className="text-2xl font-black text-slate-900">
                            {trustScore !== null ? `${trustScore}%` : '--'}
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Trust Score</p>
                    </CardBody>
                </Card>
            </div>

            {/* 7-Day Sales Trend Chart */}
            <Card>
                <CardBody className="p-6">
                    <div className="flex items-center justify-between mb-5">
                        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                            <TrendingUp size={16} className="text-[#1E3A8A]" /> 7-Day Sales Trend
                        </h3>
                        <button
                            onClick={handleExportCSV}
                            className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-[#1E3A8A] transition-colors"
                        >
                            <Download size={13} /> Download CSV
                        </button>
                    </div>

                    {salesTrend.length > 0 ? (
                        <>
                            <ResponsiveContainer width="100%" height={250}>
                                <LineChart data={salesTrend}>
                                    <XAxis
                                    dataKey="date"
                                    tickFormatter={(date) =>
                                        new Date(date).toLocaleDateString("en-IN", { weekday: "short" })
                                    }
                                    />
                                    <YAxis />
                                    <Tooltip
                                    formatter={(value) => `₹${value}`}
                                    labelFormatter={(label) =>
                                        new Date(label).toLocaleDateString("en-IN")
                                    }
                                    />
                                    <Line
                                    type="monotone"
                                    dataKey="sales"
                                    stroke="#1E3A8A"
                                    strokeWidth={3}
                                    />
                                    </LineChart>
                                    </ResponsiveContainer>
                            <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                                <span className="text-xs text-slate-500">
                                    <span className="font-bold text-slate-900">{salesTrend.reduce((s, d) => s + d.orders, 0)}</span> total orders
                                </span>
                                <span className="text-xs text-slate-500">
                                    <span className="font-bold text-slate-900">₹{salesTrend.reduce((s, d) => s + d.sales, 0).toLocaleString('en-IN')}</span> revenue
                                </span>
                            </div>
                        </>
                    ) : (
                        <div className="h-20 flex items-center justify-center">
                            <p className="text-slate-400 text-sm">No transaction data for this period</p>
                        </div>
                    )}
                </CardBody>
            </Card>

            {/* Performance Summary Row */}
            <div className="grid grid-cols-3 gap-4">
                <Card>
                    <CardBody className="p-4">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Avg Order Value</p>
                        <p className="text-xl font-black text-slate-900">
                            {performance ? `₹${Math.round(performance.avg_value).toLocaleString('en-IN')}` : '--'}
                        </p>
                    </CardBody>
                </Card>
                <Card>
                    <CardBody className="p-4">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Orders</p>
                        <p className="text-xl font-black text-slate-900">{performance?.orders ?? '--'}</p>
                    </CardBody>
                </Card>
                <Card>
                    <CardBody className="p-4">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Avg Settlement Time</p>
                        <p className="text-xl font-black text-slate-900">{performance?.settlement_delay || '--'}</p>
                    </CardBody>
                </Card>
            </div>

            {/* Smart Recommendations + Activity Sidebar */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Smart Recommendations */}
                <div className="lg:col-span-2 space-y-4">
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                        <Sparkles size={16} className="text-orange-500" /> Smart Recommendations
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {insights.map((insight, idx) => (
                            <div key={idx} className={`p-5 rounded-2xl border ${insight.color === 'teal' ? 'bg-teal-50 border-teal-100' : 'bg-amber-50 border-amber-100'} relative overflow-hidden`}>
                                <div className="relative z-10">
                                    <h5 className={`text-xs font-black uppercase tracking-widest mb-2 ${insight.color === 'teal' ? 'text-teal-700' : 'text-amber-700'}`}>{insight.title}</h5>
                                    <p className="text-sm text-slate-700 font-medium leading-relaxed">{insight.content}</p>
                                    {insight.action && (
                                        <button className={`mt-4 px-4 py-2 rounded-lg text-xs font-bold transition-all ${insight.color === 'teal' ? 'bg-teal-600 text-white hover:bg-teal-700' : 'bg-amber-600 text-white hover:bg-amber-700'}`}>
                                            {insight.action}
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                        {insights.length === 0 && (
                            <div className="md:col-span-2 bg-slate-50 border border-slate-200 rounded-2xl p-10 text-center">
                                <p className="text-slate-400 text-sm font-medium italic">Scanning network for growth opportunities...</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Activity Sidebar */}
                <div className="space-y-4">
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                        <Clock size={16} className="text-[#002147]" /> Recent Activity
                    </h3>
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
                        {mseActivities.length > 0 ? mseActivities.map((item, i) => (
                            <div key={i} className="flex items-start gap-3">
                                <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${activityDot(item.type)}`} />
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-slate-800 truncate">{item.title}</p>
                                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{item.content}</p>
                                    <p className="text-[10px] text-slate-400 mt-1">
                                        {new Date(item.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                        {' '}
                                        {new Date(item.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>
                        )) : (
                            <p className="text-slate-400 text-sm text-center py-6">No recent activity</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Compliance Card */}
            <Card>
                <CardBody className="p-6">
                    <div className="flex items-center justify-between mb-5">
                        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                            <FileCheck size={16} className="text-[#1E3A8A]" /> Compliance Status
                        </h3>
                        {compliance && (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-widest ${
                                compliance.overall_status === 'compliant' ? 'bg-emerald-50 text-emerald-700' :
                                compliance.overall_status === 'partial'   ? 'bg-amber-50 text-amber-700' :
                                                                            'bg-red-50 text-red-700'
                            }`}>
                                {compliance.overall_status === 'compliant' ? 'Compliant' :
                                 compliance.overall_status === 'partial'   ? 'Partial' : 'Non-Compliant'}
                            </span>
                        )}
                    </div>

                    {compliance ? (
                        <div className="divide-y divide-slate-100">
                            {/* Registration */}
                            <div className="flex items-center justify-between py-3 first:pt-0">
                                <div className="flex items-center gap-3">
                                    <StatusIcon status={compliance.registration.status} />
                                    <div>
                                        <p className="text-sm font-semibold text-slate-800">Business Registration</p>
                                        <p className="text-xs text-slate-500">{compliance.registration.label}</p>
                                    </div>
                                </div>
                                <Link to="/onboarding" className="text-xs font-bold text-[#1E3A8A] hover:underline">View</Link>
                            </div>

                            {/* Documents */}
                            <div className="flex items-center justify-between py-3">
                                <div className="flex items-center gap-3">
                                    <StatusIcon
                                        status={compliance.documents.total === 0 ? 'none' : compliance.documents.verified === compliance.documents.total ? 'verified' : compliance.documents.verified > 0 ? 'pending' : 'pending'}
                                        total={compliance.documents.total}
                                    />
                                    <div>
                                        <p className="text-sm font-semibold text-slate-800">Document Verification</p>
                                        <p className="text-xs text-slate-500">
                                            {compliance.documents.total > 0
                                                ? `${compliance.documents.verified} of ${compliance.documents.total} verified`
                                                : 'No documents uploaded'}
                                        </p>
                                    </div>
                                </div>
                                <Link to="/claims" className="text-xs font-bold text-[#1E3A8A] hover:underline">Upload</Link>
                            </div>

                            {/* Claims */}
                            <div className="flex items-center justify-between py-3 last:pb-0">
                                <div className="flex items-center gap-3">
                                    <StatusIcon
                                        status={compliance.claims.total === 0 ? 'none' : compliance.claims.verified > 0 ? 'verified' : 'pending'}
                                        total={compliance.claims.total}
                                    />
                                    <div>
                                        <p className="text-sm font-semibold text-slate-800">Subsidy Claims</p>
                                        <p className="text-xs text-slate-500">
                                            {compliance.claims.total > 0
                                                ? `${compliance.claims.verified} of ${compliance.claims.total} approved`
                                                : 'No claims filed'}
                                        </p>
                                    </div>
                                </div>
                                <Link to="/claims" className="text-xs font-bold text-[#1E3A8A] hover:underline">File Claim</Link>
                            </div>
                        </div>
                    ) : (
                        <p className="text-slate-400 text-sm text-center py-6">Loading compliance data...</p>
                    )}
                </CardBody>
            </Card>

            {/* Growth Opportunity Banner */}
            <div className="bg-gradient-to-r from-[#1E3A8A] to-[#1e4fa8] rounded-2xl p-6 text-white flex items-start justify-between gap-4">
                <div>
                    <p className="text-xs font-black uppercase tracking-widest text-blue-200 mb-2">Growth Opportunity</p>
                    <p className="text-sm font-medium text-blue-50 leading-relaxed max-w-xl">{bannerContent}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                    <Globe size={20} className="text-white" />
                </div>
            </div>

        </div>
    );
}
