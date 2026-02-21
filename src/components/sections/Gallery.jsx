import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import FadeInSection from '../FadeInSection';
import { getGalleryItems, addGalleryItem, deleteGalleryItem } from '../../utils/db';
import './Gallery.css';

// 기본 예제 사진 없음 - 어드민에서 직접 업로드한 사진만 표시
const MOCK_GALLERY = [];

const TIER1_CATEGORIES = [
    { id: 'women', labelKey: 'gallery.women' },
    { id: 'men', labelKey: 'gallery.men' },
    { id: 'couple', labelKey: 'gallery.couple' },
    { id: 'outdoor', labelKey: 'gallery.outdoor' },
    { id: 'fashion', labelKey: 'gallery.fashion' },
    { id: 'dancer', labelKey: 'gallery.dancer' },
    { id: 'self', labelKey: 'gallery.self' },
    { id: 'portrait', labelKey: 'gallery.portrait' }
];

const TIER2_TAGS = ['ALL', 'RED', 'BLACK', 'WHITE', 'COLOR', 'MONO', 'CLEAN', 'CONCEPT'];

const GallerySection = () => {
    const { t } = useTranslation();
    const [activeTier1, setActiveTier1] = useState('women');
    const [activeTier2, setActiveTier2] = useState('ALL');
    const [lightboxIndex, setLightboxIndex] = useState(null);
    const [localItems, setLocalItems] = useState([]);
    // 어드민 로그인 상태 (localStorage 연동)
    const [isAdmin, setIsAdmin] = useState(localStorage.getItem('isAdmin') === 'true');
    // 삭제 확인 모달에 사용할 target
    const [deleteTarget, setDeleteTarget] = useState(null);

    // Lock body scroll when lightbox is open
    useEffect(() => {
        if (lightboxIndex !== null) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
    }, [lightboxIndex]);

    // IndexedDB에서 결리 업로드된 로컀 사질 불러오기
    useEffect(() => {
        const loadLocalItems = async () => {
            try {
                const items = await getGalleryItems();
                // 어드민에서 저장된 태그는 해시태그 문자열(예: "#이너핏")로 저장되므로 TIER2_TAGS 형식에 맞게 변환 없이 그대로 옆에 놓음
                setLocalItems(items);
            } catch (err) {
                console.warn('IndexedDB 로드 실패:', err);
            }
        };
        loadLocalItems();
    }, []);

    // 전체 갤러리 (localItems만, MOCK 없음)
    const allGallery = [...localItems, ...MOCK_GALLERY];

    // 현재 카테고리(tier1)에 실제 사진이 있는 태그만 추출 → 없는 태그는 필터에서 자동 제거
    const tagsInCurrentCategory = new Set(
        allGallery
            .filter(item => item.type === activeTier1)
            .flatMap(item => item.tags || [])
            .map(tag => tag.replace('#', '').toUpperCase())
            .filter(Boolean)
    );

    // 'ALL' + 실제 사진에 있는 태그만 표시 (사진 없는 태그는 자동으로 사라짐)
    const dynamicTags = tagsInCurrentCategory.size > 0
        ? ['ALL', ...tagsInCurrentCategory]
        : ['ALL'];

    const filteredGallery = allGallery.filter((item) => {
        const matchTier1 = item.type === activeTier1;
        const matchTier2 = activeTier2 === 'ALL' ||
            (item.tags && item.tags.some(tag =>
                tag.replace('#', '').toUpperCase() === activeTier2.toUpperCase()
            ));
        return matchTier1 && matchTier2;
    });

    const openLightbox = (index) => setLightboxIndex(index);
    const closeLightbox = () => setLightboxIndex(null);

    const showPrev = (e) => {
        e.stopPropagation();
        setLightboxIndex((prev) => (prev > 0 ? prev - 1 : filteredGallery.length - 1));
    };

    const showNext = (e) => {
        e.stopPropagation();
        setLightboxIndex((prev) => (prev < filteredGallery.length - 1 ? prev + 1 : 0));
    };

    return (
        <div className="gallery-full-container">
            <FadeInSection className="gallery-header-wrapper">
                <h2 className="gallery-main-title">{t('nav.gallery')}</h2>

                {/* 1st Tier Category Tabs */}
                <div className="tier1-tabs">
                    {TIER1_CATEGORIES.map(cat => (
                        <button
                            key={cat.id}
                            className={`tier1-tab ${activeTier1 === cat.id ? 'active' : ''}`}
                            onClick={() => {
                                setActiveTier1(cat.id);
                                setActiveTier2('ALL'); // Reset tier 2 on tier 1 change
                            }}
                        >
                            {t(cat.labelKey)}
                        </button>
                    ))}
                </div>

                {/* 2nd Tier Hashtag Filters */}
                <div className="tier2-tags-scroll">
                    {dynamicTags.map((tag, idx) => (
                        <button
                            key={idx}
                            className={`tier2-chip ${activeTier2 === tag ? 'active' : ''}`}
                            onClick={() => setActiveTier2(tag)}
                        >
                            {tag === 'ALL'
                                ? t(`gallery.hashtags.ALL`, { defaultValue: 'ALL' })
                                : `#${t(`gallery.hashtags.${tag}`, { defaultValue: tag })}`}
                        </button>
                    ))}
                </div>
            </FadeInSection>

            {/* Full-width Masonry Grid */}
            <FadeInSection delay={1} className="gallery-masonry-grid">
                {/* 숨겨진 파일 input (+ 카드에서 사용) */}
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
                                    type: activeTier1,
                                    tags: [],
                                    img: reader.result,
                                    name: f.name,
                                    size: f.size,
                                });
                                // 새로 추가된 아이템을 리스트에 반영
                                setLocalItems(prev => [{
                                    id: newItem,
                                    type: activeTier1,
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

                {filteredGallery.map((item, index) => (
                    <div
                        key={item.id}
                        className="masonry-item"
                        onClick={() => openLightbox(index)}
                    >
                        <img src={item.img} alt="Gallery" loading="lazy" />
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
                        {/* X 삭제 버튼: 어드민 로그인 + 로컬 사진에만 표시 */}
                        {isAdmin && !String(item.id).startsWith('m') && (
                            <button
                                className="masonry-delete-btn"
                                title="사진 삭제"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setDeleteTarget(item); // 커스텀 모달 오픈
                                }}
                            >
                                ×
                            </button>
                        )}
                    </div>
                ))}

                {/* 어드민 전용: 마지막에 + 업로드 카드 */}
                {isAdmin && (
                    <div
                        className="masonry-item masonry-add-card"
                        onClick={() => window.location.href = '/admin'}
                    >
                        <div className="masonry-add-inner">
                            <span className="masonry-add-icon">+</span>
                            <span className="masonry-add-label">사진 추가</span>
                        </div>
                    </div>
                )}
            </FadeInSection>

            {/* 커스텀 삭제 확인 모달 */}
            {deleteTarget && (
                <div className="delete-confirm-overlay" onClick={() => setDeleteTarget(null)}>
                    <div className="delete-confirm-box" onClick={e => e.stopPropagation()}>
                        <p className="delete-confirm-title">🗑️ 정말 삭제하실건가요?</p>
                        <p className="delete-confirm-sub">삭제하면 복구할 수 없습니다.</p>
                        <div className="delete-confirm-btns">
                            <button className="delete-btn-cancel" onClick={() => setDeleteTarget(null)}>취소</button>
                            <button className="delete-btn-ok" onClick={async () => {
                                await deleteGalleryItem(deleteTarget.id);
                                setLocalItems(prev => prev.filter(i => i.id !== deleteTarget.id));
                                setDeleteTarget(null);
                            }}>삭제</button>
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
                        <img
                            src={filteredGallery[lightboxIndex].img}
                            alt="Lightbox Detail"
                        />
                    </div>

                    <button className="lightbox-nav-btn next-btn" onClick={showNext}>⟩</button>
                </div>
            )}
        </div>
    );
};

export default GallerySection;
