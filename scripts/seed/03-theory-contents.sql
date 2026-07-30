BEGIN;
INSERT INTO public.theory_contents (item_id, course_id, module_id, content, examples) VALUES ('p1b-m1-01', 'physics-b-1', 'p1b-m1', '### 位置矢量（位矢）$\\vec{r}$

从坐标原点指向质点所在位置的有向线段。

$$ \\vec{r}(t) = x(t)\\vec{i} + y(t)\\vec{j} + z(t)\\vec{k} $$

其大小（到原点的距离）为 $r = |\\vec{r}| = \\sqrt{x^2 + y^2 + z^2}$。

### 位移（Displacement）$\\Delta \\vec{r}$

质点在一段时间内位置的改变量，是**矢量**。

$$ \\Delta \\vec{r} = \\vec{r}(t + \\Delta t) - \\vec{r}(t) = \\Delta x \\vec{i} + \\Delta y \\vec{j} + \\Delta z \\vec{k} $$

⚠️ **核心易错**：位移的大小 $|\\Delta \\vec{r}|$ **不等于** 路程 $\\Delta s$。位移是直线距离（起→终），路程是轨迹长度。只有当质点作**单向直线运动**时，两者才相等。

### 速度（Velocity）$\\vec{v}$

描述质点运动快慢和方向的物理量。

- **平均速度**：$\\bar{\\vec{v}} = \\frac{\\Delta \\vec{r}}{\\Delta t}$，方向与位移方向相同。
- **瞬时速度**：$\\vec{v} = \\lim_{\\Delta t \\to 0} \\frac{\\Delta \\vec{r}}{\\Delta t} = \\frac{d\\vec{r}}{dt}$。这是**位置矢量对时间的一阶导数**。
- **速率（Speed）$v$**：速度的大小，$v = |\\vec{v}| = \\sqrt{v_x^2 + v_y^2 + v_z^2}$。注意，平均速率 = $\\frac{\\text{路程}}{\\text{时间}}$，不等于平均速度的大小。

### 加速度（Acceleration）$\\vec{a}$

描述速度变化快慢的物理量。

- **平均加速度**：$\\bar{\\vec{a}} = \\frac{\\Delta \\vec{v}}{\\Delta t}$。
- **瞬时加速度**：$\\vec{a} = \\lim_{\\Delta t \\to 0} \\frac{\\Delta \\vec{v}}{\\Delta t} = \\frac{d\\vec{v}}{dt} = \\frac{d^2\\vec{r}}{dt^2}$。这是**位置矢量对时间的二阶导数**。

### 深度辨析与拓展

**$\\frac{dr}{dt}$ 与 $\\left|\\frac{d\\vec{r}}{dt}\\right|$ 的区别**：

- $\\frac{dr}{dt}$ 是**径向速率**，表示位矢长度随时间的变化率。例如，若物体沿径向向外匀速运动，$\\frac{dr}{dt} = v$，但速度的方向不变。
- $\\left|\\frac{d\\vec{r}}{dt}\\right| = v$ 是**速度的大小（全速率）**。在圆周运动中，$\\frac{dr}{dt} = 0$（位矢长度不变），但 $v \\neq 0$（速度方向在变）。

### 两类基本问题（长理必考）

1. **微分问题**：已知 $\\vec{r}(t)$，求 $\\vec{v}(t)$ 和 $\\vec{a}(t)$。——直接求导。
2. **积分问题**：已知 $\\vec{a}(t)$ 和初始条件（$t=0$ 时的 $\\vec{r}_0, \\vec{v}_0$），求 $\\vec{v}(t)$ 和 $\\vec{r}(t)$。——通过不定积分或定积分：

   $$ \\vec{v}(t) = \\vec{v}_0 + \\int_0^t \\vec{a}(t'') dt'', \\quad \\vec{r}(t) = \\vec{r}_0 + \\int_0^t \\vec{v}(t'') dt'' $$

### 一维运动特殊技巧

当加速度是位置 $x$ 的函数时，利用 $a = \\frac{dv}{dt} = \\frac{dv}{dx} \\frac{dx}{dt} = v \\frac{dv}{dx}$，可将方程化为 $v dv = a(x) dx$，然后积分。这是在变力做功问题中应用动能定理的数学基础。', '["q-physics-b-1-p1b-m1-01-training-002","q-physics-b-1-p1b-m1-01-training-004"]'::jsonb) ON CONFLICT (item_id) DO UPDATE SET course_id = EXCLUDED.course_id, module_id = EXCLUDED.module_id, content = EXCLUDED.content, examples = EXCLUDED.examples;
INSERT INTO public.theory_contents (item_id, course_id, module_id, content, examples) VALUES ('p1b-m1-02', 'physics-b-1', 'p1b-m1', '### 自然坐标系中的加速度

在轨迹上某点取**切向单位矢量 $\\vec{e}_t$**（指向运动方向）和**法向单位矢量 $\\vec{e}_n$**（指向曲率中心）。加速度被分解为两个相互垂直的分量：

- **切向加速度 $a_t$**：

  $$ a_t = \\frac{dv}{dt} $$

  它只改变速度的**大小**。$a_t > 0$ 表示加速运动，$a_t < 0$ 表示减速运动。

- **法向加速度（向心加速度）$a_n$**：

  $$ a_n = \\frac{v^2}{\\rho} $$

  它只改变速度的**方向**。$\\rho$ 为该点轨迹的曲率半径，方向始终指向曲线的凹侧（曲率中心）。

- **总加速度**：

  $$ \\vec{a} = a_t \\vec{e}_t + a_n \\vec{e}_n, \\quad a = \\sqrt{a_t^2 + a_n^2} $$

### 物理图像与拓展

**圆周运动**：当轨迹是圆时，$\\rho = R$（半径）。引入**角量**描述：

- 角位置 $\\theta(t)$，角速度 $\\omega = \\frac{d\\theta}{dt}$，角加速度 $\\alpha = \\frac{d\\omega}{dt} = \\frac{d^2\\theta}{dt^2}$。
- **线量与角量的关系（核心纽带）**：

  $$ s = R\\theta \\quad (\\text{弧长}), \\quad v = R\\omega, \\quad a_t = R\\alpha, \\quad a_n = R\\omega^2 $$

- **匀角加速圆周运动公式**（类比匀变速直线运动）：

  $$ \\omega = \\omega_0 + \\alpha t, \\quad \\theta = \\omega_0 t + \\frac{1}{2}\\alpha t^2, \\quad \\omega^2 - \\omega_0^2 = 2\\alpha\\theta $$

**为什么匀速圆周运动仍有加速度？** 因为 $a_t = 0$（速度大小不变），但 $a_n = v^2/R \\neq 0$（速度方向不断改变）。这个加速度指向圆心，称为向心加速度。

### 相对运动

研究在不同参考系中观察到的同一物体的运动之间的关系。设**绝对参考系**（地面）为 $S$，**相对参考系**（运动的物体，如船、风）为 $S''$。

**伽利略速度变换（Galilean Transformation）**：

$$ \\vec{v}_{对地} = \\vec{v}_{对牵连} + \\vec{v}_{牵连对地} $$

简写为：$\\vec{v}_{绝} = \\vec{v}_{相} + \\vec{v}_{牵}$。', '["q-physics-b-1-p1b-m1-02-training-002","q-physics-b-1-p1b-m1-02-training-004"]'::jsonb) ON CONFLICT (item_id) DO UPDATE SET course_id = EXCLUDED.course_id, module_id = EXCLUDED.module_id, content = EXCLUDED.content, examples = EXCLUDED.examples;
INSERT INTO public.theory_contents (item_id, course_id, module_id, content, examples) VALUES ('p1b-m1-03', 'physics-b-1', 'p1b-m1', '### 牛顿第一定律（惯性定律）

任何物体都保持静止或匀速直线运动状态，直到外力迫使它改变这种状态为止。**定义了惯性参考系**，揭示了力是改变运动状态的原因（不是维持运动的原因）。

### 牛顿第二定律（核心定律）

物体受到外力作用时，所获得的加速度的大小与合外力的大小成正比，与物体质量成反比，加速度方向与合外力方向相同。

$$ \\vec{F} = m\\vec{a} $$

### 微分形式（长理重点/难点）

当质量不变时，更本质的写法是：

$$ \\vec{F} = \\frac{d\\vec{p}}{dt} = \\frac{d(m\\vec{v})}{dt} $$

在变力问题中，常写为分量形式：

$$ F_x = m\\frac{dv_x}{dt} = m\\frac{d^2x}{dt^2}, \\qquad F_y = m\\frac{dv_y}{dt} = m\\frac{d^2y}{dt^2} $$

**注意**：

1. 这是**瞬时关系**——力一旦消失，加速度立刻消失。
2. 是**矢量关系**——$\\vec{F}$ 和 $\\vec{a}$ 始终同向，但 $\\vec{F}$ 和 $\\vec{v}$ 不一定同向（如抛体运动）。
3. 只适用于**宏观、低速（$v \\ll c$）**的质点。

### 牛顿第三定律（作用力与反作用力）

两个物体之间的作用力和反作用力，总是大小相等、方向相反，作用在同一条直线上，且分别作用在两个不同的物体上。

### 深度辨析与拓展

**常见的力**：

1. **重力**：$\\vec{G} = m\\vec{g}$（方向竖直向下）。
2. **弹力**：当物体发生弹性形变时产生。**胡克定律**：$\\vec{F} = -k\\vec{x}$（$k$ 为劲度系数，$x$ 为形变量）。
3. **摩擦力**：
   - **静摩擦力**：大小在 $0 \\sim f_{\\max} = \\mu_s N$ 之间，方向与相对运动趋势方向相反。**静摩擦力随外力变化而变化**。
   - **滑动摩擦力**：$f_k = \\mu_k N$，方向与相对运动方向相反。$\\mu_s > \\mu_k$。

**隔离法与整体法**：

- **隔离法**：对系统中的每个物体分别受力分析，列方程。优点：内力清晰。缺点：方程多。
- **整体法**：把多个物体视为一个系统，只分析系统外力，不分析内力。优点：简化计算。使用前提：系统内各物体加速度相同。

### 非惯性系与惯性力

- **惯性系**：牛顿定律成立的参考系。相对于地面静止或匀速直线运动的参考系可近似视为惯性系。
- **非惯性系**：相对于惯性系作加速运动的参考系。在非惯性系中，牛顿定律不成立。
- **惯性力（Fictitious Force）**：为了使牛顿定律在非惯性系中形式上成立而引入的假想力。

  $$ \\vec{F}_{惯} = -m\\vec{a}_{0} $$

  其中 $\\vec{a}_0$ 是非惯性系相对于惯性系的加速度。**注意**：惯性力没有施力物体，不是真实的力。

**物理图像与拓展**：

- **电梯问题**：电梯加速上升（向上加速度 $a$），以电梯为参考系，人受到重力 $mg$ 向下，惯性力 $ma$ 向下，地面对人的支持力 $N$ 向上，三力平衡：$N = m(g + a)$，所以人对地板压力变大（超重）。电梯加速下降则失重。
- **离心力**：在旋转的参考系中，物体受到沿半径向外的惯性力（离心力），方向与向心加速度方向相反。这就是“转弯时被甩出去的感觉”的真正来源——不是真实力，而是惯性效应。', '["q-physics-b-1-p1b-m1-03-training-001","q-physics-b-1-p1b-m1-03-training-002","q-physics-b-1-p1b-m1-03-training-008"]'::jsonb) ON CONFLICT (item_id) DO UPDATE SET course_id = EXCLUDED.course_id, module_id = EXCLUDED.module_id, content = EXCLUDED.content, examples = EXCLUDED.examples;
INSERT INTO public.theory_contents (item_id, course_id, module_id, content, examples) VALUES ('p1b-m1-04', 'physics-b-1', 'p1b-m1', '**核心任务**：研究力在时间上的累积效应。

### 冲量（Impulse）$\\vec{I}$

力对时间的积分，表示力在时间上的累积效应。

$$ \\vec{I} = \\int_{t_1}^{t_2} \\vec{F}(t) dt $$

### 动量（Momentum）$\\vec{p}$

质量与速度的乘积。

$$ \\vec{p} = m\\vec{v} $$

### 质点的动量定理

合外力的冲量等于质点动量的增量。

$$ \\int_{t_1}^{t_2} \\vec{F}_{合} dt = \\vec{p}_2 - \\vec{p}_1 = m\\vec{v}_2 - m\\vec{v}_1 $$

**适用条件**：宏观、低速，任何过程（包括碰撞、爆炸）都成立。

### 质点系的动量守恒定律

当系统所受合外力为零时，系统的总动量保持不变。

$$ \\vec{F}_{外} = 0 \\Rightarrow \\sum_i \\vec{p}_i = \\text{恒矢量} $$

**分方向守恒**：若合外力在某一方向（如 $x$ 方向）的分量为零，则该方向的总动量分量守恒。

### 深度辨析与拓展

**碰撞模型**：

- **完全弹性碰撞**：动能守恒 + 动量守恒。两球交换速度（等质量时）。
- **完全非弹性碰撞**：碰后粘在一起，动能损失最大，但动量守恒。
- **非完全弹性碰撞**：介于两者之间，有动能损失，但动量守恒。

**平均冲力**：在碰撞过程中，力往往很大且变化剧烈，此时用平均冲力 $\\bar{F} = \\frac{\\Delta p}{\\Delta t}$ 估算。

**火箭飞行原理**：火箭向后喷出高速气体（向后动量），火箭本身获得向前的动量。这是动量守恒在“变质量系统”中的典型应用。', '[]'::jsonb) ON CONFLICT (item_id) DO UPDATE SET course_id = EXCLUDED.course_id, module_id = EXCLUDED.module_id, content = EXCLUDED.content, examples = EXCLUDED.examples;
INSERT INTO public.theory_contents (item_id, course_id, module_id, content, examples) VALUES ('p1b-m1-05', 'physics-b-1', 'p1b-m1', '**核心任务**：研究力在空间上的累积效应。

### 功（Work）$W$

力对物体在空间上的累积效应。

- **恒力做功**：$W = \\vec{F} \\cdot \\Delta \\vec{r} = F \\Delta r \\cos\\theta$。
- **变力做功**：$W = \\int_{\\vec{r}_1}^{\\vec{r}_2} \\vec{F} \\cdot d\\vec{r}$（线积分）。

### 功率（Power）$P$

单位时间内做的功。

- 平均功率：$\\bar{P} = \\frac{W}{\\Delta t}$。
- 瞬时功率：$P = \\lim_{\\Delta t \\to 0} \\frac{W}{\\Delta t} = \\frac{dW}{dt} = \\vec{F} \\cdot \\vec{v}$。

### 动能（Kinetic Energy）$E_k$

物体由于运动而具有的能量。

$$ E_k = \\frac{1}{2}mv^2 $$

### 质点的动能定理

合外力做的功等于质点动能的变化。

$$ W_{合} = \\Delta E_k = \\frac{1}{2}mv_2^2 - \\frac{1}{2}mv_1^2 $$

### 深度辨析与拓展

**功的计算要点**：功是标量，有正负。$0 \\le \\theta < 90^\\circ$ 时做正功（动力），$\\theta = 90^\\circ$ 时不做功（如向心力），$90^\\circ < \\theta \\le 180^\\circ$ 时做负功（阻力）。

**解题逻辑**：动能定理是**连接力与位移的桥梁**。凡是题目涉及“力、位移、速度”，且不涉及时间，首选动能定理。它在处理变力做功时尤其方便，因为你不需要知道力的具体形式，只需知道合外力做的总功。', '[]'::jsonb) ON CONFLICT (item_id) DO UPDATE SET course_id = EXCLUDED.course_id, module_id = EXCLUDED.module_id, content = EXCLUDED.content, examples = EXCLUDED.examples;
INSERT INTO public.theory_contents (item_id, course_id, module_id, content, examples) VALUES ('p1b-m1-06', 'physics-b-1', 'p1b-m1', '### 力矩（Torque）$\\vec{M}$

力对某一点（或轴）的转动效果。

$$ \\vec{M} = \\vec{r} \\times \\vec{F} $$

大小：$M = rF \\sin\\theta$（$\\theta$ 为 $\\vec{r}$ 与 $\\vec{F}$ 的夹角），方向由右手定则确定。

### 质点的角动量（Angular Momentum）$\\vec{L}$

质点对某一点（或轴）的转动量。

$$ \\vec{L} = \\vec{r} \\times \\vec{p} = \\vec{r} \\times m\\vec{v} $$

大小：$L = rmv \\sin\\theta$。对于圆周运动，$\\vec{r} \\perp \\vec{v}$，所以 $L = mvr$。

### 角动量定理

合外力矩等于角动量的变化率。

$$ \\vec{M}_{合} = \\frac{d\\vec{L}}{dt} $$

### 角动量守恒定律

当合外力矩为零时，系统的角动量保持不变。

$$ \\vec{M}_{合} = 0 \\Rightarrow \\vec{L} = \\text{恒矢量} $$

### 物理图像与拓展

**开普勒第二定律（面积定律）**：行星绕太阳运动，万有引力指向太阳，对太阳的力矩为0，所以行星的角动量守恒。$L = mvr =$ 常数，即 $r v_\\perp =$ 常数。这意味着行星在近日点速度大，远日点速度小。

**花滑运动员旋转**：运动员收臂时，$r$ 减小，为了保持角动量守恒（$J\\omega =$ 常数），转动惯量 $J$ 减小，角速度 $\\omega$ 增大，旋转加快。这是角动量守恒最直观的体现。

**陀螺仪**：高速旋转的陀螺，其角动量指向旋转轴，外力矩难以改变其方向，从而保持稳定性，是导航系统的核心部件。', '[]'::jsonb) ON CONFLICT (item_id) DO UPDATE SET course_id = EXCLUDED.course_id, module_id = EXCLUDED.module_id, content = EXCLUDED.content, examples = EXCLUDED.examples;
INSERT INTO public.theory_contents (item_id, course_id, module_id, content, examples) VALUES ('p1b-m1-07', 'physics-b-1', 'p1b-m1', '**核心任务**：将质点力学的规律推广到有形状、有大小的刚体。

### 刚体运动学与转动惯量

**刚体（Rigid Body）**：受力后形状和大小保持不变的理想模型（内部任意两点的距离不变）。

**定轴转动**：刚体上所有点都绕同一固定轴（转轴）做圆周运动。

**转动惯量（Moment of Inertia）$J$**：描述刚体转动惯性大小的物理量。对于离散质点系：$J = \\sum_i m_i r_i^2$；对于连续质量分布：$J = \\int r^2 dm$。

- $r_i$ 是第 $i$ 个质点到转轴的**垂直距离**（不是到原点的距离）。

**平行轴定理（Parallel Axis Theorem）**：刚体对任意轴的转动惯量，等于它对通过质心且平行于该轴的轴的转动惯量 $J_C$，加上刚体质量 $M$ 与两轴间距离 $d$ 的平方的乘积：

$$ J = J_C + Md^2 $$

**垂直轴定理（Perpendicular Axis Theorem）**（适用于薄板）：$J_z = J_x + J_y$。

### 常见刚体的转动惯量（务必记住）

- 细圆环（对中心轴）：$J = mR^2$。
- 圆盘/圆柱（对中心轴）：$J = \\frac{1}{2}mR^2$。
- 细杆（对质心，垂直杆）：$J = \\frac{1}{12}mL^2$。
- 细杆（对端点，垂直杆）：$J = \\frac{1}{3}mL^2$（由平行轴定理得到）。
- 球壳（对直径）：$J = \\frac{2}{3}mR^2$。
- 球体（对直径）：$J = \\frac{2}{5}mR^2$。

### 转动定律、转动动能与角动量

**转动定律（Rotational Law）**：刚体所受的合外力矩等于转动惯量与角加速度的乘积。

$$ M_{合} = J\\alpha $$

这是质点牛顿第二定律 $F = ma$ 在转动中的直接类比（$F \\to M$, $m \\to J$, $a \\to \\alpha$）。

**转动动能（Rotational Kinetic Energy）**：刚体转动时各质点动能之和。

$$ E_k = \\frac{1}{2}J\\omega^2 $$

**刚体的角动量**：$L = J\\omega$。角动量定理：$M_{合} = \\frac{dL}{dt}$。角动量守恒：当 $M_{合} = 0$ 时，$L = J\\omega = $ 常数。

### 深度辨析与拓展

**纯滚动（无滑动滚动）**：是**平动 + 转动**的合成。

- 约束条件：$v_C = \\omega R$（质心速度等于角速度乘以半径）。
- 总动能：$E_k = \\frac{1}{2}Mv_C^2 + \\frac{1}{2}J_C\\omega^2$。
- 经典考题：一均匀圆盘从斜面滚下，求质心加速度。解法：分别列平动方程（$Mg\\sin\\theta - f = Ma$）和转动方程（$fR = J\\alpha$），再结合 $a = \\alpha R$，联立求解。

**刚体问题综合题（长理压轴题）**：通常模式为“子弹打击悬挂的细杆或圆盘”。

- **阶段一**：子弹射入瞬间。**角动量守恒**（碰撞瞬间，重力矩和轴承力矩可忽略）。
- **阶段二**：子弹与刚体一起上摆。**机械能守恒**（上摆过程中只有重力做功）。', '[]'::jsonb) ON CONFLICT (item_id) DO UPDATE SET course_id = EXCLUDED.course_id, module_id = EXCLUDED.module_id, content = EXCLUDED.content, examples = EXCLUDED.examples;
INSERT INTO public.theory_contents (item_id, course_id, module_id, content, examples) VALUES ('p1b-m2-01', 'physics-b-1', 'p1b-m2', '**核心逻辑**：两束（或多束）相干光叠加，在空间形成明暗相间的稳定分布。

### 干涉基础与光程

**相干条件**：频率相同、振动方向相同、相位差恒定。

**光程（Optical Path）$\\delta$**：光在介质中走过的几何路程 $r$ 折算成真空中的路程。引入光程的目的是统一计算相位差，因为光在不同介质中波长不同。

$$ \\delta = n \\cdot r $$

**相位差与光程差的关系**：

$$ \\Delta \\varphi = \\frac{2\\pi}{\\lambda_0} \\Delta \\delta $$

其中 $\\lambda_0$ 是真空中的波长。

**干涉判据（核心公式）**：

- **明纹（加强）**：$\\Delta \\delta = k\\lambda_0$（$k = 0, \\pm1, \\pm2, \\dots$）$\\Rightarrow \\Delta \\varphi = 2k\\pi$。
- **暗纹（减弱）**：$\\Delta \\delta = (2k+1)\\frac{\\lambda_0}{2}$（$k = 0, \\pm1, \\pm2, \\dots$）$\\Rightarrow \\Delta \\varphi = (2k+1)\\pi$。

### 杨氏双缝干涉

装置：两个相距 $d$ 的狭缝 $S_1$ 和 $S_2$，屏距双缝为 $D$（通常 $D \\gg d$）。

**光程差**：屏上 $P$ 点（距中心 $x$）到两缝的光程差近似为

$$ \\Delta \\delta = r_2 - r_1 \\approx \\frac{d}{D}x = d\\sin\\theta $$

**条纹位置**：

- 明纹中心：$x_k = k\\frac{D}{d}\\lambda$（$k = 0, \\pm1, \\pm2, \\dots$）。
- 暗纹中心：$x_k = (2k+1)\\frac{D}{d}\\frac{\\lambda}{2}$（$k = 0, \\pm1, \\pm2, \\dots$）。

**条纹间距**：$\\Delta x = x_{k+1} - x_k = \\frac{D}{d}\\lambda$（等间距，与级次无关）。

### 深度辨析与拓展

**中央明纹**：$k = 0$，$x = 0$，光程差为0，总是明纹（除非有半波损失）。

**白光干涉**：白光入射时，不同波长的光条纹间距不同，形成彩色条纹。中央明纹为白色，两侧对称分布彩色条纹（紫在内，红在外）。', '[]'::jsonb) ON CONFLICT (item_id) DO UPDATE SET course_id = EXCLUDED.course_id, module_id = EXCLUDED.module_id, content = EXCLUDED.content, examples = EXCLUDED.examples;
INSERT INTO public.theory_contents (item_id, course_id, module_id, content, examples) VALUES ('p1b-m2-02', 'physics-b-1', 'p1b-m2', '### 薄膜干涉

光照射在透明薄膜（厚度 $e$，折射率 $n$）上，薄膜上、下表面反射的两束光发生干涉。

**光程差公式**（以反射光为例，垂直入射近似）：

$$ \\Delta = 2ne + \\frac{\\lambda}{2} \\quad (\\text{若上表面存在半波损失}) $$

**半波损失（Half-wave Loss）**：光从光疏介质（折射率小）射向光密介质（折射率大）的反射过程中，反射光相位突变 $\\pi$，相当于光程增加（或减少）了 $\\lambda/2$。**从光密到光疏反射，无半波损失**。

### 劈尖干涉（等厚干涉）

两玻璃板间夹一楔形空气层（折射率 $n \\approx 1$）。

- 空气层厚度 $e(x) = x\\tan\\theta \\approx x\\theta$。
- 明暗纹条件：$\\Delta = 2e + \\frac{\\lambda}{2}$（下表面反射有半波损失）。
- 条纹间距：$l = \\frac{\\lambda}{2n\\theta}$（$\\theta$ 为楔角）。楔角越小，条纹越稀疏。

**应用**：测量微小长度、检测工件表面平整度（条纹弯曲方向指示凹凸）。

### 牛顿环（等厚干涉）

平凸透镜与平板玻璃之间形成空气薄膜（厚度 $e$）。

- 反射光干涉，中心处 $e = 0$，光程差为 $\\lambda/2$，所以中心是**暗斑**（半波损失的标志）。
- 第 $k$ 级暗环半径：$r_k = \\sqrt{kR\\lambda}$（$R$ 为透镜曲率半径）。

### 增透膜与增反膜

- **增透膜**：在透镜表面镀一层折射率介于空气和玻璃之间的薄膜（如 $MgF_2$），使反射光干涉相消，透射光增强。膜厚满足 $ne = \\lambda/4$（使两反射光光程差为 $\\lambda/2$）。
- **增反膜**：使反射光干涉加强（如激光谐振腔镜片），膜厚满足 $ne = \\lambda/2$。', '[]'::jsonb) ON CONFLICT (item_id) DO UPDATE SET course_id = EXCLUDED.course_id, module_id = EXCLUDED.module_id, content = EXCLUDED.content, examples = EXCLUDED.examples;
INSERT INTO public.theory_contents (item_id, course_id, module_id, content, examples) VALUES ('p1b-m2-03', 'physics-b-1', 'p1b-m2', '### 迈克耳逊干涉仪

利用**分振幅法**产生双光束干涉。光经过半透半反镜 $G_1$ 分成两束，分别经固定反射镜 $M_1$ 和可移动反射镜 $M_2$ 反射后再次汇合产生干涉。

**核心关系**：当可移动反射镜 $M_1$ 移动距离 $\\Delta d$ 时，两束光的光程差改变 $2\\Delta d$。对应的干涉条纹吞吐（或移动）数 $N$ 满足：

$$ \\Delta d = N \\cdot \\frac{\\lambda}{2} $$

**应用**：精密测量长度、测气体折射率、历史上否定“以太”的迈克尔逊-莫雷实验。

### 拓展——长理课程思政

**引力波探测**：LIGO（激光干涉引力波天文台）本质上就是一个巨型迈克尔逊干涉仪，通过测量臂长的微小变化（相对变化 $10^{-21}$）来探测引力波。这是光学干涉在21世纪最伟大的应用之一。', '[]'::jsonb) ON CONFLICT (item_id) DO UPDATE SET course_id = EXCLUDED.course_id, module_id = EXCLUDED.module_id, content = EXCLUDED.content, examples = EXCLUDED.examples;
INSERT INTO public.theory_contents (item_id, course_id, module_id, content, examples) VALUES ('p1b-m2-04', 'physics-b-1', 'p1b-m2', '**核心逻辑**：光绕过障碍物（或通过小孔）偏离直线传播的现象，本质是无限多个子波的干涉。

### 惠更斯-菲涅耳原理

**惠更斯原理**：波前上每一点都可以看作是新的子波源，向各个方向发出子波。这些子波的包络面就是新的波前。

**菲涅耳补充**：空间某点的光振动，是波前上所有子波源发出的子波在该点**相干叠加**的结果。

**衍射的本质**：衍射就是子波的干涉。

### 夫琅禾费单缝衍射

**装置**：平行光垂直照射单缝（缝宽 $a$），在透镜焦平面上观察。

**半波带法**（分析条纹分布的直观工具）：

- 将缝宽 $a$ 分成若干等宽的窄带，相邻窄带对应点发出的光在屏上某点的光程差为 $\\lambda/2$。
- 若缝被分成**偶数个**半波带，则成对抵消，该点为**暗纹**。
- 若缝被分成**奇数个**半波带，则剩一个半波带未被抵消，该点为**明纹**。

**暗纹条件**（⚠️ 非常容易记反，务必注意）：

$$ a \\sin\\theta = k\\lambda \\quad (k = \\pm1, \\pm2, \\pm3, \\dots) $$

**注意**：$k = 0$ 对应的是中央明纹，不是暗纹！

**明纹条件（近似）**：

$$ a \\sin\\theta = (2k+1)\\frac{\\lambda}{2} \\quad (k = \\pm1, \\pm2, \\dots) $$

**条纹特点**：

- 中央明纹最亮、最宽，宽度是其他级次明纹的2倍。
- 中央明纹宽度：$\\Delta x_0 = 2f\\frac{\\lambda}{a}$（$f$ 为透镜焦距）。
- 其他明纹宽度：$\\Delta x = f\\frac{\\lambda}{a}$。

**讨论**：

- 缝宽 $a$ 越小，衍射越明显，中央明纹越宽。
- 波长 $\\lambda$ 越大，衍射越明显。

### 深度辨析

**单缝衍射暗纹公式 vs 双缝干涉明纹公式**。前者是 $a\\sin\\theta = k\\lambda$，后者是 $d\\sin\\theta = k\\lambda$。形似而神异，务必根据题目中的“单缝”还是“双缝”来套用。', '[]'::jsonb) ON CONFLICT (item_id) DO UPDATE SET course_id = EXCLUDED.course_id, module_id = EXCLUDED.module_id, content = EXCLUDED.content, examples = EXCLUDED.examples;
INSERT INTO public.theory_contents (item_id, course_id, module_id, content, examples) VALUES ('p1b-m2-05', 'physics-b-1', 'p1b-m2', '### 光栅

大量等宽、等间距的平行狭缝（透射光栅）或刻痕（反射光栅）组成。相邻缝间距 $d = a + b$（$a$ 为缝宽，$b$ 为不透光部分宽度）。

**光栅方程（主极大/明纹位置）**：

$$ d\\sin\\theta = k\\lambda \\quad (k = 0, \\pm1, \\pm2, \\dots) $$

$k$ 为级次，$k = 0$ 是中央明纹。

### 缺级现象（⚠️ 常见陷阱）

光栅衍射的强度分布受单缝衍射调制。当某级主极大的位置恰好落在单缝衍射的暗纹位置时，该级主极大消失，称为缺级。

**缺级条件**：

$$ \\frac{d}{a} = \\frac{k}{k''} \\quad (k'' = \\pm1, \\pm2, \\dots) $$

其中 $k$ 为光栅衍射的级次（缺的级），$k''$ 为单缝衍射的暗纹级次。

例如，若 $d/a = 3$，则 $k = 3, 6, 9, \\dots$ 级主极大消失。

### 光栅光谱

不同波长的光在光栅后有不同偏折角（波长越大，$\\theta$ 越大，红光在外，紫光在内），形成光谱。

**色散率**：$\\frac{d\\theta}{d\\lambda} = \\frac{k}{d\\cos\\theta}$，级次越高，色散越强。

**应用**：光谱仪的核心元件，用于分析物质成分（如太阳光谱中的夫琅禾费吸收线）。', '[]'::jsonb) ON CONFLICT (item_id) DO UPDATE SET course_id = EXCLUDED.course_id, module_id = EXCLUDED.module_id, content = EXCLUDED.content, examples = EXCLUDED.examples;
INSERT INTO public.theory_contents (item_id, course_id, module_id, content, examples) VALUES ('p1b-m2-06', 'physics-b-1', 'p1b-m2', '本节为 **光学仪器分辨率与X射线衍射** 的理论内容占位小节。

> 正式讲义内容待后续补充，当前仅用于展示课程章节结构。', '[]'::jsonb) ON CONFLICT (item_id) DO UPDATE SET course_id = EXCLUDED.course_id, module_id = EXCLUDED.module_id, content = EXCLUDED.content, examples = EXCLUDED.examples;
INSERT INTO public.theory_contents (item_id, course_id, module_id, content, examples) VALUES ('p1b-m2-07', 'physics-b-1', 'p1b-m2', '**核心逻辑**：证明光是横波（振动方向与传播方向垂直）。

### 偏振态与马吕斯定律

**自然光（非偏振光）**：光矢量在垂直于传播方向的平面内各方向振动概率相等，振幅相等。

**线偏振光**：光矢量只沿一个固定方向振动。

**起偏器**：把自然光变为线偏振光的元件。**检偏器**：检验光的偏振态的元件。

**马吕斯定律（Malus''s Law）**：线偏振光通过偏振片后，透射光强 $I$ 与入射光强 $I_0$ 和偏振片透光轴与光振动方向夹角 $\\alpha$ 的关系：

$$ I = I_0 \\cos^2\\alpha $$

- 当 $\\alpha = 0$（平行），$I = I_0$（全部通过）。
- 当 $\\alpha = 90^\\circ$（垂直），$I = 0$（完全消光）。

**自然光通过偏振片**：光强减半，$I = I_0/2$。', '[]'::jsonb) ON CONFLICT (item_id) DO UPDATE SET course_id = EXCLUDED.course_id, module_id = EXCLUDED.module_id, content = EXCLUDED.content, examples = EXCLUDED.examples;
INSERT INTO public.theory_contents (item_id, course_id, module_id, content, examples) VALUES ('p1b-m2-08', 'physics-b-1', 'p1b-m2', '### 布儒斯特定律

自然光在两种介质（折射率 $n_1$, $n_2$）的界面反射时，当入射角 $i_B$ 满足下式时，反射光为**完全偏振光**（光振动垂直于入射面）：

$$ \\tan i_B = \\frac{n_2}{n_1} $$

$i_B$ 称为**布儒斯特角（Brewster''s Angle）**或起偏角。

**重要推论**：当入射角为布儒斯特角时，反射光线与折射光线**相互垂直**（$i_B + \\gamma = 90^\\circ$）。

### 物理图像与拓展

为什么反射光能偏振？因为在特定的入射角下，反射光的电偶极子辐射在反射方向上没有分量，从而只保留了垂直于入射面的振动。

**应用**：

- **偏振相机/偏光眼镜**：利用偏振片消除玻璃、水面反射的偏振光，减弱反光干扰。
- **激光器中的布儒斯特窗**：使激光在腔镜反射时减少能量损失。
- **课程思政——长理特色**：**偏振相机的原理与应用**是长理《大学物理》课程思政的重要案例，用于遥感、地质勘探等领域。

### 双折射（* 了解内容）

光在各向异性晶体（如方解石、石英）中传播时，会分裂成两束光线：

- **o光（寻常光）**：遵守折射定律，在晶体内各方向传播速度相同。
- **e光（非常光）**：不遵守折射定律，速度与方向有关。

**晶片**：利用双折射产生相位差，可将线偏振光变为椭圆偏振光或圆偏振光（如 $\\lambda/4$ 波片）。', '[]'::jsonb) ON CONFLICT (item_id) DO UPDATE SET course_id = EXCLUDED.course_id, module_id = EXCLUDED.module_id, content = EXCLUDED.content, examples = EXCLUDED.examples;
COMMIT;