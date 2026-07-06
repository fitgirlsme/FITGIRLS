import fs from 'fs';

const backupFilePath = '/Users/house/Pictures/inastudio/backups/gallery_backup_2026-06-05T02-53-57-543Z.json';

function checkCategories() {
    if (!fs.existsSync(backupFilePath)) {
        console.error("Backup file not found.");
        process.exit(1);
    }

    try {
        const rawData = fs.readFileSync(backupFilePath, 'utf-8');
        const items = JSON.parse(rawData);
        
        const mainCategories = new Set();
        const types = new Set();

        items.forEach(item => {
            const data = item.data;
            if (data) {
                if (data.mainCategory) mainCategories.add(data.mainCategory);
                if (data.type) types.add(data.type);
            }
        });

        console.log("Main Categories in backup:", Array.from(mainCategories));
        console.log("Types (sub-categories) in backup:", Array.from(types));

    } catch (e) {
        console.error("Error checking categories:", e);
    }
    process.exit(0);
}

checkCategories();
