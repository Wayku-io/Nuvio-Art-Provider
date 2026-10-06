const axios = require('axios');
const sharp = require('sharp');
const vectors = require('../assets/vectors-clean.json');

const MANIFEST_BASE = 'https://aiometadatafortheweebs.midnightignite.me/stremio/1609e9ee-c194-445e-b25c-410e88954386';

const CATALOG_CONFIGS = [
  { id: 'flixpatrol.netflix.fr.movie', type: 'movie', platform: 'NETFLIX', color: '#E50914', gradient: ['#FF1E27', '#8A0006'], isLight: false },
  { id: 'flixpatrol.netflix.fr.series', type: 'series', platform: 'NETFLIX', color: '#E50914', gradient: ['#FF1E27', '#8A0006'], isLight: false },
  { id: 'flixpatrol.amazon-prime.fr.movie', type: 'movie', platform: 'PRIME VIDEO', color: '#00A8E1', gradient: ['#00C4FF', '#005D8A'], isLight: false },
  { id: 'flixpatrol.amazon-prime.fr.series', type: 'series', platform: 'PRIME VIDEO', color: '#00A8E1', gradient: ['#00C4FF', '#005D8A'], isLight: false },
  { id: 'flixpatrol.apple-tv.fr.movie', type: 'movie', platform: 'APPLE TV', color: '#E2E8F0', gradient: ['#FFFFFF', '#CBD5E1'], isLight: true },
  { id: 'flixpatrol.apple-tv.fr.series', type: 'series', platform: 'APPLE TV', color: '#E2E8F0', gradient: ['#FFFFFF', '#CBD5E1'], isLight: true },
  { id: 'flixpatrol.disney.fr.movie', type: 'movie', platform: 'DISNEY+', color: '#113CCF', gradient: ['#2B66FF', '#092380'], isLight: false },
  { id: 'flixpatrol.disney.fr.series', type: 'series', platform: 'DISNEY+', color: '#113CCF', gradient: ['#2B66FF', '#092380'], isLight: false },
  { id: 'flixpatrol.hbo-max.fr.movie', type: 'movie', platform: 'HBO MAX', color: '#9900EE', gradient: ['#C438FF', '#5A0091'], isLight: false },
  { id: 'flixpatrol.hbo-max.fr.series', type: 'series', platform: 'HBO MAX', color: '#9900EE', gradient: ['#C438FF', '#5A0091'], isLight: false },
  { id: 'flixpatrol.paramount.fr.movie', type: 'movie', platform: 'PARAMOUNT+', color: '#0064FF', gradient: ['#3892FF', '#00389E'], isLight: false },
  { id: 'flixpatrol.paramount.fr.series', type: 'series', platform: 'PARAMOUNT+', color: '#0064FF', gradient: ['#3892FF', '#00389E'], isLight: false }
];

// In-memory cache for catalogs index
let catalogIndex = null;
let lastFetchTime = 0;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

async function getOrUpdateIndex() {
  const now = Date.now();
  if (catalogIndex && (now - lastFetchTime) < CACHE_TTL_MS) {
    return catalogIndex;
  }

  const newIndex = new Map();

  await Promise.allSettled(
    CATALOG_CONFIGS.map(async (cat) => {
      try {
        const url = `${MANIFEST_BASE}/catalog/${cat.type}/${cat.id}.json`;
        const res = await axios.get(url, { timeout: 8000 });
        const metas = res.data?.metas || [];

        metas.forEach((item, idx) => {
          if (!item.id) return;
          const cleanId = item.id.trim();

          if (!newIndex.has(cleanId)) {
            newIndex.set(cleanId, {
              rank: idx + 1,
              platform: cat.platform,
              color: cat.color,
              gradient: cat.gradient,
              isLight: cat.isLight,
              posterUrl: item.poster
            });
          }
        });
      } catch (err) {
        console.error(`Failed to fetch catalog ${cat.id}:`, err.message);
      }
    })
  );

  if (newIndex.size > 0) {
    catalogIndex = newIndex;
    lastFetchTime = now;
  }

  return catalogIndex || new Map();
}

