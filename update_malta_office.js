/**
 * update_malta_office.js
 *
 * Scans HTML files across the website and performs the following updates:
 * 1. Address Text: Replaces old Malta office address with:
 *    "14 GARDENIA BLK A FL 2 TRIQ L-ISPANJULETT KAPPARA, SAN GWANN, SGN 4042, Malta"
 * 2. Phone Numbers: Updates contact phone numbers in headers/footers/contact sections to "+356 7960 1628".
 * 3. Phone Links: Ensures all corresponding href="tel:..." attributes are updated to href="tel:+35679601628".
 * 4. Google Maps: Updates the Malta office Google Maps iframe src URL with the URL-encoded new address.
 *
 * Usage:
 *   node update_malta_office.js [--dry-run] [--target <dir>] [--verbose]
 */

const fs = require('fs');
const path = require('path');

// Configuration
const NEW_ADDRESS = '14 GARDENIA BLK A FL 2 TRIQ L-ISPANJULETT KAPPARA, SAN GWANN, SGN 4042, Malta';
const NEW_ADDRESS_ENCODED = encodeURIComponent(NEW_ADDRESS);
const NEW_PHONE = '+356 7960 1628';
const NEW_TEL = '+35679601628';

const NEW_MAP_SRC = `https://maps.google.com/maps?q=${NEW_ADDRESS_ENCODED}&amp;t=m&amp;z=14&amp;output=embed&amp;iwloc=near`;

// CLI arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run') || args.includes('-n');
const isVerbose = args.includes('--verbose') || args.includes('-v');

let targetDir = './zugimpex.com';
const targetIndex = args.indexOf('--target');
if (targetIndex !== -1 && args[targetIndex + 1]) {
  targetDir = args[targetIndex + 1];
}

console.log('='.repeat(70));
console.log('MALTA OFFICE DETAILS & MAP UPDATE SCRIPT');
console.log('='.repeat(70));
console.log(`Target directory : ${path.resolve(targetDir)}`);
console.log(`Mode             : ${isDryRun ? 'DRY RUN (no files will be written)' : 'LIVE (files will be updated)'}`);
console.log(`New Address      : ${NEW_ADDRESS}`);
console.log(`New Phone        : ${NEW_PHONE}`);
console.log(`New Tel Link     : tel:${NEW_TEL}`);
console.log(`New Map Src      : ${NEW_MAP_SRC}`);
console.log('='.repeat(70));

/**
 * Recursively find all HTML files in a directory, skipping backup/cache directories.
 */
