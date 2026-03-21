import fs from 'fs';
import path from 'path';

const csvPath = '/Users/house/Downloads/pcmap-place-naver-com-2026-03-04-2.csv';
const outputPath = '/Users/house/Pictures/안티그라피티/src/data/reviews_backup.json';

function parseCSVRobust(content) {
    const rows = [];
    let currentRow = [];
    let currentField = '';
    let inQuotes = false;
    
    for (let i = 0; i < content.length; i++) {
        const char = content[i];
        const nextChar = content[i + 1];
        
        if (char === '"' && inQuotes && nextChar === '"') {
            // Escaped quote
            currentField += '"';
            i++;
        } else if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            currentRow.push(currentField);
            currentField = '';
        } else if ((char === '\n' || char === '\r') && !inQuotes) {
            if (char === '\r' && nextChar === '\n') i++;
            currentRow.push(currentField);
            rows.push(currentRow);
            currentRow = [];
            currentField = '';
        } else {
            currentField += char;
        }
    }
    
    if (currentRow.length > 0 || currentField) {
        currentRow.push(currentField);
        rows.push(currentRow);
    }
    
    return rows;
}

try {
    const content = fs.readFileSync(csvPath, 'utf8');
    const rows = parseCSVRobust(content);
    
    const reviews = [];
    // rows[0] is header
    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (row.length < 5) continue;
        
        const author = row[2] || 'Unknown';
        const text = row[3] || '';
        const dateRaw = row[4] || '';
        const img = row[29] || row[30] || '';
        
        if (text.length < 5) continue;
        
        reviews.push({
            id: `naver-${i}`,
            author: author,
            text: text.replace(/\n/g, ' ').trim(),
            createdAt: dateRaw,
            rating: 5,
            img: img.startsWith('http') ? img : (img.startsWith('data:image') ? img : null),
            source: 'NAVER'
        });
    }
    
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(outputPath, JSON.stringify(reviews, null, 2));
    console.log(`Successfully extracted ${reviews.length} clean reviews to ${outputPath}`);
} catch (error) {
    console.error('Error processing CSV:', error);
}
