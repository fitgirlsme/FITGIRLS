import React, { useEffect, useRef } from 'react';

const FadeInSection = ({ children, delay = 0, className = '' }) => {
    const domRef = useRef();

    useEffect(() => {
        const container = document.querySelector('.snap-container');
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target); 
                }
            });
        }, {
            threshold: 0.05,
            root: container || null, // Explicitly observe within snap container if it exists
            rootMargin: "0px 0px 100px 0px" // Trigger earlier
        });

        const currentRef = domRef.current;
        if (currentRef) {
            // Immediate check if already in view (safety)
            const rect = currentRef.getBoundingClientRect();
            if (rect.top >= 0 && rect.bottom <= (window.innerHeight || document.documentElement.clientHeight)) {
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
