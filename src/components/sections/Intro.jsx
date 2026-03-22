import React, { useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import FadeInSection from '../FadeInSection';
import './Intro.css';

const Intro = () => {
    const { t } = useTranslation();
    const videoRef = useRef(null);
    const [isMuted, setIsMuted] = React.useState(true);

    const toggleMute = () => {
        if (videoRef.current) {
            const newMuted = !isMuted;
            videoRef.current.muted = newMuted;
            setIsMuted(newMuted);
            // Ensure playback if it was paused
            videoRef.current.play().catch(console.error);
        }
    };

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const snapContainer = document.querySelector('.snap-container');

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    video.play().catch((err) => {
                        console.warn('Autoplay failed:', err);
                    });
                } else {
                    video.pause();
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
        <div className="hero-intro-container" onClick={toggleMute}>
            <video
                ref={videoRef}
                className="hero-intro-video"
                autoPlay
                loop
                muted={isMuted}
                playsInline
                src="/images/intro-bg.mp4"
            />
            <div className="hero-intro-overlay"></div>
            
            <button className="sound-toggle-btn" aria-label="Toggle Sound">
                {isMuted ? (
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5L6 9H2v6h4l5 4V5z"></path><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>
                ) : (
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5L6 9H2v6h4l5 4V5z"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
                )}
            </button>

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
