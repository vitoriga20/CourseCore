# 从 Reconstruct 视频学习几何设计与动效并沉淀为 Skill 的 Spec

## Why

用户希望逐帧、全面地学习 Bilibili 视频《Reconstruct》（UP：_紙）中的几何设计、排版与动效，并将学习成果沉淀为一个可复用的 Skill。该 Skill 需与现有 `algorithmic-art` Skill 形成互补：`algorithmic-art` 提供生成式艺术与工程化实现思维，本 Skill 则提供基于真实 MG 作品的几何设计分析、可复用模式与工程参数，最终服务于网页背景、小程序等实际应用场景。

## What Changes

- 对 `c:\Users\vitoriga\Downloads\物理试题\_Reconstruct__video.mp4` 进行逐帧/分阶段的几何与动效分析
- 提取可复用的几何模式，覆盖：透视系统、星芒/asterisk、同心圆环/曼荼罗、3D 圆环、碎片多边形、排版几何、构图系统、转场语言、节奏结构、黑白层次系统
- 将分析结果整理为结构化知识文档
- 创建一个新的 Skill（`geometric-design-engineering`），包含 SKILL.md 与可复用的设计参数/代码片段
- 明确与 `algorithmic-art` Skill 的协作方式：本 Skill 负责“设计意图与参数”，`algorithmic-art` 负责“算法化生成”

## Impact

- 新增 Skill 文件：`.trae/skills/geometric-design-engineering/SKILL.md` 及相关辅助文件
- 新增分析文档：`.trae/documents/reconstruct-geometry-analysis.md`
- 新增可复用代码片段：覆盖全部提取模式的 p5.js/Canvas/CSS 实现
- 不影响现有物理试题 HTML 与 build 脚本

## ADDED Requirements

### Requirement: 视频逐帧几何分析

The system SHALL provide a frame-by-frame breakdown of the Reconstruct video focusing on:

- **Scenario: 阶段划分**
  - **WHEN** 用户需要理解视频结构
  - **THEN** 文档按时间戳列出每个视觉阶段（0.0–1.5s、1.5–2.0s、2.0–3.5s、3.5–5.0s、5.0–6.5s、6.5–8.5s、8.5–16.6s 循环、16.6–18.6s 片尾）

- **Scenario: 元素识别**
  - **WHEN** 用户需要复现某个视觉元素
  - **THEN** 文档说明该阶段出现的几何图形、文字排版、颜色、透明度、线宽、运动方式

### Requirement: 可复用几何模式提取

The system SHALL extract reusable geometric patterns with engineering parameters:

#### 空间与透视系统
- **Scenario: 透视网格**
  - **WHEN** 用户需要网页背景中的空间纵深
  - **THEN** 提供消失点、线数、透明度、线宽、透视压缩指数的参数范围
- **Scenario: 放射射线**
  - **WHEN** 用户需要速度感或从中心发散的构图
  - **THEN** 提供原点、射线数量、发散角度、长度、线宽参数
- **Scenario: 倾斜网格/地面**
  - **WHEN** 用户需要舞台感或 3D 投影平面
  - **THEN** 提供网格旋转、倾斜角度、Z 轴推进速度参数

#### 几何母题
- **Scenario: 星芒/asterisk**
  - **WHEN** 用户需要装饰性几何焦点
  - **THEN** 提供瓣数、长宽比、半径、旋转速度、错位阴影参数
- **Scenario: 椭圆/圆环与缺片**
  - **WHEN** 用户需要柔和几何形或被切割的圆形
  - **THEN** 提供半径、缺口角度、描边/填充、倾斜参数
- **Scenario: 同心圆环/曼荼罗**
  - **WHEN** 用户需要中心放射构图
  - **THEN** 提供环数、间距、放射线数、差速旋转、生长动画参数
- **Scenario: 3D 圆环（torus）**
  - **WHEN** 用户需要立体几何元素
  - **THEN** 提供大半径、管半径、颜色、双轴旋转速度、线框叠加参数
- **Scenario: 3D 基础体穿插**
  - **WHEN** 用户需要方块、球体、圆柱、透镜等体块组合
  - **THEN** 提供体块类型、尺寸、排列、旋转、前后景关系参数
- **Scenario: 碎片多边形**
  - **WHEN** 用户需要破碎、重构、动感强烈的视觉
  - **THEN** 提供碎片数量、聚合/崩解动画、运动模糊、旋转参数

#### 排版与信息几何
- **Scenario: 文字卡片堆叠**
  - **WHEN** 用户需要标签、按钮、信息块的层叠效果
  - **THEN** 提供卡片尺寸、错位偏移、阴影、数量、滚动方向参数
- **Scenario: 巨型文字作为容器**
  - **WHEN** 用户需要让图形在字母前后穿梭
  - **THEN** 提供字体大小、透明度、字母替换、穿插体块参数
