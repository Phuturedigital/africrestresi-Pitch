#!/usr/bin/env node
/**
 * scrape-africrest.js
 * --------------------
 * Pulls hero/exterior photos from africrestresi.co.za and the per-building
 * micro-sites, saves them to ./images/, and writes replace-images.sh
 * (a sed script that swaps every Unsplash placeholder URL in the demo HTML
 * for the real local image).
 *
 * Usage:
 *   1. Save this file in the same folder as your africrest/ demo
 *   2. npm init -y && npm i node-fetch@2 cheerio
 *   3. node scrape-africrest.js
 *   4. bash replace-images.sh        (applies the swaps to africrest/*.html)
 *   5. python3 -m http.server 8000   (preview at http://localhost:8000)
 */

const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');      // v2.x — supports require()
const cheerio = require('cheerio');

const OUT_DIR = path.join(__dirname, 'africrest', 'images');
const HTML_DIR = path.join(__dirname, 'africrest');

// Source pages to scrape. Each entry: [url, slug, max_images_to_grab].
// Buildings have their own micro-sites — I've listed every one I could
// find on africrestresi.co.za. If any 404, the script just skips it.
const SOURCES = [
  ['https://www.africrestresi.co.za/',           'main',         8],
  // building micro-sites
  ['https://thelandmark.co/',                    'landmark',     6],
  ['https://thetitan.co.za/',                    'titan',        6],
  ['https://villagebramley.co.za/',              'village',      6],
  ['https://thelegacy.co.za/',                   'legacy',       6],
  ['https://thegalileo.co.za/',                  'galileo',      6],
  ['https://theencore.co.za/',                   'encore',       6],
  ['https://thesilo.co.za/',                     'silo',         6],
  ['https://theeclipse.co.za/',                  'eclipse',      6],
  ['https://stanleystudios.co.za/',              'stanley',      6],
  ['https://theleo.co.za/',                      'leo',          6],
  ['https://themaestro.co.za/',                  'maestro',      6],
  ['https://theastra.co.za/',                    'astra',        6],
  ['https://theprestige.co.za/',                 'prestige',     6],
  ['https://themaverick.co.za/',                 'maverick',     6],
  ['https://thegeorgia.co.za/',                  'georgia',      6],
];

// --------------- helpers -------------------------------------------------

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (compatible; AfricrestPitchScraper/1.0)',
  'Accept': 'text/html,*/*',
};

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function safeFetch(url) {
  try {
    const res = await fetch(url, { headers: HEADERS, timeout: 15000 });
    if (!res.ok) {
      console.log(`  ! ${res.status} ${url}`);
      return null;
    }
    return res;
  } catch (e) {
    console.log(`  ! fetch failed ${url}: ${e.message}`);
    return null;
  }
}

function absolutize(src, base) {
  try { return new URL(src, base).href; } catch { return null; }
}

function isLikelyPhoto(url) {
  if (!url) return false;
  const u = url.toLowerCase();
  if (u.includes('logo')) return false;
  if (u.includes('icon')) return false;
  if (u.includes('favicon')) return false;
  if (u.includes('.svg')) return false;
  if (u.includes('placeholder')) return false;
  // Filter for reasonably-sized images only
  return /\.(jpe?g|png|webp)(\?|$)/i.test(u);
}

async function downloadImage(url, dest) {
  const res = await safeFetch(url);
  if (!res) return false;
  const buf = await res.buffer();
  if (buf.length < 8 * 1024) {
    // Too small — likely an icon
    return false;
  }
  fs.writeFileSync(dest, buf);
  return true;
}

// --------------- scrape one source --------------------------------------

