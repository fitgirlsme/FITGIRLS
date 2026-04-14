import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import FadeInSection from '../FadeInSection';
import { getGalleries } from '../../utils/galleryService';
import { db as fireDb } from '../../utils/firebase';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { getStorage, ref, deleteObject } from 'firebase/storage';
import { collection, addDoc, getDocs, query } from 'firebase/firestore';
import { uploadOptimizedImage } from '../../utils/uploadService';
import './Zone.css';

const ZONE_DATA = [
    { id: 'zone-1', nameKey: 'zone.names.zone1', img: '/images/zones/zone-1.jpg' },
    { id: 'zone-2', nameKey: 'zone.names.zone2', img: '/images/zones/zone-2.jpg' },
    { id: 'zone-3', nameKey: 'zone.names.zone3', img: '/images/zones/zone-3.jpg' },
    { id: 'zone-4', nameKey: 'zone.names.zone4', img: '/images/zones/zone-4.jpg' },
    { id: 'zone-5', nameKey: 'zone.names.zone5', img: '/images/zones/zone-5.jpg' },
    { id: 'zone-6', nameKey: 'zone.names.zone6', img: '/images/zones/zone-6.jpg' },
    { id: 'zone-7', nameKey: 'zone.names.zone7', img: '/images/zones/zone-7.jpg' },
    { id: 'zone-8', nameKey: 'zone.names.zone8', img: '/images/zones/zone-8.jpg' },
    { id: 'zone-9', nameKey: 'zone.names.zone9', img: '/images/zones/zone-9.jpg' },
    { id: 'zone-10', nameKey: 'zone.names.zone10', img: '/images/zones/zone-10.jpg' },
    { id: 'zone-11', nameKey: 'zone.names.zone11', img: '/images/zones/zone-11.jpg' },
    { id: 'zone-12', nameKey: 'zone.names.zone12', img: '/images/zones/zone-12.jpg' },
    { id: 'zone-13', nameKey: 'zone.names.zone13', img: '/images/zones/zone-13.jpg' },
    { id: 'zone-14', nameKey: 'zone.names.zone14', img: '/images/zones/zone-14.jpg' },
    { id: 'zone-15', nameKey: 'zone.names.zone15', img: '/images/zones/zone-15.jpg' },
    { id: 'zone-16', nameKey: 'zone.names.zone16', img: '/images/zones/zone-16.jpg' },
    { id: 'zone-17', nameKey: 'zone.names.zone17', img: '/images/zones/zone-17.jpg' },
    { id: 'zone-18', nameKey: 'zone.names.zone18', img: '/images/zones/zone-18.jpg' },
    { id: 'zone-19', nameKey: 'zone.names.zone19', img: '/images/zones/zone-19.jpg' },
    { id: 'zone-20', nameKey: 'zone.names.zone20', img: '/images/zones/zone-20.jpg' },
    { id: 'zone-21', nameKey: 'zone.names.zone21', img: '/images/zones/zone-21.jpg' },
    { id: 'zone-22', nameKey: 'zone.names.zone22', img: '/images/zones/zone-22.jpg' },
    { id: 'zone-23', nameKey: 'zone.names.zone23', img: '/images/zones/zone-23.jpg' },
    { id: 'zone-24', nameKey: 'zone.names.zone24', img: '/images/zones/zone-24.jpg' },
];

