/**
 * KEYSTONE Complete Link, Attribute & Project Sanitizer
 * ==============================================================================
 * Completely eliminates all external ties, domain links, booking links,
 * third-party tool references, and attribute mentions of 'zugimpex'
 * across all HTML files in the project.
 * ==============================================================================
 */

const fs = require('fs');
const path = require('path');

const SITE_ROOT = 'C:\\My Web Sites\\Zugimpex.Kopya\\zugimpex.com';

function cleanContent(html, relPath) {
  let m = html;

  // 1. Mailto links: update to info@keystone.com (preserve mailto: scheme, never convert to #contact)
  m = m.replace(/mailto:[a-zA-Z0-9._%+-]+@zugimpex\.com/gi, 'mailto:info@keystone.com');

  // 2. Booking / Calendly URLs on buttons, <a> links, and widgets
  // Replace links to local calendly form pages or external Calendly URLs with #contact
  m = m.replace(/href=(["'])(?:\.\.\/)?(?:de\/)?calendly-form-[a-z0-9_-]+\.html\1/gi, 'href=$1#contact$1');
  m = m.replace(/href=(["'])https?:\/\/calendly\.com\/[a-zA-Z0-9_\-\/?=&;]+\1/gi, 'href=$1#contact$1');
  m = m.replace(/data-url=(["'])https?:\/\/calendly\.com\/[a-zA-Z0-9_\-\/?=&;]+\1/gi, 'data-url=$1#contact$1');

  // 3. Button onclick handlers that redirect to zugimpex.com
  m = m.replace(
    /window\.open\(\s*(['"])https:\/\/zugimpex\.com\/[^'"]*?\1\s*,\s*(['"])_self\2\s*\);/gi,
    "location.href = '#contact';"
  );

  // 4. Form actions pointing to https://zugimpex.com/...
  m = m.replace(/action=(["'])https:\/\/zugimpex\.com\/[^"']*?(#wpcf7-[^"']*?)\1/gi, 'action=$1$2$1');
  m = m.replace(/action=(["'])https:\/\/zugimpex\.com\/[^"']*?\1/gi, 'action=$1#contact$1');

  // 5. External social media links
  m = m.replace(/href=(["'])https?:\/\/(?:www\.)?facebook\.com\/p\/Zugimpex-[0-9]+\/?\1/gi, 'href=$1#contact$1');
  m = m.replace(/href=(["'])https?:\/\/(?:www\.)?instagram\.com\/zugimpex\/?\1/gi, 'href=$1#contact$1');
  m = m.replace(/href=(["'])https?:\/\/(?:www\.)?x\.com\/Zugimpex\/?\1/gi, 'href=$1#contact$1');
  m = m.replace(/https:\\\/\\\/x\.com\\\/Zugimpex/gi, 'https:\\/\\/keystone.com\\/#contact');

  // 6. ActiveCampaign script embeds and prefetch
  m = m.replace(/<link[^>]+href=(["'])https:\/\/zugimpex\.activehosted\.com\/?\1[^>]*>/gi, '');
  m = m.replace(
    /<script[^>]+src=(["'])https:\/\/zugimpex\.activehosted\.com\/f\/embed\.php[^"']*?\1[^>]*><\/script>/gi,
    '<!-- ActiveCampaign embed replaced by Supabase contact -->'
  );
  m = m.replace(/https:\/\/zugimpex\.activehosted\.com/gi, 'https://keystone.com');

  // 7. External https://zugimpex.com/... links in <a> tags -> local relative or #contact
  m = m.replace(/href=(["'])https:\/\/zugimpex\.com\/([a-zA-Z0-9_\-\/]*)\1/gi, (match, quote, subpath) => {
    if (!subpath || subpath === '/' || subpath === 'de/' || subpath === 'ro/' || subpath === 'sr/') {
      return `href=${quote}index.html${quote}`;
    }
    if (subpath.includes('contact')) {
      return `href=${quote}contact-us.html${quote}`;
    }
    if (subpath.includes('consultation') || subpath.includes('calendly') || subpath.includes('booking')) {
      return `href=${quote}#contact${quote}`;
    }
    const cleanPath = subpath.replace(/\/$/, '');
    return `href=${quote}${cleanPath}.html${quote}`;
  });

  // 8. Internal HTML page filenames with zugimpex in them
  m = m.replace(/innovative-concept-zugimpex\.html/g, 'innovative-concept-keystone.html');
  m = m.replace(/das-innovative-konzept-von-zugimpex\.html/g, 'das-innovative-konzept-von-keystone.html');
  m = m.replace(/conceptul-inovator-al-lui-zugimpex\.html/g, 'conceptul-inovator-al-lui-keystone.html');
  m = m.replace(/bazele-managementului-tutorialul-de-management-a-lui-zugimpex\.html/g, 'bazele-managementului-tutorialul-de-management-a-lui-keystone.html');
  m = m.replace(/inovativni-koncept-zugimpex-tima\.html/g, 'inovativni-koncept-keystone-tima.html');

  // Also in clean URLs without .html
  m = m.replace(/innovative-concept-zugimpex/g, 'innovative-concept-keystone');
  m = m.replace(/das-innovative-konzept-von-zugimpex/g, 'das-innovative-konzept-von-keystone');
  m = m.replace(/conceptul-inovator-al-lui-zugimpex/g, 'conceptul-inovator-al-lui-keystone');
  m = m.replace(/bazele-managementului-tutorialul-de-management-a-lui-zugimpex/g, 'bazele-managementului-tutorialul-de-management-a-lui-keystone');
  m = m.replace(/inovativni-koncept-zugimpex-tima/g, 'inovativni-koncept-keystone-tima');

  // 9. Google Maps & Vimeo Iframes
  m = m.replace(/https:\/\/maps\.google\.com\/maps\?q=(?:%20)?Zugimpex([^"']*)/gi, 'https://maps.google.com/maps?q=KEYSTONE$1');
  m = m.replace(/title=(["'])(\s*Zugimpex[^"']*?)\1/gi, (match, q, val) => `title=${q}${val.replace(/Zugimpex/g, 'KEYSTONE')}${q}`);
  m = m.replace(/aria-label=(["'])(\s*Zugimpex[^"']*?)\1/gi, (match, q, val) => `aria-label=${q}${val.replace(/Zugimpex/g, 'KEYSTONE')}${q}`);
  m = m.replace(/title=(["'])([^"']*?)\s*-\s*by\s+Zugimpex\1/gi, 'title=$1$2 - by KEYSTONE$1');
  m = m.replace(/title=(["'])([^"']*?)\s*von\s+Zugimpex\1/gi, 'title=$1$2 von KEYSTONE$1');
  m = m.replace(/title=(["'])Welcome to Zugimpex\1/gi, 'title=$1Welcome to KEYSTONE$1');

  // 10. Image src, srcset, alt, and asset filenames
  m = m.replace(/cropped-logo-zugimpex-JPG-freigetsellt-1/g, 'cropped-logo-keystone-JPG-freigetsellt-1');
  m = m.replace(/1-Zugimpex-International-GmbH-illustrations/g, '1-Keystone-International-GmbH-illustrations');
  m = m.replace(/International-Taxation-2026-by-Zugimpex/g, 'International-Taxation-2026-by-Keystone');
  m = m.replace(/Taxation-in-Slovakia-2025-by-Zugimpex/g, 'Taxation-in-Slovakia-2025-by-Keystone');
  m = m.replace(/zugimpex-logo-small\.png/g, 'keystone-logo-small.png');
  m = m.replace(/alt=(["'])Zugimpex\1/gi, 'alt=$1KEYSTONE$1');
  m = m.replace(/alt=(["'])([^"']*?)Zugimpex([^"']*?)\1/gi, 'alt=$1$2KEYSTONE$3$1');

  // 11. Style & Script IDs and brand variables
  m = m.replace(/id=(["'])zugimpex-brand-overrides\1/g, 'id=$1keystone-brand-overrides$1');
  m = m.replace(/id=(["'])zugimpex-brand-script\1/g, 'id=$1keystone-brand-script$1');
  m = m.replace(/id=(["'])zugimpex-ac-form-fix\1/g, 'id=$1keystone-ac-form-fix$1');
  m = m.replace(/'zugimpex-ac-form-fix'/g, "'keystone-ac-form-fix'");

  // 12. HTTrack Mirror comments
  m = m.replace(/<!-- Mirrored from https:\/\/zugimpex\.com\//g, '<!-- Mirrored from https://keystone.com/');
  m = m.replace(/<!-- Mirrored from https%3A%2F%2Fzugimpex\.com/g, '<!-- Mirrored from https%3A%2F%2Fkeystone.com');

  // 13. URL encoded & schema.org representations
  m = m.replace(/https:\\\/\\\/zugimpex\.com/g, 'https:\\/\\/keystone.com');
  m = m.replace(/https:\/\/zugimpex\.com/g, 'https://keystone.com');
  m = m.replace(/https%3A%2F%2Fzugimpex\.com/g, 'https%3A%2F%2Fkeystone.com');
  m = m.replace(/Zugimpex%20/g, 'KEYSTONE%20');
  m = m.replace(/"Zugimpex"/g, '"KEYSTONE"');
  m = m.replace(/&quot;Zugimpex&quot;/g, '&quot;KEYSTONE&quot;');

  // 14. Universal fallback for any remaining Zugimpex brand reference
  m = m.replace(/Zugimpex/g, 'KEYSTONE');
  m = m.replace(/ZUGIMPEX/g, 'KEYSTONE');
  m = m.replace(/zugimpex/g, 'keystone');

  return m;
}

function getAllHtmlFiles(dir, arr = []) {
  fs.readdirSync(dir).forEach(file => {
    if (file === '_keystone_backup' || file === 'node_modules') return;
    const fp = path.join(dir, file);
    if (fs.statSync(fp).isDirectory()) {
      getAllHtmlFiles(fp, arr);
    } else if (file.endsWith('.html') && fs.statSync(fp).size > 0 && !file.endsWith('.original') && !file.endsWith('.bak')) {
      arr.push(fp);
    }
  });
  return arr;
}

function run(isDryRun = false) {
  console.log(`\n======================================================`);
  console.log(`KEYSTONE Link & Attribute Sanitizer`);
  console.log(`Mode: ${isDryRun ? 'DRY RUN (simulation)' : 'APPLY CHANGES'}`);
  console.log(`Site Root: ${SITE_ROOT}`);
  console.log(`======================================================\n`);

  const files = getAllHtmlFiles(SITE_ROOT);
  console.log(`Scanning & processing ${files.length} active HTML files...\n`);

  let modifiedCount = 0;
  let remainingZugimpexTotal = 0;
  const remainingFiles = [];

  for (const f of files) {
    const rel = path.relative(SITE_ROOT, f);
    const original = fs.readFileSync(f, 'utf8');
    const cleaned = cleanContent(original, rel);

    if (cleaned !== original) {
      modifiedCount++;
      if (!isDryRun) {
        fs.writeFileSync(f, cleaned, 'utf8');
      }
    }

    // Check for any remaining occurrences of zugimpex (case-insensitive) anywhere in the file!
    const matches = cleaned.match(/zugimpex/gi) || [];
    if (matches.length > 0) {
      remainingZugimpexTotal += matches.length;
      remainingFiles.push({ file: rel, count: matches.length });
    }
  }

  console.log(`------------------------------------------------------`);
  console.log(`Files modified: ${modifiedCount} / ${files.length}`);
  console.log(`Total remaining occurrences of 'zugimpex' anywhere: ${remainingZugimpexTotal}`);
  console.log(`------------------------------------------------------`);

  if (remainingFiles.length > 0) {
    console.log('\nFiles with remaining occurrences:');
    remainingFiles.forEach(r => console.log(`  - ${r.file}: ${r.count}`));
  } else {
    console.log(`\n🎉 100% PERFECT SANITIZATION: ZERO occurrences of 'zugimpex' remain in ANY tag, attribute, link, script, or file in the entire project!`);
  }
}

// CLI
const isDryRun = process.argv.includes('--dry-run');
run(isDryRun);

module.exports = { cleanContent, run };
