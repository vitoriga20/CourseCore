const fs = require('fs');
const sharp = require('sharp');
const orig = fs.readFileSync('Page 1.svg', 'utf8');
const screenW = 16796.4004 / 11;
async function render(idx) {
  const x = idx * screenW;
  const targetH = Math.round(3424.8 * 1440 / screenW);
  const modified = orig.replace(
    '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="16796.4004" height="3424.8"',
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1440" height="${targetH}" viewBox="${x} 0 ${screenW} 3424.8"`
  );
  fs.writeFileSync(`_s${idx}.svg`, modified);
  await sharp(`_s${idx}.svg`, { density: 150 }).png().toFile(`d${idx}.png`);
  console.log(`d${idx}.png done`);
}
(async () => { for (const i of [7, 8, 10]) await render(i); console.log('all done'); })().catch(e => console.error(e));