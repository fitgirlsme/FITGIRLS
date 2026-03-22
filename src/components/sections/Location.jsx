import React from 'react';
import { useTranslation } from 'react-i18next';
import FadeInSection from '../FadeInSection';
import './Location.css';

const Location = () => {
    const { t } = useTranslation();
    const loc = t('location', { returnObjects: true });

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text).catch(() => {});
    };

    return (
        <div className="container-inner location-container">
            <FadeInSection className="section-header">
                <h2 className="section-title">{loc.title}</h2>
                <p className="section-subtitle">{loc.subtitle}</p>
            </FadeInSection>

            {/* 스튜디오 카드 */}
            <FadeInSection delay={0.2}>
                <div className="location-card">
                    <h3 className="location-card-title">{loc.studio_name}</h3>
                    <div className="location-address-row">
                        <p className="location-address" style={{ whiteSpace: 'pre-line' }}>{loc.address}</p>
                        <button
                            className="location-copy-btn"
                            onClick={(e) => { e.stopPropagation(); copyToClipboard(loc.address_copy || loc.address); }}
                            title="Copy"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                            </svg>
                        </button>
                    </div>
                    <a
                        href={loc.links.studio_map}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="location-naver-btn"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                            <polyline points="9 22 9 12 15 12 15 22"/>
                        </svg>
                        {loc.btn_studio}
                    </a>
                </div>
            </FadeInSection>

            {/* 주차 안내 카드 */}
            <FadeInSection delay={0.4}>
                <div className="location-card">
                    <h3 className="location-card-title">{loc.parking_title}</h3>
                    <div className="location-parking-notices">
                        {Array.isArray(loc.parking_notices) && loc.parking_notices.map((notice, idx) => (
                            <p key={idx} className="location-parking-notice">* {notice}</p>
                        ))}
                    </div>

                    <div className="location-divider" />

                    <h4 className="location-parking-name">{loc.parking_name}</h4>
                    <div className="location-address-row">
                        <p className="location-address">{loc.parking_address}</p>
                        <button
                            className="location-copy-btn"
                            onClick={(e) => { e.stopPropagation(); copyToClipboard(loc.parking_address); }}
                            title="Copy"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                            </svg>
                        </button>
                    </div>
                    <p className="location-parking-distance">{loc.parking_distance}</p>
                    <p className="location-parking-price">{loc.parking_price}</p>
                    <div className="location-parking-warning">
                        <p>* {loc.parking_warning}</p>
                    </div>
                    {loc.links?.parking_map && (
                        <a
                            href={loc.links.parking_map}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="location-naver-btn"
                            style={{ marginTop: '20px' }}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="1" y="3" width="22" height="18" rx="2" ry="2"/>
                                <path d="M7 7h10M7 12h10M7 17h10"/>
                            </svg>
                            {loc.btn_parking || 'Parking Map'}
                        </a>
                    )}
                </div>
            </FadeInSection>
        </div>
    );
};

export default Location;
