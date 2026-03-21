import React from 'react';
import { useTranslation } from 'react-i18next';
import FadeInSection from '../FadeInSection';
import './Lookbook.css';

const Lookbook = () => {
    const { t } = useTranslation();

    const categories = [
        { id: 'fitorialist', title: 'FITORIALIST' },
        { id: 'artist', title: 'ARTIST' },
        { id: 'fashion', title: 'FASHION & BEAUTY' },
        { id: 'portrait', title: 'PORTRAIT' }
    ];

    return (
        <section className="lookbook-section" id="lookbook">
            <div className="container-inner">
                <FadeInSection className="lookbook-header">
                    <h2 className="section-title">{t('lookbook.title')}</h2>
                    <p className="section-subtitle">{t('lookbook.subtitle')}</p>
                </FadeInSection>

                <div className="lookbook-categories">
                    {categories.map((cat, idx) => (
                        <FadeInSection key={cat.id} delay={0.1 * idx} className="lookbook-category-item">
                            <div className="lookbook-image-box">
                                <div className="lookbook-image-placeholder">
                                    {cat.title}
                                </div>
                                <div className="lookbook-info-overlay">
                                    <span className="l-tag">Photography Style</span>
                                    <h3 className="l-title">{cat.title}</h3>
                                    <p className="l-desc">{t(`lookbook.${cat.id}`)}</p>
                                </div>
                            </div>
                        </FadeInSection>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Lookbook;
