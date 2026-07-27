---
id: "q-physics-b-1-p1b-m1-03-training-008"
courseId: "physics-b-1"
moduleId: "p1b-m1"
itemId: "p1b-m1-03-training"
questionType: calculation
title: "第 8 题"
answer: "$v(t)=v_0 e^{-\frac{K}{m}t}$，$x_{max}=\frac{mv_0}{K}$"
tags: ["计算题"]
source: "力学练习三.pdf 第8题"
---

## Content

质量为 $m$ 的子弹以速度 $v_0$ 水平射入沙土中，设子弹所受阻力与速度反向，大小与速度成正比，比例系数为 $K$，忽略子弹的重力。求：

（1）子弹射入沙土后，速度随时间变化的函数式；

（2）子弹进入沙土的最大深度。

## Solution

本题属于质点动力学中的变力问题。阻力 $f=-Kv$ 随速度变化，加速度不是常数，不能直接使用匀变速直线运动公式，需回归牛顿第二定律的微分形式。

### 第（1）问：求 $v(t)$

由牛顿第二定律：

$$-Kv = m\frac{dv}{dt}$$

分离变量：

$$\frac{dv}{v} = -\frac{K}{m}dt$$

代入初始条件 $t=0$ 时 $v=v_0$，两边积分：

$$\int_{v_0}^{v}\frac{1}{v}dv = \int_0^t -\frac{K}{m}dt$$

$$\ln\frac{v}{v_0} = -\frac{K}{m}t$$

$$v(t) = v_0 e^{-\frac{K}{m}t}$$

### 第（2）问：求最大深度 $x_{max}$

利用链式法则 $a = \frac{dv}{dt} = v\frac{dv}{dx}$，代入牛顿第二定律：

$$-Kv = mv\frac{dv}{dx}$$

因 $v \neq 0$，两边消去 $v$：

$$-Kdx = mdv$$

代入 $x=0$ 时 $v=v_0$，$x=x_{max}$ 时 $v=0$，积分：

$$\int_0^{x_{max}} -Kdx = \int_{v_0}^{0} mdv$$

$$-Kx_{max} = -mv_0$$

$$x_{max} = \frac{mv_0}{K}$$
