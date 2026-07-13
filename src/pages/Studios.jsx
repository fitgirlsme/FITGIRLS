import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getReviews } from '../utils/reviewService';
import reviewsBackup from '../data/reviews_backup.json';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SupportCS from '../components/SupportCS';
import { db } from '../utils/firebase';
import { collection, getDocs, orderBy, query, limit } from 'firebase/firestore';
import './Studios.css';

const Studios = ({ changeLanguage, currentLang }) => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const [openFaqIndex, setOpenFaqIndex] = useState(null);
    const [realReviews, setRealReviews] = useState([]);
    const [activePriceTab, setActivePriceTab] = useState('personal'); // 'personal' or 'friends'
    const [activeFaqTab, setActiveFaqTab] = useState('before_booking'); // 'before_booking', 'before_shoot', 'after_shoot'
    const [allPhotos, setAllPhotos] = useState([]);
    const [archiveTags, setArchiveTags] = useState([]);
    const [tagThumbnails, setTagThumbnails] = useState({});
    const [activeTag, setActiveTag] = useState('ALL');

    useEffect(() => {
        const fetchArchivePhotos = async () => {
            try {
                const galleryRef = collection(db, 'gallery');
                const q = query(galleryRef, orderBy('createdAt', 'desc'), limit(150));
                const snap = await getDocs(q);
                const loaded = snap.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    img: doc.data().imageUrl || doc.data().img
                })).filter(item => item.img && (item.mainCategory === 'fitorialist' || !item.mainCategory));
                
                setAllPhotos(loaded);

                // 태그 주입 및 중복 제거
                const tagFrequency = {};
                const tagReps = {};
                loaded.forEach(item => {
                    const itemTags = item.tags || [];
                    itemTags.forEach(t => {
                        const clean = t.replace('#', '').trim();
                        if (clean && clean !== 'ALL') {
                            tagFrequency[clean] = (tagFrequency[clean] || 0) + 1;
                            if (!tagReps[clean]) {
                                tagReps[clean] = item.img;
                            }
                        }
                    });
                });

                const sortedTags = Object.keys(tagFrequency)
                    .sort((a, b) => tagFrequency[b] - tagFrequency[a])
                    .slice(0, 25); // 상위 25개 태그 추출

                setArchiveTags(sortedTags);
                setTagThumbnails(tagReps);
            } catch (err) {
                console.error("Failed to fetch archive photos", err);
            }
        };
        fetchArchivePhotos();
    }, []);

    const displayedPhotos = activeTag === 'ALL'
        ? allPhotos.slice(0, 12)
        : allPhotos.filter(p => p.tags && p.tags.some(t => t.replace('#', '').trim() === activeTag)).slice(0, 12);

    const toggleFaq = (index) => {
        setOpenFaqIndex(openFaqIndex === index ? null : index);
    };

    const handleFaqTabChange = (tabName) => {
        setActiveFaqTab(tabName);
        setOpenFaqIndex(null); // Reset toggle state when tab changes
    };

    useEffect(() => {
        const fetchRealReviews = async () => {
            try {
                const reviewsData = await getReviews('all');
                let combined = [...reviewsData];
                const existingIds = new Set(reviewsData.map(r => r.id));

                const lang = currentLang || i18n.language;
                const translatedBackup = reviewsBackup.map(backup => {
                    if (lang !== 'ko' && backup.translations?.[lang]) {
                        return {
                            ...backup,
                            text: backup.translations[lang].text,
                            title: backup.translations[lang].title
                        };
                    }
                    return backup;
                });

                translatedBackup.forEach(backup => {
                    if (!existingIds.has(backup.id)) {
                        combined.push(backup);
                    }
                });

                // Display up to 6 reviews
                setRealReviews(combined.slice(0, 6));
            } catch (err) {
                setRealReviews(reviewsBackup.slice(0, 6));
            }
        };
        fetchRealReviews();
    }, [currentLang, i18n.language]);

    // Load multi-lingual objects from i18n files dynamically
    const CONCEPTS = t('studios.concepts', { returnObjects: true }) || [];
    // Merge local studios Q&As and global site FAQs (before_booking, before_shoot, after_shoot) for complete coverage
    const localFaqs = t('studios.faqs', { returnObjects: true }) || [];
    const beforeBookingFaqs = t('faq.before_booking', { returnObjects: true }) || [];
    const beforeShootFaqs = t('faq.before_shoot', { returnObjects: true }) || [];
    const afterShootFaqs = t('faq.after_shoot', { returnObjects: true }) || [];

    const beforeBookingList = [
        ...localFaqs.slice(0, 5).map(item => ({ q: item.q, a: item.a })),
        ...beforeBookingFaqs.map(item => ({ q: item.question, a: item.answer }))
    ];

    const beforeShootList = [
        ...beforeShootFaqs.map(item => ({ q: item.question, a: item.answer }))
    ];

    const afterShootList = [
        ...localFaqs.slice(5).map(item => ({ q: item.q, a: item.a })),
        ...afterShootFaqs.map(item => ({ q: item.question, a: item.answer }))
    ];

    const getFaqListByTab = () => {
        if (activeFaqTab === 'before_shoot') return beforeShootList;
        if (activeFaqTab === 'after_shoot') return afterShootList;
        return beforeBookingList;
    };

    const FAQS = getFaqListByTab();
    const FAQ_TABS = t('faq.tabs', { returnObjects: true }) || ['예약 전', '촬영 전', '촬영 후'];

    const PRICES = t('studios.prices', { returnObjects: true }) || [];
    const PRICES_FRIENDS = t('studios.prices_friends', { returnObjects: true }) || [];
    const PREP_GUIDES = t('studios.prep_guides', { returnObjects: true }) || [];
    const PROCESS_STEPS = t('studios.process_steps', { returnObjects: true }) || [];

    return (
        <div className="studios-brand-container">
            <Header changeLanguage={changeLanguage} currentLang={currentLang} />

            {/* 1. HERO SECTION */}
            <header className="studios-hero">
                <div className="studios-hero-badge">FITGIRLS SEOUL</div>
                <h1 className="studios-hero-title">
                    {t('studios.hero_title')}
                </h1>
                <p className="studios-hero-desc">
                    {t('studios.hero_desc')}
                </p>
                <div className="studios-hero-actions">
                    <button className="btn-primary" onClick={() => navigate('/archive')}>
                        {t('studios.btn_concept')}
                    </button>
                    <button className="btn-secondary" onClick={() => {
                        const priceSec = document.getElementById('studios-price');
                        if (priceSec) priceSec.scrollIntoView({ behavior: 'smooth' });
                    }}>
                        {t('studios.btn_price')}
                    </button>
                </div>
            </header>

            {/* 2. WHY FITGIRLS SECTION */}
            <section className="studios-section">
                <div className="studios-section-header">
                    <span className="studios-section-number">Why 01</span>
                    <h2 className="studios-section-title">{t('studios.why_title')}</h2>
                    <p className="studios-section-desc">
                        {t('studios.why_subtitle')}
                    </p>
                </div>

                <div className="why-grid">
                    <div className="why-card">
                        <span className="why-icon">🙋‍♀️</span>
                        <h4>{t('studios.why_1_title')}</h4>
                        <p>{t('studios.why_1_desc')}</p>
                    </div>
                    <div className="why-card">
                        <span className="why-icon">🎨</span>
                        <h4>{t('studios.why_2_title')}</h4>
                        <p>{t('studios.why_2_desc')}</p>
                    </div>
                    <div className="why-card">
                        <span className="why-icon">📸</span>
                        <h4>{t('studios.why_3_title')}</h4>
                        <p>{t('studios.why_3_desc')}</p>
                    </div>
                    <div className="why-card">
                        <span className="why-icon">👗</span>
                        <h4>{t('studios.why_4_title')}</h4>
                        <p>{t('studios.why_4_desc')}</p>
                    </div>
                </div>

                <div className="purpose-wrapper">
                    <h5>{t('studios.purpose_title')}</h5>
                    <div className="purpose-tags">
                        {['첫 바디프로필', '바프 뚝딱이 탈출', '운동 기록', '다이어트 성공 기념', '생일 & 버킷리스트', '웨딩 전 소장용 화보', '커플·우정 바프', '일반인 라이트 화보', '40대·50대 시니어 바프'].map((pt, pIdx) => (
                            <span key={pIdx} className="purpose-chip">{pt}</span>
                        ))}
                    </div>
                </div>
            </section>

            {/* 3. PROCESS SECTION */}
            <section className="studios-section" id="studios-process">
                <div className="studios-section-header">
                    <span className="studios-section-number">Why 02</span>
                    <h2 className="studios-section-title">{t('studios.process_title')}</h2>
                    <p className="studios-section-desc">
                        {t('studios.process_desc')}
                    </p>
                </div>

                <div className="process-timeline">
                    {PROCESS_STEPS.map((step, idx) => (
                        <div key={idx} className="process-step">
                            <div className="process-badge">{idx + 1}</div>
                            <div className="process-content">
                                <h4>{step.title}</h4>
                                <p>{step.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* 3.5 80+ BACKGROUND ZONES & UNLIMITED SELECTION HIGHLIGHT [NEW] */}
            <section className="studios-section studios-zone-highlight-section">
                <div className="studios-section-header">
                    <span className="studios-section-number">Why 03</span>
                    <h2 className="studios-section-title">{t('studios.zone_title', '80여 개 촬영 배경 & 2컨셉 이상 배경 무제한 이용')}</h2>
                    <p className="studios-section-desc">
                        {t('studios.zone_desc', '핏걸즈 스튜디오는 단조롭고 정형화된 공장식 바디프로필에서 완전히 벗어나, 국내 최대 수준인 80개 이상의 다채로운 촬영 배경(Zone)을 제공합니다.')}
                    </p>
                </div>

                <div className="studios-zone-box">
                    <div className="studios-zone-banner-card">
                        <div className="studios-zone-info-card">
                            <span className="zone-card-badge">UNLIMITED BACKGROUNDS</span>
                            <h3>{t('studios.zone_card_title', '2컨셉부터 제한 없이 열리는 80+ 촬영 배경의 자유')}</h3>
                            <p>{t('studios.zone_card_desc', '타 스튜디오처럼 컨셉당 촬영존을 1개로 엄격하게 가두지 않습니다. 핏걸즈에서는 2컨셉 촬영부터 80여 개의 모든 촬영 구역을 제한 없이 원하는 대로 넘나들며 촬영하실 수 있습니다. 한 번의 예약으로 소장용 프리미엄 패션 화보부터 다채로운 감성의 인생 바프까지 독창적으로 조합해 보세요.')}</p>

                            <ul className="studios-zone-features">
                                <li>📸 <strong>{t('studios.zone_feat1_title', '80개 이상의 입체적 배경')}</strong>: {t('studios.zone_feat1_desc', '자연광 침실부터 세련된 컬러 백그라운드, 시크한 빈티지 벽면 완비')}</li>
                                <li>✨ <strong>{t('studios.zone_feat2_title', '2컨셉 이상 선택 무제한')}</strong>: {t('studios.zone_feat2_desc', '추가금이나 제한 없이 모든 배경을 원하는 대로 믹스 앤 매치')}</li>
                                <li>💡 <strong>{t('studios.zone_feat3_title', '디테일한 라이팅 맞춤')}</strong>: {t('studios.zone_feat3_desc', '각 배경마다 내 몸의 장점이 조각처럼 도드라지게 조절되는 입체 조명')}</li>
                            </ul>

                            <div className="studios-zone-actions">
                                <a 
                                    href="https://fitgirls.me/zone" 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="studios-zone-btn"
                                >
                                    📸 {t('studios.zone_btn_label', '핏걸즈 80+ 촬영 배경 전체 실시간 구경하기')} →
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 3.6 REAL CLIENT VISUAL ARCHIVE [NEW] */}
            <section className="studios-section studios-visual-archive-section">
                <div className="studios-section-header">
                    <span className="studios-section-number">Why 04</span>
                    <h2 className="studios-section-title">{t('studios.archive_section_title', '핏걸즈 실시간 비주얼 아카이브')}</h2>
                    <p className="studios-section-desc">
                        {t('studios.archive_section_desc', '핏걸즈 아카이브에서 실시간으로 가져오는 실제 고객님들의 완성 화보입니다. 이미지를 클릭하시면 메인 홈페이지로 이동합니다.')}
                    </p>
                </div>

                {/* 태그 원형 썸네일 필터 */}
                {archiveTags.length > 0 && (
                    <div className="tag-circles-scroll" style={{ marginBottom: '32px' }}>
                        {/* ALL 버튼 */}
                        <div
                            className={`tag-circle-item ${activeTag === 'ALL' ? 'active' : ''}`}
                            onClick={() => setActiveTag('ALL')}
                        >
                            <div className="tag-circle-img-wrap tag-circle-all">
                                <span>ALL</span>
                            </div>
                            <span className="tag-circle-label">{t('gallery.hashtags.ALL', '전체')}</span>
                        </div>
                        {archiveTags.map((tag, idx) => (
                            <div
                                key={idx}
                                className={`tag-circle-item ${activeTag === tag ? 'active' : ''}`}
                                onClick={() => setActiveTag(activeTag === tag ? 'ALL' : tag)}
                            >
                                <div className="tag-circle-img-wrap">
                                    {tagThumbnails[tag] ? (
                                        <img 
                                            src={tagThumbnails[tag]} 
                                            alt={tag} 
                                            loading="lazy" 
                                        />
                                    ) : (
                                        <div className="tag-circle-placeholder" />
                                    )}
                                </div>
                                <span className="tag-circle-label">{tag}</span>
                            </div>
                        ))}
                    </div>
                )}

                <div className="studios-archive-grid">
                    {displayedPhotos.map((photo) => (
                        <div 
                            key={photo.id} 
                            className="studios-archive-photo-card" 
                            onClick={() => navigate('/')}
                        >
                            <div 
                                className="studios-archive-photo-img" 
                                style={{ backgroundImage: `url(${photo.img})` }}
                            />
                            <div className="studios-archive-photo-overlay">
                                <span className="studios-archive-photo-tag">
                                    {photo.tags && photo.tags.length > 0 
                                        ? photo.tags.slice(0, 2).join(' ') 
                                        : '#핏걸즈 #바디프로필'}
                                </span>
                                <span className="studios-archive-photo-click">CLICK TO HOME</span>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="studios-archive-actions" style={{ textAlign: 'center', marginTop: '40px' }}>
                    <button className="btn-secondary" onClick={() => navigate('/archive')}>
                        {t('studios.btn_archive_more', '아카이브에서 전체 사진 보기')} →
                    </button>
                </div>
            </section>

            {/* 4. CONCEPT SECTION */}
            <section className="studios-section">
                <div className="studios-section-header">
                    <span className="studios-section-number">Why 05</span>
                    <h2 className="studios-section-title">{t('studios.concept_title')}</h2>
                    <p className="studios-section-desc">
                        {t('studios.concept_desc')}
                    </p>
                </div>

                <div className="concept-grid">
                    {CONCEPTS.map((concept, idx) => (
                        <div key={idx} className="concept-card">
                            <div>
                                <h3 className="concept-title">{concept.title}</h3>
                                <p className="concept-desc">{concept.desc}</p>
                            </div>
                            <div className="concept-meta">
                                <div className="concept-meta-item">🎯 <strong>{t('studios.concept_recommend')}:</strong> {concept.target}</div>
                                <div className="concept-meta-item">👗 <strong>{t('studios.concept_outfit')}:</strong> {concept.outfit}</div>
                                <div className="concept-meta-item">💄 <strong>{t('studios.concept_makeup')}:</strong> {concept.makeup}</div>
                                <div className="concept-meta-item">🧘‍♀️ <strong>{t('studios.concept_pose')}:</strong> {concept.pose}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* 4.5 CLOTHING & LOOKBOOK BANNER SECTION [NEW] */}
            <section className="studios-section studios-lookbook-highlight-section">
                <div className="studios-section-header">
                    <span className="studios-section-number">Why 06</span>
                    <h2 className="studios-section-title">{t('studios.lookbook_title', '핏걸즈 무료 의상 대여 & 룩북 서비스')}</h2>
                    <p className="studios-section-desc">
                        {t('studios.lookbook_desc', '바디라인을 가장 돋보이게 해주는 핏걸즈의 엄선된 수십 벌의 의상과 소품들을 별도 추가 요금 없이 100% 무료로 대여해 드립니다.')}
                    </p>
                </div>

                <div className="studios-lookbook-box">
                    <div className="studios-lookbook-banner-card">
                        <div className="studios-lookbook-grid">
                            <div className="studios-lookbook-info-card">
                                <span className="lookbook-card-badge">FREE RENTAL</span>
                                <h3>{t('studios.lookbook_card_title', '몸매 보정력이 입증된 핏걸즈 의상 라인업')}</h3>
                                <p>{t('studios.lookbook_card_desc', '수많은 촬영 데이터를 기반으로 일반 속옷 매장에서는 구하기 힘든 수입 모노키니, 시크한 바디수트, 데님 재킷, 크롭 스포티룩 등을 준비해 두었습니다. 사이즈 및 체형 고민 없이 몸만 오셔도 마법 같은 핏을 선사합니다.')}</p>
                                
                                <ul className="studios-lookbook-features">
                                    <li>👗 <strong>{t('studios.lookbook_feat1_title', '수입 모노키니 & 시크 바디수트')}</strong>: {t('studios.lookbook_feat1_desc', '체형 보정과 볼륨감을 극대화하는 패턴')}</li>
                                    <li>👖 <strong>{t('studios.lookbook_feat2_title', '트렌디 캐주얼 & 스포티룩')}</strong>: {t('studios.lookbook_feat2_desc', '노출 부담 없는 힙한 스트릿 패션')}</li>
                                    <li>👠 <strong>{t('studios.lookbook_feat3_title', '하이힐 & 볼드 악세서리')}</strong>: {t('studios.lookbook_feat3_desc', '비율을 살려주는 12cm 힐과 다양한 소품')}</li>
                                    <li>🧼 <strong>{t('studios.lookbook_feat4_title', '1회 착용 후 완벽 살균 세탁')}</strong>: {t('studios.lookbook_feat4_desc', '위생 걱정 없는 고온 스팀 안심 관리')}</li>
                                </ul>

                                <div className="studios-lookbook-actions">
                                    <a 
                                        href="https://fitgirls.me/lookbook" 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className="studios-lookbook-btn"
                                    >
                                        👗 {t('studios.lookbook_btn_label', '핏걸즈 무료 대여 의상 룩북 전체보기')} →
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 5. REVIEWS SECTION */}
            <section className="studios-section">
                <div className="studios-section-header">
                    <span className="studios-section-number">Why 07</span>
                    <h2 className="studios-section-title">{t('studios.review_title')}</h2>
                    <p className="studios-section-desc">
                        {t('studios.review_desc')}
                    </p>
                </div>

                <div className="review-card-grid">
                    {realReviews.map((rev, idx) => {
                        const content = rev.text || rev.content || '';
                        const hasImage = rev.img || rev.imageUrl;
                        return (
                            <div key={idx} className={`review-text-card ${hasImage ? 'has-img' : ''}`}>
                                {hasImage && (
                                    <div className="studios-review-img-wrap">
                                        <img src={rev.img || rev.imageUrl} alt="Review Customer" />
                                    </div>
                                )}
                                <div className="studios-review-txt-content">
                                    <h4 className="review-card-title">
                                        {rev.title || t('reviews.default_title', '핏걸즈&이너핏 스튜디오 예약')}
                                    </h4>
                                    <div className="review-card-meta">
                                        {rev.author} {rev.job ? `| ${rev.job}` : ''}
                                    </div>
                                    <p className="review-card-content">
                                        {content.length > 130 ? `${content.slice(0, 130)}...` : content}
                                    </p>
                                    <div className="review-card-footer">
                                        <span>★★★★★</span>
                                        <span>{rev.date || '2026'}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
                <div style={{ textAlign: 'center', marginTop: '40px' }}>
                    <button className="btn-secondary" onClick={() => navigate('/reviews')}>
                        {t('reviews.view_all', '전체 리뷰 더 보기')} →
                    </button>
                </div>
            </section>

            {/* 6. FAQ & Q&A SECTION */}
            <section className="studios-section">
                <div className="studios-section-header">
                    <span className="studios-section-number">Why 08</span>
                    <h2 className="studios-section-title">{t('studios.faq_title')}</h2>
                    <p className="studios-section-desc">
                        {t('studios.faq_desc')}
                    </p>
                </div>

                {/* Q&A 탭메뉴 */}
                <div className="studios-faq-tabs">
                    <button 
                        className={`studios-faq-tab-btn ${activeFaqTab === 'before_booking' ? 'active' : ''}`}
                        onClick={() => handleFaqTabChange('before_booking')}
                    >
                        {FAQ_TABS[0] || '예약 전'}
                    </button>
                    <button 
                        className={`studios-faq-tab-btn ${activeFaqTab === 'before_shoot' ? 'active' : ''}`}
                        onClick={() => handleFaqTabChange('before_shoot')}
                    >
                        {FAQ_TABS[1] || '촬영 전'}
                    </button>
                    <button 
                        className={`studios-faq-tab-btn ${activeFaqTab === 'after_shoot' ? 'active' : ''}`}
                        onClick={() => handleFaqTabChange('after_shoot')}
                    >
                        {FAQ_TABS[2] || '촬영 후'}
                    </button>
                </div>

                <div className="studios-faq-grid">
                    {FAQS.map((faq, idx) => (
                        <div 
                            key={idx} 
                            className={`studios-faq-card ${openFaqIndex === idx ? 'is-open' : ''}`}
                        >
                            <div className="studios-faq-question" onClick={() => toggleFaq(idx)}>
                                <span>Q. {faq.q}</span>
                                <span className="studios-faq-toggle-icon">▼</span>
                            </div>
                            {openFaqIndex === idx && (
                                <div className="studios-faq-answer">
                                    {faq.a}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </section>

            {/* 7. PREP GUIDE SECTION */}
            <section className="studios-section">
                <div className="studios-section-header">
                    <span className="studios-section-number">Why 09</span>
                    <h2 className="studios-section-title">{t('studios.prep_title')}</h2>
                    <p className="studios-section-desc">
                        {t('studios.prep_desc')}
                    </p>
                </div>

                <div className="prep-grid">
                    {PREP_GUIDES.map((guide, idx) => (
                        <div key={idx} className="prep-card">
                            <h4>{guide.title}</h4>
                            <p>{guide.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* 8. PRICE SECTION */}
            <section className="studios-section" id="studios-price">
                <div className="studios-section-header">
                    <span className="studios-section-number">Why 10</span>
                    <h2 className="studios-section-title">{t('studios.price_title')}</h2>
                    <p className="studios-section-desc">
                        {t('studios.price_desc')}
                    </p>
                </div>

                {/* Price Tab Nav */}
                <div className="studios-price-tabs">
                    <button 
                        className={`studios-price-tab-btn ${activePriceTab === 'personal' ? 'active' : ''}`}
                        onClick={() => setActivePriceTab('personal')}
                    >
                        {t('studios.tab_personal', '개인 촬영 (Personal)')}
                    </button>
                    <button 
                        className={`studios-price-tab-btn ${activePriceTab === 'friends' ? 'active' : ''}`}
                        onClick={() => setActivePriceTab('friends')}
                    >
                        {t('studios.tab_friends', '우정 / 커플 촬영 (Friends & Couple)')}
                    </button>
                </div>

                <div className="price-section-grid">
                    {(activePriceTab === 'personal' ? PRICES : PRICES_FRIENDS).map((pr, idx) => (
                        <div key={idx} className={`price-card ${activePriceTab === 'personal' && idx === 1 ? 'popular' : ''}`}>
                            {activePriceTab === 'personal' && idx === 1 && <span className="price-badge-tag">Most Popular</span>}
                            <h3 className="price-name">{pr.name}</h3>
                            <div className="price-amount">
                                {pr.price} <span>{t('studios.price_ko')}</span>
                            </div>
                            <ul className="price-features">
                                {pr.features && pr.features.map((feat, fIdx) => (
                                    <li key={fIdx}>{feat}</li>
                                ))}
                            </ul>
                            <div className="price-recommend">
                                💡 {t('studios.price_recommend')}: {pr.recommend}
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* 9. LOCATION SECTION */}
            <section className="studios-section">
                <div className="studios-section-header">
                    <span className="studios-section-number">Why 11</span>
                    <h2 className="studios-section-title">{t('studios.loc_title')}</h2>
                    <p className="studios-section-desc">
                        {t('studios.loc_desc')}
                    </p>
                </div>

                <div className="location-box">
                    <div className="location-info">
                        <h4>{t('studios.loc_card_title')}</h4>
                        <p>{t('location.address')}</p>
                        
                        <ul className="location-details">
                            <li><strong>{t('studios.loc_sub')}</strong> {t('studios.loc_sub_desc')}</li>
                            <li><strong>{t('studios.loc_ap')}</strong> {t('studios.loc_ap_desc')}</li>
                            <li><strong>{t('studios.loc_parking')}</strong> {t('studios.loc_parking_desc')}</li>
                            <li><strong>{t('studios.loc_price')}</strong> {t('location.parking_price')}</li>
                            <li><strong>{t('studios.loc_lost')}</strong> {t('studios.loc_lost_desc')}</li>
                        </ul>
                    </div>
                    <div className="location-map-wrap" style={{ position: 'relative', overflow: 'hidden' }}>
                        <iframe 
                            src="https://maps.google.com/maps?q=%ED%95%8F%EA%B1%B8%EC%A6%88%EC%8A%A4%ED%8A%9C%EB%94%94%EC%98%A4&t=&z=16&ie=UTF8&iwloc=&output=embed" 
                            width="100%" 
                            height="100%" 
                            style={{ border: 0, filter: 'invert(90%) hue-rotate(180deg)' }} 
                            allowFullScreen="" 
                            loading="lazy"
                            title="FitGirls Map"
                        ></iframe>
                        <a 
                            href="https://map.naver.com/p/search/%ED%95%8F%EA%B1%B8%EC%A6%88%EC%8A%A4%ED%8A%9C%EB%94%94%EC%98%A4/place/1976065694?c=15.00,0,0,0,dh"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="map-overlay-btn"
                        >
                            🟢 {t('studios.loc_naver_map', '네이버 지도로 길찾기')} →
                        </a>
                    </div>
                </div>
            </section>

            <SupportCS />
            <Footer />
        </div>
    );
};

export default Studios;
