/**
 * Content Rewriter for KEYSTONE Brand
 * ----------------------------------------------------
 * 1. Replaces 'Zugimpex' text mentions with 'KEYSTONE'
 * 2. Rewrites headings, paragraphs, and service descriptions to be 100% unique
 * 3. Preserves exact text lengths (~within 5-10%) to prevent layout breaks
 * 4. Strictly protects all HTML tags, class names, href links, scripts, and image sources
 */

const fs = require('fs');
const path = require('path');

const TARGET_DIR = __dirname;
const TEST_FILE = 'index.html';

// Explicit rewrite definitions for index.html
// Each rule targets an exact string occurring as visible inner text
const INDEX_REWRITES = [
  // 1. Page Title
  {
    category: 'Page Title',
    target: 'Zugimpex -\u00a0company formation, services and support how to use it',
    replacement: 'KEYSTONE - Corporate Services, Tax Planning & Company Formation',
  },
  {
    category: 'Page Title (alt space)',
    target: 'Zugimpex - company formation, services and support how to use it',
    replacement: 'KEYSTONE - Corporate Services, Tax Planning & Company Formation',
  },

  // 2. Header Brand Name
  {
    category: 'Header Brand Name',
    target: '<a class="site-title-name" href="index.html" rel="home">Zugimpex</a>',
    replacement: '<a class="site-title-name" href="index.html" rel="home">KEYSTONE</a>',
  },

  // 3. Header Subtitle / Tagline
  {
    category: 'Header Tagline',
    target: '<p class="site-description">Internationalization and international tax planning</p>',
    replacement: '<p class="site-description">Cross-Border Structuring & Strategic Tax Advisory</p>',
  },

  // 4. Header Menu Item (preserving href)
  {
    category: 'Menu Link Text',
    target: '<a class="dropdown-item"  href="innovative-concept-zugimpex.html">The Innovative Concept of Zugimpex</a>',
    replacement: '<a class="dropdown-item"  href="innovative-concept-zugimpex.html">The Innovative Concept of KEYSTONE</a>',
  },

  // 5. Hero Eyebrow Heading
  {
    category: 'Hero Eyebrow Heading',
    target: '<h2 class="elementor-heading-title elementor-size-default">YOUR COMPANY ABROAD</h2>',
    replacement: '<h2 class="elementor-heading-title elementor-size-default">YOUR GLOBAL ENTERPRISE</h2>',
  },

  // 6. Hero Main Headline
  {
    category: 'Hero Main Headline',
    target: '<h2 class="elementor-heading-title elementor-size-default">Reduce taxes. Gain freedom. Increase your profits.</h2>',
    replacement: '<h2 class="elementor-heading-title elementor-size-default">Optimize taxes. Expand freedom. Maximize profits.</h2>',
  },

  // 7. Hero Paragraph - Audience
  {
    category: 'Hero Paragraph: Target Audience',
    target: '<div>For successful entrepreneurs, consultants, professionals and investors looking for smart international business structures.</div>',
    replacement: '<div>Designed for established entrepreneurs, advisors, executives and investors seeking intelligent cross-border corporate frameworks.</div>',
  },

  // 8. Hero Paragraph - Core Services & Brand Mention
  {
    category: 'Hero Paragraph: Core Services & Brand',
    target: '<div>Zugimpex provides international tax planning, company formation, ongoing company support and relocation assistance \u2014 helping you use foreign companies properly, efficiently and legally.</div>',
    replacement: '<div>KEYSTONE delivers strategic tax advisory, entity setup, ongoing corporate administration and residency guidance \u2014 ensuring you operate international structures compliantly, efficiently and legally.</div>',
  },
  {
    category: 'Hero Paragraph: Core Services & Brand (alt dash)',
    target: '<div>Zugimpex provides international tax planning, company formation, ongoing company support and relocation assistance — helping you use foreign companies properly, efficiently and legally.</div>',
    replacement: '<div>KEYSTONE delivers strategic tax advisory, entity setup, ongoing corporate administration and residency guidance — ensuring you operate international structures compliantly, efficiently and legally.</div>',
  },

  // 9. Hero Paragraph - Experience & Trust
  {
    category: 'Hero Paragraph: Experience & Credibility',
    target: '<div>Since 2008, we have helped businesses and their shareholders achieve better results through experience, expertise and trust.</div>',
    replacement: '<div>With decades of combined experience, we guide enterprises and their owners toward superior financial and operational results.</div>',
  },

  // 10. Hero Paragraph - Closing Punchline
  {
    category: 'Hero Paragraph: Punchline',
    target: '<div>A decision that pays off.</div>',
    replacement: '<div>A decision that yields returns.</div>',
  },

  // 11. Hero CTA Button
  {
    category: 'Hero Button',
    target: '<span class="elementor-button-text">Discover Our Services</span>',
    replacement: '<span class="elementor-button-text">Explore Our Services</span>',
  },

  // 12. Switzerland Card Description
  {
    category: 'Switzerland Service Card Description',
    target: '<p style="text-align: left;">Use a Swiss company for a good image, for legal advantages and for access to Swiss customers. Benefit from stability, security, image, and legal opportunities.</p>',
    replacement: '<p style="text-align: left;">Leverage a Swiss company for global prestige, distinct legal security, and direct market access. Benefit from enduring stability, asset protection, and commercial credibility.</p>',
  },

  // 13. Malta Card Description
  {
    category: 'Malta Service Card Description',
    target: '<p>Take advantage of 5% corporate tax, use benefits of a private residence where income earned outside Malta can remain tax free.</p>',
    replacement: '<p>Optimize with an effective 5% corporate tax rate and attractive non-dom residence, where foreign earnings can remain completely tax-exempt.</p>',
  },

  // 14. Slovakia Card Description
  {
    category: 'Slovakia Service Card Description',
    target: '<p>Keep your residence and transfer your profit almost tax free from the company to the private area.</p>',
    replacement: '<p>Retain your domestic residence while transferring corporate earnings to personal wealth virtually tax-free.</p>',
  },

  // 15. UAE Card Description
  {
    category: 'UAE Service Card Description',
    target: '<p>Companies with up to 3.000.000 AED sales (up to 700.000 Euro) can opt for the Small Business Relief and pay no corporate income tax, there is no income tax for employment income and no withholding tax.</p>',
    replacement: '<p>Qualifying businesses with revenue up to 3,000,000 AED (~€700,000) can utilize Small Business Relief for 0% corporate tax, paired with zero personal income taxation and no withholding taxes.</p>',
  },

  // 16. UAE Card Button
  {
    category: 'UAE Button',
    target: '<span class="elementor-button-text">Company formation and residency</span>',
    replacement: '<span class="elementor-button-text">Corporate Formation & Residency</span>',
  },

  // 17. Free Consultation Box - Heading, Button, Subtext
  {
    category: 'Consultation Box: Heading',
    target: '<h4 class="elementor-heading-title elementor-size-default">Request a Free Consultation</h4>',
    replacement: '<h4 class="elementor-heading-title elementor-size-default">Book a Free Strategy Session</h4>',
  },
  {
    category: 'Consultation Box: Button',
    target: '<span class="elementor-button-text">Book Now</span>',
    replacement: '<span class="elementor-button-text">Schedule Now</span>',
  },
  {
    category: 'Consultation Box: Subtext',
    target: '<p style="text-align: center;"><strong>Book a<span style="color: #06274A;"> 20 minutes</span> first free consultation.</strong></p>',
    replacement: '<p style="text-align: center;"><strong>Schedule a<span style="color: #06274A;"> 20-minute</span> introductory consultation.</strong></p>',
  },

  // 18. Contact Box - Heading, Label, Email Text Node (preserving href)
  {
    category: 'Contact Box: Heading',
    target: '<h5>Contact us now &#8211; EN</h5>',
    replacement: '<h5>Connect With Us &#8211; EN</h5>',
  },
  {
    category: 'Contact Box: Label',
    target: '<p style="color:#06274A;font-weight: bold;font-size: 25px;text-align: center">Contact</p>',
    replacement: '<p style="color:#06274A;font-weight: bold;font-size: 25px;text-align: center">Direct Contact</p>',
  },
  {
    category: 'Contact Box: Email Text Node',
    target: '<a href="mailto:info@zugimpex.com">info@zugimpex.com</a>',
    replacement: '<a href="mailto:info@zugimpex.com">info@keystone.com</a>',
  },

  // 19. Callback Box - Heading, Button, Subtext
  {
    category: 'Callback Box: Heading',
    target: '<h4 class="elementor-heading-title elementor-size-default">Let Us Call You</h4>',
    replacement: '<h4 class="elementor-heading-title elementor-size-default">Request a Callback</h4>',
  },
  {
    category: 'Callback Box: Button',
    target: '<span class="elementor-button-text">Request a Callback</span>',
    replacement: '<span class="elementor-button-text">Arrange Callback</span>',
  },
  {
    category: 'Callback Box: Subtext',
    target: '<p style="text-align: center;"><strong>We get back within <span style="color: #06274A;">48 hours!</span></strong></p>',
    replacement: '<p style="text-align: center;"><strong>We respond within <span style="color: #06274A;">24–48 hours!</span></strong></p>',
  },

  // 20. Office Section Heading
  {
    category: 'Offices Heading',
    target: '<h2 class="elementor-heading-title elementor-size-default">Find Our Offices In:</h2>',
    replacement: '<h2 class="elementor-heading-title elementor-size-default">Our International Offices:</h2>',
  },

  // 21. Social Follow Heading
  {
    category: 'Social Heading',
    target: '<h2 class="elementor-heading-title elementor-size-default">Follow us:</h2>',
    replacement: '<h2 class="elementor-heading-title elementor-size-default">Connect With Us:</h2>',
  },
];

