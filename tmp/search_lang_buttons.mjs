const url = 'https://fitgirls.me/assets/index-D0W109b5.js';

const searchLangButtons = async () => {
    try {
        const response = await fetch(url);
        const text = await response.text();
        
        // Search for strings like "KR", "EN", "JA" in the same array or object
        const regex = /["']KR["'],["']EN["'],["']JA["']/i;
        const match = text.match(regex);
        if (match) {
            console.log("Found language switcher array!");
            const index = match.index;
            console.log(text.slice(index - 200, index + 200));
        } else {
            // Search separately
            ["KR", "EN", "JA"].forEach(lang => {
                const idx = text.indexOf(`"${lang}"`);
                if (idx !== -1) {
                    console.log(`\nFound "${lang}" at index ${idx}:`);
                    console.log(text.slice(idx - 100, idx + 100));
                }
            });
        }

        // Search for navigation labels
        const navLabels = ["GALLERY", "RESERVATION", "PRICE", "LOCATION", "FAQ"];
        navLabels.forEach(label => {
            const idx = text.indexOf(`"${label}"`);
            if (idx !== -1) {
                console.log(`\nFound navigation label "${label}" at index ${idx}:`);
                console.log(text.slice(idx - 100, idx + 100));
            }
        });

    } catch (error) {
        console.error("Search failed:", error);
    }
};

searchLangButtons();
