import React from 'react';
import { useTranslation } from 'react-i18next';
import FadeInSection from '../FadeInSection';
import './HM.css';

const HM = () => {
    const { t } = useTranslation();

    return (
        <section className="hm-section" id="hm">
            <div className="container-inner">
                <FadeInSection className="hm-header">
                    <h2 className="section-title">{t('hm.title')}</h2>
                    <p className="section-subtitle">{t('hm.subtitle')}</p>
                </FadeInSection>

                <div className="hm-content-grid">
                    <FadeInSection delay={0.2} className="hm-info-card">
                        <div className="hm-badge">PARTNERSHIP</div>
                        <h3 className="partner-name">{t('hm.partner')}</h3>
                        <div className="price-info">
                            <div className="price-item">
                                <span className="p-label">{t('partners.women')}</span>
                                <span className="p-value">{t('hm.price_women')}</span>
                            </div>
                            <div className="price-item">
                                <span className="p-label">{t('partners.men')}</span>
                                <span className="p-value">{t('hm.price_men')}</span>
                            </div>
                            <p className="vat-notice">* {t('hm.vat')}</p>
                        </div>
                        <ul className="hm-notices">
                            <li>{t('hm.notice')}</li>
                        </ul>
                    </FadeInSection>

                    <FadeInSection delay={0.4} className="hm-contact-card">
                        <div className="contact-item">
                            <span className="c-label">Location.</span>
                            <p className="c-value">{t('hm.location')}</p>
                        </div>
                        <div className="contact-item">
                            <span className="c-label">Tel.</span>
                            <p className="c-value">{t('hm.tel')}</p>
                        </div>
                        <div className="hm-actions">
                            <a href="https://pf.kakao.com/_QPjsxb" target="_blank" rel="noopener noreferrer" className="hm-btn kakao">
                                KakaoTalk 문의하기
                            </a>
                            <a href="https://www.instagram.com/mabelle_korea_" target="_blank" rel="noopener noreferrer" className="hm-btn insta">
                                Instagram
                            </a>
                        </div>
                    </FadeInSection>
                </div>
            </div>
        </section>
    );
};

export default HM;
