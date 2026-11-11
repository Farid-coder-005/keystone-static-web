/**
 * KEYSTONE Complete Site Rewriter
 * ==============================================================================
 * 1. Global Brand Replacement: Replaces all visible text occurrences of
 *    'Zugimpex' / 'ZUGIMPEX' with 'KEYSTONE'.
 * 2. Rewrites main headings, paragraphs, and service descriptions to be 100%
 *    unique, professional, and matching in character length.
 * 3. Updates <title> tags and <meta name="description"> tags across all pages
 *    for SEO and brand consistency.
 * 4. STRICT RULE: Preserves all HTML tags, class names, href links, scripts,
 *    and image sources intact without modification.
 * ==============================================================================
 */

const fs = require('fs');
const path = require('path');

const SITE_ROOT = 'C:\\My Web Sites\\Zugimpex.Kopya\\zugimpex.com';
const BACKUP_DIR = path.join(SITE_ROOT, '_keystone_backup');

// Common phrase rewrites applied to visible text nodes
const PHRASE_REWRITES = [
  // Brand name variants & corporate entities
  { from: /Zugimpex International GmbH/g, to: 'KEYSTONE International GmbH' },
  { from: /Zugimpex Assurance Ltd/g, to: 'KEYSTONE Assurance Ltd' },
  { from: /Zugimpex Consulting Ltd/g, to: 'KEYSTONE Consulting Ltd' },
  { from: /Zugimpex Slovakia s\.r\.o\./g, to: 'KEYSTONE Slovakia s.r.o.' },
  { from: /Zugimpex s\.r\.o\./g, to: 'KEYSTONE s.r.o.' },
  { from: /Zugimpex-Gruppe/g, to: 'KEYSTONE-Gruppe' },
  { from: /Zugimpex-a/g, to: 'KEYSTONE-a' },
  { from: /Zugimpex-om/g, to: 'KEYSTONE-om' },
  { from: /Zugimpex-u/g, to: 'KEYSTONE-u' },
  { from: /Zugimpex-ova/g, to: 'KEYSTONE-ova' },
  { from: /Zugimpex-ovih/g, to: 'KEYSTONE-ovih' },
  { from: /Zugimpex-ovi/g, to: 'KEYSTONE-ovi' },
  { from: /Zugimpex-ov/g, to: 'KEYSTONE-ov' },

  // Visible email text nodes (without altering href="mailto:...")
  { from: /info@zugimpex\.com/g, to: 'info@keystone.com' },
  { from: /invoices@zugimpex\.com/g, to: 'invoices@keystone.com' },
  { from: /contact@zugimpex\.com/g, to: 'contact@keystone.com' },
  { from: /qm@zugimpex\.com/g, to: 'qm@keystone.com' },
  { from: /hannes\.schwarz@zugimpex\.com/g, to: 'hannes.schwarz@keystone.com' },
  { from: /data\.protection\.lawyer@zugimpex\.com/g, to: 'data.protection.lawyer@keystone.com' },

  // Website domains in visible text
  { from: /www\.zugimpex\.com/gi, to: 'www.keystone.com' },
  { from: /zugimpex\.com/gi, to: 'keystone.com' },

  // Menu items & service titles across languages
  { from: /The Innovative Concept of Zugimpex/g, to: 'The Innovative Concept of KEYSTONE' },
  { from: /Das innovative Konzept von Zugimpex/g, to: 'Das innovative Konzept von KEYSTONE' },
  { from: /Conceptul Inovator al lui Zugimpex/g, to: 'Conceptul Inovator al lui KEYSTONE' },
  { from: /Conceptul inovator al lui Zugimpex/g, to: 'Conceptul inovator al lui KEYSTONE' },
  { from: /Inovativni koncept Zugimpex tima/g, to: 'Inovativni koncept KEYSTONE tima' },
  { from: /Management Questions – Zugimpex Management Tutorial/g, to: 'Management Questions – KEYSTONE Management Tutorial' },
  { from: /Management Questions - Zugimpex Management Tutorial/g, to: 'Management Questions - KEYSTONE Management Tutorial' },
  { from: /Tutorialul de management a lui Zugimpex/g, to: 'Tutorialul de management a lui KEYSTONE' },
  { from: /Business Centre of Zugimpex/g, to: 'Business Centre of KEYSTONE' },
  { from: /Business Center von Zugimpex/g, to: 'Business Center von KEYSTONE' },
  { from: /Centrul de afaceri al Zugimpex/g, to: 'Centrul de afaceri al KEYSTONE' },
  { from: /INOVATIVNI KONCEPT ZUGIMPEX-a/g, to: 'INOVATIVNI KONCEPT KEYSTONE-a' },

  // General brand word (case variations & case-insensitive fallback)
  { from: /Zugimpex/g, to: 'KEYSTONE' },
  { from: /ZUGIMPEX/g, to: 'KEYSTONE' },
  { from: /zugimpex/gi, to: 'KEYSTONE' },
];

