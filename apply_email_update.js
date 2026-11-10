const fs = require('fs');
const path = require('path');

function walk(dir, fileList = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!['.git', 'node_modules', '_keystone_backup', 'color-backup-original', 'logo-backup-original'].includes(entry.name)) {
        walk(fullPath, fileList);
      }
    } else if (entry.isFile() && (entry.name.endsWith('.html') || entry.name.endsWith('.htm'))) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

function replaceEmails(content) {
  let updated = content;

  // 1. Fix data.protection.lawyer@keystone.comPhone -> info@keystoneqp.com Phone
  updated = updated.replace(/data\.protection\.lawyer@(keystone|zugimpex)\.[a-zA-Z]{2,}Phone/gi, 'info@keystoneqp.com Phone');

  // 2. Mailto links: mailto:...@keystone.com or mailto:...@zugimpex.com -> mailto:info@keystoneqp.com
  updated = updated.replace(/mailto:[a-zA-Z0-9._%+-]+@(keystone|zugimpex)\.[a-zA-Z]{2,}/gi, 'mailto:info@keystoneqp.com');

  // 3. Email display texts and meta tags: ...@keystone.com or ...@zugimpex.com -> info@keystoneqp.com
  updated = updated.replace(/[a-zA-Z0-9._%+-]+@(keystone|zugimpex)\.[a-zA-Z]{2,}/gi, 'info@keystoneqp.com');

  return updated;
}

const allFiles = walk('zugimpex.com');
console.log(`Scanning ${allFiles.length} HTML files in zugimpex.com...`);

let modifiedFilesCount = 0;
let totalReplacementsCount = 0;
const modifiedList = [];

allFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const updated = replaceEmails(content);
  
  if (content !== updated) {
    const matchCount = (content.match(/@(keystone|zugimpex)\.[a-zA-Z]{2,}/gi) || []).length;
    fs.writeFileSync(file, updated, 'utf8');
    modifiedFilesCount++;
    totalReplacementsCount += matchCount;
    modifiedList.push({ file, matchCount });
  }
});

console.log(`\n========================================`);
console.log(`Successfully updated ${modifiedFilesCount} files with ${totalReplacementsCount} email replacements.`);
console.log(`========================================\n`);

console.log('Modified files:');
modifiedList.forEach(m => console.log(`  [${m.matchCount} replacements] ${m.file}`));