/* ------------------------------------------------------------------------- */
/* 1. NEON GLOW NOTCH (Notch centrée avec liseré néon)                       */
/* ------------------------------------------------------------------------- */
function renderNeonNotch(width, height, rank, platform, color) {
  const vH = Math.round(height * 600 / width);
  const hashVec = vectors.hash;
  const numVec = vectors.numbers[rank] || vectors.numbers['1'];
  const platVec = vectors.platforms[platform] || vectors.platforms['NETFLIX'];

  const pillH = 88;
  const rx = pillH / 2;
  const dotR = 10;
  const padLeft = 24;
  const gapDotToRank = 18;
  const gapRankToDiv = 18;
  const gapDivToPlat = 18;
  const padRight = 32;

  const dotX = padLeft + dotR;
  const hashX = dotX + dotR + gapDotToRank;
  const numX = hashX + hashVec.width + 4;
  const divX = numX + numVec.width + gapRankToDiv;
  const platX = divX + 2 + gapDivToPlat;
  const pillW = platX + platVec.width + padRight;

  const pillX = Math.round((600 - pillW) / 2);
  const pillY = 32;
  const midY = pillY + pillH / 2;

  return Buffer.from(`
    <svg width="${width}" height="${height}" viewBox="0 0 600 ${vH}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="neonShadow" x="-40%" y="-40%" width="180%" height="200%">
          <feDropShadow dx="0" dy="12" stdDeviation="12" flood-color="#000000" flood-opacity="0.9"/>
          <feDropShadow dx="0" dy="0" stdDeviation="10" flood-color="${color}" flood-opacity="0.5"/>
        </filter>
        <filter id="dotGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" />
        </filter>
      </defs>

      <g filter="url(#neonShadow)">
        <rect x="${pillX}" y="${pillY}" width="${pillW}" height="${pillH}" rx="${rx}"
              fill="#080a12" fill-opacity="0.94" stroke="${color}" stroke-width="2.5" />
        <circle cx="${pillX + dotX}" cy="${midY}" r="${dotR + 4}" fill="${color}" opacity="0.6" filter="url(#dotGlow)" />
        <circle cx="${pillX + dotX}" cy="${midY}" r="${dotR}" fill="${color}" />
        <g transform="translate(${pillX + hashX}, ${midY + 11})"><path d="${hashVec.pathData}" fill="#ffffff" fill-opacity="0.9" /></g>
        <g transform="translate(${pillX + numX}, ${midY + 18})"><path d="${numVec.pathData}" fill="#ffffff" /></g>
        <rect x="${pillX + divX}" y="${midY - 18}" width="2" height="36" rx="1" fill="#ffffff" fill-opacity="0.3" />
        <g transform="translate(${pillX + platX}, ${midY + 10})"><path d="${platVec.pathData}" fill="#ffffff" /></g>
      </g>
    </svg>
  `);
}

