import fs from 'fs';
import path from 'path';

const csvPath = '/Users/house/Downloads/pcmap-place-naver-com-2026-03-04-2.csv';
const outputPath = '/Users/house/Pictures/안티그라피티/src/data/reviews_backup.json';

function parseCSV(content) {
    const lines = content.split('\n');
    const headers = lines[0].split(',');
    
    // Column indices from analysis:
    // data (author) -> index 2
    // data2 (text) -> index 3
    // data3 (date) -> index 4
    // image -> index 29 (30th column)
    
    const reviews = [];
    
    // Skip header and process lines
    for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        
        // Simple CSV splitter that handles some quoted fields
        // Since Naver reviews may contain commas, we need a better regex
        const regex = /(".*?"|[^",\s]+)(?=\s*,|\s*$)/g;
        const matches = lines[i].match(/"[^"]*"|[^,]+/g) || [];
        
        const row = matches.map(m => m.replace(/^"|"$/g, '').trim());
        
        if (row.length < 5) continue;
        
        const author = row[2] || 'Unknown';
        const text = row[3] || '';
        const dateRaw = row[4] || ''; // e.g., "25.12.20.토"
        const img = row[29] || row[30] || ''; // Naver image URL or base64
        
        // Filter out very short or empty reviews
        if (text.length < 5) continue;
        
        reviews.push({
            id: `naver-${i}`,
            author: author,
            text: text,
            createdAt: dateRaw,
            rating: 5,
            img: img.startsWith('http') ? img : (img.startsWith('data:image') ? img : null),
            source: 'NAVER'
        });
    }
    
    return reviews;
}

try {
    const content = fs.readFileSync(csvPath, 'utf8');
    const reviews = parseCSV(content);
    
    // Ensure data directory exists
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(outputPath, JSON.stringify(reviews, null, 2));
    console.log(`Successfully extracted ${reviews.length} reviews to ${outputPath}`);
} catch (error) {
    console.error('Error processing CSV:', error);
}
