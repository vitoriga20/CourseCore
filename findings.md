# 研究发现 - 力学/光学练习PDF接入训练小节

## 已确认事实

### PDF 文件清单

- **力学练习**：一、二、三、四、五、六、七（共 7 份）
- **波动光学练习**：一、二、三、四、五、六（共 6 份）
- **排除**：`力学综合测试.pdf`、`波动光学综合测试.pdf`

### MinerU 可用性

- `mineru.exe` 位于 `C:\Users\vitoriga\anaconda3\Scripts\mineru.exe`
- 版本：`mineru, version 3.0.4`

### 当前课程结构（`coursecore/src/data/courses.js`）

- **力学模块 `p1b-m1`**：7 个 theory 小节 + 1 个 quiz 小节。
- **波动光学模块 `p1b-m2`**：8 个 theory 小节 + 1 个 quiz 小节。
- 现有小节 ID 连续，无 training 类型。

### 视图与构建现状

- `quizSession.js` 仅依赖 `QUESTIONS.filter(q => q.itemId === itemId)`，不限制小节类型。
- `practiceList.js` 仅当 `item.type === 'quiz'` 时调用 `renderQuizSession`。
- `labels.js` 的 `TYPE_LABELS` 中尚无 `training`。
- `question-builder.js` 要求每道题必须存在 `answer` 或 `answers` 字段，但允许空字符串。
- `package.json` 中 `build:data` 仅调用 `question-builder.js`。

### 关键约束

- 训练题答案留空，初始无法自动判分。
- 波动光学后 2 个 theory 小节（p1b-m2-07、p1b-m2-08）无对应练习 PDF。
