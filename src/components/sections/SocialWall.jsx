import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import './SocialWall.css';

const SocialWall = () => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState('instagram');

    return (
        <div className="social-wall-container">
            <div className="social-header">
                <div className="social-profile">
                    <img
                        src="https://instagram.com/favicon.ico"
                        alt="profile"
                        className="social-profile-pic"
                        onError={(e) => { e.target.style.display = 'none'; }}
                    />
                    <div className="social-profile-info">
                        <span className="social-username">@fitgirls.me</span>
                        <span className="social-bio">{t('social.subtitle', 'Follow us on social media')}</span>
                    </div>
                </div>
            </div>

            <div className="social-tabs">
                <button
                    className={`social-tab ${activeTab === 'instagram' ? 'active' : ''}`}
                    onClick={() => setActiveTab('instagram')}
                >
                    INSTAGRAM
                </button>
                <button
                    className={`social-tab ${activeTab === 'pinterest' ? 'active' : ''}`}
                    onClick={() => setActiveTab('pinterest')}
                >
                    PINTEREST
                </button>
            </div>

            <div className="social-content">
                {activeTab === 'instagram' && (
                    <div className="social-instagram">
                        <div
                            className="elfsight-app-3bae4802-a529-4310-a245-bf2ccd0882ba"
                            data-elfsight-app-lazy
                        ></div>
                    </div>
                )}
                {activeTab === 'pinterest' && (
                    <div className="social-pinterest">
                        <a
                            data-pin-do="embedBoard"
                            data-pin-board-width="900"
                            data-pin-scale-height="600"
                            data-pin-scale-width="80"
                            href="https://www.pinterest.com/fitgirls_me/"
                        ></a>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SocialWall;