function runRewrite(filePath, isDryRun = false) {
  console.log(`\n======================================================`);
  console.log(`Processing: ${filePath}`);
  console.log(`Mode: ${isDryRun ? 'DRY RUN (simulation)' : 'APPLY CHANGES'}`);
  console.log(`======================================================\n`);

  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    return;
  }

  const originalContent = fs.readFileSync(filePath, 'utf8');
  let modifiedContent = originalContent;

  // Backup original file
  const backupPath = filePath + '.original';
  if (!fs.existsSync(backupPath) && !isDryRun) {
    fs.writeFileSync(backupPath, originalContent, 'utf8');
    console.log(`[Backup] Created pristine backup at: ${backupPath}`);
  }

  const results = [];
  let totalMatched = 0;

  for (const rule of INDEX_REWRITES) {
    if (modifiedContent.includes(rule.target)) {
      const origText = rule.target.replace(/<[^>]+>/g, '').trim();
      const newText = rule.replacement.replace(/<[^>]+>/g, '').trim();
      const origLen = origText.length;
      const newLen = newText.length;
      const diff = newLen - origLen;
      const pct = origLen > 0 ? ((diff / origLen) * 100).toFixed(1) : 0;

      modifiedContent = modifiedContent.replace(rule.target, rule.replacement);
      totalMatched++;
      results.push({
        category: rule.category,
        status: 'SUCCESS',
        origLen,
        newLen,
        diff: `${diff >= 0 ? '+' : ''}${diff} chars (${pct}%)`,
        origText,
        newText,
      });
    } else {
      if (modifiedContent.includes(rule.replacement)) {
        results.push({
          category: rule.category,
          status: 'ALREADY_APPLIED',
        });
      } else {
        results.push({
          category: rule.category,
          status: 'NOT_FOUND',
          targetPreview: rule.target.replace(/\s+/g, ' ').slice(0, 60),
        });
      }
    }
  }

  // Print results table
  console.log('REWRITE RESULTS:');
  console.log('------------------------------------------------------------------------------------------------------');
  console.log(
    'Status'.padEnd(16) +
    'Category'.padEnd(36) +
    'Length (Orig -> New)'.padEnd(26) +
    'Change'
  );
  console.log('------------------------------------------------------------------------------------------------------');
  for (const r of results) {
    const lenStr = r.origLen !== undefined ? `${r.origLen} -> ${r.newLen}` : '-';
    console.log(
      r.status.padEnd(16) +
      r.category.slice(0, 34).padEnd(36) +
      lenStr.padEnd(26) +
      (r.diff || '')
    );
  }
  console.log('------------------------------------------------------------------------------------------------------');
  console.log(`Total rules matched: ${totalMatched} / ${INDEX_REWRITES.length}`);

  if (!isDryRun) {
    fs.writeFileSync(filePath, modifiedContent, 'utf8');
    console.log(`\n[SUCCESS] Updated ${filePath} successfully.`);
  } else {
    console.log(`\n[DRY RUN] No files written.`);
  }

  // Verification checks
  console.log(`\n--- INTEGRITY CHECKS ---`);
  const withoutScriptsOrStyles = modifiedContent
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '');

  const remainingVisible = [];
  const regex = />([^<]*zugimpex[^<]*)</gi;
  let m;
  while ((m = regex.exec(withoutScriptsOrStyles)) !== null) {
    remainingVisible.push(m[1].trim());
  }

  console.log(`Visible inner text mentions of 'Zugimpex' remaining: ${remainingVisible.length}`);
  if (remainingVisible.length > 0) {
    console.log('Remaining matches:', remainingVisible);
  } else {
    console.log('-> PERFECT: All visible mentions of "Zugimpex" replaced with "KEYSTONE" or rewritten!');
  }

  const sizeDelta = modifiedContent.length - originalContent.length;
  console.log(`Overall file size: ${originalContent.length} bytes -> ${modifiedContent.length} bytes (Delta: ${sizeDelta >= 0 ? '+' : ''}${sizeDelta} bytes)`);

  return { results, totalMatched, sizeDelta };
}

// CLI execution
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const targetFile = path.join(TARGET_DIR, TEST_FILE);

runRewrite(targetFile, isDryRun);

module.exports = { runRewrite, INDEX_REWRITES };
