import React, { useState, useEffect } from 'react';
import { 
    collection, getDocs, addDoc, updateDoc, deleteDoc, doc, 
    query, orderBy, serverTimestamp 
} from 'firebase/firestore';
import { db } from '../../utils/firebase';
import './CouponAdminTab.css';

const CouponAdminTab = () => {
    const [events, setEvents] = useState([]);
    const [claims, setClaims] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    
    // New Event Form
    const [newTitle, setNewTitle] = useState('');
    const [newDiscount, setNewDiscount] = useState('');
    const [newLimit, setNewLimit] = useState(3);
    const [newCodeBase, setNewCodeBase] = useState('FIT');

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
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    const handleCreateEvent = async (e) => {
        e.preventDefault();
        try {
            await addDoc(collection(db, 'coupon_events'), {
                title: newTitle,
                discount: newDiscount,
                totalLimit: parseInt(newLimit),
                claimedCount: 0,
                couponCodeBase: newCodeBase.toUpperCase(),
                isActive: true,
                createdAt: serverTimestamp()
            });
            setShowCreate(false);
            fetchData();
        } catch (err) {
            alert("생성 실패: " + err.message);
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

    if (loading) return <div className="admin-loading">Loading Coupon Data...</div>;

    return (
        <div className="coupon-admin-container">
            <div className="admin-header-row">
                <h3>이벤트 쿠폰 관리</h3>
                <button className="create-event-btn" onClick={() => setShowCreate(true)}>+ 새 쿠폰 이벤트</button>
            </div>

            {showCreate && (
                <div className="admin-modal-overlay">
                    <div className="admin-modal-box">
                        <h4>새 쿠폰 이벤트 생성</h4>
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
                                <button type="button" onClick={() => setShowCreate(false)}>취소</button>
                                <button type="submit" className="save-btn">이벤트 생성</button>
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
                    </div>
                ))}
            </div>

            <div className="claims-section">
                <h4>쿠폰 발급 내역</h4>
                <div className="claims-table-wrapper">
                    <table className="claims-table">
                        <thead>
                            <tr>
                                <th>발급일시</th>
                                <th>이름</th>
                                <th>연락처</th>
                                <th>이벤트</th>
                                <th>발급 코드</th>
                            </tr>
                        </thead>
                        <tbody>
                            {claims.map(claim => (
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
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default CouponAdminTab;
