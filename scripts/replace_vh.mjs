import fs from 'fs/promises';
import path from 'path';

async function processDirectory(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
            await processDirectory(fullPath);
        } else if (entry.isFile() && fullPath.endsWith('.css')) {
            let content = await fs.readFile(fullPath, 'utf8');
            let modified = false;
            
            // Regex to find 100vh usage (like height: 100vh; or min-height: calc(100vh - 80px);)
            // We want to add a dvh equivalent right after it if it doesn't already exist.
            
            const lines = content.split('\n');
            const newLines = [];
            
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                newLines.push(line);
                
                if (line.includes('100vh') && !line.includes('100dvh')) {
                    // check if the next line is already dvh
                    if (i + 1 < lines.length && lines[i+1].includes('100dvh')) {
                        continue; // Already processed
                    }
                    
                    const newLine = line.replace(/100vh/g, '100dvh');
                    newLines.push(newLine);
                    modified = true;
                }
            }
            
            if (modified) {
                await fs.writeFile(fullPath, newLines.join('\n'), 'utf8');
                console.log(`Updated ${fullPath}`);
            }
        }
    }
}

async function main() {
    const srcDir = path.join(process.cwd(), 'src');
    await processDirectory(srcDir);
    console.log('Finished updating 100vh to include 100dvh fallbacks.');
}

main().catch(console.error);
