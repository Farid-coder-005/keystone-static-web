/**
 * update_social_links.js
 *
 * Scans HTML files across the website and performs the following updates:
 * 1. Locates social media icon links (Facebook, Instagram, YouTube, etc.) in the footer/connect section.
 * 2. Keeps all icons, SVG vector graphics, and layouts intact.
 * 3. Replaces their href attributes with href="javascript:void(0)" so clicking does nothing.
 * 4. Ensures no external social media links remain in headers, footers, or content across all languages.
 *
 * Usage:
 *   node update_social_links.js [--dry-run] [--target <dir>] [--verbose]
 */

const fs = require('fs');
const path = require('path');

// CLI Arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run') || args.includes('-n');
const isVerbose = args.includes('--verbose') || args.includes('-v');

let targetDir = '.';
const targetIndex = args.indexOf('--target');
if (targetIndex !== -1 && args[targetIndex + 1]) {
  targetDir = args[targetIndex + 1];
}

console.log('='.repeat(70));
console.log('SOCIAL MEDIA ICONS CLEANUP & HREF VOID SCRIPT');
console.log('='.repeat(70));
console.log(`Target directory : ${path.resolve(targetDir)}`);
console.log(`Mode             : ${isDryRun ? 'DRY RUN (no files will be written)' : 'LIVE (files will be updated)'}`);
console.log(`Replacement href : href="javascript:void(0)"`);
console.log('='.repeat(70));

/**
 * Recursively find all HTML files in a directory, skipping cache.
 */
function walk(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  for (const file of list) {
    if (file === 'hts-cache' || file === 'logo-backup-original') {
      continue;
    }
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

const htmlFiles = walk(targetDir);
console.log(`\nFound ${htmlFiles.length} HTML files to inspect.\n`);

const summary = {
  scanned: htmlFiles.length,
  modified: 0,
  facebookUpdated: 0,
  instagramUpdated: 0,
  youtubeUpdated: 0,
  otherSocialUpdated: 0,
  remainingExternal: 0,
  modifiedFiles: []
};

// Regex to check for remaining external social links in anchor tags
const checkDomainRegex = /<a\s+[^>]*?href=["']https?:\/\/(?:[a-zA-Z0-9-]+\.)*(?:facebook\.com|instagram\.com|youtube\.com|youtu\.be|linkedin\.com|twitter\.com|x\.com|tiktok\.com|pinterest\.com)\b[^"']*["'][^>]*>[\s\S]*?<\/a>/gi;

for (const filePath of htmlFiles) {
  const relPath = path.relative(targetDir, filePath);
  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;

  // Match social icon anchor tags with class elementor-social-icon
  // Replace their href with javascript:void(0) while keeping all classes, SVGs, and layout intact
  content = content.replace(/(<a\b[^>]*?class=["'][^"']*elementor-social-icon([^"']*)["'][^>]*?)href=["'][^"']*["']([^>]*?>)/gi, (match, before, classes, after) => {
    if (/facebook/i.test(classes)) summary.facebookUpdated++;
    else if (/instagram/i.test(classes)) summary.instagramUpdated++;
    else if (/youtube/i.test(classes)) summary.youtubeUpdated++;
    else summary.otherSocialUpdated++;
    return `${before}href="javascript:void(0)"${after}`;
  });

  // Handle case where href attribute precedes class attribute
  content = content.replace(/(<a\b[^>]*?)href=["'][^"']*["']([^>]*?class=["'][^"']*elementor-social-icon([^"']*)["'][^>]*?>)/gi, (match, before, after, classes) => {
    if (/facebook/i.test(classes)) summary.facebookUpdated++;
    else if (/instagram/i.test(classes)) summary.instagramUpdated++;
    else if (/youtube/i.test(classes)) summary.youtubeUpdated++;
    else summary.otherSocialUpdated++;
    return `${before}href="javascript:void(0)"${after}`;
  });

  // Also catch any other external social links in anchor tags (e.g., direct links to youtube.com/channel or facebook/instagram)
  const externalSocialRegex = /(<a\b[^>]*?)href=["']https?:\/\/(?:[a-zA-Z0-9-]+\.)*(?:facebook\.com|instagram\.com|youtube\.com\/channel|linkedin\.com\/company|twitter\.com|x\.com)[^"']*["']([^>]*?>)/gi;
  content = content.replace(externalSocialRegex, (match, before, after) => {
    summary.otherSocialUpdated++;
    return `${before}href="javascript:void(0)"${after}`;
  });

  // Verification on transformed content
  const remaining = content.match(checkDomainRegex);
  if (remaining) {
    summary.remainingExternal += remaining.length;
    console.warn(`[WARNING] External social link still found in ${filePath}:`, remaining);
  }

  if (content !== originalContent) {
    summary.modified++;
    summary.modifiedFiles.push(relPath);

    if (!isDryRun) {
      fs.writeFileSync(filePath, content, 'utf8');
    }

    if (isVerbose) {
      console.log(`[MODIFIED] ${relPath}`);
    }
  }
}

console.log('='.repeat(70));
console.log('EXECUTION SUMMARY');
console.log('='.repeat(70));
console.log(`HTML files scanned               : ${summary.scanned}`);
console.log(`HTML files modified              : ${summary.modified}`);
console.log(`Facebook icon links updated      : ${summary.facebookUpdated}`);
console.log(`Instagram icon links updated     : ${summary.instagramUpdated}`);
console.log(`YouTube icon links updated       : ${summary.youtubeUpdated}`);
console.log(`Total social icon links updated  : ${summary.facebookUpdated + summary.instagramUpdated + summary.youtubeUpdated + summary.otherSocialUpdated}`);
console.log(`Remaining external social links  : ${summary.remainingExternal}`);
console.log('='.repeat(70));

if (isDryRun) {
  console.log('\nNOTE: This was a dry run. Run without --dry-run to apply changes.');
} else {
  console.log('\nAll changes have been successfully written to disk.');
}
