import React, { useState } from 'react';
import { db } from '../utils/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
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
        const prizeIndex = Math.floor(Math.random() * PRIZES.length);
        const extraDegree = (360 - (prizeIndex * 60)) - 30;
        const totalSpin = rotation + (360 * 5) + extraDegree;
        setRotation(totalSpin);

        setTimeout(() => {
            setIsSpinning(false);
            const selectedPrize = PRIZES[prizeIndex];
            setResult(selectedPrize);
            setShowResult(true);
            
            // If they won something, show the contact form after a small delay
            if (selectedPrize.value !== 'NONE') {
                setTimeout(() => {
                    setShowContactForm(true);
                }, 1500);
            }
        }, 5000);
    };

    const handleSubmitClaim = async (e) => {
        e.preventDefault();
        if (!name || !phone) return alert('성함과 전화번호를 입력해 주세요.');
        
        setIsSubmitting(true);
        try {
            // 1. Generate a simple code
            const issuedCode = `LUCKY-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
            
            // 2. Save to Firestore
            await addDoc(collection(db, 'coupon_claims'), {
                name,
                phone,
                discount: result.value,
                issuedCode,
                status: 'unused',
                claimedAt: serverTimestamp(),
                source: 'roulette'
            });

            // 3. Send Alimtalk
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
                        style={{ transform: `rotate(${rotation}deg)` }}
                    >
                        {PRIZES.map((prize, idx) => (
                            <div 
                                key={prize.id} 
                                className="wheel-segment"
                                style={{ 
                                    transform: `rotate(${idx * 60}deg)`,
                                    backgroundColor: prize.color 
                                }}
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

                {showResult && !showContactForm && (
                    <div className="roulette-result-overlay">
                        <div className="result-card">
                            <div className="result-icon">
                                {result.value === 'NONE' ? '😢' : '🎉'}
                            </div>
                            <h3>{result.value === 'NONE' ? '아쉬워요!' : '축하합니다!'}</h3>
                            <p className="result-label">{result.label}</p>
                            {result.value === 'NONE' && (
                                <button className="retry-btn" onClick={onClose}>닫기</button>
                            )}
                        </div>
                    </div>
                )}

                {showContactForm && (
                    <div className="roulette-result-overlay">
                        <form className="result-card contact-form" onSubmit={handleSubmitClaim}>
                            <div className="result-icon">✨</div>
                            <h3>당첨을 축하드립니다!</h3>
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
                                    placeholder="전화번호 (01012345678)" 
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
                    </div>
                )}
            </div>
        </div>
    );
};


export default RouletteModal;
