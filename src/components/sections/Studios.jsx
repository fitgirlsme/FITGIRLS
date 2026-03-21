import React from 'react';
import { useTranslation } from 'react-i18next';
import FadeInSection from '../FadeInSection';
import './Studios.css';

const Studios = () => {
    const { t } = useTranslation();
    const zones = [
        'blackmoon', 'blackwall', 'sofa', 'yellow', 
        'cake', 'blue', 'pink', 'curtain', 
        'natural', 'mirror', 'jennie', 'red'
    ];

    return (
        <section className="studios-section" id="studios">
            <div className="container-inner">
                <FadeInSection className="studios-header">
                    <h2 className="section-title">{t('studios.title')}</h2>
                    <p className="section-subtitle">{t('studios.subtitle')}</p>
                </FadeInSection>

                <div className="zones-grid">
                    {zones.map((zone, index) => (
                        <FadeInSection key={zone} delay={0.05 * index} className="zone-card">
                            <div className="zone-image-placeholder">
                                {t(`studios.zones.${zone}`)}
                            </div>
                            <div className="zone-info">
                                <span className="zone-name">{t(`studios.zones.${zone}`)}</span>
                                <span className="zone-tag">Studio Zone</span>
                            </div>
                        </FadeInSection>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Studios;
