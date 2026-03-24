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

    const changeLanguage = (lng) => {
        i18n.changeLanguage(lng);
    };

    const handleScroll = (e) => {
        setIsScrolled(e.target.scrollTop > 50);
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