async function scrapeSource(url, slug, maxImages) {
  console.log(`\n→ ${slug}: ${url}`);
  const res = await safeFetch(url);
  if (!res) return [];

  const html = await res.text();
  const $ = cheerio.load(html);

  // Collect candidate URLs from <img src>, <img data-src>, srcset, and inline
  // background-image styles.
  const candidates = new Set();

  $('img').each((_, el) => {
    const $el = $(el);
    ['src', 'data-src', 'data-lazy-src', 'data-original'].forEach(attr => {
      const v = $el.attr(attr);
      if (v) candidates.add(absolutize(v, url));
    });
    const srcset = $el.attr('srcset') || $el.attr('data-srcset');
    if (srcset) {
      // Take the largest (last) entry
      const parts = srcset.split(',').map(s => s.trim().split(' ')[0]);
      parts.forEach(p => candidates.add(absolutize(p, url)));
    }
  });

  $('[style*="background-image"]').each((_, el) => {
    const style = $(el).attr('style') || '';
    const m = style.match(/url\((['"]?)([^'")]+)\1\)/);
    if (m) candidates.add(absolutize(m[2], url));
  });

  const photos = [...candidates].filter(isLikelyPhoto);
  console.log(`  found ${photos.length} photo candidates`);

  // Download up to maxImages, biggest-looking first (heuristic: longer URL
  // often means a fuller path, but we sort by hint keywords too)
  const ranked = photos
    .map(u => ({
      url: u,
      score: (u.match(/(hero|banner|exterior|building|gallery|main)/i) ? 5 : 0)
           + (u.length > 80 ? 1 : 0),
    }))
    .sort((a, b) => b.score - a.score);

  const downloaded = [];
  for (const { url: imgUrl } of ranked) {
    if (downloaded.length >= maxImages) break;
    const ext = (imgUrl.match(/\.(jpe?g|png|webp)/i) || ['.jpg'])[0]
      .toLowerCase().replace('jpeg', 'jpg');
    const fname = `${slug}-${String(downloaded.length + 1).padStart(2, '0')}${ext}`;
    const dest = path.join(OUT_DIR, fname);
    process.stdout.write(`  ${fname} ... `);
    const ok = await downloadImage(imgUrl, dest);
    console.log(ok ? 'ok' : 'skip');
    if (ok) downloaded.push({ source: imgUrl, local: `images/${fname}` });
    await sleep(200);
  }
  return downloaded;
}

// --------------- generate replace script --------------------------------

function generateReplaceScript(allDownloaded) {
  // We build a sed script that maps each Unsplash photo-id (the unique part
  // of the URL like 1545324418-cc1a3fa10c00) to a local image. The mapping
  // is heuristic — we just walk through all downloaded images and pair them
  // with Unsplash URLs in order. You can hand-edit replace-images.sh after
  // if you want a specific photo for a specific building.
  const unsplashIds = [
    '1545324418-cc1a3fa10c00',  // hero / Maestro exterior
    '1564013799919-ab600027ffc6', // Astra
    '1502672260266-1c1ef2d93688', // Galileo
    '1486325212027-8081e485255e', // Encore
    '1493809842364-78817add7ffb', // Silo
    '1515263487990-61b07816b324', // Leo
    '1522708323590-d24dbb6b0267', // apartment interior
    '1560448204-e02f11c3d0e2',    // apartment interior
    '1502672023488-70e25813eb80', // apartment interior
    '1556909114-f6e7ad7d3136',    // apartment interior
    '1494203484021-3c454daf695d', // apartment interior
    '1558211583-d26f610c1eb1',    // apartment interior
    '1505693416388-ac5ce068fe85', // apartment interior
    '1567496898669-ee935f5f647a', // about strip
    '1565182999561-18d7dc61c393', // Stanley Studios
    '1554995207-c18c203602cb',    // Legacy
    '1560185007-cde436f6a4d0',    // 2 bed
    '1552664730-d307ca884978',    // about two-col img
    '1524293568345-75d62c3664f7', // contact map bg
  ];

  const mapping = [];
  for (let i = 0; i < unsplashIds.length; i++) {
    const local = allDownloaded[i % allDownloaded.length];
    if (!local) break;
    mapping.push({ id: unsplashIds[i], local: local.local });
  }

  let script = '#!/bin/bash\n';
  script += '# replace-images.sh\n';
  script += '# Auto-generated by scrape-africrest.js\n';
  script += '# Replaces Unsplash placeholder URLs in africrest/*.html with local files.\n';
  script += 'set -e\n\n';
  script += 'cd "$(dirname "$0")/africrest"\n\n';

  for (const { id, local } of mapping) {
    // sed is tricky with slashes — use | as the delimiter
    // Match any unsplash URL containing this photo-id, replace with local path.
    script += `# ${id} → ${local}\n`;
    script += `find . -name '*.html' -exec sed -i.bak "s|https://images.unsplash.com/photo-${id}[^\\"\\')]*|${local}|g" {} +\n`;
  }

  script += '\n# Clean up sed backup files\n';
  script += `find . -name '*.html.bak' -delete\n`;
  script += '\necho "Done. Open index.html in a browser to verify."\n';
  return script;
}

// --------------- main ---------------------------------------------------

(async () => {
  if (!fs.existsSync(HTML_DIR)) {
    console.error(`Error: expected directory ${HTML_DIR} (the demo site).`);
    process.exit(1);
  }
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const allDownloaded = [];
  for (const [url, slug, n] of SOURCES) {
    try {
      const items = await scrapeSource(url, slug, n);
      allDownloaded.push(...items);
    } catch (e) {
      console.log(`  ! ${slug} failed: ${e.message}`);
    }
  }

  console.log(`\n=== Summary ===`);
  console.log(`Downloaded: ${allDownloaded.length} images → ./africrest/images/`);

  if (allDownloaded.length === 0) {
    console.log('\nNo images downloaded — check your internet connection');
    console.log('or whether the source URLs are still live.');
    process.exit(1);
  }

  const script = generateReplaceScript(allDownloaded);
  fs.writeFileSync('replace-images.sh', script, { mode: 0o755 });
  console.log('Generated: replace-images.sh');
  console.log('\nNext steps:');
  console.log('  1. Inspect ./africrest/images/ — keep the best photos, delete obvious junk');
  console.log('  2. Edit replace-images.sh to pair specific buildings with specific photos');
  console.log('  3. Run: bash replace-images.sh');
  console.log('  4. Preview: cd africrest && python3 -m http.server 8000');
})();
