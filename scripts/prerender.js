import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getStaticPaths } from '../src/config/routes.js';
import { COURSES } from '../src/data/courses.js';
import { QUESTIONS } from '../src/data/questions.js';
import { EXAM_PAPERS } from '../src/data/examPapers.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dist = path.resolve(__dirname, '../dist');
const indexPath = path.join(dist, 'index.html');

if (!fs.existsSync(indexPath)) {
  console.error('dist/index.html not found. Run vite build first.');
  process.exit(1);
}

const template = fs.readFileSync(indexPath, 'utf-8');
const paths = getStaticPaths(COURSES, QUESTIONS, EXAM_PAPERS);

for (const p of paths) {
  const targetDir = path.join(dist, p);
  fs.mkdirSync(targetDir, { recursive: true });
  fs.writeFileSync(path.join(targetDir, 'index.html'), template);
}

console.log(`Prerendered ${paths.length} static routes into dist/.`);
