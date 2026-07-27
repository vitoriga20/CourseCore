// 验证 Supabase 连接与基础表结构
// 运行：node scripts/test-supabase-connection.js

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '../.env.local');

function loadEnvLocal() {
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, 'utf-8');
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvLocal();

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error('缺少 VITE_SUPABASE_URL 或 VITE_SUPABASE_ANON_KEY，请检查 .env.local');
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false }
});

async function test() {
  console.log('测试 Supabase 连接...\n');

  // 1. 测试认证服务是否可达
  try {
    const { error } = await supabase.auth.signInWithPassword({
      email: 'non-existent-test@example.com',
      password: 'wrong-password'
    });
    if (error && (error.message.includes('Invalid login credentials') || error.message.includes('Email not confirmed'))) {
      console.log('✓ 认证服务可访问');
    } else {
      console.log('? 认证返回异常：', error?.message || '未知');
    }
  } catch (e) {
    console.error('✗ 认证服务连接失败：', e.message);
    process.exit(1);
  }

  // 2. 测试匿名用户是否被 RLS 正确拦截
  const tables = ['profiles', 'answers', 'progress'];
  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select('*').limit(1);
      if (error) {
        if (error.code === 'PGRST116' || error.message.includes('row-level security')) {
          console.log(`✓ ${table} 表存在且已开启 RLS`);
        } else if (error.code === '42P01' || error.message.includes('relation') && error.message.includes('does not exist')) {
          console.log(`✗ ${table} 表不存在，请运行 scripts/supabase-schema.sql`);
        } else {
          console.log(`? ${table} 返回：`, error.message);
        }
      } else {
        console.log(`✓ ${table} 表可查询（匿名返回 ${data.length} 行）`);
      }
    } catch (e) {
      console.log(`✗ ${table} 查询失败：`, e.message);
    }
  }

  console.log('\n完成。');
}

test().catch(e => {
  console.error(e);
  process.exit(1);
});
