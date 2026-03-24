import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { addItem, getData, deleteItem, updateItem, STORES } from '../utils/db';
import { db, storage } from '../utils/firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { syncAll } from '../utils/syncService';
import './Admin.css';

// ===== SEO Tag Dictionary =====
const SEO_DICT = {
    fitorialist: ['여자 바디프로필', '여성 바디프로필', 'Female Body Profile', '女子ボディプロフィール', '女子健身写真'],
    artist: ['아티스트 프로필', '댄서 프로필', 'DJ 프로필', 'Artist Profile', 'アーティスト写真'],
    fashion: ['패션 화보', '뷰티 촬영', 'Fashion Editorial', 'ファッション撮影', '时尚写真'],
    portrait: ['인물 사진', '개인 소장용', 'Portrait Photography', 'ポートレート', '个人肖像'],
    women: ['여자 바디프로필 전문', '여성미', 'Girl Crush', 'Women Strength', '女子力'],
    men: ['남자 바디프로필', '근육', 'Men Fitness', 'Bodybuilding', '男子ボディプロフィール'],
    couple: ['커플 바디프로필', '우정 스냅', 'Couple Body Profile', 'カップル写真', '情侣写真'],
    outdoor: ['야외 바디프로필', '발리 촬영', 'Outdoor Shooting', 'ロケイション촬영', '户外写真'],
};

const shuffleArray = (arr) => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
};

const generateSeoTags = (mainCat, subCat, tags) => {
    const pool = [...(SEO_DICT[mainCat] || []), ...(SEO_DICT[subCat] || [])];
    tags.forEach(t => { if (SEO_DICT[t.replace('#', '')]) pool.push(...SEO_DICT[t.replace('#', '')]); });
    return shuffleArray([...new Set(pool)]).join(', ');
};

// ===== Category Constants =====
const MAIN_CATEGORIES = [
    { id: 'fitorialist', label: 'FITORIALIST' },
    { id: 'artist', label: 'ARTIST (DANCER & DJ)' },
    { id: 'fashion', label: 'FASHION & BEAUTY' },
    { id: 'portrait', label: 'PORTRAIT' },
];

const SUB_CATEGORIES = [
    { id: 'women', label: '여자 (Women)' },
    { id: 'men', label: '남자 (Men)' },
    { id: 'couple', label: '우정&커플 (Friendship & Couple)' },
    { id: 'outdoor', label: '발리프로젝트 (Bali Project)' },
];

const MODEL_CATEGORIES = ['WOMEN', 'MEN', 'ARTIST', 'FASHION', 'PORTRAIT'];

import { uploadOptimizedImage } from '../utils/uploadService';

// ===== Upload to Firebase Storage =====
const uploadToStorage = async (file, folder = 'galleries') => {
    // hero_slides나 events 폴더 등 고화질 렌더링이 필요한 경우 옵션 조정
    const customOpts = folder === 'hero_slides' || folder === 'events' 
        ? { maxSizeMB: 2, maxWidthOrHeight: 1980 } 
        : {};
    return await uploadOptimizedImage(file, folder, customOpts);
};

