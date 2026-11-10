const fs = require('fs');
const path = require('path');

function updateContent(content) {
  let original = content;

  // 1. Update keystone-brand-overrides CSS
  const oldLogoImgRule = `.navbar .header-logo img,
.navbar .header-logo img.custom-logo,
.navbar .header-logo .custom-logo img,
.navbar-brand img {
  display: block !important;
  height: 55px !important;
  max-height: 58px !important;
  width: auto !important;
  max-width: 250px !important;
  vertical-align: middle !important;
  margin: 0 !important;
  flex-shrink: 0 !important;
  object-fit: contain !important;
}`;

  const newLogoImgRule = `.navbar .header-logo img,
.navbar .header-logo img.custom-logo,
.navbar .header-logo .custom-logo img,
.navbar-brand img,
img.custom-logo {
  display: block !important;
  height: 75px !important;
  max-height: 80px !important;
  width: auto !important;
  max-width: 250px !important;
  vertical-align: middle !important;
  margin: 0 !important;
  flex-shrink: 0 !important;
  object-fit: contain !important;
}`;

  content = content.replace(oldLogoImgRule, newLogoImgRule);

  // Replace max-width: 576px query
  const oldMobileRule = `@media (max-width: 576px) {
  .navbar .header-logo img,
  .navbar .header-logo img.custom-logo,
  .navbar .header-logo .custom-logo img,
  .navbar-brand img {
    height: 46px !important;
    max-height: 48px !important;
  }
}`;

  const newMobileRule = `@media (max-width: 576px) {
  .navbar .header-logo img,
  .navbar .header-logo img.custom-logo,
  .navbar .header-logo .custom-logo img,
  .navbar-brand img,
  img.custom-logo {
    height: 52px !important;
    max-height: 55px !important;
    max-width: 170px !important;
  }
}`;

  content = content.replace(oldMobileRule, newMobileRule);

  // Update compact 992-1199px media query to include logo sizing
  const oldCompact = `/* === Compact header for 992px-1199px === */
@media (min-width: 992px) and (max-width: 1199px) {
  .navbar.navbar-expand-lg > .container,
  .navbar.custom > .container {
    gap: 0.5rem !important;
  }
  #navbarNavDropdown ul.nav.navbar-nav > li {
    margin-right: 3px !important;
  }
  #navbarNavDropdown ul.nav.navbar-nav > li > a.nav-link {
    padding: 5px 5px !important;
    font-size: 12.5px !important;
  }
}`;

  const newCompact = `/* === Compact header for 992px-1199px === */
@media (min-width: 992px) and (max-width: 1199px) {
  .navbar.navbar-expand-lg > .container,
  .navbar.custom > .container {
    gap: 0.5rem !important;
  }
  .navbar .header-logo img,
  .navbar .header-logo img.custom-logo,
  .navbar .header-logo .custom-logo img,
  .navbar-brand img,
  img.custom-logo {
    height: 68px !important;
    max-height: 70px !important;
    max-width: 220px !important;
  }
  #navbarNavDropdown ul.nav.navbar-nav > li {
    margin-right: 3px !important;
  }
  #navbarNavDropdown ul.nav.navbar-nav > li > a.nav-link {
    padding: 5px 5px !important;
    font-size: 12.5px !important;
  }
}`;

  content = content.replace(oldCompact, newCompact);

  // Update max-width: 991px media query to include logo sizing
  const oldTablet = `@media (max-width: 991px) {
  .navbar.navbar-expand-lg > .container,
  .navbar.custom > .container {
    display: flex !important;
    align-items: center !important;
    justify-content: space-between !important;
    flex-wrap: wrap !important;
  }`;

  const newTablet = `@media (max-width: 991px) {
  .navbar.navbar-expand-lg > .container,
  .navbar.custom > .container {
    display: flex !important;
    align-items: center !important;
    justify-content: space-between !important;
    flex-wrap: wrap !important;
  }
  .navbar .header-logo img,
  .navbar .header-logo img.custom-logo,
  .navbar .header-logo .custom-logo img,
  .navbar-brand img,
  img.custom-logo {
    height: 62px !important;
    max-height: 65px !important;
    max-width: 200px !important;
  }`;

  content = content.replace(oldTablet, newTablet);

  // 2. Update HTML markup in header-logo
  // Add style="flex-shrink: 0;" to <div class="header-logo">
  content = content.replace(
    /<div class="header-logo">/g,
    '<div class="header-logo" style="flex-shrink: 0;">'
  );

  // Add style="flex-shrink: 0;" to <a ... class="navbar-brand custom-logo" ...>
  content = content.replace(
    /(<a\s+[^>]*class="navbar-brand custom-logo"[^>]*)>/g,
    (m, p1) => {
      if (p1.includes('style=')) return m;
      return p1 + ' style="flex-shrink: 0;">';
    }
  );

  // Add style="flex-shrink: 0;" to <img ... class="custom-logo" alt="KEYSTONE" ...>
  // Insert style="flex-shrink: 0;" inside the img tag
  content = content.replace(
    /(<img\s+)(fetchpriority="high"[^>]*class="custom-logo"[^>]*alt="KEYSTONE"[^>]*>)/g,
    (m, p1, p2) => {
      if (p2.includes('style=')) return m;
      return p1 + 'style="flex-shrink: 0;" ' + p2;
    }
  );

  return { changed: content !== original, content };
}

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

console.log('Applying updates to', files.length, 'files...');
let updatedCount = 0;

files.forEach(f => {
  const c = fs.readFileSync(f, 'utf8');
  const res = updateContent(c);
  if (res.changed) {
    fs.writeFileSync(f, res.content, 'utf8');
    updatedCount++;
  }
});

console.log(`Successfully updated ${updatedCount} / ${files.length} files.`);
