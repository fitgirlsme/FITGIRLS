import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db as fireDb } from '../../utils/firebase';
import FadeInSection from '../FadeInSection';
import { fetchData } from '../../utils/dataService';
import { STORES } from '../../utils/db';
import './Notice.css';

const EventCard = ({ ev, isAdmin, onOpen, onEdit, onDelete, t, i18n }) => {
    const getTitle = () => {
        const lang = i18n.language;
        if (lang === 'ja' && ev.titleJa) return ev.titleJa;
        if (lang === 'zh' && ev.titleZh) return ev.titleZh;
        if ((lang === 'en' || lang?.startsWith('en')) && ev.titleEn) return ev.titleEn;
        return ev.title || '';
    };

    const formatDate = () => {
        if (ev.createdAt) {
            const d = ev.createdAt?.toDate ? ev.createdAt.toDate() : new Date(ev.createdAt);
            if (!isNaN(d)) return d.toLocaleDateString('ko-KR').replace(/\. /g, '.').replace(/\.$/, '');
        }
        return '';
    };

    const mainImg = ev.images && ev.images.length > 0 ? ev.images[0] : null;

    return (
        <div className="event-card" onClick={() => onOpen(ev)}>
            <div className="event-card-image" style={{ backgroundImage: mainImg ? `url(${mainImg})` : 'none' }}>
                {ev.images && ev.images.length > 1 && (
                    <div className="multi-image-badge">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                        </svg>
                        <span className="image-count">{ev.images.length}</span>
                    </div>
                )}
                <div className="event-card-overlay">
                    <span className="event-card-date">{formatDate()}</span>
                    <h3 className="event-card-title">{getTitle()}</h3>
                    <div className="event-card-more">VIEW DETAILS +</div>
                </div>
            </div>
            {isAdmin && (
                <div className="event-admin-tools" onClick={e => e.stopPropagation()}>
                    <button className="event-admin-btn edit" onClick={() => onEdit(ev)}>EDIT</button>
                    <button className="event-admin-btn del" onClick={() => onDelete(ev)}>DEL</button>
                </div>
            )}
        </div>
    );
};

