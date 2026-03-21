const url = 'https://fitgirls.me/assets/index-D0W109b5.js';

const searchConstants = async () => {
    try {
        const response = await fetch(url);
        const text = await response.text();
        
        // Search for all constant definitions of strings near hero_slides
        const index = text.indexOf("hero_slides");
        if (index !== -1) {
            const context = text.slice(index - 500, index + 500);
            console.log("Context around 'hero_slides':");
            console.log(context);
        }

    } catch (error) {
        console.error("Search constants failed:", error);
    }
};

searchConstants();
