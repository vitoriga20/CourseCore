import { PLATFORM } from '../data/platform.js';
import { escapeHtml } from '../utils.js';

function renderPage(title, sections) {
  return `
    <div class="max-w-3xl mx-auto">
      <h1 class="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4" style="color: var(--fg);">${escapeHtml(title)}</h1>
      <p class="mb-8" style="color: var(--muted);">更新日期：2026 年 7 月 27 日 | 适用产品：${escapeHtml(PLATFORM.name)}</p>

      <div class="space-y-8">
        ${sections.map(s => `
          <section class="card">
            <h2 class="text-xl font-bold mb-3" style="color: var(--fg);">${escapeHtml(s.heading)}</h2>
            <div class="text-sm leading-7" style="color: var(--muted);">
              ${s.body}
            </div>
          </section>
        `).join('')}
      </div>

      <div class="mt-10 text-center">
        <a href="/" class="btn-pill btn-primary">返回首页</a>
      </div>
    </div>
  `;
}

export function renderPrivacy() {
  return renderPage('隐私政策', [
    {
      heading: '我们收集哪些信息',
      body: `
        <p>为提供学习进度同步与账号服务，我们可能在您注册或使用时收集以下信息：</p>
        <ul class="list-disc pl-5 mt-2 space-y-1">
          <li>邮箱地址（用于登录与身份识别）；</li>
          <li>学习进度、做题记录、小节完成状态（用于跨设备同步）；</li>
          <li>设备本地标识（游客模式下仅保存在本地浏览器，不上传服务器）。</li>
        </ul>
      `
    },
    {
      heading: '我们如何使用信息',
      body: `
        <p>您的信息仅用于：</p>
        <ul class="list-disc pl-5 mt-2 space-y-1">
          <li>维持账号登录状态与安全保障；</li>
          <li>记录并同步您的学习进度与答题历史；</li>
          <li>改进课程内容与学习体验。</li>
        </ul>
        <p class="mt-2">我们不会将您的个人数据出售给第三方，也不会用于与本产品无关的广告投放。</p>
      `
    },
    {
      heading: '数据存储与安全',
      body: `
        <p>登录用户的数据存储在 Supabase 提供的数据库服务中，并通过 Row Level Security（行级安全策略）限制访问权限，确保您只能访问自己的数据。</p>
        <p class="mt-2">游客模式下的数据仅保存在您当前设备的浏览器本地存储（localStorage）中，清除浏览器数据将导致游客进度丢失。</p>
      `
    },
    {
      heading: 'Cookie 与本地存储',
      body: `
        <p>我们使用浏览器本地存储保存登录会话、主题偏好与学习进度。这些技术仅用于提升产品体验，不用于跨站追踪。</p>
      `
    },
    {
      heading: '您的权利',
      body: `
        <p>您可以随时通过账号菜单退出登录。如需删除账号及全部关联数据，请联系平台管理员。</p>
      `
    }
  ]);
}

export function renderTerms() {
  return renderPage('用户协议', [
    {
      heading: '协议接受',
      body: `
        <p>使用 ${escapeHtml(PLATFORM.name)}（以下简称“本平台”）即表示您同意本协议。如果您不同意，请停止使用本平台服务。</p>
      `
    },
    {
      heading: '服务说明',
      body: `
        <p>本平台面向大学生提供大学基础课程（如高等数学、大学物理、线性代数等）的学习内容、练习题与期末试卷资源。部分内容可能在未来设置为付费，当前阶段所有内容均可免费访问。</p>
      `
    },
    {
      heading: '账号与注册',
      body: `
        <p>注册账号时您需要提供真实有效的邮箱地址，并妥善保管密码。您应对账号下的所有行为负责。未满 14 周岁的用户请在监护人陪同下使用本平台。</p>
      `
    },
    {
      heading: '用户使用规范',
      body: `
        <p>您同意在使用本平台时遵守法律法规，不得：</p>
        <ul class="list-disc pl-5 mt-2 space-y-1">
          <li>恶意爬取、批量下载或反向工程平台内容；</li>
          <li>上传、发布违法、侵权或不当内容；</li>
          <li>干扰平台正常运行或影响其他用户。</li>
        </ul>
      `
    },
    {
      heading: '知识产权',
      body: `
        <p>平台原创内容（包括但不限于题目解析、页面设计、代码）归本平台所有。课程题目与知识点参考公开教材与历年试题整理，仅供学习交流使用。</p>
      `
    },
    {
      heading: '免责声明',
      body: `
        <p>本平台内容仅供学习参考，不构成正式教学或考试承诺。因网络、设备或第三方服务导致的数据丢失或同步延迟，我们会尽力恢复，但不承担相应赔偿责任。</p>
      `
    },
    {
      heading: '协议变更',
      body: `
        <p>我们可能会不时更新本协议，更新后的协议将在本平台公布。继续使用本平台即视为接受更新后的协议。</p>
      `
    }
  ]);
}
