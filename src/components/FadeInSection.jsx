import React, { useEffect, useRef } from 'react';

const FadeInSection = ({ children, delay = 0, className = '' }) => {
    const domRef = useRef();

    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    // Once visible, keep it visible to avoid flickering in the modal
                    observer.unobserve(entry.target); 
                }
            });
        }, {
            threshold: 0.01,    // Near-immediate trigger
            rootMargin: "50px"  // Trigger slightly before they enter the view
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
