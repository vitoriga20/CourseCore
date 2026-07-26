# HTML 系统背诵手册（freeCodeCamp 响应式网页设计 v9）

> 目标：覆盖 freeCodeCamp Responsive Web Design v9 中 HTML 全部主题，每个知识点都给出可直接复制运行的完整示例，并附常见变体、边界情况、速查表、背诵口诀与易错点，适合系统性背诵与考前复习。

---

## 目录

1. [起步：文档骨架](#第一章-起步文档骨架)
2. [文本与排版](#第二章-文本与排版)
3. [列表](#第三章-列表)
4. [链接](#第四章-链接)
5. [图像与多媒体](#第五章-图像与多媒体)
6. [表格](#第六章-表格)
7. [表单](#第七章-表单)
8. [语义化 HTML](#第八章-语义化-html)
9. [无障碍 Accessibility](#第九章-无障碍-accessibility)
10. [SEO 基础](#第十章-seo-基础)
11. [速查表](#第十一章-速查表)
12. [背诵口诀](#第十二章-背诵口诀)
13. [易错点清单](#第十三章-易错点清单)

---

## 第一章 起步：文档骨架

### 1.1 HTML 是什么

- HTML（HyperText Markup Language，超文本标记语言）描述网页的内容与结构。
- 浏览器解析 HTML 标签，渲染成可视化页面。
- HTML 只负责**结构**，样式交给 CSS，交互交给 JavaScript。

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <title>我的第一个页面</title>
  </head>
  <body>
    <p>Hello HTML!</p>
  </body>
</html>
```

**变体 / 边界**

- `<!DOCTYPE html>` 不区分大小写，但推荐小写。
- `lang` 属性对屏幕阅读器发音、搜索引擎、拼写检查都有影响；多语言页面可在子元素上覆盖 `lang`。

```html
<p lang="en">This paragraph is in English.</p>
```

**易错点**：缺少 `<!DOCTYPE html>` 会触发浏览器的“怪异模式”（Quirks Mode），导致布局异常。

---

### 1.2 元素、标签、属性

- **元素（Element）**：从开始标签到结束标签的完整结构，例如 `<p>内容</p>`。
- **标签（Tag）**：`<p>` 是开始标签，`</p>` 是结束标签。
- **属性（Attribute）**：写在开始标签中，提供额外信息，格式为 `name="value"`。
- 空元素（Void Element）：没有结束标签，例如 `<img>`、`<br>`、`<input>`、`<hr>`。

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <title>元素、标签、属性</title>
  </head>
  <body>
    <!-- 带属性的开始标签 + 结束标签 -->
    <p class="intro" id="first">这是一个段落元素。</p>

    <!-- 空元素：自闭合写法也可以，但 HTML5 推荐省略斜杠 -->
    <img src="https://via.placeholder.com/120" alt="占位图" />
    <br />
    <hr />
  </body>
</html>
```

**变体 / 边界**

- 布尔属性（Boolean Attribute）：存在即真，不需要写值。

```html
<input type="text" required disabled />
<input type="checkbox" checked />
```

- 属性值一般加双引号；值中若含双引号，可用单引号包裹。

```html
<p title='他说："HTML 很简单。"'>悬停查看提示</p>
```

**易错点**：空元素写结束标签是错误的，例如 `<br></br>`、`<img></img>`。

---

### 1.3 HTML 注释

- 注释不会显示在页面上，用于给开发者留下说明。
- 快捷键：大多数编辑器用 `Ctrl + /`。

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <title>注释示例</title>
  </head>
  <body>
    <!-- 这是头部说明 -->
    <h1>课程表</h1>

    <!-- TODO: 后续补充课程列表 -->
    <p>周一：HTML 基础</p>
  </body>
</html>
```

**变体 / 边界**

- 注释不能嵌套。

```html
<!-- 外层 <!-- 内层 --> 这行会出错 -->
```

- 可以用注释临时禁用代码。

```html
<!-- <p>这段文字暂时不显示</p> -->
```

**易错点**：注释符号 `<!--` 和 `-->` 必须完整，中间不能出现额外的 `--`。

---

### 1.4 标准文档模板

- 每个 HTML 文件都应该包含 `<!DOCTYPE html>`、`<html>`、`<head>`、`<body>`。
- `<head>` 存放元数据：字符集、视口、标题、样式链接等。
- `<body>` 存放可见内容。

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="freeCodeCamp HTML 学习笔记" />
    <title>标准 HTML 模板</title>
    <link rel="stylesheet" href="styles.css" />
    <link rel="icon" href="favicon.ico" />
  </head>
  <body>
    <h1>标准模板</h1>
    <p>所有页面都从这个骨架开始。</p>
  </body>
</html>
```

**变体 / 边界**

- 如果页面完全没内容，`<body>` 也可以为空，但建议至少写 `<!DOCTYPE html>`、`html`、`head`、`body`。

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <title>空白页</title>
  </head>
  <body></body>
</html>
```

**易错点**：把可见内容放到 `<head>` 中会导致页面显示异常；CSS/JS 链接放在错误位置会影响加载顺序。

---

### 1.5 lang 与字符编码

- `lang` 声明页面主语言，帮助屏幕阅读器和搜索引擎。
- `charset="UTF-8"` 是标准编码，支持中文、 emoji、特殊符号。
- 视口 meta 让移动端正确缩放。

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>语言与编码</title>
  </head>
  <body>
    <p lang="zh-CN">这是一段中文。</p>
    <p lang="en">This is English.</p>
    <p lang="ja">これは日本語です。</p>
  </body>
</html>
```

**变体 / 边界**

- `lang` 可用在任意元素上，实现局部语言切换。

```html
<p>欢迎学习 <span lang="en">HTML</span>。</p>
```

**易错点**：忘记写 `<meta charset="UTF-8"/>` 会导致中文乱码。

---

## 第二章 文本与排版

### 2.1 标题 h1-h6

- 标题从 `<h1>` 到 `<h6>`，重要性递减。
- 一个页面通常只有一个 `<h1>`，它是页面主题。
- 标题层级不要跳级：h1 → h2 → h3，不要 h1 → h3。

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <title>标题</title>
  </head>
  <body>
    <h1>主标题：HTML 学习手册</h1>
    <h2>第 1 章 基础</h2>
    <h3>1.1 元素</h3>
    <h4>1.1.1 块级元素</h4>
    <h5>小标题</h5>
    <h6>最小标题</h6>
  </body>
</html>
```

**变体 / 边界**

- 不要根据字体大小选择标题级别，而应根据内容层级。
- 标题级别对无障碍和 SEO 都很重要。

**易错点**：用 `<h1>` 做 Logo、又用 `<h1>` 做文章标题，会造成页面有多个主标题，影响 SEO。

---

### 2.2 段落与换行

- `<p>` 是段落，块级元素，自动上下留白。
- `<br>` 是强制换行，用于地址、诗歌等需要精确换行的场景。
- `<hr>` 是水平分隔线，表示主题转换。

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <title>段落与换行</title>
  </head>
  <body>
    <p>这是第一段。HTML 是结构语言。</p>
    <hr />
    <p>
      北京市海淀区<br />
      中关村大街 1 号<br />
      100080
    </p>
  </body>
</html>
```

**变体 / 边界**

- 多个 `<br>` 不要用来制造段落间距，应使用 CSS 控制。
- `<hr>` 在语义上表示段落主题的分割，不只是装饰线。

**易错点**：用 `<br>` 实现大段空白或布局，会导致可访问性问题。

---

### 2.3 文本格式化

- `<strong>`：重要性高（语义加粗）。
- `<em>`：强调（语义斜体）。
- `<b>`、`<i>`：单纯视觉样式，无语义。
- `<mark>`：高亮。
- `<small>`：小号字/附注。
- `<del>`：删除的内容。
- `<ins>`：新增的内容。
- `<sub>`、`<sup>`：下标、上标。

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <title>文本格式化</title>
  </head>
  <body>
    <p><strong>警告：</strong> 操作不可逆。</p>
    <p>这杯水 <em>必须</em> 现在喝掉。</p>
    <p>价格：<del>199 元</del> <ins>99 元</ins></p>
    <p>水是 H<sub>2</sub>O，面积是 m<sup>2</sup>。</p>
    <p><mark>重点：</mark> 使用语义化标签。</p>
    <p><small>免责声明：本内容仅供学习。</small></p>
  </body>
</html>
```

**变体 / 边界**

- `<b>`、`<i>` 适用于没有更好语义标签的场合，例如产品名、技术术语的视觉区分。

```html
<p>推荐字体 <i>Roboto</i> 和 <b>Noto Sans</b>。</p>
```

**易错点**：把所有加粗都用 `<b>`，把所有斜体都用 `<i>`，会失去语义；优先使用 `<strong>` 和 `<em>`。

---

### 2.4 引用与代码

- `<blockquote>`：长引用，块级。
- `<q>`：短引用，自动加引号。
- `<cite>`：引用来源标题。
- `<abbr>`：缩写，配合 `title` 显示全称。
- `<code>`：行内代码。
- `<pre>`：预格式化文本，保留空格和换行。
- `<address>`：联系信息。

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <title>引用与代码</title>
  </head>
  <body>
    <p><abbr title="HyperText Markup Language">HTML</abbr> 是网页结构语言。</p>

    <blockquote cite="https://developer.mozilla.org">
      <p>HTML 是构建 Web 的基础。</p>
    </blockquote>

    <p>鲁迅说：<q>其实地上本没有路。</q></p>

    <p>使用 <code>&lt;section&gt;</code> 标签划分内容。</p>

    <pre>
function hello() {
  console.log("Hello HTML");
}
    </pre>

    <address>
      作者：张三<br />
      邮箱：<a href="mailto:zhangsan@example.com">zhangsan@example.com</a>
    </address>
  </body>
</html>
```

**变体 / 边界**

- `<blockquote>` 可嵌套段落、标题、列表等。
- `<pre>` 常与 `<code>` 组合展示代码块。

```html
<pre><code>const x = 1;
console.log(x);</code></pre>
```

**易错点**：`<cite>` 只用于作品标题，不用于人名；引用人名应使用普通文本。

---

## 第三章 列表

### 3.1 无序列表

- `<ul>`：无序列表。
- `<li>`：列表项。
- 默认显示为圆点，可用 CSS 修改。

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <title>无序列表</title>
  </head>
  <body>
    <h2>购物清单</h2>
    <ul>
      <li>牛奶</li>
      <li>鸡蛋</li>
      <li>面包</li>
    </ul>
  </body>
</html>
```

**变体 / 边界**

- `ul` 的直接子元素只能是 `li`，不能再嵌套其他元素。

```html
<!-- 错误：ul 里直接放 p -->
<ul>
  <p>错误用法</p>
</ul>
```

**易错点**：把 `li` 放在 `ul` 外部，或把 `ul` 直接嵌套在 `ul` 里而不经过 `li`。

---

### 3.2 有序列表

- `<ol>`：有序列表。
- `<li>`：列表项。
- 可用 `type`、`start`、`reversed` 控制编号。

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <title>有序列表</title>
  </head>
  <body>
    <h2>制作蛋糕步骤</h2>
    <ol>
      <li>准备材料</li>
      <li>混合面糊</li>
      <li>烘烤 30 分钟</li>
    </ol>

    <h2>排行榜（倒序）</h2>
    <ol start="5" reversed>
      <li>第五名</li>
      <li>第四名</li>
      <li>第三名</li>
    </ol>
  </body>
</html>
```

**变体 / 边界**

- `type="A"`、`type="a"`、`type="I"`、`type="i"` 可改变编号样式。

```html
<ol type="A">
  <li>选项 A</li>
  <li>选项 B</li>
</ol>
```

**易错点**：`start` 只接受整数；罗马数字列表不能用 `start="II"`。

---

### 3.3 定义列表

- `<dl>`：定义列表。
- `<dt>`：被定义的术语。
- `<dd>`：定义描述。

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <title>定义列表</title>
  </head>
  <body>
    <h2>前端术语</h2>
    <dl>
      <dt>HTML</dt>
      <dd>超文本标记语言，用于描述网页结构。</dd>

      <dt>CSS</dt>
      <dd>层叠样式表，用于控制网页外观。</dd>

      <dt>JavaScript</dt>
      <dd>网页脚本语言，用于实现交互。</dd>
    </dl>
  </body>
</html>
```

**变体 / 边界**

- 一个 `dt` 可对应多个 `dd`；一个 `dd` 也可对应多个 `dt`。

```html
<dl>
  <dt>JS</dt>
  <dt>JavaScript</dt>
  <dd>一种脚本语言。</dd>
</dl>
```

**易错点**：把 `dt` 或 `dd` 直接放在 `dl` 外部会失效。

---

### 3.4 嵌套列表

- 在 `li` 内部再嵌套 `ul` 或 `ol`。
- 嵌套层级不宜过深，通常不超过 3 层。

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <title>嵌套列表</title>
  </head>
  <body>
    <h2>学习计划</h2>
    <ul>
      <li>
        HTML
        <ol>
          <li>基础标签</li>
          <li>表单</li>
          <li>语义化</li>
        </ol>
      </li>
      <li>
        CSS
        <ul>
          <li>选择器</li>
          <li>盒模型</li>
          <li>Flexbox</li>
        </ul>
      </li>
    </ul>
  </body>
</html>
```

**变体 / 边界**

- 嵌套列表必须完全包含在某个 `li` 中，不能跨 `li` 嵌套。

**易错点**：在 `ul` 里直接嵌套另一个 `ul`，而不是放在 `li` 内部。

---

## 第四章 链接

### 4.1 超链接

- `<a>` 元素创建超链接，核心属性是 `href`。
- `href` 可以是绝对 URL、相对路径、锚点、邮箱、电话。

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <title>超链接</title>
  </head>
  <body>
    <p>
      访问
      <a href="https://www.freecodecamp.org/chinese/">freeCodeCamp 中文站</a>
      学习编程。
    </p>

    <p>
      查看本地页面：
      <a href="about.html">关于我们</a>
    </p>
  </body>
</html>
```

**变体 / 边界**

- 绝对 URL 必须包含协议；相对 URL 基于当前文件位置。

```html
<a href="/images/logo.png">根目录图片</a>
<a href="../docs/readme.md">上一级目录</a>
<a href="./contact.html">同级目录</a>
```

**易错点**：忘记写 `href` 或写成 `href="#"` 作为占位，会让用户困惑；应使用 `<button>` 或明确说明。

---

### 4.2 target 与下载

- `target="_blank"` 在新标签页打开链接。
- `download` 属性提示浏览器下载资源。

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <title>target 与下载</title>
  </head>
  <body>
    <p>
      <a href="https://www.freecodecamp.org" target="_blank" rel="noopener noreferrer">
        在新标签页打开 freeCodeCamp
      </a>
    </p>

    <p>
      <a href="notes.pdf" download>下载学习笔记 PDF</a>
    </p>

    <p>
      <a href="photo.jpg" download="vacation.jpg">以指定文件名下载</a>
    </p>
  </body>
</html>
```

**变体 / 边界**

- 使用 `target="_blank"` 时建议加 `rel="noopener noreferrer"`，防止新页面通过 `window.opener` 操控原页面。
- `download` 只对同源 URL 或 blob 有效；跨域资源通常不会触发下载。

**易错点**：只写 `target="_blank"` 而不加 `rel="noopener noreferrer"`，存在安全和性能风险。

---

### 4.3 锚点、邮件、电话

- 锚点链接：用 `#id` 跳转到页面内指定元素。
- `mailto:` 打开邮件客户端。
- `tel:` 拨打电话（移动端有效）。

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <title>锚点与联系链接</title>
  </head>
  <body>
    <nav>
      <a href="#intro">简介</a>
      <a href="#contact">联系我们</a>
    </nav>

    <h2 id="intro">简介</h2>
    <p>这是页面的简介部分。</p>

    <h2 id="contact">联系我们</h2>
    <p>
      邮箱：<a href="mailto:help@example.com?subject=咨询&body=你好，">发送邮件</a>
    </p>
    <p>
      电话：<a href="tel:+8613800000000">138-0000-0000</a>
    </p>
  </body>
</html>
```

**变体 / 边界**

- 锚点目标可以放在任意元素上，不限于标题。

```html
<p id="note">注意这里。</p>
<a href="#note">跳到注意</a>
```

- `mailto:` 可添加 `subject`、`body`、`cc`、`bcc`。

**易错点**：锚点目标元素的 `id` 在页面中必须唯一；重复的 `id` 会导致跳转 unpredictable。

---

### 4.4 图片链接

- 把 `<img>` 嵌套在 `<a>` 中，即可让图片变成可点击链接。

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <title>图片链接</title>
  </head>
  <body>
    <a href="https://www.freecodecamp.org" target="_blank" rel="noopener noreferrer">
      <img
        src="https://via.placeholder.com/200x100?text=freeCodeCamp"
        alt="freeCodeCamp  logo，点击访问官网"
        width="200"
        height="100"
      />
    </a>
  </body>
</html>
```

**变体 / 边界**

- 图片链接必须有 `alt` 文本，否则屏幕阅读器无法告知用户链接目标。

```html
<!-- 错误：缺少 alt -->
<a href="profile.html"><img src="avatar.jpg" /></a>
```

**易错点**：把 `<a>` 嵌套在另一个 `<a>` 中是非法的；包括把按钮链接再包链接。

---

## 第五章 图像与多媒体

### 5.1 img

- `<img>` 用于嵌入图片，是空元素。
- 必需属性：`src`（图片地址）、`alt`（替代文本）。
- 可选属性：`width`、`height`、`loading`、`title`。

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <title>图片</title>
  </head>
  <body>
    <img
      src="https://via.placeholder.com/300x200?text=HTML"
      alt="占位图片，上面写着 HTML"
      width="300"
      height="200"
      loading="lazy"
    />
  </body>
</html>
```

**变体 / 边界**

- 装饰性图片应设置 `alt=""`，让屏幕阅读器跳过。

```html
<img src="divider.png" alt="" />
```

- 图片失败时会显示 `alt` 文本，并触发 `onerror` 事件。

```html
<img src="missing.jpg" alt="图片加载失败时的替代文字" />
```

**易错点**：`alt` 里写“图片”或“image”是冗余的；应直接描述图片内容或功能。

---

### 5.2 figure / figcaption

- `<figure>`：独立的、可附说明的内容单元，常用于图片、图表、代码片段。
- `<figcaption>`：为 `<figure>` 添加标题或说明。

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <title>Figure 与 Figcaption</title>
  </head>
  <body>
    <figure>
      <img
        src="https://via.placeholder.com/300x200?text=Cat"
        alt="一只橘猫坐在沙发上"
        width="300"
        height="200"
      />
      <figcaption>图 1：我家橘猫午睡的样子</figcaption>
    </figure>

    <figure>
      <pre><code>console.log("Hello HTML");</code></pre>
      <figcaption>代码片段：输出欢迎信息</figcaption>
    </figure>
  </body>
</html>
```

**变体 / 边界**

- `<figcaption>` 必须是 `<figure>` 的第一个或最后一个子元素。
- 一个 `figure` 里只能有一个 `figcaption`。

**易错点**：用 `<figure>` 包所有图片，即使图片没有说明；没有说明时普通 `<img>` 即可。

---

### 5.3 picture / source

- `<picture>` 提供多个图片来源，浏览器按条件选择。
- 常用于响应式图片、不同格式（WebP  fallback）。

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <title>响应式图片</title>
  </head>
  <body>
    <picture>
      <source media="(min-width: 800px)" srcset="large.jpg" />
      <source media="(min-width: 400px)" srcset="medium.jpg" />
      <img src="small.jpg" alt="响应式展示图" />
    </picture>
  </body>
</html>
```

**变体 / 边界**

- 可用 `type` 属性提供不同格式：

```html
<picture>
  <source srcset="photo.avif" type="image/avif" />
  <source srcset="photo.webp" type="image/webp" />
  <img src="photo.jpg" alt="风景照片" />
</picture>
```

**易错点**：`<picture>` 里必须包含一个 `<img>` 作为兜底；否则某些浏览器不显示图片。

---

### 5.4 audio

- `<audio>` 嵌入音频。
- 常用属性：`controls`、`autoplay`、`loop`、`muted`、`preload`。
- `<source>` 提供多种格式。

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <title>音频</title>
  </head>
  <body>
    <audio controls preload="metadata">
      <source src="https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3" type="audio/mpeg" />
      <source src="audio.ogg" type="audio/ogg" />
      <p>您的浏览器不支持音频播放，请<a href="audio.mp3">下载音频</a>。</p>
    </audio>
  </body>
</html>
```

**变体 / 边界**

- `autoplay` 常被浏览器阻止，需要用户交互后才能播放。
- `muted` 配合 `autoplay` 通常可以自动播放。

```html
<video autoplay muted loop>
  <source src="bg.mp4" type="video/mp4" />
</video>
```

**易错点**：不写 `controls` 也不写自定义控制逻辑，用户无法播放音频。

---

### 5.5 video

- `<video>` 嵌入视频。
- 常用属性：`controls`、`autoplay`、`loop`、`muted`、`poster`、`preload`、`width`、`height`。
- `<source>` 提供多种格式；`<track>` 提供字幕。

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <title>视频</title>
  </head>
  <body>
    <video width="640" height="360" controls poster="poster.jpg" preload="metadata">
      <source src="https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4" type="video/mp4" />
      <source src="video.webm" type="video/webm" />
      <track kind="subtitles" src="subtitles-zh.vtt" srclang="zh" label="中文字幕" default />
      <track kind="captions" src="captions-en.vtt" srclang="en" label="English" />
      <p>您的浏览器不支持视频播放，请<a href="video.mp4">下载视频</a>。</p>
    </video>
  </body>
</html>
```

**变体 / 边界**

- `controlslist="nodownload"` 可隐藏下载按钮（浏览器支持不一）。
- `playsinline` 在 iOS Safari 上避免全屏播放。

```html
<video src="clip.mp4" playsinline muted autoplay loop></video>
```

**易错点**：忘记给视频添加 `controls` 或替代文本，键盘用户无法操作。

---

### 5.6 iframe

- `<iframe>` 在当前页面嵌入另一个网页。
- 重要属性：`src`、`title`、`width`、`height`、`loading`、`sandbox`、`allow`。
- `title` 对无障碍至关重要。

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <title>iframe</title>
  </head>
  <body>
    <iframe
      src="https://www.youtube.com/embed/dQw4w9WgXcQ"
      title="示例视频"
      width="560"
      height="315"
      loading="lazy"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowfullscreen
    >
    </iframe>
  </body>
</html>
```

**变体 / 边界**

- `sandbox` 可限制嵌入页行为，增强安全。

```html
<iframe src="ad.html" sandbox="allow-scripts allow-same-origin" title="广告"></iframe>
```

- 某些网站通过 `X-Frame-Options` 禁止被嵌入，iframe 会显示空白。

**易错点**：iframe 缺少 `title` 会导致屏幕阅读器无法说明嵌入内容是什么。

---

### 5.7 SVG

- SVG（Scalable Vector Graphics）是矢量图形，可内联在 HTML 中。
- 常用标签：`<svg>`、`<rect>`、`<circle>`、`<line>`、`<path>`、`<text>`。
- 内联 SVG 可以通过 CSS/JS 控制。

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <title>SVG 基础</title>
  </head>
  <body>
    <svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <rect x="10" y="10" width="80" height="80" fill="steelblue" />
      <circle cx="150" cy="50" r="40" fill="tomato" />
      <line x1="10" y1="120" x2="190" y2="190" stroke="black" stroke-width="3" />
      <text x="20" y="170" font-size="20" fill="black">SVG</text>
    </svg>
  </body>
</html>
```

**变体 / 边界**

- 通过 `<img>` 引用外部 SVG：

```html
<img src="icon.svg" alt="图标" />
```

- 通过 CSS 背景图使用 SVG：

```html
<div style="background-image: url('icon.svg'); width: 50px; height: 50px;"></div>
```

**易错点**：SVG 作为 `<img>` 时，内部 CSS/JS 无法生效；需要交互时用内联 SVG。

---

## 第六章 表格

### 6.1 基本表格

- `<table>`：表格容器。
- `<tr>`：表格行。
- `<th>`：表头单元格（默认加粗居中）。
- `<td>`：数据单元格。

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <title>基本表格</title>
  </head>
  <body>
    <table border="1">
      <tr>
        <th>姓名</th>
        <th>年龄</th>
        <th>城市</th>
      </tr>
      <tr>
        <td>张三</td>
        <td>25</td>
        <td>北京</td>
      </tr>
      <tr>
        <td>李四</td>
        <td>30</td>
        <td>上海</td>
      </tr>
    </table>
  </body>
</html>
```

**变体 / 边界**

- `border="1"` 仅用于快速示意，实际样式应使用 CSS。

**易错点**：直接用表格做页面布局，违反语义化原则，应使用 CSS 布局（Flexbox/Grid）。

---

### 6.2 表头 / 表体 / 表尾

- `<thead>`：表头区域。
- `<tbody>`：主体数据区域。
- `<tfoot>`：表尾区域（汇总、合计）。
- `<caption>`：表格标题。

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <title>表格结构</title>
  </head>
  <body>
    <table border="1">
      <caption>月度支出表</caption>
      <thead>
        <tr>
          <th>项目</th>
          <th>金额（元）</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>房租</td>
          <td>3000</td>
        </tr>
        <tr>
          <td>餐饮</td>
          <td>1500</td>
        </tr>
      </tbody>
      <tfoot>
        <tr>
          <th>合计</th>
          <td>4500</td>
        </tr>
      </tfoot>
    </table>
  </body>
</html>
```

**变体 / 边界**

- 一个表格可以有多个 `<tbody>`，用于对行分组。

```html
<table>
  <tbody>
    <tr><td>第一批</td></tr>
  </tbody>
  <tbody>
    <tr><td>第二批</td></tr>
  </tbody>
</table>
```

**易错点**：`<tfoot>` 在 HTML 中必须出现在 `<tbody>` 之前或之内？实际上 `<tfoot>` 必须放在 `<tbody>` 之后（按规范顺序为 caption, colgroup, thead, tbody, tfoot），浏览器会自动调整。

---

### 6.3 合并单元格

- `colspan`：横向合并单元格（跨列）。
- `rowspan`：纵向合并单元格（跨行）。

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <title>合并单元格</title>
  </head>
  <body>
    <table border="1">
      <tr>
        <th rowspan="2">姓名</th>
        <th colspan="2">成绩</th>
      </tr>
      <tr>
        <th>语文</th>
        <th>数学</th>
      </tr>
      <tr>
        <td>张三</td>
        <td>90</td>
        <td>85</td>
      </tr>
      <tr>
        <td>李四</td>
        <td>88</td>
        <td>92</td>
      </tr>
    </table>
  </body>
</html>
```

**变体 / 边界**

- `colspan="0"` 在 HTML5 中含义特殊（跨到最后一列），但浏览器支持差，建议明确写数字。

**易错点**：合并后忘记删除被覆盖的单元格，导致表格错乱。

---

### 6.4 表格无障碍

- 为 `<th>` 添加 `scope="col"` 或 `scope="row"`，明确表头与数据的关系。
- 复杂表格可使用 `id` + `headers` 属性关联。

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <title>无障碍表格</title>
  </head>
  <body>
    <table border="1">
      <caption>课程表</caption>
      <thead>
        <tr>
          <th scope="col">时间</th>
          <th scope="col">周一</th>
          <th scope="col">周二</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <th scope="row">08:00</th>
          <td>数学</td>
          <td>英语</td>
        </tr>
        <tr>
          <th scope="row">10:00</th>
          <td>物理</td>
          <td>化学</td>
        </tr>
      </tbody>
    </table>
  </body>
</html>
```

**变体 / 边界**

- 复杂表头关联：

```html
<th id="name">姓名</th>
<td headers="name">张三</td>
```

**易错点**：表格没有 `caption` 和 `scope`，屏幕阅读器用户难以理解数据结构。

---

## 第七章 表单

### 7.1 form 基础

- `<form>` 用于收集用户输入并提交。
- 常用属性：`action`（提交地址）、`method`（GET/POST）、`enctype`（编码类型）、`novalidate`（关闭验证）。

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <title>表单基础</title>
  </head>
  <body>
    <form action="/submit" method="POST">
      <label for="username">用户名：</label>
      <input type="text" id="username" name="username" />

      <button type="submit">提交</button>
    </form>
  </body>
</html>
```

**变体 / 边界**

- `method="GET"` 时数据会附加在 URL 中，适合搜索；`POST` 适合敏感或大量数据。

```html
<form action="/search" method="GET">
  <input type="search" name="q" />
  <button type="submit">搜索</button>
</form>
```

- `enctype="multipart/form-data"` 用于文件上传。

**易错点**：表单元素缺少 `name` 属性时，提交数据不会包含该字段。

---

### 7.2 input 类型大全

- `<input>` 的 `type` 决定控件样式与行为。

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <title>input 类型</title>
  </head>
  <body>
    <form>
      <p><label>文本：<input type="text" name="text" /></label></p>
      <p><label>密码：<input type="password" name="password" /></label></p>
      <p><label>邮箱：<input type="email" name="email" /></label></p>
      <p><label>电话：<input type="tel" name="tel" /></label></p>
      <p><label>网址：<input type="url" name="url" /></label></p>
      <p><label>数字：<input type="number" name="number" min="0" max="100" step="5" /></label></p>
      <p><label>搜索：<input type="search" name="search" /></label></p>
      <p><label>日期：<input type="date" name="date" /></label></p>
      <p><label>时间：<input type="time" name="time" /></label></p>
      <p><label>日期时间：<input type="datetime-local" name="datetime" /></label></p>
      <p><label>月份：<input type="month" name="month" /></label></p>
      <p><label>周：<input type="week" name="week" /></label></p>
      <p><label>颜色：<input type="color" name="color" /></label></p>
      <p><label>范围：<input type="range" name="range" min="0" max="10" /></label></p>
      <p><label>文件：<input type="file" name="file" accept=".jpg,.png" multiple /></label></p>
      <p><label>隐藏：<input type="hidden" name="token" value="abc123" /></label></p>
      <p><button type="submit">提交</button></p>
    </form>
  </body>
</html>
```

**变体 / 边界**

- `type="number"` 在移动设备会调出数字键盘。
- `type="email"`、`type="url"` 自带基本格式验证。
- `accept="image/*"` 限制文件类型。

**易错点**：用 `type="text"` 收集邮箱/数字，再手写验证，不如直接用语义化 `type`。

---

### 7.3 label 与可访问性

- `<label>` 描述控件用途。
- 显式关联：`for` 对应控件的 `id`。
- 隐式关联：把控件放在 `<label>` 内部。

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <title>label</title>
  </head>
  <body>
    <form>
      <!-- 显式关联 -->
      <label for="email">邮箱：</label>
      <input type="email" id="email" name="email" />

      <!-- 隐式关联 -->
      <label>
        用户名：
        <input type="text" name="username" />
      </label>
    </form>
  </body>
</html>
```

**变体 / 边界**

- 点击 `label` 会自动聚焦/选中对应控件，提升可用性。

**易错点**：`for` 值与 `id` 不匹配，或控件没有 `id`，导致 label 无法点击关联。

---

### 7.4 textarea / select / option

- `<textarea>`：多行文本框。
- `<select>` + `<option>`：下拉选择框。
- `<optgroup>`：对选项分组。

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <title>多行与下拉</title>
  </head>
  <body>
    <form>
      <label for="bio">个人简介：</label><br />
      <textarea id="bio" name="bio" rows="4" cols="50" maxlength="200" placeholder="请简要介绍自己"></textarea>

      <label for="country">国家：</label>
      <select id="country" name="country">
        <option value="">请选择</option>
        <option value="cn" selected>中国</option>
        <option value="us">美国</option>
        <option value="jp">日本</option>
      </select>

      <label for="skills">技能（多选）：</label>
      <select id="skills" name="skills" multiple size="4">
        <optgroup label="前端">
          <option value="html">HTML</option>
          <option value="css">CSS</option>
        </optgroup>
        <optgroup label="后端">
          <option value="node">Node.js</option>
          <option value="python">Python</option>
        </optgroup>
      </select>
    </form>
  </body>
</html>
```

**变体 / 边界**

- `<select multiple>` 允许按住 Ctrl/Cmd 多选。
- `<textarea>` 的 `rows`/`cols` 只是初始尺寸，可用 CSS 覆盖。

**易错点**：`select` 的 `value` 来自选中的 `option` 的 `value`，不是显示文本。

---

### 7.5 button 类型

- `<button>` 默认类型是 `submit`。
- 明确写 `type` 可避免意外提交表单。

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <title>按钮类型</title>
  </head>
  <body>
    <form>
      <input type="text" name="demo" />

      <button type="submit">提交表单</button>
      <button type="reset">重置表单</button>
      <button type="button" onclick="alert('Hello')">普通按钮</button>
    </form>
  </body>
</html>
```

**变体 / 边界**

- 表单外的按钮应写 `type="button"`，否则可能触发表单提交（如果通过 `form` 属性关联表单则例外）。

```html
<button type="submit" form="myForm">外部提交</button>
```

**易错点**：在表单内使用 `<button>关闭</button>` 没有写 `type="button"`，会意外提交表单。

---

### 7.6 radio / checkbox

- `radio`：单选按钮，同一组必须同名（`name` 相同）。
- `checkbox`：复选框，可多个同名，也可不同名。
- `value` 是提交给服务器的值；`checked` 表示默认选中。

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <title>单选与复选</title>
  </head>
  <body>
    <form>
      <fieldset>
        <legend>性别</legend>
        <label><input type="radio" name="gender" value="male" checked /> 男</label>
        <label><input type="radio" name="gender" value="female" /> 女</label>
        <label><input type="radio" name="gender" value="other" /> 其他</label>
      </fieldset>

      <fieldset>
        <legend>兴趣</legend>
        <label><input type="checkbox" name="hobby" value="code" checked /> 编程</label>
        <label><input type="checkbox" name="hobby" value="music" /> 音乐</label>
        <label><input type="checkbox" name="hobby" value="sports" /> 运动</label>
      </fieldset>

      <button type="submit">提交</button>
    </form>
  </body>
</html>
```

**变体 / 边界**

- 单选组必须放在同一个 `name` 下；否则所有选项都可同时选中。

```html
<!-- 错误：name 不同，两个都能选 -->
<input type="radio" name="q1" value="a" />
<input type="radio" name="q2" value="b" />
```

**易错点**：radio 没有 `value` 时，提交值是 `on`，无法区分选项。

---

### 7.7 fieldset / legend

- `<fieldset>`：把相关表单项分组。
- `<legend>`：为分组添加标题。

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <title>字段分组</title>
  </head>
  <body>
    <form>
      <fieldset>
        <legend>账户信息</legend>
        <label for="username">用户名：</label>
        <input type="text" id="username" name="username" required />

        <label for="password">密码：</label>
        <input type="password" id="password" name="password" required />
      </fieldset>

      <fieldset>
        <legend>个人偏好</legend>
        <label><input type="checkbox" name="newsletter" checked /> 订阅邮件</label>
      </fieldset>

      <button type="submit">注册</button>
    </form>
  </body>
</html>
```

**变体 / 边界**

- `fieldset` 可以嵌套，但通常不建议过深。
- `disabled` 属性可禁用整个分组。

```html
<fieldset disabled>
  <legend>不可编辑</legend>
  <input type="text" value="只读" />
</fieldset>
```

**易错点**：`legend` 必须是 `fieldset` 的第一个子元素。

---

### 7.8 表单验证属性

- `required`：必填。
- `minlength` / `maxlength`：长度限制。
- `min` / `max` / `step`：数值/日期范围。
- `pattern`：正则表达式验证。
- `placeholder`：提示文字。

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <title>表单验证</title>
  </head>
  <body>
    <form>
      <label for="username">用户名（4-12 位字母数字）：</label>
      <input
        type="text"
        id="username"
        name="username"
        required
        minlength="4"
        maxlength="12"
        pattern="[A-Za-z0-9]+"
        placeholder="请输入用户名"
      />

      <label for="age">年龄（18-60）：</label>
      <input type="number" id="age" name="age" min="18" max="60" required />

      <label for="email">邮箱：</label>
      <input type="email" id="email" name="email" required />

      <button type="submit">提交</button>
    </form>
  </body>
</html>
```

**变体 / 边界**

- `novalidate` 可关闭整个表单的验证。

```html
<form novalidate>
  <input type="email" required />
  <button type="submit">提交（不验证）</button>
</form>
```

- `formnovalidate` 用于单个提交按钮跳过验证。

**易错点**：`pattern` 的正则不要加斜杠和标志，直接写表达式主体。

---

### 7.9 表单状态与辅助元素

- `disabled`：禁用控件，不提交。
- `readonly`：只读，会提交。
- `autocomplete`：自动填充提示。
- `datalist`：为输入框提供候选值。
- `output`：显示计算结果。

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <title>表单状态与辅助</title>
  </head>
  <body>
    <form oninput="result.value = parseInt(a.value) + parseInt(b.value)">
      <label for="city">城市：</label>
      <input list="cities" id="city" name="city" autocomplete="address-level2" />
      <datalist id="cities">
        <option value="北京"></option>
        <option value="上海"></option>
        <option value="广州"></option>
      </datalist>

      <p>
        <label for="a">A：</label>
        <input type="number" id="a" name="a" value="0" />
        +
        <label for="b">B：</label>
        <input type="number" id="b" name="b" value="0" />
        =
        <output name="result" for="a b">0</output>
      </p>

      <p>
        <label>只读：<input type="text" value="不可修改" readonly /></label>
      </p>
      <p>
        <label>禁用：<input type="text" value="不提交" disabled /></label>
      </p>
    </form>
  </body>
</html>
```

**变体 / 边界**

- `autocomplete` 取值如 `name`、`email`、`tel`、`current-password`、`new-password`、`off`。

**易错点**：需要提交的数据误加 `disabled`，服务器收不到该字段。

---

## 第八章 语义化 HTML

### 8.1 为何语义化

- 语义化标签让代码“自带说明”，对开发者、搜索引擎、屏幕阅读器都更友好。
- 避免滥用 `<div>` 和 `<span>`。

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <title>语义化对比</title>
  </head>
  <body>
    <!-- 不推荐：全是 div -->
    <div class="header">
      <div class="nav">导航</div>
    </div>
    <div class="main">内容</div>
    <div class="footer">页脚</div>

    <!-- 推荐：语义化标签 -->
    <header>
      <nav>导航</nav>
    </header>
    <main>内容</main>
    <footer>页脚</footer>
  </body>
</html>
```

**变体 / 边界**

- 旧浏览器不支持新语义标签时，可用 CSS `display: block` 或 polyfill。

**易错点**：把语义标签当作样式工具；选择标签应先考虑内容含义，再考虑视觉。

---

### 8.2 页面结构语义标签

- `<header>`：页面或区块的头部，可包含 Logo、导航、搜索等。
- `<nav>`：主要导航链接组。
- `<main>`：页面主要内容，每页只应有一个。
- `<section>`：按主题划分的内容区块。
- `<article>`：独立、可复用的内容，如文章、评论、产品卡片。
- `<aside>`：侧边栏、附加信息。
- `<footer>`：页面或区块的底部，常含版权、联系方式。

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <title>页面结构</title>
  </head>
  <body>
    <header>
      <h1>我的博客</h1>
      <nav>
        <ul>
          <li><a href="/">首页</a></li>
          <li><a href="/about">关于</a></li>
        </ul>
      </nav>
    </header>

    <main>
      <article>
        <header>
          <h2>学习 HTML</h2>
          <p><time datetime="2026-07-23">2026 年 7 月 23 日</time></p>
        </header>
        <section>
          <h3>为什么语义化</h3>
          <p>语义化标签让结构更清晰。</p>
        </section>
        <footer>
          <p>作者：张三</p>
        </footer>
      </article>

      <aside>
        <h2>相关文章</h2>
        <ul>
          <li><a href="#">CSS 基础</a></li>
        </ul>
      </aside>
    </main>

    <footer>
      <p>&copy; 2026 我的博客</p>
    </footer>
  </body>
</html>
```

**变体 / 边界**

- `<header>` 和 `<footer>` 可以用在 `<article>`、`<section>` 内部。
- `<main>` 不能嵌套在 `<article>`、`<aside>`、`<footer>`、`<header>`、`<nav>` 中。

**易错点**：页面出现多个 `<main>`；把 `<nav>` 包所有链接（面包屑、页脚链接等），应只包主要导航。

---

### 8.3 内容语义标签

- `<figure>` / `<figcaption>`：带说明的独立内容。
- `<time>`：日期/时间，使用 `datetime` 提供机器可读格式。
- `<mark>`：高亮文本。
- `<details>` / `<summary>`：可折叠内容。
- `<address>`：联系信息。

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <title>内容语义标签</title>
  </head>
  <body>
    <p>发布于 <time datetime="2026-07-23T10:00:00+08:00">2026 年 7 月 23 日上午 10 点</time></p>

    <p>请记住 <mark>语义化</mark> 的重要性。</p>

    <details>
      <summary>点击查看更多</summary>
      <p>这里是折叠的详细内容。</p>
    </details>

    <address>
      联系作者：<a href="mailto:author@example.com">author@example.com</a>
    </address>
  </body>
</html>
```

**变体 / 边界**

- `datetime` 格式：`YYYY-MM-DD`、`HH:MM`、`YYYY-MM-DDTHH:MM:SS` 等。

```html
<time datetime="2026-07-23">2026/07/23</time>
```

**易错点**：`<address>` 不用于普通地址，只用于文档/文章的联系信息。

---

### 8.4 无语义容器 div / span

- `<div>`：无语义块级容器，用于布局或分组。
- `<span>`：无语义行内容器，用于局部样式。

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <title>div 与 span</title>
  </head>
  <body>
    <div class="card">
      <h2>卡片标题</h2>
      <p>这是一段描述，其中 <span class="highlight">关键词</span> 高亮显示。</p>
    </div>
  </body>
</html>
```

**变体 / 边界**

- 只要存在更合适的语义标签，就不应使用 `div`/`span`。

**易错点**：所有元素都用 `div`，导致页面没有语义结构，影响可访问性和 SEO。

---

## 第九章 无障碍 Accessibility

### 9.1 无障碍基础

- 无障碍（a11y）让残障人士也能使用网页。
- 主要辅助技术：屏幕阅读器、放大镜、语音识别、盲文键盘。

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <title>无障碍基础</title>
  </head>
  <body>
    <main>
      <h1>无障碍网页示例</h1>
      <p>本页面使用语义化标签和清晰的标题结构。</p>
    </main>
  </body>
</html>
```

**记忆口诀**：S.T.A.R.K

- **S**emantic HTML（语义化 HTML）
- **T**abindex（焦点管理）
- **A**RIA（辅助属性）
- **R**ole（角色）
- **K**eyboard navigation（键盘导航）

---

### 9.2 标题与标签

- 标题层级应连续，不要跳级。
- 所有表单控件都需要 `<label>` 或 `aria-label`。

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <title>标题与标签</title>
  </head>
  <body>
    <h1>主标题</h1>
    <h2>子标题</h2>
    <h3>更小子标题</h3>

    <form>
      <label for="name">姓名：</label>
      <input type="text" id="name" name="name" />

      <!-- 无可见标签时，用 aria-label -->
      <input type="search" aria-label="搜索内容" name="q" />
    </form>
  </body>
</html>
```

**易错点**：为了视觉把标题级别调大/调小，破坏文档大纲。

---

### 9.3 图片替代文本

- 信息性图片：写清楚内容或功能。
- 装饰性图片：`alt=""`。
- 复杂图表：用 `alt` 简要说明，并提供长描述。

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <title>图片替代文本</title>
  </head>
  <body>
    <!-- 信息性图片 -->
    <img src="chart.png" alt="2026 年第一季度销售额增长 25%" />

    <!-- 装饰性图片 -->
    <img src="divider.png" alt="" />

    <!-- 复杂图表提供长描述 -->
    <figure>
      <img src="complex-chart.png" alt="年度销售趋势图，详见下文描述" />
      <figcaption>详细描述：...</figcaption>
    </figure>
  </body>
</html>
```

**易错点**：`alt` 写“图片”或重复标题，没有实际信息。

---

### 9.4 键盘与焦点

- 所有交互元素应可通过键盘访问（Tab、Enter、Space）。
- `tabindex="0"`：让普通元素可聚焦。
- `tabindex="-1"`：可通过脚本聚焦，但不进入 Tab 顺序。
- 避免使用正的 `tabindex`（如 1、2、3），会破坏自然 Tab 顺序。

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <title>键盘焦点</title>
  </head>
  <body>
    <a href="#">普通链接</a>
    <button>普通按钮</button>

    <!-- 可聚焦的自定义组件 -->
    <div role="button" tabindex="0" aria-pressed="false">自定义按钮</div>

    <!-- 脚本聚焦目标 -->
    <div id="error" tabindex="-1" role="alert">错误提示信息</div>
  </body>
</html>
```

**易错点**：用 `tabindex="1"`、`tabindex="2"` 控制顺序，会让键盘导航混乱。

---

### 9.5 ARIA 角色与属性

- ARIA（Accessible Rich Internet Applications）补充语义，但**不能替代语义化 HTML**。
- 常用角色：`button`、`navigation`、`main`、`img`、`alert`、`dialog`、`tablist` 等。
- 常用属性：`aria-label`、`aria-labelledby`、`aria-describedby`、`aria-expanded`、`aria-hidden`、`aria-live`。

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <title>ARIA 示例</title>
  </head>
  <body>
    <nav aria-label="主导航">
      <ul>
        <li><a href="/">首页</a></li>
        <li><a href="/about">关于</a></li>
      </ul>
    </nav>

    <button aria-expanded="false" aria-controls="menu" id="menuBtn">展开菜单</button>
    <ul id="menu" hidden>
      <li><a href="#">选项一</a></li>
      <li><a href="#">选项二</a></li>
    </ul>

    <div role="alert" aria-live="assertive">提交失败，请检查网络。</div>

    <!-- 装饰性图标隐藏 -->
    <button>
      <span aria-hidden="true">&#128722;</span>
      <span class="visually-hidden">购物车</span>
    </button>
  </body>
</html>
```

**变体 / 边界**

- `aria-labelledby` 引用可见文本作为标签。

```html
<h2 id="shipping-title">配送地址</h2>
<div role="region" aria-labelledby="shipping-title">...</div>
```

**易错点**：过度使用 ARIA，例如给 `<button>` 再加 `role="button"`；优先使用正确标签。

---

### 9.6 跳转链接

- “跳到主要内容”链接让键盘用户跳过重复导航。
- 通常放在页面最顶部，平时隐藏，聚焦时显示。

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <title>跳转链接</title>
    <style>
      .skip-link {
        position: absolute;
        top: -40px;
        left: 0;
        background: #000;
        color: #fff;
        padding: 8px;
        z-index: 100;
      }
      .skip-link:focus {
        top: 0;
      }
    </style>
  </head>
  <body>
    <a href="#main-content" class="skip-link">跳到主要内容</a>

    <nav>
      <ul>
        <li><a href="#">首页</a></li>
        <li><a href="#">关于</a></li>
      </ul>
    </nav>

    <main id="main-content">
      <h1>主要内容</h1>
      <p>这里是页面的核心内容。</p>
    </main>
  </body>
</html>
```

**易错点**：跳转目标 `id` 不存在，或目标元素不可聚焦，导致跳转无效。

---

### 9.7 媒体无障碍

- 视频应提供字幕（`<track kind="subtitles">`）或文字稿。
- 音频应提供文字稿。
- 自动播放的媒体应默认静音，避免打扰用户。

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <title>媒体无障碍</title>
  </head>
  <body>
    <video controls crossorigin="anonymous">
      <source src="video.mp4" type="video/mp4" />
      <track kind="subtitles" src="subs-zh.vtt" srclang="zh" label="中文字幕" default />
      <track kind="captions" src="subs-en.vtt" srclang="en" label="English" />
    </video>

    <details>
      <summary>视频文字稿</summary>
      <p>00:00 欢迎来到 HTML 课程...</p>
    </details>
  </body>
</html>
```

**易错点**：字幕文件格式错误（VTT 必须以 `WEBVTT` 开头），导致字幕不显示。

---

## 第十章 SEO 基础

- SEO（Search Engine Optimization）帮助搜索引擎理解页面内容。
- HTML 层面的 SEO 要点：
  1. 唯一的 `<title>`。
  2. `<meta name="description">`。
  3. 一个 `<h1>` 表达页面主题。
  4. 语义化结构（header、nav、main、article 等）。
  5. 图片 `alt`。
  6. 链接文本有意义（避免“点击这里”）。
  7. 设置 `lang`。

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="系统学习 freeCodeCamp HTML 课程的完整笔记，包含示例、口诀和易错点。" />
    <title>HTML 系统背诵手册 | freeCodeCamp</title>
  </head>
  <body>
    <header>
      <nav>
        <a href="/">首页</a>
        <a href="/html">HTML</a>
        <a href="/css">CSS</a>
      </nav>
    </header>

    <main>
      <article>
        <h1>HTML 系统背诵手册</h1>
        <p>本手册覆盖 freeCodeCamp 响应式网页设计 v9 的 HTML 全部主题。</p>

        <section>
          <h2>为什么语义化对 SEO 重要</h2>
          <p>搜索引擎通过标题和语义标签理解页面结构。</p>
        </section>

        <section>
          <h2>图片优化</h2>
          <img src="html-structure.png" alt="HTML 文档结构示意图" />
        </section>
      </article>
    </main>

    <footer>
      <p>&copy; 2026 前端学习笔记</p>
    </footer>
  </body>
</html>
```

**变体 / 边界**

- 多语言站点可使用 `<link rel="alternate" hreflang="...">` 告知搜索引擎不同语言版本。

**易错点**：`<title>` 太短或堆砌关键词；`<h1>` 缺失或与标题不相关。

---

## 第十一章 速查表

### 文档骨架

| 标签/属性 | 作用 |
|---|---|
| `<!DOCTYPE html>` | 声明 HTML5 文档类型 |
| `<html lang="zh-CN">` | 根元素，声明语言 |
| `<head>` | 元数据容器 |
| `<meta charset="UTF-8">` | 字符编码 |
| `<meta name="viewport" ...>` | 移动端视口 |
| `<title>` | 页面标题 |
| `<body>` | 可见内容 |
| `<!-- 注释 -->` | 注释 |

### 文本

| 标签 | 语义 |
|---|---|
| `<h1>` - `<h6>` | 标题 |
| `<p>` | 段落 |
| `<br>` | 换行 |
| `<hr>` | 主题分隔 |
| `<strong>` | 重要性 |
| `<em>` | 强调 |
| `<mark>` | 高亮 |
| `<del>` / `<ins>` | 删除 / 插入 |
| `<sub>` / `<sup>` | 下标 / 上标 |
| `<code>` / `<pre>` | 代码 |
| `<blockquote>` / `<q>` | 引用 |
| `<abbr>` | 缩写 |
| `<address>` | 联系信息 |

### 列表

| 标签 | 作用 |
|---|---|
| `<ul>` / `<li>` | 无序列表 |
| `<ol>` / `<li>` | 有序列表（`start`、`reversed`、`type`） |
| `<dl>` / `<dt>` / `<dd>` | 定义列表 |

### 链接

| 属性/用法 | 作用 |
|---|---|
| `href` | 目标地址 |
| `target="_blank"` | 新标签页打开 |
| `rel="noopener noreferrer"` | 安全/反追踪 |
| `download` | 下载 |
| `href="#id"` | 页内锚点 |
| `mailto:` / `tel:` | 邮件 / 电话 |

### 媒体

| 标签 | 作用 |
|---|---|
| `<img>` | 图片（`src`、`alt`、`width`、`height`、`loading`） |
| `<figure>` / `<figcaption>` | 带说明的内容 |
| `<picture>` / `<source>` | 响应式图片 |
| `<audio>` | 音频 |
| `<video>` | 视频 |
| `<track>` | 字幕/标题 |
| `<iframe>` | 嵌入页面 |
| `<svg>` | 矢量图 |

### 表格

| 标签 | 作用 |
|---|---|
| `<table>` | 表格 |
| `<tr>` | 行 |
| `<th>` | 表头单元格（`scope="col/row"`） |
| `<td>` | 数据单元格 |
| `<thead>` / `<tbody>` / `<tfoot>` | 表头/表体/表尾 |
| `<caption>` | 表格标题 |
| `colspan` / `rowspan` | 合并单元格 |

### 表单

| 标签/属性 | 作用 |
|---|---|
| `<form>` | 表单（`action`、`method`、`enctype`） |
| `<input>` | 输入控件（`type` 决定形态） |
| `<label>` | 标签（`for` 或隐式关联） |
| `<textarea>` | 多行文本 |
| `<select>` / `<option>` / `<optgroup>` | 下拉选择 |
| `<button>` | 按钮（`submit`、`reset`、`button`） |
| `<fieldset>` / `<legend>` | 字段分组 |
| `<datalist>` | 输入建议 |
| `<output>` | 计算输出 |
| `required`、`min`、`max`、`pattern` | 验证 |
| `disabled`、`readonly` | 状态 |

### 语义化结构

| 标签 | 作用 |
|---|---|
| `<header>` | 头部 |
| `<nav>` | 导航 |
| `<main>` | 主要内容（每页一个） |
| `<section>` | 主题区块 |
| `<article>` | 独立内容 |
| `<aside>` | 侧边/附加 |
| `<footer>` | 底部 |
| `<figure>` / `<figcaption>` | 图文单元 |
| `<time>` | 时间 |
| `<details>` / `<summary>` | 折叠 |

### 无障碍

| 概念 | 用法 |
|---|---|
| `lang` | 声明语言 |
| `alt` | 图片替代文本 |
| `<label>` | 表单标签 |
| 标题层级 | 连续不跳级 |
| `tabindex="0"` / `tabindex="-1"` | 可聚焦 / 脚本聚焦 |
| ARIA 角色/属性 | 补充语义 |
| 跳转链接 | 跳过重复导航 |
| `<track>` | 视频字幕 |

---

## 第十二章 背诵口诀

1. **文档骨架**
   > 文档类型要声明，html 包 head body；charset、viewport、title，三个 meta 别忘记。

2. **标题层级**
   > h1 到 h6，重要性递减；一个页面一 h1，跳级是大忌。

3. **文本格式化**
   > strong 重要 em 强调，del 删除 ins 新增；mark 高亮 small 注，sub 下标 sup 上标。

4. **列表记忆**
   > ul 无序 ol 有序，li 是项目要牢记；dl dt dd 是定义，嵌套必须放 li 里。

5. **链接三宝**
   > a 标签 href 不可少，新窗口要加 target；noopener noreferrer 安全好，锚点邮件 tel 也要会。

6. **图片原则**
   > img 两个属性 src 和 alt，信息图片写清楚，装饰图片 alt 空。

7. **音视频**
   > audio 和 video，source 兜底要写够；track 字幕 controls 控，autoplay 最好 muted 走。

8. **表格**
   > table tr th td，thead tbody tfoot 分；caption 标题 scope 眼，colspan rowspan 并单元。

9. **表单**
   > form action method 先，input 类型看需求；label for 配 id，radio checkbox name 同组连。

10. **验证**
    > required 必填 pattern 正则，min max step 控范围；disabled 不提交 readonly 只读，placeholder 提示别当值。

11. **语义化**
    > header nav main，section article aside footer；能用语义别用 div，结构清晰 SEO 喜。

12. **无障碍**
    > S.T.A.R.K 记心间，语义标签走在先；alt、label、heading 齐，键盘跳转 ARIA 辅。

---

## 第十三章 易错点清单

1. **文档声明**
   - 错：不写 `<!DOCTYPE html>`。
   - 对：每个 HTML 文件第一行都写 `<!DOCTYPE html>`。

2. **lang 与编码**
   - 错：中文页面不写 `lang="zh-CN"` 或 `<meta charset="UTF-8">`。
   - 对：根元素声明语言，head 内写 UTF-8 编码。

3. **空元素**
   - 错：`<br></br>`、`<img></img>`。
   - 对：`<br>`、`<img ... />` 或 `<img ...>`。

4. **标题层级**
   - 错：页面多个 `<h1>`，或从 h1 直接跳到 h3。
   - 对：一个 `<h1>`，层级连续。

5. **img 的 alt**
   - 错：`alt="图片"`、`alt="image"`、缺少 `alt`。
   - 对：描述内容或功能，装饰图用 `alt=""`。

6. **label 关联**
   - 错：`for` 与 `id` 不一致，或控件没有 `id`。
   - 对：显式用 `for="id"`，或隐式把控件包在 label 内。

7. **radio/checkbox 分组**
   - 错：同一组 radio 没有相同 `name`。
   - 对：同一组 `name` 相同，`value` 不同，`checked` 默认选中。

8. **表单提交**
   - 错：控件缺少 `name`，服务器收不到数据。
   - 对：需要提交的字段都写 `name`。

9. **button 类型**
   - 错：表单内 `<button>取消</button>` 没写 `type="button"`。
   - 对：明确 `type="submit"`、`type="reset"` 或 `type="button"`。

10. **表格布局**
    - 错：用 table 做整个页面布局。
    - 对：table 只展示表格数据，布局用 CSS。

11. **语义化容器**
    - 错：所有结构都用 `<div>`。
    - 对：header、nav、main、section、article、aside、footer 各尽其职。

12. **ARIA 滥用**
    - 错：给已有语义的 `<button>` 再加 `role="button"`。
    - 对：优先用正确标签，ARIA 仅作补充。

13. **tabindex 误用**
    - 错：使用 `tabindex="1"`、`tabindex="2"` 控制顺序。
    - 对：用 `tabindex="0"` 让元素可聚焦，用 `tabindex="-1"` 给脚本聚焦。

14. **target="_blank"**
    - 错：只写 `target="_blank"`。
    - 对：加 `rel="noopener noreferrer"`。

15. **iframe 安全**
    - 错：iframe 没有 `title`，也没有 `sandbox`。
    - 对：写 `title`，必要时加 `sandbox` 限制权限。

16. **自动播放媒体**
    - 错：`<video autoplay>` 默认有声播放。
    - 对：自动播放配合 `muted`，避免打扰用户和被浏览器阻止。

---

## 附录：完整综合示例

以下示例把本章大部分知识点整合到一个页面中，可作为复习模板直接运行。

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="freeCodeCamp HTML 综合复习页面" />
    <title>HTML 综合复习 | freeCodeCamp</title>
  </head>
  <body>
    <a href="#main" class="skip-link">跳到主要内容</a>

    <header>
      <h1>HTML 综合复习</h1>
      <nav aria-label="主导航">
        <ul>
          <li><a href="#structure">结构</a></li>
          <li><a href="#media">媒体</a></li>
          <li><a href="#form">表单</a></li>
          <li><a href="#table">表格</a></li>
        </ul>
      </nav>
    </header>

    <main id="main">
      <section id="structure">
        <h2>页面结构</h2>
        <p>使用 <strong>语义化标签</strong> 让内容更清晰。</p>
        <article>
          <h3>文章标题</h3>
          <p>发布于 <time datetime="2026-07-23">2026 年 7 月 23 日</time></p>
          <p>详情见 <a href="https://www.freecodecamp.org/chinese/" target="_blank" rel="noopener noreferrer">freeCodeCamp</a>。</p>
        </article>
      </section>

      <section id="media">
        <h2>媒体</h2>
        <figure>
          <img src="https://via.placeholder.com/300x200?text=HTML" alt="HTML 占位图" width="300" height="200" />
          <figcaption>图 1：HTML 学习图示</figcaption>
        </figure>
      </section>

      <section id="form">
        <h2>表单</h2>
        <form action="/submit" method="POST">
          <fieldset>
            <legend>个人信息</legend>
            <label for="name">姓名：</label>
            <input type="text" id="name" name="name" required />

            <label for="email">邮箱：</label>
            <input type="email" id="email" name="email" required />
          </fieldset>

          <fieldset>
            <legend>偏好</legend>
            <label><input type="radio" name="level" value="beginner" checked /> 初级</label>
            <label><input type="radio" name="level" value="advanced" /> 高级</label>

            <label><input type="checkbox" name="newsletter" checked /> 订阅邮件</label>
          </fieldset>

          <button type="submit">提交</button>
        </form>
      </section>

      <section id="table">
        <h2>表格</h2>
        <table border="1">
          <caption>学习进度</caption>
          <thead>
            <tr>
              <th scope="col">主题</th>
              <th scope="col">状态</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>HTML</td>
              <td>已完成</td>
            </tr>
            <tr>
              <td>CSS</td>
              <td>进行中</td>
            </tr>
          </tbody>
        </table>
      </section>
    </main>

    <footer>
      <address>联系作者：<a href="mailto:study@example.com">study@example.com</a></address>
      <p>&copy; 2026 HTML 学习笔记</p>
    </footer>
  </body>
</html>
```

---

*本手册覆盖 freeCodeCamp 响应式网页设计 v9 的 HTML 基础、语义化、表单与表格、无障碍、SEO 等全部核心主题。建议先通读一遍，再对照速查表和口诀反复背诵，最后通过动手写综合示例来巩固。*
