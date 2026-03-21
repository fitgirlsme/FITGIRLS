import React from 'react';
import { useTranslation } from 'react-i18next';
import FadeInSection from '../FadeInSection';
import './Reservation.css';

const ReservationForm = () => {
    const { t } = useTranslation();
    const stepsData = t('reservation.steps', { returnObjects: true });
    
    const stepKeys = [1, 2, 3];

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
            </FadeInSection>
        </div>
    );
};

export default ReservationForm;
