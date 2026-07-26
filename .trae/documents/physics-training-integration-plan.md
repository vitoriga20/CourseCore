# 大学物理B（上）练习PDF接入"训练"小节执行计划

## 1. 概要（Summary）

将力学练习一~七、波动光学练习一~六共13份练习PDF（不含综合测试）用MinerU提取后，接入CourseCore的"大学物理B（上）"课程，作为每个理论小节后的**训练**小节。训练视图完全复用现有综合测验的`quizSession`模板与交互（顺序/随机切换、字体/背景切换、题号导航、进度统计、完成报告）。

- **数据来源**：`力学练习一.pdf` ~ `力学练习七.pdf`、`波动光学练习一.pdf` ~ `波动光学练习六.pdf`
- **排除**：`力学综合测试.pdf`、`波动光学综合测试.pdf` 不参与本次提取
- **目标课程**：`大学物理B（上）`（`courseId: physics-b-1`）
- **小节组织**：每个理论小节后紧跟一个同主题训练小节；力学7个训练小节，波动光学前6个理论小节各配一个训练小节（后2个理论小节暂无对应练习PDF）
- **内容范围**：仅提取题干、选项、图片；答案留空，由用户后续补充

## 2. 当前状态分析（Current State Analysis）

### 2.1 课程结构

`coursecore/src/data/courses.js`中`大学物理B（上）`现有结构：

- **力学模块**（`p1b-m1`）：7个`theory`小节（`p1b-m1-01` ~ `p1b-m1-07`）+ 1个`quiz`小节（`p1b-m1-quiz`）
- **波动光学模块**（`p1b-m2`）：8个`theory`小节（`p1b-m2-01` ~ `p1b-m2-08`）+ 1个`quiz`小节（`p1b-m2-quiz`）

### 2.2 视图与题型

- `coursecore/src/views/quizSession.js`已提供通用测验视图，仅依赖`QUESTIONS.filter(q => q.itemId === itemId)`，不限制小节类型。
- `coursecore/src/views/practiceList.js`目前仅当`item.type === 'quiz'`时调用`renderQuizSession`，`theory`只显示占位讲义，`practice`走inline列表。
- `coursecore/src/data/labels.js`中尚无`training`类型标签。
- `coursecore/builders/question-builder.js`将`curriculum/raw/questions/**/*.md`构建为`src/data/questions.js`，要求每道题必须有`answer`或`answers`字段（值可为空字符串）。

### 2.3 工具环境

