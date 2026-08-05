const fs = require('fs');
const sharp = require('sharp');
const orig = fs.readFileSync('Page 1.svg', 'utf8');
const screenW = 16796.4004 / 11;
const x = 9 * screenW;
const w = 3 * screenW;
const targetH = Math.round(3424.8 * 2880 / w);
const modified = orig.replace(
  '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="16796.4004" height="3424.8"',
  `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="2880" height="${targetH}" viewBox="${x} 0 ${w} 3424.8"`
);
fs.writeFileSync('_w.svg', modified);
sharp('_w.svg', { density: 100 }).png().toFile('slider-wide.png').then(() => console.log('done'));