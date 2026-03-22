import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { addItem, getData, deleteItem, STORES } from '../../utils/db';
import { db } from '../../utils/firebase';
import { collection, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import './ModelRecruit.css';

const ModelRecruit = () => {
    const { t } = useTranslation();
    const [form, setForm] = useState({ name: '', insta: '', location: '', phone: '' });
    const [status, setStatus] = useState(null); // 'success' | 'error'
    const [submitting, setSubmitting] = useState(false);
    const [applications, setApplications] = useState([]);
    const isAdmin = localStorage.getItem('isAdmin') === 'true';

    useEffect(() => {
        if (isAdmin) {
            getData(STORES.APPLICATIONS).then(setApplications).catch(console.error);
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
            setForm({ name: '', insta: '', location: '', phone: '' });
            if (isAdmin) {
                const list = await getData(STORES.APPLICATIONS);
                setApplications(list);
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
                    <p>{t('modelApply.subtitle', '핏걸즈와 함께 성장을 꿈꾸는 엠버서더를 찾습니다.')}</p>
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
                                            <a
                                                href={app.insta ? `https://instagram.com/${app.insta.replace('@', '')}` : '#'}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="admin-apply-user-link"
                                            >
                                                <span className="admin-apply-username">{app.name}</span>
                                                {app.insta && <span className="admin-apply-handle">{app.insta}</span>}
                                            </a>
                                            <span className="admin-apply-time">
                                                {app.createdAt?.toDate ? new Date(app.createdAt.toDate()).toLocaleDateString() : 'New'}
                                            </span>
                                        </div>
                                        <div className="admin-apply-info-row">
                                            <span className="info-tag">📍 {app.location}</span>
                                            <span className="info-tag">📞 {app.phone}</span>
                                        </div>
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
