// Screen 11: 添加我的试卷（底部 Slider 三栏弹窗）
// 左栏：按试卷/按题型 tab + 目录
// 中栏：题目卡片网格，点击选中
// 右栏：综合测验实时预览（缩略版）
// 底部：已选题目列表 + 上移/下移排序 + 命名保存

import { getExamPapers, getSubjects, getQuestionsByType } from '../../services/practice-data.js';
import { supabase } from '../../services/supabase.js';
import { state } from '../../state.js';

const TYPE_NAMES = { 0: '单选', 1: '多选', 2: '填空', 3: '解答', 4: '证明', 5: '判断' };

export function renderAddMyPaper() {
  _initAddPaper();
  return `
    <div id="add-paper-slider" style="position: fixed; inset: 0; z-index: 50; background: rgba(0,0,0,0.5); display: flex; align-items: flex-end; justify-content: center;">
      <div style="background: var(--practice-bg); width: 100%; max-width: 1400px; height: 90vh; border-radius: 1rem 1rem 0 0; padding: 1.5rem; display: flex; flex-direction: column;">
        <!-- 顶部 bar -->
        <div class="flex items-center justify-between mb-4 pb-3 border-b" style="border-color: var(--practice-border);">
          <div class="flex items-center gap-3">
            <h2 class="text-xl font-extrabold" style="color: var(--practice-text);">添加我的试卷</h2>
            <span class="px-3 py-1 rounded-lg text-sm font-semibold" style="background: var(--practice-card); color: var(--practice-muted);">
              已选 <span id="ap-count" style="color: var(--practice-accent); font-weight: 700;">0</span> 题
            </span>
          </div>
          <div class="flex items-center gap-2">
            <input id="ap-name" type="text" placeholder="试卷名称（必填）" class="px-3 py-2 rounded-lg text-sm" style="background: var(--practice-card); border: 1px solid var(--practice-border); color: var(--practice-text);" />
            <button id="ap-save" class="btn-pill text-sm font-semibold" style="background: var(--practice-accent); color: #fff; padding: 0.5rem 1.25rem;">创建试卷</button>
            <a href="/practice" class="btn-pill text-sm font-semibold" style="border: 1px solid var(--practice-border); color: var(--practice-text); padding: 0.5rem 1.25rem;">取消</a>
          </div>
        </div>

        <!-- 三栏 -->
        <div class="grid grid-cols-[200px_1fr_360px] gap-3 flex-1 min-h-0">
          <!-- 左：来源 -->
          <div class="card overflow-y-auto" style="background: var(--practice-card); border-color: var(--practice-border); padding: 0.75rem;">
            <div class="flex gap-1 mb-2">
              <span class="ap-mode flex-1 text-center px-2 py-1 rounded text-xs font-semibold cursor-pointer" data-mode="exam" style="background: var(--practice-accent); color: #fff;">按试卷</span>
              <span class="ap-mode flex-1 text-center px-2 py-1 rounded text-xs font-semibold cursor-pointer" data-mode="type" style="background: var(--practice-card-hover); color: var(--practice-muted); border: 1px solid var(--practice-border);">按题型</span>
            </div>
            <div id="ap-source-list" class="space-y-1 text-xs"></div>
          </div>

          <!-- 中：题目卡片 -->
          <div class="card overflow-y-auto" style="background: var(--practice-card); border-color: var(--practice-border); padding: 1rem;">
            <div id="ap-question-area">
              <div class="text-center py-8" style="color: var(--practice-muted);">请从左侧选择来源</div>
            </div>
          </div>

          <!-- 右：预览 -->
          <div class="card overflow-y-auto" style="background: var(--practice-card); border-color: var(--practice-border); padding: 1rem;">
            <h3 class="text-sm font-bold mb-3" style="color: var(--practice-text);">综合测验预览</h3>
            <div id="ap-preview" class="text-sm">
              <div class="text-center py-8" style="color: var(--practice-muted);">已选题目后预览</div>
            </div>
          </div>
        </div>

        <!-- 底部：已选列表 -->
        <div class="mt-3 pt-3 border-t" style="border-color: var(--practice-border);">
          <div class="flex items-center justify-between mb-2">
            <h3 class="text-sm font-bold" style="color: var(--practice-text);">已选题目（按顺序）</h3>
            <span class="text-xs" style="color: var(--practice-muted);">点击题目卡片选中</span>
          </div>
          <div id="ap-selected" class="flex gap-2 overflow-x-auto pb-2" style="min-height: 60px;">
            <div class="text-xs py-3" style="color: var(--practice-muted);">暂无选中题目</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

let _apState = { mode: 'exam', source: null, papers: [], questions: [], selected: [] };

async function _initAddPaper() {
  // 加载题库数据
  const papers = await getExamPapers();
  _apState.papers = papers;
  _renderSourceList();

  // mode 切换
  document.querySelectorAll('.ap-mode').forEach(el => {
    el.onclick = () => {
      _apState.mode = el.dataset.mode;
      _apState.source = null;
      document.querySelectorAll('.ap-mode').forEach(e => {
        e.style.background = 'var(--practice-card-hover)';
        e.style.color = 'var(--practice-muted)';
        e.style.border = '1px solid var(--practice-border)';
      });
      el.style.background = 'var(--practice-accent)';
      el.style.color = '#fff';
      el.style.border = 'none';
      _renderSourceList();
      _renderQuestionArea();
    };
  });

  // 创建试卷
  document.getElementById('ap-save').onclick = _savePaper;
}

function _renderSourceList() {
  const el = document.getElementById('ap-source-list');
  if (!el) return;
  if (_apState.mode === 'exam') {
    // 按试卷：按学科分组
    const grouped = {};
    for (const p of _apState.papers) {
      const s = p.subject || '其他';
      if (!grouped[s]) grouped[s] = [];
      grouped[s].push(p);
    }
    el.innerHTML = Object.entries(grouped).map(([subject, list]) => `
      <div>
        <div class="font-semibold mb-1 px-1" style="color: var(--practice-text);">${subject}</div>
        ${list.map(p => `
          <div class="ap-source-item px-2 py-1 rounded cursor-pointer text-xs" data-source-id="${p.id}" style="background: var(--practice-card-hover); color: var(--practice-text);">
            ${p.term || ''}
          </div>
        `).join('')}
      </div>
    `).join('');
  } else {
    // 按题型：学科 → 题型
    const subjects = [...new Set(_apState.papers.map(p => p.subject).filter(Boolean))];
    el.innerHTML = subjects.map(s => `
      <div>
        <div class="font-semibold mb-1 px-1" style="color: var(--practice-text);">${s}</div>
        ${Object.entries(TYPE_NAMES).map(([t, name]) => `
          <div class="ap-source-item px-2 py-1 rounded cursor-pointer text-xs" data-source-id="${s}|${t}" style="background: var(--practice-card-hover); color: var(--practice-text);">
            ${name}
          </div>
        `).join('')}
      </div>
    `).join('');
  }

  // 绑定点击
  el.querySelectorAll('.ap-source-item').forEach(item => {
    item.onclick = () => {
      el.querySelectorAll('.ap-source-item').forEach(i => {
        i.style.background = 'var(--practice-card-hover)';
        i.style.color = 'var(--practice-text)';
      });
      item.style.background = 'var(--practice-accent)';
      item.style.color = '#fff';
      _apState.source = item.dataset.sourceId;
      _renderQuestionArea();
    };
  });
}

async function _renderQuestionArea() {
  const el = document.getElementById('ap-question-area');
  if (!el || !_apState.source) {
    el.innerHTML = '<div class="text-center py-8" style="color: var(--practice-muted);">请从左侧选择来源</div>';
    return;
  }

  if (_apState.mode === 'exam') {
    const paper = _apState.papers.find(p => p.id === _apState.source);
    if (!paper) return;
    _apState.questions = (paper.sections || []).flatMap(s => s.questions || []);
  } else {
    const [subject, typeStr] = _apState.source.split('|');
    _apState.questions = await getQuestionsByType(subject, Number(typeStr));
  }

  // 渲染题目卡片网格
  const TYPE_COLORS = {
    0: 'rgba(22, 163, 74, 0.15); color: var(--practice-accent);',
    1: 'rgba(45, 210, 136, 0.15); color: var(--practice-accent-2);',
    2: 'rgba(124, 58, 237, 0.15); color: #7C3AED;',
    3: 'rgba(59, 130, 246, 0.15); color: #3B82F6;',
    4: 'rgba(251, 191, 36, 0.15); color: #FBBF24;',
    5: 'rgba(239, 83, 80, 0.15); color: #EF5350;',
  };
  el.innerHTML = `
    <div class="text-sm font-semibold mb-3" style="color: var(--practice-text);">题目列表（点击选中）</div>
    <div class="grid grid-cols-2 gap-2">
      ${_apState.questions.map(q => {
        const selected = _apState.selected.some(s => s.id === q.id);
        const typeName = TYPE_NAMES[q.questionType] || '题型';
        const typeColor = TYPE_COLORS[q.questionType] || '';
        return `
          <div class="ap-question-card p-3 rounded-lg cursor-pointer" data-q-id="${q.id}" style="background: ${selected ? 'rgba(22, 163, 74, 0.1)' : 'var(--practice-bg)'}; border: 2px solid ${selected ? 'var(--practice-accent)' : 'var(--practice-border)'}; padding: 0.75rem;">
            <div class="flex items-center gap-2 mb-1">
              <span class="text-xs px-1.5 py-0.5 rounded font-semibold" style="${typeColor}">${typeName}</span>
            </div>
            <div class="text-xs" style="color: var(--practice-text); line-height: 1.4;">${(q.title || q.content || '').slice(0, 80).replace(/<[^>]+>/g, '')}</div>
          </div>
        `;
      }).join('')}
    </div>
  `;

  el.querySelectorAll('.ap-question-card').forEach(card => {
    card.onclick = () => _toggleSelect(card.dataset.qId);
  });
}

function _toggleSelect(qId) {
  const q = _apState.questions.find(x => x.id === qId);
  if (!q) return;
  const idx = _apState.selected.findIndex(s => s.id === qId);
  if (idx >= 0) {
    _apState.selected.splice(idx, 1);
  } else {
    _apState.selected.push({ id: q.id, type: q.questionType, title: (q.title || q.content || '').slice(0, 50) });
  }
  _renderQuestionArea(); // 重渲染卡片（更新选中态）
  _renderSelected();
  _renderPreview();
}

function _renderSelected() {
  const el = document.getElementById('ap-selected');
  if (!el) return;
  const countEl = document.getElementById('ap-count');
  if (countEl) countEl.textContent = String(_apState.selected.length);

  if (_apState.selected.length === 0) {
    el.innerHTML = '<div class="text-xs py-3" style="color: var(--practice-muted);">暂无选中题目</div>';
    return;
  }
  const TYPE_COLORS = {
    0: 'rgba(22, 163, 74, 0.15); color: var(--practice-accent);',
    1: 'rgba(45, 210, 136, 0.15); color: var(--practice-accent-2);',
    2: 'rgba(124, 58, 237, 0.15); color: #7C3AED;',
    3: 'rgba(59, 130, 246, 0.15); color: #3B82F6;',
    4: 'rgba(251, 191, 36, 0.15); color: #FBBF24;',
    5: 'rgba(239, 83, 80, 0.15); color: #EF5350;',
  };
  el.innerHTML = _apState.selected.map((s, i) => {
    const typeColor = TYPE_COLORS[s.type] || '';
    const typeName = TYPE_NAMES[s.type] || '?';
    return `
      <div class="flex items-center gap-2 px-3 py-2 rounded shrink-0" style="background: var(--practice-card); border: 1px solid var(--practice-accent); min-width: 200px;">
        <span class="font-bold text-xs" style="color: var(--practice-accent);">${i + 1}</span>
        <span class="text-xs px-1.5 py-0.5 rounded font-semibold" style="${typeColor}">${typeName}</span>
        <span class="text-xs flex-1 truncate" style="color: var(--practice-text);">${s.title || '...'}</span>
        <button class="ap-up text-xs px-1" data-idx="${i}" ${i === 0 ? 'disabled' : ''} style="color: var(--practice-muted);">↑</button>
        <button class="ap-down text-xs px-1" data-idx="${i}" ${i === _apState.selected.length - 1 ? 'disabled' : ''} style="color: var(--practice-muted);">↓</button>
        <button class="ap-remove text-xs px-1" data-idx="${i}" style="color: #EF5350;">✕</button>
      </div>
    `;
  }).join('');

  el.querySelectorAll('.ap-up').forEach(b => b.onclick = (e) => { e.stopPropagation(); _moveItem(Number(b.dataset.idx), -1); });
  el.querySelectorAll('.ap-down').forEach(b => b.onclick = (e) => { e.stopPropagation(); _moveItem(Number(b.dataset.idx), 1); });
  el.querySelectorAll('.ap-remove').forEach(b => b.onclick = (e) => { e.stopPropagation(); _apState.selected.splice(Number(b.dataset.idx), 1); _renderSelected(); _renderPreview(); _renderQuestionArea(); });
}

function _moveItem(idx, delta) {
  const newIdx = idx + delta;
  if (newIdx < 0 || newIdx >= _apState.selected.length) return;
  const [item] = _apState.selected.splice(idx, 1);
  _apState.selected.splice(newIdx, 0, item);
  _renderSelected();
}

function _renderPreview() {
  const el = document.getElementById('ap-preview');
  if (!el) return;
  if (_apState.selected.length === 0) {
    el.innerHTML = '<div class="text-center py-8" style="color: var(--practice-muted);">已选题目后预览</div>';
    return;
  }
  const q = _apState.selected[0];
  const fullQ = _apState.questions.find(x => x.id === q.id) || q;
  el.innerHTML = `
    <div class="text-xs px-2 py-1 rounded inline-block mb-2" style="background: rgba(22,163,74,0.15); color: var(--practice-accent);">[顺序] 我的试卷</div>
    <div class="font-semibold mb-2" style="color: var(--practice-text);">第 1/${_apState.selected.length} 题</div>
    <div class="text-sm mb-3" style="color: var(--practice-text); line-height: 1.5;">${(fullQ.title || fullQ.content || '').slice(0, 200).replace(/<[^>]+>/g, '')}</div>
    ${fullQ.options && fullQ.options.length > 0 ? `
      <div class="space-y-1">
        ${fullQ.options.map((opt, i) => {
          const letter = String.fromCharCode(65 + i);
          return `<div class="px-3 py-1.5 rounded text-xs" style="background: ${i === 0 ? 'var(--practice-accent)' : 'var(--practice-bg)'}; color: ${i === 0 ? '#fff' : 'var(--practice-text)'}; border: 1px solid ${i === 0 ? 'var(--practice-accent)' : 'var(--practice-border)'};">${letter}. ${(opt.label || opt).slice(0, 30)}</div>`;
        }).join('')}
      </div>
    ` : ''}
    <div class="flex gap-1 mt-3 flex-wrap">
      ${_apState.selected.map((_, i) => `<span class="w-6 h-6 flex items-center justify-center rounded text-xs font-bold" style="background: ${i === 0 ? 'var(--practice-accent)' : 'var(--practice-card-hover)'}; color: ${i === 0 ? '#fff' : 'var(--practice-muted)'};">${i + 1}</span>`).join('')}
    </div>
  `;
}

async function _savePaper() {
  const name = document.getElementById('ap-name')?.value?.trim();
  if (!name) {
    alert('请输入试卷名称');
    return;
  }
  if (_apState.selected.length === 0) {
    alert('请至少选择一道题');
    return;
  }
  const userId = state.user?.id;
  if (!userId) {
    alert('请先登录');
    return;
  }
  if (!supabase) return;

  const { data, error } = await supabase.from('my_papers').insert({
    user_id: userId,
    name,
    question_ids: _apState.selected.map(s => s.id),
  }).select().single();

  if (error) {
    alert('保存失败: ' + error.message);
    return;
  }
  // 保存后跳转刷题中心，我的试卷分组（简化：跳到按试卷）
  window.location.href = '/practice/exams';
}