const Zone = () => {
    const { t } = useTranslation();
    const [searchParams] = useSearchParams();
    const [activeTab, setActiveTab] = useState('zone');
    const [zoneSubTab, setZoneSubTab] = useState('fitgirls');
    const [lookbookItems, setLookbookItems] = useState([]);
    const [studios, setStudios] = useState([]);
    const [visibleCount, setVisibleCount] = useState(18);

    // URL query param으로 탭 자동 선택
    useEffect(() => {
        const tabParam = searchParams.get('tab');
        if (tabParam === 'lookbook') {
            setActiveTab('lookbook');
        } else if (tabParam === 'zone') {
            setActiveTab('zone');
        }
    }, [searchParams]);

    // Admin session
    const [isAdmin] = useState(localStorage.getItem('isAdmin') === 'true');

    // Edit modal state (Lookbook)
    const [editItem, setEditItem] = useState(null);
    const [editName, setEditName] = useState('');
    const [editSize, setEditSize] = useState('');

    // Edit modal state (Studios)
    const [editStudio, setEditStudio] = useState(null);
    const [editStudioTitle, setEditStudioTitle] = useState('');
    const [editStudioCat, setEditStudioCat] = useState('fitgirls');
    const [editStudioImage, setEditStudioImage] = useState('');
    const [isUploadingStudioImg, setIsUploadingStudioImg] = useState(false);

    // Delete confirm state
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleteStudioTarget, setDeleteStudioTarget] = useState(null);

    // Upload ref
    const uploadRef = useRef(null);

    // Lookbook 데이터 로드
    useEffect(() => {
        if (activeTab === 'lookbook') {
            (async () => {
                try {
                    const items = await getGalleries('LOOKBOOK');
                    // 최신순 정렬
                    const sorted = [...items].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
                    setLookbookItems(sorted);
                } catch (err) {
                    console.error('Failed to load lookbook:', err);
                }
            })();
        }
    }, [activeTab]);

    // Studio Zones 데이터 로드
    useEffect(() => {
        const fetchStudios = async () => {
            try {
                const snap = await getDocs(query(collection(fireDb, 'studios')));
                const loadedStudios = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                loadedStudios.sort((a, b) => {
                    const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt || 0);
                    const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt || 0);
                    return timeB - timeA;
                });
                setStudios(loadedStudios);
            } catch (err) {
                console.error("Failed to load studios", err);
            }
        };
        fetchStudios();
    }, []);

    // 룩북 아이템 수정
    const handleEdit = async () => {
        if (!editItem) return;
        try {
            await updateDoc(doc(fireDb, 'lookbook', editItem.id), {
                outfitName: editName.trim(),
                outfitSize: editSize.trim(),
            });
            setLookbookItems(prev => prev.map(item =>
                item.id === editItem.id
                    ? { ...item, outfitName: editName.trim(), outfitSize: editSize.trim() }
                    : item
            ));
            setEditItem(null);
            setEditName('');
            setEditSize('');
        } catch (err) {
            alert('수정 중 오류가 발생했습니다.');
            console.error(err);
        }
    };

    // 룩북 옵션 삭제
    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            await deleteDoc(doc(fireDb, 'lookbook', deleteTarget.id));
            if (deleteTarget.storagePath) {
                try {
                    const storage = getStorage();
                    await deleteObject(ref(storage, deleteTarget.storagePath));
                } catch (storageErr) {
                    console.warn('Storage delete failed:', storageErr);
                }
            }
            setLookbookItems(prev => prev.filter(item => item.id !== deleteTarget.id));
        } catch (err) {
            console.error('Delete failed:', err);
        }
        setDeleteTarget(null);
    };

    // 스튜디오 배경사진 핸들러
    const handleEditStudioPhoto = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsUploadingStudioImg(true);
        try {
            const { url } = await uploadOptimizedImage(file, 'studios');
            setEditStudioImage(url);
        } catch (err) {
            alert(`업로드 실패: ${err.message}`);
        } finally {
            setIsUploadingStudioImg(false);
        }
    };

    // 스튜디오 수정
    const handleEditStudio = async () => {
        if (!editStudio) return;
        try {
            await updateDoc(doc(fireDb, 'studios', editStudio.id), {
                title: editStudioTitle.trim(),
                category: editStudioCat,
                image: editStudioImage
            });
            setStudios(prev => prev.map(s => 
                s.id === editStudio.id ? { ...s, title: editStudioTitle.trim(), category: editStudioCat, image: editStudioImage } : s
            ));
            setEditStudio(null);
            setEditStudioTitle('');
            setEditStudioCat('fitgirls');
            setEditStudioImage('');
        } catch(err) {
            alert('수정 중 오류가 발생했습니다.');
            console.error(err);
        }
    };

    // 스튜디오 삭제
    const handleDeleteStudio = async () => {
        if (!deleteStudioTarget) return;
        try {
            await deleteDoc(doc(fireDb, 'studios', deleteStudioTarget.id));
            setStudios(prev => prev.filter(s => s.id !== deleteStudioTarget.id));
            setDeleteStudioTarget(null);
        } catch(err) {
            alert('삭제 중 오류가 발생했습니다.');
            console.error(err);
        }
    };

    // 룩북 이미지 업로드
    const handleUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        e.target.value = '';
        try {
            // 공통 최적화 서비스 사용 (리사이징, WebP 변환, 메타데이터 삭제 자동 적용)
            const { url, path } = await uploadOptimizedImage(file, 'lookbook');

            const newDoc = await addDoc(collection(fireDb, 'lookbook'), {
                img: url,
                outfitName: '',
                outfitSize: '',
                storagePath: path,
                createdAt: Date.now(),
            });

            setLookbookItems(prev => [{ id: newDoc.id, img: url, outfitName: '', outfitSize: '', storagePath: path, createdAt: Date.now() }, ...prev]);
        } catch (err) {
            alert(`업로드 실패: ${err.message}`);
            console.error(err);
        }
    };

    const visibleLookbook = lookbookItems.slice(0, visibleCount);
    const hasMore = visibleCount < lookbookItems.length;

    return (
        <div className="zone-full-container">
            <FadeInSection className="zone-header-wrapper">
                <h2 className="zone-main-title">{t('zone.title')}</h2>
                <p className="zone-subtitle">{t('zone.subtitle')}</p>
                <p className="zone-subtitle zone-subtitle-insta">
                    {t('zone.subtitleInsta')}{' '}
                    <a
                        href="https://www.instagram.com/explore/tags/%ED%95%8F%EA%B1%B8%EC%A6%88/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="zone-insta-hashtag"
                    >
                        {t('zone.subtitleHashtag')}
                    </a>
                    {t('zone.subtitleInstaEnd')}
                </p>

                <div className="tier1-tabs zone-tabs-container" style={{ marginTop: '24px', marginBottom: '10px' }}>
                    <button
                        className={`tier1-tab ${activeTab === 'zone' ? 'active' : ''}`}
                        onClick={() => setActiveTab('zone')}
                    >
                        {t('zone.tabs.zone')}
                    </button>
                    <button
                        className={`tier1-tab ${activeTab === 'lookbook' ? 'active' : ''}`}
                        onClick={() => setActiveTab('lookbook')}
                    >
                        {t('zone.tabs.lookbook')}
                    </button>
                </div>
            </FadeInSection>

            {activeTab === 'zone' ? (
                <div className="zone-grid-container" style={{ animation: 'fadeIn 0.5s ease' }}>
                    <div className="tier2-tabs" style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '40px', flexWrap: 'wrap' }}>
                        <button
                            className={`tier2-tab ${zoneSubTab === 'fitgirls' ? 'active' : ''}`}
                            onClick={() => setZoneSubTab('fitgirls')}
                            style={{ 
                                padding: '10px 24px', 
                                borderRadius: '30px', 
                                border: '1px solid rgba(255,255,255,0.2)', 
                                background: zoneSubTab === 'fitgirls' ? '#fff' : 'rgba(255,255,255,0.05)', 
                                color: zoneSubTab === 'fitgirls' ? '#000' : '#aaa', 
                                cursor: 'pointer', 
                                transition: 'all 0.3s ease',
                                fontSize: '0.95rem',
                                fontWeight: zoneSubTab === 'fitgirls' ? '600' : '400'
                            }}
                        >
                            FITGIRLS & INAFIT
                        </button>
                        <button
                            className={`tier2-tab ${zoneSubTab === 'mooz' ? 'active' : ''}`}
                            onClick={() => setZoneSubTab('mooz')}
                            style={{ 
                                padding: '10px 24px', 
                                borderRadius: '30px', 
                                border: '1px solid rgba(255,255,255,0.2)', 
                                background: zoneSubTab === 'mooz' ? '#fff' : 'rgba(255,255,255,0.05)', 
                                color: zoneSubTab === 'mooz' ? '#000' : '#aaa', 
                                cursor: 'pointer', 
                                transition: 'all 0.3s ease',
                                fontSize: '0.95rem',
                                fontWeight: zoneSubTab === 'mooz' ? '600' : '400'
                            }}
                        >
                            MOOZ SELF스튜디오
                        </button>
                    </div>

                    <div className="zone-grid">
                        {studios.filter(s => s.category === zoneSubTab).map(zone => (
                            <div key={zone.id} className="zone-card">
                                <div className="zone-img-wrapper" style={{ background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '200px', position: 'relative' }}>
                                    {(zone.image || zone.img) ? (
                                        <img src={zone.image || zone.img} alt={zone.title} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <span style={{ color: '#666', fontSize: '0.9rem' }}>{zone.title}</span>
                                    )}
                                </div>
                                <div className="zone-info">
                                    <span className="zone-badge">{zone.category === 'mooz' ? 'MOOZ SELF' : 'STUDIO ZONE'}</span>
                                    <h3 className="zone-name">{zone.title || zone.nameKey}</h3>
                                    {isAdmin && (
                                        <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                                            <button
                                                style={{ background: '#444', color: '#fff', border: 'none', padding: '4px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setEditStudio(zone);
                                                    setEditStudioTitle(zone.title || zone.nameKey || '');
                                                    setEditStudioCat(zone.category || 'fitgirls');
                                                    setEditStudioImage(zone.image || zone.img || '');
                                                }}
                                            >수정</button>
                                            <button
                                                style={{ background: '#b32d2e', color: '#fff', border: 'none', padding: '4px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setDeleteStudioTarget(zone);
                                                }}
                                            >삭제</button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                    {studios.filter(s => s.category === zoneSubTab).length === 0 && (
                        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#888', fontSize: '1rem' }}>
                            등록된 배경이 없습니다.
                        </div>
                    )}
                </div>
            ) : (
                <div className="gallery-masonry-wrapper" style={{ animation: 'fadeIn 0.5s ease' }}>
                    {lookbookItems.length > 0 && (
                        <p className="lookbook-notice-text">{t('zone.lookbookNotice')}</p>
                    )}

                    {/* Hidden file input for upload */}
                    <input
                        ref={uploadRef}
                        id="lookbook-quick-upload"
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={handleUpload}
                    />

                    <div className="lookbook-grid">
                        {visibleLookbook.map((item, idx) => (
                            <div key={item.id || idx} className="lookbook-item">
                                <div className="lookbook-img-wrapper">
                                    <img src={item.img || item.imageUrl} alt="Lookbook" loading="lazy" />
                                </div>
                                <div className="lookbook-info">
                                    {item.outfitName && (
                                        <p className="lookbook-name">{item.outfitName}</p>
                                    )}
                                    <p className="lookbook-size">
                                        {item.outfitSize
                                            ? String(item.outfitSize).includes('/') || String(item.outfitSize).includes(',')
                                                ? `${t('zone.lookbook.top')} ${String(item.outfitSize).split(/[/,]/)[0].trim()} / ${t('zone.lookbook.bottom')} ${String(item.outfitSize).split(/[/,]/)[1]?.trim() || ''}`
                                                : `${t('zone.lookbook.sizeLabel')} ${item.outfitSize}`
                                            : t('zone.lookbook.sizeUnknown')
                                        }
                                    </p>
                                    {/* Admin: 수정/삭제 버튼 */}
                                    {isAdmin && (
                                        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                                            <button
                                                style={{
                                                    background: '#444', color: '#fff', border: 'none',
                                                    padding: '4px 12px', borderRadius: '4px',
                                                    cursor: 'pointer', fontSize: '0.8rem'
                                                }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setEditItem(item);
                                                    setEditName(item.outfitName || '');
                                                    setEditSize(item.outfitSize || '');
                                                }}
                                            >
                                                수정
                                            </button>
                                            <button
                                                style={{
                                                    background: '#b32d2e', color: '#fff', border: 'none',
                                                    padding: '4px 12px', borderRadius: '4px',
                                                    cursor: 'pointer', fontSize: '0.8rem'
                                                }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setDeleteTarget(item);
                                                }}
                                            >
                                                삭제
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Admin: 의상 추가 버튼 */}
                    {isAdmin && (
                        <div
                            className="lookbook-add-full-btn"
                            onClick={() => uploadRef.current?.click()}
                            style={{
                                width: '100%', marginTop: '40px', padding: '16px 0',
                                backgroundColor: '#222', color: '#fff', textAlign: 'center',
                                cursor: 'pointer', fontSize: '1rem', fontWeight: '500',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                            }}
                        >
                            <span style={{ fontSize: '1.4rem', lineHeight: '1' }}>+</span>
                            <span>의상 추가</span>
                        </div>
                    )}

                    {hasMore && (
                        <div className="gallery-more-container">
                            <button
                                className="gallery-more-btn"
                                onClick={() => setVisibleCount(prev => prev + 18)}
                            >
                                더 보기
                            </button>
                        </div>
                    )}

                    {lookbookItems.length === 0 && (
                        <div className="gallery-empty-state">
                            <p>룩북 이미지가 없습니다.</p>
                        </div>
                    )}
                </div>
            )}

            {/* 수정 모달 */}
            {editItem && (
                <div className="delete-confirm-overlay" onClick={() => { setEditItem(null); setEditName(''); setEditSize(''); }}>
                    <div className="delete-confirm-box" onClick={(e) => e.stopPropagation()} style={{ minWidth: '320px', textAlign: 'left' }}>
                        <p className="delete-confirm-title" style={{ textAlign: 'center', marginBottom: '20px' }}>
                            의상 정보 수정
                        </p>
                        <div style={{ marginBottom: '16px' }}>
                            <p style={{ margin: '0 0 8px', fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)' }}>
                                의상 이름 (Outfit Name)
                            </p>
                            <input
                                type="text"
                                placeholder="예: 시그니처 바디수트"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                style={{
                                    width: '100%', padding: '10px 12px', borderRadius: '8px',
                                    border: '1px solid rgba(255,255,255,0.2)',
                                    background: 'rgba(255,255,255,0.08)', color: '#fff',
                                    fontSize: '0.95rem', boxSizing: 'border-box',
                                }}
                            />
                        </div>
                        <div style={{ marginBottom: '24px' }}>
                            <p style={{ margin: '0 0 8px', fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)' }}>
                                사이즈 (Size)
                            </p>
                            <input
                                type="text"
                                placeholder="예: FREE, S, M, L"
                                value={editSize}
                                onChange={(e) => setEditSize(e.target.value)}
                                style={{
                                    width: '100%', padding: '10px 12px', borderRadius: '8px',
                                    border: '1px solid rgba(255,255,255,0.2)',
                                    background: 'rgba(255,255,255,0.08)', color: '#fff',
                                    fontSize: '0.95rem', boxSizing: 'border-box',
                                }}
                            />
                        </div>
                        <div className="delete-confirm-btns">
                            <button className="delete-btn-cancel" onClick={() => { setEditItem(null); setEditName(''); setEditSize(''); }}>
                                취소
                            </button>
                            <button className="delete-btn-ok" style={{ background: '#3a7bd5' }} onClick={handleEdit}>
                                저장
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 삭제 확인 모달 (룩북) */}
            {deleteTarget && (
                <div className="delete-confirm-overlay" onClick={() => setDeleteTarget(null)}>
                    <div className="delete-confirm-box" onClick={(e) => e.stopPropagation()}>
                        <p className="delete-confirm-title">의상을 삭제할까요?</p>
                        <p className="delete-confirm-sub">삭제하면 복구할 수 없습니다.</p>
                        <div className="delete-confirm-btns">
                            <button className="delete-btn-cancel" onClick={() => setDeleteTarget(null)}>취소</button>
                            <button className="delete-btn-ok" onClick={handleDelete}>삭제</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Studio Edit 모달 */}
            {editStudio && (
                <div className="delete-confirm-overlay" onClick={() => { setEditStudio(null); }}>
                    <div className="delete-confirm-box" onClick={(e) => e.stopPropagation()} style={{ minWidth: '320px', textAlign: 'left' }}>
                        <p className="delete-confirm-title" style={{ textAlign: 'center', marginBottom: '20px' }}>
                            스튜디오 정보 수정
                        </p>
                        <div style={{ marginBottom: '16px' }}>
                            <p style={{ margin: '0 0 8px', fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)' }}>
                                스튜디오 이름 (Title)
                            </p>
                            <input
                                type="text"
                                placeholder="예: Black Moon"
                                value={editStudioTitle}
                                onChange={(e) => setEditStudioTitle(e.target.value)}
                                style={{
                                    width: '100%', padding: '10px 12px', borderRadius: '8px',
                                    border: '1px solid rgba(255,255,255,0.2)',
                                    background: 'rgba(255,255,255,0.08)', color: '#fff',
                                    fontSize: '0.95rem', boxSizing: 'border-box',
                                }}
                            />
                        </div>
                        <div style={{ marginBottom: '24px' }}>
                            <p style={{ margin: '0 0 8px', fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)' }}>
                                카테고리 (Category)
                            </p>
                            <select
                                value={editStudioCat}
                                onChange={(e) => setEditStudioCat(e.target.value)}
                                style={{
                                    width: '100%', padding: '10px 12px', borderRadius: '8px',
                                    border: '1px solid rgba(255,255,255,0.2)',
                                    background: 'rgba(255,255,255,0.08)', color: '#fff',
                                    fontSize: '0.95rem', boxSizing: 'border-box',
                                }}
                            >
                                <option value="fitgirls">FITGIRLS & INAFIT</option>
                                <option value="mooz">MOOZ SELF Studio</option>
                            </select>
                        </div>
                        <div style={{ marginBottom: '24px' }}>
                            <p style={{ margin: '0 0 8px', fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)' }}>
                                배경 사진 (Background Photo)
                            </p>
                            <input
                                type="file"
                                onChange={handleEditStudioPhoto}
                                accept="image/*"
                                disabled={isUploadingStudioImg}
                                style={{ width: '100%', fontSize: '0.9rem', color: '#fff' }}
                            />
                            {isUploadingStudioImg && <p style={{ color: '#3a7bd5', fontSize: '0.85rem', marginTop: 8 }}>사진 업로드 중... 잠시만 기다려주세요.</p>}
                            {editStudioImage && !isUploadingStudioImg && (
                                <div style={{ position: 'relative', marginTop: 12, width: '120px' }}>
                                    <img src={editStudioImage} alt="" style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '8px' }} />
                                    <button onClick={() => setEditStudioImage('')} style={{ position: 'absolute', top: -8, right: -8, background: '#ff4444', color: '#fff', border: 'none', borderRadius: '50%', width: 24, height: 24, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', padding: 0 }}>×</button>
                                </div>
                            )}
                        </div>
                        <div className="delete-confirm-btns">
                            <button className="delete-btn-cancel" onClick={() => { setEditStudio(null); setEditStudioImage(''); }}>
                                취소
                            </button>
                            <button className="delete-btn-ok" style={{ background: '#3a7bd5' }} onClick={handleEditStudio} disabled={isUploadingStudioImg}>
                                {isUploadingStudioImg ? '업로드 중...' : '저장'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Studio 삭제 확인 모달 */}
            {deleteStudioTarget && (
                <div className="delete-confirm-overlay" onClick={() => setDeleteStudioTarget(null)}>
                    <div className="delete-confirm-box" onClick={(e) => e.stopPropagation()}>
                        <p className="delete-confirm-title">정말 삭제하실건가요?</p>
                        <p className="delete-confirm-sub">삭제하면 복구할 수 없습니다.</p>
                        <div className="delete-confirm-btns">
                            <button className="delete-btn-cancel" onClick={() => setDeleteStudioTarget(null)}>취소</button>
                            <button className="delete-btn-ok" onClick={handleDeleteStudio}>삭제</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Zone;
