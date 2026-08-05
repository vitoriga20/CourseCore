# CourseCore 视觉品牌沉淀

> 版本：V1.0
> 日期：2026-08-04
> 定位：跨项目复用的视觉品牌基座，提炼自 CourseCore 刷题与知识库系统
> 适用范围：以后所有需要"严肃学习 + 长时间专注 + 可执行行动"调性的产品

---

## 一、品牌基因三句话

1. **状态 → 诊断 → 行动**：每个页面先告诉用户"现在在哪"，再解释"问题是什么"，最后给出"下一步做什么"。不是数据展示工具，是学习推进器。
2. **墨绿做主色，深色做底色**：墨绿传达"可继续、已掌握、下一步"，深色降低长时间学习的视觉噪音。绿色不是装饰，是行动信号。
3. **数据必须能转化为动作**：任何数字旁边都尽量配一个按钮。正确率 70% 不是结论，"建议复习 6 道错题再练 5 道相似题"才是。

---

## 二、色彩系统

### 2.1 品牌主色：墨绿系

墨绿是 CourseCore 的灵魂。它不是鲜艳的活力绿，是带灰度的深沉墨绿，传达"严肃学习"+"可持续推进"。

| 变量 | 浅色主题 | 深色主题 | 用途 |
| --- | --- | --- | --- |
| `--primary` | `#2d6a4f` | `#16A34A` | 主行动色，"继续刷题""立即复习"按钮 |
| `--primary-2` | `#40916c` | `#2DD288` | 强调亮绿，数字/进度填充/链接 |
| `--primary-dim` | `rgba(45,106,79,.14)` | `rgba(47,158,110,.14)` | 绿色弱化背景，chip/badge 底色 |

> 设计稿中出现的 `#24d783`、`#2de28d`、`#2F9E6E` 都是同一色系的不同明度，跨项目可统一收敛到上表三档。

### 2.2 中性色：深色底 + 次要灰

| 变量 | 浅色主题 | 深色主题 | 用途 |
| --- | --- | --- | --- |
| `--bg` | `#ffffff` | `#0E0E16` | 页面底 |
| `--surface` / `--card` | `#f5f5f7` | `#121815` / `#14141F` | 卡片底 |
| `--surface-2` | `#e5e5e5` | `#0E1311` / `#1E1E2E` | 次级卡片/输入框底 |
| `--line` | `#e5e5e5` | `rgba(255,255,255,.09)` / `#333333` | 主分隔线 |
| `--line-2` | — | `rgba(255,255,255,.05)` / `#2A2A3A` | 次级分隔线 |
| `--fg` | `#111111` | `#f5f5f7` / `#E8EDEA` | 主文本 |
| `--muted` | `#6e6e73` | `#a1a1a6` / `#8A9792` | 次要文本 |
| `--muted-2` | — | `#5C6A65` | 极弱文本/表头 |

### 2.3 状态色（语义化，不混用）

| 状态 | 浅色 | 深色 | 心理作用 | 使用边界 |
| --- | --- | --- | --- | --- |
| `--danger` 错误 | `#c62828` | `#EF5350` | 提醒需处理 | 配合文字/图标，不单独靠颜色 |
| `--warn` 待办/即将遗忘 | `#8b5a00` | `#FFB800` | 注意但非紧急 | 黄色配 chip 或进度条 |
| `--accent` 辅助/筛选 | `#000000` | `#9B7BFF` 紫 | 区分辅助状态 | 不与成功色混用 |
| `--success` 已掌握 | `#2d4e3e` | `#4caf50` | 完成感 | 状态点/已完成标签 |

### 2.4 状态色衍生 dim 色（背景用）

每种状态色都有对应的 `*-dim` 版本（透明度 14%），用于 chip 背景、badge 底色、hover 态。规则统一：

```css
--*-dim: rgba(<状态色 RGB>, .14);
```

---

## 三、字体系统

### 3.1 字体栈

```css
--font-serif: Georgia, "Times New Roman", "Noto Serif SC", serif;
--font-sans: -apple-system, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
```

- **serif** 用于：数字（得分、进度百分比）、页面大标题、公式。serif 给数字"权威感"。
- **sans** 用于：正文、按钮、标签、表格。sans 保证长文阅读舒适。

