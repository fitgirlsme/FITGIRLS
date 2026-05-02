import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import FadeInSection from './FadeInSection';
import './Hero.css';
import { getData, STORES } from '../utils/db';
import { MESSENGER_LINKS } from '../constants/links';

const Hero = () => {
    const { t, i18n } = useTranslation();
    const [slides, setSlides] = useState([]);
    const [currentSlide, setCurrentSlide] = useState(0);

    const activeSlide = slides[currentSlide];
    const langCode = i18n.language.split('-')[0];

    const getSlideText = (slide, type) => {
        if (!slide) return '';
        const langSuffix = langCode === 'ko' ? '' : langCode.charAt(0).toUpperCase() + langCode.slice(1);
        const fieldName = `${type}${langSuffix}`;
        
        return slide[fieldName] || slide[type] || t(`hero.${type}`);
    };

    const currentTitle = getSlideText(activeSlide, 'title');
    const currentSubtitle = "PHOTOGRAPHED BY ANGELO SHIN.";

    useEffect(() => {
        const fetchHeroData = async () => {
            try {
                const data = await getData(STORES.HERO_SLIDES);
                const brandingSlide = { 
                    id: 'branding-intro', 
                    src: '/branding-logo.jpg', 
                    type: 'image' 
                };
                
                if (data && data.length > 0) {
                    const sorted = [...data].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
                    setSlides([brandingSlide, ...sorted]);
                } else {
                    setSlides([brandingSlide]);
                }
            } catch (error) {
                console.error('Failed to fetch hero slides:', error);
                setSlides([{ id: 'branding-intro', src: '/branding-logo.jpg', type: 'image' }]);
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

    const currentMessengerLink = MESSENGER_LINKS[langCode] || MESSENGER_LINKS.ko;

    return (
        <div className="hero-container">
            <div className="hero-slideshow">
                {slides.length > 0 ? (
                    slides.map((slide, index) => {
                        const isActive = index === currentSlide;
                        const isBrandingSlide = index === 0;
                        
                        if (slide.type === 'video') {
                            return (
                                <div key={slide.id || index} className={`hero-slide ${isActive ? 'active' : ''}`}>
                                    <iframe
                                        className="hero-video-bg"
                                        src={`https://www.youtube.com/embed/${slide.src}?autoplay=1&mute=1&controls=0&loop=1&playlist=${slide.src}&showinfo=0&rel=0&iv_load_policy=3&modestbranding=1`}
                                        frameBorder="0"
                                        allow="autoplay; encrypted-media"
                                        allowFullScreen
                                        title="Hero Video"
                                    ></iframe>
                                </div>
                            );
                        }
                        return (
                            <div
                                key={slide.id || index}
                                className={`hero-slide ${index === currentSlide ? 'active' : ''} ${isBrandingSlide ? 'branding-slide' : ''}`}
                                style={{ 
                                    backgroundImage: `url(${slide.src})`,
                                    backgroundSize: isBrandingSlide ? 'contain' : 'cover',
                                    backgroundRepeat: 'no-repeat',
                                    backgroundColor: isBrandingSlide ? '#e30613' : 'transparent'
                                }}
                            ></div>
                        );
                    })
                ) : (
                    <div className="hero-slide active" style={{ backgroundImage: 'url(/images/hero-bg.jpg)' }}></div>
                )}
                <div className="gradient-overlay"></div>
            </div>

            <div className={`hero-side-bar ${currentSlide === 0 || currentSlide === 8 ? 'branding-active' : ''}`} key={`sidebar-${currentSlide}`}>
                {currentSlide !== 0 && currentSlide !== 8 && (
                    <div className="hero-side-bar-inner">
                        <div className="hero-social-links">
                            <a href="http://instagram.com/fitgirls.me" target="_blank" rel="noopener noreferrer" className="hero-social-link">FITGIRLS & INAFIT</a>
                            <a href="https://instagram.com/angeloshin_world" target="_blank" rel="noopener noreferrer" className="hero-social-link">@ANGELOSHIN_WORLD</a>
                            <a href="https://www.youtube.com/@핏걸즈" target="_blank" rel="noopener noreferrer" className="hero-social-link">YOUTUBE</a>
                        </div>
                        <div className="hero-branding-year">
                            2013 — 2026
                        </div>
                    </div>
                )}
            </div>

            <FadeInSection 
                key={`content-${currentSlide}-${currentTitle}`}
                delay={currentSlide === 0 || currentSlide === 8 ? 0 : 1}
                className={`hero-content flex-center ${currentSlide === 0 || currentSlide === 8 ? 'branding-active' : ''}`}
            >
                {currentSlide !== 0 && currentSlide !== 8 && (
                    <>
                        <h1 className="hero-title">{currentTitle}</h1>
                        <p className="hero-subtitle">{currentSubtitle}</p>
                    </>
                )}
            </FadeInSection>

            <div className={`scroll-hint ${currentSlide === 0 || currentSlide === 8 ? 'branding-active' : ''}`} key={`scroll-${currentSlide}`}>
                {currentSlide !== 0 && currentSlide !== 8 && (
                    <>
                        <span className="scroll-text">SCROLL</span>
                        <div className="scroll-line"></div>
                    </>
                )}
            </div>
        </div>
    );
};

export default Hero;
