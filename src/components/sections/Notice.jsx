import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import FadeInSection from '../FadeInSection';
import { fetchData } from '../../utils/dataService';
import { STORES } from '../../utils/db';
import './Notice.css';

const Notice = () => {
    const { t, i18n } = useTranslation();
    const [events, setEvents] = useState([]);
    const [openId, setOpenId] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData(STORES.NOTICES, 'createdAt', 'desc', 20)
            .then(data => {
                setEvents(data || []);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    const getTitle = (ev) => {
        const lang = i18n.language;
        if (lang === 'ja' && ev.titleJa) return ev.titleJa;
        if (lang === 'zh' && ev.titleZh) return ev.titleZh;
        if ((lang === 'en' || lang?.startsWith('en')) && ev.titleEn) return ev.titleEn;
        return ev.title || '';
    };

    const getContent = (ev) => {
        const lang = i18n.language;
        if (lang === 'ja' && ev.contentJa) return ev.contentJa;
        if (lang === 'zh' && ev.contentZh) return ev.contentZh;
        if ((lang === 'en' || lang?.startsWith('en')) && ev.contentEn) return ev.contentEn;
        return ev.content || '';
    };

    const formatDate = (ev) => {
        if (ev.createdAt) {
            const d = ev.createdAt?.toDate ? ev.createdAt.toDate() : new Date(ev.createdAt);
            if (!isNaN(d)) return d.toLocaleDateString('ko-KR').replace(/\. /g, '.').replace(/\.$/, '');
        }
        return '';
    };

    const handleToggle = (id) => {
        setOpenId(prev => (prev === id ? null : id));
    };

    return (
        <section className="notice-section" id="notice">
            <div className="container-inner">
                <FadeInSection className="notice-header">
                    <h2 className="section-title">{t('event.title')}</h2>
                </FadeInSection>

                <div className="notice-list">
                    {loading && (
                        <div className="notice-empty">Loading...</div>
                    )}
                    {!loading && events.length === 0 && (
                        <div className="notice-empty">등록된 이벤트가 없습니다.</div>
                    )}
                    {!loading && events.map((ev) => {
                        const isOpen = openId === ev.id;
                        return (
                            <div key={ev.id} className={`notice-item${isOpen ? ' notice-item--open' : ''}`}
                                onClick={() => handleToggle(ev.id)}>
                                <div className="notice-item-row">
                                    <span className="notice-date">{formatDate(ev)}</span>
                                    <h3 className="notice-title">{getTitle(ev)}</h3>
                                    <div className="notice-arrow">{isOpen ? '↑' : '↓'}</div>
                                </div>
                                {isOpen && (
                                    <div className="notice-detail" onClick={e => e.stopPropagation()}>
                                        <p className="notice-content">{getContent(ev)}</p>
                                        {ev.images && ev.images.length > 0 && (
                                            <div className="notice-images">
                                                {ev.images.map((img, i) => (
                                                    <img key={i} src={img} alt={`event-${i}`} className="notice-image" />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};

export default Notice;
