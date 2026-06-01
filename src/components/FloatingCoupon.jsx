import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../utils/firebase';
import CouponModal from './CouponModal';
import './FloatingCoupon.css';

const FloatingCoupon = () => {
    const location = useLocation();
    const [activeEvent, setActiveEvent] = useState(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Don't show on admin-specific paths, but allow admins to see it on regular pages
        const excludedPaths = ['/admin', '/smodel', '/retouch'];
        const isExcludedPath = excludedPaths.some(path => location.pathname.startsWith(path));
        const isAdminLoggedIn = localStorage.getItem('admin_logged_in') === 'true';

        if (isExcludedPath || isAdminLoggedIn) return;

        // Don't show if already dismissed in this session
        const isDismissed = sessionStorage.getItem('coupon_dismissed');
        if (isDismissed || isVisible) return;

        // Temporary 100% trigger for testing (change back to 0.3 later)
        const shouldTrigger = true; 
        if (!shouldTrigger) return;

        const fetchAndShow = async () => {
            try {
                // Check global config first
                const configSnap = await getDoc(doc(db, 'site_settings', 'coupon_config'));
                if (configSnap.exists() && configSnap.data().showCoupon === false) {
                    return; // Disabled globally
                }

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
                    }
                }
            } catch (err) {
                console.error("Error fetching coupon event:", err);
            }
        };

        // Delayed appearance (3 seconds) for engagement
        const timer = setTimeout(fetchAndShow, 3000);
        
        return () => clearTimeout(timer);
    }, [location.pathname, isVisible]);

    const handleDismiss = (e) => {
        if (e) e.stopPropagation();
        setIsVisible(false);
        sessionStorage.setItem('coupon_dismissed', 'true');
    };

    const isAdminLoggedIn = localStorage.getItem('admin_logged_in') === 'true';
    if (!activeEvent || !isVisible || isAdminLoggedIn) return null;

    return (
        <CouponModal 
            event={activeEvent} 
            onClose={handleDismiss} 
        />
    );
};


export default FloatingCoupon;
