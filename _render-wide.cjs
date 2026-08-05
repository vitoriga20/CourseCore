// 渲染 seg5 用 2x 宽度看 Screen 4 错题库完整布局
const fs = require('fs');
const sharp = require('sharp');

const orig = fs.readFileSync('Page 1.svg', 'utf8');
const screenW = 16796.4004 / 11;

// 从 seg5 (idx=4) 开始，宽度 = 4 * screenW (覆盖到 seg8 末尾)
const x = 4 * screenW;
const w = 4 * screenW;
const targetH = Math.round(3424.8 * 1440 / w);

const modified = orig.replace(
  '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="16796.4004" height="3424.8"',
  `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="2880" height="${targetH}" viewBox="${x} 0 ${w} 3424.8"`
);
fs.writeFileSync('_wide-seg5-8.svg', modified);
sharp('_wide-seg5-8.svg', { density: 100 }).png().toFile('design-seg5-8-wide.png')
  .then(() => console.log('done'))
  .catch(e => console.error(e));