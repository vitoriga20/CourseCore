import {
  WRONG_REASONS,
  isCompleteReasonSelection,
  normaliseReasons,
} from '../../services/wrong-reasons.js';

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export function mountWrongReasonSummary(container, wrongQuestions, onComplete) {
  const previous = container.querySelector('[data-wrong-reason-summary]');
  if (previous) previous.remove();

  const root = document.createElement('section');
  root.dataset.wrongReasonSummary = '';
  root.className = 'wrong-reason-summary card mt-4';
  root.style.cssText = 'background: var(--practice-card); border-color: var(--practice-border); padding: 1rem;';
  container.appendChild(root);

  const selections = Object.fromEntries(wrongQuestions.map((question) => [question.id, []]));
  let saving = false;
  let errorMessage = '';

  function render() {
    const questionIds = wrongQuestions.map((question) => question.id);
    const complete = isCompleteReasonSelection(questionIds, selections);

    root.innerHTML = `
      <div class="mb-4">
        <h3 class="text-lg font-bold" style="color: var(--practice-text);">标记错题薄弱点</h3>
        <p class="text-xs mt-1" style="color: var(--practice-muted);">可多选，完成后将据此生成今日复习计划。</p>
      </div>
      <div class="grid gap-3">
        ${wrongQuestions.map((question, questionIndex) => `
          <article class="rounded-lg" style="border: 1px solid var(--practice-border); padding: 0.75rem;">
            <p class="text-sm font-semibold mb-2" style="color: var(--practice-text);">
              ${questionIndex + 1}. ${escapeHtml(question.title || question.content || '错题')}
            </p>
            <div class="flex flex-wrap gap-2">
              ${WRONG_REASONS.map((reason, reasonIndex) => {
                const selected = selections[question.id].includes(reason);
                return `
                  <button type="button"
                    class="wrong-reason-chip btn-pill text-xs${selected ? ' is-selected' : ''}"
                    data-wrong-question-index="${questionIndex}"
                    data-wrong-reason-index="${reasonIndex}"
                    aria-pressed="${selected}"
                    style="padding: 0.35rem 0.7rem; border: 1px solid ${selected ? 'var(--practice-accent)' : 'var(--practice-border)'}; color: ${selected ? 'var(--practice-accent)' : 'var(--practice-text)'};">
                    ${escapeHtml(reason)}
                  </button>
                `;
              }).join('')}
            </div>
          </article>
        `).join('')}
      </div>
      <p class="text-xs mt-3" role="status" style="color: var(--danger, #b42318);" ${complete ? 'hidden' : ''}>
        请为每道错题至少选择一个薄弱点
      </p>
      ${errorMessage ? `<p class="text-xs mt-2" role="alert" style="color: var(--danger, #b42318);">${escapeHtml(errorMessage)}</p>` : ''}
      <button type="button" class="quiz-btn quiz-btn-primary mt-4" data-submit-wrong-reasons
        ${!complete || saving ? 'disabled' : ''}>
        ${saving ? '保存中…' : '完成总结并生成复习计划'}
      </button>
    `;
  }

  root.addEventListener('click', async (event) => {
    const chip = event.target.closest('[data-wrong-reason-index]');
    if (chip && !saving) {
      const question = wrongQuestions[Number(chip.dataset.wrongQuestionIndex)];
      const reason = WRONG_REASONS[Number(chip.dataset.wrongReasonIndex)];
      if (!question || !reason) return;
      const current = selections[question.id];
      selections[question.id] = current.includes(reason)
        ? current.filter((value) => value !== reason)
        : normaliseReasons([...current, reason]);
      errorMessage = '';
      render();
      return;
    }

    const submit = event.target.closest('[data-submit-wrong-reasons]');
    if (!submit || saving) return;
    const questionIds = wrongQuestions.map((question) => question.id);
    if (!isCompleteReasonSelection(questionIds, selections)) return;

    saving = true;
    errorMessage = '';
    render();
    try {
      await onComplete(Object.fromEntries(
        Object.entries(selections).map(([questionId, reasons]) => [questionId, [...reasons]]),
      ));
      root.innerHTML = `
        <p class="text-sm font-semibold" role="status" style="color: var(--practice-accent);">
          总结已保存，错题已加入今日复习
        </p>
      `;
    } catch (error) {
      saving = false;
      errorMessage = '保存失败，请重试。你的选择已保留。';
      render();
    }
  });

  render();
  return root;
}
