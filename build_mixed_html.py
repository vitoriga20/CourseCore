import json
from pathlib import Path

ROOT = Path(r"c:\Users\vitoriga\Downloads\物理试题")
JSON_DIR = Path(r"c:\Users\vitoriga\AppData\Local\Temp\physics_questions")
OUT_PATH = ROOT / "index（综合混合）.html"

questions = json.loads((JSON_DIR / "comprehensive_mixed.json").read_text(encoding="utf-8"))
questions_json = json.dumps(questions, ensure_ascii=False, indent=2)

HTML_TEMPLATE = r'''<!DOCTYPE html>
<html lang="zh-CN" data-theme="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>物理综合混合刷题</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        :root {
            --bg-color: #111111;
            --text-color: #f2f2f2;
            --border-color: #2a2a2a;
            --accent-color: #ffffff;
            --muted-color: #888888;
            --dot-color: rgba(255,255,255,0.05);
            --grid-color: rgba(255,255,255,0.04);
            --card-bg: #1a1a1a;
            --correct-bg: #143316;
            --correct-border: #4caf50;
            --hover-text-color: var(--correct-border);
            --wrong-bg: #3a1515;
            --wrong-border: #ef5350;
            --question-font: var(--font-serif);
            --font-sans: "Inter", "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif;
            --font-serif: "Noto Serif SC", "Source Han Serif SC", "STSong", "SimSun", serif;
            --font-mono: "JetBrains Mono", "SFMono-Regular", "SF Mono", Consolas, monospace;
        }
        [data-theme="light"] {
            --bg-color: #f8f8f6;
            --text-color: #2a2a2a;
            --border-color: #d4d4d4;
            --accent-color: #111111;
            --muted-color: #666666;
            --dot-color: rgba(0,0,0,0.04);
            --grid-color: rgba(0,0,0,0.03);
            --card-bg: #ffffff;
            --correct-bg: #e8f5e9;
            --correct-border: #2e7d32;
            --hover-text-color: var(--correct-border);
            --wrong-bg: #ffebee;
            --wrong-border: #c62828;
        }
        * { box-sizing: border-box; }
        body {
            margin: 0;
            font-family: var(--font-sans);
            background-color: var(--bg-color);
            color: var(--text-color);
            transition: background-color 0.3s, color 0.3s;
        }
        body[data-bg="dot"] {
            background-image: radial-gradient(var(--dot-color) 1px, transparent 1px);
            background-size: 24px 24px;
        }
        body[data-bg="grid"] {
            background-image: linear-gradient(var(--grid-color) 1px, transparent 1px),
                              linear-gradient(90deg, var(--grid-color) 1px, transparent 1px);
            background-size: 32px 32px;
        }
        body[data-bg="line"] {
            background-image: repeating-linear-gradient(45deg, transparent, transparent 24px, var(--grid-color) 24px, var(--grid-color) 25px);
        }
        body[data-bg="plain"] { background-image: none; }
        .font-serif { font-family: var(--font-serif); }
        .font-mono { font-family: var(--font-mono); }
        .geo-border { border: 1px solid var(--border-color); }
        .geo-card {
            background-color: var(--card-bg);
            border: 1px solid var(--border-color);
            box-shadow: 0 4px 0 rgba(255,255,255,0.03);
            transition: background-color 0.3s, border-color 0.3s, box-shadow 0.3s;
        }
        .geo-btn {
            border: 1px solid var(--border-color);
            background: transparent;
            color: var(--text-color);
            font-family: var(--font-sans);
            transition: all 0.15s;
        }
        .geo-btn:hover:not(:disabled) {
            background: var(--accent-color);
            color: var(--hover-text-color);
            border-color: var(--accent-color);
        }
        .geo-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .geo-primary {
            background: var(--accent-color);
            color: var(--bg-color);
            border: 1px solid var(--accent-color);
        }
        .geo-primary:hover:not(:disabled) {
            background: transparent;
            color: var(--hover-text-color);
        }
        .control-bar {
            position: sticky;
            top: 0;
            z-index: 40;
            background-color: var(--bg-color);
            border-bottom: 1px solid var(--border-color);
            transition: background-color 0.3s, border-color 0.3s;
        }
        .theme-chip {
            display: inline-flex;
            align-items: center;
            gap: 0.375rem;
            padding: 0.375rem 0.75rem;
            border: 1px solid var(--border-color);
            background: transparent;
            color: var(--text-color);
            font-size: 0.8rem;
            cursor: pointer;
            user-select: none;
            transition: all 0.15s;
        }
        .theme-chip:hover {
            background: var(--accent-color);
            color: var(--hover-text-color);
            border-color: var(--accent-color);
        }
        .progress-bar { height: 4px; background: var(--border-color); }
        .progress-bar > div { height: 100%; background: var(--accent-color); width: 0%; transition: width 0.3s; }
        .nav-btn {
            aspect-ratio: 1;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-family: var(--font-mono);
            font-size: 0.8rem;
            border: 1px solid var(--border-color);
            background: transparent;
            color: var(--text-color);
            cursor: pointer;
            transition: all 0.15s;
        }
        .nav-btn:hover:not(.current):not(.correct):not(.wrong):not(:disabled) { background: rgba(128,128,128,0.12); color: var(--hover-text-color); }
        .nav-btn.current { background: var(--accent-color); color: var(--bg-color); border-color: var(--accent-color); }
        .nav-btn.correct { background: var(--correct-bg); border-color: var(--correct-border); color: var(--correct-border); }
        .nav-btn.wrong { background: var(--wrong-bg); border-color: var(--wrong-border); color: var(--wrong-border); }
        .option-btn {
            text-align: left;
            padding: 0.875rem 1rem;
            margin-bottom: 0.625rem;
            border: 1px solid var(--border-color);
            background: transparent;
            color: var(--text-color);
            display: block;
            width: 100%;
            font-family: var(--question-font);
            font-size: 1rem;
            line-height: 1.6;
            transition: all 0.15s;
            cursor: pointer;
        }
        .option-btn:hover:not(:disabled) { background: rgba(128,128,128,0.08); color: var(--hover-text-color); }
        .option-btn.correct { background: var(--correct-bg); border-color: var(--correct-border); }
        .option-btn.wrong { background: var(--wrong-bg); border-color: var(--wrong-border); }
        .question-body {
            font-family: var(--question-font);
            font-size: 1.125rem;
            line-height: 1.8;
        }
        .question-figure {
            margin: 1rem 0;
            padding: 0.75rem;
            border: 1px solid var(--border-color);
            background: rgba(128,128,128,0.03);
        }
        .question-figure img { max-width: 100%; height: auto; display: block; margin: 0 auto; }
        .feedback {
            border-left: 3px solid var(--border-color);
            padding-left: 0.875rem;
            margin-top: 0.875rem;
            font-family: var(--question-font);
            line-height: 1.7;
        }
        .feedback.correct { border-color: var(--correct-border); }
        .feedback.wrong { border-color: var(--wrong-border); }
        .custom-scrollbar::-webkit-scrollbar { height: 6px; width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: var(--bg-color); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: var(--border-color); border-radius: 0; }
        input, textarea {
            font-family: var(--font-mono);
            font-size: 1rem;
        }
    </style>
    <script>
    MathJax = {
      tex: { inlineMath: [['$', '$'], ['\\(', '\\)']], displayMath: [['$$', '$$'], ['\\[', '\\]']] },
      chtml: { fontURL: 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/output/chtml/fonts/woff-v2' }
    };
    </script>
    <script src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-chtml.js" id="MathJax-script"></script>
</head>
<body data-bg="dot">
    <div class="control-bar">
        <div class="max-w-7xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between gap-3">
            <div class="flex items-center gap-3 min-w-0">
                <h1 class="font-serif text-lg md:text-xl font-bold tracking-tight truncate">物理综合混合刷题</h1>
                <span id="mode-badge" class="font-mono text-xs px-2 py-1 border shrink-0" style="border-color:var(--border-color);color:var(--muted-color)">顺序</span>
            </div>
            <div class="flex items-center gap-2 shrink-0">
                <button id="theme-btn" class="theme-chip">主题：炭黑</button>
                <button id="font-btn" class="theme-chip hidden sm:inline-flex">字体：宋体</button>
                <button id="bg-btn" class="theme-chip hidden sm:inline-flex">背景：网点</button>
                <button id="order-btn" class="theme-chip">切换随机</button>
            </div>
        </div>
        <div class="progress-bar"><div id="progress-fill"></div></div>
    </div>

    <div id="app" class="max-w-7xl mx-auto px-4 md:px-6 py-6 grid grid-cols-1 lg:grid-cols-[1fr_17rem] gap-6">
        <main id="main-column">
            <div id="quiz-view" class="geo-card p-6 md:p-8">
                <div class="flex flex-col md:flex-row md:justify-between md:items-start gap-3 mb-6">
                    <div>
                        <div class="flex items-center gap-2 mb-1">
                            <h2 class="font-serif text-2xl font-bold" id="question-header">综合</h2>
                            <span id="question-meta" class="font-mono text-xs px-2 py-0.5 border" style="border-color:var(--border-color);color:var(--muted-color)"></span>
                        </div>
                        <p class="text-sm" style="color:var(--muted-color)">点击右侧题号可跳转，答完后显示解析</p>
                    </div>
                    <div class="font-mono text-sm shrink-0" style="color:var(--muted-color)" id="question-counter">第 1 / 76 题</div>
                </div>

                <div id="question-body" class="question-body mb-6"></div>
                <div id="answer-area" class="mb-8"></div>

                <div class="flex flex-wrap justify-between items-center gap-3 pt-6 border-t" style="border-color:var(--border-color)">
                    <button id="prev-btn" class="geo-btn px-5 py-2.5 text-sm font-medium">← 上一题</button>
                    <button id="finish-btn" class="lg:hidden geo-primary px-5 py-2.5 text-sm font-medium">完成练习</button>
                    <button id="next-btn" class="geo-btn px-5 py-2.5 text-sm font-medium">下一题 →</button>
                </div>
            </div>

            <div id="result-view" class="hidden geo-card p-8 md:p-12 text-center">
                <h2 class="font-serif text-4xl font-bold mb-3">练习完成</h2>
                <div class="w-16 h-px mx-auto mb-6" style="background:var(--border-color)"></div>
                <p id="score-text" class="font-serif text-2xl mb-10"></p>
                <button id="restart-btn" class="geo-primary px-8 py-3 text-lg font-medium">重新开始</button>
            </div>
        </main>

        <aside id="sidebar" class="hidden lg:block">
            <div class="geo-card p-4 sticky top-20">
                <div class="flex justify-between items-center mb-3">
                    <h3 class="font-serif text-lg font-bold">题号导航</h3>
                    <span id="progress-text" class="font-mono text-xs" style="color:var(--muted-color)">0 / 0</span>
                </div>
                <div id="navbar-container" class="grid grid-cols-5 gap-2"></div>
                <div class="mt-5">
                    <button id="sidebar-finish-btn" class="geo-primary w-full py-2.5 text-sm font-medium">完成练习</button>
                </div>
                <div class="mt-4 space-y-2 text-xs" style="color:var(--muted-color)">
                    <div class="flex items-center gap-2"><span class="w-3 h-3 border" style="border-color:var(--border-color);background:transparent"></span> 未答</div>
                    <div class="flex items-center gap-2"><span class="w-3 h-3" style="background:var(--correct-bg);border:1px solid var(--correct-border)"></span> 正确</div>
                    <div class="flex items-center gap-2"><span class="w-3 h-3" style="background:var(--wrong-bg);border:1px solid var(--wrong-border)"></span> 错误</div>
                </div>
            </div>
        </aside>
    </div>

    <div id="bottom-navbar" class="lg:hidden fixed bottom-0 left-0 right-0 border-t py-2 px-3" style="background-color:var(--card-bg);border-color:var(--border-color)">
        <div id="bottom-navbar-container" class="flex items-center gap-2 overflow-x-auto whitespace-nowrap custom-scrollbar"></div>
    </div>

    <script>
        function normalizeAnswer(str) {
            if (!str) return '';
            return str.toString()
                .replace(/\$/g, '')
                .replace(/\\mathrm\{([^}]*)\}/g, '$1')
                .replace(/\\,/g, '')
                .replace(/\\;/g, '')
                .replace(/[\u3000\s]+/g, '')
                .replace(/；/g, ';')
                .replace(/，/g, ',')
                .replace(/（/g, '(')
                .replace(/）/g, ')')
                .toLowerCase();
        }

        function shuffleArray(array, seed) {
            const result = array.slice();
            let s = seed;
            for (let i = result.length - 1; i > 0; i--) {
                s = (s * 9301 + 49297) % 233280;
                const j = Math.floor((s / 233280) * (i + 1));
                [result[i], result[j]] = [result[j], result[i]];
            }
            return result;
        }

        function mainApp() {
            const state = {
                allQuestions: [],
                order: [],
                userAnswers: [],
                currentIndex: 0,
                mode: 'sequential',
                seed: 42,
            };

            const quizView = document.getElementById('quiz-view');
            const resultView = document.getElementById('result-view');
            const questionHeader = document.getElementById('question-header');
            const questionMeta = document.getElementById('question-meta');
            const questionCounter = document.getElementById('question-counter');
            const questionBody = document.getElementById('question-body');
            const answerArea = document.getElementById('answer-area');
            const prevBtn = document.getElementById('prev-btn');
            const nextBtn = document.getElementById('next-btn');
            const finishBtn = document.getElementById('finish-btn');
            const sidebarFinishBtn = document.getElementById('sidebar-finish-btn');
            const orderBtn = document.getElementById('order-btn');
            const restartBtn = document.getElementById('restart-btn');
            const scoreText = document.getElementById('score-text');
            const navbarContainer = document.getElementById('navbar-container');
            const bottomNavbarContainer = document.getElementById('bottom-navbar-container');
            const themeBtn = document.getElementById('theme-btn');
            const fontBtn = document.getElementById('font-btn');
            const bgBtn = document.getElementById('bg-btn');
            const modeBadge = document.getElementById('mode-badge');
            const progressFill = document.getElementById('progress-fill');
            const progressText = document.getElementById('progress-text');

            const questionBankData = {questions_json};

            const BG_MODES = ['dot', 'grid', 'line', 'plain'];
            const BG_LABELS = { dot: '网点', grid: '方格', line: '斜线', plain: '纯色' };

            function init() {
                state.allQuestions = questionBankData;
                resetOrder();
                state.userAnswers = new Array(state.allQuestions.length).fill(null);
                loadTheme();
                loadBg();
                loadFont();
                renderQuestion();
                renderNavbar();
                updateProgress();
                prevBtn.addEventListener('click', showPrev);
                nextBtn.addEventListener('click', showNext);
                finishBtn.addEventListener('click', showResults);
                sidebarFinishBtn.addEventListener('click', showResults);
                orderBtn.addEventListener('click', toggleOrder);
                restartBtn.addEventListener('click', restartQuiz);
                themeBtn.addEventListener('click', toggleTheme);
                fontBtn.addEventListener('click', toggleFont);
                bgBtn.addEventListener('click', toggleBg);
            }

            function resetOrder() {
                state.order = state.allQuestions.map((_, i) => i);
                if (state.mode === 'random') {
                    state.order = shuffleArray(state.order, state.seed);
                }
            }

            function questionAt(i) {
                return state.allQuestions[state.order[i]];
            }

            function answerAt(i) {
                return state.userAnswers[state.order[i]];
            }

            function setAnswerAt(i, value) {
                state.userAnswers[state.order[i]] = value;
            }

            function typeLabel(type) {
                if (type === 'multipleChoice') return '选择题';
                if (type === 'fillInTheBlank') return '填空题';
                return '解答题';
            }

            function renderQuestion() {
                if (state.allQuestions.length === 0) {
                    questionBody.innerHTML = '<p>题库为空。</p>';
                    return;
                }
                const question = questionAt(state.currentIndex);
                questionHeader.textContent = question.category || '综合';
                questionMeta.textContent = typeLabel(question.type);
                questionCounter.textContent = `第 ${state.currentIndex + 1} / ${state.order.length} 题`;
                questionBody.innerHTML = question.question.replace(/\n/g, '<br>');

                if (question.image) {
                    const figure = document.createElement('div');
                    figure.className = 'question-figure';
                    const img = document.createElement('img');
                    img.src = question.image;
                    img.alt = '题图';
                    figure.appendChild(img);
                    questionBody.appendChild(figure);
                }

                answerArea.innerHTML = '';

                if (question.type === 'multipleChoice') renderMultipleChoice(question);
                else if (question.type === 'fillInTheBlank') renderFillIn(question, false);
                else renderFillIn(question, true);

                prevBtn.disabled = state.currentIndex === 0;
                nextBtn.disabled = state.currentIndex === state.order.length - 1;

                if (window.MathJax) MathJax.typesetPromise([questionBody, answerArea]);
            }

            function renderMultipleChoice(question) {
                const optionLetters = ['A', 'B', 'C', 'D', 'E'];
                question.options.forEach((option, index) => {
                    const btn = document.createElement('button');
                    btn.className = 'option-btn geo-btn';
                    btn.innerHTML = `<span class="font-mono font-bold mr-2">${optionLetters[index]}.</span>${option}`;
                    btn.onclick = () => handleMC(index, optionLetters[index], btn);
                    answerArea.appendChild(btn);
                });
                const stored = answerAt(state.currentIndex);
                if (stored) restoreMC(stored.selected);
            }

            function handleMC(index, letter, btn) {
                if (answerAt(state.currentIndex)) return;
                const question = questionAt(state.currentIndex);
                const isCorrect = letter === question.answer;
                setAnswerAt(state.currentIndex, { selected: letter, isCorrect });
                applyMCStyles(letter, question.answer);
                updateNavbar();
                updateProgress();
            }

            function restoreMC(selected) {
                applyMCStyles(selected, questionAt(state.currentIndex).answer);
            }

            function applyMCStyles(selected, correct) {
                const buttons = answerArea.querySelectorAll('.option-btn');
                buttons.forEach((btn, idx) => {
                    const letter = ['A', 'B', 'C', 'D', 'E'][idx];
                    btn.disabled = true;
                    btn.classList.remove('correct', 'wrong');
                    if (letter === correct) btn.classList.add('correct');
                    else if (letter === selected) btn.classList.add('wrong');
                });
            }

            function renderFillIn(question, isLong) {
                const container = document.createElement('div');
                container.className = 'flex flex-col gap-3';

                const input = document.createElement(isLong ? 'textarea' : 'input');
                input.type = isLong ? null : 'text';
                input.id = 'text-answer-input';
                input.className = 'w-full p-3 bg-transparent geo-border outline-none';
                input.style.color = 'var(--text-color)';
                input.placeholder = isLong ? '请输入答案/关键结果（多部分用 ; 分隔）' : '请输入答案...';
                if (isLong) { input.rows = 4; }

                const submitBtn = document.createElement('button');
                submitBtn.textContent = '提交答案';
                submitBtn.className = 'geo-primary px-4 py-2 self-start';
                submitBtn.onclick = () => handleTextSubmit();

                container.appendChild(input);
                container.appendChild(submitBtn);
                answerArea.appendChild(container);

                input.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !isLong) handleTextSubmit(); });

                const stored = answerAt(state.currentIndex);
                if (stored) restoreText(stored.selected);
            }

            function handleTextSubmit() {
                if (answerAt(state.currentIndex)) return;
                const input = document.getElementById('text-answer-input');
                const userAnswer = input.value.trim();
                if (userAnswer === '') return;
                const question = questionAt(state.currentIndex);
                const isCorrect = normalizeAnswer(userAnswer) === normalizeAnswer(question.answer);
                setAnswerAt(state.currentIndex, { selected: userAnswer, isCorrect });
                applyTextStyles(isCorrect, question);
                updateNavbar();
                updateProgress();
            }

            function restoreText(selected) {
                const input = document.getElementById('text-answer-input');
                input.value = selected;
                applyTextStyles(answerAt(state.currentIndex).isCorrect, questionAt(state.currentIndex));
            }

            function applyTextStyles(isCorrect, question) {
                const input = document.getElementById('text-answer-input');
                input.disabled = true;
                input.classList.add(isCorrect ? 'correct' : 'wrong');
                const submitBtn = input.nextElementSibling;
                if (submitBtn) submitBtn.disabled = true;

                const existing = answerArea.querySelector('.feedback');
                if (existing) existing.remove();

                const fb = document.createElement('div');
                fb.className = `feedback ${isCorrect ? 'correct' : 'wrong'}`;
                if (isCorrect) {
                    fb.innerHTML = '<strong>回答正确</strong>';
                } else {
                    fb.innerHTML = '<strong>正确答案：</strong>' + question.answer +
                        (question.solution ? '<div class="mt-2"><strong>解析：</strong>' + question.solution + '</div>' : '');
                }
                answerArea.appendChild(fb);
                if (window.MathJax) MathJax.typesetPromise([fb]);
            }

            function renderNavbar() {
                navbarContainer.innerHTML = '';
                bottomNavbarContainer.innerHTML = '';
                state.order.forEach((origIdx, displayIdx) => {
                    const sidebarBtn = createNavButton(displayIdx);
                    navbarContainer.appendChild(sidebarBtn);
                    const bottomBtn = createNavButton(displayIdx);
                    bottomNavbarContainer.appendChild(bottomBtn);
                });
                updateNavbar();
            }

            function createNavButton(displayIdx) {
                const btn = document.createElement('button');
                btn.textContent = displayIdx + 1;
                btn.className = 'nav-btn';
                btn.dataset.idx = displayIdx;
                btn.onclick = () => goToQuestion(displayIdx);
                return btn;
            }

            function updateNavbar() {
                document.querySelectorAll('.nav-btn').forEach(btn => {
                    const idx = parseInt(btn.dataset.idx, 10);
                    btn.classList.remove('current', 'correct', 'wrong');
                    const answer = answerAt(idx);
                    if (idx === state.currentIndex) btn.classList.add('current');
                    else if (answer && answer.isCorrect) btn.classList.add('correct');
                    else if (answer) btn.classList.add('wrong');
                });
            }

            function goToQuestion(index) {
                if (index >= 0 && index < state.order.length) {
                    state.currentIndex = index;
                    renderQuestion();
                    updateNavbar();
                    const btn = navbarContainer.children[index];
                    if (btn) btn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
                }
            }

            function showNext() { goToQuestion(state.currentIndex + 1); }
            function showPrev() { goToQuestion(state.currentIndex - 1); }

            function toggleOrder() {
                if (state.mode === 'sequential') {
                    state.mode = 'random';
                    state.seed = Date.now();
                    orderBtn.textContent = '切换顺序';
                    modeBadge.textContent = '随机';
                } else {
                    state.mode = 'sequential';
                    orderBtn.textContent = '切换随机';
                    modeBadge.textContent = '顺序';
                }
                resetOrder();
                state.currentIndex = 0;
                renderQuestion();
                renderNavbar();
            }

            function updateProgress() {
                const total = state.allQuestions.length;
                const answered = state.userAnswers.filter(a => a !== null).length;
                const pct = total > 0 ? (answered / total) * 100 : 0;
                progressFill.style.width = pct + '%';
                progressText.textContent = `${answered} / ${total}`;
            }

            function showResults() {
                const correct = state.userAnswers.filter(a => a && a.isCorrect).length;
                const total = state.allQuestions.length;
                const pct = total > 0 ? ((correct / total) * 100).toFixed(1) : 0;
                scoreText.innerHTML = `答对 <strong>${correct}</strong> / ${total} 题<br><span class="text-lg" style="color:var(--muted-color)">正确率 ${pct}%</span>`;
                quizView.classList.add('hidden');
                resultView.classList.remove('hidden');
            }

            function restartQuiz() {
                state.currentIndex = 0;
                state.userAnswers.fill(null);
                state.mode = 'sequential';
                orderBtn.textContent = '切换随机';
                modeBadge.textContent = '顺序';
                resetOrder();
                resultView.classList.add('hidden');
                quizView.classList.remove('hidden');
                renderQuestion();
                renderNavbar();
                updateProgress();
            }

            function loadTheme() {
                const saved = localStorage.getItem('grind-theme');
                const theme = saved || 'dark';
                setTheme(theme);
            }

            function toggleTheme() {
                const current = document.documentElement.getAttribute('data-theme') || 'dark';
                const next = current === 'dark' ? 'light' : 'dark';
                setTheme(next);
            }

            function setTheme(theme) {
                document.documentElement.setAttribute('data-theme', theme);
                themeBtn.textContent = theme === 'dark' ? '主题：炭黑' : '主题：宣纸';
                localStorage.setItem('grind-theme', theme);
                if (window.MathJax) MathJax.typesetPromise();
            }

            function loadFont() {
                const saved = localStorage.getItem('grind-font');
                const font = saved || 'serif';
                setFont(font);
            }

            function toggleFont() {
                const current = document.documentElement.style.getPropertyValue('--question-font').includes('sans') ? 'sans' : 'serif';
                const next = current === 'serif' ? 'sans' : 'serif';
                setFont(next);
            }

            function setFont(font) {
                const value = font === 'sans' ? 'var(--font-sans)' : 'var(--font-serif)';
                document.documentElement.style.setProperty('--question-font', value);
                fontBtn.textContent = font === 'sans' ? '字体：黑体' : '字体：宋体';
                localStorage.setItem('grind-font', font);
                if (window.MathJax) MathJax.typesetPromise();
            }

            function loadBg() {
                const saved = localStorage.getItem('grind-bg');
                const bg = saved || 'dot';
                setBg(bg);
            }

            function toggleBg() {
                const current = document.body.getAttribute('data-bg') || 'dot';
                const idx = BG_MODES.indexOf(current);
                const next = BG_MODES[(idx + 1) % BG_MODES.length];
                setBg(next);
            }

            function setBg(bg) {
                document.body.setAttribute('data-bg', bg);
                bgBtn.textContent = '背景：' + (BG_LABELS[bg] || bg);
                localStorage.setItem('grind-bg', bg);
            }

            init();
        }

        if (window.MathJax && window.MathJax.startup) {
            window.MathJax.startup.promise.then(mainApp);
        } else {
            document.addEventListener('DOMContentLoaded', mainApp);
        }
    </script>
</body>
</html>
'''

out_text = HTML_TEMPLATE.replace('{questions_json}', questions_json)
OUT_PATH.write_text(out_text, encoding="utf-8")
print(f"Wrote {OUT_PATH} ({len(questions)} questions)")
