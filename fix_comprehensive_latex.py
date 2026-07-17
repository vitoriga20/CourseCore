import json
import re
from pathlib import Path

JSON_PATH = Path(r"c:\Users\vitoriga\AppData\Local\Temp\physics_questions\comprehensive_mixed.json")

def load():
    return json.loads(JSON_PATH.read_text(encoding="utf-8"))

def save(data):
    JSON_PATH.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")

def find(data, qid):
    for q in data:
        if q["id"] == qid:
            return q
    raise ValueError(f"id {qid} not found")

def main():
    data = load()

    # id 2: options B/C/D broken braces
    q2 = find(data, 2)
    q2["options"] = [
        r"$v=\frac{1}{2}k t^{2}+v_{0}$",
        r"$v=-\frac{1}{2}k t^{2}+v_{0}$",
        r"$\frac{1}{v}=\frac{k t^{2}}{2}+\frac{1}{v_{0}}$",
        r"$\frac{1}{v}=-\frac{k t^{2}}{2}+\frac{1}{v_{0}}$",
    ]

    # id 4: average vector braces
    q4 = find(data, 4)
    q4["question"] = q4["question"].replace(
        r"$\overline{\vec{v}$",
        r"$\overline{\vec{v}}$"
    )
    q4["options"] = [
        r"$\left| \vec{v}\right|=v , \left| \overline{\vec{v}}\right|=\overline{v}$",
        r"$\left| \vec{v}\right| \neq v , \left| \overline{\vec{v}}\right|=\overline{v}$",
        r"$\left| \bar{v}\right| \neq v , \ \left| \overline{\bar{v}}\right| \neq \overline{v}$",
        r"$\left| \vec{v}\right|=v , \left| \overline{\vec{v}}\right| \neq \overline{v}$",
    ]

    # id 13: option D missing closing brace
    q13 = find(data, 13)
    q13["options"][3] = r"${\omega}_{1}=\sqrt{\frac{2}{3}}\,{\omega}_{2}$"

    # id 17: missing opening $ and extra brace
    q17 = find(data, 17)
    q17["question"] = q17["question"].replace(
        r"${\frac{1}{3}m L^{2}$",
        r"$\frac{1}{3}mL^{2}$"
    )

    # id 18: fractions missing denominator braces + broken time math
    q18 = find(data, 18)
    q18["question"] = (
        r"质点的运动方程 $\vec{r}=\left( t-\frac{t^{2}}{2}\right) \vec{i}+\left( 5-3 t+\frac{t^{3}}{3}\right) \vec{j}$ (SI)，当 $t=2\,\mathrm{s}$ 时，其加速度 $\vec{a}=$"
    )

    # id 21: force expression
    q21 = find(data, 21)
    q21["question"] = q21["question"].replace(
        r"$F=40 0-{\frac{4\times10^{5}{3}t$",
        r"$F=400-\frac{4\times10^{5}}{3}t$"
    )

    # id 28: mass and velocity subscripts/units
    q28 = find(data, 28)
    q28["question"] = (
        q28["question"]
        .replace(r"$m=0.2 {\mathrm{~kg}$", r"$m=0.2\,\mathrm{kg}$")
        .replace(r"$v_{\mathrm{0}=10.5 \mathrm{m/s}$", r"$v_{0}=10.5\,\mathrm{m/s}$")
        .replace(r"$R=0.5 \mathrm{~m~}$", r"$R=0.5\,\mathrm{m}$")
        .replace(r"$7.0 \mathrm{kg}$", r"$7.0\,\mathrm{kg}$")
    )

    # id 37: m_l -> m_1
    q37 = find(data, 37)
    q37["question"] = q37["question"].replace(
        r"$m_{\mathrm{l}$",
        r"$m_{1}$"
    )

    # id 42: extra brace in moment of inertia
    q42 = find(data, 42)
    q42["question"] = q42["question"].replace(
        r"${\frac{1}{3}m l^{2}$",
        r"$\frac{1}{3}ml^{2}$"
    )

    # id 43: extra braces in moments of inertia
    q43 = find(data, 43)
    q43["question"] = (
        q43["question"]
        .replace(r"$J={\frac{1}{2}m r^{2}$", r"$J=\frac{1}{2}m r^{2}$")
        .replace(r"$J^{\prime}{=}\frac{1}{2}m^{\prime}{r^{\prime}^{2}$", r"$J^{\prime}=\frac{1}{2}m^{\prime}{r^{\prime}}^{2}$")
    )

    # id 74: path difference + D >> d cleanup
    q74 = find(data, 74)
    q74["question"] = (
        q74["question"]
        .replace(r"$l_{1}-l_{1}=3 \lambda$", r"$l_{2}-l_{1}=3\lambda$")
        .replace(r"$d ,$", r"$d$")
        .replace(
            r"$\mathrm{~D~}\left( \mathrm{D}\mathord{\left/{\vphantom{\mathrm{D}\right| \kern-delimiterspace}\mathrm{>}\mathord{\left/{\vphantom{\mathrm{D}\right| \kern-delimiterspace}\right)$",
            r"$D\,(D\gg d)$"
        )
    )

    # id 24: clean up units/spaces
    q24 = find(data, 24)
    q24["question"] = (
        q24["question"]
        .replace(r"$A A \"$", r"$AA'$")
        .replace(r"$M=10 0 \mathrm{N\\cdotm}$", r"$M=100\,\mathrm{N\\cdotm}$")
        .replace(r"$t=3 \mathrm{~s~}$", r"$t=3\,\mathrm{s}$")
    )

    # id 25: degree symbol
    q25 = find(data, 25)
    q25["question"] = q25["question"].replace(
        r"$\alpha{=}30^{0}$",
        r"$\alpha=30^{\circ}$"
    )

    # id 29: remove garbled iota/O
    q29 = find(data, 29)
    q29["question"] = q29["question"].replace(
        r"$\iota \dot{\iota}\textit{O}$",
        "O"
    )

    # id 60: focal length unit/spaces
    q60 = find(data, 60)
    q60["question"] = q60["question"].replace(
        r"$f {=}40 0 \mathrm{mm}$",
        r"$f=400\,\mathrm{mm}$"
    )

    # id 65: wavelength value spaces
    q65 = find(data, 65)
    q65["question"] = q65["question"].replace(
        r"$\lambda{=}63 2.8 \mathrm{nm}\left( \mathrm{nm}=10^{-9}\mathrm{m}\right)$",
        r"$\lambda=632.8\,\mathrm{nm}\left( \mathrm{nm}=10^{-9}\mathrm{m}\right)$"
    )

    # id 75: clean up spaced numbers
    q75 = find(data, 75)
    q75["question"] = (
        q75["question"]
        .replace(r"$D {=}12 0 \mathrm{cm}$", r"$D=120\,\mathrm{cm}$")
        .replace(r"$\lambda=50 0 \mathrm{nm}$", r"$\lambda=500\,\mathrm{nm}$")
        .replace(r"$l {=}1.0 {\times}10^{-2}\mathrm{mm}$", r"$l=1.0\times10^{-2}\,\mathrm{mm}$")
    )

    save(data)
    print("Fixed comprehensive_mixed.json")

if __name__ == "__main__":
    main()
