import React, { useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import FadeInSection from '../FadeInSection';
import './Intro.css';

const Intro = () => {
    const { t } = useTranslation();
    const videoRef = useRef(null);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const snapContainer = document.querySelector('.snap-container');

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    video.muted = false;
                    video.play().catch((err) => {
                        console.warn('Autoplay with sound blocked:', err);
                    });
                } else {
                    video.pause();
                    video.muted = true;
                }
            },
            { root: snapContainer, threshold: 0.2 }
        );

        observer.observe(video);

        return () => {
            observer.disconnect();
            video && video.pause();
        };
    }, []);

    return (
        <div className="hero-intro-container">
            <video
                ref={videoRef}
                className="hero-intro-video"
                autoPlay
                loop
                muted={false}
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
