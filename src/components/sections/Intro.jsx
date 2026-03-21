import React from 'react';
import { useTranslation } from 'react-i18next';
import FadeInSection from '../FadeInSection';
import './Intro.css';

const Intro = () => {
    const { t } = useTranslation();

    return (
        <div className="hero-intro-container">
            <video
                className="hero-intro-video"
                autoPlay
                loop
                muted
                playsInline
                src="/images/intro-bg.mp4"
            />
            <div className="hero-intro-overlay"></div>
            <FadeInSection className="hero-intro-inner">
                <span className="hero-intro-label">FITORIALIST</span>
                <p className="hero-intro-desc">
                    {t('intro.slogan').split('\n').map((line, i) => (
                        <React.Fragment key={i}>
                            {line}
                            {i < t('intro.slogan').split('\n').length - 1 && <br />}
                        </React.Fragment>
                    ))}
                </p>
                <p className="hero-intro-sub">{t('intro.desc')}</p>
            </FadeInSection>
        </div>
    );
};

export default Intro;
