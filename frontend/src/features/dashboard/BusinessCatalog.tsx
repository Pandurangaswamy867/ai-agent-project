import { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Package, Search, Plus, Tag, LayoutGrid, List as ListIcon,
    Trash2, Mic, X, Sparkles, Edit2, Clock, ShoppingBag, IndianRupee,
    Box, Star, ArrowRight, Filter
} from 'lucide-react';
import config from '../../config';
import { useMSE } from '../../context/MSEContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useTranslation } from 'react-i18next';
import ProductVersionModal from './ProductVersionModal';
import type { Product, Category } from '../../types';

/* ---------- decorative SVG pattern for card backgrounds ---------- */
const CardPattern = ({ seed }: { seed: number }) => {
    const patterns = [
        // Circles
        <svg key="c" className="absolute inset-0 w-full h-full opacity-[0.07]" xmlns="http://www.w3.org/2000/svg"><defs><pattern id={`p${seed}`} x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse"><circle cx="16" cy="16" r="6" fill="currentColor"/></pattern></defs><rect width="100%" height="100%" fill={`url(#p${seed})`}/></svg>,
        // Diamonds
        <svg key="d" className="absolute inset-0 w-full h-full opacity-[0.06]" xmlns="http://www.w3.org/2000/svg"><defs><pattern id={`p${seed}`} x="0" y="0" width="28" height="28" patternUnits="userSpaceOnUse"><rect x="8" y="8" width="12" height="12" rx="2" transform="rotate(45 14 14)" fill="currentColor"/></pattern></defs><rect width="100%" height="100%" fill={`url(#p${seed})`}/></svg>,
        // Lines
        <svg key="l" className="absolute inset-0 w-full h-full opacity-[0.06]" xmlns="http://www.w3.org/2000/svg"><defs><pattern id={`p${seed}`} x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse"><line x1="0" y1="20" x2="20" y2="0" stroke="currentColor" strokeWidth="2"/></pattern></defs><rect width="100%" height="100%" fill={`url(#p${seed})`}/></svg>,
        // Dots grid
        <svg key="g" className="absolute inset-0 w-full h-full opacity-[0.08]" xmlns="http://www.w3.org/2000/svg"><defs><pattern id={`p${seed}`} x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.5" fill="currentColor"/></pattern></defs><rect width="100%" height="100%" fill={`url(#p${seed})`}/></svg>,
        // Waves
        <svg key="w" className="absolute inset-0 w-full h-full opacity-[0.05]" xmlns="http://www.w3.org/2000/svg"><defs><pattern id={`p${seed}`} x="0" y="0" width="40" height="20" patternUnits="userSpaceOnUse"><path d="M0 10 Q10 0 20 10 Q30 20 40 10" stroke="currentColor" fill="none" strokeWidth="2"/></pattern></defs><rect width="100%" height="100%" fill={`url(#p${seed})`}/></svg>,
        // Crosses
        <svg key="x" className="absolute inset-0 w-full h-full opacity-[0.06]" xmlns="http://www.w3.org/2000/svg"><defs><pattern id={`p${seed}`} x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse"><line x1="8" y1="12" x2="16" y2="12" stroke="currentColor" strokeWidth="2"/><line x1="12" y1="8" x2="12" y2="16" stroke="currentColor" strokeWidth="2"/></pattern></defs><rect width="100%" height="100%" fill={`url(#p${seed})`}/></svg>,
    ];
    return patterns[seed % patterns.length];
};

/* ---------- unit display labels ---------- */
const unitLabels: Record<string, string> = { pcs: 'per piece', kg: 'per kg', mtr: 'per metre' };