function walk(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  for (const file of list) {
    if (file === '_keystone_backup' || file === 'color-backup-original' || file === 'logo-backup-original' || file === 'hts-cache') {
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
  addressUpdates: 0,
  phoneWidgetUpdates: 0,
  phoneSpanUpdates: 0,
  phoneMetaUpdates: 0,
  mapUpdates: 0,
  modifiedFiles: []
};

for (const filePath of htmlFiles) {
  const relPath = path.relative(targetDir, filePath);
  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;
  const fileChanges = [];

  // -------------------------------------------------------------
  // 1. ADDRESS REPLACEMENT
  // Replace old Malta address variations:
  // "152/7 Triq In-Naxxar, SGN 9030 San Gwann, Malta"
  // -------------------------------------------------------------
  const oldAddrRegex = /152\/7\s+Triq\s+In-Naxxar,\s*SGN\s*9030\s+San\s+Gwann,\s*Malta/gi;
  if (oldAddrRegex.test(content)) {
    const matches = content.match(oldAddrRegex);
    summary.addressUpdates += matches.length;
    fileChanges.push(`Address: ${matches.length} replacement(s)`);
    content = content.replace(oldAddrRegex, NEW_ADDRESS);
  }

  // -------------------------------------------------------------
  // 2 & 3. PHONE NUMBERS & TEL: CLICK-TO-CALL LINKS
  // A. Contact widgets across pages:
  //    <a href="tel:+41415623406">+41 41 562 34 06</a>
  // -------------------------------------------------------------
  const telAnchorRegex = /<a\s+([^>]*?)href=["']tel:\+?41415623406["']([^>]*?)>[\s\S]*?\+41\s*41\s*562\s*34\s*06[\s\S]*?<\/a>/gi;
  if (telAnchorRegex.test(content)) {
    const matches = content.match(telAnchorRegex);
    summary.phoneWidgetUpdates += matches.length;
    fileChanges.push(`Phone widget link: ${matches.length} replacement(s)`);
    content = content.replace(telAnchorRegex, `<a href="tel:${NEW_TEL}">${NEW_PHONE}</a>`);
  }

  // -------------------------------------------------------------
  // B. Contact pages office block phone span:
  //    Phone: <span class="phone-number">&nbsp;+41 41 562 34 06</span>
  //    Wrap in click-to-call link with new number.
  // -------------------------------------------------------------
  const phoneSpanRegex = /Phone:\s*<span\s+class=["']phone-number["']>(\s*(?:&nbsp;)?)\+41\s*41\s*562\s*34\s*06<\/span>/gi;
  if (phoneSpanRegex.test(content)) {
    const matches = content.match(phoneSpanRegex);
    summary.phoneSpanUpdates += matches.length;
    fileChanges.push(`Phone span click-to-call: ${matches.length} replacement(s)`);
    content = content.replace(phoneSpanRegex, `Phone: <span class="phone-number"><a href="tel:${NEW_TEL}">${NEW_PHONE}</a></span>`);
  }

  // -------------------------------------------------------------
  // C. Meta tags (og:description on contact pages):
  //    Phone: &nbsp;+41 41 562 34 06, Telefon: +41 41 562 34 06, Kontakt +41 41 562 34 06
  // -------------------------------------------------------------
  const phoneMetaRegex = /(Phone:\s*(?:&nbsp;|\s*)?|Telefon:\s*|Kontakt\s*)\+41\s*41\s*562\s*34\s*06/gi;
  if (phoneMetaRegex.test(content)) {
    const matches = content.match(phoneMetaRegex);
    summary.phoneMetaUpdates += matches.length;
    fileChanges.push(`Phone meta description: ${matches.length} replacement(s)`);
    content = content.replace(phoneMetaRegex, `$1${NEW_PHONE}`);
  }

  // -------------------------------------------------------------
  // 4. GOOGLE MAPS IFRAME FOR MALTA OFFICE
  // Match Malta office maps:
  // q=KEYSTONE%20assurance... or q=KEYSTONE&... (z=14 or z=12)
  // (Excluding Slovakia and Cham maps)
  // -------------------------------------------------------------
  const maltaIframeRegex = /<iframe([^>]*?)src=["']https:\/\/maps\.google\.com\/maps\?q=(?:KEYSTONE(?:%20assurance)?)(?:&amp;|&)t=m(?:&amp;|&)z=\d+([^"']*?)["']([^>]*?)>[\s\S]*?<\/iframe>/gi;
  if (maltaIframeRegex.test(content)) {
    const matches = content.match(maltaIframeRegex);
    summary.mapUpdates += matches.length;
    fileChanges.push(`Malta Google Map iframe: ${matches.length} replacement(s)`);
    content = content.replace(maltaIframeRegex, () => {
      return `<iframe loading="lazy"
					src="${NEW_MAP_SRC}"
					title="${NEW_ADDRESS}"
					aria-label="${NEW_ADDRESS}"
			></iframe>`;
    });
  }

  // If content changed, save file (unless dry run)
  if (content !== originalContent) {
    summary.modified++;
    summary.modifiedFiles.push({ file: relPath, changes: fileChanges });

    if (!isDryRun) {
      fs.writeFileSync(filePath, content, 'utf8');
    }

    if (isVerbose) {
      console.log(`[MODIFIED] ${relPath}: ${fileChanges.join(', ')}`);
    }
  }
}

console.log('='.repeat(70));
console.log('EXECUTION SUMMARY');
console.log('='.repeat(70));
console.log(`HTML files scanned             : ${summary.scanned}`);
console.log(`HTML files modified            : ${summary.modified}`);
console.log(`Address replacements           : ${summary.addressUpdates}`);
console.log(`Phone widget link replacements : ${summary.phoneWidgetUpdates}`);
console.log(`Phone span replacements        : ${summary.phoneSpanUpdates}`);
console.log(`Phone meta text replacements   : ${summary.phoneMetaUpdates}`);
console.log(`Malta Google Maps replacements : ${summary.mapUpdates}`);
console.log('='.repeat(70));

if (!isVerbose) {
  console.log('\nModified files:');
  summary.modifiedFiles.forEach(f => {
    console.log(`  - ${f.file} (${f.changes.join(', ')})`);
  });
}

if (isDryRun) {
  console.log('\nNOTE: This was a dry run. Run without --dry-run to apply changes.');
} else {
  console.log('\nAll changes have been successfully written to disk.');
}
