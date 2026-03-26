import React, { useState } from 'react';
import { ShieldCheck, Lock, ArrowRight, ArrowLeft, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import type { UserRole } from '../../types';
import { useMSE } from '../../context/MSEContext';
import { useToast } from '../../context/ToastContext';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import config from '../../config';

export default function AdminLoginView() {
    const { login } = useAuth();
    const { setSelectedMseId } = useMSE();
    const { showToast } = useToast();
    const { t } = useTranslation();

    const [nsicId, setNsicId] = useState('');
    const [nsicPassword, setNsicPassword] = useState('');
    const [adminId, setAdminId] = useState('');
    const [adminPassword, setAdminPassword] = useState('');

    const doLogin = async (loginId: string, password: string) => {
        localStorage.removeItem('selectedMseId');
        const res = await axios.post(`${config.API_BASE_URL}/auth/login`, { email: loginId, password });
        const token = res.data.access_token;
        const userRes = await axios.get(`${config.API_BASE_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const profileId = userRes.data.profile_id;
        if (userRes.data.role === 'mse') setSelectedMseId(profileId);
        login(userRes.data.role as UserRole, userRes.data.id, token, profileId);
    };

    const handleNsicSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try { 
            await doLogin(nsicId, nsicPassword);
            showToast(t('success_op'), 'success');
        }
        catch { showToast(t('error_occurred'), 'error'); }
    };

    const handleAdminSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try { 
            await doLogin(adminId, adminPassword);
            showToast(t('success_op'), 'success');
        }
        catch { showToast(t('error_occurred'), 'error'); }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">

            <div className="w-full max-w-2xl space-y-6">
                {/* Title */}
                <div className="text-center">
                    <div className="w-12 h-12 bg-[#002147] rounded-xl flex items-center justify-center mx-auto mb-4">
                        <Lock size={22} className="text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900">{t('admin_login')}</h1>
                    <p className="text-slate-500 text-sm mt-1">{t('authorized_only', 'Authorised personnel only')}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* NSIC */}
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                        <div className="px-6 py-4 bg-emerald-800 flex items-center gap-3">
                            <ShieldCheck size={18} className="text-white" />
                            <div>
                                <p className="text-white font-semibold text-sm">NSIC Auditor</p>
                                <p className="text-white/50 text-xs">National Small Industries Corp.</p>
                            </div>
                        </div>
                        <form onSubmit={handleNsicSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1.5">{t('username')}</label>
                                <input required type="text" value={nsicId} onChange={e => setNsicId(e.target.value)}
                                    placeholder="nsic"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-emerald-700 transition-all" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1.5">{t('password')}</label>
                                <input required type="password" value={nsicPassword} onChange={e => setNsicPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-emerald-700 transition-all" />
                            </div>
                            <button type="submit"
                                className="w-full bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-sm py-2.5 rounded-xl transition-all flex items-center justify-center gap-2">
                                {t('login_btn')} <ArrowRight size={15} />
                            </button>
                        </form>
                    </div>

                    {/* Admin */}
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                        <div className="px-6 py-4 bg-slate-900 flex items-center gap-3">
                            <Lock size={18} className="text-white" />
                            <div>
                                <p className="text-white font-semibold text-sm">System Admin</p>
                                <p className="text-white/50 text-xs">Platform administration</p>
                            </div>
                        </div>
                        <form onSubmit={handleAdminSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1.5">{t('username')}</label>
                                <input required type="text" value={adminId} onChange={e => setAdminId(e.target.value)}
                                    placeholder="admin"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-slate-800 transition-all" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1.5">{t('password')}</label>
                                <input required type="password" value={adminPassword} onChange={e => setAdminPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-slate-800 transition-all" />
                            </div>
                            <button type="submit"
                                className="w-full bg-slate-900 hover:bg-black text-white font-semibold text-sm py-2.5 rounded-xl transition-all flex items-center justify-center gap-2">
                                {t('login_btn')} <ArrowRight size={15} />
                            </button>
                        </form>
                    </div>
                </div>

                {/* Demo credentials */}
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                    <p className="text-xs font-semibold text-amber-700 flex items-center gap-1.5 mb-2">
                        <Sparkles size={12} /> {t('demo_credentials', 'Demo credentials')}
                    </p>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-slate-600">
                        <p><span className="font-semibold text-slate-800">admin</span> / Admin@2026</p>
                        <p><span className="font-semibold text-slate-800">nsic</span> / Audit@2026</p>
                    </div>
                </div>

                <div className="text-center">
                    <a href="/" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-700 transition-colors">
                        <ArrowLeft size={14} /> {t('back_to_login', 'Back to login')}
                    </a>
                </div>
            </div>
        </div>
    );
}
