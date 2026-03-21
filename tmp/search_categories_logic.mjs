const url = 'https://fitgirls.me/assets/index-D0W109b5.js';

const searchCategoriesLogic = async () => {
    try {
        const response = await fetch(url);
        const text = await response.text();
        
        const categories = ['artist', 'fitorialist', 'fashion', 'women', 'men', 'couple', 'outdoor'];
        
        categories.forEach(name => {
            const index = text.indexOf(`"${name}"`);
            if (index !== -1) {
                const context = text.slice(index - 100, index + 100);
                console.log(`\nContext for category "${name}":`);
                console.log(`...${context}...`);
            }
        });

    } catch (error) {
        console.error("Failed to fetch or search JS:", error);
    }
};

searchCategoriesLogic();
