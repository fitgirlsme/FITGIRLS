import React, { Suspense } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './App.css';

// Lazy loading sections (in reality these can be regular imports for a one-page app)
import Hero from './components/sections/Hero';
import GallerySection from './components/sections/Gallery';
import Service from './components/sections/Service';
import FAQ from './components/sections/FAQ';
import Location from './components/sections/Location';
import ReservationForm from './components/sections/ReservationForm';
import SupportCS from './components/SupportCS';
import SocialLinks from './components/SocialLinks';
import Admin from './pages/Admin';

const OnePageApp = () => {
    const { i18n } = useTranslation();

    const changeLanguage = (lng) => {
        i18n.changeLanguage(lng);
    };

    return (
        <div className="app-container">
            {/* Absolute Minimal Header */}
            <header className="app-header">
                <div className="logo-text">FITGIRLS &amp; INAFIT</div>
                <div className="lang-switcher">
                    <button onClick={() => changeLanguage('ko')} className={i18n.language === 'ko' ? 'active' : ''}>KR</button>
                    <button onClick={() => changeLanguage('en')} className={i18n.language === 'en' ? 'active' : ''}>EN</button>
                    <button onClick={() => changeLanguage('ja')} className={i18n.language === 'ja' ? 'active' : ''}>JP</button>
                    <button onClick={() => changeLanguage('zh')} className={i18n.language === 'zh' ? 'active' : ''}>CN</button>
                </div>
            </header>

            {/* Snap Scroll Container */}
            <main className="snap-container">
                <section className="snap-section" id="hero">
                    <Hero />
                </section>

                <section className="snap-section" id="gallery">
                    <GallerySection />
                </section>

                <section className="snap-section" id="service">
                    <Service />
                </section>

                <section className="snap-section" id="faq">
                    <FAQ />
                </section>

                <section className="snap-section" id="location">
                    <Location />
                </section>

                <section className="snap-section" id="reservation">
                    <ReservationForm />
                </section>
            </main>

            <SocialLinks />
            <SupportCS />
        </div>
    );
};

function App() {
    return (
        <Router>
            <Suspense fallback={<div className="loading">Loading...</div>}>
                <Routes>
                    <Route path="/" element={<OnePageApp />} />
                    <Route path="/admin" element={<Admin />} />
                </Routes>
            </Suspense>
        </Router>
    );
}

export default App;
