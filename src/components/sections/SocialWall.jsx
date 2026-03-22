import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import './SocialWall.css';

const SocialWall = () => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState('instagram');
    const pinterestRef = useRef(null);

    useEffect(() => {
        if (activeTab === 'pinterest') {
            const timer = setTimeout(() => {
                if (window.PinUtils && window.PinUtils.build) {
                    window.PinUtils.build();
                }
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [activeTab]);

    return (
        <div className="social-wall-container">
            <div className="social-header-premium">
                <div className="social-profile-wrap">
                    <div className="social-avatar-container">
                        <div className="social-avatar-gradient">
                            <img
                                src="/fitgirls_social_profile.jpg"
                                alt="profile"
                                className="social-avatar-img"
                                onError={(e) => { e.target.src = 'https://instagram.com/favicon.ico'; }}
                            />
                        </div>
                    </div>
                    
                    <div className="social-profile-details">
                        <div className="social-username-row">
                            <h2 className="social-username-main">fitgirls.me</h2>
                            <span className="social-verified-badge">
                                <svg width="18" height="18" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M19.9999 0C11.1304 0 4 7.13043 4 16C4 28.8 19.9999 40 19.9999 40C19.9999 40 36 28.8 36 16C36 7.13043 28.8696 0 19.9999 0ZM19.9999 26C14.4771 26 10 21.5229 10 16C10 10.4771 14.4771 6 19.9999 6C25.5227 6 29.9999 10.4771 29.9999 16C29.9999 21.5229 25.5227 26 19.9999 26Z" fill="#3897f0"/>
                                    <path d="M18.5 22L12 15.5L14.5 13L18.5 17L25.5 10L28 12.5L18.5 22Z" fill="white"/>
                                </svg>
                            </span>
                            <button className="social-follow-btn">{t('social.follow', 'Follow')}</button>
                        </div>

                        <div className="social-stats">
                            <div className="stat-item"><b>152</b> posts</div>
                            <div className="stat-item"><b>12.4k</b> followers</div>
                            <div className="stat-item"><b>86</b> following</div>
                        </div>

                        <div className="social-bio-premium">
                            <p className="bio-name">FITORIAL | FITGIRLS & INAFIT</p>
                            <p className="bio-desc">{t('social.subtitle', 'Follow us on social media for daily updates.')}</p>
                            <a href="https://fitgirls.me" className="bio-link">fitgirls.me</a>
                        </div>
                    </div>
                </div>
            </div>

            <div className="social-tabs-premium">
                <button
                    className={`social-tab-item ${activeTab === 'instagram' ? 'active' : ''}`}
                    onClick={() => setActiveTab('instagram')}
                >
                    <svg className="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                    POSTS
                </button>
                <button
                    className={`social-tab-item ${activeTab === 'pinterest' ? 'active' : ''}`}
                    onClick={() => setActiveTab('pinterest')}
                >
                    <svg className="tab-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.966 1.406-5.966s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.261 7.929-7.261 4.162 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146 1.124.347 2.317.535 3.554.535 6.607 0 11.985-5.365 11.985-11.987C23.992 5.368 18.623 0 12.017 0z"/></svg>
                    PINTEREST
                </button>
            </div>

            <div className="social-content-premium">
                {activeTab === 'instagram' && (
                    <div className="social-viewport instawall-v">
                        <div
                            className="elfsight-app-3bae4802-a529-4310-a245-bf2ccd0882ba"
                            data-elfsight-app-lazy
                        ></div>
                    </div>
                )}
                {activeTab === 'pinterest' && (
                    <div className="social-viewport pinwall-v" ref={pinterestRef}>
                        <a
                            data-pin-do="embedUser"
                            data-pin-board-width="900"
                            data-pin-scale-height="500"
                            data-pin-scale-width="60"
                            href="https://kr.pinterest.com/fitgirlsme/"
                        ></a>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SocialWall;
