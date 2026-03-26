import { Download, Command } from 'lucide-react';

/* ── types ── */
interface Box {
    id: string;
    label: string;
    sublabel: string;
    items: string[];
    accent: string;  // tailwind bg colour token (for left border & icon)
    textColor: string;
    bg: string;
    border: string;
}

interface Arrow {
    from: string;
    to: string;
    label: string;
    color: string;
}

/* ── diagram data ── */
const BOXES: Box[] = [
    {
        id: 'users',
        label: 'End Users',
        sublabel: 'Roles & Access Points',
        items: ['MSE · Enterprise Portal (Browser)', 'SNP · Network Partner Portal (Browser)', 'NSIC / Admin · Audit & Compliance (Browser)'],
        accent: '#6366f1', textColor: '#3730a3', bg: '#eef2ff', border: '#c7d2fe',
    },
    {
        id: 'frontend',
        label: 'Frontend SPA',
        sublabel: 'React 18 + TypeScript + Tailwind CSS',
        items: [
            'MSE Dashboard · Onboarding · Ledger · Catalogue · Matching',
            'SNP Dashboard · Network Management · Transaction Modal',
            'NSIC Audit · OCR Review · Claims · Analytics',
            'JWT Auth · i18n (EN/HI/TA/TE/BN/MR/GU) · Voice Navigator',
        ],
        accent: '#3b82f6', textColor: '#1e40af', bg: '#eff6ff', border: '#bfdbfe',
    },
    {
        id: 'api',
        label: 'FastAPI Backend',
        sublabel: 'Python 3.14 · Uvicorn · CORS · Role-based JWT',
        items: [
            'Identity  ·  /auth  ·  /mses  ·  /snps',
            'Commerce  ·  /products  ·  /transactions  ·  /partnerships',
            'Intelligence  ·  /matching  ·  /analytics  ·  /ai',
            'Compliance  ·  /documents  ·  /claims  ·  /conflicts  ·  /notifications  ·  /system-logs',
        ],
        accent: '#8b5cf6', textColor: '#5b21b6', bg: '#f5f3ff', border: '#ddd6fe',
    },
    {
        id: 'ai',
        label: 'AI / ML Pipeline',
        sublabel: 'HuggingFace Transformers · Lazy-loaded · CPU/CUDA',
        items: [
            'Whisper Tiny  ·  Automatic Speech Recognition (Voice Nav)',
            'MiniLM-L6-v2  ·  Sentence Similarity (MSE ↔ SNP Matching)',
            'Donut DocVQA  ·  Document OCR Extraction (KYC / Udyam)',
            'BART MNLI  ·  Zero-shot Intent Classification',
        ],
        accent: '#10b981', textColor: '#065f46', bg: '#ecfdf5', border: '#a7f3d0',
    },
    {
        id: 'db',
        label: 'PostgreSQL Database',
        sublabel: 'team_db · SQLAlchemy ORM · 15 tables',
        items: [
            'Entities  ·  users · mse · snp · mse_product · product_category',
            'Operations  ·  transaction · partnership · claim · ocr_document',
            'Platform  ·  notification · system_audit_log · otp_verification',
        ],
        accent: '#f59e0b', textColor: '#92400e', bg: '#fffbeb', border: '#fde68a',
    },
    {
        id: 'external',
        label: 'External Services',
        sublabel: 'Third-party integrations',
        items: [
            'HuggingFace Hub  ·  Pre-trained model weights on-demand',
            'ONDC Network  ·  Open commerce protocol & order routing',
            'SMTP / SMS Gateway  ·  OTP delivery (pluggable)',
        ],
        accent: '#64748b', textColor: '#334155', bg: '#f8fafc', border: '#e2e8f0',
    },
];

const ARROWS: Arrow[] = [
    { from: 'users',    to: 'frontend', label: 'HTTPS Browser',               color: '#6366f1' },
    { from: 'frontend', to: 'api',      label: 'REST / JSON  ·  Bearer JWT',  color: '#3b82f6' },
    { from: 'api',      to: 'ai',       label: 'Python function calls',        color: '#8b5cf6' },
    { from: 'api',      to: 'db',       label: 'SQLAlchemy ORM  ·  psycopg2', color: '#f59e0b' },
    { from: 'ai',       to: 'external', label: 'Model download (first use)',   color: '#10b981' },
];

/* ── PDF export via browser print dialog ── */
function exportPDF() {
    window.print();
}

/* ── Arrow connector component ── */
function Connector({ arrow }: { arrow: Arrow }) {
    return (
        <div className="flex flex-col items-center my-0 select-none print-arrow">
            <div className="w-px h-3" style={{ background: arrow.color, opacity: 0.4 }} />
            <div
                className="flex items-center gap-2 px-3 py-1 rounded-full border text-[10px] font-bold"
                style={{ background: `${arrow.color}14`, borderColor: `${arrow.color}40`, color: arrow.color }}
            >
                <svg width="10" height="10" viewBox="0 0 10 10">
                    <path d="M5 0 L5 8 M2 5 L5 8 L8 5" stroke={arrow.color} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {arrow.label}
            </div>
            <div className="w-px h-3" style={{ background: arrow.color, opacity: 0.4 }} />
        </div>
    );
}

