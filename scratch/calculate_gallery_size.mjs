import fs from 'fs';

const backupFilePath = '/Users/house/Pictures/inastudio/backups/gallery_backup_2026-06-05T02-53-57-543Z.json';

function calculateSize() {
    if (!fs.existsSync(backupFilePath)) {
        console.error("Backup file not found.");
        process.exit(1);
    }

    try {
        const rawData = fs.readFileSync(backupFilePath, 'utf-8');
        const items = JSON.parse(rawData);
        
        let totalSizeBytes = 0;
        let itemsWithSize = 0;
        let itemsWithoutSize = 0;

        items.forEach(item => {
            const size = item.data?.size;
            if (size && typeof size === 'number') {
                totalSizeBytes += size;
                itemsWithSize++;
            } else {
                itemsWithoutSize++;
            }
        });

        const sizeInKB = totalSizeBytes / 1024;
        const sizeInMB = sizeInKB / 1024;
        const sizeInGB = sizeInMB / 1024;

        console.log(`Total items: ${items.length}`);
        console.log(`Items with size property: ${itemsWithSize}`);
        console.log(`Items without size property: ${itemsWithoutSize}`);
        console.log(`Total Size:`);
        console.log(`  Bytes: ${totalSizeBytes} B`);
        console.log(`  Megabytes: ${sizeInMB.toFixed(2)} MB`);
        console.log(`  Gigabytes: ${sizeInGB.toFixed(2)} GB`);

    } catch (e) {
        console.error("Error calculating size:", e);
    }
    process.exit(0);
}

calculateSize();
