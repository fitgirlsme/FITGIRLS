import React from 'react';
import { useTranslation } from 'react-i18next';
import Header from '../components/Header';
import ModelRecruit from '../components/sections/ModelRecruit';
import SupportCS from '../components/SupportCS';

const Ambassador = () => {
    const { i18n } = useTranslation();
    const [isScrolled, setIsScrolled] = React.useState(false);

    const handleScroll = (e) => {
        setIsScrolled(e.target.scrollTop > 50);
    };

    const changeLanguage = (lng) => {
        i18n.changeLanguage(lng);
    };

    return (
        <div className="app-container" onScroll={handleScroll} style={{ overflowY: 'auto', height: '100vh' }}>
            <Header 
                isScrolled={isScrolled} 
                isOnHero={false} 
                changeLanguage={changeLanguage} 
                currentLang={i18n.language} 
            />
            <main style={{ paddingTop: '80px', minHeight: '101vh', background: 'var(--color-bg)', paddingBottom: '60px' }}>
                <ModelRecruit />
                <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'center' }}>
                    <a href="/" className="back-to-main-btn">
                        <svg className="back-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                            <polyline points="9 22 9 12 15 12 15 22" />
                        </svg>
                        <span>HOME</span>
                    </a>
                </div>
            </main>
            <SupportCS />
        </div>
    );
};

export default Ambassador;
