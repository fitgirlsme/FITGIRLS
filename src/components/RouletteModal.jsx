import React, { useState, useEffect } from 'react';
import './RouletteModal.css';

const PRIZES = [
    { id: 1, label: '5% OFF', color: '#ff4d4d', value: '5%' },
    { id: 2, label: '10% OFF', color: '#111', value: '10%' },
    { id: 3, label: 'FREE 1 CUT', color: '#ff4d4d', value: 'FREE' },
    { id: 4, label: 'TRY AGAIN', color: '#333', value: 'NONE' },
    { id: 5, label: '20% OFF', color: '#ff4d4d', value: '20%' },
    { id: 6, label: 'GIFT', color: '#111', value: 'GIFT' },
];

const RouletteModal = ({ onClose, event }) => {
    const [isSpinning, setIsSpinning] = useState(false);
    const [rotation, setRotation] = useState(0);
    const [result, setResult] = useState(null);
    const [showResult, setShowResult] = useState(false);

    const spin = () => {
        if (isSpinning) return;

        setIsSpinning(true);
        // Randomly choose a prize index
        const prizeIndex = Math.floor(Math.random() * PRIZES.length);
        
        // Calculate extra rotation for the selected prize
        // Each segment is 60 degrees (360 / 6)
        // We want to land on the center of the segment
        const extraDegree = (360 - (prizeIndex * 60)) - 30;
        const totalSpin = rotation + (360 * 5) + extraDegree; // 5 full spins + extra
        
        setRotation(totalSpin);

        setTimeout(() => {
            setIsSpinning(false);
            setResult(PRIZES[prizeIndex]);
            setShowResult(true);
        }, 5000); // Animation duration
    };

    const handleClaim = () => {
        if (result && result.value !== 'NONE') {
            // Copy coupon code if exists or go to reservation
            alert(`${result.label} 쿠폰이 적용되었습니다! 예약 시 말씀해 주세요.`);
        }
        onClose();
    };

    return (
        <div className="roulette-overlay" onClick={!isSpinning ? onClose : undefined}>
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

                {showResult && (
                    <div className="roulette-result-overlay">
                        <div className="result-card">
                            <div className="result-icon">
                                {result.value === 'NONE' ? '😢' : '🎉'}
                            </div>
                            <h3>{result.value === 'NONE' ? '아쉬워요!' : '축하합니다!'}</h3>
                            <p className="result-label">{result.label}</p>
                            
                            {result.value !== 'NONE' ? (
                                <button className="claim-btn" onClick={handleClaim}>쿠폰 받기</button>
                            ) : (
                                <button className="retry-btn" onClick={onClose}>닫기</button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RouletteModal;