/* ------------------------------------------------------------------------- */
/* 2. BRAND COLOR SOLID (Fond plein avec dégradé officiel de la marque)      */
/* ------------------------------------------------------------------------- */
function renderBrandSolid(width, height, rank, platform, color, gradient, isLight) {
  const vH = Math.round(height * 600 / width);
  const hashVec = vectors.hash;
  const numVec = vectors.numbers[rank] || vectors.numbers['1'];
  const platVec = vectors.platforms[platform] || vectors.platforms['NETFLIX'];

  const pillH = 88;
  const rx = pillH / 2;
  const padLeft = 28;
  const gapRankToDiv = 20;
  const gapDivToPlat = 20;
  const padRight = 34;

  const hashX = padLeft;
  const numX = hashX + hashVec.width + 4;
  const divX = numX + numVec.width + gapRankToDiv;
  const platX = divX + 2 + gapDivToPlat;
  const pillW = platX + platVec.width + padRight;

  const pillX = Math.round((600 - pillW) / 2);
  const pillY = 32;
  const midY = pillY + pillH / 2;

  const g1 = gradient ? gradient[0] : color;
  const g2 = gradient ? gradient[1] : color;

  // Text color: Black on light background (Apple TV), White otherwise
  const textColor = isLight ? '#090b11' : '#ffffff';
  const strokeColor = isLight ? '#090b11' : '#ffffff';

  return Buffer.from(`
    <svg width="${width}" height="${height}" viewBox="0 0 600 ${vH}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="solidShadow" x="-30%" y="-30%" width="160%" height="180%">
          <feDropShadow dx="0" dy="12" stdDeviation="12" flood-color="#000000" flood-opacity="0.85"/>
        </filter>
        <linearGradient id="solidGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${g1}"/>
          <stop offset="100%" stop-color="${g2}"/>
        </linearGradient>
      </defs>

      <g filter="url(#solidShadow)">
        <rect x="${pillX}" y="${pillY}" width="${pillW}" height="${pillH}" rx="${rx}"
              fill="url(#solidGrad)" stroke="${strokeColor}" stroke-opacity="${isLight ? '0.2' : '0.35'}" stroke-width="2" />
        <g transform="translate(${pillX + hashX}, ${midY + 11})"><path d="${hashVec.pathData}" fill="${textColor}" fill-opacity="0.85" /></g>
        <g transform="translate(${pillX + numX}, ${midY + 18})"><path d="${numVec.pathData}" fill="${textColor}" /></g>
        <rect x="${pillX + divX}" y="${midY - 18}" width="2" height="36" rx="1" fill="${textColor}" fill-opacity="0.3" />
        <g transform="translate(${pillX + platX}, ${midY + 10})"><path d="${platVec.pathData}" fill="${textColor}" /></g>
      </g>
    </svg>
  `);
}

/* ------------------------------------------------------------------------- */
/* 3. SPLIT TICKET (Duo-tone cinéma)                                         */
/* ------------------------------------------------------------------------- */
function renderSplitTicket(width, height, rank, platform, color, isLight) {
  const vH = Math.round(height * 600 / width);
  const hashVec = vectors.hash;
  const numVec = vectors.numbers[rank] || vectors.numbers['1'];
  const platVec = vectors.platforms[platform] || vectors.platforms['NETFLIX'];

  const blockH = 82;
  const rx = 18;

  const leftW = hashVec.width + numVec.width + 42;
  const rightW = platVec.width + 36;
  const totalW = leftW + rightW;

  const startX = Math.round((600 - totalW) / 2);
  const startY = 32;
  const midY = startY + blockH / 2;

  const leftNumX = startX + 16;
  const leftNumValX = leftNumX + hashVec.width + 4;
  const rightPlatX = startX + leftW + 18;

  const leftTextColor = isLight ? '#090b11' : '#ffffff';

  return Buffer.from(`
    <svg width="${width}" height="${height}" viewBox="0 0 600 ${vH}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="ticketShadow" x="-30%" y="-30%" width="160%" height="180%">
          <feDropShadow dx="0" dy="12" stdDeviation="12" flood-color="#000000" flood-opacity="0.85"/>
        </filter>
        <clipPath id="ticketClip">
          <rect x="${startX}" y="${startY}" width="${totalW}" height="${blockH}" rx="${rx}" />
        </clipPath>
      </defs>

      <g filter="url(#ticketShadow)">
        <rect x="${startX}" y="${startY}" width="${totalW}" height="${blockH}" rx="${rx}"
              fill="#0b0d14" stroke="#ffffff" stroke-opacity="0.25" stroke-width="2" />
        <g clip-path="url(#ticketClip)">
          <rect x="${startX}" y="${startY}" width="${leftW}" height="${blockH}" fill="${color}" />
          <g transform="translate(${leftNumX}, ${midY + 11})"><path d="${hashVec.pathData}" fill="${leftTextColor}" fill-opacity="0.9" /></g>
          <g transform="translate(${leftNumValX}, ${midY + 18})"><path d="${numVec.pathData}" fill="${leftTextColor}" /></g>
          <g transform="translate(${rightPlatX}, ${midY + 10})"><path d="${platVec.pathData}" fill="#f8fafc" /></g>
        </g>
      </g>
    </svg>
  `);
}

