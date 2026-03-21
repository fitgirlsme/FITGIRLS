import React from 'react';
import { useTranslation } from 'react-i18next';
import FadeInSection from '../FadeInSection';
import './ModelRecruit.css';

const ModelRecruit = () => {
    const { t } = useTranslation();

    return (
        <section className="model-recruit-section" id="model-recruit">
            <div className="container-inner">
                <FadeInSection className="recruit-header">
                    <h2 className="section-title">{t('model_recruit.title') || 'MODEL RECRUIT'}</h2>
                    <p className="section-subtitle">{t('model_recruit.subtitle') || '2026 NEW FACE WANTED'}</p>
                </FadeInSection>

                <FadeInSection delay={0.2} className="recruit-content-card">
                    <div className="recruit-main-info">
                        <h3>{t('model_recruit.main_title') || '핏걸즈와 함께할 새로운 뮤즈를 찾습니다.'}</h3>
                        <p>{t('model_recruit.desc') || '다양한 컨셉의 촬영을 통해 자신만의 매력을 발견하고 싶은 분들의 많은 지원 바랍니다.'}</p>
                    </div>

                    <div className="recruit-details">
                        <div className="detail-item">
                            <span className="label">{t('model_recruit.target_label') || '모집대상:'}</span>
                            <span className="value">{t('model_recruit.target_value') || '바디프로필에 관심 있는 모든 여성'}</span>
                        </div>
                        <div className="detail-item">
                            <span className="label">{t('model_recruit.benefit_label') || '지원혜택:'}</span>
                            <span className="value">{t('model_recruit.benefit_value') || '헤어/메이크업 지원 및 촬영권 증정'}</span>
                        </div>
                    </div>

                    <a 
                        href="https://linktr.ee/fitgirls.me" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="recruit-apply-btn"
                    >
                        {t('model_recruit.button') || '지금 바로 지원하기'}
                    </a>
                </FadeInSection>
            </div>
        </section>
    );
};

export default ModelRecruit;
