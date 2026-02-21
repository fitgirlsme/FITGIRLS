import React from 'react';
import { useTranslation } from 'react-i18next';
import FadeInSection from '../FadeInSection';
import './Reservation.css';

const ReservationForm = () => {
    const { t } = useTranslation();
    const steps = t('reservation.steps', { returnObjects: true });

    return (
        <div className="container-inner reservation-container">
            <FadeInSection className="section-header">
                <h2 className="section-title">{t('reservation.title')}</h2>
                <p className="section-subtitle">{t('reservation.subtitle')}</p>
            </FadeInSection>

            <FadeInSection delay={1} className="reservation-cta-card">
                <div className="reservation-steps">
                    <div className="res-step">
                        <div className="step-number">1</div>
                        <div className="step-content">
                            <h3>{steps.step1_title}</h3>
                            <a
                                href={t('reservation.link')}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="naver-booking-btn"
                            >
                                📅 {t('reservation.button')}
                            </a>
                        </div>
                    </div>

                    <div className="res-step">
                        <div className="step-number">2</div>
                        <div className="step-content">
                            <h3>{steps.step2_title}</h3>
                            <p style={{ whiteSpace: 'pre-line' }}>{steps.step2_desc}</p>
                        </div>
                    </div>
                </div>

                <div className="reservation-notice">
                    <p>{t('reservation.final_notice')}</p>
                </div>
            </FadeInSection>
        </div>
    );
};

export default ReservationForm;