/* ------------------------------------------------------------------------- */
/* 4. CORNER RIBBON (Biseau dans l'angle supérieur gauche)                   */
/* ------------------------------------------------------------------------- */
function renderCornerRibbon(width, height, rank, platform, color, isLight) {
  const vH = Math.round(height * 600 / width);
  const hashVec = vectors.hash;
  const numVec = vectors.numbers[rank] || vectors.numbers['1'];
  const platVec = vectors.platforms[platform] || vectors.platforms['NETFLIX'];

  const ribbonH = 80;
  const ribbonW = 320;
  const textColor = isLight ? '#090b11' : '#ffffff';

  return Buffer.from(`
    <svg width="${width}" height="${height}" viewBox="0 0 600 ${vH}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="ribbonShadow" x="-30%" y="-30%" width="160%" height="180%">
          <feDropShadow dx="0" dy="8" stdDeviation="10" flood-color="#000000" flood-opacity="0.85"/>
        </filter>
      </defs>

      <g filter="url(#ribbonShadow)">
        <path d="M 0 0 L ${ribbonW} 0 L ${ribbonW - 35} ${ribbonH} L 0 ${ribbonH} Z"
              fill="${color}" fill-opacity="0.95" stroke="#ffffff" stroke-opacity="0.3" stroke-width="2" />
        <g transform="translate(24, 52)"><path d="${hashVec.pathData}" fill="${textColor}" fill-opacity="0.9" /></g>
        <g transform="translate(${24 + hashVec.width + 4}, 58)"><path d="${numVec.pathData}" fill="${textColor}" /></g>
        <rect x="${36 + hashVec.width + numVec.width + 8}" y="24" width="2" height="32" rx="1" fill="${textColor}" fill-opacity="0.35" />
        <g transform="translate(${54 + hashVec.width + numVec.width + 8}, 50)"><path d="${platVec.pathData}" fill="${textColor}" /></g>
      </g>
    </svg>
  `);
}

/* ------------------------------------------------------------------------- */
/* 5. NETFLIX GIANT 3D (Grand chiffre en bas à gauche)                       */
/* ------------------------------------------------------------------------- */
function renderNetflixGiant(width, height, rank, platform, color) {
  const vH = Math.round(height * 600 / width);
  const numVec = vectors.numbers[rank] || vectors.numbers['1'];
  const platVec = vectors.platforms[platform] || vectors.platforms['NETFLIX'];

  return Buffer.from(`
    <svg width="${width}" height="${height}" viewBox="0 0 600 ${vH}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="giantShadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000000" flood-opacity="0.95"/>
          <feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="#000000" flood-opacity="0.95"/>
        </filter>
        <linearGradient id="bottomVignette" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#000000" stop-opacity="0"/>
          <stop offset="60%" stop-color="#000000" stop-opacity="0.6"/>
          <stop offset="100%" stop-color="#000000" stop-opacity="0.9"/>
        </linearGradient>
      </defs>

      <rect x="0" y="${vH - 260}" width="600" height="260" fill="url(#bottomVignette)" />
      <g filter="url(#giantShadow)">
        <rect x="30" y="${vH - 230}" width="${platVec.width + 36}" height="42" rx="21"
              fill="#0c0e18" fill-opacity="0.9" stroke="${color}" stroke-width="2" />
        <g transform="translate(48, ${vH - 202}) scale(0.85)"><path d="${platVec.pathData}" fill="#ffffff" /></g>
      </g>
      <g filter="url(#giantShadow)" transform="translate(24, ${vH - 30}) scale(2.6)">
        <path d="${numVec.pathData}" fill="#ffffff" stroke="#000000" stroke-width="4" stroke-linejoin="round" />
      </g>
    </svg>
  `);
}