const Notice = () => {
    const { t, i18n } = useTranslation();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAdmin] = useState(localStorage.getItem('isAdmin') === 'true');
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [currentImgIdx, setCurrentImgIdx] = useState(0);
    const touchStart = useRef(null);
    const touchEnd = useRef(null);

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

    const [isCreating, setIsCreating] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newContent, setNewContent] = useState('');
    const [newTitleEn, setNewTitleEn] = useState('');
    const [newContentEn, setNewContentEn] = useState('');
    const [newTitleJa, setNewTitleJa] = useState('');
    const [newContentJa, setNewContentJa] = useState('');
    const [newTitleZh, setNewTitleZh] = useState('');
    const [newContentZh, setNewContentZh] = useState('');

    const [newImages, setNewImages] = useState([]);
    const [newPreviews, setNewPreviews] = useState([]);

    useEffect(() => {
        fetchData(STORES.NOTICES, 'createdAt', 'desc', 20)
            .then(data => {
                setEvents(data || []);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    const getTitle = (ev) => {
        if (!ev) return '';
        const lang = i18n.language;
        if (lang === 'ja' && ev.titleJa) return ev.titleJa;
        if (lang === 'zh' && ev.titleZh) return ev.titleZh;
        if ((lang === 'en' || lang?.startsWith('en')) && ev.titleEn) return ev.titleEn;
        return ev.title || '';
    };

    const getContent = (ev) => {
        if (!ev) return '';
        const lang = i18n.language;
        if (lang === 'ja' && ev.contentJa) return ev.contentJa;
        if (lang === 'zh' && ev.contentZh) return ev.contentZh;
        if ((lang === 'en' || lang?.startsWith('en')) && ev.contentEn) return ev.contentEn;
        return ev.content || '';
    };

    const formatDate = (ev) => {
        if (!ev) return '';
        if (ev.createdAt) {
            const d = ev.createdAt?.toDate ? ev.createdAt.toDate() : new Date(ev.createdAt);
            if (!isNaN(d)) return d.toLocaleDateString('ko-KR').replace(/\. /g, '.').replace(/\.$/, '');
        }
        return '';
    };

    // Swipe handlers
    const minSwipeDistance = 50;

    const onTouchStart = (e) => {
        touchEnd.current = null;
        touchStart.current = e.targetTouches[0].clientX;
    };

    const onTouchMove = (e) => {
        touchEnd.current = e.targetTouches[0].clientX;
    };

    const onTouchEnd = () => {
        if (!touchStart.current || !touchEnd.current) return;
        const distance = touchStart.current - touchEnd.current;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;

        if (isLeftSwipe) {
            setCurrentImgIdx(prev => Math.min(selectedEvent.images.length - 1, prev + 1));
        } else if (isRightSwipe) {
            setCurrentImgIdx(prev => Math.max(0, prev - 1));
        }
    };

    const handleScroll = (direction) => {
        const track = document.querySelector('.event-slider-track');
        const scrollAmount = direction === 'left' ? -400 : 400;
        track.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    };

    const handleAutoTranslate = async (text, targetLang) => {
        if (!text) return '';
        try {
            const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=ko&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
            const res = await fetch(url);
            const data = await res.json();
            return data[0].map(x => x[0]).join('');
        } catch (e) {
            console.error(e);
            alert('번역 중 오류가 발생했습니다.');
            return text;
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            await deleteDoc(doc(fireDb, 'events', deleteTarget.id));
            setEvents(prev => prev.filter(e => e.id !== deleteTarget.id));
            setDeleteTarget(null);
            if (selectedEvent?.id === deleteTarget.id) setSelectedEvent(null);
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
            if (selectedEvent?.id === editTarget.id) setSelectedEvent({ ...selectedEvent, ...updateData });
            setEditTarget(null);
        } catch (err) {
            alert('수정 오류: ' + err.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleCreate = async () => {
        if (!newTitle.trim()) {
            alert('제목을 입력해주세요.');
            return;
        }
        setIsSaving(true);
        try {
            const { addDoc, collection } = await import('firebase/firestore');
            const { ref, uploadBytes, getDownloadURL } = await import('firebase/storage');
            const { storage : fireStorage } = await import('../../utils/firebase');
            
            const uploadedImageUrls = [];
            for (const file of newImages) {
                const path = `events/${Date.now()}_${file.name}`;
                const storageRef = ref(fireStorage, path);
                await uploadBytes(storageRef, file);
                const url = await getDownloadURL(storageRef);
                uploadedImageUrls.push(url);
            }

            const docData = {
                title: newTitle,
                content: newContent,
                titleEn: newTitleEn,
                contentEn: newContentEn,
                titleJa: newTitleJa,
                contentJa: newContentJa,
                titleZh: newTitleZh,
                contentZh: newContentZh,
                images: uploadedImageUrls,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            const colRef = collection(fireDb, 'events');
            const docRef = await addDoc(colRef, docData);
            setEvents(prev => [{ id: docRef.id, ...docData }, ...prev]);
            
            setIsCreating(false);
            setNewTitle('');
            setNewContent('');
            setNewTitleEn('');
            setNewContentEn('');
            setNewTitleJa('');
            setNewContentJa('');
            setNewTitleZh('');
            setNewContentZh('');
            setNewImages([]);
            setNewPreviews([]);
            setShowMulti(false);
        } catch (err) {
            alert('저장 오류: ' + err.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;
        setNewImages(prev => [...prev, ...files]);
        const previews = files.map(file => URL.createObjectURL(file));
        setNewPreviews(prev => [...prev, ...previews]);
    };

    const removeImage = (index) => {
        setNewImages(prev => prev.filter((_, i) => i !== index));
        setNewPreviews(prev => prev.filter((_, i) => i !== index));
    };

    return (
        <section className="notice-section" id="notice">
            <div className="container-inner">
                <FadeInSection className="notice-header">
                    <div className="notice-header-left">
                        <h2 className="section-title">EVENT & NOTICE</h2>
                    </div>
                    {isAdmin && (
                        <div className="notice-header-right">
                            <button className="notice-write-btn" onClick={() => {
                                setIsCreating(true);
                                setShowMulti(false);
                                setNewImages([]);
                                setNewPreviews([]);
                            }}>+</button>
                        </div>
                    )}
                </FadeInSection>

                <div className="event-slider-wrapper">
                    <button className="event-slider-arrow left" onClick={() => handleScroll('left')}>⟨</button>
                    <div className="event-slider-container">
                        <div className="event-slider-track">
                            {loading ? (
                                <div className="event-loading">Loading...</div>
                            ) : events.length === 0 ? (
                                <div className="event-empty">No events yet.</div>
                            ) : events.map(ev => (
                                <EventCard
                                    key={ev.id}
                                    ev={ev}
                                    isAdmin={isAdmin}
                                    onOpen={(ev) => {
                                        setSelectedEvent(ev);
                                        setCurrentImgIdx(0);
                                    }}
                                    onEdit={(ev) => {
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
                                    }}
                                    onDelete={setDeleteTarget}
                                    t={t}
                                    i18n={i18n}
                                />
                            ))}
                        </div>
                    </div>
                    <button className="event-slider-arrow right" onClick={() => handleScroll('right')}>⟩</button>
                </div>
            </div>

            {/* Event Detail Modal */}
            {selectedEvent && (
                <div className="event-detail-overlay" onClick={() => setSelectedEvent(null)}>
                    <div className="event-detail-modal" onClick={e => e.stopPropagation()}>
                        <button className="event-modal-close" onClick={() => setSelectedEvent(null)}>✕</button>
                        <div className="event-modal-header" onClick={() => setSelectedEvent(null)} style={{ cursor: 'pointer' }}>
                            <span className="event-modal-date">{formatDate(selectedEvent)}</span>
                            <h2 className="event-modal-title">{getTitle(selectedEvent)}</h2>
                        </div>
                        <div className="event-modal-body" onClick={() => setSelectedEvent(null)} style={{ cursor: 'pointer' }}>
                            <p className="event-modal-content">{getContent(selectedEvent)}</p>
                            {selectedEvent.images && selectedEvent.images.length > 0 && (
                                <div className="event-modal-carousel" onClick={e => e.stopPropagation()} style={{ cursor: 'default' }}>
                                    <div 
                                        className="carousel-view"
                                        onTouchStart={onTouchStart}
                                        onTouchMove={onTouchMove}
                                        onTouchEnd={onTouchEnd}
                                    >
                                        <div 
                                            className="carousel-track" 
                                            style={{ transform: `translateX(-${currentImgIdx * 100}%)` }}
                                        >
                                            {selectedEvent.images.map((img, i) => (
                                                <div key={i} className="carousel-slide">
                                                    <img src={img} alt={`event-${i}`} />
                                                </div>
                                            ))}
                                        </div>
                                        
                                        {selectedEvent.images.length > 1 && (
                                            <>
                                                <button 
                                                    className="carousel-arrow prev" 
                                                    onClick={() => setCurrentImgIdx(prev => Math.max(0, prev - 1))}
                                                    disabled={currentImgIdx === 0}
                                                >⟨</button>
                                                <button 
                                                    className="carousel-arrow next" 
                                                    onClick={() => setCurrentImgIdx(prev => Math.min(selectedEvent.images.length - 1, prev + 1))}
                                                    disabled={currentImgIdx === selectedEvent.images.length - 1}
                                                >⟩</button>
                                                
                                                <div className="carousel-dots">
                                                    {selectedEvent.images.map((_, i) => (
                                                        <span 
                                                            key={i} 
                                                            className={`dot ${i === currentImgIdx ? 'active' : ''}`}
                                                            onClick={() => setCurrentImgIdx(i)}
                                                        />
                                                    ))}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Delete/Edit/Create Modals remain consistent but with updated styling */}
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
                        <p className="delete-confirm-title">Edit Event {isSaving && '(저장 중...)'}</p>
                        
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

            {/* Create Modal */}
            {isCreating && (
                <div className="delete-confirm-overlay" onClick={() => !isSaving && setIsCreating(false)}>
                    <div className="delete-confirm-box notice-edit-box" style={{ maxWidth: 500, textAlign: 'left' }} onClick={e => e.stopPropagation()}>
                        <h3 className="delete-confirm-title">새 이벤트 작성 {isSaving && '(저장 중...)'}</h3>
                        
                        <div className="edit-field">
                            <label className="edit-label">이미지 첨부 (여러 장 가능)</label>
                            <input type="file" multiple accept="image/*" onChange={handleImageChange} className="edit-input" style={{ padding: '8px' }} />
                            {newPreviews.length > 0 && (
                                <div className="notice-create-previews">
                                    {newPreviews.map((p, i) => (
                                        <div key={i} className="notice-create-preview-item">
                                            <img src={p} alt="preview" />
                                            <button onClick={() => removeImage(i)}>✕</button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="edit-field">
                            <label className="edit-label">제목 (기본/KO)</label>
                            <input type="text" className="edit-input" value={newTitle} onChange={e => setNewTitle(e.target.value)} />
                        </div>
                        <div className="edit-field">
                            <label className="edit-label">내용 (기본/KO)</label>
                            <textarea className="edit-input" rows={4} value={newContent} onChange={e => setNewContent(e.target.value)} />
                        </div>

                        <button className="edit-photo-btn" style={{ marginBottom: 15, width: '100%' }} onClick={() => setShowMulti(!showMulti)}>
                            {showMulti ? '다국어 영역 닫기' : '다국어 영역 열기 (EN/JA/ZH)'}
                        </button>

                        {showMulti && (
                            <div style={{ maxHeight: '30vh', overflowY: 'auto', paddingRight: 10 }}>
                                <div className="edit-field">
                                    <div className="edit-label-row">
                                        <label className="edit-label">Title (EN)</label>
                                        <button className="auto-trans-btn" onClick={async () => setNewTitleEn(await handleAutoTranslate(newTitle, 'en'))}>Auto</button>
                                    </div>
                                    <input type="text" className="edit-input" value={newTitleEn} onChange={e => setNewTitleEn(e.target.value)} />
                                    <div className="edit-label-row">
                                        <label className="edit-label">Content (EN)</label>
                                        <button className="auto-trans-btn" onClick={async () => setNewContentEn(await handleAutoTranslate(newContent, 'en'))}>Auto</button>
                                    </div>
                                    <textarea className="edit-input" rows={2} value={newContentEn} onChange={e => setNewContentEn(e.target.value)} />
                                </div>
                                <div className="edit-field">
                                    <div className="edit-label-row">
                                        <label className="edit-label">Title (JA)</label>
                                        <button className="auto-trans-btn" onClick={async () => setNewTitleJa(await handleAutoTranslate(newTitle, 'ja'))}>Auto</button>
                                    </div>
                                    <input type="text" className="edit-input" value={newTitleJa} onChange={e => setNewTitleJa(e.target.value)} />
                                    <div className="edit-label-row">
                                        <label className="edit-label">Content (JA)</label>
                                        <button className="auto-trans-btn" onClick={async () => setNewContentJa(await handleAutoTranslate(newContent, 'ja'))}>Auto</button>
                                    </div>
                                    <textarea className="edit-input" rows={2} value={newContentJa} onChange={e => setNewContentJa(e.target.value)} />
                                </div>
                                <div className="edit-field">
                                    <div className="edit-label-row">
                                        <label className="edit-label">Title (ZH)</label>
                                        <button className="auto-trans-btn" onClick={async () => setNewTitleZh(await handleAutoTranslate(newTitle, 'zh-CN'))}>Auto</button>
                                    </div>
                                    <input type="text" className="edit-input" value={newTitleZh} onChange={e => setNewTitleZh(e.target.value)} />
                                    <div className="edit-label-row">
                                        <label className="edit-label">Content (ZH)</label>
                                        <button className="auto-trans-btn" onClick={async () => setNewContentZh(await handleAutoTranslate(newContent, 'zh-CN'))}>Auto</button>
                                    </div>
                                    <textarea className="edit-input" rows={2} value={newContentZh} onChange={e => setNewContentZh(e.target.value)} />
                                </div>
                            </div>
                        )}

                        <div className="delete-confirm-btns" style={{ marginTop: 20 }}>
                            <button className="delete-btn-cancel" disabled={isSaving} onClick={() => setIsCreating(false)}>취소</button>
                            <button className="delete-btn-ok" style={{ background: '#00c35b' }} disabled={isSaving} onClick={handleCreate}>등록</button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
};

export default Notice;
