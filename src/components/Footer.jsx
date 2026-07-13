import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MESSENGER_LINKS } from '../constants/links';
import { SiInstagram, SiYoutube, SiNaver } from 'react-icons/si';

const Footer = ({ isHidden }) => {
    const { t } = useTranslation();
    const isAdmin = localStorage.getItem('isAdmin') === 'true' || localStorage.getItem('admin_logged_in') === 'true';


    const handleLogout = () => {
        if (window.confirm("관리자 로그아웃 하시겠습니까?")) {
            localStorage.removeItem('isAdmin');
            localStorage.removeItem('admin_logged_in');
            window.location.reload();
        }
    };



    return (
        <footer className={`site-footer ${isHidden ? 'footer-hidden' : ''}`}>
            <div className="site-footer-inner">
                <div className="footer-social-links">
                    <a href="http://instagram.com/fitgirls.me" target="_blank" rel="noopener noreferrer" className="footer-social-icon instagram" title="Instagram">
                        <SiInstagram />
                    </a>
                    <a href="https://www.youtube.com/@핏걸즈" target="_blank" rel="noopener noreferrer" className="footer-social-icon youtube" title="YouTube">
                        <SiYoutube />
                    </a>
                    <a href="https://map.naver.com/p/search/%ED%95%8F%EA%B1%B8%EC%A6%88%EC%8A%A4%ED%8A%9C%EB%94%94%EC%98%A4/place/1976065694" target="_blank" rel="noopener noreferrer" className="footer-social-icon naver" title="Naver SmartPlace">
                        <SiNaver />
                    </a>
                </div>


                <div className="footer-info-row">
                    <span className="site-footer-logo">FITGIRLS &amp; INAFIT</span>
                    <span className="site-footer-divider">|</span>
                    <span className="site-footer-copy">&copy; {new Date().getFullYear()} All Rights Reserved</span>
                    
                    {isAdmin ? (
                        <>
                            <span className="site-footer-divider" style={{ opacity: 0.3 }}>|</span>
                            <button 
                                onClick={handleLogout}
                                className="footer-logout-btn"
                                title="관리자 로그아웃"
                            >
                                LOGOUT
                            </button>
                        </>
                    ) : (
                        <>
                            <span className="site-footer-divider" style={{ opacity: 0.3 }}>|</span>
                            <button 
                                onClick={() => window.location.href = '/admin'}
                                className="footer-logout-btn"
                                title="관리자 로그인"
                            >
                                LOGIN
                            </button>
                        </>
                    )}
                </div>
            </div>

        </footer>
    );
};

export default Footer;