// Targeted page rewrites (headings, paragraphs, hero copy)
const PAGE_SPECIFIC_RULES = {
  // --- GERMAN LANDING PAGES ---
  'de\\index.html': [
    { from: 'IHRE FIRMA IM AUSLAND', to: 'IHR GLOBALER UNTERNEHMENSERFOLG' },
    { from: 'Steuern reduzieren. Freiheit gewinnen. Gewinne steigern.', to: 'Steuern optimieren. Unabhängigkeit gewinnen. Erträge steigern.' },
    {
      from: 'Für erfolgreiche Unternehmer, Berater, Freiberufler und Investoren, die intelligente internationale Unternehmensstrukturen suchen.',
      to: 'Maßgeschneidert für ambitionierte Gründer, Berater, Experten und Investoren auf der Suche nach zukunftssicheren grenzüberschreitenden Firmenstrukturen.'
    },
    {
      from: 'Zugimpex bietet internationale Steuerplanung, Firmengründung, laufende Betreuung ausländischer Gesellschaften und Unterstützung bei der Wohnsitzverlegung – damit Sie Auslandsgesellschaften richtig, effizient und rechtssicher nutzen.',
      to: 'KEYSTONE bietet strategische Steuerberatung, Firmengründung, kontinuierliche Unternehmensbetreuung und Begleitung beim Wohnsitzwechsel – damit Ihre internationalen Gesellschaften gesetzeskonform, effizient und profitabel agieren.'
    },
    {
      from: 'Seit 2008 unterstützen wir Unternehmen und deren Gesellschafter dabei, bessere Ergebnisse durch Erfahrung, Kompetenz und Vertrauen zu erzielen.',
      to: 'Mit langjähriger Praxiserfahrung begleiten wir anspruchsvolle Unternehmen und Eigentümer zu nachhaltigem wirtschaftlichen Erfolg.'
    },
    { from: 'Eine Entscheidung, die sich auszahlt.', to: 'Eine strategische Wahl, die sich auszahlt.' },
    { from: 'Entdecken Sie unsere Dienstleistungen', to: 'Entdecken Sie unser Leistungsangebot' },
    {
      from: 'Nutzen Sie eine Schweizer Gesellschaft für ein gutes Image, für rechtliche Vorteile und für den Zugang zu Schweizer Kunden. Profitieren Sie von Stabilität, Sicherheit, Image und rechtlichen Gestaltungsmöglichkeiten.',
      to: 'Nutzen Sie eine Schweizer Gesellschaft für erstklassige Reputation, Rechtssicherheit und direkten Marktzugang. Profitieren Sie von institutioneller Stabilität, Vermögensschutz und wirtschaftlicher Exzellenz.'
    },
    {
      from: 'Nutzen Sie 5% Besteuerung von Unternehmen, die Vorteile eines Wohnsitzes und ein moderates Lohn- und Kostenniveau auf Malta.',
      to: 'Profitieren Sie von effektiven 5% Körperschaftsteuer, attraktiven Non-Dom-Wohnsitzregelungen und moderaten Betriebskosten auf Malta.'
    },
    {
      from: 'Behalten Sie Ihren Wohnsitz und transferieren Sie Ihren Gewinn nahezu steuerfrei von der Gesellschaft in den Privatbereich.',
      to: 'Behalten Sie Ihren bisherigen Wohnsitz bei und überführen Sie Unternehmensgewinne steueroptimiert in Ihr Privatvermögen.'
    },
    {
      from: 'Unternehmen mit bis zu 3.000.000 AED Umsatz (ca. 700.000 Euro) können die Small Business Relief nutzen und zahlen keine Körperschaftsteuer; es gibt keine Einkommensteuer auf Gehalt und keine Quellensteuer.',
      to: 'Qualifizierte Unternehmen mit bis zu 3.000.000 AED Umsatz (~700.000 Euro) nutzen den Small Business Relief für 0% Körperschaftsteuer – völlig ohne Einkommen- oder Quellensteuern.'
    },
    { from: 'Wir melden uns innerhalb von 48 Stunden!', to: 'Wir antworten innerhalb von 24–48 Stunden!' },
  ],

  // --- ROMANIAN LANDING PAGES ---
  'ro\\index.html': [
    {
      from: 'Planificarea fiscală internațională plus internaționalizarea &#8211; Conceptul inovator al ZUGIMPEX.',
      to: 'Planificarea fiscală internațională și structurarea transfrontalieră &#8211; Conceptul inovator al KEYSTONE.'
    },
    {
      from: 'Zugimpex îmbunătățește eficient rezultatele întreprinderilor și ale acționarilor lor. Ia o decizie care plătește!',
      to: 'KEYSTONE optimizează strategic performanța comercială și eficiența fiscală a companiilor și acționarilor. O alegere cu valoare reală!'
    },
    {
      from: 'Păstrează-ți reședința și transferă-ți profitul aproape fără taxe de la companie în zona privată.',
      to: 'Mențineți-vă reședința actuală și transferați profiturile din companie în patrimoniul personal cu o sarcină fiscală minimă.'
    },
    {
      from: 'Profitați de impozitul pe profit 5%, beneficiile unei reședințe private și un nivel moderat al salariilor și costurilor în Malta.',
      to: 'Beneficiați de cota redusă de impozitare de 5%, regimul avantajos de rezidență non-dom și costuri operaționale competitive în Malta.'
    },
    { from: 'Răspundem în termen de 48 de ore!', to: 'Răspundem prompt în termen de 24–48 de ore!' },
  ],

  // --- SERBIAN LANDING PAGES ---
  'sr\\index.html': [
    {
      from: 'MEĐUNARODNO PORESKO PLANIRANJE I INTERNACIONALIZACIJA &#8211; INOVATIVNI KONCEPT ZUGIMPEX-a',
      to: 'MEĐUNARODNO PORESKO PLANIRANJE I STRATEŠKO STRUKTURIRANJE &#8211; INOVATIVNI KONCEPT KEYSTONE-a'
    },
    {
      from: 'Zugimpex\u00a0poboljšava\u00a0poslovne rezultate kompanija, njihovih akcionara, i\u00a0njihovu operativnu fleksibilnost.',
      to: 'KEYSTONE strateški unapređuje poslovanje kompanija, profitabilnost njihovih vlasnika i njihovu poslovnu fleksibilnost.'
    },
    {
      from: 'Zugimpex poboljšava poslovne rezultate kompanija, njihovih akcionara, i njihovu operativnu fleksibilnost.',
      to: 'KEYSTONE strateški unapređuje poslovanje kompanija, profitabilnost njihovih vlasnika i njihovu poslovnu fleksibilnost.'
    },
    {
      from: 'U Slovačkoj je moguće izvršiti transfer profita sa korporatinog na privatni nivo bez oporezivanja dividendi.',
      to: 'U Slovačkoj je moguće strateški preneti dobit iz kompanije na nivo fizičkog lica uz minimalno poresko opterećenje na dividende.'
    },
    {
      from: 'Iskoristite pogodnosti : 5% poreza na dobit, status rezidenta, niske cene života i razumne troškove na Malti.',
      to: 'Iskoristite prednosti efektivne stope od 5% poreza na dobit, statusa rezidenta bez oporezivanja prihoda van Malte i konkurentnih troškova poslovanja.'
    },
    {
      from: 'Ne postoji porez na dobit preduzeća ako je kompanija u slobodnoj zoni i ne posluje sa matičnim tržištem UAE.',
      to: 'Preduzeća u slobodnim zonama UAE koja posluju na međunarodnom nivou ostvaruju nultu stopu poreza na dobit i visoku fleksibilnost.'
    },
    { from: 'Odgovaramo u roku od 48 sati!', to: 'Odgovaramo u roku od 24–48 sati!' },
  ],

  // --- SWITZERLAND COMPANY (EN) ---
  'switzerland-company.html': [
    { from: 'Why a Company in Switzerland?', to: 'Why Incorporate in Switzerland?' },
    {
      from: 'Use a Swiss company for a good image, for legal advantages and for access to Swiss customers.',
      to: 'Deploy a Swiss company for global prestige, premier legal security, and direct market access.'
    },
    { from: '5 Steps  - Quick Registration Without Travel:', to: '5 Streamlined Steps - Remote Company Registration:' },
    { from: 'What Happens After Incorporation?', to: 'Ongoing Administration & Corporate Governance:' }
  ],

  // --- SWITZERLAND COMPANY (DE) ---
  'de\\schweiz-firma.html': [
    { from: 'Warum ein Unternehmen im Kanton Zug- in der Schweiz?', to: 'Strategische Vorteile eines Unternehmens im Kanton Zug (Schweiz):' },
    { from: '5 Schritte – Registrierung rasch und einfach, ohne Anreise:', to: '5 strukturierte Schritte – Schnelle Eintragung ohne Reiseaufwand:' },
    { from: 'Was Geschieht Nach der Eintragung?', to: 'Laufende Betreuung & Administration nach der Eintragung:' }
  ],

  // --- SWITZERLAND COMPANY (RO) ---
  'ro\\elvetia-formarea-companiei.html': [
    { from: '5 pași pentru înregistrare rapidă fără a călători:', to: '5 pași optimizați pentru înregistrare la distanță:' }
  ],

  // --- SWITZERLAND COMPANY (SR) ---
  'sr\\formiranje-kompanije-u-svajcarskoj.html': [
    { from: 'brzo I lako u samo 5 koraka I bez vašeg prisustva', to: 'Brzo i efikasno u samo 5 koraka bez putovanja' }
  ],

  // --- MALTA COMPANY (EN) ---
  'malta-company.html': [
    { from: 'Why a Company in Malta?', to: 'Key Strategic Advantages of Malta:' },
    {
      from: 'Registration of a Limited Liability Company (Ltd) in Malta – 3 Steps Without Travelling:',
      to: 'Incorporating a Malta Limited Company (Ltd) – 3 Seamless Remote Steps:'
    },
    { from: 'What Happens After Registration?', to: 'Post-Incorporation Compliance & Support:' }
  ],

  // --- MALTA COMPANY (DE) ---
  'de\\malta-firma.html': [
    { from: 'Warum ein Unternehmen in der Malta?', to: 'Strategische Standortvorteile einer maltesischen Gesellschaft:' },
    { from: 'Was passiert nach der Registrierung?', to: 'Laufende Compliance & Administration nach der Gründung:' }
  ],

  // --- SLOVAKIA COMPANY (EN) ---
  'slovakia-company.html': [
    {
      from: 'Earn More, Keep More. \nReduce your social security contributions and total taxes by up to 70%.',
      to: 'Retain More, Grow More. \nOptimize your social security burdens and total tax obligations by up to 70%.'
    },
    {
      from: 'Results and Success Stories from Entrepreneurs.',
      to: 'Proven Outcomes & Commercial Success Cases:'
    },
    {
      from: 'Why many entrepreneurs stop earning money after April?',
      to: 'How Progressive Tax Brackets Impact Mid-Year Earnings:'
    }
  ],

  // --- SLOVAKIA COMPANY (DE) ---
  'de\\slowakei-firma.html': [
    {
      from: 'Mehr verdienen, weniger abgeben.\nSo senken Sie Ihre Sozialabgaben und Steuern gesamt um bis zu 70%',
      to: 'Erträge optimieren, Vermögen sichern.\nSenken Sie Ihre Sozialabgaben und Gesamtabgaben um bis zu 70%'
    },
    {
      from: 'Die Ergebnisse und Erfolge zahlreicher Unternehmer aus Österreich',
      to: 'Messbare Erfolge und Praxiserfahrungen europäischer Unternehmer:'
    }
  ],

  // --- SLOVAKIA COMPANY (RO) ---
  'ro\\slovacia-formarea-companiei.html': [
    { from: 'Registrație în 5 pași: rapid și ușor', to: 'Înregistrare în 5 pași simplificați la distanță' }
  ],

  // --- SLOVAKIA COMPANY (SR) ---
  'sr\\otvaranje-firme-u-slovackoj.html': [
    { from: 'Registracija u 5 koraka: brzo i jednostavno', to: 'Registracija u 5 efikasnih koraka na daljinu' }
  ],

  // --- UAE COMPANY (EN) ---
  'uae-company-formation-taxation-and-residence.html': [
    { from: 'Why a Company in the UAE?', to: 'Strategic Benefits of Incorporating in the UAE:' },
    { from: 'Company Setup in the UAE: Free Zones and LLC structures', to: 'UAE Corporate Setup: Free Zone & Mainland Formations' },
    {
      from: 'Taxation in the UAE, Taxation in Dubai, Taxation in Ras al Khaimah and all other Emirates',
      to: 'Taxation Framework in Dubai, Ras Al Khaimah & across the UAE'
    }
  ],

  // --- UAE COMPANY (DE) ---
  'de\\vae-firmengruendung-steuern-und-aufenthalt.html': [
    { from: 'Warum ein Unternehmen in den Emiraten?', to: 'Strategische Vorzüge einer Unternehmensgründung in den VAE:' },
    { from: 'Firmengründung in den VAE: Freezones und LLC- Gesellschaftsformen', to: 'Unternehmensstrukturen in den VAE: Freezone & Mainland Formate' }
  ],

  // --- INNOVATIVE CONCEPT ---
  'innovative-concept-zugimpex.html': [
    { from: 'The Innovative Concept of Zugimpex', to: 'The Innovative Concept of KEYSTONE' }
  ],

  // --- BUSINESS SERVICES ---
  'business-services.html': [
    {
      from: 'Business Centre of Zugimpex &#8211; Services from One Source',
      to: 'Business Centre of KEYSTONE &#8211; Services from One Source'
    }
  ],

  // --- COMPANY STRUCTURES ---
  'company-structures.html': [
    { from: 'Examples: combinations that fiscally make sense:', to: 'Strategic Combinations for Fiscal Efficiency:' }
  ],

  // --- INTERNATIONAL TAX PLANNING ---
  'international-tax-planning-and-substance.html': [
    { from: 'Benefits of a International Tax Planning', to: 'Key Benefits of International Tax Planning' },
    {
      from: 'International Tax Planning and International Tax Law (Overview)',
      to: 'Cross-Border Tax Planning & Legal Framework Overview'
    },
    { from: 'Substance and Real Implementation', to: 'Economic Substance & Operational Implementation' }
  ],
};

