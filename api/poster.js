const axios = require('axios');
const sharp = require('sharp');
const vectors = require('../assets/vectors-outfit.json');

const MANIFEST_BASE = 'https://aiometadatafortheweebs.midnightignite.me/stremio/1609e9ee-c194-445e-b25c-410e88954386';

const CATALOG_CONFIGS = [
  { id: 'flixpatrol.netflix.fr.movie', type: 'movie', platform: 'NETFLIX', color: '#E50914' },
  { id: 'flixpatrol.netflix.fr.series', type: 'series', platform: 'NETFLIX', color: '#E50914' },
  { id: 'flixpatrol.amazon-prime.fr.movie', type: 'movie', platform: 'PRIME VIDEO', color: '#00A8E1' },
  { id: 'flixpatrol.amazon-prime.fr.series', type: 'series', platform: 'PRIME VIDEO', color: '#00A8E1' },
  { id: 'flixpatrol.apple-tv.fr.movie', type: 'movie', platform: 'APPLE TV+', color: '#A2AAAD' },
  { id: 'flixpatrol.apple-tv.fr.series', type: 'series', platform: 'APPLE TV+', color: '#A2AAAD' },
  { id: 'flixpatrol.disney.fr.movie', type: 'movie', platform: 'DISNEY+', color: '#113CCF' },
  { id: 'flixpatrol.disney.fr.series', type: 'series', platform: 'DISNEY+', color: '#113CCF' },
  { id: 'flixpatrol.hbo-max.fr.movie', type: 'movie', platform: 'HBO MAX', color: '#9900EE' },
  { id: 'flixpatrol.hbo-max.fr.series', type: 'series', platform: 'HBO MAX', color: '#9900EE' },
  { id: 'flixpatrol.paramount.fr.movie', type: 'movie', platform: 'PARAMOUNT+', color: '#0064FF' },
  { id: 'flixpatrol.paramount.fr.series', type: 'series', platform: 'PARAMOUNT+', color: '#0064FF' }
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

function generateSvgBadge(width, height, rank, platform, color) {
  const virtualHeight = Math.round(height * 600 / width);

  const hashVec = vectors.hash;
  const numVec = vectors.numbers[rank] || vectors.numbers['1'];
  const platVec = vectors.platforms[platform] || vectors.platforms['NETFLIX'];

  // Dimensions designed for 3x TV readability
  const pillH = 88;
  const rx = pillH / 2;
  const padLeft = 24;
  const dotR = 11;
  const gapDotToRank = 20;
  const gapRankToDiv = 18;
  const gapDivToPlat = 18;
  const padRight = 30;

  const dotX = padLeft + dotR;
  const hashX = dotX + dotR + gapDotToRank;
  const numX = hashX + hashVec.width + 2;
  const divX = numX + numVec.width + gapRankToDiv;
  const platX = divX + 2 + gapDivToPlat;
  const pillW = platX + platVec.width + padRight;

  // Center horizontally like iPhone notch / Dynamic Island
  const pillX = Math.round((600 - pillW) / 2);
  const pillY = 32;

  const midY = pillY + pillH / 2;
  const hashY = midY + 11;
  const numY = midY + 17;
  const platY = midY + 9;

  return Buffer.from(`
    <svg width="${width}" height="${height}" viewBox="0 0 600 ${virtualHeight}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <!-- Deep drop shadow for TV distance readability -->
        <filter id="notchShadow" x="-30%" y="-30%" width="160%" height="180%">
          <feDropShadow dx="0" dy="10" stdDeviation="10" flood-color="#000000" flood-opacity="0.85"/>
          <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#000000" flood-opacity="0.5"/>
        </filter>
        <filter id="dotGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="blur" />
        </filter>
        <linearGradient id="glassBorder" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="0.45"/>
          <stop offset="100%" stop-color="#ffffff" stop-opacity="0.12"/>
        </linearGradient>
      </defs>

      <g filter="url(#notchShadow)">
        <!-- Centered Glassmorphic Pill -->
        <rect x="${pillX}" y="${pillY}" width="${pillW}" height="${pillH}" rx="${rx}"
              fill="#090b14" fill-opacity="0.90" stroke="url(#glassBorder)" stroke-width="2" />
        
        <!-- Platform Color Glow + Dot -->
        <circle cx="${pillX + dotX}" cy="${midY}" r="${dotR + 4}" fill="${color}" opacity="0.45" filter="url(#dotGlow)" />
        <circle cx="${pillX + dotX}" cy="${midY}" r="${dotR}" fill="${color}" />

        <!-- Hash symbol in Outfit font -->
        <g transform="translate(${pillX + hashX}, ${hashY})">
          <path d="${hashVec.pathData}" fill="${color}" />
        </g>

        <!-- Rank number in Outfit ExtraBold -->
        <g transform="translate(${pillX + numX}, ${numY})">
          <path d="${numVec.pathData}" fill="#ffffff" />
        </g>

        <!-- Vertical Glass Divider -->
        <rect x="${pillX + divX}" y="${midY - 18}" width="2" height="36" rx="1" fill="#ffffff" fill-opacity="0.22" />

        <!-- Platform Name in Outfit ExtraBold -->
        <g transform="translate(${pillX + platX}, ${platY})">
          <path d="${platVec.pathData}" fill="#f1f5f9" />
        </g>
      </g>
    </svg>
  `);
}

module.exports = async function handler(req, res) {
  try {
    const id = req.query.id || req.query.imdb_id || req.query.tmdb_id;

    if (!id) {
      return res.status(400).send('Missing parameter "id"');
    }

    const cleanId = String(id).replace(/\.(jpg|jpeg|webp|png)$/i, '').trim();

    const index = await getOrUpdateIndex();
    const itemInfo = index.get(cleanId);

    if (!itemInfo || !itemInfo.posterUrl) {
      // Not in any Top 10 catalog: return 404 so AIO Metadata gracefully uses default poster
      return res.status(404).send('Not in Top 10 catalogs');
    }

    // Fetch original poster from TMDB
    const posterRes = await axios.get(itemInfo.posterUrl, {
      responseType: 'arraybuffer',
      timeout: 10000
    });
    const imageBuffer = Buffer.from(posterRes.data);

    // Get dimensions
    const meta = await sharp(imageBuffer).metadata();
    const width = meta.width || 600;
    const height = meta.height || 900;

    // Generate badge SVG (3x centered dynamic notch style)
    const svgBadge = generateSvgBadge(
      width,
      height,
      itemInfo.rank,
      itemInfo.platform,
      itemInfo.color
    );

    // Composite badge onto poster
    const compositedBuffer = await sharp(imageBuffer)
      .composite([{ input: svgBadge, top: 0, left: 0 }])
      .jpeg({ quality: 92, mozjpeg: true })
      .toBuffer();

    // Cache headers for Edge CDN & Stremio
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400');
    return res.status(200).send(compositedBuffer);

  } catch (error) {
    console.error('Error handling poster request:', error.message);
    return res.status(500).send('Internal Server Error: ' + error.message);
  }
};
