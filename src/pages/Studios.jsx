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

const bookingSteps = {
    ko: [
        { step: '1단계', title: '예약 신청 및 확정', desc: '실시간 예약하기 링크나 카카오톡 상담을 통해 일정 조율 및 예약금 결제' },
        { step: '2단계', title: '스타일링 설문 작성', desc: '핏걸즈 전담 디렉터가 제공하는 무드/의상 컨셉 설문 조사 작성 및 상담' },
        { step: '3단계', title: '촬영일 방문 & 촬영', desc: '헤어/메이크업(선택 패키지 시) 및 수십 벌의 무료 의상 피팅 후 촬영 진행' },
        { step: '4단계', title: '원본 수령 및 셀렉', desc: '촬영 직후 원본 전체 수령 후, 보정할 컷을 셀렉하여 보정 요청 등록' }
    ],
    en: [
        { step: 'Step 1', title: 'Request & Confirm Booking', desc: 'Coordinate schedules and make a deposit via global reservation or WhatsApp.' },
        { step: 'Step 2', title: 'Concept Survey', desc: 'Fill out the styling & mood preference survey provided by our art director.' },
        { step: 'Step 3', title: 'Photoshoot & Rental', desc: 'Visit our Gangnam studio, select from 80+ backdrops and free outfits, and shoot.' },
        { step: 'Step 4', title: 'Photo Selection', desc: 'Receive all raw files, select your favorite cuts, and request final retouching.' }
    ],
    ja: [
        { step: 'Step 1', title: '予約申請と確定', desc: '予約ページまたはLINE公式アカウントよりスケジュール調整後、予約金の支払い。' },
        { step: 'Step 2', title: 'コンセプトアンケート', desc: 'アートディレクターが提供するスタイリングおよびムードの事前アンケートの作成。' },
        { step: 'Step 3', title: '撮影当日の訪問と撮影', desc: '無料レンタル衣装や背景コンセプト（80種類以上）を選び、ポージング指導付きで撮影。' },
        { step: 'Step 4', title: '写真セレクト＆レタッチ', desc: '撮影後、全オリジナルデータを受領。レタッチカットを選択しレタッチ申請。' }
    ],
    zh: [
        { step: '第一步', title: '预约申请与确认', desc: '通过在线预约或微信客服沟通档期并支付预约金进行预订。' },
        { step: '第二步', title: '填写造型问卷', desc: '填写由艺术总监提供的个人风格与拍摄主题偏好问卷并进行沟通。' },
        { step: '第三步', title: '到店拍摄与免费租借', desc: '到店进行发型化妆，挑选数几十套免费服装，在80多个场景进行拍摄。' },
        { step: '第四步', title: '选片与精修', desc: '拍摄后收到全部原片，挑选需要精修的照片并提交精修申请。' }
    ]
};

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
                        {(t('studios.purpose_chips', { returnObjects: true }) || []).map((pt, pIdx) => (
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
                                        href={currentLang && currentLang !== 'ko' ? `/${currentLang}/lookbook` : '/lookbook'} 
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
                            <li><strong>{t('studios.loc_lost')}</strong> {t('studios.loc_lost_desc')}</li>
                        </ul>

                        <div className="parking-alert-box" style={{
                            marginTop: '20px',
                            padding: '16px 20px',
                            background: 'rgba(255, 0, 60, 0.08)',
                            border: '1px dashed #FF003C',
                            borderRadius: '10px',
                            color: '#e5e5e5',
                            fontSize: '0.92rem',
                            lineHeight: '1.6'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                <span style={{ fontSize: '1.2rem' }}>🚗</span>
                                <strong style={{ color: '#FF003C', fontSize: '1rem' }}>
                                    {currentLang === 'en' ? 'Parking Guide (Not Available inside building)' : 
                                     currentLang === 'ja' ? '駐車場のご案内（ビル内駐車不可）' :
                                     currentLang === 'zh' ? '停车指南（大楼内无法停车）' : '자가용 및 주차 안내 (건물 내 주차 불가)'}
                                </strong>
                            </div>
                            <p style={{ margin: '0 0 10px 0', color: '#ccc', wordBreak: 'keep-all', lineHeight: '1.7' }}>
                                {currentLang && currentLang !== 'ko' ? (
                                    t('studios.loc_parking_desc', '본 스튜디오 건물(아티움빌딩)은 주차가 불가합니다. 자가용 이용 시 인근의 \'두원빌딩 유료주차장\'(서울특별시 강남구 강남대로 636 두원빌딩, 도보 2분 거리)을 이용해주시기 바랍니다.')
                                ) : (
                                    <>
                                        본 스튜디오 건물(아티움빌딩)은 주차가 불가합니다. 자가용 이용 시 인근의 <strong style={{ color: '#FF003C', fontSize: '1.02rem', textDecoration: 'underline', textUnderlineOffset: '4px', fontWeight: 'bold' }}>'두원빌딩 유료주차장'</strong>(서울특별시 강남구 강남대로 636 두원빌딩, 도보 2분 거리)을 이용해주시기 바랍니다.
                                    </>
                                )}
                            </p>
                            <div style={{ 
                                padding: '8px 12px', 
                                background: 'rgba(255, 255, 255, 0.05)', 
                                borderRadius: '6px',
                                borderLeft: '3px solid #FF003C',
                                display: 'inline-block',
                                width: '100%',
                                boxSizing: 'border-box'
                            }}>
                                <strong style={{ color: '#ffffff', marginRight: '8px' }}>
                                    {currentLang === 'en' ? 'Parking Fee:' : 
                                     currentLang === 'ja' ? '駐車料金:' :
                                     currentLang === 'zh' ? '停车费用:' : '주차 요금 정보:'}
                                </strong>
                                <span style={{ color: '#FF003C', fontWeight: 'bold', fontSize: '0.98rem' }}>
                                    {t('location.parking_price', '60분 3,000원 / 120분 6,000원 / 240분 9,000원')}
                                </span>
                            </div>
                        </div>
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

            {/* 10. RESERVATION GUIDE SECTION [NEW] */}
            <section className="studios-section studios-booking-guide-section">
                <div className="studios-section-header">
                    <span className="studios-section-number">Why 12</span>
                    <h2 className="studios-section-title">
                        {currentLang === 'en' ? 'Easy Booking & Shoot Process' : 
                         currentLang === 'ja' ? '簡単な予約と撮影プロセス' :
                         currentLang === 'zh' ? '简单便捷的预约与拍摄流程' : '간편한 예약 방법 및 촬영 진행 단계'}
                    </h2>
                    <p className="studios-section-desc">
                        {currentLang === 'en' ? 'Follow these simple steps from scheduling to receiving your premium photos.' : 
                         currentLang === 'ja' ? '予約から撮影、最終レタッチ本受領までの流れをわかりやすく説明します。' :
                         currentLang === 'zh' ? '从预订、沟通、拍摄到最终精修照片收取的完整步骤说明。' : '예약부터 촬영, 그리고 최종 보정본 수령까지의 간결한 흐름을 정리해 드립니다.'}
                    </p>
                </div>

                <div className="booking-table-wrapper">
                    <table className="booking-process-table">
                        <thead>
                            <tr>
                                <th>{currentLang === 'en' ? 'Step' : currentLang === 'ja' ? '段階' : currentLang === 'zh' ? '步骤' : '진행 단계'}</th>
                                <th>{currentLang === 'en' ? 'Process Name' : currentLang === 'ja' ? 'プロセス名' : currentLang === 'zh' ? '流程名称' : '예약/촬영 절차'}</th>
                                <th>{currentLang === 'en' ? 'Details' : currentLang === 'ja' ? '詳細説明' : currentLang === 'zh' ? '详细说明' : '상세 진행 내용'}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(bookingSteps[currentLang] || bookingSteps.ko).map((item, idx) => (
                                <tr key={idx}>
                                    <td className="step-col">
                                        <span className="step-badge">{item.step}</span>
                                    </td>
                                    <td className="title-col"><strong>{item.title}</strong></td>
                                    <td className="desc-col">
                                        {item.desc}
                                        {idx === 1 && (
                                            <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                <div>
                                                    <a 
                                                        href="/checklist" 
                                                        target="_blank" 
                                                        rel="noopener noreferrer" 
                                                        style={{ 
                                                            color: '#FF003C', 
                                                            textDecoration: 'underline', 
                                                            fontWeight: 'bold',
                                                            display: 'inline-block'
                                                        }}
                                                    >
                                                        {currentLang === 'en' ? '👉 Go to Styling Survey' : 
                                                         currentLang === 'ja' ? '👉 スタイル調査表へ' :
                                                         currentLang === 'zh' ? '👉 前往填写造型问卷' : '👉 스타일링 설문 작성하기'}
                                                    </a>
                                                </div>
                                                <div>
                                                    <a 
                                                        href="https://script.google.com/macros/s/AKfycbya6YpPKoWUYZfcDGP8C-W1zKwvpkAeGHETSGfx0pbK6RtI-WTxhV0Po3T3O54pHNgvsA/exec"
                                                        target="_blank" 
                                                        rel="noopener noreferrer" 
                                                        style={{ 
                                                            color: '#00E676', 
                                                            textDecoration: 'underline', 
                                                            fontWeight: 'bold',
                                                            display: 'inline-block'
                                                        }}
                                                    >
                                                        {currentLang === 'en' ? '👉 Upload Moodboard/Outfits (approx. 2 weeks before shoot)' : 
                                                         currentLang === 'ja' ? '👉 撮影イメージのアップロード（撮影の2週間前までに）' :
                                                         currentLang === 'zh' ? '👉 上传拍摄意向图（请于拍摄前2周左右上传）' : '👉 촬영 시안 및 의상 업로드 (촬영 2주 전 권장)'}
                                                    </a>
                                                </div>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="booking-deposit-info">
                    <div className="booking-deposit-title">
                        💳 {currentLang === 'en' ? 'Deposit Information' : 
                            currentLang === 'ja' ? '予約金入金のご案内' :
                            currentLang === 'zh' ? '预约金支付说明' : '예약금 입금 안내'}
                    </div>
                    <div className="booking-deposit-details">
                        <div className="booking-deposit-amount">
                            {currentLang === 'en' ? 'Deposit Amount: ' : 
                             currentLang === 'ja' ? '予約金額: ' :
                             currentLang === 'zh' ? '预约金额: ' : '입금액: '}
                            <strong>
                                {currentLang === 'en' ? '90,000 KRW' : 
                                 currentLang === 'ja' ? '90,000 KRW' :
                                 currentLang === 'zh' ? '90,000 KRW' : '90,000원'}
                            </strong>
                        </div>
                        <div className="booking-deposit-account">
                            {currentLang === 'en' ? 'Woori Bank / 010-4696-1434 / Chulmin Shin(Fitgirls)' : 
                             currentLang === 'ja' ? 'ウリ銀行 / 010-4696-1434 / チョルミン・シン(Fitgirls)' :
                             currentLang === 'zh' ? '友利银行 / 010-4696-1434 / 申哲民(핏걸즈)' : '우리은행 / 010.4696.1434 / 신철민(핏걸즈)'}
                        </div>
                    </div>
                </div>

                <div className="booking-guide-actions" style={{ display: 'flex', justifyContent: 'center', marginTop: '32px' }}>
                    <button 
                        className="btn-primary" 
                        onClick={() => {
                            if (currentLang === 'en' || currentLang === 'ja' || currentLang === 'zh') {
                                navigate('/global-booking');
                            } else {
                                window.open('https://naver.me/GWeuhE37', '_blank', 'noopener,noreferrer');
                            }
                        }}
                        style={{ padding: '16px 36px', fontSize: '1.05rem' }}
                    >
                        📅 {currentLang === 'en' ? 'Book Online Now' : currentLang === 'ja' ? 'オンライン予約' : currentLang === 'zh' ? '立即在线预约' : '실시간 예약하기'}
                    </button>
                </div>
            </section>

            <SupportCS />
            <Footer />
        </div>
    );
};

export default Studios;
