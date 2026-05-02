import React, { useState } from 'react';
import { doc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { getAlimtalkTemplate, sendAlimtalk } from '../utils/aligoService';
import './CouponModal.css';

const CouponModal = ({ event, onClose }) => {
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);
    const [claimedCode, setClaimedCode] = useState(null);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name || !phone) return alert("정보를 모두 입력해주세요.");
        
        setLoading(true);
        setError(null);

        try {
            const eventRef = doc(db, 'coupon_events', event.id);
            const claimId = phone.replace(/[^0-9]/g, '') + '_' + event.id;
            const claimRef = doc(db, 'coupon_claims', claimId);

            const result = await runTransaction(db, async (transaction) => {
                const eventSnap = await transaction.get(eventRef);
                if (!eventSnap.exists()) throw new Error("이벤트가 존재하지 않습니다.");
                
                const eventData = eventSnap.data();
                if (eventData.claimedCount >= eventData.totalLimit) {
                    throw new Error("이미 모든 쿠폰이 소진되었습니다. 다음 기회를 이용해주세요!");
                }

                const claimSnap = await transaction.get(claimRef);
                if (claimSnap.exists()) {
                    throw new Error("이미 이 이벤트에 참여하셨습니다. 발급된 코드를 확인해주세요.");
                }

                // Generate a code (Simple version: EVENT_BASE + Random)
                const uniqueCode = `${eventData.couponCodeBase || 'FIT'}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

                // Update counts and save claim
                transaction.update(eventRef, { 
                    claimedCount: eventData.claimedCount + 1 
                });
                
                transaction.set(claimRef, {
                    eventId: event.id,
                    name,
                    phone,
                    issuedCode: uniqueCode,
                    claimedAt: serverTimestamp()
                });

                return uniqueCode;
            });

            setClaimedCode(result);

            // Send Alimtalk notification
            try {
                const template = getAlimtalkTemplate('UH_5901', {
                    name,
                    phone,
                    discount: event.discount,
                    issuedCode: result
                });
                if (template) {
                    await sendAlimtalk(phone, template.code, template.message, {
                        title: template.title,
                        button: template.button
                    });
                }
            } catch (alimError) {
                console.error("Alimtalk send failed:", alimError);
                // We don't block the UI for Alimtalk failure since the coupon is already issued
            }
        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(claimedCode);
        alert("쿠폰 코드가 복사되었습니다!");
    };

    return (
        <div className="coupon-modal-overlay" onClick={onClose}>
            <div className="coupon-modal-content" onClick={e => e.stopPropagation()}>
                <button className="modal-close-btn" onClick={onClose}>✕</button>
                
                {!claimedCode ? (
                    <>
                        <div className="modal-header">
                            <span className="modal-badge">LIMITED EVENT</span>
                            <h2>선착순 {event.discount} 쿠폰 발급</h2>
                            <p>정보를 입력하시면 쿠폰 코드가 즉시 발급됩니다.</p>
                        </div>

                        <form onSubmit={handleSubmit} className="coupon-form">
                            <div className="input-group">
                                <label>성함</label>
                                <input 
                                    type="text" 
                                    value={name} 
                                    onChange={e => setName(e.target.value)} 
                                    placeholder="성함을 입력하세요"
                                    required 
                                />
                            </div>
                            <div className="input-group">
                                <label>연락처</label>
                                <input 
                                    type="tel" 
                                    value={phone} 
                                    onChange={e => setPhone(e.target.value)} 
                                    placeholder="010-0000-0000"
                                    required 
                                />
                            </div>

                            {error && <p className="modal-error">{error}</p>}

                            <button type="submit" className="submit-btn" disabled={loading}>
                                {loading ? "발급 중..." : "쿠폰 받기"}
                            </button>
                        </form>
                    </>
                ) : (
                    <div className="success-content">
                        <div className="success-icon">🎉</div>
                        <h2>쿠폰 발급 완료!</h2>
                        <p>축하드립니다! 아래 코드를 촬영 시 작가님께 말씀해 주세요.</p>
                        
                        <div className="code-display-box" onClick={copyToClipboard}>
                            <span className="code-text">{claimedCode}</span>
                            <span className="copy-hint">클릭하여 복사</span>
                        </div>

                        <p className="footer-note">* 쿠폰은 선착순으로 사용이 마감될 수 있습니다.</p>
                        
                        <button className="finish-btn" onClick={onClose}>확인</button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CouponModal;
