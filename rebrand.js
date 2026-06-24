const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory() && !file.includes('node_modules')) {
      results = results.concat(walk(file));
    } else if (!stat.isDirectory() && 
               !file.includes('node_modules') && 
               !file.endsWith('.png') && 
               !file.endsWith('.webp') && 
               !file.endsWith('.svg') &&
               !file.endsWith('.db') && 
               !file.endsWith('.db-shm') && 
               !file.endsWith('.db-wal')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk('./');
let modifiedFiles = [];

files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  let newContent = content;

  // Texts
  newContent = newContent.replace(/BucksBuddy/g, 'BucksBuddy');
  newContent = newContent.replace(/bucksbuddy/g, 'bucksbuddy');
  newContent = newContent.replace(/BucksBuddy/g, 'BucksBuddy');

  // Colors Hex
  newContent = newContent.replace(/#8D73F6/gi, '#8D73F6');
  newContent = newContent.replace(/#C7F36B/gi, '#C7F36B');
  newContent = newContent.replace(/#111111/gi, '#111111');
  newContent = newContent.replace(/#1A1A1A/gi, '#1A1A1A');
  newContent = newContent.replace(/#111111/gi, '#111111');
  newContent = newContent.replace(/#C7F36B/gi, '#C7F36B');

  // Colors RGB values inside rgba
  newContent = newContent.replace(/2,\s*128,\s*144/g, '141, 115, 246'); // old #8D73F6 -> #8D73F6
  newContent = newContent.replace(/2,\s*195,\s*154/g, '199, 243, 107'); // old #C7F36B -> #C7F36B
  newContent = newContent.replace(/13,\s*27,\s*62/g, '17, 17, 17');    // old #111111 -> #111111
  newContent = newContent.replace(/30,\s*41,\s*59/g, '26, 26, 26');    // old #1A1A1A -> #1A1A1A
  newContent = newContent.replace(/5,\s*13,\s*31/g, '17, 17, 17');     // old #111111 -> #111111

  // Fonts
  newContent = newContent.replace(/family=Inter:wght@400;500;600;700;800&family=Sora:wght@400;600;700;800&display=swap']+/g, 'family=Inter:wght@400;500;600;700;800&family=Sora:wght@400;600;700;800&display=swap');
  newContent = newContent.replace(/family=DM\+Sans:[^']+/g, 'family=Inter:wght@400;500;600;700;800&family=Sora:wght@400;600;700;800&display=swap');
  newContent = newContent.replace(/font-family:\s*'Syne'/g, "font-family: 'Sora'");
  newContent = newContent.replace(/font-family:\s*'DM Sans'/g, "font-family: 'Inter'");
  newContent = newContent.replace(/font-family:\s*Syne/g, "font-family: 'Sora'");

  if (content !== newContent) {
    fs.writeFileSync(f, newContent);
    modifiedFiles.push(f);
  }
});

console.log('Modified files:', modifiedFiles.length);
console.log(modifiedFiles.join('\\n'));
