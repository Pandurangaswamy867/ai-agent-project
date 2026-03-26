import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    Monitor, Server, Database, Brain, Cloud,
    ArrowDown, Shield, Package, TrendingUp,
    FileText, Bell, Users, Activity, Mic,
    CreditCard, GitBranch, Zap, Lock,
    BarChart2, AlertTriangle, Handshake,
    ScrollText, ShieldCheck, Command, Download
} from 'lucide-react';

/* ─── colour helpers ─── */
const LAYER_COLORS = {
    client:   { bg: 'bg-blue-50',    border: 'border-blue-200',  badge: 'bg-blue-600',   text: 'text-blue-700',   line: 'bg-blue-400'   },
    api:      { bg: 'bg-indigo-50',  border: 'border-indigo-200',badge: 'bg-indigo-600', text: 'text-indigo-700', line: 'bg-indigo-400' },
    service:  { bg: 'bg-violet-50',  border: 'border-violet-200',badge: 'bg-violet-600', text: 'text-violet-700', line: 'bg-violet-400' },
    ai:       { bg: 'bg-emerald-50', border: 'border-emerald-200',badge:'bg-emerald-600',text: 'text-emerald-700',line: 'bg-emerald-400'},
    data:     { bg: 'bg-amber-50',   border: 'border-amber-200', badge: 'bg-amber-600',  text: 'text-amber-700',  line: 'bg-amber-400'  },
    external: { bg: 'bg-slate-50',   border: 'border-slate-200', badge: 'bg-slate-600',  text: 'text-slate-600',  line: 'bg-slate-400'  },
};

const ROLE_COLORS: Record<string, string> = {
    mse:   'bg-blue-100 text-blue-700',
    snp:   'bg-teal-100 text-teal-700',
    nsic:  'bg-purple-100 text-purple-700',
    admin: 'bg-rose-100 text-rose-700',
    all:   'bg-slate-100 text-slate-600',
};

/* ─── data ─── */
const CLIENT_MODULES = [
    { name: 'HomeDashboard',     Icon: Activity,     role: 'mse'   },
    { name: 'SNPDashboard',      Icon: Users,        role: 'snp'   },
    { name: 'NSICDashboard',     Icon: Shield,       role: 'nsic'  },
    { name: 'TransactionLedger', Icon: CreditCard,   role: 'mse'   },
    { name: 'MatchingDashboard', Icon: TrendingUp,   role: 'mse'   },
    { name: 'OnboardingWizard',  Icon: GitBranch,    role: 'mse'   },
    { name: 'BusinessCatalog',   Icon: Package,      role: 'mse'   },
    { name: 'VoiceNavigator',    Icon: Mic,          role: 'all'   },
];

const API_ROUTERS = [
    { name: '/auth',           Icon: Lock,         tag: 'JWT'       },
    { name: '/mses',           Icon: Users,        tag: 'CRUD'      },
    { name: '/snps',           Icon: Handshake,    tag: 'CRUD'      },
    { name: '/products',       Icon: Package,      tag: 'CRUD'      },
    { name: '/transactions',   Icon: CreditCard,   tag: 'Ledger'    },
    { name: '/analytics',      Icon: BarChart2,    tag: 'Reports'   },
    { name: '/matching',       Icon: TrendingUp,   tag: 'AI'        },
    { name: '/ai',             Icon: Brain,        tag: 'ML'        },
    { name: '/documents',      Icon: FileText,     tag: 'OCR'       },
    { name: '/claims',         Icon: ShieldCheck,  tag: 'NSIC'      },
    { name: '/conflicts',      Icon: AlertTriangle,tag: 'Resolve'   },
    { name: '/partnerships',   Icon: Handshake,    tag: 'Audit'     },
    { name: '/notifications',  Icon: Bell,         tag: 'Realtime'  },
    { name: '/system-logs',    Icon: ScrollText,   tag: 'Audit'     },
];

const AI_MODELS = [
    { name: 'Whisper Tiny',               desc: 'ASR · Voice commands',        color: 'bg-emerald-500' },
    { name: 'paraphrase-MiniLM-L6-v2',   desc: 'SentenceTransformer · Matching', color: 'bg-teal-500'  },
    { name: 'Donut DocVQA',              desc: 'OCR · Document extraction',    color: 'bg-cyan-500'    },
    { name: 'BART MNLI',                 desc: 'Zero-shot · Intent classify',  color: 'bg-sky-500'     },
];

