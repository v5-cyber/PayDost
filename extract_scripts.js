const fs = require('fs');
const html = fs.readFileSync('public/index.html', 'utf8');
const scriptMatches = [...html.matchAll(/<script.*?>([\s\S]*?)<\/script>/gi)];

scriptMatches.forEach((match, i) => {
    const code = match[1].trim();
    if (code) {
        fs.writeFileSync(`temp_script_${i}.js`, code);
        console.log(`Saved temp_script_${i}.js`);
    }
});
