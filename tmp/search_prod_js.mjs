const url = 'https://fitgirls.me/assets/index-D0W109b5.js';

const searchCollections = async () => {
    try {
        const response = await fetch(url);
        const text = await response.text();
        
        console.log("JS Content fetched. Length:", text.length);

        // Look for common collection names in quotes
        const potentialNames = ["notices", "reviews", "galleries", "gallery", "notice", "review", "models", "hero_slides", "heroSlides", "home_sections", "studio_zones"];
        
        potentialNames.forEach(name => {
            const index = text.indexOf(`"${name}"`);
            const indexSingle = text.indexOf(`'${name}'`);
            if (index !== -1 || indexSingle !== -1) {
                const foundIndex = index !== -1 ? index : indexSingle;
                const context = text.slice(foundIndex - 40, foundIndex + 60);
                console.log(`\nFound potential collection/string "${name}":`);
                console.log(`Context: ...${context}...`);
            }
        });

        // Search for where collection function might be defined or used
        // In minified firebase, it's often imported as something like (0,o.collection)(e,"name")
        const funcRegex = /"([^"]+)"\)/g; // Rough search for strings in function calls
        // Let's just look at all strings and filter by common collection patterns
        
    } catch (error) {
        console.error("Failed to fetch or search JS:", error);
    }
};

searchCollections();