### 3.2 字号阶梯

| token | 字号 | 字重 | 用途 |
| --- | --- | --- | --- |
| display | 58px | 800 serif | 总结页大得分 |
| h1 | 26px | 800 serif | 页面主标题 |
| h2 | 20px | 700 | 卡片标题 |
| h3 | 15px | 700 | 卡片小标题 |
| body | 14px | 400 | 正文 |
| body-sm | 13px | 400/600 | 表格/列表 |
| caption | 11.5px | 600 | chip/标签 |
| micro | 10-11px | 600 letter-spacing .03em | 表头/徽章 |

---

## 四、间距与栅格

### 4.1 间距体系（4 的倍数）

```
4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 80
```

- 卡片内 padding：`22px`（约 1.5rem）
- 卡片间 gap：`16px`（常规）/ `12px`（紧凑列表）
- 区块间 margin：`24px` 或 `32px`
- 页面底部留白：`80px`

### 4.2 栅格

- 桌面 12 栏，内容最大宽度 **1180–1360px**
- 左侧导航固定 **224–240px**
- 常用双列布局比例：`1fr 1.7fr`（左小右大）、`1.05fr 1fr`（总结页对称）、`1.6fr 1fr`（左大右小）

### 4.3 圆角阶梯

| token | 值 | 用途 |
| --- | --- | --- |
| `--radius` | `16px` | 主卡片 |
| `--radius-sm` | `10px` | 次级卡片/输入框/表格行 |
| `--radius-pill` | `999px` | 按钮/标签/chip/进度条 |

> 圆角统一三档即可，避免出现 6px / 8px / 12px / 14px 等中间值。

---

## 五、核心组件库

### 5.1 卡片 `.card`

```css
background: var(--surface);
border: 1px solid var(--line);
border-radius: 16px;
padding: 22px;
```

卡片结构固定四层：
```
卡片标题（带状态点）
核心数据/内容
辅助说明（muted）
主要操作按钮
```

> 不要让每条信息都单独成卡片，否则碎片化。

### 5.2 按钮 `.btn-pill`

```css
padding: 10px 18px;
border-radius: 999px;
font-size: 14px;
font-weight: 600;
transition: transform .15s ease, background .2s ease;
```

| 变体 | 样式 | 用途 |
| --- | --- | --- |
| `btn-primary` | 绿底白字 | 页面主行动，每页最多 1 个 |
| `btn-ghost` | 透明底 + 1px line 边框 | 次级行动 |
| `btn-sm` | padding 7px 13px, font 12.5px | 表格内/紧凑区 |
| `link-btn` | 无边框文字按钮，hover 显示 dim 底 | 错题卡的"关联知识点""练相似题" |

hover 态：`translateY(-1px)` + 边框/底色变亮。active 态：`scale(0.98)`。

### 5.3 进度条 `.progress`

```css
height: 8px;
border-radius: 99px;
background: var(--surface-2);
overflow: hidden;
```

fill 三色：
- 绿色渐变 `linear-gradient(90deg, var(--primary), var(--primary-2))` — 掌握
- 黄色渐变 `linear-gradient(90deg, var(--warn), #FFD166)` — 待办/警告
- 红色渐变 `linear-gradient(90deg, var(--danger), #FF8A80)` — 薄弱

### 5.4 标签 `.chip`

```css
font-size: 11.5px;
font-weight: 600;
padding: 3px 9px;
border-radius: 999px;
border: 1px solid var(--line);
```

四种语义：`green` / `purple` / `warn` / `danger`，对应 dim 底 + 主色字 + 透明边。

### 5.5 状态点 `.status-dot`

8px 圆点，四种状态：
- `done` 绿色实心
- `current` 绿色实心 + 3px dim 光环（box-shadow）
- `todo` 透明 + 1px line 边
- `locked` 透明 + 1px muted 虚线边

### 5.6 数学公式 `.theory-formula`

```css
display: block;
font-family: var(--font-serif);
text-align: center;
font-size: 16px;
padding: 14px;
background: var(--surface-2);
border: 1px solid var(--line-2);
border-radius: 10px;
margin: 12px 0;
```

