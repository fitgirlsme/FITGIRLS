import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import FadeInSection from './FadeInSection';
import './Hero.css';
import { getData, STORES } from '../utils/db';

const Hero = () => {
    const { t } = useTranslation();
    const [slides, setSlides] = useState([]);
    const [currentSlide, setCurrentSlide] = useState(0);

    useEffect(() => {
        const fetchHeroData = async () => {
            try {
                const data = await getData(STORES.HERO_SLIDES);
                if (data && data.length > 0) {
                    const sorted = [...data].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
                    setSlides(sorted);
                }
            } catch (error) {
                console.error('Failed to fetch hero slides:', error);
            }
        };
        fetchHeroData();
    }, []);

    useEffect(() => {
        if (slides.length > 1) {
            const timer = setInterval(() => {
                setCurrentSlide((prev) => (prev + 1) % slides.length);
            }, 5000);
            return () => clearInterval(timer);
        }
    }, [slides]);

    return (
        <div className="hero-container">
            <div className="hero-slideshow">
                {slides.length > 0 ? (
                    slides.map((slide, index) => (
                        <div
                            key={slide.id || index}
                            className={`hero-slide ${index === currentSlide ? 'active' : ''}`}
                            style={{ backgroundImage: `url(${slide.src})` }}
                        ></div>
                    ))
                ) : (
                    <div className="hero-slide active" style={{ backgroundImage: 'url(/images/hero-bg.jpg)' }}></div>
                )}
                <div className="gradient-overlay"></div>
            </div>

            <div className="hero-side-bar">
                <div className="hero-side-bar-inner">
                    <div className="hero-social-links">
                        <a href="http://instagram.com/fitgirls.me" target="_blank" rel="noopener noreferrer" className="hero-social-link">INSTAGRAM</a>
                        <a href="https://pin.it/3IPk7D2NY" target="_blank" rel="noopener noreferrer" className="hero-social-link">PINTEREST</a>
                        <a href="https://www.youtube.com/@핏걸즈" target="_blank" rel="noopener noreferrer" className="hero-social-link">YOUTUBE</a>
                    </div>
                    <div className="hero-branding-year">
                        2013 — 2026
                    </div>
                </div>
            </div>

            <FadeInSection className="hero-content flex-center">
                <h1 className="hero-title">{t('hero.title')}</h1>
                <p className="hero-subtitle">{t('hero.subtitle')}</p>
                {t('hero.fitorialist_desc', '') && (
                    <p className="hero-fitorialist-desc" dangerouslySetInnerHTML={{ __html: t('hero.fitorialist_desc') }} />
                )}
            </FadeInSection>
        </div>
    );
};

export default Hero;