- **Scenario: 文字列/传送带**
  - **WHEN** 用户需要垂直或水平滚动的信息列
  - **THEN** 提供条目数、滚动速度、翻转角度、间距参数
- **Scenario: 混合字体系统**
  - **WHEN** 用户需要 display/mono/script 字体组合
  - **THEN** 提供字体比例、字重、用途分配参数

#### 构图与布局系统
- **Scenario: 中心放射构图**
  - **WHEN** 用户需要聚焦、秩序、重构感
  - **THEN** 提供中心点、元素分布、缩放节奏参数
- **Scenario: 左右/上下分屏**
  - **WHEN** 用户需要对比、并置、二分叙事
  - **THEN** 提供分割线、两侧元素权重、动态平衡参数
- **Scenario: 横向阵列/模块化重复**
  - **WHEN** 用户需要数据流、流水线、loop 感
  - **THEN** 提供模块数量、间距、平移速度、连接弧线参数
- **Scenario: 进度点/指示器**
  - **WHEN** 用户需要步骤、节拍、状态指示
  - **THEN** 提供点数、高亮节奏、大小变化参数

#### 动态与转场语言
- **Scenario: 反色/闪光切换**
  - **WHEN** 用户需要重拍标记或正负片冲击
  - **THEN** 提供触发时机、过渡时长、反色范围参数
- **Scenario: 擦除/clip-path 转场**
  - **WHEN** 用户需要文字或图形被部分遮挡/揭示
  - **THEN** 提供擦除方向、遮罩形状、时长参数
- **Scenario: 翻页/面板翻动**
  - **WHEN** 用户需要书页、卡片、面板切换
  - **THEN** 提供翻动轴、角度、阴影参数
- **Scenario: 运动拖尾/残影**
  - **WHEN** 用户需要速度感、破碎感
  - **THEN** 提供拖尾长度、淡出速率、采样帧数参数
- **Scenario: 生长/绽放动画**
  - **WHEN** 用户需要曼荼罗、花纹、线条从中心展开
  - **THEN** 提供起始缩放、目标缩放、时长、缓动参数

#### 质感与层次系统
- **Scenario: 黑白层次系统**
  - **WHEN** 用户在纯黑/白背景下需要制造层次
  - **THEN** 提供透明度分层、线宽变化、错位阴影、运动拖尾、体积渐变五种技法
- **Scenario: 照片/纹理与矢量混合**
  - **WHEN** 用户需要建筑、材质等真实纹理混入几何
  - **THEN** 提供纹理遮罩、对比度、混合模式、动态 pan 参数
- **Scenario: 暗角/晕影收尾**
  - **WHEN** 用户需要片尾、聚焦、收束感
  - **THEN** 提供暗角强度、过渡范围参数

### Requirement: 节奏与叙事结构

The system SHALL analyze the musical-rhythmic structure of the video:

- **Scenario: 节拍同步**
  - **WHEN** 用户需要动画与音乐/节奏对齐
  - **THEN** 提供 BPM 推算、切换间隔、重拍标记方法
- **Scenario: Loop 单元**
  - **WHEN** 用户需要循环播放的视觉单元
  - **THEN** 提供 8.2 秒单元的阶段划分与重复策略
- **Scenario: 解构—重构叙事弧线**
  - **WHEN** 用户需要从混乱到秩序的故事性动画
  - **THEN** 提供 Disorder → Formation → Overflow → Consciousness → Regularity → Scripts → Architecture → Crusher → Intertwine 的叙事模板

### Requirement: Skill 沉淀

The system SHALL create a user-invokable skill named `geometric-design-engineering`:

- **Scenario: 技能文件结构**
  - **WHEN** 用户调用 `/geometric-design-engineering`
  - **THEN** 技能加载并执行 SKILL.md 中定义的流程

- **Scenario: 技能输出**
  - **WHEN** 用户请求基于 MG 视频的几何设计分析
  - **THEN** 技能返回：设计模式、工程参数、适用场景、代码片段、与 algorithmic-art 的衔接建议

### Requirement: 与 algorithmic-art 的协作

The system SHALL define how `geometric-design-engineering` and `algorithmic-art` work together:

- **Scenario: 设计 → 生成**
  - **WHEN** 用户先用本 Skill 获得几何设计方案
  - **THEN** 本 Skill 输出可直接喂给 `algorithmic-art` 的“算法哲学提示词”，包含具体的参数、运动、配色要求

- **Scenario: 生成 → 调优**
  - **WHEN** `algorithmic-art` 生成初稿后
  - **THEN** 用户可调用本 Skill 对生成的几何构图、层次、节奏进行工程化评估与调优

## MODIFIED Requirements

无现有功能修改。

## REMOVED Requirements

无功能移除。
