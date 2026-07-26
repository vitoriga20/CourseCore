# 任务计划 - 力学/光学练习PDF接入训练小节

## 目标

将 `力学练习一~七.pdf` 与 `波动光学练习一~六.pdf`（共13份，不含综合测试）用 MinerU 提取后，接入 CourseCore「大学物理B（上）」课程，作为每个理论小节后的 **训练** 小节。训练视图完全复用现有综合测验的 `quizSession` 模板与交互。

## 数据来源与排除

- **接入**：13 份练习 PDF（力学 7 份 + 波动光学 6 份）
- **排除**：`力学综合测试.pdf`、`波动光学综合测试.pdf`

## 课程小节映射

### 力学（每个 theory 后紧跟 training）

| theory 小节 | 训练小节 | PDF |
|---|---|---|
| p1b-m1-01 质点运动学基础 | p1b-m1-01-training | 力学练习一.pdf |
| p1b-m1-02 质点运动学与相对运动 | p1b-m1-02-training | 力学练习二.pdf |
| p1b-m1-03 牛顿运动定律与非惯性系 | p1b-m1-03-training | 力学练习三.pdf |
| p1b-m1-04 动量与动量守恒定律 | p1b-m1-04-training | 力学练习四.pdf |
| p1b-m1-05 功和能与机械能守恒定律 | p1b-m1-05-training | 力学练习五.pdf |
| p1b-m1-06 角动量与角动量守恒定律 | p1b-m1-06-training | 力学练习六.pdf |
| p1b-m1-07 刚体的定轴转动 | p1b-m1-07-training | 力学练习七.pdf |

### 波动光学（仅前 6 个 theory 配 training）

| theory 小节 | 训练小节 | PDF |
|---|---|---|
| p1b-m2-01 光的干涉基础 | p1b-m2-01-training | 波动光学练习一.pdf |
| p1b-m2-02 光程差与薄膜干涉 | p1b-m2-02-training | 波动光学练习二.pdf |
| p1b-m2-03 薄膜干涉与迈克耳逊干涉仪 | p1b-m2-03-training | 波动光学练习三.pdf |
| p1b-m2-04 光的衍射与单缝衍射 | p1b-m2-04-training | 波动光学练习四.pdf |
| p1b-m2-05 光栅衍射 | p1b-m2-05-training | 波动光学练习五.pdf |
| p1b-m2-06 光学仪器分辨率与X射线衍射 | p1b-m2-06-training | 波动光学练习六.pdf |

> p1b-m2-07、p1b-m2-08 暂无对应练习 PDF，本次不创建训练小节。

## 执行阶段

### 阶段 1：扩展课程结构与标签

- 修改 `coursecore/src/data/courses.js`：在力学每个 theory 小节后插入 training 小节；在波动光学前 6 个 theory 小节后各插入一个 training 小节。
- 修改 `coursecore/src/data/labels.js`：`TYPE_LABELS` 新增 `training: "训练"`。
- 修改 `coursecore/src/views/practiceList.js`：`item.type === 'quiz' || item.type === 'training'` 时走 `renderQuizSession`，wrapperClass 统一使用 `max-w-7xl mx-auto`。

### 阶段 2：创建训练题构建脚本

- 创建 `coursecore/builders/training-builder.js`：
  - 扫描 CourseCore 根目录下 `力学练习*.pdf` 和 `波动光学练习*.pdf`，排除 `*综合测试.pdf`。
  - 调用 MinerU 提取为 Markdown。
  - 按大题标题识别题型（选择题/填空题/计算题），按题号拆分题目。
  - 统一生成 `questionType: proof`、`answer: ""` 的 Markdown 文件（用户后续补答案后可改为自动判题）。
  - 图片复制到 `coursecore/public/physics/training/<pdfName>/`，并替换 Markdown 中的图片路径。
- 更新 `coursecore/package.json`：新增 `build:training`，调整 `build:data` 为先跑 `training-builder.js` 再跑 `question-builder.js`。

### 阶段 3：生成训练题 Markdown

- 运行 `npm run build:training`。
- 检查 `coursecore/curriculum/raw/questions/physics-b-1/*-training/` 是否生成对应题目文件。

### 阶段 4：构建与全链路验证

- 运行 `npm run build:data`，确认 `src/data/questions.js` 包含 training 小节题目。
- 运行 `npm run build`，确认 Vite 构建与预渲染通过。
- 运行 `npm run preview`：
  - 访问 `/course/physics-b-1`，确认训练小节显示。
  - 进入训练小节，确认顺序/随机、字体/背景、题号导航、完成报告均正常。
  - 提交一题，确认显示「请对照参考答案自行检查」。

### 阶段 5：文档同步

- 更新 `coursecore/development-log.md`。
- 更新 `.trae/documents/technical-architecture.md` 中目录与数据流说明。
- 更新 `.trae/documents/prd.md` 中训练小节相关描述。

## 关键决策

| 决策 | 说明 |
|---|---|
| 训练小节类型为 `training` | 与 `quiz` 区分，便于后续统计与样式定制。 |
| 训练视图复用 `quizSession` | 完全保留顺序/随机切换、字体/背景切换、题号导航、完成报告。 |
| 训练题初始统一为 `proof` 类型 | 因答案留空，无法自动判分；用户补答案后可改为对应题型。 |
| 图片统一放到 `public/physics/training/<pdfName>/` | 与综合测验图片隔离，路径清晰。 |

## 关联文档

- 详细实现方案：`c:\Users\vitoriga\OneDrive\Desktop\CourseCore\.trae\documents\physics-training-integration-plan.md`
