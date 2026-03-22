import React from 'react';
import { useTranslation } from 'react-i18next';
import FadeInSection from '../FadeInSection';
import './Partner.css';

const Partner = () => {
    const { t, i18n } = useTranslation();
    const isJapanese = i18n.language === 'ja';

    const title = t('partners.title');
    const subtitle = t('partners.subtitle');
    const shopName = t('partners.shop_name');
    const priceWomen = t('partners.price_women');
    const priceMen = t('partners.price_men');
    const notices = t('partners.notices', { returnObjects: true });

    // Contact Info
    const tel = t('partners.contact.tel');
    const address = t('partners.contact.address');
    const kakaoRaw = t('partners.contact.kakao_channel', { defaultValue: '' });
    const kakaoChannel = kakaoRaw && kakaoRaw.startsWith('http') ? kakaoRaw : '';
    const instaRaw = t('partners.contact.instagram', { defaultValue: '' });
    const instagram = instaRaw && instaRaw.startsWith('http') ? instaRaw : '';
    const lineRaw = t('partners.contact.line', { defaultValue: '' });
    const line = lineRaw && lineRaw.startsWith('http') ? lineRaw : '';

    return (
        <div className="container-inner partner-container">
            <FadeInSection className="section-header">
                <h2 className="section-title">{title}</h2>
            </FadeInSection>

            <FadeInSection delay={0.4}>
                <div className="partner-card">
                    {/* 상단: 샵 이름 + 가격 */}
                    <div className="partner-top">
                        <div className="partner-shop-info">
                            <h3 className="partner-shop-name">{shopName}</h3>
                        </div>
                        <div className="partner-price-box">
                            <div className="partner-price-item">
                                <span className="partner-price-label">{t('partners.women')}</span>
                                <span className="partner-price-value">{priceWomen}</span>
                                <span className="partner-price-tax">{t('partners.vat_included')}</span>
                            </div>
                            <div className="partner-price-divider" />
                            <div className="partner-price-item">
                                <span className="partner-price-label">{t('partners.men')}</span>
                                <span className="partner-price-value">{priceMen}</span>
                                <span className="partner-price-tax">{t('partners.vat_included')}</span>
                            </div>
                        </div>
                    </div>

                    {/* 안내 사항 */}
                    <div className="partner-notices">
                        {Array.isArray(notices) && notices.map((notice, idx) => (
                            <div key={idx} className="partner-notice-item">
                                <span className="partner-notice-dot">•</span>
                                <span>{notice}</span>
                            </div>
                        ))}
                    </div>

                    {/* 연락처 */}
                    <div className="partner-contact-grid">
                        <div className="partner-contact-item">
                            <span className="partner-contact-label">TEL</span>
                            <span className="partner-contact-value">{tel}</span>
                        </div>
                        <div className="partner-contact-item">
                            <span className="partner-contact-label">LOCATION</span>
                            <span className="partner-contact-value">{address}</span>
                        </div>
                    </div>

                    {/* 링크 버튼 */}
                    <div className="partner-links">
                        {kakaoChannel && !isJapanese && (
                            <a href={kakaoChannel} target="_blank" rel="noopener noreferrer" className="partner-link-btn kakao">
                                <span className="partner-link-icon">💬</span>
                                KakaoTalk
                            </a>
                        )}
                        {line && (
                            <a href={line} target="_blank" rel="noopener noreferrer" className="partner-link-btn line">
                                <span className="partner-link-icon">💚</span>
                                LINE
                            </a>
                        )}
                        {instagram && (
                            <a href={instagram} target="_blank" rel="noopener noreferrer" className="partner-link-btn insta">
                                <span className="partner-link-icon">📷</span>
                                Instagram
                            </a>
                        )}
                    </div>

                    {/* 이동된 필수 안내 */}
                    <div className="partner-alert bottom">
                        <span className="partner-alert-icon">📌</span>
                        <span className="partner-alert-text" dangerouslySetInnerHTML={{ __html: t('partners.alert') }} />
                    </div>
                </div>
            </FadeInSection>
        </div>
    );
};

export default Partner;
