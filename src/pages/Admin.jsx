import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { db, storage } from '../utils/firebase';
import { 
    collection, addDoc, getDocs, deleteDoc, doc, updateDoc, 
    query, orderBy, serverTimestamp 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import GalleryMultiUploader from '../components/GalleryMultiUploader';
import './Admin.css';
import '../components/sections/Gallery.css';

// Constants
const MODEL_CATEGORIES = ['WOMAN', 'MAN'];
const STORES = {
    HERO_SLIDES: 'hero_slides',
    MODELS: 'models',
    LOOKBOOK: 'lookbook',
    PARTNERS: 'partners',
};

// Utilities
const resizeImage = (file, maxSide = 1950) => {
    return new Promise((resolve) => {
        if (!file.type.startsWith('image/')) { resolve(file); return; }
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (e) => {
            const img = new Image();
            img.src = e.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                if (width > height) {
                    if (width > maxSide) { height *= maxSide / width; width = maxSide; }
                } else {
                    if (height > maxSide) { width *= maxSide / height; height = maxSide; }
                }
                canvas.width = width;
                canvas.height = height;
                canvas.getContext('2d').drawImage(img, 0, 0, width, height);
                canvas.toBlob((blob) => {
                    resolve(new File([blob], file.name, { type: 'image/jpeg' }));
                }, 'image/jpeg', 0.9);
            };
        };
    });
};

const uploadToStorage = async (file, folder) => {
    const resizedFile = await resizeImage(file);
    const fileName = `${Date.now()}_${file.name}`;
    const storageRef = ref(storage, `${folder}/${fileName}`);
    await uploadBytes(storageRef, resizedFile);
    const url = await getDownloadURL(storageRef);
    return { url, path: `${folder}/${fileName}` };
};

