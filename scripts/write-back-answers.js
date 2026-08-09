// 将 all-results.json 的答案/解析写回 Supabase questions 表
// 用法: node scripts/write-back-answers.js
import { createClient } from '@supabase/supabase-js';
import { WebSocket } from 'ws';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const envPath = path.resolve(rootDir, '.env.local');

function loadEnvLocal() {
  if (!fs.existsSync(envPath)) return {};
  const content = fs.readFileSync(envPath, 'utf-8');
  const env = {};
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

const env = loadEnvLocal();
const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
  realtime: { enabled: false, transport: WebSocket }
});

const results = JSON.parse(fs.readFileSync(path.join(__dirname, 'all-results.json'), 'utf8'));

async function main() {
  let ok = 0, fail = 0;
  const errors = [];
  for (const r of results) {
    const payload = { solution: r.solution ?? null, updated_at: new Date().toISOString() };
    if (r.answer !== null && r.answer !== undefined) payload.answer = String(r.answer);
    if (r.answers !== null && r.answers !== undefined) {
      payload.answers = Array.isArray(r.answers) ? r.answers.map(String) : [];
    }
    const { error } = await supabase.from('questions').update(payload).eq('id', r.id);
    if (error) { fail++; errors.push({ id: r.id, msg: error.message }); }
    else ok++;
  }
  console.log(`成功 ${ok} 条, 失败 ${fail} 条`);
  if (errors.length) console.log('失败明细:', JSON.stringify(errors, null, 2));
}

main().catch(e => { console.error('错误:', e.message); process.exit(1); });