/* ------------------------------------------------------------------------- */
/* 6. CORNER CAPSULE (Pilule en coin supérieur gauche avec liseré néon)      */
/* ------------------------------------------------------------------------- */
function renderCornerCapsule(width, height, rank, platform, color, isLight) {
  const vH = Math.round(height * 600 / width);
  const hashVec = vectors.hash;
  const numVec = vectors.numbers[rank] || vectors.numbers['1'];
  const platVec = vectors.platforms[platform] || vectors.platforms['NETFLIX'];

  const pillH = 82;
  const rx = pillH / 2;
  const dotR = 10;
  const padLeft = 22;
  const gapDotToRank = 16;
  const gapRankToDiv = 16;
  const gapDivToPlat = 16;
  const padRight = 28;

  const dotX = padLeft + dotR;
  const hashX = dotX + dotR + gapDotToRank;
  const numX = hashX + hashVec.width + 4;
  const divX = numX + numVec.width + gapRankToDiv;
  const platX = divX + 2 + gapDivToPlat;
  const pillW = platX + platVec.width + padRight;

  const pillX = 28;
  const pillY = 28;
  const midY = pillY + pillH / 2;

  const bgFill = isLight ? '#f1f5f9' : '#080a12';
  const textColor = isLight ? '#090b11' : '#ffffff';
  const strokeColor = isLight ? '#090b11' : color;

  return Buffer.from(`
    <svg width="${width}" height="${height}" viewBox="0 0 600 ${vH}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="cornerCapsuleShadow" x="-30%" y="-30%" width="160%" height="180%">
          <feDropShadow dx="0" dy="10" stdDeviation="12" flood-color="#000000" flood-opacity="0.85"/>
          <feDropShadow dx="0" dy="0" stdDeviation="8" flood-color="${color}" flood-opacity="0.4"/>
        </filter>
      </defs>

      <g filter="url(#cornerCapsuleShadow)">
        <rect x="${pillX}" y="${pillY}" width="${pillW}" height="${pillH}" rx="${rx}"
              fill="${bgFill}" fill-opacity="0.92" stroke="${strokeColor}" stroke-width="2.5" />
        <circle cx="${pillX + dotX}" cy="${midY}" r="${dotR}" fill="${color}" />
        <g transform="translate(${pillX + hashX}, ${midY + 11})"><path d="${hashVec.pathData}" fill="${textColor}" fill-opacity="0.9" /></g>
        <g transform="translate(${pillX + numX}, ${midY + 18})"><path d="${numVec.pathData}" fill="${textColor}" /></g>
        <rect x="${pillX + divX}" y="${midY - 16}" width="2" height="32" rx="1" fill="${textColor}" fill-opacity="0.3" />
        <g transform="translate(${pillX + platX}, ${midY + 10})"><path d="${platVec.pathData}" fill="${textColor}" /></g>
      </g>
    </svg>
  `);
}

