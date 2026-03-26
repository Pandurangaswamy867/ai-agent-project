import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Network, Server, ArrowRight, ArrowLeft, ShieldCheck, MapPin, KeyRound, X as CloseIcon, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import config from '../../config';
import { useAuth } from '../../context/AuthContext';

const STEP_ACCOUNT = 1;
const STEP_PROFILE = 2;

export default function SnpRegistration() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [categories, setCategories] = useState<string[]>([]);
    const [customSector, setCustomSector] = useState('');
    
    useEffect(() => {
        const fetchCats = async () => {
            try {
                const res = await axios.get(`${config.API_BASE_URL}/products/categories`);
                const names = res.data.map((c: any) => c.category_name);
                setCategories([...new Set([...names, "Textiles & Apparel", "Handicrafts & Decor", "Agri & Food", "General Merchandise"])]);
            } catch {
                setCategories(["Textiles & Apparel", "Handicrafts & Decor", "Agri & Food", "General Merchandise"]);
            }
        };
        fetchCats();
    }, []);

    // Persistence Logic (FORM-01)
    const [step, setStep] = useState(() => Number(localStorage.getItem('snp_step')) || STEP_ACCOUNT);

    const [accountData, setAccountData] = useState(() => {
        const saved = localStorage.getItem('snp_account');
        return saved ? JSON.parse(saved) : { email: '', phone: '', password: '', confirmPassword: '' };
    });

    const [profileData, setProfileData] = useState(() => {
        const saved = localStorage.getItem('snp_profile');
        return saved ? JSON.parse(saved) : {
            name: '',
            type: 'Logistics',
            contact_person: '',
            city: '',
            onboarding_fee: 0,
            commission_rate: 0,
            supported_sectors: '[]',
            pincode_expertise: '',
            capacity: 500,
            settlement_days: 2,
            fulfillment_rate: 98,
        };
    });

    const selectedSectors: string[] = JSON.parse(profileData.supported_sectors || '[]');

    const toggleSector = (sector: string) => {
        const current = [...selectedSectors];
        const idx = current.indexOf(sector);
        if (idx > -1) current.splice(idx, 1);
        else current.push(sector);
        setProfileData({ ...profileData, supported_sectors: JSON.stringify(current) });
    };

    const addCustomSector = () => {
        if (!customSector.trim()) return;
        if (!selectedSectors.includes(customSector.trim())) {
            toggleSector(customSector.trim());
        }
        setCustomSector('');
    };

    useEffect(() => {
        localStorage.setItem('snp_step', step.toString());
        localStorage.setItem('snp_account', JSON.stringify(accountData));
        localStorage.setItem('snp_profile', JSON.stringify(profileData));
    }, [step, accountData, profileData]);

    const clearPersistence = () => {
        localStorage.removeItem('snp_step');
        localStorage.removeItem('snp_account');
        localStorage.removeItem('snp_profile');
    };

    const [success, setSuccess] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const FormError = ({ message }: { message?: React.ReactNode }) => (
        message ? <div className="text-red-500 text-[10px] font-bold mt-1 ml-1">{message}</div> : null
    );

    const validateAccount = () => {
        const errs: Record<string, string> = {};
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(accountData.email)) errs.email = 'Invalid email format';
        if (!/^[6-9]\d{9}$/.test(accountData.phone)) errs.phone = 'Invalid 10-digit mobile number';
        if (accountData.password.length < 8) errs.password = 'Password must be at least 8 characters';
        if (accountData.password !== accountData.confirmPassword) errs.confirmPassword = 'Passwords do not match';
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const validateProfile = () => {
        const errs: Record<string, string> = {};
        if (!profileData.name) errs.name = 'Partner name is required';
        if (profileData.commission_rate < 0 || profileData.commission_rate > 100) errs.commission_rate = 'Rate must be between 0 and 100';
        
        const pincodes = profileData.pincode_expertise.split(',').map((s: string) => s.trim()).filter((s: string) => s);
        if (pincodes.some((p: string) => !/^\d{6}$/.test(p))) errs.pincode_expertise = 'All pincodes must be 6 digits';
        
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleCreateAccount = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateAccount()) return;
        setStep(STEP_PROFILE);
    };

    const handleCompleteProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateProfile()) return;
        setIsSubmitting(true);
        try {
            const cleanSectors = profileData.supported_sectors
                .split(',')
                .map((s: string) => s.trim())
                .filter((s: string) => s.length > 0);
            
            const cleanPincodes = profileData.pincode_expertise
                .split(',')
                .map((s: string) => s.trim())
                .filter((s: string) => s.length > 0);

            const res = await axios.post(`${config.API_BASE_URL}/snps/register`, {
                ...profileData,
                email: accountData.email,
                phone: accountData.phone,
                password: accountData.password,
                commission_rate: profileData.commission_rate / 100, // Convert % to decimal
                supported_sectors: JSON.stringify(cleanSectors),
                pincode_expertise: JSON.stringify(cleanPincodes),
                capacity: profileData.capacity,
                settlement_speed: Math.max(0, 1 - (profileData.settlement_days / 10)), // Mock heuristic: 1 day = 0.9, 5 days = 0.5
                fulfillment_reliability: profileData.fulfillment_rate / 100
            });
            const token = res.data.access_token;
            const snpId = res.data.snp?.snp_id;
            const userId = res.data.user?.id;
            if (token) {
                localStorage.setItem('authToken', token);
                login('snp', userId, token, snpId);
            }
            clearPersistence();
            setSuccess(true);
        } catch (error: any) {
            if (error.response?.status === 409) {
                setErrors(prev => ({
                    ...prev,
                    email: (
                        <span>
                            This email is already registered. Please <a href="/" className="underline text-blue-600">log in</a>.
                        </span>
                    ) as any
                }));
                setStep(STEP_ACCOUNT);
                return;
            }
            console.error(error);
            const errorMessage = error.response?.data?.detail || 'Failed to save profile. Please try again.';
            alert(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
                <div className="bg-white border border-slate-200 p-12 rounded-2xl text-center max-w-md animate-in fade-in zoom-in duration-500 shadow-xl border-t-8 border-t-emerald-600">
                    <ShieldCheck className="text-emerald-600 mx-auto mb-6" size={80} />
                    <h2 className="text-3xl font-black text-[#002147] uppercase tracking-tight mb-2">Registration Successful</h2>
                    <p className="text-slate-500 mb-8 font-medium">Your Node has been successfully provisioned and integrated into the ONDC National Registry.</p>
                    <button 
                        onClick={() => navigate('/snp/dashboard')}
                        className="inline-block px-10 py-4 bg-[#002147] hover:bg-[#003366] text-white font-black uppercase tracking-widest rounded-xl transition-all shadow-lg active:scale-95"
                    >
                        Go to Portal
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center py-20 px-4">
            <div className="fixed top-0 left-0 w-full h-2 bg-[#002147] z-50"></div>

            <div className="w-full max-w-xl fade-in duration-700">
                <div className="text-center mb-12">
                    <div className="inline-flex p-5 bg-white border border-slate-200 shadow-sm rounded-2xl mb-6">
                        <Network className="text-orange-600" size={40} />
                    </div>
                    <h1 className="text-4xl font-black text-[#002147] tracking-tight uppercase mb-4 leading-tight">
                        National Registry: <span className="text-orange-600">Network Participant</span>
                    </h1>
                    <p className="text-slate-500 max-w-xl mx-auto font-medium">
                        {step === STEP_ACCOUNT
                            ? 'Create your login credentials to get started.'
                            : 'Complete your node profile to go live on the ONDC network.'}
                    </p>
                </div>

                {/* Step indicator */}
                <div className="flex items-center justify-center gap-4 mb-10">
                    {[
                        { s: STEP_ACCOUNT, icon: KeyRound, label: 'Account' },
                        { s: STEP_PROFILE, icon: Server, label: 'Profile' },
                    ].map((item, idx) => (
                        <React.Fragment key={item.s}>
                            <div className="flex flex-col items-center">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-all duration-500 ${step >= item.s ? 'bg-[#002147] border-[#002147] text-white shadow-xl' : 'bg-white border-slate-200 text-slate-300'}`}>
                                    <item.icon size={20} />
                                </div>
                                <span className={`text-[9px] font-black mt-2 tracking-widest uppercase ${step >= item.s ? 'text-[#002147]' : 'text-slate-300'}`}>{item.label}</span>
                            </div>
                            {idx === 0 && <div className={`flex-1 h-[2px] mt-[-12px] transition-all duration-700 ${step >= STEP_PROFILE ? 'bg-orange-600' : 'bg-slate-200'}`} />}
                        </React.Fragment>
                    ))}
                </div>

                <div className="bg-white border border-slate-200 p-10 rounded-2xl shadow-xl border-b-8 border-b-[#002147]">
                    {step === STEP_ACCOUNT && (
                        <form onSubmit={handleCreateAccount} className="space-y-6">
                            <div className="space-y-2">
                                <label htmlFor="email" className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Email</label>
                                <input id="email" required type="email" value={accountData.email} onChange={e => { setAccountData({ ...accountData, email: e.target.value }); setErrors(prev => ({ ...prev, email: '' })); }} className={`w-full bg-slate-50 border ${errors.email ? 'border-red-500' : 'border-slate-200'} rounded-xl p-4 text-[#002147] focus:border-[#002147] outline-none transition-all font-medium`} placeholder="admin@node.gov.in" />
                                <FormError message={errors.email} />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="phone" className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Mobile Number</label>
                                <input id="phone" required type="text" value={accountData.phone} onChange={e => { setAccountData({ ...accountData, phone: e.target.value }); setErrors(prev => ({ ...prev, phone: '' })); }} className={`w-full bg-slate-50 border ${errors.phone ? 'border-red-500' : 'border-slate-200'} rounded-xl p-4 text-[#002147] focus:border-[#002147] outline-none transition-all font-medium`} placeholder="+91 XXXXX XXXXX" />
                                <FormError message={errors.phone} />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="password" className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Password</label>
                                <input id="password" required type="password" value={accountData.password} onChange={e => { setAccountData({ ...accountData, password: e.target.value }); setErrors(prev => ({ ...prev, password: '' })); }} className={`w-full bg-slate-50 border ${errors.password ? 'border-red-500' : 'border-slate-200'} rounded-xl p-4 text-[#002147] focus:border-[#002147] outline-none transition-all font-medium`} placeholder="Min. 8 characters" />
                                <FormError message={errors.password} />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="confirmPassword" className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Confirm Password</label>
                                <input id="confirmPassword" required type="password" value={accountData.confirmPassword} onChange={e => { setAccountData({ ...accountData, confirmPassword: e.target.value }); setErrors(prev => ({ ...prev, confirmPassword: '' })); }} className={`w-full bg-slate-50 border ${errors.confirmPassword ? 'border-red-500' : 'border-slate-200'} rounded-xl p-4 text-[#002147] focus:border-[#002147] outline-none transition-all font-medium`} placeholder="Repeat password" />
                                <FormError message={errors.confirmPassword} />
                            </div>
                            <div className="pt-4">
                                <button disabled={isSubmitting} type="submit" className="w-full px-10 py-4 bg-[#002147] hover:bg-[#003366] text-white font-black uppercase tracking-widest rounded-xl flex items-center justify-center space-x-3 transition-all shadow-lg active:scale-95 disabled:opacity-50">
                                    <span>{isSubmitting ? 'Creating Account...' : 'Create Account & Continue'}</span>
                                    <ArrowRight size={18} />
                                </button>
                            </div>
                        </form>
                    )}

                    {step === STEP_PROFILE && (
                        <form onSubmit={handleCompleteProfile} className="space-y-8">
                            <div>
                                <h3 className="text-xs font-black text-[#002147] uppercase tracking-widest mb-6 flex items-center gap-3 border-l-4 border-orange-600 pl-4">
                                    <Server size={16} className="text-orange-600" /> Node Identity
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label htmlFor="org-name" className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Organization Name</label>
                                        <input id="org-name" required type="text" value={profileData.name} onChange={e => { setProfileData({ ...profileData, name: e.target.value }); if(errors.name) setErrors(prev => ({ ...prev, name: '' })); }} className={`w-full bg-slate-50 border ${errors.name ? 'border-red-500' : 'border-slate-200'} rounded-xl p-4 text-[#002147] focus:border-[#002147] outline-none transition-all font-medium`} placeholder="e.g. Bharat Logistics AI" />
                                        <FormError message={errors.name} />
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="protocol-role" className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Protocol Role</label>
                                        <select id="protocol-role" value={profileData.type} onChange={e => setProfileData({ ...profileData, type: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-[#002147] font-bold focus:border-[#002147] outline-none transition-all">
                                            <option value="Logistics">Logistics Provider (LSP)</option>
                                            <option value="Seller App (ISV/Catalog)">Seller App (ISV/Catalog)</option>
                                            <option value="Payments">Payment Service Provider</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <label htmlFor="contact_person" className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Contact Person</label>
                                        <input id="contact_person" type="text" value={profileData.contact_person} onChange={e => setProfileData({ ...profileData, contact_person: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-[#002147] focus:border-[#002147] outline-none transition-all font-medium" placeholder="Nodal Officer Name" />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-xs font-black text-[#002147] uppercase tracking-widest mb-6 flex items-center gap-3 border-l-4 border-orange-600 pl-4">
                                    <MapPin size={16} className="text-orange-600" /> Operations & Capacity
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label htmlFor="city" className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Headquarter City</label>
                                        <input id="city" required type="text" value={profileData.city} onChange={e => setProfileData({ ...profileData, city: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-[#002147] focus:border-[#002147] outline-none transition-all font-medium" placeholder="Delhi" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Certified Domains</label>
                                        <div className="flex flex-wrap gap-2 mb-2 min-h-[40px] p-2 bg-slate-50 border border-slate-200 rounded-xl">
                                            {selectedSectors.length === 0 ? (
                                                <span className="text-[10px] text-slate-400 italic p-1">Select or add sectors below...</span>
                                            ) : (
                                                selectedSectors.map(s => (
                                                    <span key={s} className="inline-flex items-center gap-1 px-2 py-1 bg-[#002147] text-white text-[10px] font-bold rounded-lg group">
                                                        {s}
                                                        <button type="button" onClick={() => toggleSector(s)} className="hover:text-red-400">
                                                            <CloseIcon size={10} />
                                                        </button>
                                                    </span>
                                                ))
                                            )}
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            {categories.slice(0, 6).map(cat => (
                                                <button
                                                    key={cat}
                                                    type="button"
                                                    onClick={() => toggleSector(cat)}
                                                    className={`px-3 py-2 border rounded-lg text-[10px] font-bold transition-all ${
                                                        selectedSectors.includes(cat)
                                                            ? 'bg-orange-50 border-orange-600 text-orange-700'
                                                            : 'bg-white border-slate-200 text-slate-600 hover:border-[#002147]'
                                                    }`}
                                                >
                                                    {cat}
                                                </button>
                                            ))}
                                        </div>
                                        <div className="mt-2 flex gap-2">
                                            <input
                                                type="text"
                                                value={customSector}
                                                onChange={e => setCustomSector(e.target.value)}
                                                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCustomSector())}
                                                placeholder="Add custom sector..."
                                                className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-[10px] outline-none focus:border-[#002147]"
                                            />
                                            <button
                                                type="button"
                                                onClick={addCustomSector}
                                                className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200"
                                            >
                                                <Plus size={14} />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="fee" className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Onboarding Fee (₹)</label>
                                        <input id="fee" required type="number" min="0" value={profileData.onboarding_fee} onChange={e => setProfileData({ ...profileData, onboarding_fee: Number(e.target.value) })} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-[#002147] focus:border-[#002147] outline-none transition-all font-bold" />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <label htmlFor="commission" className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Commission Rate (%)</label>
                                            <span className="text-[9px] text-slate-400 font-bold italic">e.g. 15 for 15%</span>
                                        </div>
                                        <input id="commission" required type="number" step="0.1" min="0" max="100" value={profileData.commission_rate} onChange={e => { setProfileData({ ...profileData, commission_rate: Number(e.target.value) }); if(errors.commission_rate) setErrors(prev => ({ ...prev, commission_rate: '' })); }} className={`w-full bg-slate-50 border ${errors.commission_rate ? 'border-red-500' : 'border-slate-200'} rounded-xl p-4 text-[#002147] focus:border-[#002147] outline-none transition-all font-bold`} />
                                        <FormError message={errors.commission_rate} />
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <label htmlFor="pincodes" className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Serviceable Pincodes</label>
                                        <input id="pincodes" required type="text" value={profileData.pincode_expertise} onChange={e => { setProfileData({ ...profileData, pincode_expertise: e.target.value }); if(errors.pincode_expertise) setErrors(prev => ({ ...prev, pincode_expertise: '' })); }} className={`w-full bg-slate-50 border ${errors.pincode_expertise ? 'border-red-500' : 'border-slate-200'} rounded-xl p-4 text-[#002147] focus:border-[#002147] outline-none transition-all font-medium`} placeholder="110001, 400001" />
                                        <FormError message={errors.pincode_expertise} />
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="capacity" className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Monthly order capacity</label>
                                        <input id="capacity" required type="number" min="1" value={profileData.capacity} onChange={e => setProfileData({ ...profileData, capacity: Number(e.target.value) })} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-[#002147] focus:border-[#002147] outline-none transition-all font-bold" />
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="settlement" className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Avg settlement time (days)</label>
                                        <input id="settlement" required type="number" min="1" value={profileData.settlement_days} onChange={e => setProfileData({ ...profileData, settlement_days: Number(e.target.value) })} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-[#002147] focus:border-[#002147] outline-none transition-all font-bold" />
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <label htmlFor="fulfillment" className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Fulfillment success rate (%)</label>
                                        <input id="fulfillment" required type="number" min="0" max="100" value={profileData.fulfillment_rate} onChange={e => setProfileData({ ...profileData, fulfillment_rate: Number(e.target.value) })} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-[#002147] focus:border-[#002147] outline-none transition-all font-bold" />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 flex justify-between items-center border-t border-slate-100">
                                <button type="button" onClick={() => setStep(STEP_ACCOUNT)} className="text-slate-400 hover:text-[#002147] font-black text-[10px] uppercase tracking-widest flex items-center space-x-2 transition-colors">
                                    <ArrowLeft size={16} />
                                    <span>Go Back</span>
                                </button>
                                <button disabled={isSubmitting} type="submit" className="px-10 py-4 bg-[#002147] hover:bg-[#003366] text-white font-black uppercase tracking-widest rounded-xl flex items-center space-x-3 transition-all shadow-lg active:scale-95 disabled:opacity-50">
                                    <span>{isSubmitting ? 'Provisioning...' : 'Submit to Registry'}</span>
                                    <ArrowRight size={18} />
                                </button>
                            </div>
                        </form>
                    )}
                </div>

                <div className="mt-8 text-center grayscale opacity-30">
                    <span className="text-[9px] font-black tracking-widest text-[#002147]">DIGITAL INDIA • VIKSIT BHARAT • ONDC LIVE</span>
                </div>
            </div>
        </div>
    );
}