> 数学产品的可信度来自公式排版。所有页面禁止把 `$...$` 原始语法暴露给用户。

---

## 六、页面布局范式

### 6.1 范式 A：任务首页（刷题/学习）

```
┌─────────────────────────────────────┐
│ 页面标题 + 副标题（一行说明任务）    │
├─────────────────────────────────────┤
│ 5 tab pill 横向导航（学习/刷题/...）  │
├──────────────┬──────────────────────┤
│ 继续上次练习  │ 今日待复习 6 题      │
│ （大主卡，绿色 │ 薄弱知识点 3 条       │
│  渐变 hero）   │ （右侧 mini-card 栈） │
├──────────────┴──────────────────────┤
│ 趋势图 / 试卷列表（双列）            │
└─────────────────────────────────────┘
```

主卡用 `linear-gradient(150deg, var(--surface) 0%, #14201B 100%)` + 1px 绿色边 + 右上角 180px 径向绿色光晕。

### 6.2 范式 B：总结页（横向 2 列）

```
┌──────────────┬──────────────────────┐
│ 得分大数字    │ 错题列表              │
│ （serif 58px）│ （带题号方块+章节）   │
├──────────────┼──────────────────────┤
│ 错误原因分布  │ 下一步行动按钮组      │
│ 薄弱知识点chip│ （复习/练相似/重做）  │
└──────────────┴──────────────────────┘
```

得分状态动态：
- < 60%：红色"需要重学"
- 60–75%：黄色"基础掌握 · 需要巩固"
- 75–90%：绿色"掌握良好"
- > 90%：绿色"熟练掌握"

### 6.3 范式 C：知识库（表格为主，雷达为辅）

```
┌─────────────────────────────────────┐
│ 3 个 stat-tile + 今日待复习 chip      │
├─────────────────────────────────────┤
│ 学科筛选 pill 行                     │
├──────────────────────┬──────────────┤
│ 复习进度表            │ 雷达图（辅助） │
│ （掌握度/错题/复习时间 │ caption 注明  │
│   /下次复习/操作按钮） │ "可排序表为主"│
└──────────────────────┴──────────────┘
```

> 雷达图只作辅助视觉，决策信息必须由可排序表格承担。

### 6.4 范式 D：错题复习（双列：题目 + 复习辅助）

左列：题干 + 4 个选项（整行点击区域）+ 你的答案/正确答案对比 + 核心解析 + 错误原因 chip
右列：关联知识点卡片 + 建议动作（练相似题/加入复习计划）+ 当前掌握度 + "标记为已掌握"主按钮

正确选项高亮：`#102a20` 绿底 + `#24d783` 边 + 选项字母圈实心绿。
错误选项：`#202030` 灰底 + 字母圈 `#303044` 灰。

---

## 七、状态表达铁律

**状态不能只靠颜色**。必须同时使用：

1. 文字（"基础掌握 · 需要巩固"）
2. 图标或状态点
3. 标签 chip
4. 进度数字
5. 操作按钮

> "待复习"不能只显示红色，要显示"待复习 6 题"+"开始复习"按钮。

错误原因统一五类：`概念不清` / `计算错误` / `审题错误` / `方法不熟` / `时间不足`。

---

## 八、情绪设计

| 视觉元素 | 心理作用 | 使用边界 |
| --- | --- | --- |
| 深色背景 | 降低视觉噪音，突出内容 | 次要文字对比度 ≥ 4.5:1 |
| 墨绿主色 | 传达进展、成功、可继续 | 不要把所有按钮都染成绿色 |
| 紫色辅助 | 区分筛选、题型 | 不与成功状态混用 |
| 红色错误 | 提醒需处理 | 配文字/图标 |
| 适度圆角 | 降低工具感，提升亲和力 | 统一三档圆角 |

情绪目标：**即使用户成绩不理想，也应该觉得问题是清楚的、可拆解的、下一步可执行的**。绝不制造焦虑，也不虚假鼓励。

---

## 九、背景纹理（可选）

深色主题可叠加几何网格背景，提升"学习控制台"质感：

