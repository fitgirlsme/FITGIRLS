import React from 'react';
import { useTranslation } from 'react-i18next';
import './SupportCS.css';

const SupportCS = () => {
    const { t, i18n } = useTranslation();

    const getCsLink = () => {
        switch (i18n.language) {
            case 'ja':
                return 'https://line.me/R/ti/p/@575kojji';
            case 'ko':
            default:
                return 'http://pf.kakao.com/_cpxbxnC';
        }
    };

    const getIcon = () => {
        if (i18n.language === 'ko') {
            return <img src="/images/kakao-channel.png" alt="카카오채널" className="cs-icon-img" />;
        } else if (i18n.language === 'ja') {
            return <img src="/images/line-icon.jpg" alt="LINE" className="cs-icon-img" />;
        } else {
            return <span className="cs-icon">💬</span>;
        }
    };

    // 영어: 채널톡 열기 (링크 대신 onClick)
    if (i18n.language === 'en') {
        return (
            <div className="cs-container">
                <button
                    type="button"
                    className={`cs-button cs-button--en`}
                    onClick={() => {
                        if (window.ChannelIO) {
                            window.ChannelIO('showMessenger');
                        }
                    }}
                >
                    {getIcon()}
                    <span className="cs-label">{t('cs.link_text')}</span>
                </button>
            </div>
        );
    }

    // 한국어/일본어: 기존 링크 방식
    return (
        <div className="cs-container">
            <a
                href={getCsLink()}
                target="_blank"
                rel="noopener noreferrer"
                className={`cs-button cs-button--${i18n.language}`}
            >
                {getIcon()}
                <span className="cs-label">{t('cs.link_text')}</span>
            </a>
        </div>
    );
};

export default SupportCS;
