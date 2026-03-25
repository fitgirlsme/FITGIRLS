import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { ref, deleteObject, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db as fireDb, storage } from '../../utils/firebase';
import FadeInSection from '../FadeInSection';
import { getGalleryItems, addGalleryItem, deleteGalleryItem, updateGalleryItem } from '../../utils/db';
import { getGalleries } from '../../utils/galleryService';
import GalleryMultiUploader from '../GalleryMultiUploader';
import './Gallery.css';

const MAIN_CATEGORIES = [
    { id: 'fitorialist', labelKey: 'gallery.main.fitorialist' },
    { id: 'artist', labelKey: 'gallery.main.artist' },
    { id: 'fashion', labelKey: 'gallery.main.fashion' },
    { id: 'portrait', labelKey: 'gallery.main.portrait' },
];

const SUB_CATEGORIES = [
    { id: 'women', labelKey: 'gallery.women' },
    { id: 'men', labelKey: 'gallery.men' },
    { id: 'couple', labelKey: 'gallery.couple' },
    { id: 'outdoor', labelKey: 'gallery.outdoor' },
];

const GallerySection = () => {
    const { t } = useTranslation();
    const [searchParams] = useSearchParams();

    const [mainCategory, setMainCategory] = useState('fitorialist');
    const [subCategory, setSubCategory] = useState('women');
    const [activeTag, setActiveTag] = useState('ALL');
    const [viewMode, setViewMode] = useState('main'); // 'main' or 'detail'
    const [lightboxIndex, setLightboxIndex] = useState(null);
    const [allItems, setAllItems] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isAdmin, setIsAdmin] = useState(localStorage.getItem('isAdmin') === 'true');
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [editTarget, setEditTarget] = useState(null);
    const [editTags, setEditTags] = useState('');
    const [editMainCat, setEditMainCat] = useState('fitorialist');
    const [editType, setEditType] = useState('women');
    const [editFile, setEditFile] = useState(null);
    const [editPreview, setEditPreview] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [savedTags, setSavedTags] = useState(() => {
        const saved = localStorage.getItem('adminHashtags');
        return saved ? JSON.parse(saved) : ['#바디프로필', '#이너핏'];
    });
    const [allTagsCloud, setAllTagsCloud] = useState([]);
    const [visibleCount, setVisibleCount] = useState(30);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [isGalleryVisible, setIsGalleryVisible] = useState(false);
    const [showSwipeGuide, setShowSwipeGuide] = useState(false);
    const touchStart = useRef(null);
    const galleryRef = useRef(null);
    const loadMoreSentinelRef = useRef(null);
    const itemRefs = useRef([]);
    const [showScrollTop, setShowScrollTop] = useState(false);

    // URL query param으로 카테고리 자동 선택
    useEffect(() => {
        const mainParam = searchParams.get('main');
        if (mainParam && MAIN_CATEGORIES.some(c => c.id === mainParam)) {
            setMainCategory(mainParam);
            setViewMode('detail');
            setSubCategory('women');
            setActiveTag('ALL');
        } else if (!mainParam) {
            // ALL 버튼 클릭 시 (/gallery, main 파라미터 없음) → 첫 페이지로 복귀
            setViewMode('main');
        }
    }, [searchParams]);

    // 모바일 스와이프 안내 표시 (라이트박스 열 때 처음 1회성 브리핑)
    useEffect(() => {
        if (lightboxIndex !== null && window.innerWidth < 1024) {
            setShowSwipeGuide(true);
            const timer = setTimeout(() => setShowSwipeGuide(false), 2400);
            return () => clearTimeout(timer);
        }
    }, [lightboxIndex]);

    // Lock body scroll and hide SupportCS when any modal is open or in detail view
    useEffect(() => {
        const isAnyModalOpen = lightboxIndex !== null || editTarget !== null || deleteTarget !== null;
        const shouldHideCS = isAnyModalOpen || viewMode === 'detail';
        
        if (isAnyModalOpen) {
            document.body.style.overflow = 'hidden';
            if (lightboxIndex !== null) {
                document.body.classList.add('lightbox-active');
            }
        } else {
            document.body.style.overflow = 'auto';
            document.body.classList.remove('lightbox-active');
        }

        if (shouldHideCS) {
            document.body.classList.add('hide-support-cs');
        } else {
            document.body.classList.remove('hide-support-cs');
        }
        
        // Direct manipulation as a fallback
        const csBtn = document.querySelector('.cs-container');
        if (csBtn) {
            csBtn.style.display = shouldHideCS ? 'none' : 'block';
        }

        return () => { 
            document.body.classList.remove('hide-support-cs'); 
            document.body.classList.remove('lightbox-active');
            if (csBtn) csBtn.style.display = 'block';
        };
    }, [lightboxIndex, editTarget, deleteTarget, viewMode]);

    // Firebase + IndexedDB에서 갤러리 데이터 로드
    useEffect(() => {
        const loadItems = async () => {
            try {
                const firebaseItems = await getGalleries();
                const mapped = firebaseItems.map(item => {
                    let ts = item.order || 0;
                    if (item.createdAt) {
                        if (item.createdAt.toMillis) ts = item.createdAt.toMillis();
                        else if (item.createdAt.seconds) ts = item.createdAt.seconds * 1000;
                        else if (typeof item.createdAt === 'number') ts = item.createdAt;
                        else if (typeof item.createdAt === 'string') ts = new Date(item.createdAt).getTime();
                    }
                    return {
                        id: item.id,
                        mainCategory: (item.mainCategory || 'fitorialist').toLowerCase(),
                        type: (item.type || 'women').toLowerCase(),
                        tags: item.tags || [],
                        img: item.imageUrl || item.img || item.url || '',
                        storagePath: item.storagePath || '',
                        name: item.name || '',
                        seoTags: item.seoTags || '',
                        createdAt: ts || 0,
                    };
                });

                setAllItems(mapped);
            } catch (err) {
                console.warn('Gallery load failed, falling back to IndexedDB:', err);
                try {
                    const items = await getGalleryItems();
                    setAllItems(items.map(item => ({
                        ...item,
                        mainCategory: item.mainCategory || item.type || 'fitorialist',
                        type: item.type || 'women',
                    })));
                } catch (err2) {
                    console.warn('IndexedDB load also failed:', err2);
                }
            }
        };
        loadItems();
    }, []);

    // allItems 로드 후 태그 클라우드 구축
    useEffect(() => {
        const tagSet = new Set();
        allItems.forEach(item => {
            if (item.tags) item.tags.forEach(tag => tagSet.add(tag));
        });
        setAllTagsCloud(Array.from(tagSet));
    }, [allItems]);

    // 자동완성 태그 풀 (localStorage 저장 태그 + Firebase 태그 병합)
    const mergedTagPool = Array.from(new Set([...savedTags, ...allTagsCloud]));

    // 현재 입력 중인 마지막 토큰 기준 자동완성 후보
    const editTokens = editTags.split(/,\s*|\s+/);
    const currentToken = editTokens[editTokens.length - 1];
    const currentTokenNorm = currentToken.trim().toLowerCase();
    const tagSuggestions = (currentTokenNorm && currentTokenNorm !== '#')
        ? mergedTagPool.filter(tag => {
            const tagNorm = tag.replace('#', '').toLowerCase();
            const inputNorm = currentTokenNorm.replace('#', '').toLowerCase();
            return tagNorm.includes(inputNorm) && tag !== currentToken.trim();
        }).slice(0, 10)
        : [];

    // 자동완성 선택 핸들러
    const handleTagSuggestionClick = (suggestion) => {
        const tokens = [...editTokens];
        tokens[tokens.length - 1] = suggestion;
        let result = tokens.join(', ');
        if (!result.endsWith(', ')) result += ', ';
        setEditTags(result);
    };

    // 갤러리 영역이 화면에 보이는지 추적 (FAB 표시 용도)
    useEffect(() => {
        const el = galleryRef.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            ([entry]) => setIsGalleryVisible(entry.isIntersecting),
            { threshold: 0.1 }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, [viewMode]);

    // 필터 변경 시 표시 개수 리셋
    useEffect(() => {
        setVisibleCount(30);
    }, [mainCategory, subCategory, activeTag, searchQuery]);

    // 현재 mainCategory에 실제 존재하는 subCategory만 필터
    const availableSubCategories = new Set(
        allItems
            .filter(item => item.mainCategory === mainCategory || (!item.mainCategory && mainCategory === 'fitorialist'))
            .map(item => item.type)
            .filter(Boolean)
    );
    const visibleSubCategories = SUB_CATEGORIES.filter(sc => availableSubCategories.has(sc.id));

    // mainCategory + subCategory로 필터된 아이템
    const categoryFiltered = allItems.filter(item => {
        const matchMain = item.mainCategory === mainCategory || (!item.mainCategory && mainCategory === 'fitorialist');
        const matchSub = item.type === subCategory;
        return matchMain && matchSub;
    });

    // 현재 카테고리+서브카테고리에 있는 태그 추출
    const availableTags = new Set(
        categoryFiltered
            .flatMap(item => item.tags || [])
            .map(tag => tag.replace('#', '').toUpperCase())
            .filter(Boolean)
    );
    const dynamicTags = availableTags.size > 0 ? ['ALL', ...availableTags] : ['ALL'];

    // 최종 필터링 (검색 or 태그)
    const filteredGallery = allItems.filter(item => {
        if (searchQuery.trim() !== '') {
            const q = searchQuery.replace('#', '').toLowerCase().trim();
            return item.tags && item.tags.some(tag => tag.replace('#', '').toLowerCase().includes(q));
        }
        const matchMain = item.mainCategory === mainCategory || (!item.mainCategory && mainCategory === 'fitorialist');
        const matchSub = item.type === subCategory;
        const matchTag = activeTag === 'ALL' || (item.tags && item.tags.some(tag =>
            tag.replace('#', '').toUpperCase() === activeTag.toUpperCase()
        ));
        return matchMain && matchSub && matchTag;
    }).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    // JS Masonry chunking (가로(좌->우) 정렬을 위한 라운드로빈 분배)
    const [cols, setCols] = useState(2);
    useEffect(() => {
        const updateCols = () => {
            const w = window.innerWidth;
            if (w >= 2560) setCols(8);
            else if (w >= 1920) setCols(6);
            else if (w >= 1440) setCols(5);
            else if (w >= 1024) setCols(4);
            else if (w >= 768) setCols(3);
            else setCols(2);
        };
        updateCols();
        window.addEventListener('resize', updateCols);
        return () => window.removeEventListener('resize', updateCols);
    }, []);

    // 페이지네이션: 보이는 항목만 슬라이스
    const displayLimit = (visibleCount < filteredGallery.length) 
        ? Math.max(cols, Math.floor(visibleCount / cols) * cols) 
        : visibleCount;
        
    const visibleItems = filteredGallery.slice(0, displayLimit);
    const hasMore = displayLimit < filteredGallery.length;

    // Infinite Scroll: IntersectionObserver로 하단 센티넬 감지 → 자동 로드
    useEffect(() => {
        const sentinel = loadMoreSentinelRef.current;
        if (!sentinel) return;
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && hasMore && !isLoadingMore) {
                    setIsLoadingMore(true);
                    setTimeout(() => {
                        setVisibleCount(prev => prev + 24);
                        setIsLoadingMore(false);
                    }, 300);
                }
            },
            { threshold: 0.1 }
        );
        observer.observe(sentinel);
        return () => observer.disconnect();
    }, [hasMore, isLoadingMore, viewMode, mainCategory, subCategory, activeTag, searchQuery]);

    // Staggered Entrance: 각 갤러리 아이템에 fade-in + slide-up 효과
    useEffect(() => {
        const observers = [];
        itemRefs.current.forEach((el) => {
            if (!el) return;
            const obs = new IntersectionObserver(
                ([entry]) => {
                    if (entry.isIntersecting) {
                        el.classList.add('gallery-item-visible');
                        obs.unobserve(el);
                    }
                },
                { threshold: 0.05, rootMargin: '0px 0px -30px 0px' }
            );
            obs.observe(el);
            observers.push(obs);
        });
        return () => observers.forEach(o => o.disconnect());
    }, [visibleItems]);

    // Scroll-to-top button visibility
    useEffect(() => {
        if (viewMode !== 'detail') { setShowScrollTop(false); return; }
        const container = document.getElementById('gallery');
        if (!container) return;
        const handleScroll = () => {
            setShowScrollTop(container.scrollTop > 600);
        };
        container.addEventListener('scroll', handleScroll, { passive: true });
        return () => container.removeEventListener('scroll', handleScroll);
    }, [viewMode]);

    const scrollToTop = () => {
        const container = document.getElementById('gallery');
        if (container) container.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleTouchStart = (e) => { touchStart.current = e.touches[0].clientX; };
    const handleTouchEnd = (e) => {
        if (!touchStart.current) return;
        const touchEnd = e.changedTouches[0].clientX;
        const diff = touchStart.current - touchEnd;
        if (Math.abs(diff) > 50) { 
            // 스와이프 발생 시 클릭 이벤트로 간주되지 않도록 방지 가능 (필요시)
            if (diff > 0) showNext(e);
            else showPrev(e);
            touchStart.current = null;
            // 스와이프 동작 시 브라우저 기본 동작이나 후속 클릭 방지
            if (e.cancelable) e.preventDefault();
        }
        touchStart.current = null;
    };


    const openLightbox = (index) => setLightboxIndex(index);
    const closeLightbox = () => setLightboxIndex(null);
    const showPrev = (e) => { e.stopPropagation(); setLightboxIndex(prev => prev > 0 ? prev - 1 : filteredGallery.length - 1); };
    const showNext = (e) => { e.stopPropagation(); setLightboxIndex(prev => prev < filteredGallery.length - 1 ? prev + 1 : 0); };

    return (
        <div className="gallery-full-container" ref={galleryRef}>
            <div className="gallery-title-header-wrap">
                <FadeInSection className="section-header">
                    <h2 className="section-title">STUDIOS</h2>
                </FadeInSection>
            </div>

            {viewMode === 'main' ? (
                /* ===== MAIN VIEW: 2x2 Category Selection Grid ===== */
                <div className="main-selection-grid">
                    {MAIN_CATEGORIES.map(cat => {
                        // Find the newest item for this category to use as representative image
                        const repItem = allItems
                            .filter(i => i.mainCategory === cat.id || (!i.mainCategory && cat.id === 'fitorialist'))
                            .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))[0];

                        return (
                            <div
                                key={cat.id}
                                className="main-selection-card"
                                onClick={() => {
                                    setMainCategory(cat.id);
                                    setViewMode('detail');
                                    setSubCategory('women');
                                    setActiveTag('ALL');
                                    const el = document.getElementById('gallery');
                                    if (el) el.scrollTop = 0;
                                }}
                            >
                                <div 
                                    className="card-image-bg" 
                                    style={{ backgroundImage: repItem ? `url(${repItem.img})` : 'none' }}
                                >
                                    <div className="card-overlay"></div>
                                </div>
                                <div className="card-inner">
                                    <div className="card-info">
                                        <span className="card-label">{t(cat.labelKey)}</span>
                                        <span className="card-count">
                                            {allItems.filter(i => i.mainCategory === cat.id || (!i.mainCategory && cat.id === 'fitorialist')).length} photos
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                /* ===== DETAIL VIEW: 갤러리 그리드 ===== */
                <>
                    <div className="gallery-header-wrapper">
                        {/* 검색 바 (전체 너비) */}
                        <div className="gallery-search-bar-container">
                            <div className="gallery-search-bar">
                                <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 20, height: 20 }}>
                                    <circle cx="11" cy="11" r="8" />
                                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                                </svg>
                                <input
                                    type="text"
                                    className="gallery-search-input"
                                    placeholder="검색"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* 현재 카테고리 표시 (좌측) + BACK 버튼 (우측) */}
                        <div className="gallery-detail-header">
                            <h3 className="gallery-current-category">
                                {t(MAIN_CATEGORIES.find(c => c.id === mainCategory)?.labelKey)}
                            </h3>
                            <button className="back-to-main-btn" onClick={() => setViewMode('main')}>
                                <span className="back-btn-text">LIST</span>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M9 18l6-6-6-6" />
                                </svg>
                            </button>
                        </div>

                        {/* Sub-category tabs (women/men/couple/outdoor) */}
                        {!searchQuery && (
                            <div className="tier1-tabs sub-category-tabs">
                                {visibleSubCategories.map(sc => {
                                    const hasNew = allItems.some(item => {
                                        const age = item.createdAt || 0;
                                        const isRecent = Date.now() - age < 48 * 60 * 60 * 1000;
                                        const matchMain = item.mainCategory === mainCategory || (!item.mainCategory && mainCategory === 'fitorialist');
                                        return isRecent && matchMain && item.type === sc.id;
                                    });
                                    return (
                                        <button
                                            key={sc.id}
                                            className={`tier1-tab ${subCategory === sc.id ? 'active' : ''} ${hasNew ? 'has-new' : ''}`}
                                            onClick={() => { setSubCategory(sc.id); setActiveTag('ALL'); }}
                                        >
                                            {t(sc.labelKey)}
                                            {hasNew && <span className="tab-new-badge">NEW</span>}
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {/* 태그 원형 썸네일 필터 */}
                        {!searchQuery && dynamicTags.length > 1 && (
                            <div className="tag-circles-scroll">
                                {/* ALL 버튼 */}
                                <div
                                    className={`tag-circle-item ${activeTag === 'ALL' ? 'active' : ''}`}
                                    onClick={() => setActiveTag('ALL')}
                                    style={{ position: 'relative' }}
                                >
                                    <div className="tag-circle-img-wrap tag-circle-all">
                                        <span>ALL</span>
                                    </div>
                                    {categoryFiltered.some(item => (Date.now() - (item.createdAt || 0)) < 48 * 60 * 60 * 1000) && (
                                        <span className="tag-new-dot" />
                                    )}
                                    <span className="tag-circle-label">{t('gallery.hashtags.ALL', '전체')}</span>
                                </div>
                                {dynamicTags.filter(tag => tag !== 'ALL').map((tag, idx) => {
                                    const displayTag = tag;
                                    const repItems = categoryFiltered
                                        .filter(item => item.tags && item.tags.some(t => t.replace('#', '').toUpperCase() === tag.toUpperCase()));
                                    const repItem = [...repItems].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))[0];
                                    
                                    const tagHasNew = repItems.some(item => {
                                        const age = item.createdAt || 0;
                                        return Date.now() - age < 48 * 60 * 60 * 1000;
                                    });

                                    return (
                                        <div
                                            key={idx}
                                            className={`tag-circle-item ${activeTag === tag ? 'active' : ''}`}
                                            onClick={() => setActiveTag(activeTag === tag ? 'ALL' : tag)}
                                            style={{ position: 'relative' }}
                                        >
                                            <div className="tag-circle-img-wrap">
                                                {repItem ? (
                                                    <img src={repItem.img} alt={displayTag} loading="lazy" />
                                                ) : (
                                                    <div className="tag-circle-placeholder" />
                                                )}
                                            </div>
                                            {tagHasNew && <span className="tag-new-dot" />}
                                            <span className="tag-circle-label">{displayTag}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Gallery Grid */}
                    <div className="gallery-masonry-wrapper">
                        <div 
                            className="gallery-masonry-grid" 
                            style={{ 
                                display: 'grid',
                                '--cols': cols
                            }}
                        >
                            {visibleItems.map((item, originalIndex) => (
                                <div
                                    key={item.id}
                                    ref={el => itemRefs.current[originalIndex] = el}
                                    className="masonry-item gallery-item-enter"
                                    style={{ transitionDelay: `${(originalIndex % cols) * 0.08}s` }}
                                    onClick={() => openLightbox(originalIndex)}
                                >
                                    <img src={item.img} alt={item.seoTags || 'Gallery'} loading="lazy" />
                                    <div className="masonry-hover-overlay">
                                        <span className="masonry-plus">+</span>
                                        {item.tags && item.tags.length > 0 && (
                                            <div className="masonry-tags">
                                                {item.tags.map((tag, ti) => (
                                                    <span key={ti} className="masonry-tag-chip">
                                                        {tag.startsWith('#') ? tag : `#${tag}`}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    {/* 관리자 도구 */}
                                    {isAdmin && !String(item.id).startsWith('m') && (
                                        <div className="masonry-admin-tools">
                                            <button
                                                className="masonry-edit-btn"
                                                title="정보 수정"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setEditTarget(item);
                                                    setEditTags((item.tags || []).join(', '));
                                                    setEditMainCat(item.mainCategory || 'fitorialist');
                                                    setEditType(item.type || 'women');
                                                    setEditFile(null);
                                                    setEditPreview(null);
                                                }}
                                            >
                                                EDIT
                                            </button>
                                            <button
                                                className="masonry-delete-btn"
                                                title="사진 삭제"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setDeleteTarget(item);
                                                }}
                                            >
                                                DEL
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Infinite Scroll Sentinel */}
                        {hasMore && (
                            <div ref={loadMoreSentinelRef} className="gallery-scroll-sentinel">
                                {isLoadingMore && (
                                    <div className="gallery-loading-indicator">
                                        <div className="gallery-loading-dots">
                                            <span></span><span></span><span></span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {filteredGallery.length === 0 && (
                            <div className="gallery-empty-state">
                                <p>해당 카테고리에 사진이 없습니다.</p>
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* Scroll to Top Button */}
            {viewMode === 'detail' && showScrollTop && (
                <button className="gallery-scroll-top-btn" onClick={scrollToTop} aria-label="Scroll to top">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 20V4" />
                        <path d="M5 11l7-7 7 7" />
                    </svg>
                </button>
            )}

            {/* 삭제 확인 모달 */}
            {deleteTarget && (
                <div className="delete-confirm-overlay" onClick={() => setDeleteTarget(null)}>
                    <div className="delete-confirm-box" onClick={e => e.stopPropagation()}>
                        <p className="delete-confirm-title">정말 삭제하실건가요?</p>
                        <p className="delete-confirm-sub">삭제하면 복구할 수 없습니다.</p>
                        <div className="delete-confirm-btns">
                            <button className="delete-btn-cancel" onClick={() => setDeleteTarget(null)}>취소</button>
                            <button className="delete-btn-ok" onClick={async () => {
                                try {
                                    if (deleteTarget.id) {
                                        await deleteDoc(doc(fireDb, 'gallery', deleteTarget.id));
                                        await deleteGalleryItem(deleteTarget.id);
                                    }
                                    if (deleteTarget.storagePath) {
                                        const storageRef = ref(storage, deleteTarget.storagePath);
                                        await deleteObject(storageRef);
                                    }
                                    setAllItems(prev => prev.filter(i => i.id !== deleteTarget.id));
                                } catch (err) {
                                    console.error('Error deleting gallery item:', err);
                                }
                                setDeleteTarget(null);
                            }}>삭제</button>
                        </div>
                    </div>
                </div>
            )}

            {/* 수정 모달 */}
            {editTarget && (
                <div className="delete-confirm-overlay" onClick={() => { if (!isSaving) setEditTarget(null); }}>
                    <div className="delete-confirm-box" style={{ minWidth: 320, textAlign: 'left' }} onClick={e => e.stopPropagation()}>
                        <p className="delete-confirm-title">Update Info {isSaving && '(Saving...)'}</p>

                        <div className="edit-field" style={{ marginBottom: 20 }}>
                            <label className="edit-label">사진 교체</label>
                            <div className="edit-photo-preview-wrap">
                                <img src={editPreview || editTarget.img} alt="Preview" className="edit-photo-preview" />
                                <input
                                    type="file"
                                    id="edit-file-input"
                                    style={{ display: 'none' }}
                                    accept="image/*"
                                    onChange={(e) => {
                                        const file = e.target.files[0];
                                        if (file) {
                                            setEditFile(file);
                                            setEditPreview(URL.createObjectURL(file));
                                        }
                                    }}
                                />
                                <label htmlFor="edit-file-input" className="edit-photo-btn">
                                    사진 선택
                                </label>
                            </div>
                        </div>

                        <div className="edit-field">
                            <label className="edit-label">대분류 영역</label>
                            <select className="edit-select" value={editMainCat} onChange={e => setEditMainCat(e.target.value)}>
                                <option value="fitorialist">FITORIALIST</option>
                                <option value="artist">ARTIST</option>
                                <option value="fashion">FASHION & BEAUTY</option>
                                <option value="portrait">PORTRAIT</option>
                            </select>
                        </div>

                        <div className="edit-field">
                            <label className="edit-label">중분류 타겟</label>
                            <select className="edit-select" value={editType} onChange={e => setEditType(e.target.value)}>
                                <option value="women">여자 (Women)</option>
                                <option value="men">남자 (Men)</option>
                                <option value="couple">우정&커플 (Couple)</option>
                                <option value="outdoor">발리프로젝트 (Bali Project)</option>
                            </select>
                        </div>

                        <div className="edit-field">
                            <label className="edit-label">해시태그 (최대 3개)</label>
                            <input
                                type="text"
                                className="edit-input"
                                value={editTags}
                                onChange={e => setEditTags(e.target.value)}
                                placeholder="#바디프로필, #이너핏"
                                onKeyDown={e => { if (e.key === 'Enter') e.preventDefault(); }}
                            />
                            {tagSuggestions.length > 0 && (
                                <div className="tag-autocomplete-dropdown">
                                    {tagSuggestions.map((tag, idx) => (
                                        <div
                                            key={idx}
                                            className="tag-autocomplete-item"
                                            onClick={() => handleTagSuggestionClick(tag)}
                                        >
                                            {tag}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="delete-confirm-btns" style={{ marginTop: 20 }}>
                            <button className="delete-btn-cancel" disabled={isSaving} onClick={() => setEditTarget(null)}>취소</button>
                            <button className="delete-btn-ok" style={{ background: '#3a7bd5' }} disabled={isSaving} onClick={async () => {
                                setIsSaving(true);
                                const parsedTags = editTags.split(/[\s,]+/).map(t => t.trim()).filter(Boolean);
                                try {
                                    let newUrl = editTarget.img;
                                    let newStoragePath = editTarget.storagePath || '';

                                    // 1. If new file selected, upload it
                                    if (editFile) {
                                        const path = `gallery/${Date.now()}_${editFile.name}`;
                                        const storageRef = ref(storage, path);
                                        await uploadBytes(storageRef, editFile);
                                        newUrl = await getDownloadURL(storageRef);
                                        
                                        // 2. Delete old image if it exists
                                        if (editTarget.storagePath) {
                                            try {
                                                const oldRef = ref(storage, editTarget.storagePath);
                                                await deleteObject(oldRef);
                                            } catch (err) {
                                                console.warn('Failed to delete old image:', err);
                                            }
                                        }
                                        newStoragePath = path;
                                    }

                                    const docRef = doc(fireDb, 'gallery', String(editTarget.id));
                                    const updateData = {
                                        tags: parsedTags,
                                        mainCategory: editMainCat,
                                        type: editType,
                                        imageUrl: newUrl,
                                        storagePath: newStoragePath
                                    };

                                    await updateDoc(docRef, updateData);
                                    
                                    if (typeof updateGalleryItem === 'function') {
                                        await updateGalleryItem(editTarget.id, {
                                            ...editTarget,
                                            ...updateData,
                                            img: newUrl // Map for local state consistency
                                        });
                                    }

                                    setAllItems(prev => prev.map(i =>
                                        i.id === editTarget.id
                                            ? { ...i, ...updateData, img: newUrl }
                                            : i
                                    ));

                                    // Update local tag cloud suggestions
                                    const merged = Array.from(new Set([...savedTags, ...parsedTags]));
                                    setSavedTags(merged);
                                    localStorage.setItem('adminHashtags', JSON.stringify(merged));
                                    
                                    setEditTarget(null);
                                } catch (err) {
                                    if (err.message && err.message.includes("No document to update")) {
                                        alert("이 사진은 '새 사진 업로드 완료' 버튼을 통하지 않은 임시 프리뷰(Base64)입니다. F5를 눌러 지우시고 제대로 업로드 후 수정해주세요!");
                                    } else {
                                        alert(`수정 중 오류가 발생했습니다: ${err.message}`);
                                    }
                                    console.error('Edit Error:', err);
                                } finally {
                                    setIsSaving(false);
                                }
                            }}>{isSaving ? '보내는 중...' : '저장'}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Lightbox Modal */}
            {lightboxIndex !== null && (
                <div 
                    className="lightbox-overlay" 
                    onClick={closeLightbox}
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                >
                    <div className="lightbox-header">
                        <div className="lightbox-counter">
                            {lightboxIndex + 1} / {filteredGallery.length}
                        </div>
                        <button className="lightbox-close" onClick={closeLightbox}>✕</button>
                    </div>
                    <button className="lightbox-nav-btn prev-btn" onClick={showPrev}>⟨</button>
                    <div className="lightbox-content">
                        <img key={lightboxIndex} src={filteredGallery[lightboxIndex].img} alt="Lightbox Detail" />
                    </div>


                    <button className="lightbox-nav-btn next-btn" onClick={showNext}>⟩</button>

                    {/* 모바일 스와이프 가이드 (처음 등장 시 잠깐 표시) */}
                    {showSwipeGuide && (
                        <div className="swipe-guide-overlay">
                            <div className="swipe-finger-icon">
                                <svg viewBox="0 0 100 100">
                                    <path d="M50,80 C30,80 20,60 20,40 C20,20 35,10 50,10 C65,10 80,20 80,40 C80,60 70,80 50,80 Z" fill="none" stroke="white" strokeWidth="2" opacity="0.3" />
                                    <circle cx="50" cy="50" r="8" fill="white" className="finger-anim" />
                                </svg>
                            </div>
                            <p>SWIPE TO BROWSE</p>
                        </div>
                    )}
                </div>
            )}

            {/* Admin Floating Action Button (FAB) */}
            {isAdmin && isGalleryVisible && (
                <div className="admin-fab-container">
                    <span className="admin-fab-label">새 사진 업로드</span>
                    <button 
                        className="admin-fab-btn" 
                        onClick={() => setIsUploadModalOpen(true)}
                        title="Quick Upload"
                    >
                        +
                    </button>
                </div>
            )}

            {/* Admin Quick Upload Modal */}
            {isAdmin && isUploadModalOpen && (
                <div className="admin-upload-modal-overlay" onClick={() => setIsUploadModalOpen(false)}>
                    <div className="admin-upload-modal" onClick={e => e.stopPropagation()}>
                        <div className="admin-upload-modal-header">
                            <h3>Quick Photo Upload</h3>
                            <button className="admin-upload-modal-close" onClick={() => setIsUploadModalOpen(false)}>×</button>
                        </div>
                        <div className="admin-upload-modal-body">
                            <GalleryMultiUploader onUploadSuccess={(newItem) => {
                                setAllItems(prev => [newItem, ...prev]);
                            }} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GallerySection;
