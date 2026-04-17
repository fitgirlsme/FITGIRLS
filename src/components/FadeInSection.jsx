import React, { useEffect, useRef } from 'react';

const FadeInSection = ({ children, delay = 0, className = '' }) => {
    const domRef = useRef();

    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target); 
                }
            });
        }, {
            threshold: 0.05,
            root: null, // Use viewport root for universal compatibility (modals & main sections)
            rootMargin: "0px 0px 200px 0px" // Trigger earlier for smoother transition
        });

        const currentRef = domRef.current;
        if (currentRef) {
            // Immediate check if already in view (safety)
            const rect = currentRef.getBoundingClientRect();
            // Faster check: if any part of element is in viewport
            if (rect.top < (window.innerHeight || document.documentElement.clientHeight) && rect.bottom > 0) {
                currentRef.classList.add('visible');
            } else {
                observer.observe(currentRef);
            }
        }

        return () => {
            if (currentRef) {
                observer.unobserve(currentRef);
            }
        };
    }, []);

    const delaySeconds = typeof delay === 'number' ? delay : 0;
    
    return (
        <div
            className={`fade-up ${className}`}
            ref={domRef}
            style={{ 
                transitionDelay: delaySeconds > 0 ? `${delaySeconds}s` : undefined 
            }}
        >
            {children}
        </div>
    );

};

export default FadeInSection;
