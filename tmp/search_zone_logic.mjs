const url = 'https://fitgirls.me/assets/index-D0W109b5.js';

const searchZoneLogic = async () => {
    try {
        const response = await fetch(url);
        const text = await response.text();
        
        // Search for "STUDIO ZONE" or "LOOKBOOK" strings
        const searchTerms = ["STUDIO ZONE", "LOOKBOOK", "STUDIO", "LOOKBOOK_ITEMS", "lookbook"];
        
        searchTerms.forEach(term => {
            const index = text.indexOf(term);
            if (index !== -1) {
                const context = text.slice(index - 100, index + 200);
                console.log(`\nFound term "${term}":`);
                console.log(`Context: ...${context}...`);
            }
        });

    } catch (error) {
        console.error("Failed to fetch or search JS:", error);
    }
};

searchZoneLogic();
