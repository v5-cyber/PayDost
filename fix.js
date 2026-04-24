const fs = require('fs');
let content = fs.readFileSync('public/app4.js', 'utf8');
content = content.replace(/\\/g, '');
content = content.replace(/\\\$/g, '');
content = content.replace(/\\\\n/g, '\\n');
fs.writeFileSync('public/app4.js', content);