/* ------------------------------------------------------------------------- */
/* 7. ULTRA GRADIENT VIBRANT (Dégradé hyper saturé centré + reflet glossy)   */
/* ------------------------------------------------------------------------- */
function renderUltraGradient(width, height, rank, platform, color, gradient, isLight) {
  const vH = Math.round(height * 600 / width);
  const hashVec = vectors.hash;
  const numVec = vectors.numbers[rank] || vectors.numbers['1'];
  const platVec = vectors.platforms[platform] || vectors.platforms['NETFLIX'];

  const pillH = 90;
  const rx = pillH / 2;
  const padLeft = 28;
  const gapRankToDiv = 20;
  const gapDivToPlat = 20;
  const padRight = 34;

  const hashX = padLeft;
  const numX = hashX + hashVec.width + 4;
  const divX = numX + numVec.width + gapRankToDiv;
  const platX = divX + 2 + gapDivToPlat;
  const pillW = platX + platVec.width + padRight;

  const pillX = Math.round((600 - pillW) / 2);
  const pillY = 32;
  const midY = pillY + pillH / 2;

  const g1 = gradient ? gradient[0] : color;
  const g2 = gradient ? gradient[1] : color;
  const textColor = isLight ? '#090b11' : '#ffffff';

  return Buffer.from(`
    <svg width="${width}" height="${height}" viewBox="0 0 600 ${vH}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="ultraGradShadow" x="-40%" y="-40%" width="180%" height="200%">
          <feDropShadow dx="0" dy="14" stdDeviation="14" flood-color="#000000" flood-opacity="0.9"/>
          <feDropShadow dx="0" dy="0" stdDeviation="12" flood-color="${g1}" flood-opacity="0.35"/>
        </filter>
        <linearGradient id="ultraGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${g1}"/>
          <stop offset="100%" stop-color="${g2}"/>
        </linearGradient>
        <linearGradient id="glossHighlight" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="0.35"/>
          <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
        </linearGradient>
      </defs>

      <g filter="url(#ultraGradShadow)">
        <!-- Base Pill -->
        <rect x="${pillX}" y="${pillY}" width="${pillW}" height="${pillH}" rx="${rx}"
              fill="url(#ultraGrad)" stroke="#ffffff" stroke-opacity="0.4" stroke-width="2" />
        
        <!-- Glossy top reflection -->
        <rect x="${pillX + 2}" y="${pillY + 2}" width="${pillW - 4}" height="${pillH / 2 - 2}" rx="${rx - 2}"
              fill="url(#glossHighlight)" />

        <g transform="translate(${pillX + hashX}, ${midY + 11})"><path d="${hashVec.pathData}" fill="${textColor}" fill-opacity="0.9" /></g>
        <g transform="translate(${pillX + numX}, ${midY + 18})"><path d="${numVec.pathData}" fill="${textColor}" /></g>
        <rect x="${pillX + divX}" y="${midY - 18}" width="2" height="36" rx="1" fill="${textColor}" fill-opacity="0.35" />
        <g transform="translate(${pillX + platX}, ${midY + 10})"><path d="${platVec.pathData}" fill="${textColor}" /></g>
      </g>
    </svg>
  `);
}

/* ------------------------------------------------------------------------- */
/* 8. FLOATING CORNER TAG (Étiquette en coin arrondi sans biseau)            */
/* ------------------------------------------------------------------------- */
function renderCornerTag(width, height, rank, platform, color, gradient, isLight) {
  const vH = Math.round(height * 600 / width);
  const hashVec = vectors.hash;
  const numVec = vectors.numbers[rank] || vectors.numbers['1'];
  const platVec = vectors.platforms[platform] || vectors.platforms['NETFLIX'];

  const tagH = 78;
  const rx = 16;
  const padLeft = 24;
  const gapRankToDiv = 18;
  const gapDivToPlat = 18;
  const padRight = 28;

  const hashX = padLeft;
  const numX = hashX + hashVec.width + 4;
  const divX = numX + numVec.width + gapRankToDiv;
  const platX = divX + 2 + gapDivToPlat;
  const tagW = platX + platVec.width + padRight;

  const tagX = 24;
  const tagY = 24;
  const midY = tagY + tagH / 2;

  const g1 = gradient ? gradient[0] : color;
  const g2 = gradient ? gradient[1] : color;
  const textColor = isLight ? '#090b11' : '#ffffff';

  return Buffer.from(`
    <svg width="${width}" height="${height}" viewBox="0 0 600 ${vH}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="cornerTagShadow" x="-30%" y="-30%" width="160%" height="180%">
          <feDropShadow dx="0" dy="10" stdDeviation="12" flood-color="#000000" flood-opacity="0.85"/>
        </filter>
        <linearGradient id="tagGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${g1}"/>
          <stop offset="100%" stop-color="${g2}"/>
        </linearGradient>
      </defs>

      <g filter="url(#cornerTagShadow)">
        <rect x="${tagX}" y="${tagY}" width="${tagW}" height="${tagH}" rx="${rx}"
              fill="url(#tagGrad)" stroke="#ffffff" stroke-opacity="0.35" stroke-width="2" />
        <g transform="translate(${tagX + hashX}, ${midY + 11})"><path d="${hashVec.pathData}" fill="${textColor}" fill-opacity="0.9" /></g>
        <g transform="translate(${tagX + numX}, ${midY + 18})"><path d="${numVec.pathData}" fill="${textColor}" /></g>
        <rect x="${tagX + divX}" y="${midY - 16}" width="2" height="32" rx="1" fill="${textColor}" fill-opacity="0.35" />
        <g transform="translate(${tagX + platX}, ${midY + 10})"><path d="${platVec.pathData}" fill="${textColor}" /></g>
      </g>
    </svg>
  `);
}

