import React from 'react';
import { useTranslation } from 'react-i18next';
import FadeInSection from './FadeInSection';
import './HM.css';

const HM = () => {
    const { t } = useTranslation();

    return (
        <section className="snap-section hairmakeup-container" id="hair-makeup">
            <div className="container-inner hairmakeup-inner">
                <header className="hairmakeup-header">
                    <div className="hairmakeup-header-left">
                        <h2 className="hairmakeup-title">HAIR & MAKEUP</h2>
                    </div>
                    <div className="hairmakeup-header-right">
                        <span className="hairmakeup-subtitle">{t('hm.subtitle')}</span>
                    </div>
                </header>

                <FadeInSection delay={0.2}>
                    <div className="hairmakeup-card">
                        <h3 className="hairmakeup-shop-name">{t('hm.shop_name')}</h3>
                        
                        <div className="hairmakeup-desc-box">
                            <p className="hairmakeup-desc">
                                {t('hm.desc1')}<br />
                                {t('hm.desc2')}<br />
                                {t('hm.desc3')}<br />
                                <span className="hairmakeup-notice-label">{t('hm.direct_booking')}</span><br />
                                <span className="hairmakeup-notice-sub">{t('hm.outcall_notice')}</span>
                            </p>
                        </div>

                        <div className="hairmakeup-price-list">
                            <div className="hairmakeup-price-row">
                                <span className="label">{t('hm.female')}</span>
                                <span className="price">{t('hm.price_female')} <small>{t('hm.vat_included')}</small></span>
                            </div>
                            <div className="hairmakeup-price-row">
                                <span className="label">{t('hm.male')}</span>
                                <span className="price">{t('hm.price_male')} <small>{t('hm.vat_included')}</small></span>
                            </div>
                        </div>

                        <div className="hairmakeup-info">
                            <div className="hairmakeup-info-row">
                                <span className="info-label">{t('hm.address_label')}</span>
                                <span className="info-value">{t('hm.address_value')}</span>
                            </div>
                        </div>

                        <div className="hairmakeup-buttons">
                            <a 
                                href="https://pf.kakao.com/_QPjsxb" 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="hairmakeup-btn kakao"
                            >
                                {t('hm.kakao')}
                            </a>
                            <a 
                                href="https://www.instagram.com/mabelle_korea_" 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="hairmakeup-btn insta"
                            >
                                {t('hm.insta')}
                            </a>
                        </div>
                    </div>
                </FadeInSection>
            </div>
        </section>
    );
};

export default HM;
