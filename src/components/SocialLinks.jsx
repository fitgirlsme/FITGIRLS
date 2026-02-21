import React from 'react';
import './SocialLinks.css';

const SocialLinks = () => {
    return (
        <div className="social-links-container">
            <a
                href="http://instagram.com/fitgirls.me"
                target="_blank"
                rel="noopener noreferrer"
                className="social-link"
            >
                INSTAGRAM
            </a>
            <a
                href="https://pin.it/3IPk7D2NY"
                target="_blank"
                rel="noopener noreferrer"
                className="social-link"
            >
                PINTEREST
            </a>
            <a
                href="https://www.youtube.com/@핏걸즈"
                target="_blank"
                rel="noopener noreferrer"
                className="social-link"
            >
                YOUTUBE
            </a>
        </div>
    );
};

export default SocialLinks;