// ===== Main Admin Component =====
const Admin = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(localStorage.getItem('isAdmin') === 'true');
    const [password, setPassword] = useState('');
    const [activeTab, setActiveTab] = useState('gallery');
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    useEffect(() => {
        if (searchParams.get('editModel')) setActiveTab('models');
    }, [searchParams]);

    const handleLogin = (e) => {
        e.preventDefault();
        if (password === 'admin123') {
            setIsLoggedIn(true);
            localStorage.setItem('isAdmin', 'true');
        } else {
            alert('비밀번호가 틀렸습니다.');
        }
    };

    if (!isLoggedIn) {
        return (
            <div className="admin-page">
                <div className="login-box">
                    <h2>Admin Login</h2>
                    <form onSubmit={handleLogin}>
                        <input type="password" placeholder="비밀번호 입력" value={password} onChange={e => setPassword(e.target.value)} />
                        <button type="submit">접속</button>
                    </form>
                </div>
            </div>
        );
    }

    const tabs = [
        { id: 'gallery', label: 'Gallery' },
        { id: 'models', label: 'Models' },
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
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <h2 style={{ margin: 0 }}>Dashboard</h2>
                            <span style={{ 
                                background: '#f1c40f', 
                                color: '#000', 
                                padding: '2px 8px', 
                                borderRadius: '4px', 
                                fontSize: '0.7rem', 
                                fontWeight: 'bold' 
                            }}>v8.0_UI_Perfect</span>
                        </div>
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
                    <button className="logout-btn" onClick={() => { setIsLoggedIn(false); localStorage.removeItem('isAdmin'); }}>Logout</button>
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
    const [files, setFiles] = useState([]);
    const [previews, setPreviews] = useState([]);
    const [mainCategory, setMainCategory] = useState('fitorialist');
    const [subCategory, setSubCategory] = useState('women');
    const [hashtags, setHashtags] = useState('');
    const [uploading, setUploading] = useState(false);
    const [uploadCount, setUploadCount] = useState(0);
    const [showSuccess, setShowSuccess] = useState(false);

    const [savedTags, setSavedTags] = useState(() => {
        const saved = localStorage.getItem('adminHashtags');
        return saved ? JSON.parse(saved) : ['#바디프로필', '#이너핏'];
    });
    const [allTagsCloud, setAllTagsCloud] = useState([]);

    useEffect(() => {
        (async () => {
            try {
                const items = await getData(STORES.GALLERY);
                const tagSet = new Set();
                items.forEach(item => { if (item.tags) item.tags.forEach(t => tagSet.add(t)); });
                setAllTagsCloud(Array.from(tagSet));
            } catch {}
        })();
    }, []);

    const mergedPool = Array.from(new Set([...savedTags, ...allTagsCloud]));
    const parsedTags = hashtags.split(/[\s,]+/).filter(Boolean);

    // Autocomplete
    const tokens = hashtags.split(/,\s*|\s+/);
    const lastToken = tokens[tokens.length - 1]?.trim().toLowerCase() || '';
    const suggestions = (lastToken && lastToken !== '#')
        ? mergedPool.filter(t => t.replace('#','').toLowerCase().includes(lastToken.replace('#','').toLowerCase()) && t !== tokens[tokens.length - 1]?.trim()).slice(0, 10)
        : [];

    const handleSuggestionClick = (tag) => {
        const t = [...tokens];
        t[t.length - 1] = tag;
        let r = t.join(', ');
        if (!r.endsWith(', ')) r += ', ';
        setHashtags(r);
    };

    const handleTagClick = (tag) => {
        if (!parsedTags.includes(tag)) {
            if (parsedTags.length >= 3) { alert('해시태그는 최대 3개까지만 입력할 수 있습니다.'); return; }
            setHashtags(prev => prev ? `${prev}, ${tag}` : tag);
        }
    };

    const handleTagDelete = (tag) => {
        const updated = savedTags.filter(t => t !== tag);
        setSavedTags(updated);
        localStorage.setItem('adminHashtags', JSON.stringify(updated));
    };

    const handleFiles = (fileList) => {
        const newFiles = Array.from(fileList).filter(f => f.type.startsWith('image/'));
        setFiles(prev => [...prev, ...newFiles]);
        newFiles.forEach(f => {
            const reader = new FileReader();
            reader.onloadend = () => setPreviews(prev => [...prev, { name: f.name, url: reader.result }]);
            reader.readAsDataURL(f);
        });
    };

    const handleSubmit = async () => {
        if (parsedTags.length > 3) { alert('해시태그는 최대 3개까지만 입력 가능합니다.'); return; }
        if (files.length === 0) { alert('파일을 첨부해주세요.'); return; }

        setUploading(true);
        setUploadCount(0);

        const newSaved = Array.from(new Set([...savedTags, ...parsedTags]));
        setSavedTags(newSaved);
        localStorage.setItem('adminHashtags', JSON.stringify(newSaved));

        const seoTags = generateSeoTags(mainCategory, subCategory, parsedTags);

        for (let i = 0; i < files.length; i++) {
            try {
                const { url, path } = await uploadToStorage(files[i], 'galleries');
                const galleryData = {
                    mainCategory, type: subCategory, tags: parsedTags, seoTags,
                    imageUrl: url, storagePath: path, name: files[i].name, size: files[i].size,
                    order: Date.now(), createdAt: serverTimestamp()
                };
                const docRef = await addDoc(collection(db, STORES.GALLERY), galleryData);
                await addItem(STORES.GALLERY, { ...galleryData, id: docRef.id, createdAt: new Date().toISOString() });
                setUploadCount(i + 1);
            } catch (err) {
                console.error('Upload error:', err);
                alert(`업로드 오류 (${files[i].name}): ${err.message}`);
            }
        }

        setUploading(false);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
        setFiles([]);
        setPreviews([]);
        setHashtags('');
    };

    return (
        <div className="upload-section">
            {showSuccess && <Toast message="업로드 완료!" sub="갤러리에서 확인해 보세요" onClose={() => setShowSuccess(false)} />}
            <h3>New Gallery Upload</h3>
            <div className="admin-form">
                <div className="form-group">
                    <label>1. 이미지 첨부 및 확인</label>
                    <input id="admin-file-input" type="file" accept="image/*" multiple style={{ display: 'none' }}
                        onChange={e => { handleFiles(e.target.files); e.target.value = ''; }} />
                    <div className="admin-dropzone"
                        onClick={() => document.getElementById('admin-file-input').click()}
                        onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('dragover'); }}
                        onDragLeave={e => e.currentTarget.classList.remove('dragover')}
                        onDrop={e => { e.preventDefault(); e.currentTarget.classList.remove('dragover'); handleFiles(e.dataTransfer.files); }}
                    >
                        <p style={{ fontSize: '2rem', margin: '0 0 8px' }}>📷</p>
                        <p style={{ fontWeight: 'bold', margin: '0 0 4px' }}>클릭하거나 여러 장의 사진을 여기에 드래그하세요</p>
                        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', margin: 0 }}>JPG, PNG, HEIC 등 모든 이미지 형식 지원</p>
                    </div>
                    {previews.length > 0 && (
                        <div style={{ marginTop: 12 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                <p className="success-text" style={{ margin: 0 }}>✅ {previews.length}장 첨부 완료</p>
                                <button type="button" onClick={() => { setFiles([]); setPreviews([]); }}
                                    style={{ background: 'none', border: 'none', color: '#ff4d4d', cursor: 'pointer', fontSize: '0.85rem' }}>전체 삭제</button>
                            </div>
                            <div className="preview-grid">
                                {previews.map((p, i) => (
                                    <div key={i} className="preview-thumb">
                                        <img src={p.url} alt={p.name} />
                                        <span className="preview-name">{p.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="form-group">
                    <label>2. 대분류 카테고리 (Main Category)</label>
                    <select value={mainCategory} onChange={e => setMainCategory(e.target.value)} className="admin-select">
                        {MAIN_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                    </select>
                </div>

                <div className="form-group">
                    <label>3. 중분류 카테고리 (Sub Category)</label>
                    <select value={subCategory} onChange={e => setSubCategory(e.target.value)} className="admin-select">
                        {SUB_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                    </select>
                </div>

                <div className="form-group">
                    <label>
                        4. 해시태그
                        <span style={{ color: parsedTags.length > 3 ? '#ff4d4d' : 'var(--color-primary)', marginLeft: 6, fontWeight: 'bold' }}>({parsedTags.length}/3)</span>
                        <span style={{ fontSize: '0.85em', color: 'var(--color-text-secondary)', fontWeight: 'normal', marginLeft: 6 }}>(공백 또는 콤마 구분)</span>
                    </label>
                    <input type="text" placeholder="#바디프로필, #이너핏, #레드포인트" value={hashtags}
                        onChange={e => setHashtags(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') e.preventDefault(); }} />
                    {suggestions.length > 0 && (
                        <div className="admin-autocomplete">
                            {suggestions.map((s, i) => (
                                <div key={i} className="admin-autocomplete-item" onClick={() => handleSuggestionClick(s)}>{s}</div>
                            ))}
                        </div>
                    )}
                    <small className={parsedTags.length <= 3 ? 'success-text' : 'error-text'}>현재 입력: {parsedTags.length} / 최대 3개</small>
                    {savedTags.length > 0 && (
                        <div className="saved-tags-container">
                            {savedTags.map((tag, i) => (
                                <span key={i} className="saved-tag-pill">
                                    <button type="button" onClick={() => handleTagClick(tag)} className="tag-text-btn">{tag}</button>
                                    <button type="button" onClick={() => handleTagDelete(tag)} className="tag-delete-btn" title="태그 삭제">×</button>
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                <button type="button" onClick={handleSubmit} className="submit-btn"
                    disabled={files.length === 0 || parsedTags.length > 3 || uploading}>
                    {uploading ? `업로드 중... ${uploadCount}장 서버 전송 중` : `새 사진 ${files.length}장 업로드 완료`}
                </button>
                <button type="button" className="secondary-btn" onClick={() => navigate('/gallery')}>📸 갤러리로 이동</button>
            </div>
        </div>
    );
};

// ===== 2. Models Tab =====
const ModelsTab = () => {
    const [models, setModels] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [editId, setEditId] = useState(null);
    const [form, setForm] = useState({ nameEn: '', nameKr: '', nationality: '', category: 'WOMEN', phone: '', email: '', bio: '', instagram: '', tiktok: '',
        height: '', hair: '', eyes: '', bust: '', waist: '', hips: '', shoes: '' });
    const [mainImage, setMainImage] = useState(null);
    const [portfolioFiles, setPortfolioFiles] = useState([]);
    const [showSuccess, setShowSuccess] = useState(false);

    useEffect(() => { loadModels(); }, []);

    const loadModels = async () => {
        try {
            const snap = await getDocs(query(collection(db, 'models'), orderBy('createdAt', 'desc')));
            setModels(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch (err) {
            console.error('Failed to load models:', err);
        }
    };

    const resetForm = () => {
        setForm({ nameEn: '', nameKr: '', nationality: '', category: 'WOMEN', phone: '', email: '', bio: '', instagram: '', tiktok: '',
            height: '', hair: '', eyes: '', bust: '', waist: '', hips: '', shoes: '' });
        setMainImage(null);
        setPortfolioFiles([]);
        setEditId(null);
        setShowForm(false);
    };

    const handleSave = async () => {
        if (!form.nameEn) { alert('English Name은 필수입니다.'); return; }
        try {
            let mainImageUrl = editId ? models.find(m => m.id === editId)?.mainImage : null;
            if (mainImage) {
                const { url } = await uploadToStorage(mainImage, 'models');
                mainImageUrl = url;
            }

            let portfolioUrls = editId ? models.find(m => m.id === editId)?.portfolio || [] : [];
            for (const f of portfolioFiles) {
                const { url } = await uploadToStorage(f, 'models/portfolio');
                portfolioUrls.push({ url, type: 'PORTFOLIO' });
            }

            const data = {
                ...form, mainImage: mainImageUrl, portfolio: portfolioUrls,
                updatedAt: serverTimestamp(), ...(editId ? {} : { createdAt: serverTimestamp() })
            };

            if (editId) {
                await updateDoc(doc(db, 'models', editId), data);
            } else {
                await addDoc(collection(db, 'models'), data);
            }
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
            resetForm();
            loadModels();
        } catch (err) {
            alert('저장 오류: ' + err.message);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('정말 삭제하시겠습니까?')) return;
        try {
            await deleteDoc(doc(db, 'models', id));
            loadModels();
        } catch (err) { alert('삭제 오류: ' + err.message); }
    };

    const startEdit = (model) => {
        setForm({
            nameEn: model.nameEn || '', nameKr: model.nameKr || '', nationality: model.nationality || '',
            category: model.category || 'WOMEN', phone: model.phone || '', email: model.email || '',
            bio: model.bio || '', instagram: model.instagram || '', tiktok: model.tiktok || '',
            height: model.height || '', hair: model.hair || '', eyes: model.eyes || '',
            bust: model.bust || '', waist: model.waist || '', hips: model.hips || '', shoes: model.shoes || ''
        });
        setEditId(model.id);
        setShowForm(true);
    };

    return (
        <div className="upload-section">
            {showSuccess && <Toast message="저장 완료!" onClose={() => setShowSuccess(false)} />}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 style={{ margin: 0 }}>Model Management Board</h3>
                <button className="add-btn" onClick={() => { resetForm(); setShowForm(true); }}>+ Add New Model</button>
            </div>

            {showForm && (
                <div className="admin-modal-overlay" onClick={() => resetForm()}>
                    <div className="admin-modal" onClick={e => e.stopPropagation()}>
                        <button className="close-x" onClick={resetForm}>×</button>
                        <h3>{editId ? 'Edit Model' : 'Add New Model'}</h3>
                        <div className="admin-modal-form">
                            <div className="form-grid">
                                <div className="form-column">
                                    <div className="form-group"><label>English Name *</label><input type="text" value={form.nameEn} onChange={e => setForm({...form, nameEn: e.target.value})} /></div>
                                    <div className="form-group"><label>Korean Name</label><input type="text" value={form.nameKr} onChange={e => setForm({...form, nameKr: e.target.value})} /></div>
                                    <div className="form-group"><label>Nationality</label><input type="text" value={form.nationality} onChange={e => setForm({...form, nationality: e.target.value})} /></div>
                                    <div className="form-group"><label>Category</label>
                                        <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="admin-select">
                                            {MODEL_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div className="row-2">
                                        <div className="form-group"><label>Phone</label><input type="text" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} /></div>
                                        <div className="form-group"><label>Email</label><input type="text" value={form.email} onChange={e => setForm({...form, email: e.target.value})} /></div>
                                    </div>
                                    <div className="form-group"><label>Biography</label><textarea value={form.bio} onChange={e => setForm({...form, bio: e.target.value})} rows={3} /></div>
                                    <div className="row-2">
                                        <div className="form-group"><label>Instagram</label><input type="text" value={form.instagram} onChange={e => setForm({...form, instagram: e.target.value})} /></div>
                                        <div className="form-group"><label>TikTok</label><input type="text" value={form.tiktok} onChange={e => setForm({...form, tiktok: e.target.value})} /></div>
                                    </div>
                                </div>
                                <div className="form-column">
                                    <label style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>Measurements</label>
                                    <div className="measure-grid">
                                        {['height', 'hair', 'eyes', 'bust', 'waist', 'hips', 'shoes'].map(f => (
                                            <div key={f} className="form-item">
                                                <label>{f.charAt(0).toUpperCase() + f.slice(1)}</label>
                                                <input type="text" value={form[f]} onChange={e => setForm({...form, [f]: e.target.value})} />
                                            </div>
                                        ))}
                                    </div>
                                    <div className="form-group" style={{ marginTop: 16 }}>
                                        <label>Main Image {editId ? '(Optional)' : ''}</label>
                                        <input type="file" accept="image/*" onChange={e => setMainImage(e.target.files[0])} />
                                    </div>
                                    <div className="form-group">
                                        <label>Add Portfolio</label>
                                        <input type="file" accept="image/*" multiple onChange={e => setPortfolioFiles(Array.from(e.target.files))} />
                                    </div>
                                </div>
                            </div>
                            <button className="submit-btn" onClick={handleSave}>{editId ? 'Update Model' : 'Add Model'}</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="admin-item-list">
                {models.map(m => (
                    <div key={m.id} className="admin-item-card">
                        {m.mainImage && <img src={m.mainImage} alt={m.nameEn} className="admin-item-thumb" />}
                        <div className="admin-item-info">
                            <strong>{m.nameEn}</strong> {m.nameKr && <span style={{ color: 'var(--color-text-secondary)' }}>({m.nameKr})</span>}
                            <span className="admin-item-badge">{m.category}</span>
                        </div>
                        <div className="admin-item-actions">
                            <button onClick={() => startEdit(m)}>Edit</button>
                            <button onClick={() => handleDelete(m.id)} className="delete">Delete</button>
                        </div>
                    </div>
                ))}
                {models.length === 0 && <p style={{ color: 'var(--color-text-secondary)', textAlign: 'center', padding: 40 }}>등록된 모델이 없습니다.</p>}
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
            const snap = await getDocs(collection(db, 'lookbook'));
            setItems(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch (err) { console.error(err); }
        setLoading(false);
    };

    const resetForm = () => {
        setOutfitName(''); setOutfitSize(''); setFile(null); setEditItem(null);
    };

    const handleSave = async (e) => {
        if (e) e.preventDefault();
        if (!outfitName) { alert('의상 명칭을 입력하세요.'); return; }
        setSaving(true);
        try {
            if (editItem) {
                // 수정 모드: outfitName, outfitSize만 업데이트
                await updateDoc(doc(db, 'lookbook', editItem.id), { outfitName, outfitSize });
            } else {
                // 등록 모드: 이미지 필수
                if (!file) { alert('이미지를 선택하세요.'); setSaving(false); return; }
                const { url, path } = await uploadToStorage(file, 'lookbook');
                await addDoc(collection(db, 'lookbook'), {
                    outfitName, outfitSize, img: url, storagePath: path,
                    name: file.name, size: file.size, createdAt: Date.now()
                });
            }
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
            resetForm();
            loadItems();
        } catch (err) { alert('저장 오류: ' + err.message); }
        setSaving(false);
    };

    const handleDelete = async (item) => {
        if (!confirm('정말 삭제하시겠습니까?')) return;
        try {
            await deleteDoc(doc(db, 'lookbook', item.id));
            if (item.storagePath) { try { await deleteObject(ref(storage, item.storagePath)); } catch {} }
            loadItems();
        } catch (err) { alert('삭제 오류: ' + err.message); }
    };

    return (
        <div className="upload-section">
            {showSuccess && <Toast message="저장 완료!" onClose={() => setShowSuccess(false)} />}
            <h3>Concept (Lookbook) Management</h3>

            {/* 등록/수정 폼 (다크 카드) */}
            <form onSubmit={handleSave} className="concept-form-card">
                <h4>{editItem ? '컨셉 정보 수정' : '새 컨셉 등록'}</h4>
                <div className="concept-form-grid">
                    <div className="form-group">
                        <label className="concept-label">의상 명칭 (Outfit Name)</label>
                        <input type="text" value={outfitName} onChange={e => setOutfitName(e.target.value)}
                            className="concept-input" placeholder="예: 시그니처 화이트 바디수트" required />
                    </div>
                    <div className="form-group">
                        <label className="concept-label">사이즈 (Size)</label>
                        <input type="text" value={outfitSize} onChange={e => setOutfitSize(e.target.value)}
                            className="concept-input" placeholder="예: S / M" />
                    </div>
                </div>
                {!editItem && (
                    <div className="form-group" style={{ marginBottom: 16 }}>
                        <label className="concept-label">이미지 선택</label>
                        <input type="file" accept="image/*" onChange={e => setFile(e.target.files[0])} className="concept-input" />
                    </div>
                )}
                <div style={{ display: 'flex', gap: 12 }}>
                    {editItem && (
                        <button type="button" onClick={resetForm} className="concept-cancel-btn">취소</button>
                    )}
                    <button type="submit" disabled={saving} className="concept-submit-btn" style={{ cursor: saving ? 'not-allowed' : 'pointer' }}>
                        {saving ? '업로드 중...' : editItem ? '저장하기' : '등록하기'}
                    </button>
                </div>
            </form>

            {/* 컨셉 카드 그리드 */}
            <div className="concept-grid">
                {loading ? <p style={{ color: '#888' }}>불러오는 중...</p> : items.map(item => (
                    <div key={item.id} className="concept-card">
                        <div className="concept-card-img">
                            <img src={item.img || item.imageUrl} alt={item.outfitName || item.name} />
                        </div>
                        <div className="concept-card-info">
                            <h5>{item.outfitName || item.name}</h5>
                            <p>Size: {item.outfitSize || item.size || 'FREE'}</p>
                            <div className="concept-card-actions">
                                <button className="concept-edit-btn" onClick={() => {
                                    setEditItem(item);
                                    setOutfitName(item.outfitName || item.name || '');
                                    setOutfitSize(item.outfitSize || item.size || '');
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}>수정</button>
                                <button className="concept-delete-btn" onClick={() => handleDelete(item)}>삭제</button>
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

    useEffect(() => { loadEvents(); }, []);

    const loadEvents = async () => {
        try {
            const snap = await getDocs(query(collection(db, 'events'), orderBy('createdAt', 'desc')));
            setEvents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch (err) { console.error(err); }
    };

    const autoTranslate = async () => {
        if (!title && !content) { alert('한국어 원문을 먼저 입력하세요.'); return; }
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
        if (!title) { alert('이벤트 제목을 입력하세요.'); return; }
        try {
            let imageUrls = [...existingImages];
            for (const f of images) {
                const { url } = await uploadToStorage(f, 'events');
                imageUrls.push(url);
            }
            const data = {
                title, content, titleEn, contentEn, titleJa, contentJa, titleZh, contentZh,
                images: imageUrls, updatedAt: serverTimestamp(), ...(editId ? {} : { createdAt: serverTimestamp() })
            };
            if (editId) { await updateDoc(doc(db, 'events', editId), data); }
            else { await addDoc(collection(db, 'events'), data); }
            setShowSuccess(true); setTimeout(() => setShowSuccess(false), 3000);
            setTitle(''); setContent(''); setTitleEn(''); setContentEn(''); setTitleJa(''); setContentJa(''); setTitleZh(''); setContentZh('');
            setImages([]); setExistingImages([]); setEditId(null); setShowMulti(false);
            loadEvents();
        } catch (err) { alert('저장 오류: ' + err.message); }
    };

    const handleDelete = async (id) => {
        if (!confirm('정말 삭제하시겠습니까?')) return;
        try { await deleteDoc(doc(db, 'events', id)); loadEvents(); } catch (err) { alert(err.message); }
    };

    return (
        <div className="upload-section">
            {showSuccess && <Toast message="저장 완료!" onClose={() => setShowSuccess(false)} />}
            <h3>EVENT & NOTICE Management</h3>
            <div className="admin-form">
                <div className="form-group">
                    <label>이벤트 제목</label>
                    <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="이벤트 제목 (예: 3월 바디프로필 할인 이벤트)" />
                </div>
                <div className="form-group">
                    <label>이벤트 내용</label>
                    <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="이벤트 내용 (줄바꿈 가능)" rows={4} />
                </div>

                <button type="button" className="secondary-btn" onClick={autoTranslate} style={{ marginBottom: 16 }}>
                    ✨ 원문을 다국어로 자동 번역하기
                </button>

                {showMulti && (
                    <div className="multi-lang-section">
                        <h4>영어 (EN)</h4>
                        <input type="text" value={titleEn} onChange={e => setTitleEn(e.target.value)} placeholder="Title (EN)" />
                        <textarea value={contentEn} onChange={e => setContentEn(e.target.value)} placeholder="Content (EN)" rows={3} />
                        <h4>일본어 (JA)</h4>
                        <input type="text" value={titleJa} onChange={e => setTitleJa(e.target.value)} placeholder="Title (JA)" />
                        <textarea value={contentJa} onChange={e => setContentJa(e.target.value)} placeholder="Content (JA)" rows={3} />
                        <h4>중국어 (ZH)</h4>
                        <input type="text" value={titleZh} onChange={e => setTitleZh(e.target.value)} placeholder="Title (ZH)" />
                        <textarea value={contentZh} onChange={e => setContentZh(e.target.value)} placeholder="Content (ZH)" rows={3} />
                    </div>
                )}

                <div className="form-group">
                    <label>📷 사진 첨부 (선택, 여러 장 가능)</label>
                    <input type="file" accept="image/*" multiple onChange={e => setImages(Array.from(e.target.files))} />
                </div>

                {existingImages.length > 0 && (
                    <div className="existing-images-preview" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
                        {existingImages.map((img, idx) => (
                            <div key={idx} style={{ position: 'relative' }}>
                                <img src={img} alt="existing" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '4px' }} />
                                <button type="button" onClick={() => setExistingImages(prev => prev.filter((_, i) => i !== idx))}
                                    style={{ position: 'absolute', top: -5, right: -5, background: 'rgba(255,0,0,0.8)', color: '#fff', border: 'none', borderRadius: '50%', width: '20px', height: '20px', fontSize: '12px', cursor: 'pointer' }}>×</button>
                            </div>
                        ))}
                    </div>
                )}

                <button className="submit-btn" onClick={handleSave}>{editId ? '수정 완료' : '이벤트 등록'}</button>
                {editId && <button className="secondary-btn" onClick={() => { setEditId(null); setTitle(''); setContent(''); setExistingImages([]); setImages([]); }}>취소</button>}
            </div>

            <div className="admin-item-list" style={{ marginTop: 24 }}>
                {events.map(ev => (
                    <div key={ev.id} className="admin-item-card">
                        <div className="admin-item-info" style={{ flex: 1 }}>
                            <strong>{ev.title}</strong>
                            <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem' }}>
                                {ev.createdAt?.toDate ? ev.createdAt.toDate().toLocaleDateString() : ''}
                            </span>
                        </div>
                        <div className="admin-item-actions">
                            <button onClick={() => {
                                setEditId(ev.id); setTitle(ev.title || ''); setContent(ev.content || '');
                                setTitleEn(ev.titleEn || ''); setContentEn(ev.contentEn || '');
                                setTitleJa(ev.titleJa || ''); setContentJa(ev.contentJa || '');
                                setTitleZh(ev.titleZh || ''); setContentZh(ev.contentZh || '');
                                setExistingImages(ev.images || []);
                                if (ev.titleEn || ev.titleJa || ev.titleZh) setShowMulti(true);
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
    const [showYtInput, setShowYtInput] = useState(false);
    const [ytUrl, setYtUrl] = useState('');
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
        } catch (err) { alert('업로드 오류: ' + err.message); }
        e.target.value = '';
    };

    const handleAddYoutube = async () => {
        let videoId = ytUrl.trim();
        const match = videoId.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
        if (match) videoId = match[1];
        if (videoId.length !== 11) { alert('유효한 YouTube ID/URL을 입력하세요.'); return; }
        try {
            await addDoc(collection(db, 'hero_slides'), {
                type: 'video', src: videoId, order: slides.length, createdAt: serverTimestamp()
            });
            setYtUrl(''); setShowYtInput(false);
            loadSlides();
        } catch (err) { alert(err.message); }
    };

    const handleDelete = async (slide) => {
        if (!confirm('삭제하시겠습니까?')) return;
        try {
            await deleteDoc(doc(db, 'hero_slides', slide.id));
            if (slide.storagePath) { try { await deleteObject(ref(storage, slide.storagePath)); } catch {} }
            loadSlides();
        } catch (err) { alert(err.message); }
    };

    const handleDragEnd = () => {
        const items = [...slides];
        const [removed] = items.splice(dragItem.current, 1);
        items.splice(dragOverItem.current, 0, removed);
        dragItem.current = null;
        dragOverItem.current = null;
        setSlides(items);
    };

    const saveOrder = async () => {
        try {
            await Promise.all(slides.map((s, i) => updateDoc(doc(db, 'hero_slides', s.id), { order: i })));
            // IndexedDB도 동기화하여 메인 화면에서 즉시 반영
            const { syncCollection } = await import('../utils/syncService');
            await syncCollection(STORES.HERO_SLIDES);
            setShowSuccess(true); setTimeout(() => setShowSuccess(false), 3000);
        } catch (err) { alert(err.message); }
    };

    return (
        <div className="upload-section">
            {showSuccess && <Toast message="순서 저장 완료!" onClose={() => setShowSuccess(false)} />}
            <h3>첫 번째 페이지 (Hero) 슬라이드 관리</h3>
            <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
                <label className="add-btn" style={{ cursor: 'pointer' }}>
                    📷 이미지 추가
                    <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                </label>
                <button className="add-btn" onClick={() => setShowYtInput(!showYtInput)}>▶ 유튜브 영상 추가</button>
                {slides.length > 1 && <button className="add-btn" onClick={saveOrder}>순서 저장</button>}
            </div>

            {showYtInput && (
                <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                    <input type="text" value={ytUrl} onChange={e => setYtUrl(e.target.value)} placeholder="YouTube URL 또는 Video ID"
                        style={{ flex: 1, padding: '10px 12px', borderRadius: 8, border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }} />
                    <button className="add-btn" onClick={handleAddYoutube}>추가</button>
                </div>
            )}

            <div className="hero-slide-grid">
                {slides.map((slide, idx) => (
                    <div key={slide.id} className="hero-slide-card"
                        draggable
                        onDragStart={() => dragItem.current = idx}
                        onDragOver={e => { e.preventDefault(); dragOverItem.current = idx; }}
                        onDragEnd={handleDragEnd}
                    >
                        {slide.type === 'video' ? (
                            <div className="hero-slide-yt">▶ {slide.src}</div>
                        ) : (
                            <img src={slide.src || slide.imageUrl} alt={`Slide ${idx + 1}`} />
                        )}
                        <button className="hero-slide-delete" onClick={() => handleDelete(slide)}>×</button>
                        <span className="hero-slide-order">{idx + 1}</span>
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
        if (!confirm('삭제하시겠습니까?')) return;
        try { await deleteDoc(doc(db, 'applications', id)); loadApps(); } catch (err) { alert(err.message); }
    };

    return (
        <div className="upload-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 style={{ margin: 0 }}>Applications</h3>
                <button className="add-btn" onClick={loadApps}>Refresh</button>
            </div>
            <div className="admin-item-list">
                {apps.map(app => (
                    <div key={app.id} className="admin-item-card" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                            <strong>{app.name}</strong>
                            <button onClick={() => handleDelete(app.id)} className="delete" style={{ background: 'none', border: 'none', color: '#ff4d4d', cursor: 'pointer' }}>Delete</button>
                        </div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {app.insta && <span>📷 <a href={`https://instagram.com/${app.insta.replace('@','')}`} target="_blank" rel="noreferrer" style={{ color: 'var(--color-primary)' }}>{app.insta}</a></span>}
                            {app.location && <span>📍 {app.location}</span>}
                            {app.phone && <span>📞 {app.phone}</span>}
                            {app.createdAt?.toDate && <span>📅 {app.createdAt.toDate().toLocaleDateString()}</span>}
                        </div>
                    </div>
                ))}
                {apps.length === 0 && <p style={{ color: 'var(--color-text-secondary)', textAlign: 'center', padding: 40 }}>신청 데이터가 없습니다.</p>}
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
        name: '',
        location: '',
        category: 'fitness',
        description: '',
        images: [],
        trainers: []
    });
    const [saving, setSaving] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    useEffect(() => { loadPartners(); }, []);

    const loadPartners = async () => {
        try {
            const snap = await getDocs(query(collection(db, 'partners'), orderBy('createdAt', 'desc')));
            setPartners(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch (err) { console.error('Failed to load partners:', err); }
    };

    const resetForm = () => {
        setForm({
            name: '',
            location: '',
            category: 'fitness',
            description: '',
            images: [],
            trainers: []
        });
        setEditId(null);
        setShowForm(false);
    };

    const handleSave = async () => {
        if (!form.name) { alert('Partner Name is required.'); return; }
        setSaving(true);
        try {
            const data = {
                ...form,
                updatedAt: serverTimestamp(),
                ...(editId ? {} : { createdAt: serverTimestamp() })
            };

            if (editId) {
                await updateDoc(doc(db, 'partners', editId), data);
            } else {
                await addDoc(collection(db, 'partners'), data);
            }
            const { syncCollection } = await import('../utils/syncService');
            await syncCollection(STORES.PARTNERS);
            setShowSuccess(true); setTimeout(() => setShowSuccess(false), 3000);
            resetForm(); loadPartners();
        } catch (err) { alert('Save error: ' + err.message); }
        setSaving(false);
    };

    const handleDeletePartner = async (partnerId) => {
        if (!window.confirm('Are you sure you want to delete this partner?')) return;
        try {
            await deleteDoc(doc(db, 'partners', partnerId));
            const { syncCollection } = await import('../utils/syncService');
            await syncCollection(STORES.PARTNERS);
            loadPartners();
        } catch (err) { 
            alert('Delete error: ' + err.message); 
        }
    };

    const startEdit = (partner) => {
        setForm({ ...partner });
        setEditId(partner.id);
        setShowForm(true);
    };

    const addTrainer = () => {
        setForm({
            ...form,
            trainers: [...form.trainers, { name: '', role: '', bio: '', image: '', contact: '' }]
        });
    };

    const removeTrainer = (idx) => {
        const newTrainers = [...form.trainers];
        newTrainers.splice(idx, 1);
        setForm({ ...form, trainers: newTrainers });
    };

    const updateTrainer = (idx, field, value) => {
        const newTrainers = [...form.trainers];
        newTrainers[idx][field] = value;
        setForm({ ...form, trainers: newTrainers });
    };

    const handleTrainerPhoto = async (idx, file) => {
        if (!file) return;
        try {
            const { url } = await uploadToStorage(file, 'partners/trainers');
            updateTrainer(idx, 'image', url);
        } catch (err) { alert('Trainer photo upload failed: ' + err.message); }
    };

    const handlePartnerPhoto = async (file) => {
        if (!file) return;
        try {
            const { url } = await uploadToStorage(file, 'partners');
            setForm(prev => ({
                ...prev,
                images: prev.images ? [...prev.images, url] : [url]
            }));
        } catch (err) { alert('Partner photo upload failed: ' + err.message); }
    };

    const removePartnerPhoto = (idx) => {
        const newImages = [...form.images];
        newImages.splice(idx, 1);
        setForm({ ...form, images: newImages });
    };

    return (
        <div className="upload-section">
            {showSuccess && <Toast message="Saved successfully!" onClose={() => setShowSuccess(false)} />}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 style={{ margin: 0 }}>Partners & Trainers Management</h3>
                <button className="add-btn" onClick={() => { resetForm(); setShowForm(true); }}>+ Add New Partner</button>
            </div>

            {showForm && (
                <div className="admin-modal-overlay" onClick={() => resetForm()} style={{ backdropFilter: 'blur(8px)', backgroundColor: 'rgba(0,0,0,0.7)' }}>
                    <div className="admin-modal" style={{ maxWidth: '850px', backgroundColor: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }} onClick={e => e.stopPropagation()}>
                        <button className="close-x" onClick={resetForm} style={{ color: 'rgba(255,255,255,0.5)' }}>×</button>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '25px', color: '#fff' }}>{editId ? 'Edit Partner' : 'Add New Partner'}</h3>
                        <div className="admin-modal-form">
                            <div className="admin-grid-two">
                                <div className="form-group">
                                    <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Partner Name *</label>
                                    <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px', padding: '12px' }} />
                                </div>
                                <div className="form-group">
                                    <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Location (Region) *</label>
                                    <input
                                        type="text"
                                        value={form.location || ''}
                                        onChange={e => setForm({...form, location: e.target.value})}
                                        placeholder="ex) 안양, 범계, 강남"
                                        style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px', padding: '12px' }}
                                    />
                                </div>
                            </div>
                            <div className="form-group" style={{ marginTop: '20px' }}>
                                <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Category</label>
                                <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="admin-select" style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px', padding: '12px' }}>
                                    <option value="fitness">FITNESS</option>
                                    <option value="pilates">PILATES</option>
                                </select>
                            </div>
                            <div className="form-group" style={{ marginTop: '20px' }}>
                                <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Description</label>
                                <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={3} style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px', padding: '12px', width: '100%' }} />
                            </div>

                            
                            <div className="form-group" style={{ marginTop: '20px' }}>
                                <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Partner Gallery Photos</label>
                                <div className="custom-file-upload" style={{ position: 'relative', marginTop: '10px' }}>
                                    <input type="file" accept="image/*" multiple onChange={e => Array.from(e.target.files).forEach(f => handlePartnerPhoto(f))} id="partner-files" style={{ display: 'none' }} />
                                    <label htmlFor="partner-files" className="add-btn" style={{ display: 'inline-block', cursor: 'pointer', backgroundColor: 'rgba(255,255,255,0.1)', border: '1px dashed rgba(255,255,255,0.3)', padding: '15px 30px', borderRadius: '12px', textAlign: 'center', width: '100%' }}>
                                        Click to select gallery photos
                                    </label>
                                </div>
                                <div style={{ display: 'flex', gap: 12, marginTop: 15, flexWrap: 'wrap' }}>
                                    {form.images?.map((img, i) => (
                                        <div key={i} style={{ position: 'relative', overflow: 'hidden', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.3)' }}>
                                            <img src={img} alt="partner" style={{ width: 100, height: 70, objectFit: 'cover' }} />
                                            <button type="button" onClick={() => removePartnerPhoto(i)} style={{ position: 'absolute', top: 5, right: 5, background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', borderRadius: '50%', width: 24, height: 24, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div style={{ marginTop: 40, paddingTop: 30, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                                    <h4 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600 }}>Trainers</h4>
                                    <button type="button" onClick={addTrainer} className="add-btn" style={{ padding: '8px 16px', fontSize: '0.85rem', borderRadius: '8px' }}>+ Add Trainer</button>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 25 }}>
                                    {form.trainers.map((t, i) => (
                                        <div key={i} style={{ padding: 25, background: 'rgba(255,255,255,0.02)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.05)', position: 'relative' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                                                <span style={{ fontWeight: 600, color: '#e74c3c' }}>Trainer #{i + 1}</span>
                                                <button type="button" onClick={() => removeTrainer(i)} style={{ color: 'rgba(255,255,255,0.4)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem' }}>Remove</button>
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                                                <div className="form-group">
                                                    <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>Name</label>
                                                    <input type="text" value={t.name} onChange={e => updateTrainer(i, 'name', e.target.value)} style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px', padding: '10px' }} />
                                                </div>
                                                <div className="form-group">
                                                    <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>Role</label>
                                                    <input type="text" value={t.role} onChange={e => updateTrainer(i, 'role', e.target.value)} style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px', padding: '10px' }} />
                                                </div>
                                            </div>
                                            <div className="form-group" style={{ marginTop: '15px' }}>
                                                <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>Personal Contact (ADMIN ONLY)</label>
                                                <input type="text" value={t.contact} onChange={e => updateTrainer(i, 'contact', e.target.value)} placeholder="010-..." style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', color: '#f1c40f', borderRadius: '8px', padding: '10px', width: '100%' }} />
                                            </div>
                                            <div className="form-group" style={{ marginTop: '15px' }}>
                                                <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>Bio</label>
                                                <textarea value={t.bio} onChange={e => updateTrainer(i, 'bio', e.target.value)} rows={2} style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px', padding: '10px', width: '100%' }} />
                                            </div>
                                            <div className="form-group" style={{ marginTop: '15px' }}>
                                                <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>Trainer Photo</label>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginTop: '8px' }}>
                                                    <div style={{ position: 'relative', width: 60, height: 60, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                                                        {t.image ? (
                                                            <img src={t.image} alt="trainer" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                        ) : (
                                                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', color: 'rgba(255,255,255,0.2)' }}>👤</div>
                                                        )}
                                                    </div>
                                                    <input type="file" accept="image/*" onChange={e => handleTrainerPhoto(i, e.target.files[0])} style={{ fontSize: '0.8rem' }} />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div style={{ position: 'sticky', bottom: 0, padding: '20px 0', background: '#1a1a1a', borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: 40 }}>
                                <button className="submit-btn" style={{ width: '100%', padding: '15px', fontSize: '1.1rem', fontWeight: 600, borderRadius: '12px', background: 'linear-gradient(45deg, #e74c3c, #c0392b)', border: 'none', color: '#fff', cursor: 'pointer', boxShadow: '0 10px 20px -5px rgba(231, 76, 60, 0.4)' }} onClick={handleSave} disabled={saving}>
                                    {saving ? 'Saving...' : editId ? 'Update Partner' : 'Create Partner'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="admin-item-list">
                {partners.map(p => (
                    <div key={p.id} className="admin-item-card">
                        {p.images?.[0] && <img src={p.images[0]} alt={p.name} className="admin-item-thumb" />}
                        <div className="admin-item-info">
                            <strong>{p.name}</strong>
                            <span className="admin-item-badge">{p.category.toUpperCase()}</span>
                            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                                {p.trainers.length} Trainers
                            </span>
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
