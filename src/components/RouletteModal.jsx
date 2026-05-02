import React, { useState } from 'react';
import { db } from '../utils/firebase';
import { 
    collection, addDoc, serverTimestamp, getDocs, 
    query, where, updateDoc, doc 
} from 'firebase/firestore';
import { sendAlimtalk, getAlimtalkTemplate } from '../utils/aligoService';
import './RouletteModal.css';

const PRIZES = [
    { id: 1, label: '10% OFF', color: '#111', value: '10%' },
    { id: 2, label: '20% OFF', color: '#ff4d4d', value: '20%' },
    { id: 3, label: '30% OFF', color: '#111', value: '30%' },
    { id: 4, label: '50% OFF', color: '#ff4d4d', value: '50%' },
    { id: 11, label: '10% OFF', color: '#111', value: '10%' },
    { id: 6, label: 'TRY AGAIN', color: '#333', value: 'NONE' },
];

const RouletteModal = ({ onClose, event }) => {
    const [isSpinning, setIsSpinning] = useState(false);
    const [rotation, setRotation] = useState(0);
    const [result, setResult] = useState(null);
    const [showResult, setShowResult] = useState(false);
    const [showContactForm, setShowContactForm] = useState(false);
    
    // Contact Info State
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const spin = () => {
        if (isSpinning) return;
        setIsSpinning(true);
        setShowResult(false);
        setShowContactForm(false);

        const prizeIndex = Math.floor(Math.random() * PRIZES.length);
        const segmentAngle = 360 / PRIZES.length;
        // Calculate the angle to center the prize at the top indicator (which is at 0 degrees)
        // Since our segments start from 0, the prizeIndex-th segment is at [prizeIndex * angle, (prizeIndex + 1) * angle]
        // To put it at the top, we rotate by 360 - (center of segment)
        const extraDegree = 360 - (prizeIndex * segmentAngle + segmentAngle / 2);
        const totalSpin = rotation + (360 * 8) + extraDegree - (rotation % 360);
        
        setRotation(totalSpin);

        setTimeout(() => {
            setIsSpinning(false);
            const selectedPrize = PRIZES[prizeIndex];
            setResult(selectedPrize);
            setShowResult(true);
            
            if (selectedPrize.value !== 'NONE') {
                setShowContactForm(true);
            }
        }, 5000);
    };

    const handleSubmitClaim = async (e) => {
        e.preventDefault();
        if (!name || !phone) return alert('성함과 전화번호를 입력해 주세요.');
        
        setIsSubmitting(true);
        try {
            // 1. Find matching event from dashboard
            const eventsSnap = await getDocs(query(
                collection(db, 'coupon_events'), 
                where('isActive', '==', true)
            ));
            
            const activeEvents = eventsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
            // Match by finding the discount percentage in the string (e.g., "50" in "50% OFF")
            const targetDiscount = result.value.replace(/[^0-9]/g, '');
            const matchedEvent = activeEvents.find(ev => ev.discount.includes(targetDiscount));

            // 2. Generate code and update event count
            const codeBase = matchedEvent?.couponCodeBase || 'LUCKY';
            const issuedCode = `${codeBase}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
            
            if (matchedEvent) {
                const eventRef = doc(db, 'coupon_events', matchedEvent.id);
                await updateDoc(eventRef, {
                    claimedCount: (matchedEvent.claimedCount || 0) + 1
                });
            }

            // 3. Save to Firestore
            await addDoc(collection(db, 'coupon_claims'), {
                name,
                phone,
                discount: result.value,
                issuedCode,
                status: 'unused',
                claimedAt: serverTimestamp(),
                source: 'roulette',
                eventId: matchedEvent?.id || 'none'
            });

            // 4. Send Alimtalk
            const alimParams = {
                name,
                phone,
                discount: result.value,
                issuedCode
            };
            const template = getAlimtalkTemplate('UH_5901', alimParams);
            if (template) {
                await sendAlimtalk(phone, template.code, template.message, { title: template.title });
            }

            alert(`${name}님, 축하드립니다! 카카오톡으로 당첨 안내가 발송되었습니다.`);
            onClose();
        } catch (err) {
            console.error('Claim error:', err);
            alert('정보 저장 중 오류가 발생했습니다. 다시 시도해 주세요.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="roulette-overlay" onClick={!isSpinning && !showContactForm ? onClose : undefined}>
            <div className="roulette-container" onClick={e => e.stopPropagation()}>
                <button className="roulette-close" onClick={onClose}>✕</button>
                
                <div className="roulette-header">
                    <h2>LUCKY ROULETTE</h2>
                    <p>행운의 룰렛을 돌려보세요!</p>
                </div>

                <div className="wheel-wrapper">
                    <div className="wheel-indicator">▼</div>
                    <div 
                        className="wheel" 
                        style={{ 
                            transform: `rotate(${rotation}deg)`,
                            background: `conic-gradient(${PRIZES.map((p, i) => `${p.color} ${i * 60}deg ${(i + 1) * 60}deg`).join(', ')})`
                        }}
                    >
                        {PRIZES.map((prize, idx) => (
                            <div 
                                key={prize.id} 
                                className="prize-label-container"
                                style={{ transform: `rotate(${idx * 60 + 30}deg)` }}
                            >
                                <span className="prize-label">{prize.label}</span>
                            </div>
                        ))}
                    </div>
                    <button 
                        className={`spin-button ${isSpinning ? 'disabled' : ''}`} 
                        onClick={spin}
                        disabled={isSpinning}
                    >
                        {isSpinning ? 'SPINNING...' : 'PUSH'}
                    </button>
                </div>

                {showResult && (
                    <div className="roulette-result-overlay">
                        {showContactForm ? (
                            <form className="result-card contact-form" onSubmit={handleSubmitClaim}>
                                <div className="result-icon">🎉</div>
                                <h3>{result.label} 당첨!</h3>
                                <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '20px' }}>
                                    혜택 안내를 받으실 정보를 입력해 주세요.
                                </p>
                                
                                <div className="input-group">
                                    <input 
                                        type="text" 
                                        placeholder="성함" 
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        required
                                    />
                                    <input 
                                        type="tel" 
                                        placeholder="전화번호" 
                                        value={phone}
                                        onChange={e => setPhone(e.target.value)}
                                        required
                                    />
                                </div>

                                <button 
                                    type="submit" 
                                    className="claim-btn" 
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? '발송 중...' : '쿠폰 받기'}
                                </button>
                            </form>
                        ) : (
                            <div className="result-card">
                                <div className="result-icon">😢</div>
                                <h3>아쉬워요!</h3>
                                <p className="result-label">다음 기회에 도전하세요.</p>
                                <button className="retry-btn" onClick={onClose}>닫기</button>
                            </div>
                        )}
                    </div>
                )}

            </div>
        </div>
    );
};


export default RouletteModal;
