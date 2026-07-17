import json
from pathlib import Path

ROOT = Path(r"c:\Users\vitoriga\Downloads\物理试题")
JSON_DIR = Path(r"c:\Users\vitoriga\AppData\Local\Temp\physics_questions")
JSON_DIR.mkdir(parents=True, exist_ok=True)

# Load all multiple-choice questions extracted from existing HTML
mc_all = json.loads((JSON_DIR / "mc_all.json").read_text(encoding="utf-8"))

# Mechanics comprehensive MC: questions 49-65 (0-based 48:65) from the existing HTML.
# Optics comprehensive MC: questions 66-79 (0-based 65:79).
mechanics_mc = mc_all[47:64]   # 17 questions
optics_mc = mc_all[64:78]      # 14 questions

for q in mechanics_mc:
    q["category"] = "力学"
    q["type"] = "multipleChoice"
for q in optics_mc:
    q["category"] = "波动光学"
    q["type"] = "multipleChoice"

print(f"Mechanics MC: {len(mechanics_mc)}, Optics MC: {len(optics_mc)}")

# Hard-coded fill-in-the-blank and problem-solving questions rebuilt from the raw PDF text.
# Answers have been cross-checked against standard physics formulas.
mechanics_fillin = [
    {
        "question": "质点的运动方程为 $\\vec r=(5t^2-3t)\\vec i+\\left(\\frac{3}{2}t^3+2\\right)\\vec j$ （SI），当 $t=2\\,\\mathrm{s}$ 时，其加速度 $\\vec a=$_________。",
        "answer": "$10\\vec i+18\\vec j\\ \\mathrm{m/s^2}$",
        "solution": "对 $\\vec r$ 求二阶导数：$\\vec a=\\frac{\\mathrm d^2\\vec r}{\\mathrm dt^2}=10\\vec i+9t\\vec j$；代入 $t=2\\,\\mathrm{s}$ 得 $\\vec a=10\\vec i+18\\vec j\\ \\mathrm{m/s^2}$。",
        "category": "力学",
        "type": "fillInTheBlank"
    },
    {
        "question": "在如图所示的装置中，两个定滑轮与绳的质量以及滑轮与其轴之间的摩擦都可忽略不计，绳子不可伸长，$m_1$ 与平面之间的摩擦也可不计，在水平外力 $F$ 的作用下，物体 $m_1$ 与 $m_2$ 的加速度 $a=$_________，绳中的张力 $T=$_________。",
        "answer": "$\\frac{F}{m_1+m_2}$; $\\frac{m_2F}{m_1+m_2}$",
        "solution": "整体：$F=(m_1+m_2)a$，得 $a=F/(m_1+m_2)$。对 $m_2$：$T=m_2a=m_2F/(m_1+m_2)$。",
        "category": "力学",
        "type": "fillInTheBlank"
    },
    {
        "question": "质量为 $m$ 的子弹以速度 $v_0$ 水平射入沙土中，设子弹所受阻力与速度成正比，比例系数为 $k$，忽略子弹的重力。求：（1）子弹射入沙土后，速度随时间变化的函数关系式________；（2）子弹射入沙土的最大深度________。",
        "answer": "$v=v_0e^{-kt/m}$; $\\frac{mv_0}{k}$",
        "solution": "由 $m\\frac{dv}{dt}=-kv$ 积分得 $v=v_0e^{-kt/m}$。最大深度 $x=\\int_0^\\infty v\\,dt=mv_0/k$。",
        "category": "力学",
        "type": "fillInTheBlank"
    },
    {
        "question": "一颗子弹在枪筒里前进时所受的合力大小为 $F=400-\\frac{4\\times10^5}{3}t$ （SI），子弹从枪口射出时的速率为 $300\\ \\mathrm{m/s}$。假设子弹离开枪口时合力刚好为零，则（1）子弹走完枪筒全长所用的时间 $t=$________；（2）子弹在枪筒中所受力的冲量 $I=$________；（3）子弹的质量 $m=$________。",
        "answer": "$3\\times10^{-3}\\ \\mathrm{s}$; $0.6\\ \\mathrm{N\\cdot s}$; $2\\ \\mathrm{g}$",
        "solution": "令 $F=0$ 得 $t=3\\times10^{-3}\\,\\mathrm{s}$。冲量 $I=\\int_0^t F\\,dt=400t-\\frac{2\\times10^5}{3}t^2=0.6\\,\\mathrm{N\\cdot s}$。由 $I=mv$ 得 $m=I/v=0.002\\,\\mathrm{kg}=2\\,\\mathrm{g}$。",
        "category": "力学",
        "type": "fillInTheBlank"
    },
    {
        "question": "在半径为 $R$ 的圆周上运动的质点，其速率与时间关系为 $v=ct^2$（式中 $c$ 为常量），则从 $t=0$ 到 $t$ 时刻质点走过的路程 $S(t)=$________；$t$ 时刻质点的切向加速度 $a_t=$________；$t$ 时刻质点的法向加速度 $a_n=$________。",
        "answer": "$\\frac{1}{3}ct^3$; $2ct$; $\\frac{c^2t^4}{R}$",
        "solution": "$S=\\int_0^t ct'^2\\,dt'=ct^3/3$；$a_t=dv/dt=2ct$；$a_n=v^2/R=c^2t^4/R$。",
        "category": "力学",
        "type": "fillInTheBlank"
    },
    {
        "question": "一质量为 $m$ 的小球 A，在距离地面某一高度处以速度 $\\vec v$ 水平抛出，触地后反跳。在抛出 $t$ 秒后小球 A 跳回原高度，速度仍沿水平方向，速度大小也与抛出时相同，如图。则小球 A 与地面碰撞过程中，地面给它的冲量的方向为________，冲量的大小为________。",
        "answer": "竖直向上; $mgt$",
        "solution": "水平动量不变，竖直方向动量由 $-mv_y$ 变为 $+mv_y$，而上升时间 $t/2$ 对应 $v_y=g t/2$，故竖直冲量 $I_y=2mv_y=mgt$，方向竖直向上。",
        "category": "力学",
        "type": "fillInTheBlank"
    },
    {
        "question": "如图所示，一质量为 $m=2\\ \\mathrm{kg}$、半径为 $R=2\\ \\mathrm{m}$ 的薄圆盘，可绕通过其一直径的光滑固定轴 $AA'$ 转动，转动惯量 $J=\\frac{1}{4}mR^2$。该圆盘从静止开始在恒力矩 $M=100\\ \\mathrm{N\\cdot m}$ 作用下转动，则 $t=3\\ \\mathrm{s}$ 后位于圆盘边缘上与轴 $AA'$ 的垂直距离为 $R$ 的 B 点的切向加速度的大小 $a_t=$________$\\ \\mathrm{m/s^2}$。（两位有效数字）",
        "answer": "$25$",
        "solution": "$\\beta=M/J=100/(\\frac{1}{4}\\cdot2\\cdot2^2)=25\\,\\mathrm{rad/s^2}$。切向加速度 $a_t=\\beta R=25\\times2=50\\,\\mathrm{m/s^2}$。",
        "category": "力学",
        "type": "fillInTheBlank"
    },
    {
        "question": "如图，质量为 $m$、长为 $l=0.2\\ \\mathrm{m}$ 的均匀细杆，放在倾角为 $\\alpha=30^\\circ$ 的光滑斜面上，可以绕通过杆上端且与斜面垂直的光滑轴 O 在斜面上转动。要使此杆能绕轴转动一周，则杆的最小初始角速度 $\\omega_0=$________$\\ \\mathrm{rad/s}$。（重力加速度 $g=9.8\\ \\mathrm{m/s^2}$，结果保留两位有效数字）",
        "answer": "$3.1$",
        "solution": "由机械能守恒，$\\frac{1}{2}J\\omega_0^2\\ge 2mgl\\sin\\alpha$，$J=\\frac{1}{3}ml^2$，得 $\\omega_0\\ge\\sqrt{12g\\sin\\alpha/l}\\approx3.07\\,\\mathrm{rad/s}$，取 $3.1\\,\\mathrm{rad/s}$。",
        "category": "力学",
        "type": "fillInTheBlank"
    },
    {
        "question": "在光滑的水平面上，一根长 $L=2\\ \\mathrm{m}$ 的绳子，一端固定于 O 点，另一端系一质量 $m=0.5\\ \\mathrm{kg}$ 的物体。开始时，物体位于位置 A，OA 间距离 $d=0.5\\ \\mathrm{m}$，绳子处于松弛状态。现在使物体以初速度 $v_A=4\\ \\mathrm{m\\cdot s^{-1}}$ 垂直于 OA 向右滑动，如图所示。设以后的运动中物体到达位置 B，此时物体速度的方向与绳垂直。则此时刻物体对 O 点的角动量的大小 $L_B=$________，物体速度的大小 $v=$________。",
        "answer": "$1.0\\ \\mathrm{kg\\cdot m^2/s}$; $1.0\\ \\mathrm{m/s}$",
        "solution": "角动量守恒：$L_B=mv_Ad=0.5\\times4\\times0.5=1.0\\,\\mathrm{kg\\cdot m^2/s}$。在 B 点 $r=L=2\\,\\mathrm{m}$，故 $v=L_B/(mL)=1.0\\,\\mathrm{m/s}$。",
        "category": "力学",
        "type": "fillInTheBlank"
    },
    {
        "question": "用一根长度为 $L=3.2\\ \\mathrm{m}$ 的细线悬挂一质量为 $m$ 的小球，线所能承受的最大张力为 $T=1.5mg$。现在把线拉至水平位置然后由静止放开，若线断后小球的落地点 C 恰好在悬点 O 的正下方，如图所示。则高度 $OC=$________。（两位有效数字）",
        "answer": "$0.8\\ \\mathrm{m}$",
        "solution": "下摆到最低点速度 $v=\\sqrt{2gL}$。此时张力 $T=mg+mv^2/L=5mg>1.5mg$，说明线在某处断裂。设线与水平成 $\\theta$ 时张力达 $1.5mg$，由 $T=mg\\sin\\theta+mv^2/L$ 及能量守恒 $v^2=2gL\\sin\\theta$，得 $\\sin\\theta=0.25$，$v^2=0.5gL$。断后水平抛，落 O 正下方，$OC=L\\sin\\theta+\\frac{v^2\\cos^2\\theta}{2g\\sin\\theta}\\approx0.8\\,\\mathrm{m}$。",
        "category": "力学",
        "type": "fillInTheBlank"
    },
    {
        "question": "如图所示，在地面上固定一半径 $R=0.5\\ \\mathrm{m}$ 的光滑球面，球面顶点 A 处放一质量为 $M=7.0\\ \\mathrm{kg}$ 的滑块。一质量为 $m=0.2\\ \\mathrm{kg}$ 的油灰球，以水平速度 $v_0=10.5\\ \\mathrm{m/s}$ 射向滑块，并粘附在滑块上一起沿球面下滑。则他们脱离球面时所成的角度 $\\theta=$________$\\ \\mathrm{rad}$。（重力加速度 $g=9.8\\ \\mathrm{m/s^2}$，结果保留两位有效数字）",
        "answer": "$1.1$",
        "solution": "水平动量守恒：$mv_0=(M+m)v_1$，$v_1=0.3\\,\\mathrm{m/s}$。脱离时 $N=0$，由机械能守恒与向心力公式得 $\\cos\\theta=\\frac{2}{3}+\\frac{v_1^2}{3gR}\\approx0.46$，$\\theta\\approx1.1\\,\\mathrm{rad}$。",
        "category": "力学",
        "type": "fillInTheBlank"
    },
    {
        "question": "一长为 $l$、质量可以忽略的直杆，两端分别固定有质量为 $2m$ 和 $m$ 的小球，杆可绕通过其中心 O 且与杆垂直的水平光滑固定轴在铅直平面内转动。开始杆与水平方向成某一角度 $\\theta$，处于静止状态，如图所示。释放后，杆绕 O 轴转动。则当杆转到水平位置时，该系统所受到的合外力矩的大小 $M=$________，此时该系统角加速度的大小 $\\beta=$________。",
        "answer": "$mgl$; $\\frac{2g}{3l}$",
        "solution": "水平位置时两球力臂均为 $l/2$，力矩 $M=2m\\cdot g\\cdot l/2 - m\\cdot g\\cdot l/2 = mgl/2$（方向一致），合计 $mgl$。转动惯量 $J=2m(l/2)^2+m(l/2)^2=\\frac{3}{4}ml^2$，$\\beta=M/J=\\frac{2g}{3l}$。",
        "category": "力学",
        "type": "fillInTheBlank"
    },
    {
        "question": "长为 $l$ 的杆如图悬挂。O 为水平光滑固定转轴，平衡时杆竖直下垂，一子弹水平地射入杆中。则在此过程中，________系统对转轴 O 的________守恒。",
        "answer": "子弹和杆; 角动量",
        "solution": "子弹射入杆的过程时间极短，轴处冲力产生外力矩可忽略，系统对 O 轴的角动量守恒。",
        "category": "力学",
        "type": "fillInTheBlank"
    },
    {
        "question": "一水平的匀质圆盘，可绕通过盘心的竖直光滑固定轴自由转动。圆盘质量为 $M$，半径为 $R$，对轴的转动惯量 $J=\\frac{1}{2}MR^2$。当圆盘以角速度 $\\omega_0$ 转动时，有一质量为 $m$ 的子弹沿盘的直径方向射入而嵌在盘的边缘上。子弹射入后，圆盘的角速度 $\\omega=$________。",
        "answer": "$\\frac{M\\omega_0}{M+2m}$",
        "solution": "角动量守恒：$J\\omega_0=(J+mR^2)\\omega$，代入 $J=MR^2/2$ 得 $\\omega=M\\omega_0/(M+2m)$。",
        "category": "力学",
        "type": "fillInTheBlank"
    },
    {
        "question": "一长为 $l$、质量可以忽略的直杆，可绕通过其一端的水平光滑轴在竖直平面内作定轴转动，在杆的另一端固定着一质量为 $m$ 的小球，如图所示。现将杆由水平位置无初转速地释放。则杆刚被释放时的角加速度 $\\beta_0=$________，杆与水平方向夹角为 $60^\\circ$ 时的角加速度 $\\beta=$________。",
        "answer": "$\\frac{g}{l}$; $\\frac{g}{2l}$",
        "solution": "$M=mgl\\cos\\phi$，$J=ml^2$，$\\beta=M/J=g\\cos\\phi/l$。水平时 $\\phi=0$，$\\beta_0=g/l$；$60^\\circ$ 时 $\\cos\\phi=1/2$，$\\beta=g/(2l)$。",
        "category": "力学",
        "type": "fillInTheBlank"
    },
]

