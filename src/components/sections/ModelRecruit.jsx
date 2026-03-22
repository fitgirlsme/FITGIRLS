import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { addItem, getData, deleteItem, STORES } from '../../utils/db';
import { db } from '../../utils/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
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

    return (
        <section className="model-apply-section">
            <div className="model-apply-container">
                <div className="model-apply-header">
                    <h2>{t('modelApply.title', '2026 FITORIAL 엠버서더 지원')}</h2>
                    <p>{t('modelApply.subtitle', '핏걸즈와 함께 성장을 꿈꾸는 모델을 찾습니다.')}</p>
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
                        <h3 className="admin-list-title">지원 목록 ({applications.length})</h3>
                        {applications.map(app => (
                            <div key={app.id} className="admin-apply-item">
                                <div className="admin-apply-info">
                                    <span className="admin-apply-name">{app.name}</span>
                                    {app.insta ? (
                                        <a
                                            href={`https://instagram.com/${app.insta.replace('@', '')}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="admin-apply-insta"
                                        >{app.insta}</a>
                                    ) : (
                                        <span className="admin-apply-detail">-</span>
                                    )}
                                    <span className="admin-apply-detail">{app.location}</span>
                                    <span className="admin-apply-detail">{app.phone}</span>
                                </div>
                                <button
                                    className="admin-apply-delete"
                                    onClick={() => handleDelete(app.id)}
                                >✕</button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
};

export default ModelRecruit;
