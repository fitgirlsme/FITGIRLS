import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import FadeInSection from '../FadeInSection';
import './Reservation.css';

const VIDEO_IDS = {
    ko: 'xqBJ8Ep4Ux4',
    en: '6kLYAHRA6_Q',
    ja: 'bc4_8ZiFfhk',
    zh: '1akya079PNI',
};

const ReservationForm = () => {
    const { t, i18n } = useTranslation();
    const stepsData = t('reservation.steps', { returnObjects: true });
    const [playing, setPlaying] = useState(false);

    const stepKeys = [1, 2, 3];

    const lang = i18n.language?.slice(0, 2);
    const videoId = VIDEO_IDS[lang] || VIDEO_IDS.ko;
    const thumbnail = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
    const embedSrc = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=0&playsinline=1&rel=0${videoId === 'xqBJ8Ep4Ux4' ? '&start=6' : ''}`;

    return (
        <div className="container-inner reservation-container">
            <FadeInSection className="section-header">
                <h2 className="section-title">{t('reservation.title')}</h2>
                <p className="section-subtitle">{t('reservation.subtitle')}</p>
            </FadeInSection>

            <FadeInSection delay={0.2} className="reservation-cta-card">
                <div className="reservation-steps">
                    {stepKeys.map((num) => (
                        <div key={num} className="res-step">
                            <div className="step-number">{num}</div>
                            <div className="step-content">
                                <h3>{stepsData[`step${num}_title`]}</h3>
                                <p style={{ whiteSpace: 'pre-line' }}>{stepsData[`step${num}_desc`]}</p>
                                {num === 2 && (
                                    <a
                                        href={t('reservation.link')}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="naver-booking-btn"
                                    >
                                        📅 {t('reservation.button')}
                                    </a>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="reservation-notice">
                    <p>{t('reservation.final_notice')}</p>
                </div>

                <div className="reservation-video-wrapper">
                    {playing ? (
                        <iframe
                            src={embedSrc}
                            title="FITGIRLS Guide Video"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                        />
                    ) : (
                        <div className="reservation-video-thumb" onClick={() => setPlaying(true)}>
                            <img src={thumbnail} alt="FITGIRLS Guide Video" />
                            <div className="reservation-video-play">▶</div>
                        </div>
                    )}
                </div>
            </FadeInSection>
        </div>
    );
};

export default ReservationForm;
