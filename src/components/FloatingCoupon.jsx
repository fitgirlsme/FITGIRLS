import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../utils/firebase';
import CouponModal from './CouponModal';
import './FloatingCoupon.css';

const FloatingCoupon = () => {
    const location = useLocation();
    const [activeEvent, setActiveEvent] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const [position, setPosition] = useState({ top: '20%', left: '10%' });

    useEffect(() => {
        // Don't show if already dismissed in this session
        const isDismissed = sessionStorage.getItem('coupon_dismissed');
        if (isDismissed || isVisible) return;

        // "Random Page" logic: 30% chance to trigger on each page/section visit
        const shouldTrigger = Math.random() < 0.3;
        if (!shouldTrigger) return;

        const fetchAndShow = async () => {
            try {
                const q = query(
                    collection(db, 'coupon_events'), 
                    where('isActive', '==', true)
                );
                const querySnapshot = await getDocs(q);
                if (!querySnapshot.empty) {
                    const eventData = { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() };
                    // Only show if limit not reached
                    if (eventData.claimedCount < eventData.totalLimit) {
                        setActiveEvent(eventData);
                        setIsVisible(true);
                        randomizePosition();
                    }
                }
            } catch (err) {
                console.error("Error fetching coupon event:", err);
            }
        };

        // Delayed appearance (8 seconds) for engagement
        const timer = setTimeout(fetchAndShow, 8000);
        
        return () => clearTimeout(timer);
    }, [location.pathname, isVisible]);


    const randomizePosition = () => {
        const t = Math.floor(Math.random() * 60) + 20; // 20% to 80%
        const l = Math.floor(Math.random() * 60) + 20; // 20% to 80%
        setPosition({ top: `${t}%`, left: `${l}%` });
    };

    const handleDismiss = (e) => {
        e.stopPropagation(); // Prevent opening the modal
        setIsVisible(false);
        sessionStorage.setItem('coupon_dismissed', 'true');
    };

    if (!activeEvent || !isVisible) return null;

    return (
        <>
            <div 
                className="floating-coupon-container"
                style={{ top: position.top, left: position.left }}
                onClick={() => setShowModal(true)}
            >
                <div className="coupon-ticket-wrapper">
                    <button className="coupon-close-btn" onClick={handleDismiss}>✕</button>
                    <div className="coupon-ticket">
                        <div className="ticket-content">
                            <span className="ticket-label">SPECIAL</span>
                            <span className="ticket-discount">{activeEvent.discount}</span>
                            <span className="ticket-sub">OFF</span>
                        </div>
                    </div>
                    <div className="coupon-sparkles">
                        <span>✨</span><span>⭐</span><span>✨</span>
                    </div>
                </div>
                <div className="coupon-tooltip">쿠폰을 잡으세요!</div>
            </div>

            {showModal && (
                <CouponModal 
                    event={activeEvent} 
                    onClose={() => setShowModal(false)} 
                />
            )}
        </>
    );
};

export default FloatingCoupon;
