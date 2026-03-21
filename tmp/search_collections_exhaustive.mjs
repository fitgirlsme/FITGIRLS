const url = 'https://fitgirls.me/assets/index-D0W109b5.js';

const searchCollectionsExhaustive = async () => {
    try {
        const response = await fetch(url);
        const text = await response.text();
        
        // Search for all strings used as a second argument in a function call with two arguments 
        // e.g. f(db, "collection_name")
        // Minified version often looks like o(e,"notices")
        const regex = /[a-zA-Z0-9_$]+\([a-zA-Z0-9_$]+,"([a-zA-Z0-9_$]+)"\)/g;
        let match;
        const results = new Set();
        while ((match = regex.exec(text)) !== null) {
            results.add(match[1]);
        }
        
        console.log("Potential collection names found in JS calls:", Array.from(results));

        // Let's filter by names that sound like collections
        const keywords = ["notice", "review", "event", "post", "blog", "data", "info"];
        results.forEach(res => {
            if (keywords.some(k => res.toLowerCase().includes(k))) {
                console.log(`Found matching collection name: ${res}`);
            }
        });

    } catch (error) {
        console.error("Exhaustive search failed:", error);
    }
};

searchCollectionsExhaustive();
