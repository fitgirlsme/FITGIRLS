const url = 'https://fitgirls.me/assets/index-D0W109b5.js';

const searchAllCollections = async () => {
    try {
        const response = await fetch(url);
        const text = await response.text();
        
        // Pattern: [Something]d="string"
        const regex = /([a-zA-Z0-9_$]+)d="([^"]+)"/g;
        let match;
        while ((match = regex.exec(text)) !== null) {
            console.log(`Potential Collection Constant: ${match[1]}d = "${match[2]}"`);
        }

    } catch (error) {
        console.error("Search failed:", error);
    }
};

searchAllCollections();
