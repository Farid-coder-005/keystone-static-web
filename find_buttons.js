const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    if (file === '_keystone_backup' || file === 'color-backup-original' || file === 'logo-backup-original' || file === 'hts-cache') continue;
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

const files = walk('./zugimpex.com');

const callbackLinks = new Set();
const bookingLinks = new Set();
const buttonPatterns = [];

for (const f of files) {
  const rel = path.relative('./zugimpex.com', f);
  const content = fs.readFileSync(f, 'utf8');

  // Search for callback buttons/links
  // Look for <a> tags with text like Request a Callback, Let Us Call You, etc.
  const regex = /<a\s+[^>]*?href=["']([^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let m;
  while ((m = regex.exec(content)) !== null) {
    const href = m[1];
    const text = m[2].replace(/<[^>]*>/g, '').trim();

    if (/callback|call[- ]?back|let us call you|rufen sie|rückruf|sunati-ne|pozovite/i.test(text) || /callback|call-back/i.test(href)) {
      callbackLinks.add(`${href} [Text: "${text}"]`);
    }
    if (/book now|schedule a meeting|termin|buchen|programati|zakazite|consultation/i.test(text) || /calendly|consultation|book/i.test(href)) {
      bookingLinks.add(`${href} [Text: "${text}"]`);
    }
  }
}

console.log('--- CALLBACK BUTTONS/LINKS FOUND ---');
console.log(Array.from(callbackLinks));

console.log('\n--- BOOKING BUTTONS/LINKS FOUND ---');
console.log(Array.from(bookingLinks));