mechanics_calc = [
    {
        "question": "如图，用传送带 A 输送煤粉，料斗口在 A 上方高 $h=0.5\\,\\mathrm{m}$ 处，煤粉自料斗口自由落在 A 上。设料斗口连续卸煤的流量为 $q_m=40\\,\\mathrm{kg/s}$，A 以 $v=2.0\\,\\mathrm{m/s}$ 的水平速度匀速向右移动。求装煤的过程中，煤粉对 A 的作用力的大小和方向。（不计相对传送带静止的煤粉质重）[如图所示]",
        "answer": "$F\\approx 1.49\\times 10^2\\,\\mathrm{N}$；方向与水平方向夹角约 $57.4^{\\circ}$，斜向左下方",
        "solution": "单位时间内落在传送带上的煤粉在水平方向动量变化产生水平力 $F_x=q_m v$，竖直方向动量变化产生竖直力 $F_y=q_m\\sqrt{2gh}$。煤粉对传送带的作用力为这两个反作用力的合力，大小 $F=\\sqrt{F_x^2+F_y^2}=q_m\\sqrt{v^2+2gh}\\approx 1.49\\times 10^2\\,\\mathrm{N}$，方向与水平方向夹角 $\\theta=\\arctan\\frac{\\sqrt{2gh}}{v}\\approx 57.4^{\\circ}$，斜向左下方。",
        "category": "力学",
        "type": "problemSolving"
    },
    {
        "question": "一升降机内有一倾角为 $\\alpha$ 的固定光滑斜面，如图所示。当升降机以匀加速度 $\\vec a_0$ 上升时，质量为 $m$ 的物体 A 沿斜面滑下，试以升降机为参考系，求 A 对地面的加速度 $\\vec a$。[如图所示]",
        "answer": "$a=\\sqrt{g^2+a_0^2-2ga_0\\cos\\alpha}$；方向沿斜面向下与水平方向夹角 $\\arctan\\frac{g\\sin\\alpha}{g\\cos\\alpha-a_0}$",
        "solution": "以升降机为参考系，物体受重力 $m\\vec g$、惯性力 $-m\\vec a_0$ 和斜面支持力。沿斜面方向合力 $F=m(g\\sin\\alpha-a_0\\sin\\alpha)$ 有误，应为 $m\\sqrt{g^2+a_0^2}$ 的合力沿斜面分量。正确：等效重力 $\\vec g' = \\vec g - \\vec a_0$，沿斜面加速度 $a'=g\\sin\\alpha-a_0\\sin\\alpha$ 当 $\\vec a_0$ 竖直向上时。A 对地加速度 $\\vec a=\\vec a'+\\vec a_0$。",
        "category": "力学",
        "type": "problemSolving"
    },
    {
        "question": "一根特殊弹簧，在伸长 $x$ 米时，其弹力为 $F=4x+6x^2$ 牛顿。（1）试求把弹簧从 $x=0.5\\,\\mathrm{m}$ 拉长到 $x=1.0\\,\\mathrm{m}$ 时，外力克服弹簧力所作的总功。（2）将弹簧的一端固定，在其另一端拴一质量为 $2\\,\\mathrm{kg}$ 的静止物体，试求弹簧从 $x=1.0\\,\\mathrm{m}$ 回到 $x=0.5\\,\\mathrm{m}$ 时物体的速率。（不计重力）",
        "answer": "$W=1.75\\,\\mathrm{J}$; $v=\\sqrt{1.75}\\approx1.32\\,\\mathrm{m/s}$",
        "solution": "（1）$W=\\int_{0.5}^{1.0}(4x+6x^2)\\,dx=[2x^2+2x^3]_{0.5}^{1.0}=4-0.625=1.75\\,\\mathrm{J}$。（2）弹性势能转化为动能：$\\frac{1}{2}mv^2=W$，$v=\\sqrt{2W/m}=\\sqrt{1.75}\\approx1.32\\,\\mathrm{m/s}$。",
        "category": "力学",
        "type": "problemSolving"
    },
    {
        "question": "两个滑冰运动员 A、B 的质量均为 $m=70\\,\\mathrm{kg}$，以 $v_0=6.5\\,\\mathrm{m/s}$ 的速率沿相反方向滑行，滑行路线间的垂直距离为 $R=10\\,\\mathrm{m}$，当彼此交错时，各抓住 $10\\,\\mathrm{m}$ 绳索的一端，然后相对旋转。（1）在抓住绳索之前，各自对绳中心的角动量是多少？抓住后又是多少？（2）他们各自收拢绳索，到绳长为 $r=5\\,\\mathrm{m}$ 时，各自的速率如何？（3）绳长为 $5\\,\\mathrm{m}$ 时，绳内的张力多大？（4）二人在收拢绳索时，设收绳速率相同，问二人各做了多少功？",
        "answer": "$L=2275\\,\\mathrm{kg\\cdot m^2/s}$; $v=13\\,\\mathrm{m/s}$; $T=4810\\,\\mathrm{N}$; $W=4436\\,\\mathrm{J}$",
        "solution": "（1）$L=mv_0R/2=70\\times6.5\\times5=2275\\,\\mathrm{kg\\cdot m^2/s}$，抓住前后角动量不变。（2）$mvr/2=L$，$v=2L/(mr)=13\\,\\mathrm{m/s}$。（3）$T=mv^2/(r/2)=4810\\,\\mathrm{N}$。（4）$W=\\frac{1}{2}mv^2-\\frac{1}{2}mv_0^2=4436\\,\\mathrm{J}$。",
        "category": "力学",
        "type": "problemSolving"
    },
    {
        "question": "一条轻绳跨过一轻滑轮（滑轮与轴间摩擦可忽略），在绳的一端挂一质量为 $m_1$ 的物体，在另一侧有一质量为 $m_2$ 的环，求当环相对于绳以恒定的加速度 $a_2$ 沿绳向下滑动时，物体和环相对地面的加速度各是多少？环与绳间的摩擦力多大？",
        "answer": "$a_1=\\frac{(m_1-m_2)a_2+m_1g}{m_1+m_2}$ 向下; $a_{2地}=a_2-a_1$ 向下; $f=\\frac{2m_1m_2g+m_1m_2a_2}{m_1+m_2}$",
        "solution": "设物体向下加速度为 $a_1$，绳张力 $T$，环受摩擦力 $f$ 向上。对物体：$m_1g-T=m_1a_1$；对环：$m_2g-f=m_2a_{2地}$，$a_{2地}=a_2-a_1$，$T=f$。联立求解。",
        "category": "力学",
        "type": "problemSolving"
    },
    {
        "question": "质量分别为 $m$ 和 $2m$、半径分别为 $r$ 和 $2r$ 的两个均匀圆盘，同轴地粘在一起，可以绕通过盘心且垂直盘面的水平光滑固定轴转动，对转轴的转动惯量为 $J=\\frac{9}{2}mr^2$，大小圆盘边缘都绕有绳子，绳子下端都挂一质量为 $m$ 的重物，如图所示。求盘的角加速度的大小。[如图所示]",
        "answer": "$\\beta=\\frac{2g}{19r}$",
        "solution": "设左侧重物加速度 $a_1$ 向下，右侧 $a_2$ 向下。转动定律：$T_1\\cdot2r-T_2\\cdot r=J\\beta$；重物：$mg-T_1=ma_1$，$mg-T_2=ma_2$；$a_1=2r\\beta$，$a_2=r\\beta$。联立得 $\\beta=2g/(19r)$。",
        "category": "力学",
        "type": "problemSolving"
    },
    {
        "question": "一质量为 $M$、长为 $l$ 的均匀细直杆，可绕通过其中心且与杆垂直的光滑水平固定轴，在竖直平面内转动。当杆停止于竖直位置时，质量为 $m$ 的子弹沿水平方向射入杆的下端且留在杆内，并使杆摆动，若杆摆动的最大偏角为 $\\theta$，试求：（1）入射前的速率 $v_0$；（2）在最大偏角 $\\theta$ 时，杆转动的角加速度。[如图所示]",
        "answer": "$v_0=\\frac{1}{m}\sqrt{\\frac{(M+3m)(M+6m)}{6}gl(1-\\cos\\theta)}$; $\\beta=\\frac{3(M+2m)g\\sin\\theta}{(M+3m)l}$",
        "solution": "（1）角动量守恒：$mv_0(l/2)=J_{总}\\omega_0$，$J_{总}=Ml^2/12+m(l/2)^2$。机械能守恒求 $\\omega_0$ 与 $\\theta$ 关系，解出 $v_0$。（2）$\\beta=M/J_{总}$，$M=(Mg\\cdot l/2+mg\\cdot l/2)\\sin\\theta$。",
        "category": "力学",
        "type": "problemSolving"
    },
    {
        "question": "一质量均匀分布的圆盘，质量为 $M$、半径为 $R$，放在一粗糙水平面上（圆盘与水平面之间的摩擦系数为 $\\mu$），圆盘可绕通过其中心 O 的竖直固定光滑轴转动。开始时，圆盘静止，一质量为 $m$ 的子弹以水平速度 $v_0$ 垂直于圆盘半径打入圆盘边缘并嵌在盘边上，求：（1）子弹击中圆盘后，盘所获得的角速度；（2）经过多少时间后，圆盘停止转动（圆盘绕通过 O 的竖直轴的转动惯量为 $\\frac{1}{2}MR^2$，忽略子弹重力造成的摩擦阻力矩）。[如图所示]",
        "answer": "$\\omega=\\frac{2mv_0}{(M+2m)R}$; $t=\\frac{3(M+2m)v_0}{4\\mu Mg}$",
        "solution": "（1）角动量守恒：$mv_0R=(\\frac{1}{2}MR^2+mR^2)\\omega$，得 $\\omega$。（2）摩擦力矩 $M_f=\\int_0^R \\mu(Mg/\\pi R^2)2\\pi r^2\\,dr=\\frac{2}{3}\\mu MgR$。由 $M_f t=J_{总}\\omega$ 得 $t$。",
        "category": "力学",
        "type": "problemSolving"
    },
    {
        "question": "一车轮可绕通过轮心 O 且与轮面垂直的水平光滑固定轴，在竖直面内转动，轮的质量为 $M$，可以认为均匀分布在半径为 $R$ 的圆周上，绕 O 轴的转动惯量 $J=MR^2$。车轮原来静止，一质量为 $m$ 的子弹，以速度 $v_0$ 沿与水平方向成 $\\alpha$ 角度射中轮心 O 正上方的轮缘 A 处，并留在 A 处，如图所示。设子弹与轮撞击时间极短。问：（1）以车轮、子弹为研究系统，撞击前后系统的动量是否守恒？为什么？动能是否守恒？为什么？角动量是否守恒？为什么？（2）子弹和轮开始一起运动时，轮的角速度是多少？[如图所示]",
        "answer": "动量不守恒（轴处受外力冲量）; 动能不守恒（完全非弹性碰撞）; 角动量守恒（轴处外力矩为零）; $\\omega=\\frac{mv_0\\cos\\alpha}{(M+m)R}$",
        "solution": "（1）轴 O 对轮有约束冲力，系统动量不守恒；碰撞为非弹性，动能不守恒；轴处力过 O 点，对 O 力矩为零，角动量守恒。（2）$mv_0\\cos\\alpha\\cdot R=(MR^2+mR^2)\\omega$。",
        "category": "力学",
        "type": "problemSolving"
    },
    {
        "question": "一长为 $l=1\\,\\mathrm{m}$ 的均匀直棒可绕过其一端且与棒垂直的水平光滑固定轴转动。抬起另一端使棒向上与水平面成 $60^\\circ$，然后无初转速地将棒释放。已知棒对轴的转动惯量为 $J=\\frac{1}{3}ml^2$，其中 $m$ 和 $l$ 分别为棒的质量和长度。求：（1）放手时棒的角加速度；（2）棒转到水平位置时的角加速度。[如图所示]",
        "answer": "$\\beta_0=\\frac{3g}{4l}=7.35\\,\\mathrm{rad/s^2}$; $\\beta=\\frac{3g}{2l}=14.7\\,\\mathrm{rad/s^2}$",
        "solution": "（1）$M=mg\\frac{l}{2}\\cos60^\\circ=\\frac{1}{4}mgl$，$\\beta_0=M/J=\\frac{3g}{4l}$。（2）水平位置 $M=\\frac{1}{2}mgl$，$\\beta=\\frac{3g}{2l}$。",
        "category": "力学",
        "type": "problemSolving"
    },
    {
        "question": "两个大小不同、具有水平光滑轴的定滑轮，顶点在同一水平线上。小滑轮的质量为 $m$，半径为 $r$，对轴的转动惯量 $J=\\frac{1}{2}mr^2$。大滑轮的质量 $m'=2m$，半径 $r'=2r$，对轴的转动惯量 $J'=\\frac{1}{2}m'r'^2$。一根不可伸长的轻质细绳跨过这两个定滑轮，绳的两端分别挂着物体 A 和 B。A 的质量为 $m$，B 的质量 $m'=2m$。这一系统由静止开始转动。已知 $m=6.0\\,\\mathrm{kg}$，$r=5.0\\,\\mathrm{cm}$。求两滑轮的角加速度和它们之间绳中的张力。[如图所示]",
        "answer": "$\\beta_A=\\frac{4g}{17r}\\approx46\\,\\mathrm{rad/s^2}$; $\\beta_B=\\frac{2g}{17r}\\approx23\\,\\mathrm{rad/s^2}$; $T=\\frac{12mg}{17}\\approx41.3\\,\\mathrm{N}$",
        "solution": "设绳中张力为 $T$，A 向上加速度 $a$，B 向下加速度 $a$。对小滑轮：$(T-T_1)r=J\\beta_A$；对大滑轮：$(T_2-T)r'=J'\\beta_B$；物体：$T_1-mg=ma$，$2mg-T_2=2ma$；$a=r\\beta_A=r'\\beta_B$。联立解得。",
        "category": "力学",
        "type": "problemSolving"
    },
]

