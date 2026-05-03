import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MESSENGER_LINKS } from '../constants/links';

const Footer = ({ isHidden }) => {
    const { t } = useTranslation();
    const isAdmin = localStorage.getItem('isAdmin') === 'true';


    const handleLogout = () => {
        if (window.confirm("관리자 로그아웃 하시겠습니까?")) {
            localStorage.removeItem('isAdmin');
            window.location.reload();
        }
    };



    return (
        <footer className={`site-footer ${isHidden ? 'footer-hidden' : ''}`}>
            <div className="site-footer-inner">


                <div className="footer-info-row">
                    <span className="site-footer-logo">FITGIRLS &amp; INAFIT</span>
                    <span className="site-footer-divider">|</span>
                    <span className="site-footer-copy">&copy; 2026 All Rights Reserved</span>
                    
                    {isAdmin && (
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
                    )}
                </div>
            </div>

        </footer>
    );
};

export default Footer;
