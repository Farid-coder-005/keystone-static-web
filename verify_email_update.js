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

const allFiles = walk('zugimpex.com');
console.log(`Auditing all ${allFiles.length} HTML files on disk...\n`);

let oldEmailsFound = [];
let newEmailCount = 0;
let newMailtoCount = 0;

allFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');

  // Check 1: Any @keystone.com or @zugimpex.com
  const oldMatches = content.match(/([a-zA-Z0-9._%+-]+@(keystone|zugimpex)\.[a-zA-Z]{2,}[a-zA-Z]*)/gi);
  if (oldMatches) {
    oldEmailsFound.push({ file, matches: oldMatches });
  }

  // Check 2: Count info@keystoneqp.com
  let pos = 0;
  while ((pos = content.indexOf('info@keystoneqp.com', pos)) !== -1) {
    newEmailCount++;
    pos += 'info@keystoneqp.com'.length;
  }

  // Check 3: Count mailto:info@keystoneqp.com
  pos = 0;
  while ((pos = content.indexOf('mailto:info@keystoneqp.com', pos)) !== -1) {
    newMailtoCount++;
    pos += 'mailto:info@keystoneqp.com'.length;
  }
});

console.log('Audit Results:');
console.log('--------------------------------------------------');
console.log(`Remaining legacy @keystone.com / @zugimpex.com emails: ${oldEmailsFound.length}`);
if (oldEmailsFound.length > 0) {
  console.log('FAILURES:');
  oldEmailsFound.forEach(f => console.log(`  ${f.file}:`, f.matches));
} else {
  console.log('SUCCESS: Zero legacy emails found across all files!');
}

console.log(`Total "info@keystoneqp.com" occurrences: ${newEmailCount}`);
console.log(`Total "mailto:info@keystoneqp.com" occurrences: ${newMailtoCount}`);
console.log(`Display text occurrences: ${newEmailCount - newMailtoCount}`);
console.log('--------------------------------------------------');
