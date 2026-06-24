const fs = require('fs');

const filesToUpdate = [
  'public/about.html',
  'public/home.html',
  'public/pricing.html',
  'public/privacy.html',
  'public/terms.html',
  'public/index.html'
];

filesToUpdate.forEach(f => {
  if (fs.existsSync(f)) {
    let content = fs.readFileSync(f, 'utf8');
    
    // Replace <a class="logo">...</a> contents
    content = content.replace(/(<a[^>]*class=["']logo["'][^>]*>)([\s\S]*?)(<\/a>)/gi, '$1<img src="/images/bucksbuddy_logo.svg" alt="BucksBuddy" style="height:32px; vertical-align:middle;">$3');
    
    // Replace <div class="sidebar-logo">...</div> contents
    content = content.replace(/(<div[^>]*class=["']sidebar-logo["'][^>]*>)([\s\S]*?)(<\/div>)/gi, '$1<img src="/images/bucksbuddy_logo.svg" alt="BucksBuddy" style="height:40px; display:block; margin:auto;">$3');
    
    fs.writeFileSync(f, content);
    console.log(`Updated logos in ${f}`);
  }
});