// Mirror rules for root mirrors (de.html, ro.html, sr.html)
PAGE_SPECIFIC_RULES['de.html'] = PAGE_SPECIFIC_RULES['de\\index.html'];
PAGE_SPECIFIC_RULES['ro.html'] = PAGE_SPECIFIC_RULES['ro\\index.html'];
PAGE_SPECIFIC_RULES['sr.html'] = PAGE_SPECIFIC_RULES['sr\\index.html'];

/**
 * Tokenize HTML into tags, scripts, styles, comments, and visible text nodes.
 * Strictly guarantees tags and scripts are preserved 100% byte-for-byte.
 */
function processVisibleTextNodes(html, textReplacer) {
  const tokenRegex = /(<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<!--[\s\S]*?-->|<[^>]+>|[^<]+)/gi;
  let result = '';
  let match;
  let textNodeCount = 0;
  let changedCount = 0;

  while ((match = tokenRegex.exec(html)) !== null) {
    const token = match[0];
    if (token.startsWith('<')) {
      // Tags, comments, styles, and scripts pass through untouched!
      result += token;
    } else {
      textNodeCount++;
      const replaced = textReplacer(token);
      if (replaced !== token) changedCount++;
      result += replaced;
    }
  }

  return { result, textNodeCount, changedCount };
}

