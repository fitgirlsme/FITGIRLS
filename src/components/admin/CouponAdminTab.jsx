import React, { useState, useEffect, useRef } from 'react';
import { 
    collection, getDocs, addDoc, updateDoc, deleteDoc, doc, getDoc, setDoc,
    query, orderBy, serverTimestamp, runTransaction 
} from 'firebase/firestore';
import { db } from '../../utils/firebase';
import html2canvas from 'html2canvas';
import './CouponAdminTab.css';

const CouponAdminTab = () => {
    const [events, setEvents] = useState([]);
    const [claims, setClaims] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [globalShowCoupon, setGlobalShowCoupon] = useState(true);
    const [editingEventId, setEditingEventId] = useState(null);
    const [previewClaim, setPreviewClaim] = useState(null);
    const couponRef = useRef(null);
    
    // New Event Form
    const [newTitle, setNewTitle] = useState('');
    const [newDiscount, setNewDiscount] = useState('');
    const [newLimit, setNewLimit] = useState(3);
    const [newCodeBase, setNewCodeBase] = useState('FIT');

    // Manual Issue Form
    const [showManualIssue, setShowManualIssue] = useState(false);
    const [manualName, setManualName] = useState('');
    const [manualPhone, setManualPhone] = useState('');
    const [manualEventId, setManualEventId] = useState('');
    const [manualCode, setManualCode] = useState(null);

    // Claims Filter
    const [filterEventId, setFilterEventId] = useState('all');

    // Edit Claim Form
    const [showEditClaim, setShowEditClaim] = useState(false);
    const [editingClaim, setEditingClaim] = useState(null);
    const [editClaimName, setEditClaimName] = useState('');
    const [editClaimPhone, setEditClaimPhone] = useState('');
    const [editClaimDiscount, setEditClaimDiscount] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const eventSnap = await getDocs(query(collection(db, 'coupon_events'), orderBy('createdAt', 'desc')));
            const eventList = eventSnap.docs.map(d => ({ id: d.id, ...d.data() }));
            setEvents(eventList);

            const claimSnap = await getDocs(query(collection(db, 'coupon_claims'), orderBy('claimedAt', 'desc')));
            const claimList = claimSnap.docs.map(d => ({ id: d.id, ...d.data() }));
            setClaims(claimList);

            const configSnap = await getDoc(doc(db, 'site_settings', 'coupon_config'));
            if (configSnap.exists()) {
                setGlobalShowCoupon(configSnap.data().showCoupon ?? true);
            }
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    const toggleGlobalCoupon = async () => {
        const newValue = !globalShowCoupon;
        try {
            await setDoc(doc(db, 'site_settings', 'coupon_config'), { showCoupon: newValue }, { merge: true });
            setGlobalShowCoupon(newValue);
            alert(`프론트엔드 쿠폰 지원창이 ${newValue ? '활성화' : '비활성화'} 되었습니다.`);
        } catch (err) {
            console.error(err);
            alert("설정 변경 실패");
        }
    };

    const handleCreateEvent = async (e) => {
        e.preventDefault();
        try {
            if (editingEventId) {
                await updateDoc(doc(db, 'coupon_events', editingEventId), {
                    title: newTitle,
                    discount: newDiscount,
                    totalLimit: parseInt(newLimit),
                    couponCodeBase: newCodeBase.toUpperCase()
                });
            } else {
                await addDoc(collection(db, 'coupon_events'), {
                    title: newTitle,
                    discount: newDiscount,
                    totalLimit: parseInt(newLimit),
                    claimedCount: 0,
                    couponCodeBase: newCodeBase.toUpperCase(),
                    isActive: true,
                    createdAt: serverTimestamp()
                });
            }
            setShowCreate(false);
            setEditingEventId(null);
            fetchData();
        } catch (err) {
            alert("저장 실패: " + err.message);
        }
    };

    const toggleStatus = async (eventId, currentStatus) => {
        try {
            await updateDoc(doc(db, 'coupon_events', eventId), {
                isActive: !currentStatus
            });
            fetchData();
        } catch (err) {
            alert("상태 변경 실패");
        }
    };

    const deleteEvent = async (eventId) => {
        if (!confirm("이 이벤트를 삭제하시겠습니까? (이미 발급된 쿠폰 데이터는 유지됩니다)")) return;
        try {
            await deleteDoc(doc(db, 'coupon_events', eventId));
            fetchData();
        } catch (err) {
            alert("삭제 실패");
        }
    };

    const handleManualIssue = async (e) => {
        e.preventDefault();
        if (!manualName || !manualPhone || !manualEventId) return alert("정보를 모두 입력해주세요.");
        
        try {
            const eventRef = doc(db, 'coupon_events', manualEventId);
            const claimId = manualPhone.replace(/[^0-9]/g, '') + '_' + manualEventId;
            const claimRef = doc(db, 'coupon_claims', claimId);
            const selectedEvent = events.find(ev => ev.id === manualEventId);

            const result = await runTransaction(db, async (transaction) => {
                const eventSnap = await transaction.get(eventRef);
                if (!eventSnap.exists()) throw new Error("이벤트가 존재하지 않습니다.");
                
                const eventData = eventSnap.data();
                if (eventData.claimedCount >= eventData.totalLimit) {
                    throw new Error("이미 모든 쿠폰이 소진되었습니다.");
                }

                const claimSnap = await transaction.get(claimRef);
                if (claimSnap.exists()) {
                    throw new Error("해당 고객은 이미 이 이벤트에 참여했습니다.");
                }

                const uniqueCode = `${eventData.couponCodeBase || 'FIT'}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

                transaction.update(eventRef, { 
                    claimedCount: eventData.claimedCount + 1 
                });
                
                transaction.set(claimRef, {
                    eventId: manualEventId,
                    name: manualName,
                    phone: manualPhone,
                    issuedCode: uniqueCode,
                    claimedAt: serverTimestamp(),
                    source: 'admin_manual'
                });

                return uniqueCode;
            });

            setManualCode(result);
            fetchData();

            // Send Alimtalk notification
            try {
                const { getAlimtalkTemplate, sendAlimtalk } = await import('../../utils/aligoService');
                const template = getAlimtalkTemplate('UH_5901', {
                    name: manualName,
                    phone: manualPhone,
                    discount: selectedEvent.discount,
                    issuedCode: result
                });
                if (template) {
                    await sendAlimtalk(manualPhone, template.code, template.message, {
                        title: template.title,
                        subtitle: template.subtitle,
                        button: template.button
                    });
                }
            } catch (alimError) {
                console.error("Alimtalk send failed:", alimError);
            }

        } catch (err) {
            alert(err.message);
        }
    };

    const deleteClaim = async (claim) => {
        if (!confirm(`${claim.name}님의 쿠폰 발급 내역을 삭제하시겠습니까?`)) return;
        try {
            if (claim.eventId && claim.source !== 'roulette') {
                const eventRef = doc(db, 'coupon_events', claim.eventId);
                await runTransaction(db, async (transaction) => {
                    const eventSnap = await transaction.get(eventRef);
                    if (eventSnap.exists()) {
                        const currentCount = eventSnap.data().claimedCount;
                        transaction.update(eventRef, { claimedCount: Math.max(0, currentCount - 1) });
                    }
                    transaction.delete(doc(db, 'coupon_claims', claim.id));
                });
            } else {
                await deleteDoc(doc(db, 'coupon_claims', claim.id));
            }
            alert("삭제되었습니다.");
            fetchData();
        } catch (err) {
            alert("삭제 실패: " + err.message);
        }
    };

    const resendAlimtalk = async (claim) => {
        if (!confirm(`${claim.name}님에게 알림톡을 재발송하시겠습니까?`)) return;
        try {
            const { getAlimtalkTemplate, sendAlimtalk } = await import('../../utils/aligoService');
            
            let discount = claim.discount;
            if (!discount && claim.eventId) {
                const ev = events.find(e => e.id === claim.eventId);
                if (ev) discount = ev.discount;
            }
            if (!discount) discount = '할인'; 

            const template = getAlimtalkTemplate('UH_5901', {
                name: claim.name,
                phone: claim.phone,
                discount: discount,
                issuedCode: claim.issuedCode
            });
            
            if (template) {
                const result = await sendAlimtalk(claim.phone, template.code, template.message, {
                    title: template.title,
                    subtitle: template.subtitle,
                    button: template.button
                });
                if (result.success) {
                    alert("알림톡 발송 완료!");
                } else {
                    alert("발송 실패: " + result.error);
                }
            }
        } catch (err) {
            alert("발송 오류: " + err.message);
        }
    };

    const handleEditClaim = async (e) => {
        e.preventDefault();
        if (!editingClaim) return;
        try {
            const claimRef = doc(db, 'coupon_claims', editingClaim.id);
            const updateData = {
                name: editClaimName,
                phone: editClaimPhone
            };
            if (editingClaim.source === 'roulette') {
                updateData.discount = editClaimDiscount;
            }
            await updateDoc(claimRef, updateData);
            alert("수정되었습니다.");
            setShowEditClaim(false);
            setEditingClaim(null);
            fetchData();
        } catch (err) {
            alert("수정 실패: " + err.message);
        }
    };

    if (loading) return <div className="admin-loading">Loading Coupon Data...</div>;

    const filteredClaims = filterEventId === 'all' 
        ? claims 
        : claims.filter(c => c.eventId === filterEventId);

    const downloadCouponImage = async () => {
        if (!couponRef.current) return;
        try {
            const canvas = await html2canvas(couponRef.current, { scale: 2, useCORS: true, backgroundColor: '#1a1a1a' });
            const dataUrl = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.download = `FITGIRLS_COUPON_${previewClaim.name}_${previewClaim.issuedCode}.png`;
            link.href = dataUrl;
            link.click();
        } catch (err) {
            console.error('Image capture failed', err);
            alert('이미지 생성에 실패했습니다.');
        }
    };

    return (
        <div className="coupon-admin-container">
            <div className="admin-header-row">
                <h3>이벤트 쿠폰 관리</h3>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button 
                        className="create-event-btn"
                        style={{ background: globalShowCoupon ? '#27ae60' : '#e74c3c' }} 
                        onClick={toggleGlobalCoupon}
                    >
                        프론트 룰렛창: {globalShowCoupon ? 'ON' : 'OFF'}
                    </button>
                    <button className="create-event-btn" style={{ background: '#2c3e50' }} onClick={() => {
                        setShowManualIssue(true);
                        setManualCode(null);
                        setManualName('');
                        setManualPhone('');
                        if (events.length > 0) setManualEventId(events[0].id);
                    }}>수동 발급</button>
                    <button className="create-event-btn" onClick={() => {
                        setEditingEventId(null);
                        setNewTitle('');
                        setNewDiscount('');
                        setNewLimit(3);
                        setNewCodeBase('FIT');
                        setShowCreate(true);
                    }}>+ 새 쿠폰 이벤트</button>
                </div>
            </div>

            {showCreate && (
                <div className="admin-modal-overlay">
                    <div className="admin-modal-box">
                        <h4>{editingEventId ? "쿠폰 이벤트 수정" : "새 쿠폰 이벤트 생성"}</h4>
                        <form onSubmit={handleCreateEvent}>
                            <div className="form-group">
                                <label>이벤트 제목</label>
                                <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="예: 5월 게릴라 50% 할인" required />
                            </div>
                            <div className="form-group">
                                <label>할인 내용 (표시용)</label>
                                <input value={newDiscount} onChange={e => setNewDiscount(e.target.value)} placeholder="예: 50% 또는 5만원" required />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>한정 수량</label>
                                    <input type="number" value={newLimit} onChange={e => setNewLimit(e.target.value)} required />
                                </div>
                                <div className="form-group">
                                    <label>쿠폰 코드 접두사</label>
                                    <input value={newCodeBase} onChange={e => setNewCodeBase(e.target.value)} placeholder="예: FIT" required />
                                </div>
                            </div>
                            <div className="modal-btns">
                                <button type="button" onClick={() => {
                                    setShowCreate(false);
                                    setEditingEventId(null);
                                }}>취소</button>
                                <button type="submit" className="save-btn">{editingEventId ? "수정하기" : "이벤트 생성"}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showManualIssue && (
                <div className="admin-modal-overlay">
                    <div className="admin-modal-box">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h4 style={{ margin: 0 }}>쿠폰 수동 발급</h4>
                            <button onClick={() => setShowManualIssue(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>✕</button>
                        </div>
                        
                        {!manualCode ? (
                            <form onSubmit={handleManualIssue}>
                                <div className="form-group">
                                    <label>대상 이벤트</label>
                                    <select value={manualEventId} onChange={e => setManualEventId(e.target.value)} required style={{ padding: '10px', width: '100%', borderRadius: '4px', border: '1px solid #ddd', marginBottom: '15px' }}>
                                        <option value="">이벤트를 선택하세요</option>
                                        {events.map(ev => (
                                            <option key={ev.id} value={ev.id}>{ev.title} ({ev.claimedCount}/{ev.totalLimit})</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>고객 이름</label>
                                    <input value={manualName} onChange={e => setManualName(e.target.value)} placeholder="예: 홍길동" required />
                                </div>
                                <div className="form-group">
                                    <label>고객 연락처</label>
                                    <input value={manualPhone} onChange={e => setManualPhone(e.target.value)} placeholder="예: 010-1234-5678" required />
                                </div>
                                <div className="modal-btns">
                                    <button type="button" onClick={() => setShowManualIssue(false)}>취소</button>
                                    <button type="submit" className="save-btn">발급하기</button>
                                </div>
                            </form>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '20px 0' }}>
                                <h3 style={{ color: '#27ae60', marginBottom: '10px' }}>발급 완료!</h3>
                                <p style={{ fontSize: '18px', fontWeight: 'bold', background: '#f8f9fa', padding: '15px', borderRadius: '8px', letterSpacing: '2px' }}>
                                    {manualCode}
                                </p>
                                <p style={{ fontSize: '14px', color: '#666', marginTop: '10px' }}>알림톡이 자동으로 발송되었습니다.</p>
                                <button onClick={() => setShowManualIssue(false)} style={{ marginTop: '20px', padding: '10px 20px', background: '#1a1a1a', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                                    확인
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {showEditClaim && editingClaim && (
                <div className="admin-modal-overlay">
                    <div className="admin-modal-box">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h4 style={{ margin: 0 }}>발급 쿠폰 내역 수정</h4>
                            <button onClick={() => {
                                setShowEditClaim(false);
                                setEditingClaim(null);
                            }} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>✕</button>
                        </div>
                        <form onSubmit={handleEditClaim}>
                            <div className="form-group">
                                <label>고객 이름</label>
                                <input value={editClaimName} onChange={e => setEditClaimName(e.target.value)} required />
                            </div>
                            <div className="form-group">
                                <label>고객 연락처</label>
                                <input value={editClaimPhone} onChange={e => setEditClaimPhone(e.target.value)} required />
                            </div>
                            {editingClaim.source === 'roulette' && (
                                <div className="form-group">
                                    <label>할인율/할인금액</label>
                                    <input value={editClaimDiscount} onChange={e => setEditClaimDiscount(e.target.value)} placeholder="예: 10% 또는 10000" required />
                                </div>
                            )}
                            <div className="modal-btns">
                                <button type="button" onClick={() => {
                                    setShowEditClaim(false);
                                    setEditingClaim(null);
                                }}>취소</button>
                                <button type="submit" className="save-btn">저장하기</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}


            <div className="events-grid">
                {events.map(event => (
                    <div key={event.id} className={`event-admin-card ${event.isActive ? 'active' : 'inactive'}`}>
                        <div className="card-header">
                            <span className="event-status">{event.isActive ? '진행 중' : '중단됨'}</span>
                            <div className="card-actions">
                                <button onClick={() => {
                                    setEditingEventId(event.id);
                                    setNewTitle(event.title);
                                    setNewDiscount(event.discount);
                                    setNewLimit(event.totalLimit);
                                    setNewCodeBase(event.couponCodeBase || 'FIT');
                                    setShowCreate(true);
                                }}>수정</button>
                                <button onClick={() => toggleStatus(event.id, event.isActive)}>{event.isActive ? '중단' : '활성화'}</button>
                                <button className="del-btn" onClick={() => deleteEvent(event.id)}>삭제</button>
                            </div>
                        </div>
                        <h4>{event.title}</h4>
                        <div className="event-stats">
                            <div className="stat">
                                <small>할인</small>
                                <strong>{event.discount}</strong>
                            </div>
                            <div className="stat">
                                <small>발급/한도</small>
                                <strong>{event.claimedCount} / {event.totalLimit}</strong>
                            </div>
                        </div>
                        <div className="progress-bar">
                            <div className="progress-fill" style={{ width: `${(event.claimedCount / event.totalLimit) * 100}%` }}></div>
                        </div>
                        <div className="card-footer" style={{ marginTop: '15px', borderTop: '1px solid #eee', paddingTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
                            <button 
                                onClick={() => {
                                    setFilterEventId(event.id);
                                    document.querySelector('.claims-section')?.scrollIntoView({ behavior: 'smooth' });
                                }}
                                style={{
                                    background: '#FFF',
                                    border: '1px solid #ddd',
                                    color: '#333',
                                    fontSize: '0.72rem',
                                    padding: '5px 10px',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontWeight: 'bold',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                    e.target.style.borderColor = '#FF003C';
                                    e.target.style.color = '#FF003C';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.borderColor = '#ddd';
                                    e.target.style.color = '#333';
                                }}
                            >
                                당첨자 명단 보기 ➔
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <div className="claims-section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <h4 style={{ margin: 0 }}>쿠폰 발급 내역</h4>
                    <select value={filterEventId} onChange={e => setFilterEventId(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}>
                        <option value="all">전체 이벤트 보기</option>
                        {events.map(ev => (
                            <option key={ev.id} value={ev.id}>{ev.title}</option>
                        ))}
                    </select>
                </div>
                <div className="claims-table-wrapper">
                    <table className="claims-table">
                        <thead>
                            <tr>
                                <th>발급일시</th>
                                <th>이름</th>
                                <th>연락처</th>
                                <th>이벤트</th>
                                <th>발급 코드</th>
                                <th>관리</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredClaims.map(claim => (
                                <tr key={claim.id}>
                                    <td>{claim.claimedAt?.toDate() ? claim.claimedAt.toDate().toLocaleString('ko-KR') : '-'}</td>
                                    <td>{claim.name}</td>
                                    <td>{claim.phone}</td>
                                    <td>
                                        {claim.source === 'roulette' 
                                            ? <span style={{ color: '#ff4d4d', fontWeight: 'bold' }}>[룰렛] {claim.discount}</span>
                                            : (events.find(e => e.id === claim.eventId)?.title || '삭제된 이벤트')
                                        }
                                    </td>
                                    <td className="issued-code">{claim.issuedCode}</td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
                                            <button onClick={() => {
                                                const eventTitle = claim.source === 'roulette' ? '룰렛 이벤트 당첨' : (events.find(e => e.id === claim.eventId)?.title || '이벤트 당첨 쿠폰');
                                                let discount = claim.discount;
                                                if (!discount && claim.eventId) {
                                                    const ev = events.find(e => e.id === claim.eventId);
                                                    if (ev) discount = ev.discount;
                                                }
                                                if (!discount) discount = '특별 할인';

                                                const issueDate = claim.claimedAt?.toDate() || new Date();
                                                const validDate = new Date(issueDate);
                                                validDate.setMonth(validDate.getMonth() + 6);

                                                setPreviewClaim({
                                                    ...claim,
                                                    eventTitle,
                                                    discount,
                                                    issueDateStr: `${issueDate.getFullYear()}. ${issueDate.getMonth() + 1}. ${issueDate.getDate()}.`,
                                                    validDateStr: `${validDate.getFullYear()}. ${validDate.getMonth() + 1}. ${validDate.getDate()}. 까지`
                                                });
                                            }} style={{ padding: '4px 8px', fontSize: '12px', background: '#2c3e50', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}>이미지</button>
                                            <button onClick={() => resendAlimtalk(claim)} style={{ padding: '4px 8px', fontSize: '12px', background: '#f1c40f', color: '#333', border: 'none', borderRadius: '3px', cursor: 'pointer' }}>알림톡</button>
                                            <button onClick={() => {
                                                setEditingClaim(claim);
                                                setEditClaimName(claim.name);
                                                setEditClaimPhone(claim.phone);
                                                setEditClaimDiscount(claim.discount || '');
                                                setShowEditClaim(true);
                                            }} style={{ padding: '4px 8px', fontSize: '12px', background: '#3498db', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}>수정</button>
                                            <button onClick={() => deleteClaim(claim)} style={{ padding: '4px 8px', fontSize: '12px', background: '#e74c3c', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}>삭제</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {previewClaim && (
                <div className="coupon-preview-overlay">
                    <div className="coupon-preview-modal">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h4 style={{ margin: 0, color: '#fff' }}>이미지 쿠폰 (웹용)</h4>
                            <button onClick={() => setPreviewClaim(null)} style={{ background: 'none', border: 'none', fontSize: '24px', color: '#fff', cursor: 'pointer' }}>✕</button>
                        </div>
                        
                        <div className="coupon-card-template" ref={couponRef}>
                            <div className="coupon-left">
                                <div className="coupon-title">FITGIRLS & INAFIT 촬영권</div>
                                <div className="coupon-event-name">{previewClaim.eventTitle}</div>
                                <div className="coupon-discount">
                                    {/^\d+$/.test(previewClaim.discount) ? `${previewClaim.discount}% OFF` : previewClaim.discount}
                                </div>
                                
                                <div className="coupon-info-block">
                                    <div className="coupon-code-wrapper">
                                        <div className="coupon-code-label">발급 코드</div>
                                        <div className="coupon-code">{previewClaim.issuedCode}</div>
                                    </div>
                                    <div className="coupon-guidelines">
                                        * [안내] FITGIRLS & INAFIT 촬영 예약 시 적용 가능합니다.<br/>
                                        [스튜디오] 서울시 강남구 신사동 508-4, B1 &nbsp;|&nbsp; [문의] 카카오채널 "핏걸즈"
                                    </div>
                                </div>
                            </div>
                            <div className="coupon-right">
                                <div className="vip-label">VIP</div>
                                <div className="name">{previewClaim.name}<span className="suffix">님</span></div>
                                <div className="coupon-date-info">
                                    발급일: {previewClaim.issueDateStr}<br/>
                                    유효기간: {previewClaim.validDateStr}
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '20px' }}>
                            <button onClick={() => setPreviewClaim(null)} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #444', background: 'transparent', color: '#fff', cursor: 'pointer' }}>닫기</button>
                            <button onClick={downloadCouponImage} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#FF003C', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}>이미지 저장하기</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CouponAdminTab;