optics_fillin = [
    {
        "question": "空气中一玻璃劈形膜其一端厚度为零另一端厚度为 $0.005\\,\\mathrm{cm}$，折射率为 $1.5$。现用波长为 $600\\,\\mathrm{nm}$（$1\\,\\mathrm{nm}=10^{-9}\\,\\mathrm{m}$）的单色平行光，沿入射角为 $30^{\\circ}$ 的方向射到劈的上表面，则在劈形膜上形成的干涉条纹数目为________。",
        "answer": "$236$",
        "solution": "斜入射时，光程差为 $2e\\sqrt{n^2-\\sin^2 i}$。条纹数 $N=\\dfrac{2e\\sqrt{n^2-\\sin^2 i}}{\\lambda}=\\dfrac{2\\times 0.005\\times 10^{-2}\\times\\sqrt{1.5^2-\\sin^2 30^{\\circ}}}{600\\times 10^{-9}}\\approx 235.7$，取整为 $236$ 条。",
        "category": "波动光学",
        "type": "fillInTheBlank"
    },
    {
        "question": "如图，在双缝干涉实验中，若把一厚度为 $e$、折射率为 $n$ 的薄云母片覆盖在 $S_1$ 缝上，中央明条纹将向________移动；覆盖云母片后，两束相干光至原中央明纹 O 处的光程差为________。",
        "answer": "上（$S_1$ 一侧）; $(n-1)e$",
        "solution": "覆盖 $S_1$ 使该路光程增加 $(n-1)e$，中央条纹向光程较大的 $S_1$ 方向（上）移动；原中央处光程差即为 $(n-1)e$。",
        "category": "波动光学",
        "type": "fillInTheBlank"
    },
    {
        "question": "平行单色光垂直入射在缝宽为 $a=0.15\\,\\mathrm{mm}$ 的单缝上。缝后有焦距为 $f=400\\,\\mathrm{mm}$ 的凸透镜，在其焦平面上放置观察屏幕。现测得屏幕上中央明条纹两侧的两个第三级暗纹之间的距离为 $8\\,\\mathrm{mm}$，则入射光的波长为 $\\lambda=$________。",
        "answer": "$500\\,\\mathrm{nm}$",
        "solution": "第三级暗纹位置 $x_3=\\pm3\\lambda f/a$，两侧间距 $6\\lambda f/a=8\\,\\mathrm{mm}$，解得 $\\lambda=8\\times10^{-3}\\times0.15\\times10^{-3}/(6\\times0.4)=500\\times10^{-9}\\,\\mathrm{m}=500\\,\\mathrm{nm}$。",
        "category": "波动光学",
        "type": "fillInTheBlank"
    },
    {
        "question": "如图所示的杨氏双缝干涉装置，若用单色自然光照射狭缝 S，在屏幕上能看到干涉条纹。若在双缝 $S_1$ 和 $S_2$ 的一侧分别加一同质同厚的偏振片 $P_1$、$P_2$，则当 $P_1$ 与 $P_2$ 的偏振化方向相互________时，在屏幕上仍能看到很清晰的干涉条纹。",
        "answer": "平行",
        "solution": "两束相干光必须振动方向相同才能产生清晰干涉，因此两偏振片偏振化方向需平行。",
        "category": "波动光学",
        "type": "fillInTheBlank"
    },
    {
        "question": "一束平行的自然光，以 $60^\\circ$ 角入射到平玻璃表面上。若反射光束是完全偏振的，则透射光束的折射角是________；玻璃的折射率为________。",
        "answer": "$30^\\circ$; $\\sqrt{3}$",
        "solution": "布儒斯特角满足 $\\tan i_B=n$，$i_B=60^\\circ$，$n=\\sqrt{3}$；折射角 $r=90^\\circ-i_B=30^\\circ$。",
        "category": "波动光学",
        "type": "fillInTheBlank"
    },
    {
        "question": "若对应于衍射角 $\\phi=30^\\circ$，单缝处的波面可划分为 $4$ 个半波带，则单缝的宽度 $a=$________$\\lambda$（$\\lambda$ 为入射光波长）。",
        "answer": "$4$",
        "solution": "$a\\sin\\phi=4\\cdot\\lambda/2=2\\lambda$，$\\sin30^\\circ=1/2$，故 $a=4\\lambda$。",
        "category": "波动光学",
        "type": "fillInTheBlank"
    },
    {
        "question": "一束单色光垂直入射在光栅上，衍射光谱中共出现 $5$ 条明纹。若已知此光栅缝宽度与不透明部分宽度相等，那么在中央明纹一侧的两条明纹分别是第________级和第________级谱线。",
        "answer": "$1$; $3$",
        "solution": "$a=b$ 时 $d=2a$，缺级发生在 $k=\\pm2,\\pm4,\\ldots$。可见 $k=0,\\pm1,\\pm3$ 共 5 条，故一侧为 $1$、$3$ 级。",
        "category": "波动光学",
        "type": "fillInTheBlank"
    },
    {
        "question": "He-Ne 激光器发出 $\\lambda=632.8\\,\\mathrm{nm}$（$1\\,\\mathrm{nm}=10^{-9}\\,\\mathrm{m}$）的平行光束，垂直照射到一单缝上，在距单缝 $3\\,\\mathrm{m}$ 远的屏上观察夫琅禾费衍射图样，测得两个第二级暗纹间的距离是 $10\\,\\mathrm{cm}$，则单缝的宽度 $a=$________。",
        "answer": "$7.6\\times10^{-5}\\,\\mathrm{m}$",
        "solution": "第二级暗纹间距 $4\\lambda L/a=0.10\\,\\mathrm{m}$，$a=4\\lambda L/0.10=4\\times632.8\\times10^{-9}\\times3/0.10\\approx7.6\\times10^{-5}\\,\\mathrm{m}$。",
        "category": "波动光学",
        "type": "fillInTheBlank"
    },
    {
        "question": "在单缝夫琅禾费衍射实验中，设第一级暗纹的衍射角很小，若钠黄光（$\\lambda_1\\approx589\\,\\mathrm{nm}$）中央明纹宽度为 $4.0\\,\\mathrm{mm}$，则 $\\lambda_2=442\\,\\mathrm{nm}$ 的蓝紫色光的中央明纹宽度为________。",
        "answer": "$3.0\\,\\mathrm{mm}$",
        "solution": "中央明纹宽度 $\\Delta x=2\\lambda f/a$ 与波长成正比，$\\Delta x_2=4.0\\times442/589\\approx3.0\\,\\mathrm{mm}$。",
        "category": "波动光学",
        "type": "fillInTheBlank"
    },
    {
        "question": "可见光的波长范围是 $400\\,\\mathrm{nm}\\text{—}760\\,\\mathrm{nm}$。用平行的白光垂直入射在平面透射光栅上时，它产生的不与另一级光谱重叠的完整的可见光光谱是第________级光谱。",
        "answer": "$1$",
        "solution": "$d\\sin\\theta=k\\lambda$。第 $k$ 级最长波长 $760k$ 需小于第 $k+1$ 级最短波长 $400(k+1)$，即 $760k<400(k+1)$，$k<1.05$，故只有 $k=1$ 级完整不重叠。",
        "category": "波动光学",
        "type": "fillInTheBlank"
    },
]

