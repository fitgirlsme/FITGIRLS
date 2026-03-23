import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getData, STORES } from '../utils/db';
import FadeInSection from '../components/FadeInSection';
import './Partners.css';

const Partners = () => {
    const { t } = useTranslation();
    const [activeCategory, setActiveCategory] = useState('all');
    const [partners, setPartners] = useState([]);
    const [loading, setLoading] = useState(true);

    const categories = [
        { id: 'all', label: t('partners.categories.all', 'ALL') },
        { id: 'fitness', label: t('partners.categories.fitness', 'FITNESS') },
        { id: 'pilates', label: t('partners.categories.pilates', 'PILATES') },
    ];

    useEffect(() => {
        loadPartners();
    }, []);

    const loadPartners = async () => {
        setLoading(true);
        try {
            const data = await getData(STORES.PARTNERS);
            if (data && data.length > 0) {
                setPartners(data);
            } else {
                // Initial Sample Data if DB is empty
                setPartners([
                    {
                        id: 'sample-1',
                        category: 'fitness',
                        name: t('partners.partner1.name', '프리미엄 피트니스 A'),
                        description: t('partners.partner1.desc', '최고급 시설과 전문적인 코칭 시스템을 갖춘 도심 속 웰니스 공간입니다.'),
                        images: ["https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=1000"],
                        trainers: [
                            {
                                name: "김철수",
                                role: t('partners.partner1.role1', '수석 트레이너'),
                                bio: t('partners.partner1.bio1', '체형 교정 및 바디 프로필 전문 코치'),
                                image: "https://images.unsplash.com/photo-1567013127542-490d757e51fe?auto=format&fit=crop&q=80&w=200"
                            }
                        ]
                    }
                ]);
            }
        } catch (err) {
            console.error('Failed to load partners:', err);
        }
        setLoading(false);
    };

    const filteredPartners = activeCategory === 'all' 
        ? partners 
        : partners.filter(p => p.category === activeCategory);

    return (
        <div className="partners-page">
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
                    <FadeInSection key={partner.id || pIdx} delay={pIdx * 0.1}>
                        <section className="partner-item">
                            <div className="partner-info">
                                <h2 className="partner-name">{partner.name}</h2>
                                <p className="partner-description">{partner.description}</p>
                                
                                {partner.images && partner.images.length > 0 && (
                                    <div className="partner-gallery">
                                        {partner.images.map((img, idx) => (
                                            <div key={idx} className="gallery-img-wrapper">
                                                <img src={img} alt={`${partner.name} ${idx + 1}`} loading="lazy" />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {partner.trainers && partner.trainers.length > 0 && (
                                <div className="trainer-section">
                                    <h3>{t('partners.trainers', 'Our Trainers')}</h3>
                                    <div className="trainer-grid">
                                        {partner.trainers.map((trainer, tIdx) => (
                                            <div key={tIdx} className="trainer-card">
                                                <div className="trainer-photo">
                                                    {trainer.image && <img src={trainer.image} alt={trainer.name} loading="lazy" />}
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
                        </section>
                    </FadeInSection>
                )) : (
                    <div className="no-partners">{t('partners.no_results', 'No partners found in this category.')}</div>
                )}
            </div>
        </div>
    );
};

export default Partners;
