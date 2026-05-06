import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MESSENGER_LINKS } from '../../constants/links';
import FadeInSection from '../FadeInSection';
import { trackReservationClick } from '../../utils/analyticsTracker';
import './Reservation.css';

const VIDEO_IDS = {
    ko: 'xqBJ8Ep4Ux4',
    en: '6kLYAHRA6_Q',
    ja: 'bc4_8ZiFfhk',
    zh: '1akya079PNI',
};


const ReservationForm = () => {
    const { t, i18n } = useTranslation();
    const [playing, setPlaying] = useState(false);

    const lang = i18n.language?.slice(0, 2) || 'ko';
    const videoId = VIDEO_IDS[lang] || VIDEO_IDS.ko;
    const thumbnail = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    const embedSrc = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=0&playsinline=1&rel=0${videoId === 'xqBJ8Ep4Ux4' ? '&start=6' : ''}`;

    const currentMessengerLink = MESSENGER_LINKS[lang] || MESSENGER_LINKS.ko;

    return (
        <div className="reservation-section-wrapper">
            <div className="container-inner reservation-container">
                <FadeInSection className="reservation-header">
                    <div className="header-left">
                        <h2 className="reservation-title">{t('reservation.title')}</h2>
                    </div>
                    <div className="header-right">
                        <span className="reservation-subtitle">{t('reservation.subtitle')}</span>
                    </div>
                </FadeInSection>

                <FadeInSection delay={0.2} className="reservation-main-card">
                    <div className="reservation-steps-list">
                        {/* Step 1 */}
                        <div className="reservation-step-item">
                            <div className="step-circle">1</div>
                            <div className="step-body">
                                <h3 className="step-title">{t('reservation.steps.step1_title')}</h3>
                                <p className="step-desc">{t('reservation.steps.step1_desc')}</p>
                                <div className="step-action">
                                    <a
                                        href={t('reservation.link')}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="res-naver-btn"
                                        onClick={() => trackReservationClick()}
                                    >
                                        {t('reservation.button')}
                                    </a>
                                    <a
                                        href={currentMessengerLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="res-channel-btn"
                                        onClick={() => trackReservationClick()}
                                    >
                                        {t('reservation.channel_button')}
                                    </a>
                                </div>
                            </div>
                        </div>

                        {/* Step 2 */}
                        <div className="reservation-step-item">
                            <div className="step-circle">2</div>
                            <div className="step-body">
                                <h3 className="step-title">{t('reservation.steps.step2_title')}</h3>
                                <p className="step-desc">{t('reservation.steps.step2_desc')}</p>
                                <p className="step-account">{t('reservation.steps.account_info')}</p>
                            </div>
                        </div>
                    </div>

                    <div className="reservation-info-box">
                        <p className="primary-notice">{t('reservation.final_notice')}</p>
                        <p className="secondary-notice">{t('reservation.return_discount')}</p>
                    </div>

                    <div className="reservation-guidebook-section">
                        {playing ? (
                            <div className="video-iframe-container">
                                <iframe
                                    src={embedSrc}
                                    title="FITGIRLS Guide Video"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                                />
                            </div>
                        ) : (
                            <div className="guidebook-thumb" onClick={() => setPlaying(true)}>
                                <img src={thumbnail} alt="FITGIRLS Guidebook" />
                                <div className="guidebook-overlay">
                                    <div className="guidebook-text">
                                        <h3>{t('reservation.guidebook_title')}</h3>
                                        <div className="play-button-circle">
                                            <div className="play-icon"></div>
                                        </div>
                                        <div className="brand-logo-mini">Fitgirls</div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </FadeInSection>
            </div>
        </div>
    );
};

export default ReservationForm;
