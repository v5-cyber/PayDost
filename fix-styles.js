const fs = require('fs');

const filesToFix = [
  'public/home.html',
  'public/pricing.html',
  'public/about.html',
  'public/privacy.html',
  'public/terms.html'
];

const brokenLineRegex = /<link href="https:\/\/fonts\.googleapis\.com\/css2\?family=Inter:wght@400;500;600;700;800&family=Sora:wght@400;600;700;800&display=swap'Inter', sans-serif; }/g;

const replacementText = `<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Sora:wght@400;600;700;800&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #111111;
      --bg-card: #1A1A1A;
      --teal: #8D73F6;
      --teal-light: #C7F36B;
      --teal-glow: rgba(141, 115, 246, 0.4);
      --text: #FFFFFF;
      --text-muted: #8FD8E8;
      --border: #333333;
      --danger: #DC2626;
      --danger-light: rgba(220, 38, 38, 0.1);
    }
    * { margin:0; padding:0; box-sizing:border-box; font-family: 'Inter', sans-serif; }`;

filesToFix.forEach(f => {
  if (fs.existsSync(f)) {
    let content = fs.readFileSync(f, 'utf8');
    if (brokenLineRegex.test(content)) {
      content = content.replace(brokenLineRegex, replacementText);
      fs.writeFileSync(f, content);
      console.log(`Fixed ${f}`);
    } else {
      console.log(`No broken line found in ${f}`);
    }
  }
});
