import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { ogirlsDb } from '../utils/ogirlsFirebase';
import FadeInSection from '../components/FadeInSection';
import Header from '../components/Header';
import SupportCS from '../components/SupportCS';
import './Partners.css';

const Partners = () => {
    const { t, i18n } = useTranslation();
    const [activeCategory, setActiveCategory] = useState('all');
    const [fitgirlsPartners, setFitgirlsPartners] = useState([]);
    const [ogirlsPartners, setOgirlsPartners] = useState([]);
    const [partners, setPartners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedPartner, setSelectedPartner] = useState(null);
    const [isScrolled, setIsScrolled] = useState(false);
    const [isPartnerLoggedIn, setIsPartnerLoggedIn] = useState(localStorage.getItem('partnerSession') === 'active');
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [loginId, setLoginId] = useState('');
    const [loginPw, setLoginPw] = useState('');
    const [loginError, setLoginError] = useState('');
    const [copyToast, setCopyToast] = useState('');

    const changeLanguage = (lng) => {
        i18n.changeLanguage(lng);
    };

    const handleScroll = (e) => {
        setIsScrolled(e.target.scrollTop > 50);
    };

    const handleLogin = (e) => {
        e.preventDefault();
        if (loginId === 'fitgirls' && loginPw === 'fitgirls123') {
            setIsPartnerLoggedIn(true);
            localStorage.setItem('partnerSession', 'active');
            setShowLoginModal(false);
            setLoginError('');
        } else {
            setLoginError(t('partners.login_modal.error', 'Invalid ID or Password.'));
        }
    };

    const handleLogout = () => {
        setIsPartnerLoggedIn(false);
        localStorage.removeItem('partnerSession');
    };

    const categories = [
        { id: 'all', label: t('partners.categories.all', 'ALL') },
        { id: 'fitness', label: t('partners.categories.fitness', 'FITNESS') },
        { id: 'pilates', label: t('partners.categories.pilates', 'PILATES') },
    ];

    // 1. 핏걸즈 자체 파트너 구독
    useEffect(() => {
        const q = query(collection(db, 'partners'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                source: 'fitgirls',
                ...doc.data()
            }));
            setFitgirlsPartners(data);
        }, (err) => {
            console.error("[Partners] Fitgirls Firestore Listen Error:", err);
        });

        return () => unsubscribe();
    }, []);

    // 2. 오걸즈 제휴 피트니스 구독
    useEffect(() => {
        let unsubscribe = () => {};
        try {
            const q = query(collection(ogirlsDb, 'partner_fitness'));
            unsubscribe = onSnapshot(q, (snapshot) => {
                const data = snapshot.docs
                    .map(doc => {
                        const d = doc.data();
                        return {
                            id: `ogirls_${doc.id}`,
                            partnerId: doc.id,
                            source: 'ogirls',
                            name: d.gym_name || d.name || '공식 제휴 피트니스',
                            location: d.location || '',
                            category: d.category || (d.gym_name?.includes('필라테스') ? 'pilates' : 'fitness'),
                            benefit: d.benefit || '',
                            description: d.benefit ? `[제휴 혜택] ${d.benefit}` : (d.memo || 'FITGIRLS 공식 제휴 센터입니다.'),
                            images: d.images || (d.image_url ? [d.image_url] : []),
                            trainers: d.trainers || [],
                            bookingUrl: `https://book.fitgirls.me/partner?id=${doc.id}`,
                            instagram: d.instagram || '',
                            status: d.status || '제휴중',
                            createdAt: d.createdAt
                        };
                    })
                    .filter(item => item.status !== '종료'); // 종료된 제휴는 제외
                setOgirlsPartners(data);
            }, (err) => {
                console.error("[Partners] Ogirls Firestore Listen Error:", err);
            });
        } catch (err) {
            console.error("[Partners] Ogirls init error:", err);
        }

        return () => unsubscribe();
    }, []);

    // 3. 데이터 통합 및 중복 제거
    useEffect(() => {
        // 이름 기준 중복 방지 (핏걸즈에 등록된 것이 우선)
        const combined = [...fitgirlsPartners];
        const existingNames = new Set(fitgirlsPartners.map(p => (p.name || '').trim().toLowerCase()));

        for (const og of ogirlsPartners) {
            const normalized = (og.name || '').trim().toLowerCase();
            if (!existingNames.has(normalized)) {
                combined.push(og);
                existingNames.add(normalized);
            }
        }

        setPartners(combined);
        setLoading(false);
    }, [fitgirlsPartners, ogirlsPartners]);

    const filteredPartners = activeCategory === 'all' 
        ? partners 
        : partners.filter(p => p.category === activeCategory);

    const handleCopyPartnerLink = (url) => {
        if (!url) return;
        navigator.clipboard.writeText(url).then(() => {
            setCopyToast(t('partners.link_copied', '제휴 예약 링크가 복사되었습니다!'));
            setTimeout(() => setCopyToast(''), 2500);
        }).catch(() => {});
    };

    return (
        <div className="partners-page app-container" onScroll={handleScroll}>
            <Header 
                isScrolled={isScrolled} 
                isOnHero={false} 
                changeLanguage={changeLanguage} 
                currentLang={i18n.language} 
            />
            <div className="partners-content-wrapper">
                <header className="partners-header">
                    <FadeInSection>
                        <h1>{t('partners.title', 'Official Partners')}</h1>
                        <p className="partners-subtitle">{t('partners.subtitle', 'Meet our high-end fitness partners')}</p>
                    </FadeInSection>
                </header>

                <nav className="partners-tabs">
                    {categories.map(cat => (
                        <button 
                            key={cat.id} 
                            className={`tab-btn ${activeCategory === cat.id ? 'active' : ''}`}
                            onClick={() => setActiveCategory(cat.id)}
                        >
                            {cat.label}
                        </button>
                    ))}
                    {!isPartnerLoggedIn ? (
                        <button className="partner-login-btn" onClick={() => setShowLoginModal(true)}>
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                            </svg>
                            {t('partners.login_btn', '제휴사 전용')}
                        </button>
                    ) : (
                        <button className="partner-logout-btn" onClick={handleLogout}>
                            {t('partners.logout_btn', '로그아웃')}
                        </button>
                    )}
                </nav>

                <div className="partners-list">
                    {loading ? (
                        <div className="loading-state">{t('common.loading', 'Loading...')}</div>
                    ) : filteredPartners.length > 0 ? filteredPartners.map((partner, pIdx) => (
                        <FadeInSection key={partner.id || pIdx} delay={pIdx * 0.05}>
                            <div className="partner-item" onClick={() => setSelectedPartner(partner)}>
                                {partner.benefit && (
                                    <div className="partner-badge-tag">
                                        ✨ {t('partners.benefit_badge', '제휴 혜택')}
                                    </div>
                                )}
                                <div className="partner-thumb">
                                    {partner.images && partner.images.length > 0 ? (
                                        <img src={partner.images[0]} alt={partner.name} loading="lazy" />
                                    ) : (
                                        <div className="placeholder-thumb">
                                            <span className="placeholder-icon">🏢</span>
                                            <span className="placeholder-category">{(partner.category || 'FITNESS').toUpperCase()}</span>
                                        </div>
                                    )}
                                </div>
                                <div className="partner-info-compact">
                                    <h3 className="partner-name-compact">{partner.name}</h3>
                                    <p className="partner-location-compact">{partner.location}</p>
                                </div>
                            </div>
                        </FadeInSection>
                    )) : (
                        <div className="no-partners">{t('partners.no_results', 'No partners found in this category.')}</div>
                    )}
                </div>

                {/* Partner Benefits Section (Visible when logged in) */}
                {isPartnerLoggedIn && (
                    <FadeInSection>
                        <section className="partner-benefits-section">
                            <div className="benefits-header">
                                <span className="benefits-badge">PARTNER ONLY</span>
                                <h2>{t('partners.benefits.title', 'FITGIRLS & INAFIT Partnership Proposal')}</h2>
                                <p>{t('partners.benefits.subtitle', 'The ultimate visual partnership for fitness centers')}</p>
                            </div>

                            <div className="benefits-grid">
                                <div className="benefit-card premium">
                                    <div className="benefit-icon">🎁</div>
                                    <h3>{t('partners.benefits.member_title', 'Member Benefits')}</h3>
                                    <ul>
                                        <li>
                                            <strong>{t('partners.benefits.member_basic', 'Basic 20% Discount')}</strong>
                                            <p>{t('partners.benefits.member_basic_desc', '20% discount on all shoots for members of partnered centers')}</p>
                                        </li>
                                        <li>
                                            <strong>{t('partners.benefits.member_acc', '30% Discount for 5+ Members')}</strong>
                                            <p>{t('partners.benefits.member_acc_desc', '30% discount starting from the 6th member after 5 completed shoots')}</p>
                                        </li>
                                    </ul>
                                </div>

                                <div className="benefit-card premium">
                                    <div className="benefit-icon">⭐</div>
                                    <h3>{t('partners.benefits.center_title', 'Center Rewards')}</h3>
                                    <ul>
                                        <li>
                                            <strong>{t('partners.benefits.center_voucher', 'Free Shoot Voucher for every 5 members')}</strong>
                                            <p>{t('partners.benefits.center_voucher_desc', 'One \'2-concept body profile shoot voucher\' for every 5 members')}</p>
                                        </li>
                                        <li>
                                            <strong>{t('partners.benefits.center_marketing', 'Marketing Support')}</strong>
                                            <p>{t('partners.benefits.center_marketing_desc', 'Access to high-quality photos for center marketing purposes')}</p>
                                        </li>
                                    </ul>
                                </div>

                                <div className="benefit-card premium">
                                    <div className="benefit-icon">👤</div>
                                    <h3>{t('partners.benefits.trainer_title', 'Trainer Special')}</h3>
                                    <ul>
                                        <li>
                                            <strong>{t('partners.benefits.trainer_gift', 'Welcome Gift')}</strong>
                                            <p>{t('partners.benefits.trainer_gift_desc', 'One \'Professional Profile 1-concept shoot voucher (2 retouched photos)\' for trainers upon partnership')}</p>
                                        </li>
                                        <li>
                                            <strong>{t('partners.benefits.trainer_friendship', 'Commemorative Cut Service')}</strong>
                                            <p>{t('partners.benefits.trainer_friendship_desc', 'Free \'Friendship Mini Concept\' shoot and 1 retouched photo for trainer during member\'s shoot')}</p>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </section>
                    </FadeInSection>
                )}

                {/* Login Modal */}
                {showLoginModal && (
                    <div className="partner-login-overlay" onClick={() => setShowLoginModal(false)}>
                        <div className="partner-login-modal" onClick={e => e.stopPropagation()}>
                            <button className="close-login" onClick={() => setShowLoginModal(false)}>×</button>
                            <h3>{t('partners.login_modal.title', 'Partner Login')}</h3>
                            <p>{t('partners.login_modal.subtitle', 'Please login to view exclusive benefits.')}</p>
                            <form onSubmit={handleLogin}>
                                <div className="input-group">
                                    <input 
                                        type="text" 
                                        placeholder={t('partners.login_modal.id_placeholder', 'ID')} 
                                        value={loginId}
                                        onChange={e => setLoginId(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="input-group">
                                    <input 
                                        type="password" 
                                        placeholder={t('partners.login_modal.pw_placeholder', 'Password')} 
                                        value={loginPw}
                                        onChange={e => setLoginPw(e.target.value)}
                                        required
                                    />
                                </div>
                                {loginError && <p className="login-error">{loginError}</p>}
                                <button type="submit" className="login-submit">{t('partners.login_modal.submit', 'Login')}</button>
                            </form>
                        </div>
                    </div>
                )}

                {/* Partner Detail Modal */}
                {selectedPartner && (
                    <div className="partner-modal-overlay" onClick={() => setSelectedPartner(null)}>
                        <div className="partner-modal-content" onClick={e => e.stopPropagation()}>
                            <button className="close-modal" onClick={() => setSelectedPartner(null)}>×</button>
                            
                            <div className="modal-header">
                                <span className="modal-location">{selectedPartner.location}</span>
                                <h2>{selectedPartner.name}</h2>
                                {selectedPartner.category && (
                                    <span className="modal-category-badge">{selectedPartner.category.toUpperCase()}</span>
                                )}
                            </div>

                            {/* 제휴 혜택 배너 (오걸즈 및 파트너 혜택 있는 경우) */}
                            {selectedPartner.benefit && (
                                <div className="modal-benefit-banner">
                                    <div className="benefit-banner-icon">🎁</div>
                                    <div className="benefit-banner-text">
                                        <strong>{t('partners.benefit_title', '제휴 회원 특별 혜택')}</strong>
                                        <p>{selectedPartner.benefit}</p>
                                    </div>
                                </div>
                            )}

                            <p className="modal-description">{selectedPartner.description}</p>

                            {/* 예약 및 제휴 링크 바로가기 액션 영역 */}
                            <div className="modal-partner-actions">
                                {selectedPartner.bookingUrl ? (
                                    <button 
                                        className="partner-booking-btn"
                                        onClick={() => window.open(selectedPartner.bookingUrl, '_blank')}
                                    >
                                        <span>📅 {t('partners.book_with_benefit', '제휴 혜택으로 촬영 예약하기')}</span>
                                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                                    </button>
                                ) : (
                                    <button 
                                        className="partner-booking-btn"
                                        onClick={() => window.open('/reservation', '_blank')}
                                    >
                                        <span>📅 {t('partners.book_general', '촬영 예약하기')}</span>
                                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                                    </button>
                                )}
                                {selectedPartner.bookingUrl && (
                                    <button 
                                        className="partner-share-btn"
                                        onClick={() => handleCopyPartnerLink(selectedPartner.bookingUrl)}
                                        title="제휴 예약 링크 복사"
                                    >
                                        🔗 {t('partners.copy_link', '제휴 링크 복사')}
                                    </button>
                                )}
                                {selectedPartner.instagram && (
                                    <button 
                                        className="partner-share-btn instagram"
                                        onClick={() => window.open(`https://instagram.com/${selectedPartner.instagram.replace('@', '')}`, '_blank')}
                                    >
                                        📷 Instagram
                                    </button>
                                )}
                            </div>

                            {selectedPartner.images && selectedPartner.images.length > 1 && (
                                <div className="modal-gallery-section">
                                    <h3 className="modal-section-title">{t('partners.gallery', 'Gallery')}</h3>
                                    <div className="modal-gallery">
                                        {selectedPartner.images.slice(1).map((img, idx) => (
                                            <img key={idx} src={img} alt={`${selectedPartner.name} gallery ${idx}`} loading="lazy" />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {selectedPartner.trainers && selectedPartner.trainers.length > 0 && (
                                <div className="modal-trainers-section">
                                    <h3 className="modal-section-title">{t('partners.trainers', 'Our Trainers')}</h3>
                                    <div className="trainer-grid">
                                        {selectedPartner.trainers.map((trainer, tIdx) => (
                                            <div key={tIdx} className="trainer-card">
                                                <div className="trainer-photo">
                                                    {trainer.image ? (
                                                        <img src={trainer.image} alt={trainer.name} loading="lazy" />
                                                    ) : (
                                                        <div className="trainer-placeholder">👤</div>
                                                    )}
                                                </div>
                                                <div className="trainer-details">
                                                    <h4>{trainer.name}</h4>
                                                    <span className="trainer-role">{trainer.role}</span>
                                                    <p className="trainer-bio">{trainer.bio}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Toast Notification */}
                {copyToast && (
                    <div className="partner-toast">
                        {copyToast}
                    </div>
                )}
            </div>
            <SupportCS />
        </div>
    );
};

export default Partners;
