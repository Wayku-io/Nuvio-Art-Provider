const sharp = require('sharp');
const axios = require('axios');
const fs = require('fs');

async function testBadge() {
  const posterUrl = 'https://image.tmdb.org/t/p/w600_and_h900_bestv2/39aMkR8Y5vhCG9dTkjiqRl8AVqp.jpg';
  const resp = await axios.get(posterUrl, { responseType: 'arraybuffer' });
  const imageBuffer = Buffer.from(resp.data);
  const meta = await sharp(imageBuffer).metadata();
  console.log('Original image dimensions:', meta.width, 'x', meta.height);

  const platform = 'NETFLIX';
  const rank = 1;
  const color = '#E50914';

  const pillX = 24;
  const pillY = 24;
  const pillH = 46;
  const pillW = 160;
  const rx = pillH / 2;

  const svg = Buffer.from(`
    <svg width="${meta.width}" height="${meta.height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="shadow" x="-20%" y="-20%" width="150%" height="150%">
          <feDropShadow dx="0" dy="6" stdDeviation="5" flood-color="#000000" flood-opacity="0.6"/>
        </filter>
      </defs>
      <g filter="url(#shadow)">
        <rect x="${pillX}" y="${pillY}" width="${pillW}" height="${pillH}" rx="${rx}"
              fill="#0d101a" fill-opacity="0.88" stroke="rgba(255,255,255,0.22)" stroke-width="1.5" />
        <circle cx="${pillX + 18}" cy="${pillY + pillH/2}" r="5.5" fill="${color}" />
        <text x="${pillX + 34}" y="${pillY + pillH/2 + 7}" font-family="Arial, Helvetica, sans-serif" font-weight="900" font-size="20" fill="#ffffff">#${rank}</text>
        <text x="${pillX + 70}" y="${pillY + pillH/2 + 5}" font-family="Arial, Helvetica, sans-serif" font-weight="800" font-size="12" fill="#cbd5e1" letter-spacing="1.2">${platform}</text>
      </g>
    </svg>
  `);

  const output = await sharp(imageBuffer)
    .composite([{ input: svg, top: 0, left: 0 }])
    .jpeg({ quality: 90 })
    .toBuffer();

  fs.writeFileSync('test_badge.jpg', output);
  console.log('Saved test_badge.jpg, size:', output.length);
}

testBadge().catch(console.error);
