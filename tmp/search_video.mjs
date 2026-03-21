const url = 'https://fitgirls.me/assets/index-D0W109b5.js';

const searchVideo = async () => {
    try {
        const response = await fetch(url);
        const text = await response.text();
        
        const regex = /"([^"]+\.mp4)"/g;
        let match;
        while ((match = regex.exec(text)) !== null) {
            console.log(`Found video URL: ${match[1]}`);
        }

    } catch (error) {
        console.error("Failed to fetch or search JS:", error);
    }
};

searchVideo();
