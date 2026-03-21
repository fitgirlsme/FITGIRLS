import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import FadeInSection from '../FadeInSection';
import SocialLinks from '../SocialLinks';
import './Hero.css';

// 슬라이드쇼 이미지 배열 - 여기에 이미지를 추가하면 자동으로 슬라이드쇼에 포함됩니다
const HERO_IMAGES = [
    './images/hero-bg.jpg',
    './images/hero-bg2.jpg',
];

const SLIDE_DURATION = 6000; // 각 슬라이드 표시 시간 (ms)

const Hero = () => {
    const { t, i18n } = useTranslation();
    const [currentSlide, setCurrentSlide] = useState(0);

    const changeLanguage = (lng) => {
        i18n.changeLanguage(lng);
    };

    useEffect(() => {
        if (HERO_IMAGES.length <= 1) return;
        const timer = setInterval(() => {
            setCurrentSlide(prev => (prev + 1) % HERO_IMAGES.length);
        }, SLIDE_DURATION);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="hero-container">
            {/* 첫 화면 전용 헤더 */}
            <header className="app-header">
                <div className="logo-text">FITGIRLS &amp; INAFIT</div>
                <div className="lang-switcher">
                    <button onClick={() => changeLanguage('ko')} className={i18n.language === 'ko' ? 'active' : ''}>KR</button>
                    <button onClick={() => changeLanguage('en')} className={i18n.language === 'en' ? 'active' : ''}>EN</button>
                    <button onClick={() => changeLanguage('ja')} className={i18n.language === 'ja' ? 'active' : ''}>JP</button>
                    <button onClick={() => changeLanguage('zh')} className={i18n.language === 'zh' ? 'active' : ''}>CN</button>
                </div>
            </header>

            {/* 슬라이드쇼 배경 */}
            <div className="hero-slideshow">
                {HERO_IMAGES.map((img, idx) => (
                    <div
                        key={idx}
                        className={`hero-slide ${idx === currentSlide ? 'active' : ''}`}
                        style={{ backgroundImage: `url(${img})` }}
                    />
                ))}
                <div className="gradient-overlay"></div>
            </div>

            <FadeInSection className="hero-content">
                <span className="hero-year">2026</span>
                <h1 className="hero-title">{t('hero.title')}</h1>
                <p className="hero-subtitle">{t('hero.subtitle')}</p>
            </FadeInSection>

            {/* 첫 화면 전용 소셜 링크 */}
            <SocialLinks />
        </div>
    );
};

export default Hero;