/* ── Architecture box ── */
function ArchBox({ box }: { box: Box }) {
    return (
        <div
            className="rounded-2xl p-5 shadow-sm"
            style={{ background: box.bg, border: `2px solid ${box.border}` }}
        >
            {/* Header */}
            <div className="flex items-center gap-3 mb-3">
                <div className="w-3 h-10 rounded-full" style={{ background: box.accent }} />
                <div>
                    <p className="text-sm font-black uppercase tracking-tight" style={{ color: box.textColor }}>{box.label}</p>
                    <p className="text-[11px] font-medium text-slate-500 mt-0.5">{box.sublabel}</p>
                </div>
            </div>

            {/* Items */}
            <div className="flex flex-col gap-1.5 ml-6">
                {box.items.map((item, i) => (
                    <div key={i} className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: box.accent }} />
                        <p className="text-[11px] text-slate-700 font-medium leading-relaxed">{item}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

/* ── Main component ── */
export default function ArchitectureHighLevel() {
    return (
        <div className="min-h-screen bg-slate-100 p-6 arch-page">

            {/* Toolbar — hidden when printing */}
            <div className="max-w-3xl mx-auto mb-6 flex items-center justify-between no-print">
                <div>
                    <h1 className="text-xl font-black text-[#002147] uppercase tracking-tight">System Architecture</h1>
                    <p className="text-xs text-slate-500 font-medium">TEAM Initiative · High-Level Overview</p>
                </div>
                <button
                    onClick={exportPDF}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#002147] text-white text-sm font-bold rounded-xl shadow hover:bg-blue-900 transition-all"
                >
                    <Download size={16} /> Download PDF
                </button>
            </div>

            {/* ── Printable area ── */}
            <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden print-area">

                {/* Cover header */}
                <div className="bg-[#002147] px-8 py-6 flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                        <Command size={26} className="text-white" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-white uppercase tracking-tight">TEAM Initiative</h2>
                        <p className="text-blue-300 text-xs font-bold mt-0.5">
                            ONDC MSE &amp; SNP Platform · High-Level System Architecture
                        </p>
                    </div>
                    <div className="ml-auto text-right hidden md:block">
                        <p className="text-blue-300 text-[10px] font-bold uppercase tracking-widest">Stack</p>
                        <p className="text-white text-[11px] font-bold">React · FastAPI · PostgreSQL · HuggingFace</p>
                    </div>
                </div>

                {/* Diagram body */}
                <div className="px-8 py-6 flex flex-col">

                    {BOXES.map((box, i) => (
                        <div key={box.id}>
                            <ArchBox box={box} />
                            {i < BOXES.length - 1 && <Connector arrow={ARROWS[i]} />}
                        </div>
                    ))}

                    {/* Data flow legend */}
                    <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">Data Flow Summary</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {[
                                { flow: 'User → Frontend',  desc: 'Login / OTP → JWT token stored in localStorage' },
                                { flow: 'Frontend → API',   desc: 'Axios with Authorization: Bearer <JWT> header' },
                                { flow: 'API → AI Models',  desc: 'Synchronous calls to lazily-loaded HuggingFace pipelines' },
                                { flow: 'API → Database',   desc: 'SQLAlchemy session per request; connection pool via psycopg2' },
                                { flow: 'AI → HuggingFace', desc: 'Model weights fetched once; cached in ~/.cache/huggingface/' },
                                { flow: 'API → Files',      desc: 'Uploaded docs saved to uploads/ with UUID filenames; served via /documents/view/<id>' },
                            ].map(({ flow, desc }) => (
                                <div key={flow} className="flex gap-2">
                                    <span className="text-[10px] font-black text-slate-700 whitespace-nowrap">{flow}</span>
                                    <span className="text-[10px] text-slate-500 font-medium">{desc}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Key design decisions */}
                    <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">Key Design Decisions</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {[
                                { title: 'JWT + Role Guard',  body: 'Every API route is guarded by RoleChecker. Roles: mse · snp · nsic · admin. Profile ID baked into token.' },
                                { title: 'Lazy ML Loading',   body: 'All 4 AI models use module-level None singleton. First API call triggers download; subsequent calls reuse.' },
                                { title: 'Async OCR',         body: 'Document upload returns immediately. OCR runs in BackgroundTasks. Frontend polls /documents/<id>/ocr-data.' },
                            ].map(({ title, body }) => (
                                <div key={title} className="bg-white rounded-xl border border-slate-200 p-3">
                                    <p className="text-[11px] font-black text-slate-800 mb-1">{title}</p>
                                    <p className="text-[10px] text-slate-500 leading-relaxed">{body}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-6 flex items-center justify-between text-[10px] text-slate-400 font-medium border-t border-slate-100 pt-4">
                        <span>TEAM Initiative · Ministry of MSME · ONDC Platform</span>
                        <span>Generated {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                    </div>
                </div>
            </div>

            {/* Print / PDF styles */}
            <style>{`
                @media print {
                    /* Make everything invisible but keep layout intact */
                    body * { visibility: hidden; }

                    /* Reveal only the diagram and all its children */
                    .print-area,
                    .print-area * { visibility: visible; }

                    /* Position the diagram at the top-left of the page */
                    .print-area {
                        position: absolute;
                        top: 0;
                        left: 0;
                        width: 100%;
                        box-shadow: none !important;
                        border-radius: 0 !important;
                    }

                    @page {
                        size: A4 portrait;
                        margin: 10mm;
                    }
                }
            `}</style>
        </div>
    );
}
