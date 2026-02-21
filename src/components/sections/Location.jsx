import React from 'react';
import { useTranslation } from 'react-i18next';
import FadeInSection from '../FadeInSection';
import './Location.css';

const Location = () => {
    const { t } = useTranslation();
    const loc = t('location', { returnObjects: true });

    return (
        <div className="container-inner location-container">
            <FadeInSection className="section-header">
                <h2 className="section-title">{loc.title}</h2>
                <p className="section-subtitle">{loc.subtitle}</p>
            </FadeInSection>

            <FadeInSection delay={1} className="location-card">
                <div className="map-placeholder">
                    {/* Google Maps Embed iframe replacing the placeholder */}
                    <iframe
                        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3164.673859664652!2d127.01899551531016!3d37.51560067980757!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x357ca3e7a6858ee7%3A0xe104fc6f272a76f2!2z7Z핏걸즈스튜디오!5e0!3m2!1sko!2skr!4v1699999999999!5m2!1sko!2skr"
                        width="100%"
                        height="100%"
                        style={{ border: 0 }}
                        allowFullScreen=""
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        title="FITGIRLS &amp; INAFIT Studio Map"
                    ></iframe>
                </div>

                <div className="location-info">
                    <div className="info-row">
                        <strong>{loc.address_label}</strong>
                        <p style={{ whiteSpace: 'pre-line' }}>{loc.address}</p>
                    </div>
                    <div className="info-row">
                        <strong>{loc.parking_label}</strong>
                        <p style={{ whiteSpace: 'pre-line' }}>{loc.parking}</p>
                    </div>
                    <div className="info-row">
                        <strong>{loc.contact_label}</strong>
                        <p>
                            Tel. {loc.tel}<br />
                            Email. {loc.email}<br />
                            {loc.hours}
                        </p>
                    </div>
                </div>

                <div className="location-buttons">
                    <a href={loc.links.studio_map} target="_blank" rel="noopener noreferrer" className="btn-map">
                        📍 {loc.btn_studio}
                    </a>
                    <a href={loc.links.parking_map} target="_blank" rel="noopener noreferrer" className="btn-map secondary">
                        🚗 {loc.btn_parking}
                    </a>
                </div>
            </FadeInSection>
        </div>
    );
};

export default Location;
