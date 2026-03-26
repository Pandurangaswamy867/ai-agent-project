import React from 'react';
import { useLocation } from 'react-router-dom';
import { Shield, FileText, HelpCircle, ChevronRight, Mail, Phone, ExternalLink } from 'lucide-react';

export default function LegalPage() {
    const location = useLocation();
    const path = location.pathname;

    const isPrivacy = path.includes('privacy');
    const isTerms = path.includes('terms');
    const isHelp = path.includes('help');

    const content = {
        title: isPrivacy ? 'Privacy Policy' : isTerms ? 'Terms of Service' : 'Help & Support',
        icon: isPrivacy ? <Shield size={32} /> : isTerms ? <FileText size={32} /> : <HelpCircle size={32} />,
        lastUpdated: 'March 1, 2026'
    };

    if (isHelp) {
        return (
            <div className="max-w-4xl mx-auto py-12 px-4">
                <div className="flex items-center gap-4 mb-10">
                    <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-[#002147]">
                        <HelpCircle size={32} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Help & Support Center</h1>
                        <p className="text-slate-500 text-sm mt-1">Find answers and get assistance with the TEAM Portal</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                        <h3 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                            <Shield size={18} className="text-blue-600" /> Registration Help
                        </h3>
                        <p className="text-sm text-slate-600 mb-4">Learn how to register your MSE and complete the voice-enabled onboarding process.</p>
                        <button className="text-xs font-bold text-blue-600 flex items-center gap-1 hover:underline">
                            View Guide <ChevronRight size={14} />
                        </button>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                        <h3 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                            <FileText size={18} className="text-emerald-600" /> Compliance & Audit
                        </h3>
                        <p className="text-sm text-slate-600 mb-4">Understand the NSIC audit process and how to submit claims for subsidies.</p>
                        <button className="text-xs font-bold text-blue-600 flex items-center gap-1 hover:underline">
                            View Guide <ChevronRight size={14} />
                        </button>
                    </div>
                </div>

                <div className="bg-[#002147] rounded-3xl p-8 text-white relative overflow-hidden mb-12">
                    <div className="relative z-10">
                        <h2 className="text-xl font-bold mb-4">Need Direct Assistance?</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="flex items-center gap-3 bg-white/10 p-4 rounded-xl">
                                <Mail size={20} className="text-blue-300" />
                                <div>
                                    <p className="text-[10px] uppercase font-black tracking-widest text-blue-200">Email Support</p>
                                    <p className="text-sm font-bold">support@team-portal.gov.in</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 bg-white/10 p-4 rounded-xl">
                                <Phone size={20} className="text-emerald-300" />
                                <div>
                                    <p className="text-[10px] uppercase font-black tracking-widest text-emerald-200">Toll-Free</p>
                                    <p className="text-sm font-bold">1800-11-2026</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <h2 className="text-xl font-bold text-slate-900">Frequently Asked Questions</h2>
                    <div className="space-y-4">
                        {[
                            { q: "How do I use voice commands?", a: "Click the microphone icon at the bottom right and speak naturally. The system understands English, Hindi, Tamil, and more." },
                            { q: "What documents are required for registration?", a: "You will need a digital copy of your Aadhaar, PAN card, and Udyam Registration Certificate." },
                            { q: "How long does the audit process take?", a: "Standard verification by NSIC officers typically takes 3-5 business days." }
                        ].map((faq, i) => (
                            <div key={i} className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                <h4 className="font-bold text-slate-900 mb-2">{faq.q}</h4>
                                <p className="text-sm text-slate-600 leading-relaxed">{faq.a}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto py-12 px-4">
            <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-[#002147]">
                    {content.icon}
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">{content.title}</h1>
                    <p className="text-slate-500 text-sm mt-1">Last updated: {content.lastUpdated}</p>
                </div>
            </div>

            <div className="prose prose-slate max-w-none space-y-8 text-slate-600 leading-relaxed">
                {isPrivacy ? (
                    <>
                        <section>
                            <h2 className="text-xl font-bold text-slate-900 mb-3">1. Data Collection</h2>
                            <p>We collect business-critical information including enterprise names, contact details, GSTIN, and identity documents (Aadhaar/PAN) solely for the purpose of onboarding onto the TEAM platform and verifying eligibility for Ministry of MSME schemes.</p>
                        </section>
                        <section>
                            <h2 className="text-xl font-bold text-slate-900 mb-3">2. How We Use Your Data</h2>
                            <p>Your data is used to match your enterprise with appropriate Seller Network Participants (SNPs), facilitate digital commerce via ONDC, and provide AI-driven insights to help grow your business.</p>
                        </section>
                        <section>
                            <h2 className="text-xl font-bold text-slate-900 mb-3">3. Data Sharing</h2>
                            <p>We do not sell your personal or business data. Data is shared only with verified government auditors, approved SNPs (with your consent), and technical partners required to maintain the platform's infrastructure.</p>
                        </section>
                    </>
                ) : (
                    <>
                        <section>
                            <h2 className="text-xl font-bold text-slate-900 mb-3">1. Acceptable Use</h2>
                            <p>Users must provide accurate and truthful information during registration and claim submission. Fraudulent activity or submission of forged documents will result in immediate suspension and potential legal action.</p>
                        </section>
                        <section>
                            <h2 className="text-xl font-bold text-slate-900 mb-3">2. Platform Role</h2>
                            <p>The TEAM Portal acts as an intermediary mapping tool. While we facilitate connections between MSEs and SNPs, the final commercial agreements and transactions are the responsibility of the participating parties.</p>
                        </section>
                        <section>
                            <h2 className="text-xl font-bold text-slate-900 mb-3">3. Limitation of Liability</h2>
                            <p>The Ministry of MSME and its technical partners are not liable for business losses, transaction failures on the ONDC network, or disputes arising from partnerships formed through the portal.</p>
                        </section>
                    </>
                )}

                <section className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex items-center justify-between">
                    <p className="text-sm font-medium italic text-slate-500">Need the full legal PDF?</p>
                    <button className="flex items-center gap-2 text-xs font-bold text-blue-600 hover:underline">
                        Download Document <ExternalLink size={14} />
                    </button>
                </section>
            </div>
        </div>
    );
}
