import { useState, useEffect } from 'react';
import axios from 'axios';
import {
    ShieldCheck, CheckCircle2, XCircle,
    Search, Building, Eye, AlertTriangle, Sparkles,
    Users, Download, FileText, X, Edit2
} from 'lucide-react';
import config from '../../config';
import type { Claim, SystemAuditLog, OCRDocument } from '../../types';

interface ExtendedOCRDocument extends OCRDocument {
    _document_id: number;
    _confidence: number;
    _status: string;
    _is_verified: boolean;
    _document_type: string;
}

export default function NSICDashboard() {
    const [claims, setClaims] = useState<Claim[]>([]);
    const [conflicts, setConflicts] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'claims' | 'conflicts'>('claims');
    const [loading, setLoading] = useState(true);
    const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
    const [selectedDocData, setSelectedDocData] = useState<ExtendedOCRDocument | null>(null);
    const [comments, setComments] = useState('');
    const [nationalStats, setNationalStats] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isEditingOcr, setIsEditingOcr] = useState(false);
    const [editedOcrData, setEditedOcrData] = useState<any>(null);

    const filteredClaims = claims.filter((c: Claim) =>
        c.claim_id.toString().includes(searchTerm) ||
        c.claim_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.mse_id.toString().includes(searchTerm)
    );

    const filteredConflicts = conflicts.filter((c: any) =>
        c.conflict_id.toString().includes(searchTerm) ||
        c.transaction_id.toString().includes(searchTerm) ||
        c.conflict_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    useEffect(() => {
        fetchClaims();
        fetchConflicts();
        fetchNationalAnalytics();
    }, []);

    const fetchNationalAnalytics = async () => {
        try {
            const res = await axios.get(`${config.API_BASE_URL}/analytics/national`);
            setNationalStats(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchClaims = async () => {
        try {
            const res = await axios.get(`${config.API_BASE_URL}/claims/pending`);
            setClaims(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchConflicts = async () => {
        try {
            const res = await axios.get(`${config.API_BASE_URL}/conflicts/`);
            setConflicts(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleResolveConflict = async (conflictId: number) => {
        try {
            await axios.post(`${config.API_BASE_URL}/conflicts/${conflictId}/resolve`);
            fetchConflicts();
        } catch (err) {
            console.error(err);
        }
    };

    const handleVerify = async (claimId: number, status: 'verified' | 'rejected') => {
        try {
            await axios.put(`${config.API_BASE_URL}/claims/${claimId}/verify`, {
                status,
                comments,
                verified_by: "NSIC-ADMIN-01"
            });
            fetchClaims();
            setSelectedClaim(null);
            setSelectedDocData(null);
            setComments('');
        } catch (err) {
            console.error(err);
        }
    };

    const loadDocIntelligence = async (mseId: number) => {
        try {
            const res = await axios.get(`${config.API_BASE_URL}/documents/mse/${mseId}/latest`);
            if (res.data) {
                const parsed = res.data.extracted_data ? JSON.parse(res.data.extracted_data) : {};
                setSelectedDocData({
                    ...res.data,
                    ...parsed,
                    _document_id: res.data.document_id,
                    _confidence: res.data.confidence_score,
                    _status: res.data.ocr_status,
                    _is_verified: res.data.is_verified,
                    _document_type: res.data.document_type
                });
                setEditedOcrData(parsed);
                setIsEditingOcr(false);
            }
        } catch (err) {
            console.error("Document not found for MSE", mseId, err);
            setSelectedDocData(null);
        }
    };

    const handleSaveOcr = async () => {
        if (!selectedDocData?._document_id) return;
        try {
            await axios.post(`${config.API_BASE_URL}/documents/${selectedDocData._document_id}/verify`, {
                extracted_data: JSON.stringify(editedOcrData),
                verified_by: "NSIC-ADMIN-01"
            });
            setIsEditingOcr(false);
            if (selectedClaim) loadDocIntelligence(selectedClaim.mse_id);
        } catch (err) {
            console.error("Save failed", err);
        }
    };

    useEffect(() => {
        if (selectedClaim) {
            loadDocIntelligence(selectedClaim.mse_id);
        }
    }, [selectedClaim]);

    const handleExportCSV = () => {
        const dataToExport = activeTab === 'claims' ? claims : conflicts;
        if (!dataToExport || dataToExport.length === 0) {
            alert('No data to export.');
            return;
        }
        const headers = Object.keys(dataToExport[0]).join(',');
        const rows = dataToExport.map((obj: any) =>
            Object.values(obj).map(val => `"${String(val).replace(/"/g, '""')}"`).join(',')
        ).join('\n');
        const csvContent = `data:text/csv;charset=utf-8,${headers}\n${rows}`;
        const link = document.createElement('a');
        link.setAttribute('href', encodeURI(csvContent));
        link.setAttribute('download', `nsic_${activeTab}_${Date.now()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="w-full space-y-6 pb-10">

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-slate-900">Verification</h1>
                    <p className="text-slate-500 text-sm mt-0.5">Review enterprise claims and payment disputes.</p>
                </div>
                <button onClick={handleExportCSV}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-all">
                    <Download size={15} /> Export CSV
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Total enterprises', value: nationalStats?.total_mses ?? '—', icon: Building, color: 'text-blue-600 bg-blue-50' },
                    { label: 'Active partners', value: nationalStats?.total_snps ?? '—', icon: Users, color: 'text-indigo-600 bg-indigo-50' },
                    { label: 'Transaction volume', value: `₹${(nationalStats?.total_volume || 0).toLocaleString('en-IN')}`, icon: FileText, color: 'text-emerald-600 bg-emerald-50' },
                    { label: 'Avg match score', value: `${nationalStats?.avg_match_score || 0}%`, icon: Sparkles, color: 'text-amber-600 bg-amber-50' },
                ].map((stat, i) => (
                    <div key={i} className="bg-white border border-slate-200 rounded-2xl p-5">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${stat.color}`}>
                            <stat.icon size={18} />
                        </div>
                        <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{stat.label}</div>
                    </div>
                ))}
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-fit">
                <button onClick={() => setActiveTab('claims')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'claims' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                    Claims {claims.length > 0 && <span className="ml-1.5 text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">{claims.length}</span>}
                </button>
                <button onClick={() => setActiveTab('conflicts')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'conflicts' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                    Disputes {conflicts.length > 0 && <span className="ml-1.5 text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full">{conflicts.length}</span>}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                {/* List panel */}
                <div className="md:col-span-7 space-y-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                        <input className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none focus:border-slate-400 transition-all"
                            placeholder="Search by enterprise, claim # or type…" 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 space-y-3">
                            <div className="w-7 h-7 border-2 border-slate-200 border-t-[#002147] rounded-full animate-spin" />
                            <p className="text-sm text-slate-400">Loading…</p>
                        </div>
                    ) : activeTab === 'claims' ? (
                        filteredClaims.length === 0 ? (
                            <div className="bg-white border border-slate-200 rounded-2xl py-16 text-center">
                                <CheckCircle2 className="mx-auto text-emerald-300 mb-3" size={36} />
                                <p className="text-sm font-medium text-slate-700">{searchTerm ? 'No matches found' : 'All caught up'}</p>
                                <p className="text-xs text-slate-400 mt-1">{searchTerm ? 'Try a different search term.' : 'No pending claims to review.'}</p>
                            </div>
                        ) : (
                            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                                <table className="w-full text-left text-sm">
                                    <thead>
                                        <tr className="border-b border-slate-100 text-xs text-slate-400 font-medium">
                                            <th className="px-5 py-3">Claim #</th>
                                            <th className="px-5 py-3">Enterprise</th>
                                            <th className="px-5 py-3">Type</th>
                                            <th className="px-5 py-3">Date</th>
                                            <th className="px-5 py-3">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {filteredClaims.map((claim: Claim) => (
                                            <tr key={claim.claim_id}
                                                onClick={() => setSelectedClaim(claim)}
                                                className={`cursor-pointer transition-colors ${selectedClaim?.claim_id === claim.claim_id ? 'bg-amber-50' : 'hover:bg-slate-50'}`}>
                                                <td className="px-5 py-3.5 font-mono text-xs text-slate-500">#{claim.claim_id}</td>
                                                <td className="px-5 py-3.5 text-slate-700 font-medium">Enterprise #{claim.mse_id}</td>
                                                <td className="px-5 py-3.5">
                                                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{claim.claim_type}</span>
                                                </td>
                                                <td className="px-5 py-3.5 text-xs text-slate-500">{new Date(claim.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</td>
                                                <td className="px-5 py-3.5">
                                                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-100">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" /> Pending
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )
                    ) : (
                        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="border-b border-slate-100 text-xs text-slate-400 font-medium">
                                        <th className="px-5 py-3">Dispute #</th>
                                        <th className="px-5 py-3">Transaction</th>
                                        <th className="px-5 py-3">Type</th>
                                        <th className="px-5 py-3">Description</th>
                                        <th className="px-5 py-3 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {filteredConflicts.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-5 py-16 text-center">
                                                <ShieldCheck size={32} className="text-slate-200 mx-auto mb-3" />
                                                <p className="text-sm font-medium text-slate-700">{searchTerm ? 'No matches found' : 'No disputes'}</p>
                                                <p className="text-xs text-slate-400 mt-1">{searchTerm ? 'Try a different search term.' : 'All payments are in order.'}</p>
                                            </td>
                                        </tr>
                                    ) : filteredConflicts.map((conflict: any) => (
                                        <tr key={conflict.conflict_id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-5 py-3.5 font-mono text-xs text-slate-500">#{conflict.conflict_id}</td>
                                            <td className="px-5 py-3.5 text-xs text-slate-600">TX #{conflict.transaction_id}</td>
                                            <td className="px-5 py-3.5">
                                                <span className="text-xs bg-orange-50 text-orange-700 border border-orange-100 px-2 py-0.5 rounded-full">{conflict.conflict_type.replace('_', ' ')}</span>
                                            </td>
                                            <td className="px-5 py-3.5 text-xs text-slate-500 max-w-xs truncate">{conflict.description}</td>
                                            <td className="px-5 py-3.5 text-right">
                                                <button onClick={() => handleResolveConflict(conflict.conflict_id)}
                                                    disabled={conflict.status === 'resolved'}
                                                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${conflict.status === 'resolved' ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'text-white bg-[#002147] hover:bg-emerald-600'}`}>
                                                    {conflict.status === 'resolved' ? 'Resolved' : 'Resolve'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Review panel (CLAIM-03: Split-Screen Verification) */}
                <div className="md:col-span-5">
                    {selectedClaim ? (
                        <div className="bg-white border border-slate-200 rounded-2xl p-6 sticky top-6 space-y-5 shadow-sm">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reviewing #{selectedClaim.claim_id}</p>
                                    <h2 className="text-base font-bold text-slate-900 mt-0.5">Enterprise #{selectedClaim.mse_id}</h2>
                                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded mt-1 inline-block font-medium">{selectedClaim.claim_type}</span>
                                </div>
                                <button onClick={() => setSelectedClaim(null)} className="text-slate-300 hover:text-slate-500">
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Document Preview (Mock) */}
                            <div className="aspect-[4/3] bg-slate-100 rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400">
                                <FileText size={48} className="opacity-20 mb-2" />
                                <span className="text-[10px] font-black uppercase tracking-widest">{selectedDocData?._document_type || 'Document'} Preview</span>
                                <p className="text-[9px] mt-1 italic">Identity Hardware Protected</p>
                            </div>

                            {/* OCR Data Comparison */}
                            {selectedDocData ? (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                                            <Sparkles size={12} className="text-amber-500" /> Extracted Intelligence
                                        </span>
                                        <span className={`text-[10px] font-bold uppercase ${selectedDocData?._confidence > 0.8 ? 'text-emerald-600' : 'text-amber-600'}`}>
                                            {selectedDocData?._is_verified ? 'Verified' : `${(selectedDocData?._confidence * 100).toFixed(0)}% confidence`}
                                        </span>
                                    </div>
                                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-3">
                                        {Object.entries(editedOcrData || {}).map(([key, val]: [string, any]) => (
                                            <div key={key} className="flex flex-col gap-1">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">{key.replace('_', ' ')}</label>
                                                {isEditingOcr ? (
                                                    <input type="text" value={val}
                                                        onChange={(e) => setEditedOcrData({ ...editedOcrData, [key]: e.target.value })}
                                                        className="text-xs font-bold text-[#002147] bg-white border border-slate-200 rounded-lg p-2 outline-none w-full focus:border-[#002147]" />
                                                ) : (
                                                    <span className="text-xs font-bold text-[#002147]">{val}</span>
                                                )}
                                            </div>
                                        ))}
                                        <div className="flex justify-end gap-3 pt-2">
                                            {isEditingOcr ? (
                                                <>
                                                    <button onClick={() => setIsEditingOcr(false)} className="text-[10px] font-black uppercase text-slate-400 hover:text-slate-600">Cancel</button>
                                                    <button onClick={handleSaveOcr} className="text-[10px] font-black uppercase text-emerald-600 hover:text-emerald-700">Commit Changes</button>
                                                </>
                                            ) : (
                                                !selectedDocData?._is_verified && (
                                                    <button onClick={() => setIsEditingOcr(true)} className="text-[10px] font-black uppercase text-slate-500 hover:text-[#002147] flex items-center gap-1">
                                                        <Edit2 size={10} /> Correct data
                                                    </button>
                                                )
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-slate-50 border border-slate-100 rounded-xl p-6 text-center">
                                    <AlertTriangle size={24} className="mx-auto text-slate-300 mb-2" />
                                    <p className="text-xs text-slate-400 font-medium">Awaiting OCR processing or document upload.</p>
                                </div>
                            )}

                            {/* Comments */}
                            <div className="space-y-2 pt-2 border-t border-slate-100">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Decision Notes</label>
                                <textarea value={comments} onChange={(e) => setComments(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-800 outline-none focus:border-slate-400 transition-all resize-none"
                                    rows={3} placeholder="Provide reasoning for approval/rejection…" />
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3">
                                <button onClick={() => handleVerify(selectedClaim.claim_id, 'rejected')}
                                    className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-slate-500 text-[10px] font-black uppercase tracking-widest hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all flex items-center justify-center gap-2">
                                    <XCircle size={14} /> Reject
                                </button>
                                <button onClick={() => handleVerify(selectedClaim.claim_id, 'verified')}
                                    className="flex-1 px-4 py-3 rounded-xl bg-[#002147] text-white text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all flex items-center justify-center gap-2 shadow-lg">
                                    <CheckCircle2 size={14} /> Verify Claim
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full min-h-[400px] border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-center p-8 bg-slate-50/30">
                            <ShieldCheck size={48} className="text-slate-200 mb-4 opacity-50" />
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Auditor Workspace</h3>
                            <p className="text-xs text-slate-400 mt-2 max-w-[200px]">Select a pending claim from the registry to begin verification.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