const Admin = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(localStorage.getItem('admin_logged_in') === 'true');
    const [password, setPassword] = useState('');
    const [searchParams] = useSearchParams();
    const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'gallery');

    const handleLogin = (e) => {
        e.preventDefault();
        const trimmedPassword = password.trim();
        if (trimmedPassword === 'admin123') {
            setIsLoggedIn(true);
            localStorage.setItem('admin_logged_in', 'true');
        } else {
            alert('Incorrect password');
        }
    };

    if (!isLoggedIn) {
        return (
            <div className="admin-login-overlay">
                <form className="admin-login-card" onSubmit={handleLogin}>
                    <div className="login-logo-css">
                        <span>Fitgirls</span>
                        <small>.me</small>
                    </div>
                    <h2>Admin Portal</h2>
                    <input 
                        type="password" 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        placeholder="Admin Password"
                        required
                    />
                    <button type="submit">Login</button>
                    <button type="button" className="guest-back" onClick={() => window.location.href = '/'}>Back to Site</button>
                </form>
            </div>
        );
    }

    const tabs = [
        { id: 'gallery', label: 'Gallery' },
        { id: 'models', label: 'Ambassadors' },
        { id: 'concepts', label: 'Concepts' },
        { id: 'events', label: 'Events' },
        { id: 'hero', label: 'Hero' },
        { id: 'apply', label: 'Applications' },
        { id: 'partners', label: 'Partners' },
    ];

    return (
        <div className="admin-page dashboard-active">
            <div className="admin-container">
                <header className="admin-header">
                    <div className="admin-header-left">
                        <h2>Dashboard</h2>
                        <nav className="admin-tabs">
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    className={`admin-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                                    onClick={() => setActiveTab(tab.id)}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </nav>
                    </div>
                    <button className="logout-btn" onClick={() => { setIsLoggedIn(false); localStorage.removeItem('admin_logged_in'); }}>Logout</button>
                </header>
                <div className="admin-content">
                    {activeTab === 'gallery' && <GalleryTab />}
                    {activeTab === 'models' && <ModelsTab />}
                    {activeTab === 'concepts' && <ConceptsTab />}
                    {activeTab === 'events' && <EventsTab />}
                    {activeTab === 'hero' && <HeroTab />}
                    {activeTab === 'apply' && <ApplicationsTab />}
                    {activeTab === 'partners' && <PartnersTab />}
                </div>
            </div>
        </div>
    );
};

// ===== Toast Component =====
const Toast = ({ message, sub, onClose }) => (
    <div className="admin-success-toast">
        <span style={{ fontSize: '1.5rem' }}>✅</span>
        <div>
            <p style={{ margin: 0, fontWeight: 'bold', color: '#fff' }}>{message}</p>
            {sub && <p style={{ margin: '2px 0 0', color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem' }}>{sub}</p>}
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '1.2rem', marginLeft: 'auto' }}>×</button>
    </div>
);

// ===== 1. Gallery Tab =====
const GalleryTab = () => {
    return (
        <div className="upload-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                <h3 style={{ margin: 0 }}>Gallery Management</h3>
            </div>
            <GalleryMultiUploader />
        </div>
    );
};

// ===== 2. Models (Ambassadors) Tab =====
const ModelsTab = () => {
    const [models, setModels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editId, setEditId] = useState(null);
    const [form, setForm] = useState({
        nameEn: '', nameKr: '', job: '', category: 'WOMAN', nationality: '', bio: '',
        instagram: '', tiktok: '', email: '', phone: '',
        height: '', hair: '', eyes: '', bust: '', waist: '', hips: '', shoes: '',
        batch: '1st', youtube: ''
    });
    const [mainImage, setMainImage] = useState(null);
    const [portfolioFiles, setPortfolioFiles] = useState([]);
    const [portfolioPreviews, setPortfolioPreviews] = useState([]); // To store individual preview URLs

    // Cleanup object URLs to avoid memory leaks
    useEffect(() => {
        return () => {
            portfolioPreviews.forEach(URL.revokeObjectURL);
        };
    }, []);

    const handlePortfolioChange = (e) => {
        const newFiles = Array.from(e.target.files);
        setPortfolioFiles(prev => [...prev, ...newFiles]);
        
        // Create new preview URLs
        const newPreviews = newFiles.map(file => URL.createObjectURL(file));
        setPortfolioPreviews(prev => [...prev, ...newPreviews]);
    };

    const removeNewFile = (index) => {
        // Revoke URL before removing
        URL.revokeObjectURL(portfolioPreviews[index]);
        setPortfolioFiles(prev => prev.filter((_, i) => i !== index));
        setPortfolioPreviews(prev => prev.filter((_, i) => i !== index));
    };

    const removeExistingFile = (url) => {
        setForm(prev => ({
            ...prev,
            portfolio: prev.portfolio.filter(p => p !== url)
        }));
    };
    const [showSuccess, setShowSuccess] = useState(false);

    useEffect(() => { loadModels(); }, []);

    const loadModels = async () => {
        setLoading(true);
        try {
            const snap = await getDocs(query(collection(db, 'models'), orderBy('nameEn', 'asc')));
            setModels(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch (err) { console.error(err); }
        setLoading(false);
    };

    const resetForm = () => {
        setForm({
            nameEn: '', nameKr: '', job: '', category: 'WOMAN', nationality: '', bio: '',
            instagram: '', tiktok: '', email: '', phone: '',
            height: '', hair: '', eyes: '', bust: '', waist: '', hips: '', shoes: '',
            batch: '1st', youtube: ''
        });
        setEditId(null); setMainImage(null); setPortfolioFiles([]); 
        portfolioPreviews.forEach(URL.revokeObjectURL);
        setPortfolioPreviews([]);
        setShowForm(false);
    };

    const handleSave = async () => {
        if (!form.nameEn) { alert('English Name is required.'); return; }
        try {
            let data = { ...form, updatedAt: serverTimestamp() };
            if (mainImage) {
                const { url } = await uploadToStorage(mainImage, 'models/main');
                data.mainImage = url;
            }
            if (portfolioFiles.length > 0) {
                const urls = await Promise.all(portfolioFiles.map(f => uploadToStorage(f, 'models/portfolio').then(r => r.url)));
                data.portfolio = [...(form.portfolio || []), ...urls];
            }
            if (editId) {
                await updateDoc(doc(db, 'models', editId), data);
            } else {
                await addDoc(collection(db, 'models'), { ...data, createdAt: serverTimestamp() });
            }
            setShowSuccess(true); setTimeout(() => setShowSuccess(false), 3000);
            resetForm(); loadModels();
        } catch (err) { alert('Save error: ' + err.message); }
    };

    const handleModelDelete = async (id) => {
        if (!window.confirm('정말 삭제하시겠습니까? (Are you sure?)')) return;
        
        try {
            alert('삭제를 시작합니다. ID: ' + id);
            
            const docRef = doc(db, 'models', id);
            alert('문서 참조 생성 완료. 삭제 요청을 보냅니다...');
            
            await deleteDoc(docRef);
            alert('Firestore 문서 삭제 성공!');
            
            // Sync with IndexedDB
            try {
                alert('로컬 데이터 동기화 시작...');
                const { syncCollection } = await import('../utils/syncService');
                await syncCollection('models');
                alert('동기화 완료!');
            } catch (syncErr) {
                console.error('Sync error:', syncErr);
                alert('동기화 중 오류가 있었으나 삭제는 완료되었습니다.');
            }

            alert('리스트를 새로고침합니다...');
            loadModels();
        } catch (err) {
            console.error('Delete error:', err);
            alert('삭제 중 오류 발생: ' + err.message);
        }
    };

    const startEdit = (m) => {
        setForm({ ...m });
        setEditId(m.id);
        setShowForm(true);
    };

    return (
        <div className="upload-section">
            {showSuccess && <Toast message="Saved successfully!" onClose={() => setShowSuccess(false)} />}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                <h3 style={{ margin: 0 }}>Ambassadors</h3>
                <button className="add-btn" onClick={() => { resetForm(); setShowForm(true); }}>+ Add New Ambassador</button>
            </div>

            {showForm && (
                <div className="admin-modal-overlay" onClick={() => resetForm()}>
                    <div className="admin-modal" onClick={e => e.stopPropagation()}>
                        <button className="close-x" onClick={resetForm}>×</button>
                        <h3 className="modal-title">{editId ? 'Edit Ambassador Profile' : 'Register New Ambassador'}</h3>
                        <div className="admin-modal-form">
                            <div className="form-grid">
                                <div className="admin-form">
                                    <div className="admin-section-header">
                                        <h4>Basic Information</h4>
                                        <p>Personal details and category</p>
                                    </div>
                                    <div className="form-group"><label>영어 이름 (English Name) *</label><input type="text" value={form.nameEn} onChange={e => setForm({...form, nameEn: e.target.value})} placeholder="e.g. Jane Doe" /></div>
                                    <div className="form-group"><label>한글 이름 (Korean Name)</label><input type="text" value={form.nameKr} onChange={e => setForm({...form, nameKr: e.target.value})} placeholder="예: 김지수" /></div>
                                    <div className="form-group"><label>직업 (Job / Occupation)</label><input type="text" value={form.job || ''} onChange={e => setForm({...form, job: e.target.value})} placeholder="예: 피트니스 모델, 트레이너" /></div>
                                    <div className="admin-grid-two">
                                        <div className="form-group"><label>Nationality</label><input type="text" value={form.nationality} onChange={e => setForm({...form, nationality: e.target.value})} /></div>
                                        <div className="form-group">
                                            <label>Batch (기수) *</label>
                                            <input 
                                                type="text" 
                                                list="ambassador-batches"
                                                value={form.batch || '1st'} 
                                                onChange={e => setForm({...form, batch: e.target.value})} 
                                                placeholder="e.g. 1st (Select or type)" 
                                            />
                                            <datalist id="ambassador-batches">
                                                {Array.from(new Set(models.map(m => m.batch || '1st'))).sort().map(b => (
                                                    <option key={b} value={b} />
                                                ))}
                                            </datalist>
                                        </div>
                                    </div>
                                    <div className="form-group"><label>Category</label>
                                        <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="admin-select">
                                            {MODEL_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>

                                    <div className="admin-section-header" style={{ marginTop: 32 }}>
                                        <h4>Contact & Social</h4>
                                        <p>How to reach and follow</p>
                                    </div>
                                    <div className="admin-grid-two">
                                        <div className="form-group"><label>Phone</label><input type="text" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} /></div>
                                        <div className="form-group"><label>Email</label><input type="text" value={form.email} onChange={e => setForm({...form, email: e.target.value})} /></div>
                                    </div>
                                    <div className="admin-grid-two">
                                        <div className="form-group"><label>Instagram</label><input type="text" value={form.instagram} onChange={e => setForm({...form, instagram: e.target.value})} placeholder="@username" /></div>
                                        <div className="form-group"><label>TikTok</label><input type="text" value={form.tiktok} onChange={e => setForm({...form, tiktok: e.target.value})} placeholder="@username" /></div>
                                    </div>
                                    <div className="form-group"><label>YouTube ID</label><input type="text" value={form.youtube || ''} onChange={e => setForm({...form, youtube: e.target.value})} placeholder="e.g. dQw4w9WgXcQ (Video ID only)" /></div>
                                    <div className="form-group"><label>Short Biography</label><textarea value={form.bio} onChange={e => setForm({...form, bio: e.target.value})} rows={3} placeholder="Introduce the ambassador..." /></div>
                                </div>
                                <div className="admin-form-side">
                                    <div className="admin-section-header">
                                        <h4>Measurements</h4>
                                        <p>Physical attributes</p>
                                    </div>
                                    <div className="measure-grid premium-measure">
                                        {['height', 'hair', 'eyes', 'bust', 'waist', 'hips', 'shoes'].map(f => (
                                            <div key={f} className="form-item">
                                                <label>{f.toUpperCase()}</label>
                                                <input type="text" value={form[f] || ''} onChange={e => setForm({...form, [f]: e.target.value})} />
                                            </div>
                                        ))}
                                    </div>

                                    <div className="admin-section-header" style={{ marginTop: 40 }}>
                                        <h4>Media Assets</h4>
                                        <p>Primary and portfolio images</p>
                                    </div>
                                    <div className="form-group">
                                        <label>Main Portrait {editId ? '(Optional)' : '*'}</label>
                                        <div className="custom-file-upload">
                                            <input type="file" id="main-image" accept="image/*" onChange={e => setMainImage(e.target.files[0])} style={{ display: 'none' }} />
                                            <label htmlFor="main-image" className="file-label">
                                                {mainImage ? mainImage.name : 'Select Main Image'}
                                            </label>
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>Portfolio Gallery</label>
                                        <div className="custom-file-upload">
                                            <input
                                                type="file"
                                                id="portfolio-upload"
                                                multiple
                                                accept="image/*"
                                                onChange={handlePortfolioChange}
                                                hidden
                                            />
                                            <label htmlFor="portfolio-upload" className="file-label">
                                                + Add Portfolio Photos
                                            </label>

                                            {(form.portfolio?.length > 0 || portfolioFiles.length > 0) && (
                                                <div className="portfolio-preview-scroll">
                                                    <div className="portfolio-preview-grid">
                                                        {form.portfolio && form.portfolio.map((url, idx) => (
                                                            <div key={`existing-${idx}`} className="portfolio-preview-item">
                                                                <img src={url} alt="Portfolio" />
                                                                <button type="button" className="remove-preview-btn" onClick={() => removeExistingFile(url)}>×</button>
                                                            </div>
                                                        ))}
                                                        {portfolioPreviews.map((url, idx) => (
                                                            <div key={`new-${idx}`} className="portfolio-preview-item new-file">
                                                                <img src={url} alt="New Portfolio" />
                                                                <button type="button" className="remove-preview-btn" onClick={() => removeNewFile(idx)}>×</button>
                                                                <span className="new-badge">NEW</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <button className="submit-btn" onClick={handleSave} style={{ marginTop: 24 }}>{editId ? 'Update Ambassador' : 'Add Ambassador'}</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="admin-item-list">
                {models.map(m => (
                    <div key={m.id} className="admin-item-card">
                        {m.mainImage && <img src={m.mainImage} alt={m.nameEn} className="admin-item-thumb" />}
                        <div className="admin-item-info">
                            <strong>{m.nameEn}</strong> {m.nameKr && <span style={{ color: '#888', fontSize: '0.85rem', marginLeft: 6 }}>({m.nameKr})</span>}
                            {m.job && <div style={{ fontSize: '0.8rem', color: 'var(--color-primary)', marginTop: 2 }}>{m.job}</div>}
                            <span className="admin-item-badge">{m.category}</span>
                        </div>
                        <div className="admin-item-actions">
                            <button onClick={() => startEdit(m)}>Edit</button>
                            <button onClick={() => handleModelDelete(m.id)} className="delete">Delete</button>
                        </div>
                    </div>
                ))}
                {models.length === 0 && <p style={{ color: '#888', textAlign: 'center', padding: 40, gridColumn: '1/-1' }}>No ambassadors found.</p>}
            </div>
        </div>
    );
};

// ===== 3. Concepts Tab =====
const ConceptsTab = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [outfitName, setOutfitName] = useState('');
    const [outfitSize, setOutfitSize] = useState('');
    const [file, setFile] = useState(null);
    const [editItem, setEditItem] = useState(null);
    const [showSuccess, setShowSuccess] = useState(false);

    useEffect(() => { loadItems(); }, []);

    const loadItems = async () => {
        setLoading(true);
        try {
            const snap = await getDocs(query(collection(db, 'lookbook'), orderBy('createdAt', 'desc')));
            setItems(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch (err) { console.error(err); }
        setLoading(false);
    };

    const resetForm = () => {
        setOutfitName(''); setOutfitSize(''); setFile(null); setEditItem(null);
    };

    const handleSave = async (e) => {
        if (e) e.preventDefault();
        if (!outfitName) { alert('Please enter outfit name.'); return; }
        setSaving(true);
        try {
            if (editItem) {
                let data = { outfitName, outfitSize };
                if (file) {
                    const { url, path } = await uploadToStorage(file, 'lookbook');
                    data.img = url;
                    data.storagePath = path;
                    // Delete old image if it exists
                    if (editItem.storagePath) {
                        try { await deleteObject(ref(storage, editItem.storagePath)); } catch (err) { console.error('Storage delete error:', err); }
                    }
                }
                await updateDoc(doc(db, 'lookbook', editItem.id), data);
            } else {
                if (!file) { alert('Please select an image.'); setSaving(false); return; }
                const { url, path } = await uploadToStorage(file, 'lookbook');
                await addDoc(collection(db, 'lookbook'), {
                    outfitName, outfitSize, img: url, storagePath: path,
                    createdAt: Date.now()
                });
            }
            setShowSuccess(true); setTimeout(() => setShowSuccess(false), 3000);
            resetForm(); loadItems();
        } catch (err) { alert('Save error: ' + err.message); }
        setSaving(false);
    };

    const handleDelete = async (item) => {
        if (!confirm('Are you sure?')) return;
        try {
            await deleteDoc(doc(db, 'lookbook', item.id));
            if (item.storagePath) { try { await deleteObject(ref(storage, item.storagePath)); } catch {} }
            loadItems();
        } catch (err) { alert('Delete error: ' + err.message); }
    };

    return (
        <div className="upload-section">
            {showSuccess && <Toast message="Saved successfully!" onClose={() => setShowSuccess(false)} />}
            <h3>Concepts (Lookbook)</h3>

            <form onSubmit={handleSave} className="admin-form" style={{ background: '#fff', padding: '32px', borderRadius: '16px', border: '1px solid #f0f0f0', marginBottom: '40px' }}>
                <h4 style={{ margin: '0 0 24px', fontFamily: 'Playfair Display, serif', fontSize: '1.2rem' }}>{editItem ? 'Edit Concept' : 'Add New Concept'}</h4>
                <div className="form-grid">
                    <div className="form-group">
                        <label>Outfit Name</label>
                        <input type="text" value={outfitName} onChange={e => setOutfitName(e.target.value)} placeholder="e.g. Signature White Bodysuit" required />
                    </div>
                    <div className="form-group">
                        <label>Size</label>
                        <input type="text" value={outfitSize} onChange={e => setOutfitSize(e.target.value)} placeholder="e.g. S / M" />
                    </div>
                </div>
                <div className="form-group" style={{ marginTop: '8px' }}>
                    <label>Image {editItem ? '(Optional - select to change)' : '*'}</label>
                    {editItem && (
                        <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
                            <img src={editItem.img} alt="Current" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8, border: '1px solid #eee' }} />
                            <span style={{ fontSize: '0.8rem', color: '#888' }}>Current Image</span>
                        </div>
                    )}
                    <input type="file" accept="image/*" onChange={e => setFile(e.target.files[0])} />
                </div>
                <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                    <button type="submit" className="submit-btn" style={{ width: 'auto', paddingLeft: '40px', paddingRight: '40px' }} disabled={saving}>
                        {saving ? 'Saving...' : editItem ? 'Update' : 'Add Concept'}
                    </button>
                    {editItem && <button type="button" className="secondary-btn" style={{ width: 'auto', marginTop: 0 }} onClick={resetForm}>Cancel</button>}
                </div>
            </form>

            <div className="admin-item-list">
                {items.map(item => (
                    <div key={item.id} className="admin-item-card">
                        <img src={item.img} alt={item.outfitName} className="admin-item-thumb" />
                        <div className="admin-item-info">
                            <h4>{item.outfitName}</h4>
                            <p style={{ margin: '0 0 12px', fontSize: '0.85rem', color: '#666' }}>Size: {item.outfitSize || 'FREE'}</p>
                            <div className="admin-item-actions">
                                <button onClick={() => {
                                    setEditItem(item); setOutfitName(item.outfitName); setOutfitSize(item.outfitSize || '');
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}>Edit</button>
                                <button onClick={() => handleDelete(item)} className="delete">Delete</button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// ===== 4. Events Tab =====
const EventsTab = () => {
    const [events, setEvents] = useState([]);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [titleEn, setTitleEn] = useState(''); const [contentEn, setContentEn] = useState('');
    const [titleJa, setTitleJa] = useState(''); const [contentJa, setContentJa] = useState('');
    const [titleZh, setTitleZh] = useState(''); const [contentZh, setContentZh] = useState('');
    const [showMulti, setShowMulti] = useState(false);
    const [images, setImages] = useState([]);
    const [existingImages, setExistingImages] = useState([]);
    const [editId, setEditId] = useState(null);
    const [showSuccess, setShowSuccess] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => { loadEvents(); }, []);

    const loadEvents = async () => {
        try {
            const snap = await getDocs(query(collection(db, 'events'), orderBy('createdAt', 'desc')));
            setEvents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch (err) { console.error(err); }
    };

    const autoTranslate = async () => {
        if (!title && !content) { alert('Please enter Korean source first.'); return; }
        const translate = async (text, target) => {
            if (!text) return '';
            try {
                const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=ko|${target}`);
                const data = await res.json();
                return data.responseData?.translatedText || text;
            } catch { return text; }
        };
        const [te, ce, tj, cj, tz, cz] = await Promise.all([
            translate(title, 'en'), translate(content, 'en'),
            translate(title, 'ja'), translate(content, 'ja'),
            translate(title, 'zh-CN'), translate(content, 'zh-CN'),
        ]);
        setTitleEn(te); setContentEn(ce); setTitleJa(tj); setContentJa(cj); setTitleZh(tz); setContentZh(cz);
        setShowMulti(true);
    };

    const handleSave = async () => {
        if (!title) { alert('Title is required.'); return; }
        setSaving(true);
        try {
            let imageUrls = [...existingImages];
            for (const f of images) {
                const { url } = await uploadToStorage(f, 'events');
                imageUrls.push(url);
            }
            const data = {
                title, content, titleEn, contentEn, titleJa, contentJa, titleZh, contentZh,
                images: imageUrls, updatedAt: serverTimestamp(), 
                ...(editId ? {} : { createdAt: serverTimestamp() })
            };
            if (editId) { await updateDoc(doc(db, 'events', editId), data); }
            else { await addDoc(collection(db, 'events'), data); }
            setShowSuccess(true); setTimeout(() => setShowSuccess(false), 3000);
            resetForm(); loadEvents();
        } catch (err) { alert('Save error: ' + err.message); }
        setSaving(false);
    };

    const resetForm = () => {
        setTitle(''); setContent(''); setTitleEn(''); setContentEn(''); setTitleJa(''); setContentJa(''); setTitleZh(''); setContentZh('');
        setImages([]); setExistingImages([]); setEditId(null); setShowMulti(false);
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure?')) return;
        try { await deleteDoc(doc(db, 'events', id)); loadEvents(); } catch (err) { alert(err.message); }
    };

    return (
        <div className="upload-section">
            {showSuccess && <Toast message="Saved successfully!" onClose={() => setShowSuccess(false)} />}
            <h3>Events & Notice</h3>
            
            <div className="admin-form" style={{ background: '#fff', padding: '32px', borderRadius: '16px', border: '1px solid #f0f0f0', marginBottom: '40px' }}>
                <h4 style={{ margin: '0 0 24px', fontFamily: 'Playfair Display, serif', fontSize: '1.2rem' }}>{editId ? 'Edit Event' : 'New Event'}</h4>
                <div className="form-grid">
                    <div className="form-group">
                        <label>Title (KO)</label>
                        <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Event Title" />
                    </div>
                    <div className="form-group">
                        <label>Description (KO)</label>
                        <textarea value={content} onChange={e => setContent(e.target.value)} rows={3} placeholder="Event details..." />
                    </div>
                </div>

                <button type="button" className="secondary-btn" onClick={autoTranslate} style={{ marginBottom: 24, fontSize: '0.85rem' }}>
                    ✨ Auto-translate to Multi-languages
                </button>

                {showMulti && (
                    <div className="admin-grid-two" style={{ marginBottom: 24, padding: 20, background: '#f9f9f9', borderRadius: 12 }}>
                        <div><label>English</label><input value={titleEn} onChange={e => setTitleEn(e.target.value)} placeholder="Title EN" /></div>
                        <div><label>Japanese</label><input value={titleJa} onChange={e => setTitleJa(e.target.value)} placeholder="Title JA" /></div>
                        <div><label>Chinese</label><input value={titleZh} onChange={e => setTitleZh(e.target.value)} placeholder="Title ZH" /></div>
                    </div>
                )}

                <div className="form-group">
                    <label>Photos</label>
                    <input type="file" accept="image/*" multiple onChange={e => setImages(Array.from(e.target.files))} />
                </div>

                {existingImages.length > 0 && (
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 24 }}>
                        {existingImages.map((img, idx) => (
                            <div key={idx} style={{ position: 'relative' }}>
                                <img src={img} alt="" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8 }} />
                                <button onClick={() => setExistingImages(prev => prev.filter((_, i) => i !== idx))}
                                    style={{ position: 'absolute', top: -5, right: -5, background: '#e74c3c', color: '#fff', border: 'none', borderRadius: '50%', width: 20, height: 20, cursor: 'pointer' }}>×</button>
                            </div>
                        ))}
                    </div>
                )}

                <div style={{ display: 'flex', gap: 12 }}>
                    <button className="submit-btn" onClick={handleSave} disabled={saving} style={{ width: 'auto', paddingLeft: 40, paddingRight: 40 }}>
                        {saving ? 'Saving...' : editId ? 'Update' : 'Post Event'}
                    </button>
                    {editId && <button className="secondary-btn" onClick={resetForm} style={{ width: 'auto' }}>Cancel</button>}
                </div>
            </div>

            <div className="admin-item-list">
                {events.map(ev => (
                    <div key={ev.id} className="admin-item-card">
                        {ev.images?.[0] && <img src={ev.images[0]} alt="" className="admin-item-thumb" />}
                        <div className="admin-item-info">
                            <strong>{ev.title}</strong>
                            <span style={{ fontSize: '0.8rem', color: '#888' }}>{ev.createdAt?.toDate ? ev.createdAt.toDate().toLocaleDateString() : ''}</span>
                        </div>
                        <div className="admin-item-actions">
                            <button onClick={() => {
                                setEditId(ev.id); setTitle(ev.title || ''); setContent(ev.content || '');
                                setTitleEn(ev.titleEn || ''); setTitleJa(ev.titleJa || ''); setTitleZh(ev.titleZh || '');
                                setExistingImages(ev.images || []); setShowMulti(true);
                            }}>Edit</button>
                            <button onClick={() => handleDelete(ev.id)} className="delete">Delete</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// ===== 5. Hero Tab =====
const HeroTab = () => {
    const [slides, setSlides] = useState([]);
    const [ytUrl, setYtUrl] = useState('');
    const [showYtInput, setShowYtInput] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const dragItem = useRef(null);
    const dragOverItem = useRef(null);

    useEffect(() => { loadSlides(); }, []);

    const loadSlides = async () => {
        try {
            const snap = await getDocs(query(collection(db, 'hero_slides'), orderBy('order', 'asc')));
            setSlides(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch (err) { console.error(err); }
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
            const { url, path } = await uploadToStorage(file, 'hero');
            await addDoc(collection(db, 'hero_slides'), {
                type: 'image', src: url, storagePath: path,
                order: slides.length, createdAt: serverTimestamp()
            });
            loadSlides();
        } catch (err) { alert(err.message); }
    };

    const handleAddYoutube = async () => {
        let videoId = ytUrl.trim();
        const match = videoId.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
        if (match) videoId = match[1];
        if (videoId.length !== 11) { alert('Invalid YouTube URL'); return; }
        try {
            await addDoc(collection(db, 'hero_slides'), {
                type: 'video', src: videoId, order: slides.length, createdAt: serverTimestamp()
            });
            setYtUrl(''); setShowYtInput(false); loadSlides();
        } catch (err) { alert(err.message); }
    };

    const handleDragEnd = () => {
        const items = [...slides];
        const [removed] = items.splice(dragItem.current, 1);
        items.splice(dragOverItem.current, 0, removed);
        dragItem.current = null; dragOverItem.current = null;
        setSlides(items);
    };

    const saveOrder = async () => {
        try {
            await Promise.all(slides.map((s, i) => updateDoc(doc(db, 'hero_slides', s.id), { order: i })));
            const { syncCollection } = await import('../utils/syncService');
            await syncCollection(STORES.HERO_SLIDES);
            setShowSuccess(true); setTimeout(() => setShowSuccess(false), 3000);
        } catch (err) { alert(err.message); }
    };

    const handleDelete = async (slide) => {
        if (!confirm('Delete slide?')) return;
        try {
            await deleteDoc(doc(db, 'hero_slides', slide.id));
            if (slide.storagePath) { try { await deleteObject(ref(storage, slide.storagePath)); } catch {} }
            loadSlides();
        } catch (err) { alert(err.message); }
    };

    return (
        <div className="upload-section">
            {showSuccess && <Toast message="Order saved successfully!" onClose={() => setShowSuccess(false)} />}
            <h3>Hero Slides</h3>
            <div style={{ display: 'flex', gap: 12, marginBottom: 32 }}>
                <label className="add-btn" style={{ cursor: 'pointer' }}>
                    📷 Add Image Slide
                    <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                </label>
                <button className="add-btn" onClick={() => setShowYtInput(!showYtInput)}>▶ Add Video Slide</button>
                {slides.length > 1 && <button className="add-btn" onClick={saveOrder}>Save Order</button>}
            </div>

            {showYtInput && (
                <div style={{ display: 'flex', gap: 12, marginBottom: 24, padding: 24, background: '#f9f9f9', borderRadius: 16 }}>
                    <input style={{ flex: 1 }} type="text" value={ytUrl} onChange={e => setYtUrl(e.target.value)} placeholder="YouTube URL or Video ID" />
                    <button className="submit-btn" style={{ width: 'auto' }} onClick={handleAddYoutube}>Add</button>
                </div>
            )}

            <div className="hero-slide-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 24 }}>
                {slides.map((slide, idx) => (
                    <div key={slide.id} className="hero-slide-card" 
                         draggable 
                         onDragStart={() => dragItem.current = idx}
                         onDragOver={e => { e.preventDefault(); dragOverItem.current = idx; }}
                         onDragEnd={handleDragEnd}
                         style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', border: '1px solid #eee' }}
                    >
                        {slide.type === 'video' ? (
                            <div style={{ aspectRatio: '16/9', background: '#000', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <span style={{ fontSize: '0.9rem' }}>YouTube: {slide.src}</span>
                            </div>
                        ) : (
                            <img src={slide.src} alt="" style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover' }} />
                        )}
                        <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', gap: 8 }}>
                            <button onClick={() => handleDelete(slide)} style={{ background: 'rgba(231, 76, 60, 0.9)', color: '#fff', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer' }}>×</button>
                        </div>
                        <span style={{ position: 'absolute', bottom: 12, left: 12, background: '#fff', padding: '4px 10px', borderRadius: 20, fontSize: '0.8rem', fontWeight: 700 }}>#{idx + 1}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

// ===== 6. Applications Tab =====
const ApplicationsTab = () => {
    const [apps, setApps] = useState([]);

    useEffect(() => { loadApps(); }, []);

    const loadApps = async () => {
        try {
            const snap = await getDocs(query(collection(db, 'applications'), orderBy('createdAt', 'desc')));
            setApps(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch (err) { console.error(err); }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete applicant?')) return;
        try { await deleteDoc(doc(db, 'applications', id)); loadApps(); } catch (err) { alert(err.message); }
    };

    return (
        <div className="upload-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                <h3 style={{ margin: 0 }}>Applicants</h3>
                <button className="add-btn" onClick={loadApps}>Refresh</button>
            </div>
            <div className="admin-item-list">
                {apps.map(app => (
                    <div key={app.id} className="app-card">
                        <div className="applicant-header">
                            <div className="app-main-info">
                                <h4 style={{ fontSize: '1.4rem', margin: 0, color: '#000', fontWeight: 800 }}>
                                    {app.name || app.userName || <span style={{ color: '#ff6b6b' }}>[이름 없음]</span>}
                                </h4>
                                <div className="app-insta-row" style={{ marginTop: 4 }}>
                                    {app.insta ? (
                                        <a href={`https://instagram.com/${app.insta.replace('@','')}`} target="_blank" rel="noreferrer" style={{ 
                                            color: 'var(--color-primary)', 
                                            textDecoration: 'none',
                                            fontSize: '0.95rem',
                                            fontWeight: 600,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px'
                                        }}>
                                            📷 {app.insta}
                                        </a>
                                    ) : (
                                        <span style={{ fontSize: '0.85rem', color: '#999' }}>No Instagram</span>
                                    )}
                                </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div className="admin-item-badge" style={{ marginBottom: 8, display: 'block', width: 'fit-content', marginLeft: 'auto' }}>
                                    {app.job || 'Applicant'}
                                </div>
                                <button onClick={() => handleDelete(app.id)} className="delete" style={{ fontSize: '0.8rem', opacity: 0.6 }}>Delete</button>
                            </div>
                        </div>
                        <div className="app-profile" style={{ marginTop: 24, padding: '16px 0', borderTop: '1px solid #f0f0f0' }}>
                            <div className="app-info-grid">
                                {app.location && <span>📍 {app.location}</span>}
                                {app.phone && <span>📞 {app.phone}</span>}
                                {app.createdAt?.toDate && <span>📅 {app.createdAt.toDate().toLocaleDateString()}</span>}
                            </div>
                        </div>
                        {app.keywords && (
                            <div className="app-keywords-box" style={{ marginTop: 12, padding: '16px 20px', background: '#f8f9fa', borderRadius: '12px', border: '1px solid #f0f0f0' }}>
                                <p style={{ margin: 0, fontSize: '0.9rem', color: '#444', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{app.keywords}</p>
                            </div>
                        )}
                    </div>
                ))}
                {apps.length === 0 && <p style={{ textAlign: 'center', padding: 40, color: '#888' }}>No applications yet.</p>}
            </div>
        </div>
    );
};

// ===== 7. Partners Tab =====
const PartnersTab = () => {
    const [partners, setPartners] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [editId, setEditId] = useState(null);
    const [form, setForm] = useState({
        name: '', location: '', category: 'fitness', description: '',
        images: [], trainers: []
    });
    const [saving, setSaving] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    useEffect(() => { loadPartners(); }, []);

    const loadPartners = async () => {
        try {
            const snap = await getDocs(query(collection(db, 'partners'), orderBy('createdAt', 'desc')));
            setPartners(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch (err) { console.error(err); }
    };

    const resetForm = () => {
        setForm({ name: '', location: '', category: 'fitness', description: '', images: [], trainers: [] });
        setEditId(null); setShowForm(false);
    };

    const handleSave = async () => {
        if (!form.name) { alert('Partner Name is required.'); return; }
        setSaving(true);
        try {
            const data = { ...form, updatedAt: serverTimestamp(), ...(editId ? {} : { createdAt: serverTimestamp() }) };
            if (editId) { await updateDoc(doc(db, 'partners', editId), data); }
            else { await addDoc(collection(db, 'partners'), data); }
            const { syncCollection } = await import('../utils/syncService');
            await syncCollection(STORES.PARTNERS);
            setShowSuccess(true); setTimeout(() => setShowSuccess(false), 3000);
            resetForm(); loadPartners();
        } catch (err) { alert('Save error: ' + err.message); }
        setSaving(false);
    };

    const handleDeletePartner = async (partnerId) => {
        if (!window.confirm('Are you sure?')) return;
        try {
            await deleteDoc(doc(db, 'partners', partnerId));
            const { syncCollection } = await import('../utils/syncService');
            await syncCollection(STORES.PARTNERS);
            loadPartners();
        } catch (err) { alert(err.message); }
    };

    const startEdit = (p) => { setForm({ ...p }); setEditId(p.id); setShowForm(true); };

    const handlePartnerPhoto = async (file) => {
        const { url } = await uploadToStorage(file, 'partners');
        setForm(prev => ({ ...prev, images: [...(prev.images || []), url] }));
    };

    const removePhoto = (idx) => {
        const newImgs = [...form.images]; newImgs.splice(idx, 1);
        setForm({ ...form, images: newImgs });
    };

    const addTrainer = () => {
        setForm(prev => ({ ...prev, trainers: [...(prev.trainers || []), { name: '', role: '', description: '', image: '' }] }));
    };

    const updateTrainer = (idx, field, val) => {
        const newTr = [...form.trainers]; newTr[idx][field] = val;
        setForm(prev => ({ ...prev, trainers: newTr }));
    };

    const handleTrainerPhoto = async (idx, file) => {
        const { url } = await uploadToStorage(file, 'trainers');
        updateTrainer(idx, 'image', url);
    };

    const removeTrainer = (idx) => {
        const newTr = [...form.trainers]; newTr.splice(idx, 1);
        setForm(prev => ({ ...prev, trainers: newTr }));
    };

    return (
        <div className="upload-section">
            {showSuccess && <Toast message="Saved successfully!" onClose={() => setShowSuccess(false)} />}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                <h3 style={{ margin: 0 }}>Partners & Trainers</h3>
                <button className="add-btn" onClick={() => { resetForm(); setShowForm(true); }}>+ Add New Partner</button>
            </div>

            {showForm && (
                <div className="admin-modal-overlay" onClick={() => resetForm()}>
                    <div className="admin-modal partner-modal" onClick={e => e.stopPropagation()}>
                        <button className="close-x" onClick={resetForm}>×</button>
                        <h3>{editId ? 'Edit Partner' : 'Add New Partner'}</h3>
                        <div className="admin-modal-form">
                            <div className="admin-grid-two">
                                <div className="form-group"><label>Partner Name *</label><input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div>
                                <div className="form-group"><label>Location</label><input type="text" value={form.location} onChange={e => setForm({...form, location: e.target.value})} placeholder="ex) Gangnam" /></div>
                            </div>
                            <div className="form-group">
                                <label>Category</label>
                                <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="admin-select">
                                    <option value="fitness">Fitness / Gym</option>
                                    <option value="studio">Studio</option>
                                    <option value="beauty">Beauty / Hair</option>
                                    <option value="food">Healthy Food / Cafe</option>
                                </select>
                            </div>
                            <div className="form-group"><label>Description</label><textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={3} /></div>
                            <div className="form-group">
                                <label>Photos</label>
                                <input type="file" multiple onChange={e => Array.from(e.target.files).forEach(f => handlePartnerPhoto(f))} />
                                <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
                                    {form.images?.map((img, i) => (
                                        <div key={i} style={{ position: 'relative' }}><img src={img} alt="" style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 8 }} /><button onClick={() => removePhoto(i)} className="remove-thumb-btn">×</button></div>
                                    ))}
                                </div>
                            </div>

                            <div style={{ marginTop: 32, borderTop: '1px solid #eee', paddingTop: 24 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                                    <h4 style={{ margin: 0 }}>Trainers</h4>
                                    <button onClick={addTrainer} className="add-btn" style={{ width: 'auto', padding: '6px 12px', fontSize: '0.8rem' }}>+ Add Trainer</button>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                                    {form.trainers?.map((t, i) => (
                                        <div key={i} style={{ padding: 20, background: '#f9f9f9', borderRadius: 12, border: '1px solid #eee' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                                                <strong>Staff #{i+1}</strong>
                                                <button onClick={() => removeTrainer(i)} style={{ background: 'none', border: 'none', color: '#e74c3c', cursor: 'pointer' }}>Remove</button>
                                            </div>
                                            <div className="admin-grid-two">
                                                <div className="form-group"><label>Name</label><input value={t.name} onChange={e => updateTrainer(i, 'name', e.target.value)} /></div>
                                                <div className="form-group"><label>Role</label><input value={t.role} onChange={e => updateTrainer(i, 'role', e.target.value)} /></div>
                                            </div>
                                            <div className="form-group"><label>Photo</label><input type="file" onChange={e => handleTrainerPhoto(i, e.target.files[0])} />{t.image && <img src={t.image} alt="" style={{ width: 40, height: 40, borderRadius: '50%', marginTop: 8 }} />}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div style={{ position: 'sticky', bottom: 0, background: '#fff', padding: '24px 0', borderTop: '1px solid #eee', marginTop: 32 }}>
                                <button className="submit-btn" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Partner'}</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="admin-item-list">
                {partners.map(p => (
                    <div key={p.id} className="admin-item-card">
                        {p.images?.[0] && <img src={p.images[0]} alt="" className="admin-item-thumb" />}
                        <div className="admin-item-info">
                            <strong>{p.name}</strong>
                            <span className="admin-item-badge">{p.category.toUpperCase()}</span>
                            <span style={{ fontSize: '0.8rem', color: '#888' }}>{p.trainers?.length || 0} Trainers</span>
                        </div>
                        <div className="admin-item-actions">
                            <button onClick={() => startEdit(p)}>Edit</button>
                            <button onClick={() => handleDeletePartner(p.id)} className="delete">Delete</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Admin;
