const axios = require('axios');
const sharp = require('sharp');

const MANIFEST_BASE = 'https://aiometadatafortheweebs.midnightignite.me/stremio/1609e9ee-c194-445e-b25c-410e88954386';

const CATALOG_CONFIGS = [
  { id: 'flixpatrol.netflix.fr.movie', type: 'movie', platform: 'NETFLIX', color: '#E50914', pillWidth: 155 },
  { id: 'flixpatrol.netflix.fr.series', type: 'series', platform: 'NETFLIX', color: '#E50914', pillWidth: 155 },
  { id: 'flixpatrol.amazon-prime.fr.movie', type: 'movie', platform: 'PRIME VIDEO', color: '#00A8E1', pillWidth: 185 },
  { id: 'flixpatrol.amazon-prime.fr.series', type: 'series', platform: 'PRIME VIDEO', color: '#00A8E1', pillWidth: 185 },
  { id: 'flixpatrol.apple-tv.fr.movie', type: 'movie', platform: 'APPLE TV+', color: '#A2AAAD', pillWidth: 170 },
  { id: 'flixpatrol.apple-tv.fr.series', type: 'series', platform: 'APPLE TV+', color: '#A2AAAD', pillWidth: 170 },
  { id: 'flixpatrol.disney.fr.movie', type: 'movie', platform: 'DISNEY+', color: '#113CCF', pillWidth: 155 },
  { id: 'flixpatrol.disney.fr.series', type: 'series', platform: 'DISNEY+', color: '#113CCF', pillWidth: 155 },
  { id: 'flixpatrol.hbo-max.fr.movie', type: 'movie', platform: 'HBO MAX', color: '#9900EE', pillWidth: 160 },
  { id: 'flixpatrol.hbo-max.fr.series', type: 'series', platform: 'HBO MAX', color: '#9900EE', pillWidth: 160 },
  { id: 'flixpatrol.paramount.fr.movie', type: 'movie', platform: 'PARAMOUNT+', color: '#0064FF', pillWidth: 190 },
  { id: 'flixpatrol.paramount.fr.series', type: 'series', platform: 'PARAMOUNT+', color: '#0064FF', pillWidth: 190 }
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

          // If not already in index, add it
          if (!newIndex.has(cleanId)) {
            newIndex.set(cleanId, {
              rank: idx + 1,
              platform: cat.platform,
              color: cat.color,
              pillWidth: cat.pillWidth,
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

function generateSvgBadge(width, height, rank, platform, color, pillWidth = 160) {
  const pillX = 24;
  const pillY = 24;
  const pillH = 46;
  const rx = pillH / 2;

  return Buffer.from(`
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="shadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="6" stdDeviation="6" flood-color="#000000" flood-opacity="0.65"/>
        </filter>
      </defs>
      <g filter="url(#shadow)">
        <!-- Glassmorphism dark pill background -->
        <rect x="${pillX}" y="${pillY}" width="${pillWidth}" height="${pillH}" rx="${rx}"
              fill="#0c0e18" fill-opacity="0.86" stroke="rgba(255,255,255,0.22)" stroke-width="1.5" />
        
        <!-- Platform Color Dot -->
        <circle cx="${pillX + 18}" cy="${pillY + pillH / 2}" r="5.5" fill="${color}" />
        
        <!-- Rank Number -->
        <text x="${pillX + 34}" y="${pillY + pillH / 2 + 7}" 
              font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" 
              font-weight="900" font-size="20" fill="#ffffff">#${rank}</text>
        
        <!-- Platform Name -->
        <text x="${pillX + 70}" y="${pillY + pillH / 2 + 5}" 
              font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" 
              font-weight="800" font-size="12" fill="#cbd5e1" letter-spacing="1.1">${platform}</text>
      </g>
    </svg>
  `);
}

module.exports = async function handler(req, res) {
  try {
    // Support ?id=... or route param
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

    // Fetch original poster
    const posterRes = await axios.get(itemInfo.posterUrl, {
      responseType: 'arraybuffer',
      timeout: 10000
    });
    const imageBuffer = Buffer.from(posterRes.data);

    // Get dimensions
    const meta = await sharp(imageBuffer).metadata();
    const width = meta.width || 600;
    const height = meta.height || 900;

    // Generate badge SVG
    const svgBadge = generateSvgBadge(
      width,
      height,
      itemInfo.rank,
      itemInfo.platform,
      itemInfo.color,
      itemInfo.pillWidth
    );

    // Composite badge onto poster
    const compositedBuffer = await sharp(imageBuffer)
      .composite([{ input: svgBadge, top: 0, left: 0 }])
      .jpeg({ quality: 88, mozjpeg: true })
      .toBuffer();

    // Set aggressive cache headers for Vercel Edge CDN & Stremio
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400');
    return res.status(200).send(compositedBuffer);

  } catch (error) {
    console.error('Error handling poster request:', error.message);
    return res.status(500).send('Internal Server Error: ' + error.message);
  }
};
