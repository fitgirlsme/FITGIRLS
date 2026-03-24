import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../utils/firebase';
import FadeInSection from '../components/FadeInSection';
import Header from '../components/Header';
import SupportCS from '../components/SupportCS';
import './Partners.css';

const Partners = () => {
    const { t, i18n } = useTranslation();
    const [activeCategory, setActiveCategory] = useState('all');
    const [partners, setPartners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedPartner, setSelectedPartner] = useState(null);
    const [isScrolled, setIsScrolled] = useState(false);
    const [isPartnerLoggedIn, setIsPartnerLoggedIn] = useState(localStorage.getItem('partnerSession') === 'active');
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [loginId, setLoginId] = useState('');
    const [loginPw, setLoginPw] = useState('');
    const [loginError, setLoginError] = useState('');

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

    useEffect(() => {
        setLoading(true);
        const q = query(collection(db, 'partners'), orderBy('createdAt', 'desc'));
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setPartners(data);
            setLoading(false);
        }, (err) => {
            console.error("[Partners] Firestore Listen Error:", err);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const filteredPartners = activeCategory === 'all' 
        ? partners 
        : partners.filter(p => p.category === activeCategory);

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
                                <div className="partner-thumb">
                                    {partner.images && partner.images.length > 0 ? (
                                        <img src={partner.images[0]} alt={partner.name} loading="lazy" />
                                    ) : (
                                        <div className="placeholder-thumb">🏢</div>
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
                            </div>

                            <p className="modal-description">{selectedPartner.description}</p>

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
            </div>
            <SupportCS />
        </div>
    );
};

export default Partners;