const DB_TABLES = [
    'users', 'mse', 'snp', 'mse_product', 'product_category',
    'product_version', 'transaction', 'transaction_conflict',
    'claim', 'ocr_document', 'partnership', 'notification',
    'notification_preferences', 'otp_verification', 'system_audit_log',
];

/* ─── sub-components ─── */
function LayerArrow({ label }: { label: string }) {
    return (
        <div className="flex flex-col items-center my-1 select-none">
            <div className="w-px h-4 bg-slate-300" />
            <div className="flex items-center gap-2 px-3 py-0.5 bg-slate-100 border border-slate-200 rounded-full">
                <ArrowDown size={10} className="text-slate-400" />
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{label}</span>
                <ArrowDown size={10} className="text-slate-400" />
            </div>
            <div className="w-px h-4 bg-slate-300" />
        </div>
    );
}

function LayerHeader({ icon: Icon, label, badge, sublabel, colorKey }: {
    icon: React.ElementType; label: string; badge: string; sublabel: string; colorKey: keyof typeof LAYER_COLORS;
}) {
    const c = LAYER_COLORS[colorKey];
    return (
        <div className="flex items-center gap-3 mb-4">
            <div className={`w-9 h-9 ${c.badge} rounded-xl flex items-center justify-center shadow`}>
                <Icon size={18} className="text-white" />
            </div>
            <div>
                <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-slate-800 uppercase tracking-tight">{label}</span>
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${c.badge} text-white uppercase tracking-widest`}>{badge}</span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">{sublabel}</p>
            </div>
        </div>
    );
}

/* ─── main component ─── */
export default function ArchitectureDiagram() {
    const [hoveredRouter, setHoveredRouter] = useState<string | null>(null);
    const [hoveredModel, setHoveredModel] = useState<string | null>(null);

    return (
        <div className="min-h-screen bg-slate-50 p-6">
            {/* Title */}
            <div className="max-w-5xl mx-auto mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-[#002147] rounded-xl flex items-center justify-center shadow-lg">
                        <Command size={22} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-[#002147] tracking-tight uppercase">TEAM Initiative</h1>
                        <p className="text-xs text-slate-500 font-medium">System Architecture · ONDC MSE & SNP Platform</p>
                    </div>
                    <Link
                        to="/architecture/highlevel"
                        className="ml-auto flex items-center gap-2 px-4 py-2 bg-[#002147] text-white text-xs font-bold rounded-xl shadow hover:bg-blue-900 transition-all"
                    >
                        <Download size={14} /> High-Level PDF
                    </Link>
                </div>

                {/* Legend */}
                <div className="flex flex-wrap gap-3 mt-4">
                    {Object.entries(ROLE_COLORS).map(([role, cls]) => (
                        <span key={role} className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${cls}`}>{role}</span>
                    ))}
                    <span className="text-[10px] font-medium text-slate-400 self-center">— Role access level</span>
                </div>
            </div>

            <div className="max-w-5xl mx-auto flex flex-col">

                {/* ── Layer 1: CLIENT ── */}
                <div className={`rounded-2xl border-2 ${LAYER_COLORS.client.border} ${LAYER_COLORS.client.bg} p-5 shadow-sm`}>
                    <LayerHeader icon={Monitor} label="Client Layer" badge="Browser" sublabel="React 18 · TypeScript · Tailwind CSS · React Router · i18n (6 languages) · Axios" colorKey="client" />
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {CLIENT_MODULES.map(({ name, Icon, role }) => (
                            <div key={name} className="bg-white rounded-xl border border-blue-100 px-3 py-2 flex items-center gap-2 shadow-sm hover:shadow-md transition-shadow">
                                <Icon size={14} className="text-blue-500 shrink-0" />
                                <div className="min-w-0">
                                    <p className="text-[11px] font-bold text-slate-700 truncate">{name}</p>
                                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${ROLE_COLORS[role]}`}>{role}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                        {['AuthContext', 'MSEContext', 'NotificationContext', 'ToastContext', 'ErrorBoundary'].map(c => (
                            <span key={c} className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{c}</span>
                        ))}
                    </div>
                </div>

                <LayerArrow label="HTTP/REST · Bearer JWT · Axios" />

                {/* ── Layer 2: API GATEWAY ── */}
                <div className={`rounded-2xl border-2 ${LAYER_COLORS.api.border} ${LAYER_COLORS.api.bg} p-5 shadow-sm`}>
                    <LayerHeader icon={Zap} label="API Gateway" badge="FastAPI" sublabel="Python · Uvicorn · CORS · JWT Auth Middleware · Role-based Access Control" colorKey="api" />
                    <div className="grid grid-cols-2 sm:grid-cols-7 gap-2">
                        {API_ROUTERS.map(({ name, Icon, tag }) => (
                            <div
                                key={name}
                                onMouseEnter={() => setHoveredRouter(name)}
                                onMouseLeave={() => setHoveredRouter(null)}
                                className={`bg-white rounded-xl border px-2 py-2 flex flex-col items-center text-center shadow-sm cursor-default transition-all ${hoveredRouter === name ? 'border-indigo-400 shadow-indigo-100 shadow-md scale-105' : 'border-indigo-100'}`}
                            >
                                <Icon size={14} className="text-indigo-500 mb-1" />
                                <p className="text-[10px] font-bold text-slate-700 leading-tight">{name}</p>
                                <span className="text-[8px] font-black bg-indigo-50 text-indigo-500 px-1 py-0.5 rounded mt-1">{tag}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <LayerArrow label="SQLAlchemy ORM · psycopg2" />

                {/* ── Layer 3: SERVICES + AI (side by side) ── */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                    {/* 3A: Backend Services */}
                    <div className={`rounded-2xl border-2 ${LAYER_COLORS.service.border} ${LAYER_COLORS.service.bg} p-5 shadow-sm`}>
                        <LayerHeader icon={Server} label="Backend Services" badge="Python" sublabel="Business logic · Validation · File handling" colorKey="service" />
                        <div className="flex flex-col gap-2">
                            {[
                                { name: 'matching_utils.py',  desc: 'SentenceTransformer similarity engine' },
                                { name: 'product_utils.py',   desc: 'AI categorisation · zero-shot classifier' },
                                { name: 'voice_utils.py',     desc: 'ASR transcription · intent mapping' },
                                { name: 'ocr_utils.py',       desc: 'Document extraction · Donut pipeline' },
                                { name: 'File System',        desc: 'uploads/ · secure UUID-named storage' },
                            ].map(({ name, desc }) => (
                                <div key={name} className="bg-white rounded-xl border border-violet-100 px-3 py-2 flex items-start gap-2 shadow-sm">
                                    <div className="w-1.5 h-1.5 rounded-full bg-violet-400 mt-1.5 shrink-0" />
                                    <div>
                                        <p className="text-[11px] font-bold text-slate-800">{name}</p>
                                        <p className="text-[10px] text-slate-500">{desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 3B: AI / ML Models */}
                    <div className={`rounded-2xl border-2 ${LAYER_COLORS.ai.border} ${LAYER_COLORS.ai.bg} p-5 shadow-sm`}>
                        <LayerHeader icon={Brain} label="AI / ML Layer" badge="HuggingFace" sublabel="Lazy-loaded · Cached globally · CPU / CUDA" colorKey="ai" />
                        <div className="flex flex-col gap-2">
                            {AI_MODELS.map(({ name, desc, color }) => (
                                <div
                                    key={name}
                                    onMouseEnter={() => setHoveredModel(name)}
                                    onMouseLeave={() => setHoveredModel(null)}
                                    className={`bg-white rounded-xl border px-3 py-2 flex items-start gap-3 shadow-sm transition-all cursor-default ${hoveredModel === name ? 'border-emerald-400 shadow-emerald-100 shadow-md' : 'border-emerald-100'}`}
                                >
                                    <div className={`w-2.5 h-2.5 rounded-full ${color} mt-1.5 shrink-0`} />
                                    <div>
                                        <p className="text-[11px] font-bold text-slate-800 font-mono">{name}</p>
                                        <p className="text-[10px] text-slate-500">{desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-3 flex items-center gap-2 text-[10px] text-slate-400 font-medium">
                            <Cloud size={12} />
                            Downloaded from HuggingFace Hub on first use · cached in ~/.cache/huggingface
                        </div>
                    </div>
                </div>

                <LayerArrow label="SQLAlchemy · psycopg2-binary" />

                {/* ── Layer 4: DATABASE ── */}
                <div className={`rounded-2xl border-2 ${LAYER_COLORS.data.border} ${LAYER_COLORS.data.bg} p-5 shadow-sm`}>
                    <LayerHeader icon={Database} label="Data Layer" badge="PostgreSQL" sublabel="team_db · localhost:5432 · SQLAlchemy ORM · 15 tables · Sequences auto-reset" colorKey="data" />
                    <div className="flex flex-wrap gap-2">
                        {DB_TABLES.map(t => (
                            <span key={t} className="font-mono text-[10px] font-bold bg-white border border-amber-200 text-amber-800 px-2 py-1 rounded-lg shadow-sm hover:bg-amber-50 transition-colors cursor-default">
                                {t}
                            </span>
                        ))}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                        {['UUID PKs', 'FK Cascades', 'Enum Types', 'Boolean Cols', 'DateTime Audit', 'JSON Fields (String)'].map(f => (
                            <span key={f} className="text-[9px] font-black bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full uppercase">{f}</span>
                        ))}
                    </div>
                </div>

                <LayerArrow label="HuggingFace Hub · Model Downloads" />

                {/* ── Layer 5: EXTERNAL ── */}
                <div className={`rounded-2xl border-2 ${LAYER_COLORS.external.border} ${LAYER_COLORS.external.bg} p-5 shadow-sm`}>
                    <LayerHeader icon={Cloud} label="External Services" badge="Remote" sublabel="Third-party integrations and infrastructure dependencies" colorKey="external" />
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {[
                            { name: 'HuggingFace Hub', desc: 'Model weights · whisper-tiny, MiniLM, donut, bart-large-mnli', icon: Cloud },
                            { name: 'ONDC Network',    desc: 'Open Network for Digital Commerce · Order protocol', icon: Zap },
                            { name: 'PostgreSQL',      desc: 'Hosted DB · localhost (dev) / cloud (prod)', icon: Database },
                            { name: 'SMTP / SMS',      desc: 'OTP delivery channel (pluggable)', icon: Bell },
                        ].map(({ name, desc, icon: Icon }) => (
                            <div key={name} className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm">
                                <div className="flex items-center gap-2 mb-1">
                                    <Icon size={14} className="text-slate-500" />
                                    <p className="text-[11px] font-bold text-slate-700">{name}</p>
                                </div>
                                <p className="text-[10px] text-slate-400 leading-relaxed">{desc}</p>
                            </div>
                        ))}
                    </div>
                </div>

            </div>

            {/* Tech stack footer */}
            <div className="max-w-5xl mx-auto mt-8 p-5 bg-[#002147] rounded-2xl shadow-xl">
                <p className="text-[10px] font-black text-blue-300 uppercase tracking-widest mb-3">Full Technology Stack</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: 'Frontend', items: ['React 18', 'TypeScript', 'Tailwind CSS', 'React Router v6', 'Axios', 'i18next', 'Lucide Icons'] },
                        { label: 'Backend',  items: ['FastAPI', 'Python 3.14', 'Uvicorn', 'SQLAlchemy', 'Pydantic v2', 'python-jose', 'passlib'] },
                        { label: 'AI / ML', items: ['HuggingFace Transformers', 'Whisper Tiny (ASR)', 'MiniLM-L6 (NLP)', 'Donut (OCR)', 'BART MNLI'] },
                        { label: 'Infra',    items: ['PostgreSQL 16', 'psycopg2-binary', 'python-dotenv', 'pypdfium2', 'Pillow', 'librosa', 'soundfile'] },
                    ].map(({ label, items }) => (
                        <div key={label}>
                            <p className="text-[10px] font-black text-white uppercase tracking-widest mb-2">{label}</p>
                            {items.map(i => (
                                <p key={i} className="text-[11px] text-blue-200 font-medium py-0.5">{i}</p>
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
