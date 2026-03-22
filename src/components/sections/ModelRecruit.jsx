import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { addItem, getData, deleteItem, STORES } from '../../utils/db';
import { db } from '../../utils/firebase';
import { collection, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { syncCollection } from '../../utils/syncService';
import './ModelRecruit.css';

const ModelRecruit = () => {
    const { t } = useTranslation();
    const [form, setForm] = useState({ name: '', insta: '', location: '', job: '', phone: '', keywords: '' });
    const [status, setStatus] = useState(null); // 'success' | 'error'
    const [submitting, setSubmitting] = useState(false);
    const [applications, setApplications] = useState([]);
    const isAdmin = localStorage.getItem('isAdmin') === 'true';

    useEffect(() => {
        if (isAdmin) {
            syncCollection(STORES.APPLICATIONS).then(data => {
                const sorted = data.sort((a,b) => {
                    const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt).getTime();
                    const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt).getTime();
                    return timeB - timeA;
                });
                setApplications(sorted);
            }).catch(console.error);
        }
    }, [isAdmin]);

    const handleChange = (e) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setStatus(null);
        try {
            // Save to Firebase (for Admin panel)
            await addDoc(collection(db, 'applications'), {
                ...form,
                createdAt: serverTimestamp()
            });
            // Also save to IndexedDB (local cache)
            await addItem(STORES.APPLICATIONS, {
                ...form,
                createdAt: new Date().toISOString()
            });
            setStatus('success');
            setForm({ name: '', insta: '', location: '', job: '', phone: '', keywords: '' });
            if (isAdmin) {
                const list = await syncCollection(STORES.APPLICATIONS);
                const sorted = list.sort((a,b) => {
                    const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt).getTime();
                    const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt).getTime();
                    return timeB - timeA;
                });
                setApplications(sorted);
            }
        } catch {
            setStatus('error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            await deleteItem(STORES.APPLICATIONS, id);
            setApplications(prev => prev.filter(app => app.id !== id));
        } catch (err) {
            console.error(err);
        }
    };

    const handleToggleSelect = async (id, currentStatus) => {
        try {
            const docRef = doc(db, 'applications', id);
            await updateDoc(docRef, { isSelected: !currentStatus });
            setApplications(prev => prev.map(app => 
                app.id === id ? { ...app, isSelected: !currentStatus } : app
            ));
        } catch (err) {
            console.error('Error toggling select:', err);
        }
    };

    const selectedApps = applications.filter(app => app.isSelected);

    return (
        <section className="model-apply-section">
            <div className="model-apply-container">
                {/* Selected Ambassadors Showcase */}
                {selectedApps.length > 0 && (
                    <div className="selected-ambassadors-section">
                        <h3 className="selected-title">SELECTED AMBASSADORS</h3>
                        <div className="selected-list-scroll">
                            {selectedApps.map(app => (
                                <div key={app.id} className="selected-item">
                                    <div className="selected-avatar-glow">
                                        <div className="selected-avatar">
                                            {app.name.charAt(0)}
                                        </div>
                                    </div>
                                    <span className="selected-name">{app.name}</span>
                                    {app.insta && (
                                        <a 
                                            href={`https://instagram.com/${app.insta.replace('@', '')}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="selected-insta-icon"
                                        >
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                                        </a>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="model-apply-header">
                    <h2>{t('modelApply.title', '2026 FITORIAL 엠버서더 지원')}</h2>
                    <p className="model-apply-intro">{t('modelApply.ambassadorDetail.intro', '')}</p>
                </div>

                <div className="model-program-details">
                    <div className="program-card benefits">
                        <h3 className="program-card-title">{t('modelApply.ambassadorDetail.benefits.title', '🎁 BENEFITS')}</h3>
                        <div className="program-card-badge">{t('modelApply.ambassadorDetail.benefits.badge', '지원 혜택')}</div>
                        <p className="program-card-subtitle">{t('modelApply.ambassadorDetail.benefits.subtitle', '')}</p>
                        <ul className="program-list">
                            {t('modelApply.ambassadorDetail.benefits.items', { returnObjects: true })?.map((item, i) => (
                                <li key={i} className="program-list-item">
                                    <span className="item-dot"></span>
                                    <div className="item-content">
                                        <div className="item-title">{item.title}</div>
                                        <div className="item-desc">{item.desc}</div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="program-card roles">
                        <h3 className="program-card-title">{t('modelApply.ambassadorDetail.role.title', '🤝 ROLES')}</h3>
                        <div className="program-card-badge">{t('modelApply.ambassadorDetail.role.badge', '엠버서더의 역할')}</div>
                        <p className="program-card-subtitle">{t('modelApply.ambassadorDetail.role.subtitle', '')}</p>
                        <ul className="program-list">
                            {t('modelApply.ambassadorDetail.role.items', { returnObjects: true })?.map((item, i) => (
                                <li key={i} className="program-list-item">
                                    <span className="item-dot"></span>
                                    <div className="item-content">
                                        <div className="item-title">{item.title}</div>
                                        <div className="item-desc">{item.desc}</div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                <div className="model-apply-quote">
                    <p className="quote-main">"Age is just a number, Nationality is just a background.<br/>Your 'Fit' is everything."</p>
                    {t('modelApply.quoteSub', '') && (
                        <p className="quote-sub">{t('modelApply.quoteSub', "나이는 숫자일 뿐, 국적은 배경일 뿐입니다. 당신의 '핏'이 전부입니다.")}</p>
                    )}
                </div>

                <form className="model-apply-form" onSubmit={handleSubmit}>
                    <div className="apply-form-grid">
                        <div className="apply-form-group">
                            <label>{t('modelApply.name', '이름')}</label>
                            <input
                                type="text"
                                name="name"
                                value={form.name}
                                onChange={handleChange}
                                required
                                placeholder={t('modelApply.namePlaceholder', '이름을 입력해주세요')}
                            />
                        </div>
                        <div className="apply-form-group">
                            <label>{t('modelApply.insta', '인스타그램 ID')}</label>
                            <input
                                type="text"
                                name="insta"
                                value={form.insta}
                                onChange={handleChange}
                                placeholder={t('modelApply.instaPlaceholder', '@아이디')}
                            />
                        </div>
                        <div className="apply-form-group">
                            <label>{t('modelApply.location', '지역')}</label>
                            <input
                                type="text"
                                name="location"
                                value={form.location}
                                onChange={handleChange}
                                placeholder={t('modelApply.locationPlaceholder', '거주 지역')}
                            />
                        </div>
                        <div className="apply-form-group">
                            <label>{t('modelApply.job', '직업')}</label>
                            <input
                                type="text"
                                name="job"
                                value={form.job}
                                onChange={handleChange}
                                placeholder={t('modelApply.jobPlaceholder', '예: 학생, 프리랜서 등')}
                            />
                        </div>
                        <div className="apply-form-group">
                            <label>{t('modelApply.phone', '연락처')}</label>
                            <input
                                type="tel"
                                name="phone"
                                value={form.phone}
                                onChange={handleChange}
                                required
                                placeholder={t('modelApply.phonePlaceholder', '010-0000-0000')}
                            />
                        </div>
                        <div className="apply-form-group full-width">
                            <label>{t('modelApply.keywords', '나를 표현하는 스타일 키워드 3가지')}</label>
                            <input
                                type="text"
                                name="keywords"
                                value={form.keywords}
                                onChange={handleChange}
                                required
                                placeholder={t('modelApply.keywordsPlaceholder', '(예: #에디토리얼 #Y2K #에너지)')}
                            />
                        </div>
                    </div>
                    <button
                        type="submit"
                        className="apply-submit-btn"
                        disabled={submitting}
                    >
                        {submitting
                            ? t('modelApply.submitting', '제출 중...')
                            : t('modelApply.submit', '지원하기')
                        }
                    </button>
                    {status === 'success' && (
                        <div className="apply-status success">
                            {t('modelApply.successMsg', '지원이 완료되었습니다. 감사합니다!')}
                        </div>
                    )}
                    {status === 'error' && (
                        <div className="apply-status error">
                            {t('modelApply.errorMsg', '오류가 발생했습니다. 다시 시도해주세요.')}
                        </div>
                    )}
                </form>

                <div className="model-apply-footer-note">
                    {t('modelApply.footerNote', '핏걸즈&이너핏은 전 세계 모든 열정과 아름다움을 존중합니다. 국적 및 연령에 제한 없이, 자신만의 독보적인 무드를 가진 분이라면 누구나 2026 핏토리얼리스트가 될 수 있습니다.')}
                </div>

                {isAdmin && applications.length > 0 && (
                    <div className="admin-apply-list">
                        <h3 className="admin-list-title">지원 현황 ({applications.length})</h3>
                        <div className="admin-apply-feed">
                            {applications.map(app => (
                                <div key={app.id} className="admin-apply-comment">
                                    <div className="admin-apply-avatar">
                                        <div className="avatar-placeholder">
                                            {app.name.charAt(0)}
                                        </div>
                                    </div>
                                    <div className="admin-apply-content">
                                        <div className="admin-apply-main-row">
                                            <div className="admin-apply-user-info">
                                                <span className="admin-apply-username">{app.name}</span>
                                                {app.insta && (
                                                    <a
                                                        href={`https://instagram.com/${app.insta.replace('@', '')}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="admin-apply-insta-badge"
                                                    >
                                                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                                                        {app.insta}
                                                    </a>
                                                )}
                                            </div>
                                            <span className="admin-apply-time">
                                                {app.createdAt?.toDate ? new Date(app.createdAt.toDate()).toLocaleDateString() : 'New'}
                                            </span>
                                        </div>
                                        <div className="admin-apply-info-row">
                                            <span className="info-tag">📍 {app.location}</span>
                                            {app.job && <span className="info-tag">💼 {app.job}</span>}
                                            <span className="info-tag">📞 {app.phone}</span>
                                        </div>
                                        {app.keywords && (
                                            <div className="admin-apply-keywords">
                                                {app.keywords}
                                            </div>
                                        )}
                                    </div>
                                    <div className="admin-apply-actions">
                                        <button
                                            className={`admin-apply-select-btn ${app.isSelected ? 'active' : ''}`}
                                            onClick={() => handleToggleSelect(app.id, app.isSelected)}
                                            title={app.isSelected ? "선정 취소" : "선정하기"}
                                        >
                                            <svg viewBox="0 0 24 24" fill={app.isSelected ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                                        </button>
                                        <button
                                            className="admin-apply-delete-icon"
                                            onClick={() => handleDelete(app.id)}
                                            title="삭제"
                                        >✕</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
};

export default ModelRecruit;
