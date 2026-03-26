import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Save, User, Mail, Phone, MapPin, Building2 } from 'lucide-react';
import config from '../../config';
import type { SNP } from '../../types';

interface SNPProfileEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    snpId: number;
    initialData: SNP | null;
    onSuccess: () => void;
}

interface FormData {
    name: string;
    contact_person: string;
    email: string;
    phone: string;
    city: string;
}

export default function SNPProfileEditModal({ isOpen, onClose, snpId, initialData, onSuccess }: SNPProfileEditModalProps) {
    const [formData, setFormData] = useState<FormData>({ name: '', contact_person: '', email: '', phone: '', city: '' });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name || '',
                contact_person: initialData.contact_person || '',
                email: initialData.email || '',
                phone: initialData.phone || '',
                city: initialData.city || ''
            });
        }
    }, [initialData]);

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await axios.put(`${config.API_BASE_URL}/snps/${snpId}`, { ...initialData, ...formData });
            onSuccess();
            onClose();
        } catch (err) {
            alert("Failed to update profile.");
        } finally {
            setLoading(false);
        }
    };

    const fields: { key: keyof FormData; label: string; icon: React.ComponentType<any>; type?: string }[] = [
        { key: 'contact_person', label: 'Contact person', icon: User },
        { key: 'city', label: 'City', icon: MapPin },
        { key: 'email', label: 'Email', icon: Mail, type: 'email' },
        { key: 'phone', label: 'Phone', icon: Phone },
    ];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="text-base font-bold text-slate-900">Edit profile</h3>
                    <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all">
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Name — read-only */}
                    <div>
                        <label htmlFor="business-name" className="block text-xs font-medium text-slate-500 mb-1.5">Business name</label>
                        <div className="relative">
                            <Building2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
                            <input id="business-name" type="text" value={formData.name} readOnly
                                className="w-full bg-slate-100 border border-slate-200 rounded-xl py-2.5 pl-9 pr-3 text-sm text-slate-400 cursor-not-allowed" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        {fields.map(({ key, label, icon: Icon, type }) => (
                            <div key={key}>
                                <label htmlFor={key} className="block text-xs font-medium text-slate-500 mb-1.5">{label}</label>
                                <div className="relative">
                                    <Icon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
                                    <input id={key} type={type || 'text'}
                                        value={formData[key]}
                                        onChange={e => setFormData({ ...formData, [key]: e.target.value })}
                                        required
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-9 pr-3 text-sm outline-none focus:border-slate-400 transition-all" />
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex gap-3 pt-1">
                        <button type="button" onClick={onClose}
                            className="flex-1 py-2.5 text-sm font-medium text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all">
                            Cancel
                        </button>
                        <button type="submit" disabled={loading}
                            className="flex-1 py-2.5 text-sm font-semibold text-white bg-[#002147] rounded-xl hover:bg-[#003366] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                            {loading
                                ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                : <><Save size={14} /> Save changes</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
