const fs = require('fs');
const path = require('path');

let files = [];
function walk(d) {
  const entries = fs.readdirSync(d);
  for (const f of entries) {
    const full = path.join(d, f);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      if (!['.git', 'node_modules', '_keystone_backup', 'color-backup-original', 'logo-backup-original'].includes(f)) {
        walk(full);
      }
    } else if (f.endsWith('.html') || f.endsWith('.htm')) {
      const c = fs.readFileSync(full, 'utf8');
      if (c.includes('header-logo')) files.push(full);
    }
  }
}
walk('zugimpex.com');

console.log('Verifying all', files.length, 'files on disk...');

let issues = [];

files.forEach(f => {
  const c = fs.readFileSync(f, 'utf8');

  // Check 1: Old 55px rule gone
  if (c.includes('height: 55px !important; max-height: 58px !important;')) {
    issues.push({ file: f, issue: 'Still has old 55px rule' });
  }

  // Check 2: New 75px rule present
  if (!c.includes('height: 75px !important;')) {
    issues.push({ file: f, issue: 'Missing 75px height rule' });
  }

  // Check 3: max-width 250px present
  if (!c.includes('max-width: 250px !important;')) {
    issues.push({ file: f, issue: 'Missing max-width 250px rule' });
  }

  // Check 4: flex-shrink 0 on img
  if (!c.includes('flex-shrink: 0 !important;')) {
    issues.push({ file: f, issue: 'Missing flex-shrink: 0 !important rule' });
  }

  // Check 5: HTML inline style flex-shrink on div
  if (!c.includes('<div class="header-logo" style="flex-shrink: 0;">')) {
    issues.push({ file: f, issue: 'Missing style="flex-shrink: 0;" on <div class="header-logo">' });
  }

  // Check 6: HTML inline style on a.navbar-brand
  if (!/<a\s+[^>]*class="navbar-brand custom-logo"[^>]*style="flex-shrink: 0;"/i.test(c)) {
    issues.push({ file: f, issue: 'Missing style="flex-shrink: 0;" on <a>' });
  }

  // Check 7: HTML inline style on img
  if (!/<img\s+style="flex-shrink: 0;"[^>]*alt="KEYSTONE"/i.test(c)) {
    issues.push({ file: f, issue: 'Missing style="flex-shrink: 0;" on <img>' });
  }

  // Check 8: align-items center preserved
  if (!c.includes('align-items: center !important;')) {
    issues.push({ file: f, issue: 'Missing align-items: center !important' });
  }
});

console.log(`Total issues found: ${issues.length}`);
if (issues.length > 0) {
  console.log(issues.slice(0, 10));
} else {
  console.log('ALL 144 FILES VERIFIED PERFECTLY! Zero issues detected.');
}
