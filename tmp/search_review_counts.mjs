const url = 'https://fitgirls.me/assets/index-D0W109b5.js';

const searchReviewCounts = async () => {
    try {
        const response = await fetch(url);
        const text = await response.text();
        
        const searchTerms = ["totalReviews", "averageRating", "totalShooters"];
        
        searchTerms.forEach(term => {
            const index = text.indexOf(term);
            if (index !== -1) {
                const context = text.slice(index - 200, index + 200);
                console.log(`\nContext for "${term}":`);
                console.log(context);
            }
        });

    } catch (error) {
        console.error("Search failed:", error);
    }
};

searchReviewCounts();
