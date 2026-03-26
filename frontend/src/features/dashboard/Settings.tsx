import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Bell, Mail, Smartphone, Globe, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useToast } from '../../context/ToastContext';
import config from '../../config';

export default function Settings() {
    const { t } = useTranslation();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [prefs, setPrefs] = useState({
        email_enabled: true,
        sms_enabled: false,
        in_app_enabled: true,
        marketing_enabled: false
    });

    useEffect(() => {
        const fetchPrefs = async () => {
            try {
                const res = await axios.get(`${config.API_BASE_URL}/notifications/preferences`);
                setPrefs(res.data);
            } catch (err) {
                // Preferences might not exist yet, fallback to defaults
            } finally {
                setLoading(false);
            }
        };
        fetchPrefs();
    }, []);

    const handleToggle = async (key: keyof typeof prefs) => {
        const newPrefs = { ...prefs, [key]: !prefs[key] };
        setPrefs(newPrefs);
        try {
            await axios.put(`${config.API_BASE_URL}/notifications/preferences`, newPrefs);
            showToast(t('success_op'), 'success');
        } catch (err) {
            showToast(t('error_occurred'), 'error');
            setPrefs(prefs); // Revert on failure
        }
    };

    if (loading) return <div className="py-20 text-center text-slate-400">Loading settings...</div>;

    return (
        <div className="max-w-2xl mx-auto space-y-8 pb-20">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">{t('settings')}</h1>
                <p className="text-slate-500 mt-1">Manage your account preferences and notifications</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center gap-3">
                    <Bell size={18} className="text-[#002147]" />
                    <h2 className="font-bold text-slate-900">Communication Preferences</h2>
                </div>
                
                <div className="divide-y divide-slate-100">
                    <div className="p-6 flex items-center justify-between">
                        <div className="flex gap-4">
                            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 shrink-0">
                                <Mail size={20} />
                            </div>
                            <div>
                                <p className="font-semibold text-slate-900">Email Notifications</p>
                                <p className="text-sm text-slate-500">Receive critical alerts and updates via your registered email</p>
                            </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" checked={prefs.email_enabled} onChange={() => handleToggle('email_enabled')} />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#002147]"></div>
                        </label>
                    </div>

                    <div className="p-6 flex items-center justify-between">
                        <div className="flex gap-4">
                            <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-green-600 shrink-0">
                                <Smartphone size={20} />
                            </div>
                            <div>
                                <p className="font-semibold text-slate-900">SMS Alerts</p>
                                <p className="text-sm text-slate-500">Get instant SMS updates for ONDC orders and payments</p>
                            </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" checked={prefs.sms_enabled} onChange={() => handleToggle('sms_enabled')} />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#002147]"></div>
                        </label>
                    </div>

                    <div className="p-6 flex items-center justify-between">
                        <div className="flex gap-4">
                            <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600 shrink-0">
                                <Globe size={20} />
                            </div>
                            <div>
                                <p className="font-semibold text-slate-900">In-App Notifications</p>
                                <p className="text-sm text-slate-500">Show floating alerts and unread counts in the dashboard</p>
                            </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" checked={prefs.in_app_enabled} onChange={() => handleToggle('in_app_enabled')} />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#002147]"></div>
                        </label>
                    </div>
                </div>
            </div>

            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6 flex gap-4">
                <ShieldCheck className="text-amber-600 shrink-0" size={24} />
                <div>
                    <p className="font-bold text-amber-900 text-sm">Compliance Requirement</p>
                    <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                        Under the TEAM Governance Framework, critical security alerts and password reset emails cannot be disabled. These settings only apply to operational and marketing communications.
                    </p>
                </div>
            </div>
        </div>
    );
}
