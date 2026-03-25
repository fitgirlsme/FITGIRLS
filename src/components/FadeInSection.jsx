import React, { useEffect, useRef } from 'react';

const FadeInSection = ({ children, delay = 0, className = '' }) => {
    const domRef = useRef();

    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    // Optional: Keep it visible once scrolled past, or toggle to repeat
                    // observer.unobserve(entry.target); 
                } else {
                    // Remove to repeat animation on scroll up/down
                    entry.target.classList.remove('visible');
                }
            });
        }, {
            threshold: 0.1,    // Trigger when 10% visible
            rootMargin: "0px 0px -50px 0px"
        });

        const currentRef = domRef.current;
        if (currentRef) {
            observer.observe(currentRef);
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
