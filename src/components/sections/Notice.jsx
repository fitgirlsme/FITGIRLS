import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db as fireDb } from '../../utils/firebase';
import FadeInSection from '../FadeInSection';
import { fetchData } from '../../utils/dataService';
import { STORES } from '../../utils/db';
import './Notice.css';

const Notice = () => {
    const { t, i18n } = useTranslation();
    const [events, setEvents] = useState([]);
    const [openId, setOpenId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAdmin] = useState(localStorage.getItem('isAdmin') === 'true');

    // Admin states
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [editTarget, setEditTarget] = useState(null);
    const [editTitle, setEditTitle] = useState('');
    const [editContent, setEditContent] = useState('');
    const [editTitleEn, setEditTitleEn] = useState('');
    const [editContentEn, setEditContentEn] = useState('');
    const [editTitleJa, setEditTitleJa] = useState('');
    const [editContentJa, setEditContentJa] = useState('');
    const [editTitleZh, setEditTitleZh] = useState('');
    const [editContentZh, setEditContentZh] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [showMulti, setShowMulti] = useState(false);

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

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            await deleteDoc(doc(fireDb, 'events', deleteTarget.id));
            setEvents(prev => prev.filter(e => e.id !== deleteTarget.id));
            setDeleteTarget(null);
        } catch (err) {
            alert('삭제 오류: ' + err.message);
        }
    };

    const handleSave = async () => {
        if (!editTarget) return;
        setIsSaving(true);
        try {
            const docRef = doc(fireDb, 'events', editTarget.id);
            const updateData = {
                title: editTitle,
                content: editContent,
                titleEn: editTitleEn,
                contentEn: editContentEn,
                titleJa: editTitleJa,
                contentJa: editContentJa,
                titleZh: editTitleZh,
                contentZh: editContentZh,
                updatedAt: new Date()
            };
            await updateDoc(docRef, updateData);
            setEvents(prev => prev.map(e => e.id === editTarget.id ? { ...e, ...updateData } : e));
            setEditTarget(null);
        } catch (err) {
            alert('수정 오류: ' + err.message);
        } finally {
            setIsSaving(false);
        }
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
                                    
                                    {isAdmin && (
                                        <div className="notice-admin-btns" onClick={e => e.stopPropagation()}>
                                            <button className="notice-edit-btn" onClick={() => {
                                                setEditTarget(ev);
                                                setEditTitle(ev.title || '');
                                                setEditContent(ev.content || '');
                                                setEditTitleEn(ev.titleEn || '');
                                                setEditContentEn(ev.contentEn || '');
                                                setEditTitleJa(ev.titleJa || '');
                                                setEditContentJa(ev.contentJa || '');
                                                setEditTitleZh(ev.titleZh || '');
                                                setEditContentZh(ev.contentZh || '');
                                                setShowMulti(!!(ev.titleEn || ev.titleJa || ev.titleZh));
                                            }}>EDIT</button>
                                            <button className="notice-del-btn" onClick={() => setDeleteTarget(ev)}>DEL</button>
                                        </div>
                                    )}

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

            {/* Delete Confirm Modal */}
            {deleteTarget && (
                <div className="delete-confirm-overlay" onClick={() => setDeleteTarget(null)}>
                    <div className="delete-confirm-box" onClick={e => e.stopPropagation()}>
                        <p className="delete-confirm-title">정말 삭제하시겠습니까?</p>
                        <p className="delete-confirm-sub">나중에 복구할 수 없습니다.</p>
                        <div className="delete-confirm-btns">
                            <button className="delete-btn-cancel" onClick={() => setDeleteTarget(null)}>취소</button>
                            <button className="delete-btn-ok" onClick={handleDelete}>삭제</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {editTarget && (
                <div className="delete-confirm-overlay" onClick={() => !isSaving && setEditTarget(null)}>
                    <div className="delete-confirm-box notice-edit-box" style={{ maxWidth: 500, textAlign: 'left' }} onClick={e => e.stopPropagation()}>
                        <p className="delete-confirm-title">Notice 수정 {isSaving && '(저장 중...)'}</p>
                        
                        <div className="edit-field">
                            <label className="edit-label">제목 (기본/KO)</label>
                            <input type="text" className="edit-input" value={editTitle} onChange={e => setEditTitle(e.target.value)} />
                        </div>
                        <div className="edit-field">
                            <label className="edit-label">내용 (기본/KO)</label>
                            <textarea className="edit-input" rows={4} value={editContent} onChange={e => setEditContent(e.target.value)} />
                        </div>

                        <button className="edit-photo-btn" style={{ marginBottom: 15, width: '100%' }} onClick={() => setShowMulti(!showMulti)}>
                            {showMulti ? '다국어 영역 닫기' : '다국어 영역 열기 (EN/JA/ZH)'}
                        </button>

                        {showMulti && (
                            <div style={{ maxHeight: '30vh', overflowY: 'auto', paddingRight: 10 }}>
                                <div className="edit-field">
                                    <label className="edit-label">Title (EN)</label>
                                    <input type="text" className="edit-input" value={editTitleEn} onChange={e => setEditTitleEn(e.target.value)} />
                                    <label className="edit-label">Content (EN)</label>
                                    <textarea className="edit-input" rows={2} value={editContentEn} onChange={e => setEditContentEn(e.target.value)} />
                                </div>
                                <div className="edit-field">
                                    <label className="edit-label">Title (JA)</label>
                                    <input type="text" className="edit-input" value={editTitleJa} onChange={e => setEditTitleJa(e.target.value)} />
                                    <label className="edit-label">Content (JA)</label>
                                    <textarea className="edit-input" rows={2} value={editContentJa} onChange={e => setEditContentJa(e.target.value)} />
                                </div>
                                <div className="edit-field">
                                    <label className="edit-label">Title (ZH)</label>
                                    <input type="text" className="edit-input" value={editTitleZh} onChange={e => setEditTitleZh(e.target.value)} />
                                    <label className="edit-label">Content (ZH)</label>
                                    <textarea className="edit-input" rows={2} value={editContentZh} onChange={e => setEditContentZh(e.target.value)} />
                                </div>
                            </div>
                        )}

                        <div className="delete-confirm-btns" style={{ marginTop: 20 }}>
                            <button className="delete-btn-cancel" disabled={isSaving} onClick={() => setEditTarget(null)}>취소</button>
                            <button className="delete-btn-ok" style={{ background: '#3a7bd5' }} disabled={isSaving} onClick={handleSave}>저장</button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
};

export default Notice;