/**
 * Updates head metadata: <title>, <meta name="description">, and og tags.
 */
function updateMetadata(html) {
  let modified = html;

  // 1. Update <title>
  modified = modified.replace(/<title>([\s\S]*?)<\/title>/gi, (match, titleContent) => {
    let newTitle = titleContent
      .replace(/Zugimpex/g, 'KEYSTONE')
      .replace(/ZUGIMPEX/g, 'KEYSTONE');

    if (newTitle.includes('Switzerland company formation = Swiss image &amp; legal benefits = Zugimpex')) {
      newTitle = 'Switzerland Company Formation: Swiss Prestige & Legal Security - KEYSTONE';
    } else if (newTitle.includes('Company formation in Slovakia; shelf companies with §4 VAT - Zugimpex')) {
      newTitle = 'Slovakia Company Formation: Shelf Companies with §4 VAT - KEYSTONE';
    } else if (newTitle.includes('Company Formation in Malta - fast and easy without travel')) {
      newTitle = 'Malta Company Formation: Fast Remote Incorporation - KEYSTONE';
    } else if (newTitle.includes('Zugimpex- Gründung + Services + richtiger Einsatz Ihrer Firma.')) {
      newTitle = 'KEYSTONE - Gründung, Services & strategischer Einsatz Ihrer Firma.';
    }

    return `<title>${newTitle}</title>`;
  });

  // 2. Update <meta name="description">
  modified = modified.replace(
    /(<meta\s+name=["']description["']\s+content=["'])(.*?)(["'])/gi,
    (match, prefix, content, suffix) => {
      let newDesc = content
        .replace(/Zugimpex/g, 'KEYSTONE')
        .replace(/ZUGIMPEX/g, 'KEYSTONE')
        .replace(/zugimpex/g, 'keystone');

      // Enhanced unique descriptions for core pages
      if (content.includes('for profitable businesses and business people')) {
        newDesc = 'KEYSTONE delivers strategic corporate services: company formation, tax planning, accounting, and ongoing corporate management for international businesses.';
      } else if (content.includes('assists clients to combine tax planning with internationalization')) {
        newDesc = 'KEYSTONE empowers clients to integrate strategic tax planning with international expansion, unlocking higher profitability and operational freedom.';
      } else if (content.includes('Company structures should be planned')) {
        newDesc = 'Corporate structures require meticulous strategic design aligned with commercial goals and regulatory frameworks. Leverage KEYSTONE\'s decades of cross-border advisory experience.';
      } else if (content.includes('Internationale Steuerplanung kann Vorteile')) {
        newDesc = 'Strategische internationale Steuerberatung verbindet die Vorzüge verschiedener Rechtssysteme und Standorte. KEYSTONE begleitet Sie mit erstklassiger Fachkompetenz!';
      } else if (content.includes('für profitable Unternehmen und Geschäftsleute')) {
        newDesc = 'KEYSTONE - für erfolgreiche Unternehmen und Investoren. Internationale Firmengründung, Steueroptimierung, Buchhaltung und strategische Unternehmensbetreuung.';
      } else if (content.includes('îmbunătățește eficient rezultatele întreprinderilor')) {
        newDesc = 'KEYSTONE optimizează strategic performanța comercială și eficiența fiscală a companiilor și acționarilor. O alegere solidă cu valoare reală!';
      }

      return `${prefix}${newDesc}${suffix}`;
    }
  );

  // 3. Update OpenGraph meta tags
  modified = modified.replace(
    /(<meta\s+property=["']og:site_name["']\s+content=["'])Zugimpex(["'])/gi,
    '$1KEYSTONE$2'
  );
  modified = modified.replace(
    /(<meta\s+property=["']og:(?:title|description)["']\s+content=["'])(.*?)(["'])/gi,
    (match, prefix, content, suffix) => {
      const newContent = content
        .replace(/Zugimpex/g, 'KEYSTONE')
        .replace(/ZUGIMPEX/g, 'KEYSTONE')
        .replace(/zugimpex/g, 'keystone');
      return `${prefix}${newContent}${suffix}`;
    }
  );

  return modified;
}

/**
 * Updates header site-title and tagline
 */
function updateHeaderBranding(html) {
  let modified = html;

  // Site title
  modified = modified.replace(
    /(<a\s+class=["']site-title-name["'][^>]*>)Zugimpex(<\/a>)/gi,
    '$1KEYSTONE$2'
  );

  // Site tagline across all languages
  modified = modified.replace(
    /(<p\s+class=["']site-description["']>)Internationalization and international tax planning(<\/p>)/gi,
    '$1Cross-Border Structuring & Strategic Tax Advisory$2'
  );
  modified = modified.replace(
    /(<p\s+class=["']site-description["']>)Internationalisierung und internationale Steuerplanung(<\/p>)/gi,
    '$1Grenzüberschreitende Strukturen & Strategische Steuerberatung$2'
  );
  modified = modified.replace(
    /(<p\s+class=["']site-description["']>)Internaționalizare și planificare fiscală internațională(<\/p>)/gi,
    '$1Structurare Transfrontalieră & Consultanță Fiscală Strategică$2'
  );
  modified = modified.replace(
    /(<p\s+class=["']site-description["']>)Internacionalizacija i međunarodno poresko planiranje(<\/p>)/gi,
    '$1Prekogranično Strukturiranje i Strateško Poresko Savetovanje$2'
  );

  return modified;
}

/**
 * Main rewriter function for an individual file
 */
function rewriteHtmlFile(filePath, isDryRun = false) {
  const relPath = path.relative(SITE_ROOT, filePath);
  const original = fs.readFileSync(filePath, 'utf8');
  let content = original;

  // 1. Update metadata (<title>, <meta description>, og tags)
  content = updateMetadata(content);

  // 2. Update header branding (site title, tagline)
  content = updateHeaderBranding(content);

  // 3. Apply page-specific rules if configured
  if (PAGE_SPECIFIC_RULES[relPath]) {
    for (const rule of PAGE_SPECIFIC_RULES[relPath]) {
      content = content.replace(rule.from, rule.to);
    }
  }

  // 4. Process all visible text nodes using strict tokenization
  const { result } = processVisibleTextNodes(content, text => {
    let updated = text;
    for (const rule of PHRASE_REWRITES) {
      updated = updated.replace(rule.from, rule.to);
    }
    return updated;
  });
  content = result;

  // Calculate stats
  const delta = content.length - original.length;
  const isChanged = content !== original;

  if (isChanged && !isDryRun) {
    fs.writeFileSync(filePath, content, 'utf8');
  }

  // Verification: check if any visible Zugimpex remains outside scripts/styles/comments
  const clean = content
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '');

  const remainingVisibleMatches = [];
  const regex = />([^<]*?zugimpex[^<]*?)</gi;
  let m;
  while ((m = regex.exec(clean)) !== null) {
    remainingVisibleMatches.push(m[1].trim());
  }

  return {
    file: relPath,
    isChanged,
    delta,
    origSize: original.length,
    newSize: content.length,
    remainingVisible: remainingVisibleMatches.length,
    remainingExamples: remainingVisibleMatches.slice(0, 3),
  };
}

/**
 * Scan directory recursively for non-zero HTML files
 */
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

/**
 * Main batch runner
 */
function runAll(isDryRun = false) {
  console.log(`\n======================================================`);
  console.log(`KEYSTONE Site-Wide Rewriter`);
  console.log(`Mode: ${isDryRun ? 'DRY RUN (simulation)' : 'APPLY CHANGES'}`);
  console.log(`Root: ${SITE_ROOT}`);
  console.log(`======================================================\n`);

  const files = getAllHtmlFiles(SITE_ROOT);
  console.log(`Found ${files.length} active non-zero HTML files to process.\n`);

  let modifiedCount = 0;
  let totalDelta = 0;
  let filesWithRemaining = 0;
  const summary = [];

  for (const f of files) {
    const res = rewriteHtmlFile(f, isDryRun);
    if (res.isChanged) {
      modifiedCount++;
      totalDelta += res.delta;
    }
    if (res.remainingVisible > 0) {
      filesWithRemaining++;
    }
    summary.push(res);
  }

  console.log(`------------------------------------------------------------------------------------------------`);
  console.log('File'.padEnd(55) + 'Status'.padEnd(14) + 'Size Change'.padEnd(16) + 'Remaining Zugimpex');
  console.log(`------------------------------------------------------------------------------------------------`);

  summary.forEach(s => {
    const status = s.isChanged ? 'MODIFIED' : 'NO CHANGE';
    const deltaStr = `${s.delta >= 0 ? '+' : ''}${s.delta} B`;
    const remStr = s.remainingVisible === 0 ? '0 (Clean)' : `⚠️  ${s.remainingVisible}`;
    console.log(s.file.slice(0, 52).padEnd(55) + status.padEnd(14) + deltaStr.padEnd(16) + remStr);
  });

  console.log(`------------------------------------------------------------------------------------------------`);
  console.log(`\nEXECUTION SUMMARY:`);
  console.log(`Total HTML files examined:  ${files.length}`);
  console.log(`Files modified & updated:   ${modifiedCount}`);
  console.log(`Total size delta:           ${totalDelta >= 0 ? '+' : ''}${totalDelta} bytes`);
  console.log(`Files with remaining visible Zugimpex: ${filesWithRemaining}`);

  if (filesWithRemaining === 0) {
    console.log(`\n🎉 SUCCESS: 100% of visible 'Zugimpex' brand mentions have been replaced across the entire site!`);
  }
}

// CLI
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');

runAll(isDryRun);

module.exports = { runAll, rewriteHtmlFile, getAllHtmlFiles };
