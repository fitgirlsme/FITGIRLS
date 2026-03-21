import React from 'react';
import { useTranslation } from 'react-i18next';
import FadeInSection from '../FadeInSection';
import './Notice.css';

const Notice = () => {
    const { t } = useTranslation();
    const noticeItems = t('notice.items', { returnObjects: true });

    return (
        <section className="notice-section" id="notice">
            <div className="container-inner">
                <FadeInSection className="notice-header">
                    <h2 className="section-title">{t('notice.title')}</h2>
                    <p className="section-subtitle">{t('notice.subtitle')}</p>
                </FadeInSection>

                <div className="notice-list">
                    {Array.isArray(noticeItems) && noticeItems.map((item, index) => (
                        <FadeInSection key={index} delay={0.2 * (index + 1)} className="notice-item">
                            <span className="notice-date">{item.date}</span>
                            <h3 className="notice-title">{item.title}</h3>
                            <div className="notice-arrow">→</div>
                        </FadeInSection>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Notice;
