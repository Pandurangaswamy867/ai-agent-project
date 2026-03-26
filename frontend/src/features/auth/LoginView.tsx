import React, { useState } from 'react';
import { ArrowRight, Building2, Network } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import type { UserRole } from '../../types';
import { useMSE } from '../../context/MSEContext';
import axios from 'axios';
import config from '../../config';
import { useToast } from '../../context/ToastContext';

type AuthMethod = 'password' | 'otp';

interface PanelState {
    email: string;
    password: string;
    otp: string;
    method: AuthMethod;
    otpSent: boolean;
    loading: boolean;
    error: string;
}

function makePanel(): PanelState {
    return { email: '', password: '', otp: '', method: 'password', otpSent: false, loading: false, error: '' };
}

export default function LoginView() {
    const { login } = useAuth();
    const { setSelectedMseId } = useMSE();
    const { showToast } = useToast();
    const navigate = useNavigate();

    const [mse, setMse] = useState<PanelState>(makePanel());
    const [snp, setSnp] = useState<PanelState>(makePanel());
    const [activeTab, setActiveTab] = useState<'mse' | 'snp'>('mse');

    const p = activeTab === 'mse' ? mse : snp;
    const setP = activeTab === 'mse' ? setMse : setSnp;

    const doLogin = async (email: string, body: Record<string, string>) => {
        localStorage.removeItem('selectedMseId');
        const res = await axios.post(`${config.API_BASE_URL}/auth/login`, { email, ...body });
        const token = res.data.access_token;
        const userRes = await axios.get(`${config.API_BASE_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        const profileId = userRes.data.profile_id;
        if (!profileId) {
            localStorage.setItem('authToken', token);
            throw new Error(`PROFILE_MISSING:${userRes.data.role || 'mse'}`);
        }

        if (userRes.data.role === 'mse') setSelectedMseId(profileId);
        login(userRes.data.role as UserRole, userRes.data.id, token, profileId);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setP(prev => ({ ...prev, error: '', loading: true }));

        try {
            if (p.method === 'otp' && !p.otpSent) {
                if (!p.email) { setP(prev => ({ ...prev, error: 'Please enter your email.', loading: false })); return; }
                await axios.post(`${config.API_BASE_URL}/auth/send-otp`, { email: p.email });
                showToast('OTP sent successfully', 'success');
                setP(prev => ({ ...prev, otpSent: true, loading: false }));
            } else {
                const body: Record<string, string> = p.method === 'otp' 
                    ? { otp_code: p.otp } 
                    : { password: p.password };
                await doLogin(p.email, body);
                showToast('Welcome back!', 'success');
            }
        } catch (err: any) {
            if (typeof err.message === 'string' && err.message.startsWith("PROFILE_MISSING:")) {
                const role = err.message.split(':')[1] || 'mse';
                const msg = 'Account found but profile is incomplete.';
                setP(prev => ({ ...prev, error: msg, loading: false }));
                showToast(msg, 'warning');
                navigate(role === 'snp' ? '/snp/register' : '/onboarding');
            } else {
                const msg = err.response?.data?.detail || 'Incorrect credentials. Please try again.';
                setP(prev => ({ ...prev, error: msg, loading: false }));
                showToast(msg, 'error');
            }
        }
    };

    const accentColor = activeTab === 'mse' ? '#002147' : '#B84D00';
    const isOtpPending = p.method === 'otp' && !p.otpSent;

    return (
        <div className="min-h-screen flex">

            {/* Left panel — hero image */}
            <div
                className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 overflow-hidden"
                style={{
                    backgroundImage: `url('https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=80')`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                }}
            >
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#002147]/90 via-[#002147]/70 to-[#B84D00]/50" />

                {/* Content */}
                <div className="relative z-10">
                    <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/20">
                        <Building2 size={20} className="text-white" />
                    </div>
                </div>

                <div className="relative z-10">
                    <h2 className="text-4xl font-bold text-white leading-tight">
                        Empowering<br />
                        <span className="text-[#FF9933]">Indian MSMEs</span>
                    </h2>
                </div>
            </div>

            {/* Right panel — login form */}
            <div className="flex-1 bg-white flex flex-col items-center justify-center px-6 py-12">

            {/* Mobile-only header (hidden on lg when left panel shows) */}
            <div className="mb-8 text-center lg:hidden">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#002147] mb-3 shadow-md">
                    <Building2 size={22} className="text-white" />
                </div>
                <h1 className="text-xl font-bold text-slate-900 leading-tight">AI-Driven MSE Onboarding and Strategic Partner Mapping Ecosystem</h1>
            </div>

            {/* Desktop heading */}
            <div className="hidden lg:block mb-8 text-center">
                <h1 className="text-2xl font-bold text-slate-900">Welcome back</h1>
            </div>

            {/* Card */}
            <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">

                {/* Tab switcher */}
                <div className="flex border-b border-slate-100">
                    {(['mse', 'snp'] as const).map(tab => (
                        <button
                            key={tab}
                            type="button"
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 py-4 text-sm font-semibold transition-all ${
                                activeTab === tab
                                    ? 'text-slate-900 border-b-2 border-[#002147]'
                                    : 'text-slate-400 hover:text-slate-600'
                            }`}
                            style={activeTab === tab ? { borderBottomColor: accentColor } : {}}
                        >
                            {tab === 'mse' ? (
                                <span className="flex items-center justify-center gap-2">
                                    <Building2 size={15} /> Enterprise
                                </span>
                            ) : (
                                <span className="flex items-center justify-center gap-2">
                                    <Network size={15} /> Network Partner
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                <div className="p-8">
                    <form onSubmit={handleSubmit} className="space-y-4">

                        {/* Email */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Email address</label>
                            <input
                                required type="email" value={p.email}
                                onChange={e => setP(prev => ({ ...prev, email: e.target.value, otpSent: false, otp: '' }))}
                                placeholder="you@example.com"
                                disabled={p.loading}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-400 focus:bg-white transition-all disabled:opacity-50"
                            />
                        </div>

                        {/* Auth method toggle */}
                        <div className="flex gap-2">
                            {(['password', 'otp'] as const).map(m => (
                                <button
                                    key={m} type="button"
                                    onClick={() => setP(prev => ({ ...prev, method: m, otpSent: false, otp: '', password: '' }))}
                                    className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition-all ${
                                        p.method === m
                                            ? 'bg-slate-900 text-white border-slate-900'
                                            : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                                    }`}
                                >
                                    {m === 'password' ? 'Password' : 'OTP'}
                                </button>
                            ))}
                        </div>

                        {/* Password or OTP input */}
                        {p.method === 'password' ? (
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Password</label>
                                <input
                                    required type="password" value={p.password}
                                    onChange={e => setP(prev => ({ ...prev, password: e.target.value }))}
                                    placeholder="••••••••"
                                    disabled={p.loading}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-400 focus:bg-white transition-all disabled:opacity-50"
                                />
                            </div>
                        ) : p.otpSent ? (
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="text-xs font-semibold text-slate-600">One-time code</label>
                                    <button type="button" onClick={() => setP(prev => ({ ...prev, otpSent: false, otp: '' }))}
                                        className="text-xs text-slate-400 hover:text-slate-600">
                                        Change email
                                    </button>
                                </div>
                                <p className="text-xs text-slate-500 mb-2">Sent to {p.email}</p>
                                <input
                                    required type="text" maxLength={6} value={p.otp}
                                    onChange={e => setP(prev => ({ ...prev, otp: e.target.value }))}
                                    placeholder="000000"
                                    autoFocus
                                    disabled={p.loading}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-center text-xl font-bold tracking-[0.4em] text-slate-900 outline-none focus:border-slate-400 focus:bg-white transition-all disabled:opacity-50"
                                />
                            </div>
                        ) : null}

                        {/* Error */}
                        {p.error && (
                            <p className="text-xs text-red-500 font-medium">{p.error}</p>
                        )}

                        {/* Submit */}
                        <button
                            type="submit" disabled={p.loading}
                            className="w-full py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60 mt-2"
                            style={{ backgroundColor: accentColor }}
                        >
                            {p.loading ? (
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <span>{isOtpPending ? 'Send code' : 'Sign in'}</span>
                                    <ArrowRight size={16} />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Register link */}
                    <p className="text-center text-xs text-slate-400 mt-6">
                        No account?{' '}
                        <a href={activeTab === 'mse' ? '/onboarding' : '/snp/register'}
                            className="font-semibold text-slate-700 hover:text-slate-900 transition-colors">
                            Create one
                        </a>
                    </p>
                </div>
            </div>

            {/* Footer links */}
            <div className="mt-8 flex items-center gap-4 text-xs text-slate-400">
                <a href="/staff/login" className="hover:text-slate-600 transition-colors">Staff login</a>
                <span>·</span>
                <span>demo@mse.gov.in / MSEWelcome2026</span>
            </div>

            </div>{/* end right panel */}
        </div>
    );
}
