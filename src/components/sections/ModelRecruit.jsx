import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { addItem, STORES } from '../../utils/db';
import { db } from '../../utils/firebase';
import { collection, addDoc, serverTimestamp, getDocs, query } from 'firebase/firestore';
import './ModelRecruit.css';

const ModelRecruit = () => {
    const { t } = useTranslation();
    const [form, setForm] = useState({ name: '', insta: '', location: '', job: '', phone: '', keywords: '' });
    const [status, setStatus] = useState(null); // 'success' | 'error'
    const [submitting, setSubmitting] = useState(false);

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
        } catch {
            setStatus('error');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <section className="model-apply-section">
            <div className="model-apply-container">
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
                {/* Admin-only applicants view */}
                {(() => {
                    const [count, setCount] = React.useState(null);
                    const isAdmin = localStorage.getItem('admin_logged_in') === 'true';
                    
                    React.useEffect(() => {
                        if (isAdmin) {
                            getDocs(query(collection(db, 'applications'))).then(snap => {
                                setCount(snap.size);
                            }).catch(console.error);
                        }
                    }, [isAdmin]);

                    if (!isAdmin) return null;

                    return (
                        <div style={{ marginTop: '20px', textAlign: 'center' }}>
                            <a href="/admin" style={{ 
                                display: 'inline-block',
                                padding: '10px 20px',
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '8px',
                                color: 'var(--color-primary)',
                                textDecoration: 'none',
                                fontSize: '0.9rem',
                                fontWeight: 600,
                                transition: 'all 0.2s'
                            }}>
                                📋 {t('modelApply.viewApps', '지원자보기')} (지원인원 +{count ?? '...'}명)
                            </a>
                        </div>
                    );
                })()}

                <div className="model-apply-footer-note">
                    {t('modelApply.footerNote', '핏걸즈&이너핏은 전 세계 모든 열정과 아름다움을 존중합니다. 국적 및 연령에 제한 없이, 자신만의 독보적인 무드를 가진 분이라면 누구나 2026 핏토리얼리스트가 될 수 있습니다.')}
                </div>
            </div>
        </section>
    );
};

export default ModelRecruit;
