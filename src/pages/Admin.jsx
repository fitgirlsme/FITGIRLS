import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { db, storage } from '../utils/firebase';
import { 
    collection, addDoc, getDocs, deleteDoc, doc, updateDoc, getDoc, setDoc,
    query, orderBy, serverTimestamp, limit, where, startAfter 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import GalleryMultiUploader from '../components/GalleryMultiUploader';
import DirectorPhotoUploader from '../components/DirectorPhotoUploader';
import { uploadOptimizedImage } from '../utils/uploadService';
import './Admin.css';
import '../components/sections/Gallery.css';
import SModelAdminTab from '../components/admin/SModelAdminTab';
import RetouchAdminTab from '../components/admin/RetouchAdminTab';
import CouponAdminTab from '../components/admin/CouponAdminTab';
import { 
    MdCameraAlt, MdPhotoLibrary, MdPeople, MdShoppingBag, 
    MdEventAvailable, MdMovie, MdMoveToInbox, MdHandshake, 
    MdCamera, MdPerson, MdElderly, MdLogout, MdArrowBack,
    MdChevronRight, MdGridView, MdCollections, MdCardGiftcard, MdHome
} from 'react-icons/md';

// Constants
const MODEL_CATEGORIES = ['WOMAN', 'MAN'];
const STORES = {
    HERO_SLIDES: 'hero_slides',
    MODELS: 'models',
    LOOKBOOK: 'lookbook',
    PARTNERS: 'partners',
    DIRECTOR: 'director_activities',
    GALLERY: 'gallery',
    ISSUES: 'issues'
};

// Utilities
// Legacy upload functions removed to use optimized uploadService


const Admin = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(localStorage.getItem('admin_logged_in') === 'true');
    const [password, setPassword] = useState('');
    const [searchParams] = useSearchParams();
    const [activeTab, setActiveTab] = useState(() => {
        const param = searchParams.get('tab');
        if (param) return param;
        // On mobile, default to menu view (null)
        if (window.innerWidth <= 768) return null;
        return 'gallery';
    });

    const handleLogin = (e) => {
        e.preventDefault();
        const trimmedPassword = password.trim();
        if (trimmedPassword === 'admin123') {
            setIsLoggedIn(true);
            localStorage.setItem('admin_logged_in', 'true');
            localStorage.setItem('isAdmin', 'true');
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
        { id: 'artist', label: 'Artist', icon: <MdPerson />, desc: 'Artist profile' },
        { id: 'gallery', label: 'Gallery', icon: <MdPhotoLibrary />, desc: 'Manage photo grid' },
        { id: 'concepts', label: 'Lookbook', icon: <MdCollections />, desc: 'Lookbook outfits' },
        { id: 'studios', label: 'Studios', icon: <MdCamera />, desc: 'Studio Zones' },
        { id: 'events', label: 'Events', icon: <MdEventAvailable />, desc: 'Notices & Promos' },
        { id: 'retouch', label: 'Retouch', icon: <MdCameraAlt />, desc: 'Fitgirls & Innerfit Retouch' },
        { id: 'models', label: 'Ambassadors', icon: <MdPeople />, desc: 'Profiles & Portfolio' },
        { id: 'smodel', label: 'S-Model', icon: <MdElderly />, desc: 'Senior Models & Archives' },
        { id: 'partners', label: 'Partners', icon: <MdHandshake />, desc: 'Partner logos' },
        { id: 'hero', label: 'Hero', icon: <MdMovie />, desc: 'Main slides & Video' },
        { id: 'coupon', label: 'Coupon', icon: <MdCardGiftcard />, desc: 'Event Coupons' },
        { id: 'apply', label: 'Applications', icon: <MdMoveToInbox />, desc: 'New submissions' },
    ];

    return (
        <div className={`admin-page ${activeTab ? 'dashboard-active' : 'menu-active'}`}>
            {/* Desktop Sidebar */}
            <aside className="admin-sidebar desktop-only">
                <div className="sidebar-logo">
                    <MdGridView className="logo-icon" />
                    <span>ADMIN <strong>PANEL</strong></span>
                </div>
                <nav className="sidebar-nav">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            className={`sidebar-item ${activeTab === tab.id ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            <span className="sidebar-icon">{tab.icon}</span>
                            <span className="sidebar-label">{tab.label}</span>
                        </button>
                    ))}
                </nav>
                <div className="sidebar-footer">
                    <button className="sidebar-item sidebar-home" onClick={() => window.location.href = '/'}>
                        <MdHome />
                        <span>Go to Site</span>
                    </button>
                    <button className="sidebar-logout" onClick={() => { 
                        setIsLoggedIn(false); 
                        localStorage.removeItem('admin_logged_in'); 
                        localStorage.removeItem('isAdmin');
                        window.location.reload();
                    }}>
                        <MdLogout />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            <div className="admin-main">
                <header className="admin-top-bar">
                    <div className="top-bar-left">
                        {activeTab && (
                            <button className="mobile-only back-btn" onClick={() => setActiveTab(null)}>
                                <MdArrowBack />
                            </button>
                        )}
                        <h2>{activeTab ? tabs.find(t => t.id === activeTab)?.label : 'Dashboard Overview'}</h2>
                    </div>
                    <div className="top-bar-right mobile-only">
                        <button className="mobile-home" onClick={() => window.location.href = '/'}>
                            <MdHome />
                        </button>
                        <button className="mobile-logout" onClick={() => { 
                            setIsLoggedIn(false); 
                            localStorage.removeItem('admin_logged_in'); 
                            localStorage.removeItem('isAdmin');
                            window.location.reload();
                        }}>
                            <MdLogout />
                        </button>
                    </div>
                </header>

                <main className="admin-content-area">
                    {!activeTab && (
                        <div className="admin-mobile-menu">
                            <div className="menu-grid">
                                {tabs.map(tab => (
                                    <button 
                                        key={tab.id} 
                                        className="menu-card"
                                        onClick={() => setActiveTab(tab.id)}
                                    >
                                        <div className="card-icon-wrapper">{tab.icon}</div>
                                        <div className="card-info">
                                            <span className="card-title">{tab.label}</span>
                                            <span className="card-subtitle">{tab.desc}</span>
                                        </div>
                                        <MdChevronRight className="card-arrow" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    <div className="tab-content-wrapper">
                        {activeTab === 'gallery' && <GalleryTab />}
                        {activeTab === 'models' && <ModelsTab />}
                        {activeTab === 'concepts' && <ConceptsTab />}
                        {activeTab === 'events' && <EventsTab />}
                        {activeTab === 'hero' && <HeroTab />}
                        {activeTab === 'apply' && <ApplicationsTab />}
                        {activeTab === 'partners' && <PartnersTab />}
                        {activeTab === 'studios' && <StudiosTab />}
                        {activeTab === 'artist' && <ArtistTab />}
                        {activeTab === 'smodel' && <SModelAdminTab />}
                        {activeTab === 'retouch' && <RetouchAdminTab />}
                        {activeTab === 'coupon' && <CouponAdminTab />}
                    </div>
                </main>
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

// ===== Photo Manager Sub-component =====
const PhotoManager = ({ issues }) => {
    const [photos, setPhotos] = useState([]);
    const [lastDoc, setLastDoc] = useState(null);
    const [hasMore, setHasMore] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [loading, setLoading] = useState(false);
    const [selectedIds, setSelectedIds] = useState([]);
    const [bulkIssueId, setBulkIssueId] = useState('');
    const [deletingId, setDeletingId] = useState(null);
    const [error, setError] = useState(null);
    const [indexErrorUrl, setIndexErrorUrl] = useState(null);
    const [videoUrls, setVideoUrls] = useState({});
    const [selectedVideoCategory, setSelectedVideoCategory] = useState('fitorialist');
    const [showSuccess, setShowSuccess] = useState(false);

    useEffect(() => { 
        loadPhotos(); 
        loadCategoryVideo();
    }, []);

    const loadCategoryVideo = async () => {
        try {
            const docSnap = await getDoc(doc(db, 'configs', 'magazine'));
            if (docSnap.exists()) {
                const data = docSnap.data();
                const rawUrls = data.videoUrls || {};
                const normalizedUrls = {};
                
                // Ensure every category value is an array
                ['fitorialist', 'artist', 'fashion', 'portrait'].forEach(cat => {
                    const val = rawUrls[cat];
                    if (Array.isArray(val)) {
                        normalizedUrls[cat] = val;
                    } else if (typeof val === 'string' && val.trim() !== '') {
                        normalizedUrls[cat] = [val];
                    } else {
                        normalizedUrls[cat] = ['']; // Default to one empty field
                    }
                });
                
                setVideoUrls(normalizedUrls);
            } else {
                // Initialize with empty arrays
                setVideoUrls({
                    fitorialist: [''], artist: [''], fashion: [''], portrait: ['']
                });
            }
        } catch (err) { console.error('Failed to load category video:', err); }
    };

    const handleSaveCategoryVideo = async () => {
        try {
            const newVideoUrls = { ...videoUrls };
            // Empty strings are allowed to clear videos
            await setDoc(doc(db, 'configs', 'magazine'), {
                videoUrls: newVideoUrls,
                updatedAt: serverTimestamp()
            }, { merge: true });
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
        } catch (err) { alert('영상 정보 저장 실패: ' + err.message); }
    };

    const loadPhotos = async (isMore = false, forceSearchTerm = null, forceIsSearching = null) => {
        if (loading) return;
        setLoading(true);
        setError(null);
        setIndexErrorUrl(null);
        if (!isMore) setPhotos([]); // 새로운 로딩 시 이전 목록 비우기

        // 검색어 및 검색 상태 결정 (레이스 컨디션 방지)
        const currentSearchTerm = forceSearchTerm !== null ? forceSearchTerm : searchTerm;
        const currentIsSearching = forceIsSearching !== null ? forceIsSearching : isSearching;

        try {
            const PAGE_SIZE = 60; // 서버 사이드 쿼리이므로 페이지 사이즈를 적절히 조절
            let q;
            const galleryRef = collection(db, STORES.GALLERY);

            if (currentIsSearching && currentSearchTerm.trim()) {
                const term = currentSearchTerm.trim().startsWith('#') 
                    ? currentSearchTerm.trim().substring(1) 
                    : currentSearchTerm.trim();
                
                // Firestore array-contains 쿼리 사용 (전체 데이터 대상 검색)
                q = query(
                    galleryRef, 
                    where('tags', 'array-contains', term),
                    orderBy('createdAt', 'desc'), 
                    limit(PAGE_SIZE)
                );
            } else {
                q = query(
                    galleryRef, 
                    orderBy('createdAt', 'desc'), 
                    limit(PAGE_SIZE)
                );
            }

            if (isMore && lastDoc) {
                q = query(q, startAfter(lastDoc));
            }

            const snap = await getDocs(q);
            const fetchedPhotos = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            
            if (isMore) {
                setPhotos(prev => [...prev, ...fetchedPhotos]);
            } else {
                setPhotos(fetchedPhotos);
            }

            setLastDoc(snap.docs[snap.docs.length - 1]);
            setHasMore(snap.docs.length === PAGE_SIZE);
        } catch (err) { 
            console.error('Failed to load photos:', err);
            if (err.message?.includes('index')) {
                const urlMatch = err.message.match(/https:\/\/console\.firebase\.google\.com[^\s]+/);
                if (urlMatch) {
                    setIndexErrorUrl(urlMatch[0]);
                } else {
                    alert('검색을 위한 인덱스가 필요합니다. Firebase 콘솔에서 복합 인덱스를 생성해 주세요.');
                }
            }
            setError('사진 내역을 불러오지 못했습니다. (에러: ' + (err.message || 'Unknown Error') + ')');
            if (!isMore) setPhotos([]);
        }
        setLoading(false);
    };

    const handleSearch = (e) => {
        e.preventDefault();
        const trimmed = searchTerm.trim();
        const searching = !!trimmed;
        setIsSearching(searching);
        setLastDoc(null);
        // 상태 업데이트 완료 전에 loadPhotos를 호출하므로 값을 직접 전달
        loadPhotos(false, trimmed, searching);
    };

    const clearSearch = () => {
        setSearchTerm('');
        setIsSearching(false);
        setLastDoc(null);
        loadPhotos(false, '', false);
    };

    const toggleSelect = (id) => {
        setSelectedIds(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleBulkIssueChange = async () => {
        if (selectedIds.length === 0) return;
        if (!confirm(`${selectedIds.length}개의 사진에 선택한 이슈를 일괄 적용하시겠습니까?`)) return;

        try {
            const promises = selectedIds.map(id => 
                updateDoc(doc(db, STORES.GALLERY, id), { issueId: bulkIssueId })
            );
            await Promise.all(promises);
            
            setPhotos(prev => prev.map(p => 
                selectedIds.includes(p.id) ? { ...p, issueId: bulkIssueId } : p
            ));
            setSelectedIds([]);
            alert('일괄 적용되었습니다.');
        } catch (err) {
            alert('일괄 적용 실패: ' + err.message);
        }
    };

    const handleDelete = async (photo) => {
        if (!photo.id) return;
        const confirmed = window.confirm('이 사진을 영구 삭제하시겠습니까? (스토리지 파일도 삭제됩니다)');
        if (!confirmed) return;
        
        setDeletingId(photo.id);
        try {
            // 1. Firebase Firestore 삭제
            await deleteDoc(doc(db, STORES.GALLERY, photo.id));
            
            // 2. Firebase Storage 삭제
            if (photo.storagePath) {
                await deleteObject(ref(storage, photo.storagePath));
            }

            // 3. 로컬 IndexedDB 삭제 (동기화)
            try {
                const { deleteGalleryItem } = await import('../utils/db');
                await deleteGalleryItem(photo.id);
            } catch (err) {
                console.warn('Local DB delete skip (not critical)');
            }

            // 4. UI 상태 업데이트
            setPhotos(prev => prev.filter(p => p.id !== photo.id));
            setSelectedIds(prev => prev.filter(id => id !== photo.id));
        } catch (err) {
            console.error('Delete error:', err);
            alert('삭제 중 오류 발생: ' + err.message);
        }
        setDeletingId(null);
    };

    const handleIssueChange = async (photoId, newIssueId) => {
        try {
            await updateDoc(doc(db, STORES.GALLERY, photoId), { issueId: newIssueId });
            setPhotos(prev => prev.map(p => p.id === photoId ? { ...p, issueId: newIssueId } : p));
        } catch (err) {
            alert('이슈 수정 실패: ' + err.message);
        }
    };

    return (
        <div className="photo-manager-section" style={{ marginTop: '40px', borderTop: '1px solid #eee', paddingTop: '40px' }}>
            <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                marginBottom: '32px', 
                flexWrap: 'wrap',
                gap: '20px',
                background: '#fff',
                padding: '24px',
                borderRadius: '12px',
                boxShadow: '0 2px 12px rgba(0,0,0,0.03)',
                border: '1px solid #f0f0f0'
            }}>
                <div style={{ flex: '1 1 300px' }}>
                    <h4 style={{ margin: '0 0 4px', fontSize: '1.1rem', fontWeight: '700', color: '#1a1a1a' }}>최근 업로드 화보 내역</h4>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#666' }}>매거진에 추가할 사진을 검색하고 선택하세요.</p>
                </div>
                
                {/* Search Bar Group */}
                <div style={{ display: 'flex', alignItems: 'center', flex: '1 1 400px', justifyContent: 'flex-end', gap: '12px' }}>
                    <form onSubmit={handleSearch} style={{ display: 'flex', flex: '1', maxWidth: '380px', position: 'relative' }}>
                        <input 
                            type="text" 
                            value={searchTerm} 
                            onChange={e => setSearchTerm(e.target.value)}
                            placeholder="태그로 검색 (예: #슬기)"
                            style={{ 
                                flex: 1, 
                                padding: '10px 16px', 
                                paddingRight: '100px',
                                borderRadius: '8px', 
                                border: '1px solid #e0e0e0', 
                                fontSize: '14px',
                                outline: 'none',
                                transition: 'all 0.2s ease',
                                boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)'
                            }}
                        />
                        <button 
                            type="submit" 
                            className="submit-btn" 
                            style={{ 
                                position: 'absolute',
                                right: '4px',
                                top: '4px',
                                bottom: '4px',
                                width: '80px', 
                                padding: '0',
                                borderRadius: '6px',
                                background: '#1a1a1a',
                                color: '#fff',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '13px',
                                fontWeight: '600'
                            }}
                        >
                            검색
                        </button>
                    </form>
                    
                    {isSearching && (
                        <button 
                            type="button" 
                            onClick={clearSearch} 
                            style={{ 
                                background: '#f5f5f5', 
                                color: '#666',
                                border: '1px solid #e0e0e0', 
                                padding: '10px 16px', 
                                borderRadius: '8px', 
                                cursor: 'pointer', 
                                fontSize: '13px',
                                fontWeight: '500',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            초기화
                        </button>
                    )}
                </div>

                {/* Category Video Management (Category-specific Videos) */}
                <div style={{ 
                    flex: '1 1 100%',
                    marginTop: '20px',
                    padding: '24px',
                    background: '#fcfcfc', 
                    borderRadius: '12px', 
                    border: '1px solid #eee',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '20px'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h5 style={{ margin: '0 0 4px', fontSize: '0.95rem', fontWeight: '700', color: '#1a1a1a' }}>매거진 카테고리 영상 관리</h5>
                            <p style={{ margin: 0, fontSize: '0.8rem', color: '#888' }}>각 대분류 아카이브 상단에 노출될 영상을 설정합니다.</p>
                        </div>
                        {showSuccess && <span style={{ color: '#2ecc71', fontSize: '13px', fontWeight: '600' }}>✓ 저장되었습니다.</span>}
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                            <select 
                                value={selectedVideoCategory}
                                onChange={e => setSelectedVideoCategory(e.target.value)}
                                style={{
                                    padding: '10px 16px',
                                    borderRadius: '8px',
                                    border: '1px solid #e0e0e0',
                                    fontSize: '14px',
                                    background: '#fff',
                                    minWidth: '200px',
                                    fontWeight: '600'
                                }}
                            >
                                <option value="fitorialist">FITORIALIST</option>
                                <option value="artist">ARTIST</option>
                                <option value="fashion">BEAUTY & FASHION</option>
                                <option value="portrait">PORTRAIT</option>
                            </select>

                            <button 
                                onClick={() => {
                                    setVideoUrls(prev => ({
                                        ...prev,
                                        [selectedVideoCategory]: [...(prev[selectedVideoCategory] || []), '']
                                    }));
                                }}
                                style={{
                                    padding: '8px 16px',
                                    borderRadius: '6px',
                                    background: '#f0f0f0',
                                    border: '1px solid #ddd',
                                    fontSize: '13px',
                                    fontWeight: '600',
                                    cursor: 'pointer'
                                }}
                            >
                                + 영상 추가
                            </button>

                            <button 
                                onClick={handleSaveCategoryVideo}
                                className="submit-btn"
                                style={{ 
                                    padding: '10px 24px', 
                                    borderRadius: '8px',
                                    background: '#1a1a1a',
                                    color: '#fff',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    marginLeft: 'auto'
                                }}
                            >
                                전체 저장
                            </button>
                        </div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                            {(videoUrls[selectedVideoCategory] || ['']).map((url, idx) => (
                                <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    <span style={{ fontSize: '13px', color: '#888', minWidth: '24px' }}>{idx + 1}.</span>
                                    <input 
                                        type="text" 
                                        value={url} 
                                        onChange={e => {
                                            const newVal = e.target.value;
                                            setVideoUrls(prev => {
                                                const arr = [...(prev[selectedVideoCategory] || [])];
                                                arr[idx] = newVal;
                                                return { ...prev, [selectedVideoCategory]: arr };
                                            });
                                        }}
                                        placeholder="유튜브 영상 주소 (https://www.youtube.com/watch?v=...)"
                                        style={{ 
                                            flex: 1, 
                                            padding: '10px 16px', 
                                            borderRadius: '8px', 
                                            border: '1px solid #e0e0e0', 
                                            fontSize: '14px',
                                            outline: 'none'
                                        }}
                                    />
                                    <button 
                                        onClick={() => {
                                            setVideoUrls(prev => {
                                                const arr = (prev[selectedVideoCategory] || []).filter((_, i) => i !== idx);
                                                return { ...prev, [selectedVideoCategory]: arr.length ? arr : [''] };
                                            });
                                        }}
                                        style={{
                                            background: '#fff1f0',
                                            border: '1px solid #ffa39e',
                                            color: '#f5222d',
                                            padding: '8px',
                                            borderRadius: '6px',
                                            cursor: 'pointer'
                                        }}
                                        title="삭제"
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                                        </svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '6px', flex: '1 1 100%', justifyContent: 'flex-start', paddingTop: '16px', borderTop: '1px solid #f5f5f5' }}>
                    <button onClick={() => setSelectedIds(photos.map(p => p.id))} style={{ background: '#fff', border: '1px solid #ddd', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', color: '#555' }}>전체 선택</button>
                    <button onClick={() => setSelectedIds([])} style={{ background: '#fff', border: '1px solid #ddd', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', color: '#555' }}>선택 해제</button>
                    <button onClick={() => loadPhotos(false)} style={{ background: '#fff', border: '1px solid #ddd', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', color: '#555' }}>목록 새로고침</button>
                    <div style={{ marginLeft: 'auto', fontSize: '12px', color: '#888', alignSelf: 'center' }}>
                        총 {photos.length}개 항목
                    </div>
                </div>
            </div>

            {/* Index Error Alert */}
            {indexErrorUrl && (
                <div className="admin-index-alert" style={{ 
                    background: '#fff9fa', 
                    border: '1px solid #ffccd5', 
                    padding: '16px', 
                    borderRadius: '8px', 
                    marginBottom: '24px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <div style={{ color: '#d00', fontSize: '14px', fontWeight: '500' }}>
                        검색 기능을 활성화하기 위해 데이터베이스 인덱스 생성이 필요합니다.
                    </div>
                    <a 
                        href={indexErrorUrl} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="admin-index-btn"
                        style={{ 
                            background: '#d00', 
                            color: '#fff', 
                            textDecoration: 'none', 
                            padding: '8px 16px', 
                            borderRadius: '6px', 
                            fontSize: '13px', 
                            fontWeight: '600',
                            marginLeft: '16px'
                        }}
                    >
                        인덱스 자동 생성하러 가기
                    </a>
                </div>
            )}

            {error && <div className="admin-error-msg" style={{ background: '#fff1f0', color: '#ff4d4f', padding: '12px', borderRadius: '6px', marginBottom: '20px', border: '1px solid #ffa39e' }}>{error}</div>}

            {selectedIds.length > 0 && (
                <div style={{ 
                    background: '#f8f9fa', 
                    padding: '16px', 
                    borderRadius: '8px', 
                    marginBottom: '20px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    border: '1px solid #dee2e6'
                }}>
                    <span style={{ fontWeight: 'bold', fontSize: '14px', marginRight: '12px' }}>{selectedIds.length}개 선택됨:</span>
                    <select 
                        value={bulkIssueId} 
                        onChange={(e) => setBulkIssueId(e.target.value)}
                        style={{ padding: '6px', fontSize: '0.85rem', borderRadius: '4px', border: '1px solid #ddd' }}
                    >
                        <option value="">이슈 미지정</option>
                        {issues.map(iss => (
                            <option key={iss.id} value={iss.id}>{iss.title}</option>
                        ))}
                    </select>
                    <button 
                        onClick={handleBulkIssueChange}
                        style={{ 
                            background: '#ff2d2d', 
                            color: '#fff', 
                            border: 'none', 
                            padding: '6px 16px', 
                            borderRadius: '4px', 
                            cursor: 'pointer', 
                            fontWeight: 'bold',
                            fontSize: '0.85rem'
                        }}
                    >
                        일괄 적용
                    </button>
                </div>
            )}
            
            {loading ? <p style={{ textAlign: 'center', padding: '40px 0', color: '#888' }}>데이터를 불러오는 중입니다...</p> : (
                photos.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 0', color: '#888', background: '#f9f9f9', borderRadius: '12px', border: '1px dashed #ddd' }}>
                        <p style={{ fontSize: '1.1rem', marginBottom: '8px' }}>검색 결과가 없습니다.</p>
                        <p style={{ fontSize: '0.9rem' }}>태그가 정확한지 확인해 주세요. (예: #슬기 또는 슬기)</p>
                        {isSearching && <button onClick={clearSearch} style={{ marginTop: '12px', background: 'none', border: 'none', color: '#ff2d2d', textDecoration: 'underline', cursor: 'pointer', fontSize: '14px' }}>초기화하고 전체 목록 보기</button>}
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '16px' }}>
                    {photos.map(p => {
                        const isSelected = selectedIds.includes(p.id);
                        return (
                            <div 
                                key={p.id} 
                                className={`photo-mgmt-card ${isSelected ? 'selected' : ''}`} 
                                style={{ 
                                    background: '#f9f9f9', 
                                    borderRadius: '8px', 
                                    overflow: 'hidden', 
                                    border: isSelected ? '2px solid #ff2d2d' : '1px solid #eee', 
                                    position: 'relative',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease'
                                }}
                                onClick={() => toggleSelect(p.id)}
                            >
                                <img src={p.imageUrl || p.img} alt="" style={{ width: '100%', aspectRatio: '1:1', objectFit: 'cover' }} />
                                {isSelected && (
                                    <div style={{ 
                                        position: 'absolute', top: '8px', right: '8px', 
                                        background: '#ff2d2d', color: '#fff', 
                                        width: '20px', height: '20px', borderRadius: '50%',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '0.7rem', fontWeight: 'bold'
                                    }}>✓</div>
                                )}
                                <div style={{ padding: '8px' }}>
                                    {p.tags && p.tags.length > 0 && (
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '8px' }}>
                                            {p.tags.slice(0, 3).map((t, idx) => (
                                                <span key={idx} style={{ 
                                                    fontSize: '0.65rem', color: '#888', background: '#eee', 
                                                    padding: '1px 4px', borderRadius: '3px' 
                                                }}>{t.startsWith('#') ? t : `#${t}`}</span>
                                            ))}
                                            {p.tags.length > 3 && <span style={{ fontSize: '0.65rem', color: '#888' }}>...</span>}
                                        </div>
                                    )}
                                    <select 
                                        value={p.issueId || ''} 
                                        onChange={(e) => {
                                            e.stopPropagation();
                                            handleIssueChange(p.id, e.target.value);
                                        }}
                                        onClick={e => e.stopPropagation()}
                                        style={{ width: '100%', fontSize: '0.75rem', padding: '4px', marginBottom: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                                    >
                                        <option value="">이슈 미지정</option>
                                        {issues.map(iss => (
                                            <option key={iss.id} value={iss.id}>{iss.title}</option>
                                        ))}
                                    </select>
                                    <button 
                                        disabled={deletingId === p.id}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDelete(p);
                                        }}
                                        style={{ width: '100%', background: '#fff', color: '#ff4444', border: '1px solid #ff4444', fontSize: '0.7rem', padding: '4px', borderRadius: '4px', cursor: 'pointer' }}
                                    >
                                        {deletingId === p.id ? '삭제 중...' : 'Delete'}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )
        )}

            {/* Pagination Button */}
            {hasMore && !loading && (
                <div style={{ textAlign: 'center', marginTop: '40px' }}>
                    <button 
                        onClick={() => loadPhotos(true)}
                        style={{
                            background: '#fff',
                            border: '1px solid #ddd',
                            padding: '12px 40px',
                            borderRadius: '30px',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            fontWeight: 'bold',
                            color: '#555',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                        }}
                    >
                        이전 사진 더 불러오기 (Load More)
                    </button>
                </div>
            )}

            {loading && photos.length > 0 && <p style={{ textAlign: 'center', marginTop: '20px', color: '#888' }}>추가 데이터를 불러오는 중...</p>}
        </div>
    );
};

