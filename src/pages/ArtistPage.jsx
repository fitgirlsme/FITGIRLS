import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SupportCS from '../components/SupportCS';
import ArtistSection from '../components/sections/ArtistSection';

const ArtistPage = ({ changeLanguage, currentLang }) => {
    const { i18n } = useTranslation();
    const [isScrolled, setIsScrolled] = useState(false);

    const handleScroll = (e) => {
        setIsScrolled(e.target.scrollTop > 50);
    };

    return (
        <div className="app-container" onScroll={handleScroll} style={{ overflowY: 'auto', height: '100vh', background: 'var(--color-bg)' }}>
            <Header 
                isScrolled={isScrolled} 
                isOnHero={false} 
                isHidden={false}
                changeLanguage={changeLanguage || ((lng) => i18n.changeLanguage(lng))}
                currentLang={currentLang || i18n.language}
            />
            
            <main style={{ paddingTop: '80px', minHeight: '100vh' }}>
                <ArtistSection />
            </main>
            
            <Footer />
            <SupportCS />
        </div>
    );
};

export default ArtistPage;
