import React from 'react';
import { useTranslation } from 'react-i18next';
import FadeInSection from '../FadeInSection';
import './Service.css';

const Service = () => {
    const { t } = useTranslation();

    const headerTitle = t('services.header_title');
    const headerSubtitle = t('services.header_subtitle');
    const headerDesc = t('services.header_desc');

    const menu1 = t('services.menu1', { returnObjects: true });
    const list1 = t('services.list1', { returnObjects: true });

    const menu2 = t('services.menu2', { returnObjects: true });
    const list2 = t('services.list2', { returnObjects: true });

    const notices = t('services.notices', { returnObjects: true });

    return (
        <div className="container-inner service-container">
            <FadeInSection className="service-main-header">
                <h2 className="service-main-title">{headerTitle}</h2>
                <h3 className="service-main-subtitle">{headerSubtitle}</h3>
                <p className="service-main-desc">{headerDesc}</p>
            </FadeInSection>

            {/* Menu 1 (PORTRAIT MENU) */}
            <FadeInSection delay={1} className="service-category">
                <div className="category-header">
                    <h3 className="category-title">{menu1.title}</h3>
                    <p className="category-subtitle">{menu1.subtitle}</p>
                    <div className="category-label">{menu1.category}</div>
                </div>

                <div className="service-cards">
                    {Array.isArray(list1) && list1.map((svc, idx) => (
                        <div key={idx} className="service-card full-details">
                            <div className="service-header">
                                <h4 className="service-name">{svc.title}</h4>
                                <div className="service-price">{svc.price}</div>
                            </div>
                            <ul className="service-details">
                                {Array.isArray(svc.details) && svc.details.map((detail, dIdx) => (
                                    <li key={dIdx}>{detail}</li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </FadeInSection>

            {/* Menu 2 (FRIENDS & COUPLE) */}
            <FadeInSection delay={2} className="service-category">
                <div className="category-header">
                    <h3 className="category-title">{menu2.title}</h3>
                    <div className="category-label">{menu2.category}</div>
                </div>

                <div className="service-cards">
                    {Array.isArray(list2) && list2.map((svc, idx) => (
                        <div key={idx} className="service-card full-details">
                            <div className="service-header">
                                <h4 className="service-name">{svc.title}</h4>
                                <div className="service-price">{svc.price}</div>
                            </div>
                            <ul className="service-details">
                                {Array.isArray(svc.details) && svc.details.map((detail, dIdx) => (
                                    <li key={dIdx}>{detail}</li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </FadeInSection>

            {/* Notices */}
            <FadeInSection delay={3} className="service-notice">
                <ul>
                    {Array.isArray(notices) && notices.map((notice, idx) => (
                        <li key={idx}>{notice}</li>
                    ))}
                </ul>
            </FadeInSection>
        </div>
    );
};

export default Service;
