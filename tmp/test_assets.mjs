const files = [
    'http://localhost:5174/src/main.jsx',
    'http://localhost:5174/src/App.jsx',
    'http://localhost:5174/src/components/Header.jsx',
    'http://localhost:5174/src/index.css'
];

async function checkFiles() {
    for (const file of files) {
        try {
            const res = await fetch(file);
            console.log(`${file} status: ${res.status}`);
            if (!res.ok) {
                const text = await res.text();
                console.log(`Error content: ${text.slice(0, 200)}`);
            }
        } catch (e) {
            console.log(`${file} failed: ${e.message}`);
        }
    }
}

checkFiles();
