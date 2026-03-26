import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function Breadcrumbs() {
    const { t } = useTranslation();
    const location = useLocation();
    const pathnames = location.pathname.split('/').filter((x) => x);

    if (location.pathname === '/') return null;

    return (
        <nav className="flex items-center space-x-2 text-xs font-medium mb-6 text-slate-400 overflow-x-auto no-scrollbar whitespace-nowrap py-1">
            <Link to="/" className="flex items-center gap-1.5 hover:text-[#002147] transition-colors shrink-0">
                <Home size={14} />
                <span>{t('home', 'Home')}</span>
            </Link>
            
            {pathnames.map((name, index) => {
                const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
                const isLast = index === pathnames.length - 1;
                const label = t(name.toLowerCase(), name.charAt(0).toUpperCase() + name.slice(1));

                return (
                    <React.Fragment key={name}>
                        <ChevronRight size={12} className="shrink-0" />
                        {isLast ? (
                            <span className="text-[#002147] font-bold shrink-0">{label}</span>
                        ) : (
                            <Link to={routeTo} className="hover:text-[#002147] transition-colors shrink-0">
                                {label}
                            </Link>
                        )}
                    </React.Fragment>
                );
            })}
        </nav>
    );
}
