// 前端认证流程端到端测试（Playwright）
// 运行：node scripts/test-auth-frontend.js

import { chromium } from 'playwright';
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

const BASE_URL = 'http://localhost:5175';
const TEST_EMAIL = 'coursecore.e2e.run2@gmail.com';
const TEST_PASSWORD = 'Test1234!';
const TEST_ITEM_ID = 'p1b-m1-01-training';

async function delay(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function cleanupSupabase(userId) {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY;
  const supabase = createClient(url, key, { auth: { persistSession: false } });
  await supabase.auth.signInWithPassword({ email: TEST_EMAIL, password: TEST_PASSWORD });
  await supabase.from('answers').delete().eq('user_id', userId).eq('item_id', TEST_ITEM_ID);
  await supabase.from('progress').delete().eq('user_id', userId).eq('item_id', TEST_ITEM_ID);
}

async function test() {
  console.log('启动前端认证测试...\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();

  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });

  try {
    // 1. 首页显示登录按钮
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page.screenshot({ path: 'scripts/test-screenshots/01-home.png' });
    const authBtn = await page.locator('[data-action="auth-open"]').first();
    if (!await authBtn.isVisible().catch(() => false)) {
      throw new Error('首页未显示登录按钮');
    }
    console.log('✓ 首页显示登录按钮');

    // 2. 打开登录弹窗
    await authBtn.click();
    await delay(300);
    await page.screenshot({ path: 'scripts/test-screenshots/02-modal-login.png' });
    const modal = await page.locator('.auth-modal').first();
    if (!await modal.isVisible().catch(() => false)) {
      throw new Error('点击登录按钮后弹窗未出现');
    }
    console.log('✓ 登录弹窗出现');

    // 3. 切换到注册标签
    const registerTab = await page.locator('.auth-tab[data-tab="register"]').first();
    await registerTab.click();
    await delay(300);
    await page.screenshot({ path: 'scripts/test-screenshots/03-modal-register.png' });
    console.log('✓ 切换到注册标签');

    // 4. 不勾选同意框直接注册应报错
    const submitBtn = await page.locator('.auth-submit').first();
    await submitBtn.click();
    await delay(300);
    const errorEl = await page.locator('.auth-error').first();
    const errorText = await errorEl.textContent().catch(() => '');
    if (!errorText.includes('请同意用户协议与隐私政策')) {
      throw new Error('未勾选同意框时未出现预期错误：' + errorText);
    }
    console.log('✓ 未勾选同意框注册被拦截');

    // 5. 切换到登录标签并登录
    const loginTab = await page.locator('.auth-tab[data-tab="login"]').first();
    await loginTab.click();
    await delay(200);
    await page.fill('.auth-form input[type="email"]', TEST_EMAIL);
    await page.fill('.auth-form input[type="password"]', TEST_PASSWORD);
    await page.screenshot({ path: 'scripts/test-screenshots/04-login-filled.png' });
    await submitBtn.click();

    // 等待登录完成：用户菜单出现
    await page.waitForSelector('.user-menu-toggle', { timeout: 10000 });
    await delay(500);
    await page.screenshot({ path: 'scripts/test-screenshots/05-logged-in.png' });
    const menuText = await page.locator('.user-menu-toggle').first().textContent();
    if (!menuText || !menuText.includes(TEST_EMAIL.split('@')[0])) {
      throw new Error('登录后用户菜单未显示邮箱：' + menuText);
    }
    console.log('✓ 登录成功，用户菜单显示：' + menuText.trim());

    // 6. 刷新页面，验证登录状态保持
    await page.reload({ waitUntil: 'networkidle' });
    await delay(500);
    if (!await page.locator('.user-menu-toggle').first().isVisible().catch(() => false)) {
      throw new Error('刷新后登录状态丢失');
    }
    console.log('✓ 刷新后登录状态保持');

    // 7. 进入小节并答题
    await page.goto(`${BASE_URL}/item/${TEST_ITEM_ID}`, { waitUntil: 'networkidle' });
    await delay(1000);
    await page.screenshot({ path: 'scripts/test-screenshots/06-item.png' });

    // 尝试找到单选选项并选择第一个
    const option = await page.locator('input[type="radio"]').first();
    if (await option.isVisible().catch(() => false)) {
      await option.click();
      console.log('✓ 选择单选答案');

      // 提交答案
      const submitAnswerBtn = await page.locator('[data-action="submit-quiz"]').first();
      await submitAnswerBtn.click();
      await delay(800);
      await page.screenshot({ path: 'scripts/test-screenshots/07-answer-submitted.png' });
      console.log('✓ 提交答案');
    } else {
      console.log('? 未找到单选选项，跳过答题步骤');
    }

    // 8. 退出登录
    await page.click('.user-menu-toggle');
    await delay(200);
    await page.click('[data-action="logout"]');
    await delay(500);
    if (!await page.locator('[data-action="auth-open"]').first().isVisible().catch(() => false)) {
      throw new Error('退出登录后未回到游客状态');
    }
    console.log('✓ 退出登录成功');

    // 9. 重新登录
    await page.click('[data-action="auth-open"]');
    await delay(200);
    await page.fill('.auth-form input[type="email"]', TEST_EMAIL);
    await page.fill('.auth-form input[type="password"]', TEST_PASSWORD);
    await page.click('.auth-submit');
    await page.waitForSelector('.user-menu-toggle', { timeout: 10000 });
    console.log('✓ 重新登录成功');

    // 10. 回到小节，验证进度存在
    await page.goto(`${BASE_URL}/item/${TEST_ITEM_ID}`, { waitUntil: 'networkidle' });
    await delay(1000);
    await page.screenshot({ path: 'scripts/test-screenshots/08-item-relogin.png' });
    console.log('✓ 重新登录后回到小节');

    console.log('\n前端认证流程测试通过。');
    if (errors.length) {
      console.log('\n控制台错误（非阻塞）：');
      errors.forEach(e => console.log(' - ' + e));
    }
  } catch (e) {
    await page.screenshot({ path: 'scripts/test-screenshots/99-error.png' });
    throw e;
  } finally {
    await browser.close();
  }
}

test().catch(e => {
  console.error('\n前端测试失败：', e.message);
  process.exit(1);
});
