const url = 'https://fitgirls.me/assets/index-D0W109b5.js';

const searchHeaderComponent = async () => {
    try {
        const response = await fetch(url);
        const text = await response.text();
        
        // Search for strings that look like CSS classes for header
        const classes = ["header-container", "nav-item", "lang-switcher", "logo-img"];
        classes.forEach(cls => {
            const idx = text.indexOf(`"${cls}"`);
            if (idx !== -1) {
                console.log(`\nFound class "${cls}" at index ${idx}:`);
                console.log(text.slice(idx - 150, idx + 150));
            }
        });

    } catch (error) {
        console.error("Search failed:", error);
    }
};

searchHeaderComponent();