/* ------------------------------------------------------------------------- */
/* 9. FROST GLASS NOTCH (Verre givré clair semi-lumineux style Vision Pro)   */
/* ------------------------------------------------------------------------- */
function renderFrostGlass(width, height, rank, platform, color) {
  const vH = Math.round(height * 600 / width);
  const hashVec = vectors.hash;
  const numVec = vectors.numbers[rank] || vectors.numbers['1'];
  const platVec = vectors.platforms[platform] || vectors.platforms['NETFLIX'];

  const pillH = 88;
  const rx = pillH / 2;
  const dotR = 10;
  const padLeft = 24;
  const gapDotToRank = 18;
  const gapRankToDiv = 18;
  const gapDivToPlat = 18;
  const padRight = 32;

  const dotX = padLeft + dotR;
  const hashX = dotX + dotR + gapDotToRank;
  const numX = hashX + hashVec.width + 4;
  const divX = numX + numVec.width + gapRankToDiv;
  const platX = divX + 2 + gapDivToPlat;
  const pillW = platX + platVec.width + padRight;

  const pillX = Math.round((600 - pillW) / 2);
  const pillY = 32;
  const midY = pillY + pillH / 2;

  return Buffer.from(`
    <svg width="${width}" height="${height}" viewBox="0 0 600 ${vH}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="frostShadow" x="-30%" y="-30%" width="160%" height="180%">
          <feDropShadow dx="0" dy="12" stdDeviation="14" flood-color="#000000" flood-opacity="0.85"/>
        </filter>
      </defs>

      <g filter="url(#frostShadow)">
        <!-- Luminous semi-opaque frost glass -->
        <rect x="${pillX}" y="${pillY}" width="${pillW}" height="${pillH}" rx="${rx}"
              fill="#ffffff" fill-opacity="0.22" stroke="#ffffff" stroke-opacity="0.55" stroke-width="2.5" />
        <circle cx="${pillX + dotX}" cy="${midY}" r="${dotR}" fill="${color}" />
        <g transform="translate(${pillX + hashX}, ${midY + 11})"><path d="${hashVec.pathData}" fill="#ffffff" /></g>
        <g transform="translate(${pillX + numX}, ${midY + 18})"><path d="${numVec.pathData}" fill="#ffffff" /></g>
        <rect x="${pillX + divX}" y="${midY - 18}" width="2" height="36" rx="1" fill="#ffffff" fill-opacity="0.45" />
        <g transform="translate(${pillX + platX}, ${midY + 10})"><path d="${platVec.pathData}" fill="#ffffff" /></g>
      </g>
    </svg>
  `);
}

