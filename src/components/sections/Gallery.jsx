import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import FadeInSection from '../FadeInSection';
import { getGalleryItems, addGalleryItem, deleteGalleryItem, updateGalleryItem } from '../../utils/db';
import { getGalleries } from '../../utils/galleryService';
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
    const [moveTarget, setMoveTarget] = useState(null);
    const [visibleCount, setVisibleCount] = useState(24);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    // URL query param으로 카테고리 자동 선택
    useEffect(() => {
        const mainParam = searchParams.get('main');
        if (mainParam && MAIN_CATEGORIES.some(c => c.id === mainParam)) {
            setMainCategory(mainParam);
            setViewMode('detail');
            setSubCategory('women');
            setActiveTag('ALL');
        }
    }, [searchParams]);

    // Lock body scroll when lightbox is open
    useEffect(() => {
        if (lightboxIndex !== null) {
            document.body.style.overflow = 'hidden';
            document.body.classList.add('hide-support-cs');
        } else {
            document.body.style.overflow = 'auto';
            if (viewMode !== 'detail') {
                document.body.classList.remove('hide-support-cs');
            }
        }
        return () => { document.body.classList.remove('hide-support-cs'); };
    }, [lightboxIndex, viewMode]);

    // Firebase + IndexedDB에서 갤러리 데이터 로드
    useEffect(() => {
        const loadItems = async () => {
            try {
                const firebaseItems = await getGalleries();
                const mapped = firebaseItems.map(item => ({
                    id: item.id,
                    mainCategory: (item.mainCategory || 'fitorialist').toLowerCase(),
                    type: (item.type || 'women').toLowerCase(),
                    tags: item.tags || [],
                    img: item.imageUrl || item.img || item.url || '',
                    name: item.name || '',
                    seoTags: item.seoTags || '',
                    createdAt: item.createdAt || item.order || 0,
                }));

                const localUploads = await getGalleryItems();
                const localMapped = localUploads.map(item => ({
                    ...item,
                    mainCategory: item.mainCategory || item.type || 'fitorialist',
                    type: item.type || 'women',
                }));
                setAllItems([...mapped, ...localMapped]);
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

    // 필터 변경 시 표시 개수 리셋
    useEffect(() => {
        setVisibleCount(18);
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
    });

    // 페이지네이션: 보이는 항목만 슬라이스
    const visibleItems = filteredGallery.slice(0, visibleCount);
    const hasMore = visibleCount < filteredGallery.length;

    const handleLoadMore = () => {
        if (hasMore && !isLoadingMore) {
            setIsLoadingMore(true);
            setTimeout(() => {
                setVisibleCount(prev => prev + 24);
                setIsLoadingMore(false);
            }, 300);
        }
    };

    const openLightbox = (index) => setLightboxIndex(index);
    const closeLightbox = () => setLightboxIndex(null);
    const showPrev = (e) => { e.stopPropagation(); setLightboxIndex(prev => prev > 0 ? prev - 1 : filteredGallery.length - 1); };
    const showNext = (e) => { e.stopPropagation(); setLightboxIndex(prev => prev < filteredGallery.length - 1 ? prev + 1 : 0); };

    return (
        <div className="gallery-full-container">
            <div style={{ padding: '0 24px' }}>
                <FadeInSection className="section-header">
                    <h2 className="section-title">STUDIOS</h2>
                </FadeInSection>
            </div>

            {viewMode === 'main' ? (
                /* ===== MAIN VIEW: 카테고리 선택 카드 ===== */
                <div className="main-selection-grid" style={{ gridTemplateColumns: '1fr', display: 'grid' }}>
                    {MAIN_CATEGORIES.map(cat => (
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
                            <div className="card-inner">
                                <span className="card-label">{t(cat.labelKey)}</span>
                                <span className="card-arrow">VIEW ARCHIVE →</span>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                /* ===== DETAIL VIEW: 갤러리 그리드 ===== */
                <>
                    <div className="gallery-header-wrapper">
                        {/* 검색 바 */}
                        <div className="gallery-search-bar-container" style={{ marginBottom: '32px' }}>
                            <div className="gallery-search-bar">
                                <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }}>
                                    <circle cx="11" cy="11" r="8" />
                                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                                </svg>
                                <input
                                    type="text"
                                    className="gallery-search-input"
                                    placeholder={`#${t('gallery.hashtags.ALL', { defaultValue: '태그' })} 검색...`}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* 현재 카테고리 표시 + BACK 버튼 */}
                        <div className="gallery-detail-header">
                            <h3 className="gallery-current-category">
                                {t(MAIN_CATEGORIES.find(c => c.id === mainCategory)?.labelKey)}
                            </h3>
                            <button
                                className="back-to-main-btn"
                                onClick={() => {
                                    setViewMode('main');
                                    setSearchQuery('');
                                }}
                            >
                                ← BACK
                            </button>
                        </div>

                        {/* Sub-category tabs (women/men/couple/outdoor) */}
                        {!searchQuery && (
                            <div className="tier1-tabs sub-category-tabs">
                                {visibleSubCategories.map(sc => {
                                    // NEW badge: 48시간 이내 업로드된 이미지가 있는지
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
                                            <span className="tab-label-wrapper">
                                                {t(sc.labelKey)}
                                                {hasNew && <span className="tab-new-badge">NEW</span>}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {/* Tag filter chips */}
                        {!searchQuery && (
                            <div className="tier2-tags-scroll">
                                {dynamicTags.map((tag, idx) => {
                                    const displayTag = tag === 'ALL' ? '전체' : tag;
                                    return (
                                        <button
                                            key={idx}
                                            className={`tier2-chip ${activeTag === tag ? 'active' : ''}`}
                                            onClick={() => setActiveTag(tag)}
                                        >
                                            {tag === 'ALL' ? displayTag : `#${displayTag}`}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Gallery Grid */}
                    <div className="gallery-masonry-wrapper">
                        {/* 어드민 전용 업로드 FAB */}
                        {isAdmin && (
                            <button
                                className="gallery-fab-upload"
                                onClick={() => document.getElementById('gallery-quick-upload').click()}
                                title="사진 추가"
                            >
                                +
                            </button>
                        )}

                        <input
                            id="gallery-quick-upload"
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={async (e) => {
                                const f = e.target.files[0];
                                if (!f) return;
                                const reader = new FileReader();
                                reader.onloadend = async () => {
                                    try {
                                        const newItem = await addGalleryItem({
                                            mainCategory: mainCategory,
                                            type: subCategory,
                                            tags: [],
                                            img: reader.result,
                                            name: f.name,
                                            size: f.size,
                                        });
                                        setAllItems(prev => [{
                                            id: newItem,
                                            mainCategory: mainCategory,
                                            type: subCategory,
                                            tags: [],
                                            img: reader.result,
                                            name: f.name,
                                            size: f.size,
                                            createdAt: Date.now()
                                        }, ...prev]);
                                    } catch (err) { console.error(err); }
                                };
                                reader.readAsDataURL(f);
                                e.target.value = '';
                            }}
                        />

                        <div className="gallery-masonry-grid">
                            {visibleItems.map((item, index) => (
                                <div
                                    key={item.id}
                                    className="masonry-item"
                                    onClick={() => openLightbox(index)}
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
                                                className="masonry-move-btn"
                                                title="카테고리 이동"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    const rect = e.currentTarget.getBoundingClientRect();
                                                    setMoveTarget({ id: item.id, rect });
                                                }}
                                            >
                                                📂
                                            </button>
                                            <button
                                                className="masonry-delete-btn"
                                                title="사진 삭제"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setDeleteTarget(item);
                                                }}
                                            >
                                                ×
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* 더 보기 버튼 */}
                        {hasMore && !isLoadingMore && (
                            <div className="gallery-more-container">
                                <button className="gallery-more-btn" onClick={handleLoadMore}>
                                    더 보기
                                </button>
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

            {/* 삭제 확인 모달 */}
            {deleteTarget && (
                <div className="delete-confirm-overlay" onClick={() => setDeleteTarget(null)}>
                    <div className="delete-confirm-box" onClick={e => e.stopPropagation()}>
                        <p className="delete-confirm-title">정말 삭제하실건가요?</p>
                        <p className="delete-confirm-sub">삭제하면 복구할 수 없습니다.</p>
                        <div className="delete-confirm-btns">
                            <button className="delete-btn-cancel" onClick={() => setDeleteTarget(null)}>취소</button>
                            <button className="delete-btn-ok" onClick={async () => {
                                await deleteGalleryItem(deleteTarget.id);
                                setAllItems(prev => prev.filter(i => i.id !== deleteTarget.id));
                                setDeleteTarget(null);
                            }}>삭제</button>
                        </div>
                    </div>
                </div>
            )}

            {/* 카테고리 이동 팝업 */}
            {moveTarget && (
                <div className="move-menu-overlay" onClick={() => setMoveTarget(null)}>
                    <div
                        className="move-menu-box"
                        style={{
                            top: moveTarget.rect.top + window.scrollY,
                            left: moveTarget.rect.left + window.scrollX - 120
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        <p className="move-menu-title">이동할 카테고리 선택</p>
                        <div className="move-menu-list">
                            {MAIN_CATEGORIES.map(cat => (
                                <button
                                    key={cat.id}
                                    className="move-menu-item"
                                    onClick={async () => {
                                        await updateGalleryItem(moveTarget.id, { mainCategory: cat.id });
                                        setAllItems(prev => prev.map(i =>
                                            i.id === moveTarget.id ? { ...i, mainCategory: cat.id } : i
                                        ));
                                        setMoveTarget(null);
                                    }}
                                >
                                    {t(cat.labelKey)}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Lightbox Modal */}
            {lightboxIndex !== null && (
                <div className="lightbox-overlay" onClick={closeLightbox}>
                    <div className="lightbox-header">
                        <div className="lightbox-counter">
                            {lightboxIndex + 1} / {filteredGallery.length}
                        </div>
                        <button className="lightbox-close" onClick={closeLightbox}>✕</button>
                    </div>
                    <button className="lightbox-nav-btn prev-btn" onClick={showPrev}>⟨</button>
                    <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
                        <img src={filteredGallery[lightboxIndex].img} alt="Lightbox Detail" />
                    </div>
                    <button className="lightbox-nav-btn next-btn" onClick={showNext}>⟩</button>
                </div>
            )}
        </div>
    );
};

export default GallerySection;
