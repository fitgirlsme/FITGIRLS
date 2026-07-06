import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ReservationForm from '../components/sections/ReservationForm';
import './ReservationPage.css';

const ReservationPage = () => {
    const { i18n } = useTranslation();
    const [isScrolled, setIsScrolled] = useState(false);

    const changeLanguage = (lng) => {
        i18n.changeLanguage(lng);
    };

    return (
        <div 
            className="reservation-page app-container" 
            onScroll={(e) => setIsScrolled(e.target.scrollTop > 50)}
            style={{ overflowY: 'auto', height: '100vh' }}
        >
            <Header 
                isScrolled={isScrolled} 
                isOnHero={false} 
                isHidden={false}
                changeLanguage={changeLanguage}
                currentLang={i18n.language}
            />
            
            <main className="reservation-page-main">
                <ReservationForm />
            </main>

            <Footer isHidden={false} />
        </div>
    );
};

export default ReservationPage;