/* ------------------------------------------------------------------------- */
/* 10. STUDIO CINEMA MINIMAL (Badge rectangulaire compact format studio)     */
/* ------------------------------------------------------------------------- */
function renderCinemaMinimal(width, height, rank, platform, color) {
  const vH = Math.round(height * 600 / width);
  const hashVec = vectors.hash;
  const numVec = vectors.numbers[rank] || vectors.numbers['1'];
  const platVec = vectors.platforms[platform] || vectors.platforms['NETFLIX'];

  const boxH = 76;
  const rx = 10;
  const padLeft = 24;
  const gapRankToDiv = 18;
  const gapDivToPlat = 18;
  const padRight = 28;

  const hashX = padLeft;
  const numX = hashX + hashVec.width + 4;
  const divX = numX + numVec.width + gapRankToDiv;
  const platX = divX + 2 + gapDivToPlat;
  const boxW = platX + platVec.width + padRight;

  const boxX = Math.round((600 - boxW) / 2);
  const boxY = 32;
  const midY = boxY + boxH / 2;

  return Buffer.from(`
    <svg width="${width}" height="${height}" viewBox="0 0 600 ${vH}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="cinemaShadow" x="-30%" y="-30%" width="160%" height="180%">
          <feDropShadow dx="0" dy="10" stdDeviation="12" flood-color="#000000" flood-opacity="0.9"/>
        </filter>
      </defs>

      <g filter="url(#cinemaShadow)">
        <!-- Outer Box -->
        <rect x="${boxX}" y="${boxY}" width="${boxW}" height="${boxH}" rx="${rx}"
              fill="#06080d" fill-opacity="0.95" stroke="#ffffff" stroke-opacity="0.3" stroke-width="1.5" />
        <!-- Accent top border line -->
        <rect x="${boxX + 16}" y="${boxY}" width="${boxW - 32}" height="3" rx="1.5" fill="${color}" />

        <g transform="translate(${boxX + hashX}, ${midY + 11})"><path d="${hashVec.pathData}" fill="${color}" /></g>
        <g transform="translate(${boxX + numX}, ${midY + 18})"><path d="${numVec.pathData}" fill="#ffffff" /></g>
        <rect x="${boxX + divX}" y="${midY - 16}" width="2" height="32" rx="1" fill="#ffffff" fill-opacity="0.3" />
        <g transform="translate(${boxX + platX}, ${midY + 10})"><path d="${platVec.pathData}" fill="#f8fafc" /></g>
      </g>
    </svg>
  `);
}

/* Dispatcher */
function generateSvgBadge(width, height, rank, platform, color, gradient, isLight, style = 'neon-notch') {
  switch (style) {
    case 'brand-solid':
      return renderBrandSolid(width, height, rank, platform, color, gradient, isLight);
    case 'split-ticket':
      return renderSplitTicket(width, height, rank, platform, color, isLight);
    case 'corner-ribbon':
      return renderCornerRibbon(width, height, rank, platform, color, isLight);
    case 'netflix-giant':
      return renderNetflixGiant(width, height, rank, platform, color);
    case 'corner-capsule':
      return renderCornerCapsule(width, height, rank, platform, color, isLight);
    case 'gradient-vibrant':
      return renderUltraGradient(width, height, rank, platform, color, gradient, isLight);
    case 'corner-tag':
      return renderCornerTag(width, height, rank, platform, color, gradient, isLight);
    case 'glass-frost':
      return renderFrostGlass(width, height, rank, platform, color);
    case 'cinema-minimal':
      return renderCinemaMinimal(width, height, rank, platform, color);
    case 'neon-notch':
    default:
      return renderNeonNotch(width, height, rank, platform, color);
  }
}

module.exports = async function handler(req, res) {
  try {
    const id = req.query.id || req.query.imdb_id || req.query.tmdb_id;
    const style = req.query.style || 'brand-solid';

    if (!id) {
      return res.status(400).send('Missing parameter "id"');
    }

    const cleanId = String(id).replace(/\.(jpg|jpeg|webp|png)$/i, '').trim();

    const index = await getOrUpdateIndex();
    const itemInfo = index.get(cleanId);

    if (!itemInfo || !itemInfo.posterUrl) {
      return res.status(404).send('Not in Top 10 catalogs');
    }

    const posterRes = await axios.get(itemInfo.posterUrl, {
      responseType: 'arraybuffer',
      timeout: 10000
    });
    const imageBuffer = Buffer.from(posterRes.data);

    const meta = await sharp(imageBuffer).metadata();
    const width = meta.width || 600;
    const height = meta.height || 900;

    const svgBadge = generateSvgBadge(
      width,
      height,
      itemInfo.rank,
      itemInfo.platform,
      itemInfo.color,
      itemInfo.gradient,
      itemInfo.isLight,
      style
    );

    const compositedBuffer = await sharp(imageBuffer)
      .composite([{ input: svgBadge, top: 0, left: 0 }])
      .jpeg({ quality: 92, mozjpeg: true })
      .toBuffer();

    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400');
    return res.status(200).send(compositedBuffer);

  } catch (error) {
    console.error('Error handling poster request:', error.message);
    return res.status(500).send('Internal Server Error: ' + error.message);
  }
};
