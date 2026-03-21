import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import './Header.css';

const Header = ({ isScrolled, isOnHero, changeLanguage, currentLang }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);
    const [expandedCategory, setExpandedCategory] = useState(null);

    const navItems = [
        { id: 'hero', label: t('nav.home', 'Home'), path: '/' },
        {
            category: t('nav.gallery', 'Gallery'),
            items: [
                { id: 'gallery', label: 'ALL', path: '/gallery' },
                { id: 'gallery', label: t('gallery.fitorialist', 'FITORIALIST'), path: '/gallery?main=fitorialist' },
                { id: 'gallery', label: t('gallery.artist', 'ARTIST'), path: '/gallery?main=artist' },
                { id: 'gallery', label: t('gallery.fashion_beauty', 'FASHION & BEAUTY'), path: '/gallery?main=fashion' },
                { id: 'gallery', label: t('gallery.portrait', 'PORTRAIT'), path: '/gallery?main=portrait' },
            ]
        },
        {
            category: t('nav.program', 'Program'),
            items: [
                { id: 'service', label: t('nav.service', 'Service'), path: '/service' },
                { id: 'zone', label: t('nav.zone', 'Zone'), path: '/zone' },
                { id: 'zone', label: 'LOOKBOOK', path: '/zone?tab=lookbook' },
                { id: 'hair-makeup', label: t('nav.hairmakeup', 'Hair & Makeup'), path: '/hair-makeup' },
            ]
        },
        {
            category: t('nav.info', 'Info'),
            items: [
                { id: 'event-board', label: t('nav.event', 'Event'), path: '/event-board' },
                { id: 'faq', label: t('nav.faq', 'FAQ'), path: '/faq' },
                { id: 'location', label: t('nav.location', 'Location'), path: '/location' },
            ]
        },
        { id: 'reservation', label: t('nav.reservation', 'Reservation'), path: '/reservation', isRed: true },
        { id: 'reviews', label: t('nav.review', 'Review'), path: '/reviews' },
        { id: 'social', label: 'SOCIAL WALL', path: '/social' },
    ];

    const handleNavClick = (path, sectionId) => {
        setMenuOpen(false);
        navigate(path);
        requestAnimationFrame(() => {
            const el = document.getElementById(sectionId);
            const container = document.querySelector('.snap-container');
            if (el && container) {
                container.scrollTo({ top: el.offsetTop, behavior: 'smooth' });
            }
        });
    };

    const toggleCategory = (categoryName, event) => {
        event.stopPropagation();
        setExpandedCategory(expandedCategory === categoryName ? null : categoryName);
    };

    return (
        <header className={`app-header ${isScrolled ? 'scrolled' : ''}`}>
            <div className="hamburger-container">
                <button
                    className={`hamburger-btn ${menuOpen ? 'open' : ''}`}
                    onClick={() => setMenuOpen(!menuOpen)}
                    aria-label="Menu"
                >
                    <span></span>
                    <span></span>
                    <span></span>
                </button>

                <nav className={`dropdown-menu ${menuOpen ? 'active' : ''}`}>
                    <div className="nav-links">
                        {navItems.map((item, idx) => {
                            if (item.category) {
                                const isExpanded = expandedCategory === item.category;
                                return (
                                    <div key={idx} className={`nav-category-group ${isExpanded ? 'expanded' : ''}`}>
                                        <button
                                            className="nav-category-header"
                                            onClick={(e) => toggleCategory(item.category, e)}
                                            aria-expanded={isExpanded}
                                        >
                                            <span className="nav-category-label">{item.category}</span>
                                            <span className="nav-category-icon">
                                                <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
                                                    <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            </span>
                                        </button>
                                        <div className="nav-sub-items">
                                            {item.items.map((sub, subIdx) => (
                                                <button
                                                    key={subIdx}
                                                    className="nav-link-btn nav-sub-item"
                                                    onClick={() => handleNavClick(sub.path, sub.id)}
                                                >
                                                    {sub.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                );
                            }
                            return (
                                <button
                                    key={idx}
                                    className={`nav-link-btn ${item.isRed ? 'nav-link-red' : ''}`}
                                    onClick={() => handleNavClick(item.path, item.id)}
                                >
                                    {item.label}
                                </button>
                            );
                        })}
                    </div>
                </nav>
            </div>

            <div className="lang-switcher">
                <button onClick={() => changeLanguage('ko')} className={currentLang === 'ko' ? 'active' : ''}>KR</button>
                <button onClick={() => changeLanguage('en')} className={currentLang === 'en' ? 'active' : ''}>EN</button>
                <button onClick={() => changeLanguage('ja')} className={currentLang === 'ja' ? 'active' : ''}>JP</button>
                <button onClick={() => changeLanguage('zh')} className={currentLang === 'zh' ? 'active' : ''}>CN</button>
            </div>
        </header>
    );
};

export default Header;
