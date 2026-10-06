const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'assets', 'logos');

function cleanSvg(svg, defaultFill) {
  let s = svg.replace(/<\?xml.*?\?>/i, '').replace(/<!--[\s\S]*?-->/g, '').trim();
  s = s.replace(/width="[^"]*"/g, '').replace(/height="[^"]*"/g, '');
  if (!s.includes('fill=') && defaultFill) {
    s = s.replace('<svg', `<svg fill="${defaultFill}"`);
  }
  return s;
}

const logos = {
  'netflix': cleanSvg(fs.readFileSync(path.join(dir, 'netflix.svg'), 'utf8'), '#E50914'),
  'amazon-prime': cleanSvg(fs.readFileSync(path.join(dir, 'amazon-prime.svg'), 'utf8'), '#00A8E1'),
  'apple-tv': cleanSvg(fs.readFileSync(path.join(dir, 'apple-tv.svg'), 'utf8'), '#ffffff'),
  'disney': cleanSvg(fs.readFileSync(path.join(dir, 'disney.svg'), 'utf8'), '#ffffff'),
  'hbo-max': cleanSvg(fs.readFileSync(path.join(dir, 'hbo-max.svg'), 'utf8'), '#ffffff'),
  'paramount': cleanSvg(fs.readFileSync(path.join(dir, 'paramount.svg'), 'utf8'), '#0064FF')
};

fs.writeFileSync(path.join(__dirname, 'assets', 'clean-logos.json'), JSON.stringify(logos));
console.log('Clean logos exported successfully!');
