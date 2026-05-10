import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import './Service.css';

const Service = ({ initialTab }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [mainTab, setMainTab] = useState('fitorialist');
    const [subTab, setSubTab] = useState('menu1');

    useEffect(() => {
        const tabParam = searchParams.get('tab') || initialTab;
        if (tabParam === 'self') {
            setMainTab('self');
        } else if (tabParam === 'fitorialist') {
            setMainTab('fitorialist');
        } else if (tabParam === 'service_studio') {
            setMainTab('service_studio');
        }
    }, [searchParams, initialTab]);

    const headerTitle = t('services.header_title');
    const headerSubtitle = t('services.header_subtitle');
    const headerDesc = t('services.header_desc');
    const samePrice = t('services.same_price');
    const returnDiscount = t('services.return_discount');
    const notices = t('services.notices', { returnObjects: true }) || [];

    const tabs = t('services.tabs', { returnObjects: true }) || {};
    const serviceData = t(`services.${mainTab}`, { returnObjects: true }) || {};

    const hasSubTabs = serviceData.menu2;
    const items = subTab === 'menu1' ? (serviceData.list1 || []) : (serviceData.list2 || []);
    const currentMenu = subTab === 'menu1' ? (serviceData.menu1 || {}) : (serviceData.menu2 || {});

    const handleMainTabChange = (key) => {
        setMainTab(key);
        setSubTab('menu1'); // Reset subTab when main category changes
        navigate(`/service/${key}`, { replace: true });
    };

    return (
        <div className="service-container">
            {/* Header spacer – clears the fixed nav */}
            <div className="service-header-spacer" />

            {/* Main Tabs – sticky below header */}
            <nav className="service-tabs">
                {Object.entries(tabs).map(([key, label]) => (
                    <button
                        key={key}
                        className={`service-tab-btn ${mainTab === key ? 'active' : ''}`}
                        onClick={() => handleMainTabChange(key)}
                    >
                        {label}
                    </button>
                ))}
            </nav>

            {/* Sub Tabs (Only if category has menu2) */}
            {hasSubTabs && (
                <nav className="service-sub-tabs">
                    <button
                        className={`service-sub-tab-btn ${subTab === 'menu1' ? 'active' : ''}`}
                        onClick={() => setSubTab('menu1')}
                    >
                        {serviceData.menu1?.title || 'PORTRAIT'}
                    </button>
                    <button
                        className={`service-sub-tab-btn ${subTab === 'menu2' ? 'active' : ''}`}
                        onClick={() => setSubTab('menu2')}
                    >
                        {serviceData.menu2?.title || 'FRIENDS & COUPLE'}
                    </button>
                </nav>
            )}

            <div className="service-category">
                {currentMenu.category && (
                    <div className="service-category-tag">{currentMenu.category}</div>
                )}
                <div className="service-cards">
                    {Array.isArray(items) && items.length > 0 ? (
                        items.map((item, idx) => (
                            <div key={idx} className="service-card full-details">
                                <div className="service-header">
                                    <h4 className="service-name">{item.title}</h4>
                                    <div className="service-price">{item.price}</div>
                                </div>
                                <ul className="service-details">
                                    {Array.isArray(item.details) && item.details.map((detail, i) => (
                                        <li key={i}>{detail}</li>
                                    ))}
                                </ul>
                            </div>
                        ))
                    ) : (
                        <div className="service-empty">COMMING SOON</div>
                    )}

                    {/* Tab Specific Notices as a Card */}
                    {Array.isArray(serviceData.notices) && (
                        <div className="service-card service-specific-card">
                            <div className="service-header">
                                <h4 className="service-name">ADDITIONAL OPTIONS / INFO</h4>
                            </div>
                            <ul className="service-details notice-list">
                                {serviceData.notices.map((notice, idx) => (
                                    <li key={`spec-${idx}`}>{notice}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </div>

            <div className="service-notice">
                {returnDiscount && mainTab !== 'self' && (
                    <p className="service-notice-highlight">
                        {returnDiscount}
                    </p>
                )}
                <p className="service-main-desc">
                    {headerDesc}
                </p>

                {mainTab === 'self' && (
                    <div className="service-action-container">
                        <button 
                            className="service-view-zone-btn"
                            onClick={() => {
                                navigate('/zone?tab=zone&subtab=mooz');
                                setTimeout(() => {
                                    document.getElementById('zone')?.scrollIntoView({ behavior: 'smooth' });
                                }, 150);
                            }}
                        >
                            무즈 셀프 배경 보기
                        </button>
                        <a 
                            href="https://map.naver.com/p/entry/place/1259998642?placePath=%252Fhome%253Fentry%253Dplt&searchType=place&lng=127.0203605&lat=37.5194843" 
                            target="_blank" 
                            rel="noreferrer" 
                            className="naver-reservation-btn"
                        >
                            <svg className="naver-icon" viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                                <path d="M16.273 12.845L7.376 0H0v24h7.727V11.155L16.624 24H24V0h-7.727v12.845z"/>
                            </svg>
                            MOOZ SELF 예약하기
                        </a>
                    </div>
                )}

                {samePrice && (
                    <p className="service-notice-highlight secondary">
                        {mainTab === 'self' ? samePrice.replace('핏걸즈&이너핏', 'MOOZ SELF') : samePrice}
                    </p>
                )}

                <ul>
                    {Array.isArray(notices) && notices
                        .filter(n => mainTab !== 'self' || !n.includes('2000px'))
                        .map((notice, idx) => (
                            <li key={idx}>{notice}</li>
                        ))}
                </ul>
            </div>
        </div>
    );
};

export default Service;