export default function BusinessCatalog() {
    const { selectedMseId, mses } = useMSE();
    const { role } = useAuth();
    const { showToast } = useToast();
    const { t } = useTranslation();

    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [activeCategory, setActiveCategory] = useState<number | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const [isVersionModalOpen, setIsVersionModalOpen] = useState(false);
    const [versionProductId, setVersionProductId] = useState<number | null>(null);
    const [versionProductName, setVersionProductName] = useState('');

    const [newProduct, setNewProduct] = useState({
        product_name: '', description: '', price: '', unit: 'pcs',
        category_id: null as number | null, attributes: '{}'
    });
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const activeMse = mses.find(m => m.mse_id === selectedMseId);

    /* ---------- palette ---------- */
    const palette = [
        { gradient: 'from-amber-500 to-orange-600', soft: 'bg-amber-50', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-800 ring-amber-200', iconBg: 'bg-amber-100' },
        { gradient: 'from-blue-500 to-indigo-600', soft: 'bg-blue-50', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-800 ring-blue-200', iconBg: 'bg-blue-100' },
        { gradient: 'from-emerald-500 to-teal-600', soft: 'bg-emerald-50', text: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-800 ring-emerald-200', iconBg: 'bg-emerald-100' },
        { gradient: 'from-violet-500 to-purple-600', soft: 'bg-violet-50', text: 'text-violet-700', badge: 'bg-violet-100 text-violet-800 ring-violet-200', iconBg: 'bg-violet-100' },
        { gradient: 'from-rose-500 to-pink-600', soft: 'bg-rose-50', text: 'text-rose-700', badge: 'bg-rose-100 text-rose-800 ring-rose-200', iconBg: 'bg-rose-100' },
        { gradient: 'from-cyan-500 to-sky-600', soft: 'bg-cyan-50', text: 'text-cyan-700', badge: 'bg-cyan-100 text-cyan-800 ring-cyan-200', iconBg: 'bg-cyan-100' },
    ];
    const getP = (i: number) => palette[i % palette.length];

    /* ---------- validation ---------- */
    const validateProduct = () => {
        const errs: Record<string, string> = {};
        if (!newProduct.product_name || newProduct.product_name.length > 100)
            errs.product_name = 'Please enter a product name (up to 100 characters)';
        if (!newProduct.description || newProduct.description.length > 1000)
            errs.description = 'Please add a short description';
        if (!newProduct.price || Number(newProduct.price) <= 0)
            errs.price = 'Please enter a valid price';
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const FormError = ({ message }: { message?: string }) => (
        message ? <p className="text-red-500 text-[11px] font-semibold mt-1.5 ml-0.5">{message}</p> : null
    );

    /* ---------- data fetching ---------- */
    const fetchCategories = async () => {
        try {
            const res = await axios.get(`${config.API_BASE_URL}/products/categories`);
            setCategories(res.data);
        } catch { showToast(t('error_occurred'), 'error'); }
    };
    const fetchProducts = async () => {
        if (!selectedMseId) return;
        setLoading(true);
        try {
            const res = await axios.get(`${config.API_BASE_URL}/products/${selectedMseId}/products`);
            setProducts(res.data);
        } catch { showToast(t('error_occurred'), 'error'); }
        finally { setLoading(false); }
    };
    useEffect(() => { fetchCategories(); fetchProducts(); }, [selectedMseId, role, activeMse]);

    const getCategoryName = (id: number) => categories.find(c => c.category_id === id)?.category_name || 'General';

    /* ---------- filtered products ---------- */
    const filteredProducts = products.filter((p: Product) => {
        const matchSearch = p.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchCat = activeCategory === null || p.category_id === activeCategory;
        return matchSearch && matchCat;
    });

    /* unique categories present in products */
    const productCategories = [...new Map(
        products.filter(p => p.category_id).map(p => [p.category_id, getCategoryName(p.category_id!)])
    ).entries()].map(([id, name]) => ({ id: id as number, name }));

    /* ---------- handlers ---------- */
    const handleDelete = async (productId: number) => {
        if (!window.confirm('Are you sure you want to remove this product?')) return;
        try {
            await axios.delete(`${config.API_BASE_URL}/products/${productId}`);
            showToast('Product removed successfully', 'success');
            fetchProducts();
        } catch { showToast(t('error_occurred'), 'error'); }
    };
    const handleEdit = async (product: Product) => {
        const newPrice = prompt(`Update price for "${product.product_name}" (currently ₹${product.price}):`, product.price.toString());
        if (!newPrice || isNaN(Number(newPrice))) return;
        try {
            await axios.put(`${config.API_BASE_URL}/products/${product.product_id}`, { ...product, price: Number(newPrice) });
            showToast('Price updated!', 'success');
            fetchProducts();
        } catch { showToast(t('error_occurred'), 'error'); }
    };
    const handleVoiceInput = () => {
        const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SR) { showToast('Voice input is not supported in this browser', 'warning'); return; }
        const r = new SR(); r.lang = 'en-IN'; r.interimResults = false;
        r.onstart = () => setIsListening(true);
        r.onend = () => setIsListening(false);
        r.onresult = (e: any) => setNewProduct(p => ({ ...p, description: p.description + ' ' + e.results[0][0].transcript }));
        r.start();
    };
    const handleCategorize = async () => {
        setIsAnalyzing(true);
        try {
            const res = await axios.post(`${config.API_BASE_URL}/products/categorize`, { product_name: newProduct.product_name, description: newProduct.description });
            setSuggestions(res.data.suggestions);
            if (res.data.suggestions[0]) {
                const s = res.data.suggestions[0];
                setNewProduct(p => ({ ...p, category_id: s.category_id, attributes: JSON.stringify(s.attributes || {}) }));
                showToast('Category suggested!', 'success');
            }
        } catch { showToast('Could not suggest a category. You can pick one manually.', 'warning'); }
        finally { setIsAnalyzing(false); }
    };
    const handleSave = async () => {
        if (!selectedMseId) return;
        if (!validateProduct()) return;
        setIsSaving(true);
        try {
            await axios.post(`${config.API_BASE_URL}/products/${selectedMseId}/products`, { ...newProduct, price: Number(newProduct.price) });
            showToast('Product added to your catalogue!', 'success');
            setIsModalOpen(false);
            setNewProduct({ product_name: '', description: '', price: '', unit: 'pcs', category_id: null, attributes: '{}' });
            setSuggestions([]);
            fetchProducts();
        } catch (err: any) {
            showToast(err.response?.status === 409 ? (err.response.data?.detail || 'This product already exists') : t('error_occurred'), err.response?.status === 409 ? 'warning' : 'error');
        } finally { setIsSaving(false); }
    };

    /* ================================================================ */
    /*  RENDER                                                          */
    /* ================================================================ */

    if (!selectedMseId) {
        return (
            <div className="flex flex-col items-center justify-center py-32 text-center">
                <div className="relative mb-8">
                    <div className="w-28 h-28 bg-gradient-to-br from-slate-100 to-slate-50 rounded-[2rem] flex items-center justify-center shadow-inner rotate-6">
                        <ShoppingBag className="text-slate-300" size={48} />
                    </div>
                    <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg -rotate-12">
                        <Star className="text-white" size={18} />
                    </div>
                </div>
                <h2 className="text-xl font-black text-slate-800">No Business Selected</h2>
                <p className="text-slate-400 text-sm mt-2 max-w-xs leading-relaxed">Select your business from the top bar to view and manage your product catalogue.</p>
            </div>
        );
    }

    return (
        <div className="w-full pb-12 space-y-6">

            {/* ── HERO HEADER ── */}
            <div className="relative rounded-3xl overflow-hidden">
                {/* bg layers */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#001a38] via-[#002147] to-[#0d3b6e]" />
                <div className="absolute inset-0 opacity-[0.04]">
                    <svg width="100%" height="100%"><defs><pattern id="heroGrid" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse"><circle cx="20" cy="20" r="1" fill="white"/></pattern></defs><rect width="100%" height="100%" fill="url(#heroGrid)"/></svg>
                </div>
                <div className="absolute -top-24 -right-24 w-72 h-72 bg-orange-500/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-20 -left-20 w-56 h-56 bg-blue-400/10 rounded-full blur-3xl" />

                <div className="relative z-10 px-6 md:px-8 py-7 md:py-9">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <p className="text-[10px] uppercase tracking-[0.2em] text-orange-300 font-bold mb-1">Product Catalogue</p>
                            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight leading-tight">
                                {activeMse?.name || 'My Products'}
                            </h1>
                            <p className="text-white/40 text-sm mt-1 font-medium">
                                {products.length > 0
                                    ? `${products.length} ${products.length === 1 ? 'product' : 'products'} listed`
                                    : 'Start adding products to your catalogue'}
                            </p>
                        </div>
                        {role === 'mse' && (
                            <button onClick={() => setIsModalOpen(true)}
                                className="group flex items-center gap-2.5 px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-sm font-bold rounded-2xl hover:from-orange-600 hover:to-amber-600 transition-all shadow-xl shadow-orange-500/25 hover:shadow-2xl hover:shadow-orange-500/30 hover:-translate-y-0.5 active:translate-y-0">
                                <Plus size={18} strokeWidth={3} />
                                <span>Add Product</span>
                                <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                            </button>
                        )}
                    </div>

                    {/* stat cards */}
                    {products.length > 0 && (
                        <div className="grid grid-cols-3 gap-3 mt-7">
                            {[
                                { icon: <Box size={20} />, label: 'Total Products', value: products.length, color: 'text-amber-300' },
                                { icon: <Tag size={20} />, label: 'Categories', value: productCategories.length || '—', color: 'text-emerald-300' },
                                { icon: <IndianRupee size={20} />, label: 'Avg. Price', value: `₹${Math.round(products.reduce((s, p) => s + (p.price || 0), 0) / products.length).toLocaleString()}`, color: 'text-sky-300' },
                            ].map((s, i) => (
                                <div key={i} className="bg-white/[0.07] backdrop-blur-sm border border-white/[0.08] rounded-2xl px-4 py-3.5 flex items-center gap-3 hover:bg-white/10 transition-colors">
                                    <div className={`${s.color}`}>{s.icon}</div>
                                    <div>
                                        <p className="text-[9px] uppercase tracking-widest text-white/40 font-bold">{s.label}</p>
                                        <p className="text-xl font-black text-white mt-0.5 leading-none">{s.value}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* ── TOOLBAR: Search + Category pills + View toggle ── */}
            <div className="space-y-3">
                <div className="flex items-center gap-3">
                    <div className="flex-1 relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" size={17} />
                        <input type="text" placeholder="Search products..." value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-2xl py-3 pl-11 pr-4 text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all shadow-sm placeholder:text-slate-300" />
                        {searchTerm && (
                            <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-300 hover:text-slate-500 rounded-full hover:bg-slate-100 transition-colors">
                                <X size={14} />
                            </button>
                        )}
                    </div>
                    <div className="flex bg-white border border-slate-200 rounded-2xl p-1.5 gap-1 shadow-sm">
                        {(['grid', 'list'] as const).map(mode => (
                            <button key={mode} onClick={() => setViewMode(mode)}
                                className={`p-2.5 rounded-xl transition-all duration-200 ${viewMode === mode
                                    ? 'bg-gradient-to-br from-[#002147] to-[#0a3060] text-white shadow-lg shadow-blue-900/20'
                                    : 'text-slate-300 hover:text-slate-600 hover:bg-slate-50'}`}>
                                {mode === 'grid' ? <LayoutGrid size={16} /> : <ListIcon size={16} />}
                            </button>
                        ))}
                    </div>
                </div>

                {/* category pills */}
                {productCategories.length > 0 && (
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                        <Filter size={14} className="text-slate-300 shrink-0" />
                        <button onClick={() => setActiveCategory(null)}
                            className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-bold transition-all ${activeCategory === null
                                ? 'bg-[#002147] text-white shadow-md shadow-blue-900/15'
                                : 'bg-white text-slate-500 border border-slate-200 hover:border-slate-300 hover:text-slate-700'}`}>
                            All
                        </button>
                        {productCategories.map(cat => (
                            <button key={cat.id} onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
                                className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-bold transition-all ${activeCategory === cat.id
                                    ? 'bg-[#002147] text-white shadow-md shadow-blue-900/15'
                                    : 'bg-white text-slate-500 border border-slate-200 hover:border-slate-300 hover:text-slate-700'}`}>
                                {cat.name}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* ── PRODUCT LIST ── */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-28 gap-5">
                    <div className="relative">
                        <div className="w-14 h-14 border-[3px] border-slate-100 border-t-[#002147] rounded-full animate-spin" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Package size={18} className="text-[#002147]" />
                        </div>
                    </div>
                    <p className="text-sm text-slate-400 font-medium">Loading your products...</p>
                </div>
            ) : filteredProducts.length === 0 ? (
                <div className="relative bg-white border border-slate-200 rounded-3xl py-20 px-8 text-center shadow-sm overflow-hidden">
                    <div className="absolute inset-0 opacity-[0.03]">
                        <svg width="100%" height="100%"><defs><pattern id="emptyDots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse"><circle cx="12" cy="12" r="1.5" fill="currentColor"/></pattern></defs><rect width="100%" height="100%" fill="url(#emptyDots)"/></svg>
                    </div>
                    <div className="relative z-10">
                        <div className="relative inline-block mb-6">
                            <div className="w-24 h-24 bg-gradient-to-br from-orange-100 via-amber-50 to-yellow-50 rounded-[1.8rem] flex items-center justify-center shadow-inner rotate-3">
                                <ShoppingBag size={40} className="text-orange-300 -rotate-3" />
                            </div>
                            <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg rotate-12">
                                <Plus className="text-white" size={16} strokeWidth={3} />
                            </div>
                        </div>
                        {searchTerm || activeCategory !== null ? (
                            <>
                                <h3 className="text-lg font-black text-slate-800">No matching products</h3>
                                <p className="text-sm text-slate-400 mt-2 max-w-sm mx-auto leading-relaxed">
                                    Try adjusting your search or filter to find what you're looking for.
                                </p>
                                <button onClick={() => { setSearchTerm(''); setActiveCategory(null); }}
                                    className="mt-5 px-6 py-2.5 text-sm font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-all">
                                    Clear Filters
                                </button>
                            </>
                        ) : (
                            <>
                                <h3 className="text-lg font-black text-slate-800">Your catalogue is empty</h3>
                                <p className="text-sm text-slate-400 mt-2 max-w-md mx-auto leading-relaxed">
                                    Add your products here so buyers and delivery partners can discover and connect with your business.
                                </p>
                                {role === 'mse' && (
                                    <button onClick={() => setIsModalOpen(true)}
                                        className="group mt-6 inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-sm font-bold rounded-2xl hover:from-orange-600 hover:to-amber-600 transition-all shadow-xl shadow-orange-500/20 hover:-translate-y-0.5">
                                        <Plus size={16} strokeWidth={3} /> Add Your First Product
                                        <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                </div>
            ) : viewMode === 'grid' ? (
                /* ── GRID VIEW ── */
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredProducts.map((product: Product, index: number) => {
                        const c = getP(index);
                        return (
                            <div key={product.product_id}
                                className="group bg-white border border-slate-200/80 rounded-2xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 hover:border-slate-300">
                                {/* card image area */}
                                <div className={`relative h-40 bg-gradient-to-br ${c.gradient} text-white overflow-hidden`}>
                                    <CardPattern seed={product.product_id} />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                                    <div className="relative z-10 flex items-center justify-center h-full">
                                        <Package size={48} className="text-white/30 group-hover:scale-110 group-hover:text-white/40 transition-all duration-500" />
                                    </div>
                                    {/* price tag */}
                                    <div className="absolute bottom-3 left-3 z-10">
                                        <div className="bg-white text-slate-900 text-base font-black px-3.5 py-1.5 rounded-xl shadow-lg flex items-center gap-1">
                                            <span className="text-[10px] text-slate-400 font-bold">₹</span>
                                            {product.price?.toLocaleString()}
                                        </div>
                                    </div>
                                    {/* category badge */}
                                    {product.category_id && (
                                        <div className="absolute top-3 right-3 z-10">
                                            <span className="text-[10px] font-bold bg-white/90 backdrop-blur text-slate-700 px-2.5 py-1 rounded-lg shadow-sm">
                                                {getCategoryName(product.category_id)}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* card body */}
                                <div className="p-5">
                                    <h4 className="font-bold text-slate-900 text-[15px] leading-snug group-hover:text-[#002147] transition-colors">{product.product_name}</h4>
                                    <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">{product.description}</p>
                                    <div className="flex items-center gap-2 mt-3">
                                        <span className="text-[10px] font-bold text-slate-400 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-lg uppercase tracking-wide">
                                            {unitLabels[product.unit] || product.unit}
                                        </span>
                                    </div>

                                    {role === 'mse' && (
                                        <div className="flex items-center gap-2 mt-5 pt-4 border-t border-slate-100">
                                            <button onClick={() => handleEdit(product)}
                                                className="flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold text-[#002147] bg-blue-50 rounded-xl hover:bg-blue-100 transition-all">
                                                <Edit2 size={13} /> Update Price
                                            </button>
                                            <button onClick={() => { setVersionProductId(product.product_id); setVersionProductName(product.product_name); setIsVersionModalOpen(true); }}
                                                className="p-2.5 text-slate-300 hover:text-[#002147] hover:bg-blue-50 rounded-xl transition-all" title="View history">
                                                <Clock size={15} />
                                            </button>
                                            <button onClick={() => handleDelete(product.product_id)}
                                                className="p-2.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all" title="Remove">
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                /* ── LIST VIEW ── */
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                    <div className="divide-y divide-slate-100">
                        {filteredProducts.map((product: Product, index: number) => {
                            const c = getP(index);
                            return (
                                <div key={product.product_id} className="group px-5 py-4 flex items-center gap-4 hover:bg-slate-50/70 transition-all">
                                    {/* colored icon */}
                                    <div className={`w-14 h-14 bg-gradient-to-br ${c.gradient} rounded-2xl flex items-center justify-center shrink-0 shadow-md shadow-black/5 group-hover:scale-105 transition-transform`}>
                                        <Package size={22} className="text-white/80" />
                                    </div>
                                    {/* info */}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-slate-900 truncate group-hover:text-[#002147] transition-colors">{product.product_name}</p>
                                        <p className="text-xs text-slate-400 truncate mt-0.5">{product.description}</p>
                                        <div className="flex items-center gap-2 mt-1.5">
                                            <span className="text-[10px] font-bold text-slate-400 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-md">{unitLabels[product.unit] || product.unit}</span>
                                            {product.category_id && (
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ring-1 ${c.badge}`}>
                                                    {getCategoryName(product.category_id)}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    {/* price */}
                                    <div className="text-right shrink-0">
                                        <p className="text-lg font-black text-slate-900">₹{product.price?.toLocaleString()}</p>
                                    </div>
                                    {/* actions */}
                                    {role === 'mse' && (
                                        <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => handleEdit(product)} className="p-2.5 text-slate-400 hover:text-[#002147] hover:bg-blue-50 rounded-xl transition-all" title="Update price"><Edit2 size={15} /></button>
                                            <button onClick={() => { setVersionProductId(product.product_id); setVersionProductName(product.product_name); setIsVersionModalOpen(true); }} className="p-2.5 text-slate-400 hover:text-[#002147] hover:bg-slate-100 rounded-xl transition-all" title="View history"><Clock size={15} /></button>
                                            <button onClick={() => handleDelete(product.product_id)} className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all" title="Remove"><Trash2 size={15} /></button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ── RESULTS COUNT ── */}
            {!loading && products.length > 0 && (
                <p className="text-center text-xs text-slate-300 font-medium pt-2">
                    Showing {filteredProducts.length} of {products.length} {products.length === 1 ? 'product' : 'products'}
                </p>
            )}

            {/* ══════════════════════ ADD PRODUCT MODAL ══════════════════════ */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md" onClick={e => { if (e.target === e.currentTarget) setIsModalOpen(false); }}>
                    <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
                        {/* header */}
                        <div className="relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-[#001a38] via-[#002147] to-[#0d3b6e]" />
                            <div className="absolute -top-10 -right-10 w-32 h-32 bg-orange-500/10 rounded-full blur-2xl" />
                            <div className="relative z-10 px-6 py-6 flex items-start justify-between">
                                <div>
                                    <p className="text-[9px] uppercase tracking-[0.2em] text-orange-300 font-bold">New Product</p>
                                    <h3 className="text-lg font-black text-white mt-1">Add to Your Catalogue</h3>
                                    <p className="text-white/40 text-xs mt-1">Fill in the details below to list your product</p>
                                </div>
                                <button onClick={() => setIsModalOpen(false)} className="text-white/40 hover:text-white p-2 hover:bg-white/10 rounded-xl transition-all mt-1">
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        {/* body */}
                        <div className="p-6 overflow-y-auto space-y-5">
                            {/* step indicator */}
                            <div className="flex items-center gap-3 pb-1">
                                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                                    <div className="w-5 h-5 bg-emerald-100 rounded-full flex items-center justify-center text-[9px]">1</div>
                                    Details
                                </div>
                                <div className="flex-1 h-[1px] bg-slate-100" />
                                <div className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider ${newProduct.description ? 'text-emerald-600' : 'text-slate-300'}`}>
                                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] ${newProduct.description ? 'bg-emerald-100' : 'bg-slate-100'}`}>2</div>
                                    Category
                                </div>
                                <div className="flex-1 h-[1px] bg-slate-100" />
                                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-300">
                                    <div className="w-5 h-5 bg-slate-100 rounded-full flex items-center justify-center text-[9px]">3</div>
                                    Save
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-[11px] font-bold text-slate-500 mb-2 uppercase tracking-wider">Product Name</label>
                                    <input type="text" value={newProduct.product_name}
                                        onChange={e => { setNewProduct(p => ({ ...p, product_name: e.target.value })); setErrors(prev => ({ ...prev, product_name: '' })); }}
                                        className={`w-full bg-slate-50/50 border-2 ${errors.product_name ? 'border-red-300 bg-red-50/20' : 'border-slate-100'} rounded-2xl px-4 py-3.5 text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all placeholder:text-slate-300`}
                                        placeholder="e.g. Hand-woven Silk Saree" />
                                    <FormError message={errors.product_name} />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-500 mb-2 uppercase tracking-wider">Price (₹)</label>
                                    <input type="number" value={newProduct.price}
                                        onChange={e => { setNewProduct(p => ({ ...p, price: e.target.value })); setErrors(prev => ({ ...prev, price: '' })); }}
                                        className={`w-full bg-slate-50/50 border-2 ${errors.price ? 'border-red-300 bg-red-50/20' : 'border-slate-100'} rounded-2xl px-4 py-3.5 text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all placeholder:text-slate-300`}
                                        placeholder="5,499" />
                                    <FormError message={errors.price} />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-500 mb-2 uppercase tracking-wider">Sold By</label>
                                    <select value={newProduct.unit}
                                        onChange={e => setNewProduct(p => ({ ...p, unit: e.target.value }))}
                                        className="w-full bg-slate-50/50 border-2 border-slate-100 rounded-2xl px-4 py-3.5 text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all">
                                        <option value="pcs">Per Piece</option>
                                        <option value="kg">Per Kilogram</option>
                                        <option value="mtr">Per Metre</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Description</label>
                                    <button onClick={handleVoiceInput}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${isListening
                                            ? 'bg-red-100 text-red-600 animate-pulse shadow-sm'
                                            : 'text-slate-400 hover:bg-slate-100 border border-slate-200 hover:text-slate-600'}`}>
                                        <Mic size={13} /> {isListening ? 'Listening...' : 'Use Voice'}
                                    </button>
                                </div>
                                <textarea value={newProduct.description}
                                    onChange={e => { setNewProduct(p => ({ ...p, description: e.target.value })); setErrors(prev => ({ ...prev, description: '' })); }}
                                    rows={3}
                                    className={`w-full bg-slate-50/50 border-2 ${errors.description ? 'border-red-300 bg-red-50/20' : 'border-slate-100'} rounded-2xl px-4 py-3.5 text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all resize-none placeholder:text-slate-300`}
                                    placeholder="Describe your product — material, features, size..." />
                                <FormError message={errors.description} />
                            </div>

                            {/* AI suggest */}
                            <button onClick={handleCategorize}
                                disabled={!newProduct.description || isAnalyzing}
                                className="group w-full py-3.5 bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 hover:from-black hover:to-slate-900 text-white rounded-2xl flex items-center justify-center gap-2.5 text-sm font-bold transition-all disabled:opacity-30 shadow-lg shadow-slate-900/10 border border-white/5">
                                {isAnalyzing
                                    ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                    : <Sparkles size={16} className="text-amber-400 group-hover:scale-110 transition-transform" />}
                                {isAnalyzing ? 'Finding best category...' : 'Suggest Category with AI'}
                            </button>

                            {/* category suggestions */}
                            {suggestions.length > 0 && (
                                <div className="space-y-2.5">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Suggested Categories — tap to select</p>
                                    {suggestions.map((s: any, i: number) => (
                                        <div key={i} onClick={() => setNewProduct(p => ({ ...p, category_id: s.category_id, attributes: JSON.stringify(s.attributes || {}) }))}
                                            className={`p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 ${newProduct.category_id === s.category_id
                                                ? 'border-[#002147] bg-blue-50/30 shadow-md shadow-blue-100/50 ring-2 ring-blue-100'
                                                : 'border-slate-100 bg-slate-50/30 hover:border-slate-300 hover:shadow-sm'}`}>
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-sm font-bold text-slate-900">{s.category_name}</span>
                                                <span className="text-[10px] bg-emerald-100 text-emerald-700 font-black px-2.5 py-1 rounded-lg">{(s.confidence * 100).toFixed(0)}% match</span>
                                            </div>
                                            {s.attributes && (
                                                <div className="flex flex-wrap gap-1.5">
                                                    {Object.entries(s.attributes).map(([k, v]) => (
                                                        <span key={k} className="text-[10px] bg-white border border-slate-200 px-2 py-0.5 rounded-lg text-slate-500 font-semibold">
                                                            {k}: {v as string}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* footer */}
                        <div className="px-6 py-5 border-t border-slate-100 bg-slate-50/30 flex gap-3">
                            <button onClick={() => setIsModalOpen(false)}
                                className="flex-1 py-3.5 text-sm font-bold text-slate-500 bg-white border-2 border-slate-200 rounded-2xl hover:bg-slate-50 hover:text-slate-700 transition-all">
                                Cancel
                            </button>
                            <button onClick={handleSave}
                                disabled={!newProduct.product_name || isSaving}
                                className="flex-1 py-3.5 text-sm font-bold text-white bg-gradient-to-r from-[#002147] to-[#0a3060] rounded-2xl hover:from-[#001a38] hover:to-[#002147] transition-all disabled:opacity-30 shadow-lg shadow-blue-900/15 flex items-center justify-center gap-2">
                                {isSaving
                                    ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    : <Plus size={16} strokeWidth={3} />}
                                {isSaving ? 'Adding...' : 'Add Product'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Version Modal */}
            {isVersionModalOpen && versionProductId && (
                <ProductVersionModal productId={versionProductId} productName={versionProductName} onClose={() => setIsVersionModalOpen(false)} onRollbackSuccess={fetchProducts} />
            )}
        </div>
    );
}
