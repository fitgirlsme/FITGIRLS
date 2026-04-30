import React, { useEffect, useRef, useState } from 'react';

const FadeInSection = ({ children, delay = 0, className = '' }) => {
    const domRef = useRef();
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.unobserve(entry.target); 
                }
            });
        }, {
            threshold: 0.05,
            root: null,
            rootMargin: "0px 0px 200px 0px"
        });

        const currentRef = domRef.current;
        if (currentRef) {
            const rect = currentRef.getBoundingClientRect();
            if (rect.top < (window.innerHeight || document.documentElement.clientHeight) && rect.bottom > 0) {
                setIsVisible(true);
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
            className={`fade-up ${className} ${isVisible ? 'visible' : ''}`}
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
