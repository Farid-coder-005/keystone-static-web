const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    if (file === 'hts-cache' || file === 'logo-backup-original') continue;
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(fullPath));
    } else if (file.endsWith('.html')) {
      results.push(fullPath);
    }
  }
  return results;
}

const files = walk('.');
console.log('Total HTML files in workspace:', files.length);

const allSocialAnchors = [];

for (const f of files) {
  const content = fs.readFileSync(f, 'utf8');
  // Match any <a> tag that has class containing "social-icon" or href to social platforms
  const regex = /<a\s+[^>]*?(?:elementor-social-icon|facebook\.com|instagram\.com|youtube\.com|linkedin\.com|twitter\.com)[^>]*>[\s\S]*?<\/a>/gi;
  let m;
  while ((m = regex.exec(content)) !== null) {
    const hrefMatch = m[0].match(/href=["']([^"']*)["']/i);
    const href = hrefMatch ? hrefMatch[1] : '';
    allSocialAnchors.push({
      file: f,
      href,
      tag: m[0]
    });
  }
}

console.log('Total social anchor tags found:', allSocialAnchors.length);

const uniqueHrefs = {};
allSocialAnchors.forEach(a => {
  uniqueHrefs[a.href] = (uniqueHrefs[a.href] || 0) + 1;
});

console.log('Unique hrefs across all HTML files:');
console.log(uniqueHrefs);