// ===== 1. Gallery Tab (Issues & Photos) =====
const GalleryTab = () => {
    const [issues, setIssues] = useState([]);
    const [models, setModels] = useState([]);
    const [showIssueForm, setShowIssueForm] = useState(false);
    const [editId, setEditId] = useState(null);
    const [newIssue, setNewIssue] = useState({ title: '', modelName: '', modelId: '', coverImg: null });
    const [isSaving, setIsSaving] = useState(false);
    const [issuePhotos, setIssuePhotos] = useState([]);
    const [loadingPhotos, setLoadingPhotos] = useState(false);

    useEffect(() => { 
        loadIssues(); 
        loadModels();
    }, []);

    const loadModels = async () => {
        try {
            const snap = await getDocs(query(collection(db, 'models'), orderBy('nameEn', 'asc')));
            setModels(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch (err) { console.error('Failed to load models for selector:', err); }
    };

    const loadIssues = async () => {
        try {
            const snap = await getDocs(query(collection(db, STORES.ISSUES), orderBy('createdAt', 'desc')));
            setIssues(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch (err) { console.error(err); }
    };

    const loadIssuePhotos = async (issueId) => {
        setLoadingPhotos(true);
        try {
            const q = query(collection(db, STORES.GALLERY), where('issueId', '==', issueId));
            const snap = await getDocs(q);
            const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            // Order by 'order' asc, then createdAt desc
            data.sort((a, b) => {
                if (a.order !== undefined && b.order !== undefined) return a.order - b.order;
                const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt || 0);
                const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt || 0);
                return timeB - timeA;
            });
            setIssuePhotos(data);
        } catch (err) {
            console.error('Failed to load issue photos:', err);
        }
        setLoadingPhotos(false);
    };

    const movePhoto = (index, direction) => {
        const newPhotos = [...issuePhotos];
        const newIndex = index + direction;
        if (newIndex < 0 || newIndex >= newPhotos.length) return;
        
        const [removed] = newPhotos.splice(index, 1);
        newPhotos.splice(newIndex, 0, removed);
        setIssuePhotos(newPhotos);
    };

    const handleSaveIssue = async () => {
        if (!newIssue.title || !newIssue.coverImg) { alert('제목과 커버 이미지를 모두 등록해주세요.'); return; }
        setIsSaving(true);
        try {
            let finalTitle = newIssue.title.trim();
            if (/^\d+$/.test(finalTitle)) {
                finalTitle = `ISSUE ${finalTitle}`;
            }

            let imageUrl = typeof newIssue.coverImg === 'string' ? newIssue.coverImg : '';
            let storagePath = '';

            // 1. Handle Image Upload if it's a new file
            if (newIssue.coverImg instanceof File) {
                const uploadRes = await uploadOptimizedImage(newIssue.coverImg, 'issues_covers');
                imageUrl = uploadRes.url;
                storagePath = uploadRes.path;

                // If editing, delete the old image
                if (editId) {
                    const oldIssue = issues.find(i => i.id === editId);
                    if (oldIssue?.storagePath) {
                        try { await deleteObject(ref(storage, oldIssue.storagePath)); } catch (e) { console.warn('Old image delete failed:', e); }
                    }
                }
            }

            const data = {
                title: finalTitle,
                modelName: newIssue.modelName.trim(),
                modelId: newIssue.modelId || '',
                updatedAt: serverTimestamp()
            };

            if (imageUrl) data.coverImg = imageUrl;
            if (storagePath) data.storagePath = storagePath;

            if (editId) {
                // Update
                await updateDoc(doc(db, STORES.ISSUES, editId), data);
            } else {
                // Create
                await addDoc(collection(db, STORES.ISSUES), {
                    ...data,
                    createdAt: serverTimestamp()
                });
            }

            // Update photo orders if editing
            if (editId && issuePhotos.length > 0) {
                const updatePromises = issuePhotos.map((photo, idx) => 
                    updateDoc(doc(db, STORES.GALLERY, photo.id), { order: idx })
                );
                await Promise.all(updatePromises);
            }

            handleCloseModal();
            loadIssues();
        } catch (err) { alert('저장 실패: ' + err.message); }
        setIsSaving(false);
    };

    const startEditIssue = (issue) => {
        setEditId(issue.id);
        setNewIssue({
            title: issue.title,
            modelName: issue.modelName,
            modelId: issue.modelId || '',
            coverImg: issue.coverImg // String URL
        });
        setShowIssueForm(true);
        loadIssuePhotos(issue.id);
    };

    const handleCloseModal = () => {
        setShowIssueForm(false);
        setEditId(null);
        setNewIssue({ title: '', modelName: '', modelId: '', coverImg: null });
        setIssuePhotos([]);
    };

    const handleDeleteIssue = async (issue) => {
        if (!confirm(`'${issue.title}' 이슈를 삭제하시겠습니까? (이슈 내 사진은 유지되지만 이슈 정보는 사라집니다)`)) return;
        try {
            await deleteDoc(doc(db, STORES.ISSUES, issue.id));
            if (issue.storagePath) await deleteObject(ref(storage, issue.storagePath));
            loadIssues();
        } catch (err) { alert('삭제 실패: ' + err.message); }
    };

    return (
        <div className="upload-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h3 style={{ margin: 0 }}>잡지 이슈 관리 (Magazine Issues)</h3>
                <button className="add-btn" onClick={() => { setEditId(null); setShowIssueForm(true); }}>+ 신규 이슈 추가</button>
            </div>

            {/* Issue List Grid */}
            <div className="admin-issue-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px', marginBottom: '48px' }}>
                {issues.map(issue => (
                    <div key={issue.id} className="admin-issue-card" style={{ background: '#fff', borderRadius: '12px', overflow: 'hidden', border: '1px solid #eee' }}>
                        <a href={`/magazine?id=${issue.id}`} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                            <div style={{ aspectRatio: '4/5', position: 'relative' }}>
                                <img src={issue.coverImg} alt={issue.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                        </a>
                        <div style={{ padding: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <a href={`/magazine?id=${issue.id}`} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit', flex: 1, overflow: 'hidden', marginRight: '8px' }}>
                                <strong style={{ fontSize: '0.9rem', cursor: 'pointer', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{issue.title}</strong>
                            </a>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button onClick={() => startEditIssue(issue)} style={{ background: 'none', border: 'none', color: '#444', fontSize: '0.8rem', cursor: 'pointer', textDecoration: 'underline' }}>Edit</button>
                                <button onClick={() => handleDeleteIssue(issue)} style={{ background: 'none', border: 'none', color: '#ff4444', fontSize: '0.8rem', cursor: 'pointer' }}>Delete</button>
                            </div>
                        </div>
                    </div>
                ))}
                {issues.length === 0 && <p style={{ gridColumn: '1/-1', textAlign: 'center', color: '#888' }}>등록된 이슈가 없습니다.</p>}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, borderTop: '1px solid #eee', paddingTop: '32px' }}>
                <h3 style={{ margin: 0 }}>화보 관리 (Photo Management)</h3>
            </div>
            <GalleryMultiUploader issues={issues} />
            
            <PhotoManager issues={issues} />

            {/* New Asset/Edit Issue Modal */}
            {showIssueForm && (
                <div className="admin-modal-overlay" onClick={handleCloseModal}>
                    <div className="admin-modal" style={{ maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
                        <button className="close-x" onClick={handleCloseModal}>×</button>
                        <h3 className="modal-title">{editId ? '이슈 정보 수정' : '신규 이슈 등록'}</h3>
                        <div className="admin-form">
                            <div className="form-group">
                                <label>이슈 제목 (예: ISSUE 1)</label>
                                <input type="text" value={newIssue.title} onChange={e => setNewIssue({...newIssue, title: e.target.value})} placeholder="ISSUE 1" />
                            </div>
                            <div className="form-group">
                                <label>기획 모델 선택 (앰버서더 리스트)</label>
                                <select 
                                    value={newIssue.modelId} 
                                    onChange={e => {
                                        const selectedId = e.target.value;
                                        const model = models.find(m => m.id === selectedId);
                                        setNewIssue({
                                            ...newIssue, 
                                            modelId: selectedId,
                                            modelName: model ? model.nameKr : ''
                                        });
                                    }}
                                >
                                    <option value="">모델을 선택하세요</option>
                                    {models.map(m => (
                                        <option key={m.id} value={m.id}>{m.nameKr} ({m.nameEn})</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>매거진 커버 (4:5 추천)</label>
                                <input type="file" accept="image/*" onChange={e => setNewIssue({...newIssue, coverImg: e.target.files[0]})} />
                            </div>
                            <button 
                                className="submit-btn" 
                                onClick={handleSaveIssue}
                                disabled={isSaving}
                            >
                                {isSaving ? '저장 중...' : (editId ? '이슈 정보 수정 완료' : '이슈 등록 완료')}
                            </button>

                            {editId && (
                                <div className="issue-photos-list" style={{ marginTop: '20px' }}>
                                    <p style={{ fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '12px' }}>이슈 포함 사진 ({issuePhotos.length})</p>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                                        {issuePhotos.map((p, idx) => (
                                            <div key={p.id} style={{ position: 'relative', border: '1px solid #eee', borderRadius: '4px', overflow: 'hidden', background: '#fff' }}>
                                                <img src={p.imageUrl || p.img} alt="" style={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover' }} />
                                                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', gap: '4px', padding: '2px' }}>
                                                    <button 
                                                        onClick={(e) => { e.preventDefault(); movePhoto(idx, -1); }}
                                                        disabled={idx === 0}
                                                        style={{ background: 'none', border: 'none', color: '#fff', fontSize: '0.8rem', cursor: 'pointer', padding: '2px' }}
                                                    >←</button>
                                                    <button 
                                                        onClick={(e) => { e.preventDefault(); movePhoto(idx, 1); }}
                                                        disabled={idx === issuePhotos.length - 1}
                                                        style={{ background: 'none', border: 'none', color: '#fff', fontSize: '0.8rem', cursor: 'pointer', padding: '2px' }}
                                                    >→</button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
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
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);

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
            const snap = await getDocs(query(collection(db, 'models'), orderBy('createdAt', 'desc')));
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
                const { url } = await uploadOptimizedImage(mainImage, 'models/main');
                data.mainImage = url;
            }
            if (portfolioFiles.length > 0) {
                const urls = await Promise.all(portfolioFiles.map(f => uploadOptimizedImage(f, 'models/portfolio').then(r => r.url)));
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
        try {
            const docRef = doc(db, 'models', id);
            await deleteDoc(docRef);
            
            // Sync with IndexedDB
            try {
                const { syncCollection } = await import('../utils/syncService');
                await syncCollection('models');
            } catch (syncErr) {
                console.error('Sync error:', syncErr);
            }

            loadModels();
            setConfirmDeleteId(null);
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
                            {confirmDeleteId === m.id ? (
                                <>
                                    <button onClick={() => handleModelDelete(m.id)} className="delete" style={{ color: '#e74c3c', fontWeight: '800' }}>Confirm!</button>
                                    <button onClick={() => setConfirmDeleteId(null)} style={{ color: '#888' }}>Cancel</button>
                                </>
                            ) : (
                                <>
                                    <button onClick={() => startEdit(m)}>Edit</button>
                                    <button onClick={() => setConfirmDeleteId(m.id)} className="delete">Delete</button>
                                </>
                            )}
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
    const [outfitTag, setOutfitTag] = useState('');
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
        setOutfitName(''); setOutfitSize(''); setOutfitTag(''); setFile(null); setEditItem(null);
    };

    const handleSave = async (e) => {
        if (e) e.preventDefault();
        if (!outfitName) { alert('Please enter outfit name.'); return; }
        setSaving(true);
        try {
            if (editItem) {
                let data = { outfitName, outfitSize, tag: outfitTag };
                if (file) {
                    const { url, path } = await uploadOptimizedImage(file, 'lookbook');
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
                const { url, path } = await uploadOptimizedImage(file, 'lookbook');
                await addDoc(collection(db, 'lookbook'), {
                    outfitName, outfitSize, tag: outfitTag, img: url, storagePath: path,
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
            <h3>Lookbook Management</h3>

            <form onSubmit={handleSave} className="admin-form" style={{ background: '#fff', padding: '32px', borderRadius: '16px', border: '1px solid #f0f0f0', marginBottom: '40px' }}>
                <h4 style={{ margin: '0 0 24px', fontFamily: 'Playfair Display, serif', fontSize: '1.2rem' }}>{editItem ? '룩북 아이템 수정 (Edit Lookbook)' : '새 룩북 아이템 추가 (Add New Lookbook Item)'}</h4>
                <div className="form-grid">
                    <div className="form-group">
                        <label>의상 이름 (Outfit Name) *</label>
                        <input type="text" value={outfitName} onChange={e => setOutfitName(e.target.value)} placeholder="예: 시그니처 화이트 바디수트" required />
                    </div>
                    <div className="form-group">
                        <label>사이즈 (Size)</label>
                        <input type="text" value={outfitSize} onChange={e => setOutfitSize(e.target.value)} placeholder="예: S / M / FREE" />
                    </div>
                </div>
                <div className="form-group" style={{ marginTop: '8px' }}>
                    <label>해시태그 (Hashtag) - 상의, 하의 등</label>
                    <input type="text" value={outfitTag} onChange={e => setOutfitTag(e.target.value)} placeholder="예: 상의, 하의, 바디수트" />
                </div>
                <div className="form-group" style={{ marginTop: '8px' }}>
                    <label>이미지 (Image) {editItem ? '(수정 시에만 사진을 다시 선택하세요)' : '*'}</label>
                    {editItem && (
                        <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ position: 'relative' }}>
                                <img src={editItem.img} alt="Current" style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 8, border: '1px solid #eee' }} />
                                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.5)', color: '#fff', fontSize: '10px', textAlign: 'center', padding: '2px 0', borderBottomLeftRadius: 8, borderBottomRightRadius: 8 }}>현재 이미지</div>
                            </div>
                            <div style={{ fontSize: '0.85rem', color: '#666' }}>
                                <p style={{ margin: '0 0 4px' }}>다른 사진으로 변경하시려면</p>
                                <p style={{ margin: 0, fontWeight: 'bold', color: 'var(--color-primary, #e1306c)' }}>[파일 선택] 버튼을 눌러주세요.</p>
                            </div>
                        </div>
                    )}
                    <input type="file" accept="image/*" onChange={e => setFile(e.target.files[0])} style={{ padding: '10px 0' }} />
                </div>
                <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                    <button type="submit" className="submit-btn" style={{ width: 'auto', paddingLeft: '40px', paddingRight: '40px' }} disabled={saving}>
                        {saving ? '저장 중...' : editItem ? '룩북 정보 업데이트' : '새 룩북 등록'}
                    </button>
                    {editItem && <button type="button" className="secondary-btn" style={{ width: 'auto', marginTop: 0 }} onClick={resetForm}>취소</button>}
                </div>
            </form>

            <div className="admin-item-list">
                {items.map(item => (
                    <div key={item.id} className="admin-item-card">
                        <img src={item.img} alt={item.outfitName} className="admin-item-thumb" />
                        <div className="admin-item-info">
                            <h4>{item.outfitName}</h4>
                            <p style={{ margin: '0 0 4px', fontSize: '0.85rem', color: '#666' }}>Size: {item.outfitSize || 'FREE'}</p>
                            <p style={{ margin: '0 0 12px', fontSize: '0.85rem', color: '#3a7bd5', fontWeight: '500' }}>{item.tag ? `#${item.tag}` : '태그 없음'}</p>
                            <div className="admin-item-actions">
                                <button onClick={() => {
                                    setEditItem(item); setOutfitName(item.outfitName); setOutfitSize(item.outfitSize || ''); setOutfitTag(item.tag || '');
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
                const { url } = await uploadOptimizedImage(f, 'events');
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
    const [editingSlide, setEditingSlide] = useState(null);
    const [tTitle, setTTitle] = useState('');
    const [tSubtitle, setTSubtitle] = useState('');
    const [tTitleEn, setTTitleEn] = useState(''); const [tSubtitleEn, setTSubtitleEn] = useState('');
    const [tTitleJa, setTTitleJa] = useState(''); const [tSubtitleJa, setTSubtitleJa] = useState('');
    const [tTitleZh, setTTitleZh] = useState(''); const [tSubtitleZh, setTSubtitleZh] = useState('');
    const [translating, setTranslating] = useState(false);
    const [updating, setUpdating] = useState(false);

    const dragItem = useRef(null);
    const dragOverItem = useRef(null);

    useEffect(() => { loadSlides(); }, []);

    const loadSlides = async () => {
        try {
            const snap = await getDocs(query(collection(db, 'hero_slides'), orderBy('order', 'asc')));
            setSlides(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch (err) { console.error(err); }
    };

    const handleEditSlide = (slide) => {
        setEditingSlide(slide);
        setTTitle(slide.title || '');
        setTTitleEn(slide.titleEn || '');
        setTTitleJa(slide.titleJa || '');
        setTTitleZh(slide.titleZh || '');
    };

    const autoTranslateSlide = async () => {
        if (!tTitle) { alert('Please enter Korean source first.'); return; }
        setTranslating(true);
        const translate = async (text, target) => {
            if (!text) return '';
            try {
                const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=ko|${target}`);
                const data = await res.json();
                return data.responseData?.translatedText || text;
            } catch { return text; }
        };
        const [te, tj, tz] = await Promise.all([
            translate(tTitle, 'en'),
            translate(tTitle, 'ja'),
            translate(tTitle, 'zh-CN'),
        ]);
        setTTitleEn(te); setTTitleJa(tj); setTTitleZh(tz);
        setTranslating(false);
    };

    const handleUpdateSlideText = async () => {
        if (!editingSlide) return;
        setUpdating(true);
        try {
            const data = {
                title: tTitle,
                titleEn: tTitleEn,
                titleJa: tTitleJa,
                titleZh: tTitleZh,
                updatedAt: serverTimestamp()
            };
            await updateDoc(doc(db, 'hero_slides', editingSlide.id), data);
            
            const { syncCollection } = await import('../utils/syncService');
            await syncCollection(STORES.HERO_SLIDES);
            
            setEditingSlide(null);
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
            loadSlides();
        } catch (err) { alert(err.message); }
        setUpdating(false);
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
            const { url, path } = await uploadOptimizedImage(file, 'hero');
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
        if (!window.confirm('Delete slide?')) return;
        try {
            // Optimistic UI update
            setSlides(prev => prev.filter(s => s.id !== slide.id));
            
            await deleteDoc(doc(db, 'hero_slides', slide.id));
            if (slide.storagePath) { try { await deleteObject(ref(storage, slide.storagePath)); } catch {} }
            
            // Sync with IndexedDB
            try {
                const { syncCollection } = await import('../utils/syncService');
                await syncCollection(STORES.HERO_SLIDES);
            } catch (syncErr) {
                console.error('Sync error:', syncErr);
            }
        } catch (err) { 
            alert('Delete failed: ' + err.message); 
            loadSlides(); // Revert on failure
        }
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
                            <button onClick={() => handleEditSlide(slide)} style={{ background: 'rgba(255, 255, 255, 0.9)', color: '#333', border: 'none', borderRadius: '4px', padding: '4px 8px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>T EDIT</button>
                            <button onClick={() => handleDelete(slide)} style={{ background: 'rgba(231, 76, 60, 0.9)', color: '#fff', border: 'none', borderRadius: '50%', width: 26, height: 26, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                        </div>
                        <div style={{ position: 'absolute', bottom: 12, left: 12, right: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                            <span style={{ background: '#fff', padding: '4px 10px', borderRadius: 20, fontSize: '0.8rem', fontWeight: 700 }}>#{idx + 1}</span>
                            {slide.title && <span style={{ background: 'rgba(0,0,0,0.6)', color: '#fff', padding: '4px 8px', borderRadius: 4, fontSize: '0.7rem', maxWidth: '70%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{slide.title}</span>}
                        </div>
                    </div>
                ))}
            </div>

            {/* Slide Text Edit Modal */}
            {editingSlide && (
                <div className="al-modal-overlay" style={{ zIndex: 2000 }}>
                    <div className="al-modal" style={{ maxWidth: '800px' }}>
                        <div className="al-modal-content" style={{ padding: '32px' }}>
                            <h3 style={{ marginBottom: 24 }}>Edit Slide Text (#{slides.findIndex(s => s.id === editingSlide.id) + 1})</h3>
                            
                            <div className="form-grid">
                                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                    <label>Title (KO)</label>
                                    <input type="text" value={tTitle} onChange={e => setTTitle(e.target.value)} placeholder="Main text on slide" />
                                </div>
                            </div>

                            <button type="button" className="secondary-btn" onClick={autoTranslateSlide} disabled={translating} style={{ margin: '16px 0 24px' }}>
                                {translating ? 'Translating...' : '✨ Auto-translate to Multi-languages'}
                            </button>

                            <div className="admin-grid-two" style={{ marginBottom: 24, padding: 20, background: '#f9f9f9', borderRadius: 12 }}>
                                <div>
                                    <label style={{ fontSize: '0.8rem', color: '#666' }}>English</label>
                                    <input value={tTitleEn} onChange={e => setTTitleEn(e.target.value)} placeholder="Title EN" />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.8rem', color: '#666' }}>Japanese</label>
                                    <input value={tTitleJa} onChange={e => setTTitleJa(e.target.value)} placeholder="Title JA" />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.8rem', color: '#666' }}>Chinese</label>
                                    <input value={tTitleZh} onChange={e => setTTitleZh(e.target.value)} placeholder="Title ZH" />
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                                <button className="submit-btn" onClick={handleUpdateSlideText} disabled={updating} style={{ width: 'auto', padding: '12px 32px' }}>
                                    {updating ? 'Saving...' : 'Save Meta Data'}
                                </button>
                                <button className="secondary-btn" onClick={() => setEditingSlide(null)} style={{ width: 'auto' }}>Cancel</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
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
        const { url } = await uploadOptimizedImage(file, 'partners');
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
        const { url } = await uploadOptimizedImage(file, 'trainers');
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

const ArtistTab = () => {
    return (
        <div className="upload-section">
            <h3 style={{ margin: '0 0 32px' }}>Artist Section Management</h3>
            <DirectorPhotoUploader />
        </div>
    );
};

// ===== 8. Studios Tab =====
const StudiosTab = () => {
    const [studios, setStudios] = useState([]);
    const [filterTab, setFilterTab] = useState('fitgirls');
    const [showForm, setShowForm] = useState(false);
    const [editId, setEditId] = useState(null);
    const [form, setForm] = useState({
        title: '', category: 'fitgirls', description: '', image: '', img: '', hashtag: ''
    });
    const [saving, setSaving] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [allHashtags, setAllHashtags] = useState([]);
    const [hashtagQuery, setHashtagQuery] = useState('');

    useEffect(() => { 
        loadStudios(); 
        loadAllHashtags();
    }, []);

    const loadAllHashtags = async () => {
        try {
            const snap = await getDocs(collection(db, 'gallery'));
            const tagSet = new Set();
            snap.docs.forEach(d => {
                const tags = d.data().tags || [];
                tags.forEach(t => tagSet.add(t));
            });
            setAllHashtags(Array.from(tagSet));
        } catch (err) { console.error('Error loading hashtags:', err); }
    };

    const loadStudios = async () => {
        try {
            const snap = await getDocs(query(collection(db, 'studios'), orderBy('createdAt', 'desc')));
            setStudios(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch (err) { console.error(err); }
    };

    const resetForm = () => {
        setForm({ title: '', category: 'fitgirls', description: '', image: '', img: '', hashtag: '' });
        setEditId(null); setShowForm(false); setUploadingImage(false);
    };

    const handleSave = async () => {
        if (!form.title) { alert('Title is required.'); return; }
        setSaving(true);
        try {
            const data = { ...form, updatedAt: serverTimestamp(), ...(editId ? {} : { createdAt: serverTimestamp() }) };
            if (editId) { await updateDoc(doc(db, 'studios', editId), data); }
            else { await addDoc(collection(db, 'studios'), data); }
            const { syncCollection } = await import('../utils/syncService');
            await syncCollection('studios');
            setShowSuccess(true); setTimeout(() => setShowSuccess(false), 3000);
            resetForm(); loadStudios();
        } catch (err) { alert('Save error: ' + err.message); }
        setSaving(false);
    };

    const handleDeleteStudio = async (id) => {
        if (!window.confirm('Are you sure you want to delete this studio zone?')) return;
        try {
            await deleteDoc(doc(db, 'studios', id));
            const { syncCollection } = await import('../utils/syncService');
            await syncCollection('studios');
            loadStudios();
        } catch (err) { alert(err.message); }
    };

    const startEdit = (s) => { setForm({ ...s }); setEditId(s.id); setShowForm(true); };

    const handlePhoto = async (file) => {
        if (!file) return;
        setUploadingImage(true);
        try {
            const { url } = await uploadOptimizedImage(file, 'studios');
            setForm(prev => ({ ...prev, image: url }));
        } catch (err) {
            alert('Image upload failed: ' + err.message);
        } finally {
            setUploadingImage(false);
        }
    };

    return (
        <div className="upload-section">
            {showSuccess && <Toast message="Saved successfully!" onClose={() => setShowSuccess(false)} />}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                <h3 style={{ margin: 0 }}>Studio Zones</h3>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="add-btn" onClick={() => { resetForm(); setShowForm(true); }}>+ Add Studio Zone</button>
                </div>
            </div>

            {showForm && (
                <div className="admin-modal-overlay" onClick={() => resetForm()}>
                    <div className="admin-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
                        <button className="close-x" onClick={resetForm}>×</button>
                        <h3>{editId ? 'Edit Studio Zone' : 'Add New Studio Zone'}</h3>
                        <div className="admin-modal-form">
                            <div className="form-group"><label>Title *</label><input type="text" value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="ex) Black Moon" /></div>
                            <div className="form-group">
                                <label>Category</label>
                                <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="admin-select">
                                    <option value="fitgirls">FITGIRLS & INAFIT (핏걸즈 & INAFIT)</option>
                                    <option value="mooz">MOOZ SELF Studio (무즈 셀프스튜디오)</option>
                                </select>
                            </div>
                            <div className="form-group"><label>Description (Optional)</label><textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={3} /></div>
                            <div className="form-group" style={{ position: 'relative' }}>
                                <label>Gallery Hashtag (Optional)</label>
                                <input 
                                    type="text" 
                                    value={form.hashtag} 
                                    onChange={e => setForm({...form, hashtag: e.target.value})} 
                                    placeholder="ex) #이너핏 (이 해시태그가 있는 갤러리로 연결됨)" 
                                />
                                {form.hashtag && (
                                    <div className="admin-tag-autocomplete" style={{
                                        position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
                                        background: '#fff', border: '1px solid #ddd', borderRadius: '4px',
                                        maxHeight: '150px', overflowY: 'auto', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                    }}>
                                        {allHashtags
                                            .filter(tag => tag.toLowerCase().includes(form.hashtag.toLowerCase()) && tag !== form.hashtag)
                                            .slice(0, 10)
                                            .map((tag, idx) => (
                                                <div 
                                                    key={idx} 
                                                    onClick={() => setForm({...form, hashtag: tag})}
                                                    style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #eee', fontSize: '0.85rem', color: '#111' }}
                                                    onMouseOver={e => e.target.style.background = '#f5f5f5'}
                                                    onMouseOut={e => e.target.style.background = 'transparent'}
                                                >
                                                    {tag}
                                                </div>
                                            ))
                                        }
                                    </div>
                                )}
                            </div>
                            <div className="form-group">
                                <label>Background Photo</label>
                                <input type="file" onChange={e => handlePhoto(e.target.files[0])} disabled={uploadingImage} />
                                {uploadingImage && <p style={{ color: '#007BFF', fontSize: '0.85rem', marginTop: 8 }}>Uploading photo... Please wait.</p>}
                                {(form.image || form.img) && !uploadingImage && (
                                    <div style={{ position: 'relative', marginTop: 12, width: 'fit-content' }}>
                                        <img src={form.image || form.img} alt="" style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 8 }} />
                                        <button onClick={() => setForm({...form, image: '', img: ''})} className="remove-thumb-btn">×</button>
                                    </div>
                                )}
                            </div>
                            <div style={{ marginTop: 32, paddingTop: 24, borderTop: '1px solid #eee' }}>
                                <button className="submit-btn" onClick={handleSave} disabled={saving || uploadingImage}>
                                    {saving ? 'Saving...' : uploadingImage ? 'Uploading Image...' : 'Save Studio Zone'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="admin-tabs" style={{ marginBottom: '24px' }}>
                <button
                    className={`admin-tab-btn ${filterTab === 'fitgirls' ? 'active' : ''}`}
                    onClick={() => setFilterTab('fitgirls')}
                >
                    FITGIRLS &amp; INAFIT
                </button>
                <button
                    className={`admin-tab-btn ${filterTab === 'mooz' ? 'active' : ''}`}
                    onClick={() => setFilterTab('mooz')}
                >
                    MOOZ SELF Studio
                </button>
            </div>

            <div className="admin-item-list">
                {studios.filter(s => s.category === filterTab).map(s => (
                    <div key={s.id} className="admin-item-card">
                        {(s.image || s.img) && <img src={s.image || s.img} alt="" className="admin-item-thumb" />}
                        <div className="admin-item-info">
                            <strong>{s.title}</strong>
                            <span className="admin-item-badge">{s.category === 'fitgirls' ? 'FITGIRLS & INAFIT' : 'MOOZ SELF'}</span>
                            {s.hashtag && <span style={{ fontSize: '0.75rem', color: '#3a7bd5', fontWeight: 'bold' }}>{s.hashtag}</span>}
                        </div>
                        <div className="admin-item-actions">
                            <button onClick={() => startEdit(s)}>Edit</button>
                            <button onClick={() => handleDeleteStudio(s.id)} className="delete">Delete</button>
                        </div>
                    </div>
                ))}
                {studios.filter(s => s.category === filterTab).length === 0 && <p style={{ padding: 40, textAlign: 'center', color: '#888' }}>해당 카테고리에 등록된 스튜디오가 없습니다.</p>}
            </div>
        </div>
    );
};

export default Admin;
