// 后端认证与同步链路端到端测试
// 运行：node scripts/test-auth-flow.js

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
  console.error('缺少 VITE_SUPABASE_URL 或 VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false }
});

const TEST_EMAIL = 'coursecore.e2e.run2@gmail.com';
const TEST_PASSWORD = 'Test1234!';
const TEST_ITEM_ID = 'p1b-m1-01-training';
const TEST_QUESTION_ID = 'q-test-001';

async function cleanup(userId) {
  await supabase.from('answers').delete().eq('user_id', userId).eq('item_id', TEST_ITEM_ID);
  await supabase.from('progress').delete().eq('user_id', userId).eq('item_id', TEST_ITEM_ID);
}

async function test() {
  console.log('开始认证与同步链路测试...\n');

  // 1. 注册或登录
  let userId;
  let signUp = false;
  {
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    });

    if (signUpData.user && !signUpError) {
      userId = signUpData.user.id;
      signUp = true;
      if (!signUpData.session) {
        throw new Error('注册成功但未返回 session，说明 Supabase 开启了邮箱验证（Confirm email）。请到 Supabase Dashboard → Authentication → Providers → Email 关闭 Confirm email 后重试。');
      }
      console.log('✓ 注册成功');
    } else if (signUpError?.message?.includes('already registered') || signUpError?.code === 'user_already_exists') {
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: TEST_EMAIL,
        password: TEST_PASSWORD
      });
      if (signInError) throw new Error('登录失败：' + signInError.message);
      userId = signInData.user.id;
      console.log('✓ 用户已存在，登录成功');
    } else if (signUpError?.message?.includes('Email not confirmed')) {
      throw new Error('邮箱验证已开启，请先关闭 Supabase Auth 的 Confirm email 设置，或确认测试邮箱。');
    } else {
      throw new Error('注册失败：' + (signUpError?.message || '未知错误'));
    }
  }

  console.log(`  userId: ${userId}`);

  // 2. 清理旧测试数据
  await cleanup(userId);

  // 3. 验证 profile 触发器
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (profileError || !profile) throw new Error('profile 触发器未创建记录：' + profileError?.message);
  console.log(`✓ profile 存在，role=${profile.role}`);

  // 4. 写入答案
  const { error: answerError } = await supabase.from('answers').insert({
    user_id: userId,
    item_id: TEST_ITEM_ID,
    question_id: TEST_QUESTION_ID,
    answer: { value: 'B' },
    is_correct: true
  });
  if (answerError) throw new Error('写入 answers 失败：' + answerError.message);
  console.log('✓ 写入 answers');

  // 5. 写入进度
  const { error: progressError } = await supabase.from('progress').upsert({
    user_id: userId,
    item_id: TEST_ITEM_ID,
    status: 'completed',
    score: 1.0,
    updated_at: new Date().toISOString()
  }, { onConflict: ['user_id', 'item_id'] });
  if (progressError) throw new Error('写入 progress 失败：' + progressError.message);
  console.log('✓ 写入 progress');

  // 6. 读取回来
  const { data: answers, error: answersReadError } = await supabase
    .from('answers')
    .select('*')
    .eq('user_id', userId)
    .eq('item_id', TEST_ITEM_ID);
  if (answersReadError) throw new Error('读取 answers 失败：' + answersReadError.message);
  if (answers.length !== 1 || answers[0].question_id !== TEST_QUESTION_ID) {
    throw new Error('answers 数据不匹配');
  }
  console.log('✓ 读取 answers 正确');

  const { data: progress, error: progressReadError } = await supabase
    .from('progress')
    .select('*')
    .eq('user_id', userId)
    .eq('item_id', TEST_ITEM_ID)
    .single();
  if (progressReadError) throw new Error('读取 progress 失败：' + progressReadError.message);
  if (progress.status !== 'completed') throw new Error('progress 数据不匹配');
  console.log('✓ 读取 progress 正确');

  // 7. 清理
  await cleanup(userId);
  console.log('✓ 清理测试数据');

  console.log('\n后端认证与同步链路测试全部通过。');
  if (signUp) {
    console.log('注意：测试用户已保留在 auth.users 中，如需删除请手动在 Supabase Dashboard 操作。');
  }
}

test().catch(e => {
  console.error('\n测试失败：', e.message);
  process.exit(1);
});
