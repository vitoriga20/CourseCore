---
id: "q-physics-b-1-p1b-m1-03-training-002"
courseId: "physics-b-1"
moduleId: "p1b-m1"
itemId: "p1b-m1-03-training"
questionType: singleChoice
title: "第 2 题"
answer: "B"
tags: ["选择题"]
source: "力学练习三.pdf 第2题"
image: "/physics/training/p1b-m1-03-training/fa05c9f7443c261e509c0a00757428cdfaeed2a7f62dc8b730aba305f38e990b.jpg"
---

## Content

质量分别为 $m$ 和 $M$ 的滑块 $A$ 和 $B$，叠放在光滑水平桌面上，如图所示。$A$、$B$ 间静摩擦系数为 $\mu_s$，滑动摩擦系数为 $\mu_k$，系统原处于静止。今有一水平力作用于 $A$ 上，要使 $A$、$B$ 不发生相对滑动，则应有（    ）

## Options

- $F \leq \mu_s mg$
- $F \leq \mu_s (1 + m/M)mg$
- $F \leq \mu_s (m+M)mg$
- $F \leq \mu_s mg \frac{m}{M}$

## Solution

要使 $A$、$B$ 不发生相对滑动，两者必须保持相对静止，即具有相同加速度。此时 $A$、$B$ 之间的摩擦力为静摩擦力。

**整体法**：将 $A$、$B$ 看作整体，总质量为 $(M+m)$，只受水平拉力 $F$：

$$F = (M+m)a$$

**隔离法**：单独分析滑块 $B$，水平方向只受 $A$ 对 $B$ 的静摩擦力 $f$：

$$f = Ma$$

临界条件为静摩擦力达到最大静摩擦力：

$$f_{max} = \mu_s N_A = \mu_s mg$$

（$N_A$ 是 $A$ 对 $B$ 的压力，大小等于 $A$ 的重力 $mg$）

由隔离法得系统最大加速度：

$$Ma_{max} = \mu_s mg \Rightarrow a_{max} = \frac{\mu_s mg}{M}$$

代入整体法：

$$F_{max} = (M+m)a_{max} = (M+m)\cdot\frac{\mu_s mg}{M} = \mu_s mg\left(1+\frac{m}{M}\right)$$

故选 **B**。
