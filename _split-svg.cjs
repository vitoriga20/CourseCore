// 按 viewBox 分段切 11 个 Screen 为独立 PNG
const fs = require('fs');
const sharp = require('sharp');
const path = require('path');

const orig = fs.readFileSync('Page 1.svg', 'utf8');
const TOTAL_W = 16796.4004;
const SCREEN_COUNT = 11;
const screenW = TOTAL_W / SCREEN_COUNT; // ≈ 1527

async function main() {
  for (let i = 0; i < SCREEN_COUNT; i++) {
    const x = i * screenW;
    // 提取一个 Screen 区域，渲染为 1440 宽（保持比例）
    const targetH = Math.round(3424.8 * 1440 / screenW);
    const modified = orig.replace(
      '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="16796.4004" height="3424.8"',
      `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1440" height="${targetH}" viewBox="${x} 0 ${screenW} 3424.8"`
    );
    fs.writeFileSync(`_temp-screen${i + 1}.svg`, modified);
    await sharp(`_temp-screen${i + 1}.svg`, { density: 150 }).png().toFile(`screen${i + 1}.png`);
    console.log(`screen${i + 1}.png done`);
  }
}

main().then(() => console.log('all done')).catch(e => { console.error(e); process.exit(1); });