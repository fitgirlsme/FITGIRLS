const url = 'https://fitgirls.me/assets/index-OFrIgRhB.css';

const searchHeaderStyles = async () => {
    try {
        const response = await fetch(url);
        const text = await response.text();
        
        // Search for .header or .nav-container styles
        const patterns = [/\.header[^{]*\{[^}]*\}/gi, /\.nav[^{]*\{[^}]*\}/gi, /\.logo[^{]*\{[^}]*\}/gi];
        patterns.forEach(pattern => {
            let match;
            while ((match = pattern.exec(text)) !== null) {
                console.log(match[0]);
            }
        });

    } catch (error) {
        console.error("Search failed:", error);
    }
};

searchHeaderStyles();
