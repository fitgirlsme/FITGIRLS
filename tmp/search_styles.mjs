const url = 'https://fitgirls.me/assets/index-OFrIgRhB.css';

const searchLanguageStyles = async () => {
    try {
        const response = await fetch(url);
        const text = await response.text();
        
        const keywords = ["lang", "switcher", "nav", "header", "kr", "en", "ja"];
        keywords.forEach(kw => {
            const regex = new RegExp(`\\.[^\\{]*${kw}[^\\{]*\\{[^\\}]*\\}`, "gi");
            let match;
            while ((match = regex.exec(text)) !== null) {
                console.log(`Found style for ${kw}: ${match[0]}`);
            }
        });

    } catch (error) {
        console.error("Search failed:", error);
    }
};

searchLanguageStyles();
