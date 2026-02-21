import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import FadeInSection from '../FadeInSection';
import './Hero.css';

// 슬라이드쇼 이미지 배열 - 여기에 이미지를 추가하면 자동으로 슬라이드쇼에 포함됩니다
const HERO_IMAGES = [
    '/images/hero-bg.jpg',
    '/images/hero-bg2.jpg',
];

const SLIDE_DURATION = 6000; // 각 슬라이드 표시 시간 (ms)

const Hero = () => {
    const { t } = useTranslation();
    const [currentSlide, setCurrentSlide] = useState(0);

    useEffect(() => {
        if (HERO_IMAGES.length <= 1) return;
        const timer = setInterval(() => {
            setCurrentSlide(prev => (prev + 1) % HERO_IMAGES.length);
        }, SLIDE_DURATION);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="hero-container">
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

        </div>
    );
};

export default Hero;