- MinerU CLI已安装：`mineru.exe`位于`C:\Users\vitoriga\anaconda3\Scripts\`，支持输出Markdown/JSON、公式解析、OCR模式。
- 练习PDF每份约2页，包含选择题、填空题、计算题，部分题目配图。

## 3. 具体改动方案（Proposed Changes）

### 3.1 扩展课程结构：`coursecore/src/data/courses.js`

在力学每个`theory`小节后插入一个`training`小节：

```js
{ id: "p1b-m1-01", type: "theory", title: "质点运动学基础" },
{ id: "p1b-m1-01-training", type: "training", title: "质点运动学基础 训练" },
{ id: "p1b-m1-02", type: "theory", title: "质点运动学与相对运动" },
{ id: "p1b-m1-02-training", type: "training", title: "质点运动学与相对运动 训练" },
// ... 以此类推至 p1b-m1-07
```

在波动光学前6个`theory`小节后各插入一个`training`小节：

```js
{ id: "p1b-m2-01", type: "theory", title: "光的干涉基础" },
{ id: "p1b-m2-01-training", type: "training", title: "光的干涉基础 训练" },
// ... 以此类推至 p1b-m2-06
{ id: "p1b-m2-07", type: "theory", title: "光的偏振" },
{ id: "p1b-m2-08", type: "theory", title: "反射折射偏振与双折射" },
```

不动现有`quiz`小节。

### 3.2 扩展类型标签：`coursecore/src/data/labels.js`

在`TYPE_LABELS`中新增：

```js
training: "训练"
```

### 3.3 让训练小节走测验视图：`coursecore/src/views/practiceList.js`

修改小节视图分发逻辑：

```js
if (item.type === 'quiz' || item.type === 'training') {
  bodyHtml = renderQuizSession(itemId);
} else if (item.type === 'theory') {
  bodyHtml = renderTheoryPlaceholder(item);
} else if (questions.length > 0) {
  bodyHtml = renderInlinePractice(itemId);
} else {
  bodyHtml = `<div class="card" style="color: var(--muted);">本节暂无训练题，阅读理论内容后继续学习下一节。</div>`;
}
```

`wrapperClass`对`training`与`quiz`一致使用`max-w-7xl mx-auto`。

### 3.4 新增训练题构建脚本：`coursecore/builders/training-builder.js`

该脚本负责：

1. **扫描PDF**：列出`CourseCore`根目录下所有`力学练习*.pdf`和`波动光学练习*.pdf`，排除`*综合测试.pdf`。
2. **MinerU提取**：对每个PDF执行：
   ```powershell
   mineru -p "力学练习一.pdf" -o ".trae-cn/work/6a64c52bd87f5de41c39316d/mineru-out/力学练习一" -m auto -l ch
   ```
3. **读取Markdown**：读取MinerU生成的`<pdfName>.md`。
4. **题目拆分**：
   - 按大题标题（一、选择题 / 二、填空题 / 三、计算题等）识别题型。
   - 按题号（如`1.`、`2.`）拆分为独立题目。
   - 选择题提取选项A/B/C/D；填空题提取含空位的题干；计算题提取完整题干。
5. **题型映射**：
   - 选择题 → `questionType: singleChoice`
   - 填空题 → `questionType: fillInBlank`
   - 计算/解答题 → `questionType: calculation`
   - 若无法判断 → 回退为`proof`
6. **生成Markdown**：每道题写入：
   ```
   coursecore/curriculum/raw/questions/physics-b-1/<itemId>/q-physics-b-1-<itemId>-001.md
   ```
   frontmatter示例：
   ```yaml
   ---
   id: "q-physics-b-1-p1b-m1-01-training-001"
   courseId: "physics-b-1"
   moduleId: "p1b-m1"
   itemId: "p1b-m1-01-training"
   questionType: "singleChoice"
   title: "第 1 题"
   answer: ""
   tags: ["质点运动学基础"]
   source: "力学练习一 第1题"
   ---
   ## Content
   题干内容

   ## Options
   - A. ...
   - B. ...
   - C. ...
   - D. ...
   ```
7. **图片处理**：
   - 将MinerU输出的`images/`复制到`coursecore/public/physics/training/<pdfName>/`。
   - Markdown中的相对图片路径替换为`/physics/training/<pdfName>/<img>`。

### 3.5 映射规则：练习PDF → training小节

| 模块 | 练习PDF | training小节 |
|---|---|---|
| 力学 | 力学练习一.pdf | p1b-m1-01-training |
| 力学 | 力学练习二.pdf | p1b-m1-02-training |
| 力学 | 力学练习三.pdf | p1b-m1-03-training |
| 力学 | 力学练习四.pdf | p1b-m1-04-training |
| 力学 | 力学练习五.pdf | p1b-m1-05-training |
| 力学 | 力学练习六.pdf | p1b-m1-06-training |
| 力学 | 力学练习七.pdf | p1b-m1-07-training |
| 波动光学 | 波动光学练习一.pdf | p1b-m2-01-training |
| 波动光学 | 波动光学练习二.pdf | p1b-m2-02-training |
| 波动光学 | 波动光学练习三.pdf | p1b-m2-03-training |
| 波动光学 | 波动光学练习四.pdf | p1b-m2-04-training |
| 波动光学 | 波动光学练习五.pdf | p1b-m2-05-training |
| 波动光学 | 波动光学练习六.pdf | p1b-m2-06-training |

波动光学`p1b-m2-07`、`p1b-m2-08`两个理论小节暂无对应练习PDF，本次不创建训练小节。

### 3.6 构建命令串联：`coursecore/package.json`

新增脚本并调整`build:data`：

```json
"build:training": "node builders/training-builder.js",
"build:data": "node builders/training-builder.js && node builders/question-builder.js",
"validate:data": "node builders/question-builder.js --validate"
```

`predev`/`prebuild`已调用`build:data`，因此开发/生产构建会自动生成训练题。

### 3.7 空答案处理

- `question-builder.js`校验逻辑为`!('answer' in q) && !('answers' in q)`，因此`answer: ""`可通过校验。
- `quizSession.js`中`validate()`会在答案为空时判定用户输入与空字符串不匹配，显示"回答错误"。为避免训练阶段误导用户，当`answer`为空字符串时，训练视图的提交按钮文案改为"提交并查看解析"，并直接显示"参考答案待补充"提示，不判定对错。
- 更简洁的实现：在`training-builder.js`生成`questionType: proof`且`answer: ""`，利用`manual`验证器直接显示"请对照参考答案自行检查"。待用户补充答案后，重新运行`build:data`即可切换为自动判题。

**推荐实现**：为降低首次提取复杂度，训练题统一生成`questionType: proof`、`answer: ""`，提交后显示"请对照参考答案自行检查"。用户后续在Markdown中修改`questionType`和`answer`即可启用自动判题。

## 4. 假设与决策（Assumptions & Decisions）

| 决策 | 说明 |
|---|---|
| 训练小节类型为`training` | 新增小节类型，与`quiz`区分，便于后续统计和样式定制。 |
| 每个力学theory后紧跟一个训练 | 力学练习一~七与7个theory一一对应。 |
| 波动光学仅前6个theory配训练 | 练习PDF只有6份，后2个theory本次不创建训练小节。 |
| 训练视图复用`quizSession` | 完全保留顺序/随机切换、字体/背景切换、题号导航、完成报告。 |
| 训练题初始统一为`proof`类型 | 因答案留空，无法自动判分；用户补答案后可改为对应题型。 |
| 图片统一放到`public/physics/training/<pdfName>/` | 与综合测验图片隔离，路径清晰。 |
| MinerU输出按题号拆分 | 假设PDF内题目编号清晰；若识别效果差，允许人工调整拆分规则。 |

## 5. 验证步骤（Verification Steps）

1. 运行`npm run build:training`，确认每个练习PDF都被MinerU处理，且生成了对应`curriculum/raw/questions/physics-b-1/*-training/`目录。
2. 运行`npm run build:data`，确认`src/data/questions.js`中出现13个training小节对应的题目。
3. 检查`src/data/courses.js`中每个力学theory后都有training小节，波动光学前6个theory后有training小节。
4. 检查`src/data/labels.js`中`training`标签值为"训练"。
5. 运行`npm run build`，确认Vite构建与预渲染通过，新item路由生成静态`index.html`。
6. 运行`npm run preview`预览：
   - 访问`/course/physics-b-1`，确认课程列表中出现所有训练小节。
   - 点击"质点运动学基础 训练"，进入`/item/p1b-m1-01-training`，确认加载训练视图。
   - 顺序/随机切换、字体/背景切换、题号导航、上一题/下一题/完成练习均可用。
   - 提交一题，确认显示"请对照参考答案自行检查"，不报错。
   - 完成全部题目后，确认显示"练习完成"报告。
7. 检查开发文档三件套已同步更新。

## 6. 待执行动作清单

- [ ] 更新`coursecore/src/data/courses.js`，插入training小节
- [ ] 更新`coursecore/src/data/labels.js`，新增`training`标签
- [ ] 修改`coursecore/src/views/practiceList.js`，training走quizSession视图
- [ ] 创建`coursecore/builders/training-builder.js`，实现MinerU提取与Markdown生成
- [ ] 更新`coursecore/package.json`，新增`build:training`并调整`build:data`
- [ ] 运行`npm run build:training`生成训练题Markdown
- [ ] 运行`npm run build:data`与`npm run build`验证
- [ ] 更新`coursecore/development-log.md`、`.trae/documents/technical-architecture.md`、`.trae/documents/prd.md`
