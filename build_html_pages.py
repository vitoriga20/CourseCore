import json
from pathlib import Path

ROOT = Path(r"c:\Users\vitoriga\Downloads\物理试题")
JSON_DIR = Path(r"c:\Users\vitoriga\AppData\Local\Temp\physics_questions")

FILLIN_JSONS = [
    ("mechanics_fillin.json", "力学"),
    ("optics_fillin.json", "波动光学"),
]
CALC_JSONS = [
    ("mechanics_calc.json", "力学"),
    ("optics_calc.json", "波动光学"),
]


def load_and_tag(path, category):
    data = json.loads(path.read_text(encoding="utf-8"))
    for item in data:
        item["category"] = category
    return data


FILLIN_TEMPLATE = r'''<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>物理填空题刷题</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        .custom-scrollbar::-webkit-scrollbar { height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #888; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #555; }
        .question-body img { max-width: 100%; height: auto; }
    </style>
    <script>
    MathJax = {
      tex: {
        inlineMath: [['$', '$'], ['\\(', '\\)']],
        displayMath: [['$$', '$$'], ['\\[', '\\]']]
      },
      chtml: {
        fontURL: 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/output/chtml/fonts/woff-v2'
      }
    };
    </script>
    <script src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-chtml.js" id="MathJax-script"></script>
</head>
<body class="bg-gray-100 font-sans">
    <div id="app" class="max-w-4xl mx-auto p-4 md:p-6 pb-24">
        <div id="quiz-view" class="bg-white rounded-lg shadow-md p-6">
            <div class="flex justify-between items-center mb-4">
                <h2 class="text-xl font-bold text-gray-800" id="question-header"></h2>
                <div class="text-sm text-gray-600" id="question-counter"></div>
            </div>
            <div id="question-body" class="text-gray-700 text-lg leading-relaxed mb-4"></div>
            <div id="answer-area" class="space-y-2"></div>
            <div class="flex justify-between mt-5">
                <button id="prev-btn" class="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-lg transition-colors">上一题</button>
                <button id="finish-btn" class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition-colors">完成练习</button>
                <button id="next-btn" class="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-lg transition-colors">下一题</button>
            </div>
        </div>
        <div id="result-view" class="hidden bg-white rounded-lg shadow-md p-8 text-center">
            <h2 class="text-3xl font-bold text-gray-800 mb-4">练习完成！</h2>
            <p id="score-text" class="text-xl text-gray-700 mb-8"></p>
            <button id="restart-btn" class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg text-lg transition-colors">重新开始</button>
        </div>
    </div>
    <div id="bottom-navbar" class="fixed bottom-0 left-0 right-0 bg-white shadow-lg p-2 border-t border-gray-200">
        <div id="navbar-container" class="flex items-center space-x-2 overflow-x-auto whitespace-nowrap custom-scrollbar pb-2"></div>
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

        function mainApp() {
            const state = {
                questions: [],
                userAnswers: [],
                currentIndex: 0,
            };

            const quizView = document.getElementById('quiz-view');
            const resultView = document.getElementById('result-view');
            const questionHeader = document.getElementById('question-header');
            const questionCounter = document.getElementById('question-counter');
            const questionBody = document.getElementById('question-body');
            const answerArea = document.getElementById('answer-area');
            const prevBtn = document.getElementById('prev-btn');
            const nextBtn = document.getElementById('next-btn');
            const finishBtn = document.getElementById('finish-btn');
            const restartBtn = document.getElementById('restart-btn');
            const scoreText = document.getElementById('score-text');
            const navbarContainer = document.getElementById('navbar-container');

            const questionBankData = {questions_json};

            function init() {
                state.questions = questionBankData;
                state.userAnswers = new Array(state.questions.length).fill(null);
                renderQuestion();
                renderNavbar();
                prevBtn.addEventListener('click', showPrev);
                nextBtn.addEventListener('click', showNext);
                finishBtn.addEventListener('click', showResults);
                restartBtn.addEventListener('click', restartQuiz);
            }

            function renderQuestion() {
                if (state.questions.length === 0) {
                    questionBody.innerHTML = '<p>题库加载失败或为空。</p>';
                    return;
                }
                const question = state.questions[state.currentIndex];
                questionHeader.textContent = question.category || '综合';
                questionCounter.textContent = `第 ${state.currentIndex + 1} / ${state.questions.length} 题`;
                questionBody.innerHTML = question.question.replace(/\\n/g, '<br>');
                answerArea.innerHTML = '';
                renderFillInTheBlank(question);
                prevBtn.disabled = state.currentIndex === 0;
                nextBtn.disabled = state.currentIndex === state.questions.length - 1;
                if (window.MathJax) {
                    MathJax.typesetPromise([questionBody, answerArea]);
                }
            }

            function renderFillInTheBlank(question) {
                const container = document.createElement('div');
                container.className = 'flex items-center space-x-2';
                const input = document.createElement('input');
                input.type = 'text';
                input.id = 'fill-in-blank-input';
                input.className = 'flex-grow p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400';
                input.placeholder = '请输入答案...';
                const submitBtn = document.createElement('button');
                submitBtn.textContent = '提交答案';
                submitBtn.className = 'bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition-colors';
                submitBtn.onclick = () => handleSubmitFillIn();
                container.appendChild(input);
                container.appendChild(submitBtn);
                answerArea.appendChild(container);
                input.addEventListener('keydown', (e) => { if (e.key === 'Enter') handleSubmitFillIn(); });
                if (state.userAnswers[state.currentIndex] !== null) {
                    restoreAnswerState();
                }
            }

            function handleSubmitFillIn() {
                if (state.userAnswers[state.currentIndex] !== null) return;
                const question = state.questions[state.currentIndex];
                const input = document.getElementById('fill-in-blank-input');
                const userAnswer = input.value.trim();
                if (userAnswer === '') return;
                const isCorrect = normalizeAnswer(userAnswer) === normalizeAnswer(question.answer);
                state.userAnswers[state.currentIndex] = { selected: userAnswer, isCorrect: isCorrect };
                updateNavbar();
                applyAnswerStyles();
            }

            function restoreAnswerState() {
                applyAnswerStyles();
            }

            function applyAnswerStyles() {
                const answerData = state.userAnswers[state.currentIndex];
                if (answerData === null) return;
                const question = state.questions[state.currentIndex];
                const input = document.getElementById('fill-in-blank-input');
                const submitBtn = input.nextElementSibling;
                input.value = answerData.selected;
                input.disabled = true;
                submitBtn.disabled = true;
                const oldFeedback = answerArea.querySelector('.feedback-text');
                if (oldFeedback) oldFeedback.remove();
                if (answerData.isCorrect) {
                    input.className = 'flex-grow p-2 border-2 border-green-500 bg-green-100 rounded-lg';
                } else {
                    input.className = 'flex-grow p-2 border-2 border-red-500 bg-red-100 rounded-lg';
                    const feedbackText = document.createElement('div');
                    feedbackText.className = 'text-red-600 mt-2 feedback-text';
                    feedbackText.innerHTML = '正确答案：' + question.answer;
                    answerArea.appendChild(feedbackText);
                    if (window.MathJax) MathJax.typesetPromise([feedbackText]);
                }
            }

            function renderNavbar() {
                navbarContainer.innerHTML = '';
                state.questions.forEach((_, index) => {
                    const button = document.createElement('button');
                    button.textContent = index + 1;
                    button.className = 'w-10 h-10 flex-shrink-0 rounded-md font-mono transition-colors focus:outline-none';
                    updateButtonStatus(button, index);
                    button.onclick = () => goToQuestion(index);
                    navbarContainer.appendChild(button);
                });
            }

            function updateNavbar() {
                const buttons = navbarContainer.querySelectorAll('button');
                buttons.forEach((button, index) => updateButtonStatus(button, index));
            }

            function updateButtonStatus(button, index) {
                const answer = state.userAnswers[index];
                let baseStyle = 'border ';
                if (index === state.currentIndex) {
                    baseStyle += 'bg-blue-500 text-white border-blue-500';
                } else if (answer === null) {
                    baseStyle += 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100';
                } else if (answer.isCorrect) {
                    baseStyle += 'bg-green-200 text-green-800 border-green-300';
                } else {
                    baseStyle += 'bg-red-200 text-red-800 border-red-300';
                }
                button.className = `w-10 h-10 flex-shrink-0 rounded-md font-mono transition-colors focus:outline-none ${baseStyle}`;
            }

            function goToQuestion(index) {
                if (index >= 0 && index < state.questions.length) {
                    state.currentIndex = index;
                    renderQuestion();
                    updateNavbar();
                    const currentBtn = navbarContainer.children[index];
                    if (currentBtn) {
                        currentBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
                    }
                }
            }

            function showNext() { goToQuestion(state.currentIndex + 1); }
            function showPrev() { goToQuestion(state.currentIndex - 1); }

            function showResults() {
                const correctAnswers = state.userAnswers.filter(a => a && a.isCorrect).length;
                const totalQuestions = state.questions.length;
                const percentage = totalQuestions > 0 ? ((correctAnswers / totalQuestions) * 100).toFixed(1) : 0;
                scoreText.textContent = `答对题数 ${correctAnswers} / ${totalQuestions} (正确率 ${percentage}%)`;
                quizView.classList.add('hidden');
                resultView.classList.remove('hidden');
            }

            function restartQuiz() {
                state.currentIndex = 0;
                state.userAnswers.fill(null);
                resultView.classList.add('hidden');
                quizView.classList.remove('hidden');
                renderQuestion();
                updateNavbar();
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

CALC_TEMPLATE = r'''<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>物理解答题刷题</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        .custom-scrollbar::-webkit-scrollbar { height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #888; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #555; }
        .question-body img { max-width: 100%; height: auto; }
    </style>
    <script>
    MathJax = {
      tex: {
        inlineMath: [['$', '$'], ['\\(', '\\)']],
        displayMath: [['$$', '$$'], ['\\[', '\\]']]
      },
      chtml: {
        fontURL: 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/output/chtml/fonts/woff-v2'
      }
    };
    </script>
    <script src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-chtml.js" id="MathJax-script"></script>
</head>
<body class="bg-gray-100 font-sans">
    <div id="app" class="max-w-4xl mx-auto p-4 md:p-6 pb-24">
        <div id="quiz-view" class="bg-white rounded-lg shadow-md p-6">
            <div class="flex justify-between items-center mb-4">
                <h2 class="text-xl font-bold text-gray-800" id="question-header"></h2>
                <div class="text-sm text-gray-600" id="question-counter"></div>
            </div>
            <div id="question-body" class="text-gray-700 text-lg leading-relaxed mb-4"></div>
            <div id="answer-area" class="space-y-2"></div>
            <div class="flex justify-between mt-5">
                <button id="prev-btn" class="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-lg transition-colors">上一题</button>
                <button id="finish-btn" class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition-colors">完成练习</button>
                <button id="next-btn" class="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-lg transition-colors">下一题</button>
            </div>
        </div>
        <div id="result-view" class="hidden bg-white rounded-lg shadow-md p-8 text-center">
            <h2 class="text-3xl font-bold text-gray-800 mb-4">练习完成！</h2>
            <p id="score-text" class="text-xl text-gray-700 mb-8"></p>
            <button id="restart-btn" class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg text-lg transition-colors">重新开始</button>
        </div>
    </div>
    <div id="bottom-navbar" class="fixed bottom-0 left-0 right-0 bg-white shadow-lg p-2 border-t border-gray-200">
        <div id="navbar-container" class="flex items-center space-x-2 overflow-x-auto whitespace-nowrap custom-scrollbar pb-2"></div>
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

        function mainApp() {
            const state = {
                questions: [],
                userAnswers: [],
                currentIndex: 0,
            };

            const quizView = document.getElementById('quiz-view');
            const resultView = document.getElementById('result-view');
            const questionHeader = document.getElementById('question-header');
            const questionCounter = document.getElementById('question-counter');
            const questionBody = document.getElementById('question-body');
            const answerArea = document.getElementById('answer-area');
            const prevBtn = document.getElementById('prev-btn');
            const nextBtn = document.getElementById('next-btn');
            const finishBtn = document.getElementById('finish-btn');
            const restartBtn = document.getElementById('restart-btn');
            const scoreText = document.getElementById('score-text');
            const navbarContainer = document.getElementById('navbar-container');

            const questionBankData = {questions_json};

            function init() {
                state.questions = questionBankData;
                state.userAnswers = new Array(state.questions.length).fill(null);
                renderQuestion();
                renderNavbar();
                prevBtn.addEventListener('click', showPrev);
                nextBtn.addEventListener('click', showNext);
                finishBtn.addEventListener('click', showResults);
                restartBtn.addEventListener('click', restartQuiz);
            }

            function renderQuestion() {
                if (state.questions.length === 0) {
                    questionBody.innerHTML = '<p>题库加载失败或为空。</p>';
                    return;
                }
                const question = state.questions[state.currentIndex];
                questionHeader.textContent = question.category || '综合';
                questionCounter.textContent = `第 ${state.currentIndex + 1} / ${state.questions.length} 题`;
                questionBody.innerHTML = question.question.replace(/\\n/g, '<br>');
                answerArea.innerHTML = '';
                renderProblemSolving(question);
                prevBtn.disabled = state.currentIndex === 0;
                nextBtn.disabled = state.currentIndex === state.questions.length - 1;
                if (window.MathJax) {
                    MathJax.typesetPromise([questionBody, answerArea]);
                }
            }

            function renderProblemSolving(question) {
                const container = document.createElement('div');
                container.className = 'space-y-2';
                const input = document.createElement('textarea');
                input.id = 'problem-solving-input';
                input.className = 'w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400';
                input.placeholder = '请输入最终答案（多问用分号 ; 隔开）...';
                input.rows = 3;
                const submitBtn = document.createElement('button');
                submitBtn.textContent = '提交答案';
                submitBtn.className = 'bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition-colors';
                submitBtn.onclick = () => handleSubmitProblemSolving();
                container.appendChild(input);
                container.appendChild(submitBtn);
                answerArea.appendChild(container);
                input.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmitProblemSolving(); } });
                if (state.userAnswers[state.currentIndex] !== null) {
                    restoreAnswerState();
                }
            }

            function handleSubmitProblemSolving() {
                if (state.userAnswers[state.currentIndex] !== null) return;
                const question = state.questions[state.currentIndex];
                const input = document.getElementById('problem-solving-input');
                const userAnswer = input.value.trim();
                if (userAnswer === '') return;
                const isCorrect = normalizeAnswer(userAnswer) === normalizeAnswer(question.answer);
                state.userAnswers[state.currentIndex] = { selected: userAnswer, isCorrect: isCorrect };
                updateNavbar();
                applyAnswerStyles();
            }

            function restoreAnswerState() {
                applyAnswerStyles();
            }

            function applyAnswerStyles() {
                const answerData = state.userAnswers[state.currentIndex];
                if (answerData === null) return;
                const question = state.questions[state.currentIndex];
                const input = document.getElementById('problem-solving-input');
                const submitBtn = input.nextElementSibling;
                input.value = answerData.selected;
                input.disabled = true;
                submitBtn.disabled = true;
                const oldFeedback = answerArea.querySelector('.feedback-block');
                if (oldFeedback) oldFeedback.remove();
                const feedbackBlock = document.createElement('div');
                feedbackBlock.className = 'mt-3 p-3 rounded-lg feedback-block';
                if (answerData.isCorrect) {
                    input.className = 'w-full p-2 border-2 border-green-500 bg-green-100 rounded-lg';
                    feedbackBlock.classList.add('bg-green-50', 'text-green-800', 'border', 'border-green-200');
                    feedbackBlock.innerHTML = '<strong>回答正确！</strong>';
                } else {
                    input.className = 'w-full p-2 border-2 border-red-500 bg-red-100 rounded-lg';
                    feedbackBlock.classList.add('bg-red-50', 'text-red-800', 'border', 'border-red-200');
                    feedbackBlock.innerHTML = '<p><strong>正确答案：</strong>' + question.answer + '</p>';
                    if (question.solution) {
                        feedbackBlock.innerHTML += '<p class="mt-2"><strong>思路提示：</strong>' + question.solution + '</p>';
                    }
                }
                answerArea.appendChild(feedbackBlock);
                if (window.MathJax) MathJax.typesetPromise([feedbackBlock]);
            }

            function renderNavbar() {
                navbarContainer.innerHTML = '';
                state.questions.forEach((_, index) => {
                    const button = document.createElement('button');
                    button.textContent = index + 1;
                    button.className = 'w-10 h-10 flex-shrink-0 rounded-md font-mono transition-colors focus:outline-none';
                    updateButtonStatus(button, index);
                    button.onclick = () => goToQuestion(index);
                    navbarContainer.appendChild(button);
                });
            }

            function updateNavbar() {
                const buttons = navbarContainer.querySelectorAll('button');
                buttons.forEach((button, index) => updateButtonStatus(button, index));
            }

            function updateButtonStatus(button, index) {
                const answer = state.userAnswers[index];
                let baseStyle = 'border ';
                if (index === state.currentIndex) {
                    baseStyle += 'bg-blue-500 text-white border-blue-500';
                } else if (answer === null) {
                    baseStyle += 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100';
                } else if (answer.isCorrect) {
                    baseStyle += 'bg-green-200 text-green-800 border-green-300';
                } else {
                    baseStyle += 'bg-red-200 text-red-800 border-red-300';
                }
                button.className = `w-10 h-10 flex-shrink-0 rounded-md font-mono transition-colors focus:outline-none ${baseStyle}`;
            }

            function goToQuestion(index) {
                if (index >= 0 && index < state.questions.length) {
                    state.currentIndex = index;
                    renderQuestion();
                    updateNavbar();
                    const currentBtn = navbarContainer.children[index];
                    if (currentBtn) {
                        currentBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
                    }
                }
            }

            function showNext() { goToQuestion(state.currentIndex + 1); }
            function showPrev() { goToQuestion(state.currentIndex - 1); }

            function showResults() {
                const correctAnswers = state.userAnswers.filter(a => a && a.isCorrect).length;
                const totalQuestions = state.questions.length;
                const percentage = totalQuestions > 0 ? ((correctAnswers / totalQuestions) * 100).toFixed(1) : 0;
                scoreText.textContent = `答对题数 ${correctAnswers} / ${totalQuestions} (正确率 ${percentage}%)`;
                quizView.classList.add('hidden');
                resultView.classList.remove('hidden');
            }

            function restartQuiz() {
                state.currentIndex = 0;
                state.userAnswers.fill(null);
                resultView.classList.add('hidden');
                quizView.classList.remove('hidden');
                renderQuestion();
                updateNavbar();
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


def build_fillin():
    questions = []
    for filename, category in FILLIN_JSONS:
        questions.extend(load_and_tag(JSON_DIR / filename, category))
    html = FILLIN_TEMPLATE.replace("{questions_json}", json.dumps(questions, ensure_ascii=False))
    (ROOT / "index（填空题）.html").write_text(html, encoding="utf-8")
    return len(questions)


def build_calc():
    questions = []
    for filename, category in CALC_JSONS:
        questions.extend(load_and_tag(JSON_DIR / filename, category))
    html = CALC_TEMPLATE.replace("{questions_json}", json.dumps(questions, ensure_ascii=False))
    (ROOT / "index（解答题）.html").write_text(html, encoding="utf-8")
    return len(questions)


if __name__ == "__main__":
    fillin_count = build_fillin()
    calc_count = build_calc()
    print(f"Wrote index（填空题）.html with {fillin_count} questions")
    print(f"Wrote index（解答题）.html with {calc_count} questions")
