import React from 'react';
import './Footer.css';

const Footer = ({ isHidden }) => {
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
                <span className="site-footer-logo">FITGIRLS &amp; INAFIT</span>
                <span className="site-footer-divider">|</span>
                <span className="site-footer-copy">&copy; 2026 All Rights Reserved</span>
                
                {isAdmin && (
                    <>
                        <span className="site-footer-divider" style={{ opacity: 0.3 }}>|</span>
                        <button 
                            onClick={handleLogout}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#b32d2e',
                                fontSize: '0.75rem',
                                letterSpacing: '1px',
                                cursor: 'pointer',
                                padding: 0,
                                fontWeight: 500
                            }}
                            title="관리자 로그아웃"
                        >
                            LOGOUT
                        </button>
                    </>
                )}
            </div>
        </footer>
    );
};

export default Footer;
