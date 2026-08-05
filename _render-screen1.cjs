// 重新渲染设计稿 Screen 1（概览页）为高分辨率 PNG
const fs = require('fs');
const sharp = require('sharp');

const orig = fs.readFileSync('Page 1.svg', 'utf8');
// Screen 1 概览页大约在 x=1399 到 x=1399+1527 位置
// 用 viewBox 截取这一段
const x = 1399;
const w = 1527;
const modified = orig.replace(
  '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="16796.4004" height="3424.8"',
  `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1440" height="${Math.round(3424.8 * 1440 / w)}" viewBox="${x} 0 ${w} 3424.8"`
);
fs.writeFileSync('_screen1-hd.svg', modified);
sharp('_screen1-hd.svg', { density: 200 }).png().toFile('screen1-design.png')
  .then(() => console.log('done'))
  .catch(e => console.error(e));
