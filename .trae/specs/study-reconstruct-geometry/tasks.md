# Tasks

- [x] Task 1: 逐帧分析 Reconstruct 视频并产出结构化文档
  - [x] SubTask 1.1: 读取本地视频文件 `_Reconstruct__video.mp4`
  - [x] SubTask 1.2: 按时间戳划分视觉阶段（0.0–1.5s、1.5–2.0s、2.0–3.5s、3.5–5.0s、5.0–6.5s、6.5–8.5s、8.5–16.6s、16.6–18.6s）
  - [x] SubTask 1.3: 记录每个阶段的几何元素、颜色、透明度、线宽、运动、节奏
  - [x] SubTask 1.4: 将分析写入 `.trae/documents/reconstruct-geometry-analysis.md`

- [x] Task 2: 提取可复用几何模式与工程参数
  - [x] SubTask 2.1: 空间与透视系统
    - 透视网格（消失点、线数、透明度、线宽、透视压缩指数）
    - 放射射线（原点、数量、发散角度、长度、线宽）
    - 倾斜网格/地面（旋转、倾斜角度、Z 轴推进速度）
  - [x] SubTask 2.2: 几何母题
    - 星芒/asterisk（瓣数、长宽比、半径、旋转速度、错位阴影）
    - 椭圆/圆环与缺片（半径、缺口角度、描边/填充、倾斜）
    - 同心圆环/曼荼罗（环数、间距、放射线数、差速旋转、生长动画）
    - 3D 圆环/torus（大半径、管半径、颜色、双轴旋转、线框叠加）
    - 3D 基础体穿插（方块、球体、圆柱、透镜的尺寸、排列、旋转、前后景）
    - 碎片多边形（碎片数量、聚合/崩解动画、运动模糊、旋转）
  - [x] SubTask 2.3: 排版与信息几何
    - 文字卡片堆叠（尺寸、错位偏移、阴影、数量、滚动方向）
    - 巨型文字作为容器（字体大小、透明度、字母替换、穿插体块）
    - 文字列/传送带（条目数、滚动速度、翻转角度、间距）
    - 混合字体系统（display/mono/script 比例、字重、用途分配）
  - [x] SubTask 2.4: 构图与布局系统
    - 中心放射构图（中心点、元素分布、缩放节奏）
    - 左右/上下分屏（分割线、两侧权重、动态平衡）
    - 横向阵列/模块化重复（模块数量、间距、平移速度、连接弧线）
    - 进度点/指示器（点数、高亮节奏、大小变化）
  - [x] SubTask 2.5: 动态与转场语言
    - 反色/闪光切换（触发时机、过渡时长、反色范围）
    - 擦除/clip-path 转场（方向、遮罩形状、时长）
    - 翻页/面板翻动（翻动轴、角度、阴影）
    - 运动拖尾/残影（拖尾长度、淡出速率、采样帧数）
    - 生长/绽放动画（起始/目标缩放、时长、缓动）
  - [x] SubTask 2.6: 质感与层次系统
    - 黑白层次（透明度分层、线宽变化、错位阴影、运动拖尾、体积渐变）
    - 照片/纹理与矢量混合（纹理遮罩、对比度、混合模式、动态 pan）
    - 暗角/晕影收尾（暗角强度、过渡范围）
  - [x] SubTask 2.7: 节奏与叙事结构
    - 节拍同步（BPM 推算、切换间隔、重拍标记）
    - Loop 单元（8.2 秒单元阶段划分与重复策略）
    - 解构—重构叙事弧线（Disorder → Formation → Overflow → Consciousness → Regularity → Scripts → Architecture → Crusher → Intertwine）
  - [x] SubTask 2.8: 为每个模式编写 p5.js/Canvas/CSS 可复用代码片段

- [x] Task 3: 创建 geometric-design-engineering Skill
  - [x] SubTask 3.1: 创建 Skill 目录 `.trae/skills/geometric-design-engineering/`
  - [x] SubTask 3.2: 编写 `SKILL.md`，包含调用方式、设计模式库、参数表、代码片段、与 algorithmic-art 衔接说明
  - [x] SubTask 3.3: 验证 Skill 文件格式正确、可被识别

- [x] Task 4: 定义与 algorithmic-art 的协作流程
  - [x] SubTask 4.1: 编写“设计 → 生成”提示词模板
  - [x] SubTask 4.2: 编写“生成 → 调优”检查清单
  - [x] SubTask 4.3: 在 Skill 文档中给出完整协作示例

# Task Dependencies

- Task 2 依赖 Task 1
- Task 3 依赖 Task 2
- Task 4