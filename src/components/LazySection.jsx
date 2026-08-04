import React, { useState, useEffect, useRef } from 'react';

const LazySection = ({ children, id, className, minHeight = '100vh', forceRender = false }) => {
    const [isRendered, setIsRendered] = useState(forceRender);
    const sectionRef = useRef(null);

    useEffect(() => {
        if (isRendered) return;

        const container = document.querySelector('.snap-container');
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsRendered(true);
                    observer.disconnect();
                }
            },
            {
                root: null, // viewport 기준 (Native scroll)
                rootMargin: '50% 0px 50% 0px', // Reduced from 150% to 50% to prevent loading too many sections at once
                threshold: 0
            }
        );

        if (sectionRef.current) {
            observer.observe(sectionRef.current);
        }

        return () => observer.disconnect();
    }, [isRendered]);

    // Update if forced to render via URL match
    useEffect(() => {
        if (forceRender && !isRendered) {
            setIsRendered(true);
        }
    }, [forceRender, isRendered]);

    return (
        <section 
            id={id} 
            className={className} 
            ref={sectionRef} 
            style={{ 
                minHeight: !isRendered ? minHeight : 'auto', 
                width: '100%' 
            }}
        >
            {isRendered ? (
                <React.Suspense fallback={<div style={{ minHeight, width: '100%' }} />}>
                    {children}
                </React.Suspense>
            ) : null}
        </section>
    );
};

export default LazySection;
