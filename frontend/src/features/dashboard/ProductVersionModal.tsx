import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Clock, RotateCcw, X, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useToast } from '../../context/ToastContext';
import config from '../../config';

interface ProductVersion {
    version_id: number;
    product_id: number;
    version_number: number;
    product_data: string;
    created_at: string;
}

interface Props {
    productId: number;
    productName: string;
    onClose: () => void;
    onRollbackSuccess: () => void;
}

export default function ProductVersionModal({ productId, productName, onClose, onRollbackSuccess }: Props) {
    const { t } = useTranslation();
    const { showToast } = useToast();
    const [versions, setVersions] = useState<ProductVersion[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchVersions = async () => {
            try {
                const res = await axios.get(`${config.API_BASE_URL}/products/${productId}/versions`);
                setVersions(res.data);
            } catch (err) {
                showToast(t('error_occurred'), 'error');
            } finally {
                setLoading(false);
            }
        };
        fetchVersions();
    }, [productId]);

    const handleRollback = async (v: ProductVersion) => {
        if (!window.confirm(`Rollback product to Version ${v.version_number}? All newer versions will be deleted.`)) return;
        try {
            await axios.delete(`${config.API_BASE_URL}/products/${productId}/versions/${v.version_id}`);
            showToast(t('success_op'), 'success');
            onRollbackSuccess();
            onClose();
        } catch (err) {
            showToast(t('error_occurred'), 'error');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
                <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                    <div className="flex items-center gap-3 text-[#002147]">
                        <Clock size={20} />
                        <div>
                            <h3 className="text-base font-bold leading-none">{t('version_history', 'Version History')}</h3>
                            <p className="text-[10px] text-slate-500 mt-1 font-medium uppercase tracking-wider">{productName}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
                        <X size={18} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="py-10 text-center text-slate-400 text-sm">Loading history...</div>
                    ) : versions.length === 0 ? (
                        <div className="py-10 text-center space-y-3">
                            <Clock size={32} className="mx-auto text-slate-200" />
                            <p className="text-slate-500 text-sm font-medium">No historical versions found.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
                                <AlertTriangle size={16} className="text-blue-600 shrink-0 mt-0.5" />
                                <p className="text-xs text-blue-700 leading-relaxed">
                                    Rollback restores previous data and deletes all newer change logs. This action is permanent.
                                </p>
                            </div>
                            
                            <div className="divide-y divide-slate-100">
                                {versions.map((v, i) => {
                                    const data = JSON.parse(v.product_data);
                                    return (
                                        <div key={v.version_id} className="py-4 first:pt-0 flex items-start justify-between gap-4">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-xs font-bold text-slate-900">Version {v.version_number}</span>
                                                    {i === 0 && <span className="bg-emerald-50 text-emerald-600 text-[10px] font-bold px-1.5 py-0.5 rounded border border-emerald-100">Current</span>}
                                                </div>
                                                <p className="text-[11px] text-slate-500 line-clamp-1">{data.product_name} · ₹{data.price}</p>
                                                <p className="text-[10px] text-slate-400 mt-1">{new Date(v.created_at).toLocaleString()}</p>
                                            </div>
                                            {i > 0 && (
                                                <button onClick={() => handleRollback(v)}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-[#002147] border border-[#002147]/20 rounded-lg hover:bg-[#002147] hover:text-white transition-all">
                                                    <RotateCcw size={12} /> Rollback
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
