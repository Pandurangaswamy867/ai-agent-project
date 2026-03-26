import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

export default function NotFound() {
    const { t } = useTranslation();
    return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
            <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mb-6">
                <span className="text-4xl font-black text-slate-300">404</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">{t('page_not_found', 'Page Not Found')}</h1>
            <p className="text-slate-500 mt-2 max-w-xs mx-auto">
                {t('404_msg', 'The portal page you are looking for does not exist or has been moved.')}
            </p>
            <Link to="/" className="mt-8 flex items-center gap-2 px-6 py-3 bg-[#002147] text-white font-semibold rounded-xl hover:bg-[#003366] transition-all">
                <Home size={18} /> {t('back_home', 'Back to Home')}
            </Link>
        </div>
    );
}
