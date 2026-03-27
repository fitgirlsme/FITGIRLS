import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, orderBy, query, limit } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

const firebaseConfig = {
    apiKey: "AIzaSyDkaXEX1UCe7JI6YGSwKSUwhlhicMWKduk",
    authDomain: "fitgirls-me-web.firebaseapp.com",
    projectId: "fitgirls-me-web",
    storageBucket: "fitgirls-me-web.firebasestorage.app",
    messagingSenderId: "997964786089",
    appId: "1:997964786089:web:72eaba535985f0c8a2fcb8"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const FIXED_HASHTAGS = ['바디프로필', '핏걸즈', '여자바디프로필', '바디프로필스튜디오', '웰니스', '바레']
    .map(t => `#${t}`).join(' ');

async function generateRSS() {
    console.log('Generating RSS feed for Pinterest...');
    
    try {
        // Fetch latest gallery items (up to 1000)
        const gallerySnap = await getDocs(query(
            collection(db, 'gallery'), 
            orderBy('createdAt', 'desc'), 
            limit(1000)
        ));

        const items = [];

        gallerySnap.forEach(doc => {
            const data = doc.data();
            const hashtags = [
                data.mainCategory,
                data.type,
                ...(data.tags || [])
            ].filter(t => !!t).map(t => `#${t.replace(/\s+/g, '')}`).join(' ');

            items.push({
                title: `${data.type?.toUpperCase() || 'Gallery'} | ${data.tags?.join(', ') || ''}`,
                link: `https://fitgirls.me/gallery?id=${doc.id}`,
                description: `FITGIRLS & INAFIT | ${data.mainCategory || ''} ${hashtags} ${FIXED_HASHTAGS}`,
                image: data.imageUrl,
                pubDate: data.createdAt?.toDate ? data.createdAt.toDate().toUTCString() : new Date().toUTCString(),
                guid: doc.id
            });
        });

        // Sort items by pubDate
        items.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

        const rssHeader = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:media="http://search.yahoo.com/mrss/">
<channel>
  <title>FITGIRLS &amp; INAFIT Gallery</title>
  <link>https://fitgirls.me</link>
  <description>Premium Body Profile Studio in Seoul. Specialized in Female Body Pictorials.</description>
  <language>ko-kr</language>
  <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
`;

        const rssItems = items
            .filter(item => !!item.image) // Only include items with images
            .map(item => {
                const escapedImage = item.image.replace(/&/g, '&amp;');
            return `
  <item>
    <title><![CDATA[${item.title}]]></title>
    <link>${item.link}</link>
    <guid isPermaLink="false">${item.guid}</guid>
    <pubDate>${item.pubDate}</pubDate>
    <description><![CDATA[${item.description}]]></description>
    <enclosure url="${escapedImage}" length="0" type="image/jpeg" />
    <content:encoded><![CDATA[<img src="${escapedImage}" /><p>${item.description}</p>]]></content:encoded>
  </item>`;
        }).join('');

        const rssFooter = `
</channel>
</rss>`;

        const fullRSS = rssHeader + rssItems + rssFooter;
        
        const publicPath = path.join(process.cwd(), 'public', 'rss.xml');
        fs.writeFileSync(publicPath, fullRSS);
        
        console.log(`Successfully generated RSS feed with ${items.length} items at ${publicPath}`);
    } catch (err) {
        console.error('Error generating RSS feed:', err);
    }
    
    process.exit(0);
}

generateRSS();