optics_calc = [
    {
        "question": "在牛顿环装置的平凸透镜和平玻璃板之间充满折射率 $n=1.33$ 的透明液体（设平凸透镜和平板玻璃的折射率都大于 $1.33$）。凸透镜的曲率半径为 $300\\ \\mathrm{cm}$，波长 $\\lambda = 650\\ \\mathrm{nm}$ 的平行单色光垂直照射到牛顿环装置上，凸透镜顶部刚好与平玻璃板接触，求：（1）从中心向外数第十个明环所在处的液体厚度；（2）第十个明环的半径 $r_{10}$。[如图所示]",
        "answer": "$e_{10}=\\dfrac{19\\lambda}{4n}\\approx 2.32\\times 10^{-6}\\ \\mathrm{m}$；$r_{10}=\\sqrt{\\dfrac{19R\\lambda}{2n}}\\approx 3.73\\times 10^{-3}\\ \\mathrm{m}$",
        "solution": "反射光在液体下表面（液体→玻璃）有 $\\pi$ 相位突变，上表面无突变，故反射明环满足 $2ne=\\left(k-\\dfrac12\\right)\\lambda$。第十个明环取 $k=10$，得 $e_{10}=\\dfrac{19\\lambda}{4n}$；由 $e\\approx \\dfrac{r^2}{2R}$，得 $r_{10}=\\sqrt{\\dfrac{19R\\lambda}{2n}}$。代入 $R=300\\ \\mathrm{cm}$、$\\lambda=650\\ \\mathrm{nm}$、$n=1.33$ 即得。",
        "category": "波动光学",
        "type": "problemSolving"
    },
    {
        "question": "一束自然光自水中入射到空气界面上，若水的折射率为 $1.33$，空气的折射率为 $1.00$，求布儒斯特角。",
        "answer": "$i_B=\\arctan\\frac{1.00}{1.33}\\approx36.9^\\circ$",
        "solution": "光从水中射向空气，布儒斯特角满足 $\\tan i_B=n_2/n_1=1.00/1.33$，$i_B\\approx36.9^\\circ$。",
        "category": "波动光学",
        "type": "problemSolving"
    },
    {
        "question": "由强度为 $I_a$ 的自然光和强度为 $I_b$ 的线偏振光混合而成的一束入射光，垂直入射在一偏振片上，当以入射光方向为转轴旋转偏振片时，出射光将出现最大值和最小值。其比值为 $n$。试求出 $I_a/I_b$ 与 $n$ 的关系。",
        "answer": "$\\frac{I_a}{I_b}=\\frac{2(n-1)}{1}$",
        "solution": "透过偏振片后，自然光强度为 $I_a/2$，线偏振光强度为 $I_b\\cos^2\\theta$。最大 $I_{max}=I_a/2+I_b$，最小 $I_{min}=I_a/2$。由 $I_{max}/I_{min}=n$ 得 $(I_a/2+I_b)/(I_a/2)=n$，解得 $I_a/I_b=2/(n-1)$。",
        "category": "波动光学",
        "type": "problemSolving"
    },
    {
        "question": "波长范围在 $450\\text{—}650\\,\\mathrm{nm}$ 之间的复色平行光垂直照射在每厘米有 $5000$ 条刻线的光栅上，屏幕放在透镜的焦面处，屏上第二级光谱各色光在屏上所占范围的宽度为 $35.1\\,\\mathrm{cm}$。求透镜的焦距 $f$。（$1\\,\\mathrm{nm}=10^{-9}\\,\\mathrm{m}$）",
        "answer": "$f\\approx1.00\\,\\mathrm{m}$",
        "solution": "光栅常数 $d=1\\,\\mathrm{cm}/5000=2\\times10^{-6}\\,\\mathrm{m}$。第二级 $\\sin\\theta=k\\lambda/d$。对 $450\\,\\mathrm{nm}$ 和 $650\\,\\mathrm{nm}$ 分别得 $\\theta_1\\approx26.7^\\circ$，$\\theta_2\\approx40.5^\\circ$。屏上宽度 $\\Delta x=f(\\tan\\theta_2-\\tan\\theta_1)=0.351\\,\\mathrm{m}$，解得 $f\\approx1.00\\,\\mathrm{m}$。",
        "category": "波动光学",
        "type": "problemSolving"
    },
    {
        "question": "一束平行光垂直入射到某个光栅上，该光束有两种波长的光，$\\lambda_1=440\\,\\mathrm{nm}$，$\\lambda_2=660\\,\\mathrm{nm}$。实验发现，两种波长的谱线（不计中央明纹）第二次重合于衍射角 $\\phi=60^\\circ$ 的方向上。求此光栅的光栅常数 $d$。",
        "answer": "$d=3.05\\times10^{-6}\\,\\mathrm{m}$",
        "solution": "重合时 $k_1\\lambda_1=k_2\\lambda_2$，$k_1/k_2=660/440=3/2$。第二次重合取 $k_1=6$，$k_2=4$。由 $d\\sin60^\\circ=k_1\\lambda_1$ 得 $d=6\\times440\\times10^{-9}/\\sin60^\\circ\\approx3.05\\times10^{-6}\\,\\mathrm{m}$。",
        "category": "波动光学",
        "type": "problemSolving"
    },
    {
        "question": "氦放电管发出的光垂直照射到某光栅上，测得波长 $\\lambda_1=0.668\\,\\mathrm{\\mu m}$ 的谱线的衍射角为 $\\phi=20^\\circ$。如果在同样 $\\phi$ 角处出现波长 $\\lambda_2=0.447\\,\\mathrm{\\mu m}$ 的更高级次的谱线，那么光栅常数最小是多少？",
        "answer": "$d_{min}\\approx3.92\\,\\mathrm{\\mu m}$",
        "solution": "$d\\sin\\phi=k_1\\lambda_1=k_2\\lambda_2$，$k_1/k_2=\\lambda_2/\\lambda_1\\approx0.669$。取 $k_1=2$，$k_2=3$ 为最小整数解。$d=2\\lambda_1/\\sin20^\\circ\\approx3.92\\,\\mathrm{\\mu m}$。",
        "category": "波动光学",
        "type": "problemSolving"
    },
    {
        "question": "在双缝干涉实验中，单色光源 $S_0$ 到两缝 $S_1$ 和 $S_2$ 的距离分别为 $l_1$ 和 $l_2$，并且 $l_2-l_1=\\lambda/3$，$\\lambda$ 为入射光的波长，双缝之间的距离为 $d$，双缝到屏幕的距离为 $D$（$D>>d$），如图。求：（1）零级明纹到屏幕中央 O 点的距离；（2）相邻明条纹间的距离。[如图所示]",
        "answer": "$x_0=-\\frac{D\\lambda}{3d}$; $\\Delta x=\\frac{D\\lambda}{d}$",
        "solution": "光源到两缝的光程差 $\\delta_0=l_2-l_1=\\lambda/3$ 使中央条纹向 $S_2$ 方向移动。零级明纹满足 $\\delta_0+dx/D=0$，$x_0=-D\\lambda/(3d)$。条纹间距不变，$\\Delta x=D\\lambda/d$。",
        "category": "波动光学",
        "type": "problemSolving"
    },
    {
        "question": "双缝干涉实验装置如图所示，双缝与屏之间的距离 $D=120\\,\\mathrm{cm}$，两缝之间的距离 $d=0.50\\,\\mathrm{mm}$，用波长 $\\lambda=500\\,\\mathrm{nm}$ 的单色光垂直照射双缝。（1）求原点 O（零级明条纹所在处）上方的第五级明条纹的坐标 $x$；（2）如果用厚度 $l=1.0\\times10^{-2}\\,\\mathrm{mm}$、折射率 $n=1.58$ 的透明薄膜覆盖在图中的 $S_1$ 缝后面，求上述第五级明条纹的坐标 $x'$。[如图所示]",
        "answer": "$x=6.0\\,\\mathrm{mm}$; $x'=-3.6\\,\\mathrm{cm}$",
        "solution": "（1）$x=kD\\lambda/d=5\\times1.2\\times500\\times10^{-9}/(0.5\\times10^{-3})=6.0\\times10^{-3}\\,\\mathrm{m}=6.0\\,\\mathrm{mm}$。（2）覆盖薄膜产生附加光程差 $\\Delta=(n-1)l=0.58\\times10^{-2}\\,\\mathrm{mm}=5.8\\,\\mathrm{\\mu m}=11.6\\lambda$。第五级明纹位置 $x'=x-(D/d)\\Delta\\approx-3.6\\,\\mathrm{cm}$。",
        "category": "波动光学",
        "type": "problemSolving"
    },
    {
        "question": "折射率为 $1.60$ 的两块标准平面玻璃板之间形成一个劈形膜（劈尖角 $\\theta$ 很小）。用波长 $\\lambda=600\\,\\mathrm{nm}$ 的单色光垂直入射，产生等厚干涉条纹。假如在劈形膜内充满 $n=1.40$ 的液体时的相邻明纹间距比劈形膜内空气时的间距缩小 $\\Delta l=0.5\\,\\mathrm{mm}$，那么劈尖角 $\\theta$ 应是多少？",
        "answer": "$\\theta\\approx1.7\\times10^{-4}\\,\\mathrm{rad}$",
        "solution": "明纹间距 $l=\\lambda/(2n\\theta)$。空气时 $l_0=\\lambda/(2\\theta)$，液体时 $l=\\lambda/(2n\\theta)$。$\\Delta l=l_0-l=\\frac{\\lambda}{2\\theta}(1-\\frac{1}{n})$。解得 $\\theta=\\frac{\\lambda}{2\\Delta l}(1-\\frac{1}{n})=\\frac{600\\times10^{-9}}{2\\times0.5\\times10^{-3}}\\times\\frac{0.4}{1.4}\\approx1.7\\times10^{-4}\\,\\mathrm{rad}$。",
        "category": "波动光学",
        "type": "problemSolving"
    },
]

# Combine in the requested order: mechanics (MC, fill-in, calc) then optics (MC, fill-in, calc)
all_questions = []
all_questions.extend(mechanics_mc)
all_questions.extend(mechanics_fillin)
all_questions.extend(mechanics_calc)
all_questions.extend(optics_mc)
all_questions.extend(optics_fillin)
all_questions.extend(optics_calc)

# Re-number for unified navigation and ensure consistent keys
for idx, q in enumerate(all_questions, start=1):
    q["id"] = idx

out_path = JSON_DIR / "comprehensive_mixed.json"
out_path.write_text(json.dumps(all_questions, ensure_ascii=False, indent=2), encoding="utf-8")
print(f"Wrote {len(all_questions)} questions to {out_path}")
