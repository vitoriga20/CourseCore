import { glob } from 'node:fs/promises';
import path from 'node:path';
import fs from 'node:fs/promises';
import sharp from 'sharp';

const ROOT = 'public/physics';
const MAX_WIDTH = 1200;
const JPEG_QUALITY = 80;
const WEBP_QUALITY = 80;

async function compressImage(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const originalStat = await fs.stat(filePath);
  const originalSize = originalStat.size;

  const inputBuffer = await fs.readFile(filePath);
  const pipeline = sharp(inputBuffer).resize({
    width: MAX_WIDTH,
    withoutEnlargement: true,
    fit: 'inside'
  });

  let outputBuffer;
  let outputExt = ext;

  if (ext === '.png') {
    const meta = await sharp(inputBuffer).metadata();
    const hasAlpha = meta.hasAlpha;
    if (hasAlpha) {
      outputBuffer = await pipeline.png({ quality: 90, compressionLevel: 9 }).toBuffer();
    } else {
      outputBuffer = await pipeline.jpeg({ quality: JPEG_QUALITY, mozjpeg: true }).toBuffer();
      outputExt = '.jpg';
    }
  } else if (ext === '.jpg' || ext === '.jpeg') {
    outputBuffer = await pipeline.jpeg({ quality: JPEG_QUALITY, mozjpeg: true }).toBuffer();
  } else if (ext === '.webp') {
    outputBuffer = await pipeline.webp({ quality: WEBP_QUALITY }).toBuffer();
  } else if (ext === '.gif') {
    // Skip animated GIFs to avoid losing animation
    return null;
  } else {
    return null;
  }

  const newPath = ext !== outputExt
    ? filePath.slice(0, -ext.length) + outputExt
    : filePath;

  await fs.writeFile(newPath, outputBuffer);
  if (newPath !== filePath) {
    await fs.unlink(filePath);
  }

  const newSize = (await fs.stat(newPath)).size;
  return {
    original: filePath,
    new: newPath,
    originalSize,
    newSize,
    ratio: originalSize > 0 ? ((originalSize - newSize) / originalSize * 100).toFixed(1) : '0.0'
  };
}

async function main() {
  const files = [];
  for await (const entry of glob(`${ROOT}/**/*.{jpg,jpeg,png,webp,gif}`)) {
    files.push(entry);
  }

  if (files.length === 0) {
    console.log('No images found under', ROOT);
    return;
  }

  let totalOriginal = 0;
  let totalNew = 0;
  const results = [];

  for (const file of files) {
    try {
      const result = await compressImage(file);
      if (result) {
        results.push(result);
        totalOriginal += result.originalSize;
        totalNew += result.newSize;
        console.log(`[${result.ratio}%] ${result.original} -> ${result.new} (${formatKB(result.originalSize)} -> ${formatKB(result.newSize)})`);
      } else {
        console.log(`[skip] ${file}`);
      }
    } catch (err) {
      console.error(`[error] ${file}: ${err.message}`);
    }
  }

  console.log('\n--- Summary ---');
  console.log(`Processed: ${results.length}/${files.length}`);
  console.log(`Total original: ${formatKB(totalOriginal)}`);
  console.log(`Total compressed: ${formatKB(totalNew)}`);
  console.log(`Saved: ${((totalOriginal - totalNew) / totalOriginal * 100).toFixed(1)}%`);
}

function formatKB(bytes) {
  return `${(bytes / 1024).toFixed(2)} KB`;
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