```css
.geo-bg {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  opacity: 0.5;
  background-image:
    linear-gradient(var(--line-2) 1px, transparent 1px),
    linear-gradient(90deg, var(--line-2) 1px, transparent 1px),
    radial-gradient(circle at 50% 50%, transparent 0, var(--bg) 78%);
  background-size: 56px 56px, 56px 56px, 100% 100%;
}
.geo-bg::before,
.geo-bg::after {
  content: "";
  position: absolute;
  background-image: radial-gradient(var(--line-2) 1.2px, transparent 1.2px);
  background-size: 18px 18px;
  width: 320px;
  height: 320px;
}
```

两个 320x320 的点阵光斑分别置于右上（旋转 15deg）和左下（旋转 -12deg），形成对称但不规则的几何装饰。

---

## 十、动效原则

- 页面切换：`fadeIn .4s ease`，从 `translateY(8px)` 到 `none`
- 按钮 hover：`translateY(-1px)`
- 按钮 active：`scale(0.98)`
- 主题切换：`background .25s ease, color .25s ease`
- 卡片 hover：`translateY(-2px)`

> 不做夸张动效。学习产品需要专注，动效只用于反馈，不用于炫技。

---

## 十一、品牌延展规则

跨项目复用本品牌时，按以下优先级取舍：

### 保留（不可改）
- 墨绿主色系（三档明度）
- 状态 → 诊断 → 行动 的页面结构
- 状态色 + 文字 + 图标 三重表达
- serif 数字 + sans 正文 的字体分工
- 三档圆角 + 4 的倍数间距

### 可调
- 中性色明度（根据产品调性往浅或往深）
- 紫色辅助色可替换为其他冷色（如蓝、青）
- 几何背景纹理可选
- 雷达图/趋势图等可视化形式可换

### 禁止
- 用鲜艳活力绿（如 #00FF00、#4CAF50 单档）替代墨绿系
- 状态只靠颜色表达
- 数字用 sans 字体
- 卡片圆角超过三档
- 主页面出现 2 个以上 primary 按钮

---

## 十二、验收清单

新项目接入本品牌时，逐项检查：

- [ ] CSS 变量已定义 `--primary` / `--primary-2` / `--primary-dim` 三档墨绿
- [ ] 状态色四档（danger/warn/accent/success）+ 对应 dim
- [ ] 双主题（light/dark）切换通过 `[data-theme="dark"]`
- [ ] 字体栈包含 serif + sans 两套
- [ ] 圆角只有 16/10/999 三档
- [ ] 间距全部是 4 的倍数
- [ ] 主按钮每页最多 1 个
- [ ] 所有状态同时有颜色 + 文字（+ 图标/进度）
- [ ] 数学公式用 serif 居中渲染，不暴露 `$...$`
- [ ] 进度条 fill 三色（绿/黄/红）+ 对应状态语义
- [ ] 错误原因使用五类标准分类
- [ ] 总结页首屏同时包含成绩、诊断、行动

---

## 十三、参考文件索引

| 资产 | 路径 | 用途 |
| --- | --- | --- |
| 设计哲学 | `coursecore/docs/coursecore-design-philosophy.md` | 完整设计理念原文 |
| 设计稿（HTML） | `coursecore/docs/design-mockups/frontend-redesign-mockups.html` | 6 页可交互设计稿，含完整 CSS |
| 刷题首页 SVG | `coursecore/docs/design-mockups/practice-dashboard.svg` | 桌面端 1440x900 静态稿 |
| 知识库 SVG | `coursecore/docs/design-mockups/knowledge-overview.svg` | 含左侧导航 + 表格 + 雷达 |
| 错题复习 SVG | `coursecore/docs/design-mockups/error-review.svg` | 双列：题目 + 复习辅助 |
| 总结页 SVG | `coursecore/docs/design-mockups/practice-summary.svg` | 4 列指标 + 双列诊断 + 行动条 |
| 实际样式代码 | `src/style.css` | 双主题 CSS 变量定义 + 组件实现 |

---

## 十四、品牌一句话

> **墨绿做底色，深色做舞台；状态先于装饰，行动先于数据。**

---

*品牌沉淀版本：1.0*
*沉淀时间：2026-08-04*
*来源项目：CourseCore 刷题与知识库系统*
