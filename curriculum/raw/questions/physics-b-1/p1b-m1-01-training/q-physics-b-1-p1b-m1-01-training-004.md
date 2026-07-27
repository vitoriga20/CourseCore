---
id: "q-physics-b-1-p1b-m1-01-training-004"
courseId: "physics-b-1"
moduleId: "p1b-m1"
itemId: "p1b-m1-01-training"
questionType: singleChoice
title: "第 4 题"
answer: "B"
tags: ["选择题"]
source: "力学练习一.pdf 第4题"
---

## Content

一质点沿 $x$ 轴运动，其加速度 $a$ 与位置坐标 $x$ 的关系为 $a = 2 + 6x^2$（SI）。如果质点在原点处的速度为零，则质点在 $x=2\text{m}$ 处的速度大小 $v$ 约为（    ）

## Options

- $40\text{m/s}$
- $5\text{m/s}$
- $20\text{m/s}$
- $10\text{m/s}$

## Solution

本题属于质点运动学第二类问题，加速度是位置 $x$ 的函数。利用链式法则：

$$a = \frac{dv}{dt} = \frac{dv}{dx}\frac{dx}{dt} = v\frac{dv}{dx}$$

分离变量得 $v\,dv = a\,dx = (2+6x^2)\,dx$。

代入初始条件 $x=0$ 时 $v=0$，$x=2$ 时速度为 $v$，两边积分：

$$\int_0^v v\,dv = \int_0^2 (2+6x^2)\,dx$$

$$\frac{1}{2}v^2 = \left[2x+2x^3\right]_0^2 = 4+16 = 20$$

$$v = \sqrt{40} \approx 6.32\text{m/s}$$

最接近 $5\text{m/s}$，故选 **B**。
