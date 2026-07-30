// 管理后台页面：左侧分组折叠侧边栏 + 深色主题。
// 内容管理：课程 / 模块小节 / 平台题库 / 理论编辑器 / 训练编辑器 / 测试编辑器 / 期末试卷
// 系统管理：用户 / 设置
// 表格 CRUD 沿用 modal 表单；理论/训练/测试编辑器为内置双栏/三栏布局，实时预览。
// 所有用户输入经 escapeHtml 转义后输出；事件通过 main.js 的 [data-action] 委托分发到 handleAdminAction。

import { isAdmin } from '../../services/auth.js';
import { escapeHtml } from '../../utils.js';
import { marked } from 'marked';
import EasyMDE from 'easymde';
import 'easymde/dist/easymde.min.css';
import Split from 'split.js';
import Sortable from 'sortablejs';
import * as adminApi from '../../services/admin.js';

// ─── Admin state ───
const adminState = {
  section: 'courses',
  collapsedGroups: {}, // { groupId: true }
  data: {
    users: [],
    courses: [],
    modules: [],
    items: [],
    theoryContents: [],
    questions: [],
    examPapers: [],
    examSections: [],
    examQuestions: []
  },
  editing: null, // { entity, row, isNew } — modal 表单
  theoryEditor: null, // { itemId, title, course_id, module_id, content, examples, collapsed }
  practiceEditor: null, // { itemId, itemType, title, questions, selectedIndex }
  loading: false,
  feedback: null, // { type: 'success'|'error', message }
  previewListenerAttached: false,
  editorInstances: { easyMDEs: [], splits: [], sortable: null }
};

// ─── Sidebar config ───
const SIDEBAR_GROUPS = [
  {
    id: 'content',
    label: '内容管理',
    items: [
      { id: 'courses', label: '课程' },
      { id: 'modules', label: '模块 / 小节' },
      { id: 'questions', label: '平台题库' },
      { id: 'theory-editor', label: '理论编辑器' },
      { id: 'training-editor', label: '训练编辑器' },
      { id: 'test-editor', label: '测试编辑器' },
      { id: 'exams', label: '期末试卷' }
    ]
  },
  {
    id: 'system',
    label: '系统管理',
    items: [
      { id: 'users', label: '用户' },
      { id: 'settings', label: '设置' }
    ]
  }
];

const SECTION_TITLES = {
  courses: '课程管理',
  modules: '模块 / 小节',
  questions: '平台题库',
  'theory-editor': '理论编辑器',
  'training-editor': '训练编辑器',
  'test-editor': '测试编辑器',
  exams: '期末试卷',
  users: '用户管理',
  settings: '设置'
};

const SECTION_ENTITIES = {
  courses: ['course'],
  modules: ['module', 'item'],
  questions: ['question'],
  exams: ['exam_paper', 'exam_section', 'exam_question'],
  users: ['user']
};

const PRACTICE_TYPES = [
  { value: 0, label: '单选题' },
  { value: 1, label: '多选题' },
  { value: 2, label: '填空题' },
  { value: 4, label: '解答题' }
];

const ENTITY_LABELS = {
  user: '用户',
  course: '课程',
  module: '模块',
  item: '小节',
  question: '题目',
  exam_paper: '试卷',
  exam_section: '大题',
  exam_question: '试卷题目'
};

// ─── Entity field definitions ───
// readOnly: 始终不可编辑（系统字段）
// immutable: 编辑时禁用（主键），新增时可填
// json: textarea 编辑 JSON 字符串，提交时解析
const ENTITY_FIELDS = {
  user: [
    { name: 'id', label: 'ID', type: 'text', readOnly: true },
    { name: 'email', label: '邮箱', type: 'text', readOnly: true },
    { name: 'role', label: '角色', type: 'select', options: ['free', 'paid', 'admin'] },
    { name: 'display_name', label: '昵称', type: 'text' },
    { name: 'avatar_url', label: '头像 URL', type: 'text' }
  ],
  course: [
    { name: 'id', label: 'ID', type: 'text', immutable: true },
    { name: 'title', label: '标题', type: 'text' },
    { name: 'description', label: '描述', type: 'textarea' },
    { name: 'requirements', label: '要求 (JSON 数组)', type: 'textarea', json: true }
  ],
  module: [
    { name: 'course_id', label: '课程 ID', type: 'text', immutable: true },
    { name: 'module_id', label: '模块 ID', type: 'text', immutable: true },
    { name: 'title', label: '标题', type: 'text' },
    { name: 'order_index', label: '顺序', type: 'number' }
  ],
  item: [
    { name: 'id', label: 'ID', type: 'text', immutable: true },
    { name: 'course_id', label: '课程 ID', type: 'text' },
    { name: 'module_id', label: '模块 ID', type: 'text' },
    { name: 'title', label: '标题', type: 'text' },
    { name: 'type', label: '类型', type: 'select', options: ['theory', 'practice', 'quiz', 'training', 'project', 'review'] },
    { name: 'order_index', label: '顺序', type: 'number' },
    { name: 'content', label: '内容', type: 'textarea' },
    { name: 'examples', label: '例题 ID (JSON)', type: 'textarea', json: true }
  ],
  question: [
    { name: 'id', label: 'ID', type: 'text', immutable: true },
    { name: 'item_id', label: '小节 ID', type: 'text' },
    { name: 'course_id', label: '课程 ID', type: 'text' },
    { name: 'module_id', label: '模块 ID', type: 'text' },
    { name: 'question_type', label: '题型', type: 'number' },
    { name: 'title', label: '标题', type: 'text' },
    { name: 'content', label: '题干', type: 'textarea' },
    { name: 'options', label: '选项 (JSON)', type: 'textarea', json: true },
    { name: 'answer', label: '答案', type: 'text' },
    { name: 'answers', label: '多答案 (JSON)', type: 'textarea', json: true },
    { name: 'blanks', label: '空数', type: 'number' },
    { name: 'tolerance', label: '容差', type: 'text' },
    { name: 'unit', label: '单位', type: 'text' },
    { name: 'solution', label: '解答', type: 'textarea' },
    { name: 'hint', label: '提示', type: 'textarea' },
    { name: 'test_string', label: '测试用例', type: 'textarea' },
    { name: 'image', label: '图片', type: 'text' },
    { name: 'difficulty', label: '难度', type: 'number' },
    { name: 'tags', label: '标签 (JSON)', type: 'textarea', json: true },
    { name: 'source', label: '来源', type: 'text' }
  ],
  exam_paper: [
    { name: 'id', label: 'ID', type: 'text', immutable: true },
    { name: 'school', label: '学校', type: 'text' },
    { name: 'college', label: '学院', type: 'text' },
    { name: 'subject', label: '科目', type: 'text' },
    { name: 'term', label: '学期', type: 'text' },
    { name: 'duration', label: '时长', type: 'text' }
  ],
  exam_section: [
    { name: 'id', label: 'ID', type: 'text', immutable: true },
    { name: 'exam_id', label: '试卷 ID', type: 'text' },
    { name: 'title', label: '标题', type: 'text' },
    { name: 'order_index', label: '顺序', type: 'number' }
  ],
  exam_question: [
    { name: 'id', label: 'ID', type: 'text', immutable: true },
    { name: 'exam_id', label: '试卷 ID', type: 'text' },
    { name: 'section_id', label: '大题 ID', type: 'text' },
    { name: 'question_type', label: '题型', type: 'number' },
    { name: 'title', label: '标题', type: 'text' },
    { name: 'content', label: '题干', type: 'textarea' },
    { name: 'options', label: '选项 (JSON)', type: 'textarea', json: true },
    { name: 'answer', label: '答案', type: 'text' },
    { name: 'answers', label: '多答案 (JSON)', type: 'textarea', json: true },
    { name: 'solution', label: '解答', type: 'textarea' },
    { name: 'hint', label: '提示', type: 'textarea' },
    { name: 'difficulty', label: '难度', type: 'number' },
    { name: 'tags', label: '标签 (JSON)', type: 'textarea', json: true },
    { name: 'source', label: '来源', type: 'text' },
    { name: 'order_index', label: '顺序', type: 'number' }
  ]
};

const ENTITY_COLUMNS = {
  user: ['id', 'email', 'role', 'display_name'],
  course: ['id', 'title', 'description'],
  module: ['course_id', 'module_id', 'title', 'order_index'],
  item: ['id', 'course_id', 'module_id', 'title', 'type', 'order_index'],
  question: ['id', 'item_id', 'question_type', 'title', 'difficulty'],
  exam_paper: ['id', 'school', 'subject', 'term'],
  exam_section: ['id', 'exam_id', 'title', 'order_index'],
  exam_question: ['id', 'section_id', 'question_type', 'title', 'order_index']
};

// ─── Helpers ───
function dataKeyFor(entity) {
  if (entity === 'exam_paper') return 'examPapers';
  if (entity === 'exam_section') return 'examSections';
  if (entity === 'exam_question') return 'examQuestions';
  if (entity === 'theory_content') return 'theoryContents';
  return entity + 's';
}

function renderCell(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') return escapeHtml(JSON.stringify(value));
  return escapeHtml(String(value));
}

function encodeId(entity, row) {
  if (entity === 'module') return `${row.course_id}|${row.module_id}`;
  return row.id;
}

function parseModuleId(encoded) {
  const sep = encoded.indexOf('|');
  if (sep === -1) return { course_id: encoded, module_id: '' };
  return { course_id: encoded.slice(0, sep), module_id: encoded.slice(sep + 1) };
}

function findRow(entity, encodedId) {
  const rows = adminState.data[dataKeyFor(entity)] || [];
  if (entity === 'module') {
    const { course_id, module_id } = parseModuleId(encodedId);
    return rows.find(r => r.course_id === course_id && r.module_id === module_id);
  }
  return rows.find(r => String(r.id) === String(encodedId));
}

function jsonFieldToString(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  return JSON.stringify(value, null, 2);
}

function parseJsonField(str) {
  if (!str || !str.trim()) return [];
  try {
    return JSON.parse(str);
  } catch (e) {
    throw new Error(`JSON 解析失败: ${e.message}`);
  }
}

function renderMd(md) {
  if (!md) return '';
  try {
    const out = marked.parse(md);
    return typeof out === 'string' ? out : '';
  } catch (e) {
    return escapeHtml(String(md));
  }
}

function typeset(el) {
  if (window.MathJax && window.MathJax.typesetPromise && el) {
    window.MathJax.typesetPromise([el]).catch(() => {});
  }
}

function questionTypeLabel(t) {
  const found = PRACTICE_TYPES.find(p => p.value === Number(t));
  return found ? found.label : '其他';
}

// ─── Render: sidebar ───
function renderSidebar() {
  return `
    <aside class="admin-sidebar">
      <div class="admin-sidebar-header">
        <span class="admin-sidebar-logo">CourseCore</span>
        <span class="admin-sidebar-sub">管理后台</span>
      </div>
      <nav class="admin-sidebar-nav">
        ${SIDEBAR_GROUPS.map(renderSidebarGroup).join('')}
      </nav>
    </aside>
  `;
}

function renderSidebarGroup(group) {
  const collapsed = !!adminState.collapsedGroups[group.id];
  return `
    <div class="admin-sidebar-group ${collapsed ? 'collapsed' : ''}">
      <div class="admin-sidebar-group-header" data-action="admin-toggle-group" data-group="${escapeHtml(group.id)}">
        <span>${escapeHtml(group.label)}</span>
        <span class="admin-sidebar-arrow">${collapsed ? '+' : '−'}</span>
      </div>
      ${collapsed ? '' : `
        <div class="admin-sidebar-items">
          ${group.items.map(item => `
            <button type="button"
              class="admin-nav-item ${item.id === adminState.section ? 'active' : ''}"
              data-action="admin-section"
              data-section="${escapeHtml(item.id)}">
              ${escapeHtml(item.label)}
            </button>
          `).join('')}
        </div>
      `}
    </div>
  `;
}

// ─── Render: tables ───
function renderTable(entity) {
  const rows = adminState.data[dataKeyFor(entity)] || [];
  const columns = ENTITY_COLUMNS[entity];

  return `
    <section class="admin-entity-section">
      <header class="admin-entity-header">
        <h3 class="admin-entity-title">${escapeHtml(ENTITY_LABELS[entity])}</h3>
        <button type="button"
          class="admin-btn admin-btn-sm"
          data-action="admin-add"
          data-entity="${entity}">
          + 新增 ${escapeHtml(ENTITY_LABELS[entity])}
        </button>
      </header>
      <div class="admin-table-wrap">
        <table class="admin-table">
          <thead>
            <tr>
              ${columns.map(c => `<th>${escapeHtml(c)}</th>`).join('')}
              <th class="admin-actions-col">操作</th>
            </tr>
          </thead>
          <tbody>
            ${rows.length === 0
              ? `<tr><td colspan="${columns.length + 1}" class="admin-empty">暂无数据</td></tr>`
              : rows.map(row => `
                <tr>
                  ${columns.map(c => `<td title="${renderCell(row[c])}">${renderCell(row[c])}</td>`).join('')}
                  <td class="admin-actions">
                    <button type="button" class="admin-btn admin-btn-sm"
                      data-action="admin-edit"
                      data-entity="${entity}"
                      data-id="${escapeHtml(encodeId(entity, row))}">编辑</button>
                    <button type="button" class="admin-btn admin-btn-sm admin-btn-danger"
                      data-action="admin-delete"
                      data-entity="${entity}"
                      data-id="${escapeHtml(encodeId(entity, row))}">删除</button>
                  </td>
                </tr>
              `).join('')
            }
          </tbody>
        </table>
      </div>
    </section>
  `;
}

// ─── Render: editor item list (theory / training / test) ───
function editorItemFilter(section) {
  if (section === 'theory-editor') return it => it.type === 'theory';
  if (section === 'training-editor') return it => it.type === 'training' || it.type === 'practice';
  if (section === 'test-editor') return it => it.type === 'quiz';
  return () => false;
}

function renderEditorItemList(section) {
  const items = (adminState.data.items || []).filter(editorItemFilter(section));
  const action = section === 'theory-editor' ? 'admin-edit-theory' : 'admin-edit-practice';

  return `
    <section class="admin-entity-section">
      <header class="admin-entity-header">
        <h3 class="admin-entity-title">小节列表</h3>
      </header>
      <div class="admin-table-wrap">
        <table class="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>标题</th>
              <th>类型</th>
              <th class="admin-actions-col">操作</th>
            </tr>
          </thead>
          <tbody>
            ${items.length === 0
              ? `<tr><td colspan="4" class="admin-empty">暂无小节，请先在「模块 / 小节」中创建对应类型的小节</td></tr>`
              : items.map(it => `
                <tr>
                  <td>${renderCell(it.id)}</td>
                  <td>${renderCell(it.title)}</td>
                  <td>${renderCell(it.type)}</td>
                  <td class="admin-actions">
                    <button type="button" class="admin-btn admin-btn-sm"
                      data-action="${action}"
                      data-item-id="${escapeHtml(it.id)}"
                      data-item-type="${escapeHtml(it.type)}">编辑</button>
                  </td>
                </tr>
              `).join('')}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

// ─── Render: theory editor ───
function renderTheoryEditor() {
  const ed = adminState.theoryEditor;
  const examples = ed.examples || [];
  return `
    <div class="admin-editor admin-editor-theory" id="theory-editor">
      <div class="theory-left">
        <div class="theory-section">
          <label class="admin-form-label" for="theory-content">理论正文 (Markdown)</label>
          <textarea id="theory-content" class="admin-md-textarea" rows="14">${escapeHtml(ed.content || '')}</textarea>
        </div>
        <div class="theory-section">
          <div class="theory-examples-header">
            <span class="admin-form-label">例题 (${examples.length})</span>
            <button type="button" class="admin-btn admin-btn-sm" data-action="admin-add-example">+ 添加例题</button>
          </div>
          <div class="theory-examples">
            ${examples.map((ex, idx) => renderTheoryExample(ex, idx, ed.collapsed[idx])).join('')}
          </div>
        </div>
      </div>
      <div class="theory-right">
        <div class="admin-form-label">预览</div>
        <div id="theory-preview" class="admin-preview"></div>
      </div>
    </div>
  `;
}

function renderTheoryExample(ex, idx, collapsed) {
  const opts = Array.isArray(ex.options) ? ex.options : [];
  const answer = typeof ex.answer === 'number' ? ex.answer : 0;
  return `
    <div class="theory-example ${collapsed ? 'collapsed' : ''}">
      <div class="theory-example-header" data-action="admin-toggle-example" data-idx="${idx}">
        <span>例题 ${idx + 1}</span>
        <span class="theory-example-toggle">${collapsed ? '+' : '−'}</span>
      </div>
      ${collapsed ? '' : `
        <div class="theory-example-body">
          <div class="admin-form-row">
            <label class="admin-form-label" for="theory-ex-${idx}-text">题干 (Markdown)</label>
            <textarea id="theory-ex-${idx}-text" class="admin-md-textarea" rows="3">${escapeHtml(ex.text || '')}</textarea>
          </div>
          <div class="admin-form-row">
            <label class="admin-form-label" for="theory-ex-${idx}-image">题图 URL (可选)</label>
            <input type="text" id="theory-ex-${idx}-image" value="${escapeHtml(ex.image || '')}" placeholder="https://...">
          </div>
          ${[0, 1, 2, 3].map(i => `
            <div class="admin-form-row">
              <label class="admin-form-label" for="theory-ex-${idx}-opt-${i}">选项 ${String.fromCharCode(65 + i)}</label>
              <textarea id="theory-ex-${idx}-opt-${i}" class="admin-md-textarea" rows="2">${escapeHtml(opts[i] || '')}</textarea>
            </div>
          `).join('')}
          <div class="admin-form-row">
            <label class="admin-form-label" for="theory-ex-${idx}-answer">正确答案</label>
            <select id="theory-ex-${idx}-answer">
              ${[0, 1, 2, 3].map(i => `<option value="${i}" ${answer === i ? 'selected' : ''}>${String.fromCharCode(65 + i)}</option>`).join('')}
            </select>
          </div>
          <div class="admin-form-row">
            <label class="admin-form-label" for="theory-ex-${idx}-solution">解析 (Markdown, 可选)</label>
            <textarea id="theory-ex-${idx}-solution" class="admin-md-textarea" rows="2">${escapeHtml(ex.solution || '')}</textarea>
          </div>
          <div class="admin-form-row">
            <button type="button" class="admin-btn admin-btn-sm admin-btn-danger" data-action="admin-remove-example" data-idx="${idx}">删除例题</button>
          </div>
        </div>
      `}
    </div>
  `;
}

// ─── Render: practice editor ───
function renderPracticeEditor() {
  const ed = adminState.practiceEditor;
  const questions = ed.questions || [];
  const sel = ed.selectedIndex;
  return `
    <div class="admin-editor admin-editor-practice" id="practice-editor">
      <div class="practice-list">
        <div class="practice-list-header">
          <span class="admin-form-label">题目 (${questions.length})</span>
        </div>
        <div class="practice-list-items">
          ${questions.length === 0
            ? `<div class="admin-empty">暂无题目</div>`
            : questions.map((q, idx) => `
              <div class="practice-list-item ${idx === sel ? 'selected' : ''}" data-action="admin-practice-select" data-idx="${idx}">
                <span class="practice-list-num">${idx + 1}</span>
                <span class="practice-list-type">${escapeHtml(questionTypeLabel(q.question_type))}</span>
                <button type="button" class="practice-list-del" data-action="admin-practice-remove" data-idx="${idx}" title="删除">×</button>
              </div>
            `).join('')}
        </div>
        <button type="button" class="admin-btn admin-btn-sm admin-btn-block" data-action="admin-practice-add">+ 添加题目</button>
      </div>
      <div class="practice-edit">
        ${sel >= 0 && questions[sel] ? renderPracticeForm(questions[sel], sel) : `<div class="admin-empty">请选择或添加题目</div>`}
      </div>
      <div class="practice-preview">
        <div class="admin-form-label">预览</div>
        <div id="practice-preview" class="admin-preview"></div>
      </div>
    </div>
  `;
}

function renderPracticeForm(q, sel) {
  const type = Number(q.question_type);
  const opts = Array.isArray(q.options) ? q.options : ['', '', '', ''];
  const answerStr = q.answer != null ? String(q.answer) : '0';
  const answersArr = Array.isArray(q.answers) ? q.answers : [];
  const isMulti = type === 1;
  return `
    <div class="practice-form" id="practice-form">
      <div class="admin-form-row">
        <label class="admin-form-label">题型</label>
        <div class="practice-type-selector">
          ${PRACTICE_TYPES.map(t => `
            <button type="button"
              class="practice-type-btn ${type === t.value ? 'active' : ''}"
              data-action="admin-practice-type"
              data-value="${t.value}">${escapeHtml(t.label)}</button>
          `).join('')}
        </div>
      </div>
      <div class="admin-form-row">
        <label class="admin-form-label" for="pq-title">标题 (可选)</label>
        <input type="text" id="pq-title" value="${escapeHtml(q.title || '')}">
      </div>
      <div class="admin-form-row">
        <label class="admin-form-label" for="pq-content">题干 (Markdown)</label>
        <textarea id="pq-content" class="admin-md-textarea" rows="4">${escapeHtml(q.content || '')}</textarea>
      </div>
      <div class="admin-form-row">
        <label class="admin-form-label" for="pq-image">题图 URL (可选)</label>
        <input type="text" id="pq-image" value="${escapeHtml(q.image || '')}" placeholder="https://...">
      </div>
      ${type === 0 || isMulti ? `
        ${[0, 1, 2, 3].map(i => `
          <div class="admin-form-row">
            <label class="admin-form-label" for="pq-opt-${i}">选项 ${String.fromCharCode(65 + i)}</label>
            <textarea id="pq-opt-${i}" class="admin-md-textarea" rows="2">${escapeHtml(opts[i] || '')}</textarea>
          </div>
        `).join('')}
        <div class="admin-form-row">
          <label class="admin-form-label" for="pq-answer">正确答案${isMulti ? '（可多选）' : ''}</label>
          ${isMulti ? `
            <div class="practice-multi-answer">
              ${[0, 1, 2, 3].map(i => `
                <label class="practice-multi-option">
                  <input type="checkbox" id="pq-answer-${i}" value="${i}" ${answersArr.map(String).includes(String(i)) ? 'checked' : ''}>
                  <span>${String.fromCharCode(65 + i)}</span>
                </label>
              `).join('')}
            </div>
          ` : `
            <select id="pq-answer">
              ${[0, 1, 2, 3].map(i => `<option value="${i}" ${answerStr === String(i) ? 'selected' : ''}>${String.fromCharCode(65 + i)}</option>`).join('')}
            </select>
          `}
        </div>
      ` : type === 2 ? `
        <div class="admin-form-row">
          <label class="admin-form-label" for="pq-answer">答案</label>
          <input type="text" id="pq-answer" value="${escapeHtml(q.answer || '')}">
        </div>
        <div class="admin-form-row">
          <label class="admin-form-label" for="pq-blanks">空数</label>
          <input type="number" id="pq-blanks" value="${escapeHtml(String(q.blanks ?? 1))}">
        </div>
      ` : `
        <div class="admin-form-row">
          <label class="admin-form-label" for="pq-answer">答案</label>
          <input type="text" id="pq-answer" value="${escapeHtml(q.answer || '')}">
        </div>
      `}
      <div class="admin-form-row">
        <label class="admin-form-label" for="pq-solution">解析 (Markdown, 可选)</label>
        <textarea id="pq-solution" class="admin-md-textarea" rows="3">${escapeHtml(q.solution || '')}</textarea>
      </div>
      <div class="admin-form-row">
        <label class="admin-form-label" for="pq-difficulty">难度</label>
        <input type="number" id="pq-difficulty" value="${escapeHtml(String(q.difficulty ?? 1))}">
      </div>
      <div class="practice-move-row">
        <button type="button" class="admin-btn admin-btn-sm" data-action="admin-practice-move-up" data-idx="${sel}">上移</button>
        <button type="button" class="admin-btn admin-btn-sm" data-action="admin-practice-move-down" data-idx="${sel}">下移</button>
      </div>
    </div>
  `;
}

// ─── Render: content / feedback / modal ───
function renderContent() {
  if (adminState.loading) {
    return `<div class="admin-loading">加载中…</div>`;
  }
  if (adminState.theoryEditor) return renderTheoryEditor();
  if (adminState.practiceEditor) return renderPracticeEditor();

  const section = adminState.section;
  if (section === 'settings') {
    return `<div class="admin-placeholder">设置功能开发中</div>`;
  }
  const entities = SECTION_ENTITIES[section];
  if (entities) return entities.map(renderTable).join('');
  if (section === 'theory-editor' || section === 'training-editor' || section === 'test-editor') {
    return renderEditorItemList(section);
  }
  return '';
}

function renderFeedback() {
  if (!adminState.feedback) return '';
  const { type, message } = adminState.feedback;
  const cls = type === 'success' ? 'admin-feedback-success' : 'admin-feedback-error';
  return `<div class="admin-feedback ${cls}">${escapeHtml(message)}</div>`;
}

function renderField(field, row) {
  const value = row ? row[field.name] : '';
  const fieldId = `admin-field-${field.name}`;
  const isEditing = !!row;
  const disabled = field.readOnly || (isEditing && field.immutable);
  const common = `id="${fieldId}" data-field="${escapeHtml(field.name)}"`;
  let control;

  if (field.type === 'select') {
    control = `
      <select ${common} ${disabled ? 'disabled' : ''}>
        ${field.options.map(o => `<option value="${escapeHtml(o)}" ${value === o ? 'selected' : ''}>${escapeHtml(o)}</option>`).join('')}
      </select>
    `;
  } else if (field.type === 'textarea') {
    const v = field.json ? jsonFieldToString(value) : (value || '');
    control = `<textarea ${common} ${disabled ? 'disabled' : ''} rows="${field.json ? 6 : 4}">${escapeHtml(v)}</textarea>`;
  } else if (field.type === 'number') {
    control = `<input type="number" ${common} value="${escapeHtml(value ?? '')}" ${disabled ? 'disabled' : ''}>`;
  } else {
    control = `<input type="text" ${common} value="${escapeHtml(value ?? '')}" ${disabled ? 'disabled' : ''}>`;
  }

  return `
    <div class="admin-form-row">
      <label for="${fieldId}" class="admin-form-label">${escapeHtml(field.label)}${field.json ? ' (JSON)' : ''}</label>
      <div class="admin-form-control">${control}</div>
    </div>
  `;
}

function renderModal() {
  if (!adminState.editing) return '';
  const { entity, row, isNew } = adminState.editing;
  const fields = ENTITY_FIELDS[entity];
  const title = `${isNew ? '新增' : '编辑'} ${ENTITY_LABELS[entity]}`;
  const saveId = isNew ? '' : escapeHtml(encodeId(entity, row));

  return `
    <div class="admin-modal-overlay" id="admin-modal-overlay" data-action="admin-modal-close">
      <div class="admin-modal" data-action="admin-modal-noop">
        <header class="admin-modal-header">
          <h3>${escapeHtml(title)}</h3>
          <button type="button" class="admin-modal-close" data-action="admin-modal-close" aria-label="关闭">×</button>
        </header>
        <form class="admin-modal-body" id="admin-modal-form" autocomplete="off">
          ${fields.map(f => renderField(f, row)).join('')}
        </form>
        <footer class="admin-modal-footer">
          <button type="button" class="admin-btn" data-action="admin-modal-close">取消</button>
          <button type="button" class="admin-btn admin-btn-primary"
            data-action="admin-modal-save"
            data-entity="${entity}"
            ${saveId ? `data-id="${saveId}"` : ''}>
            保存
          </button>
        </footer>
      </div>
    </div>
  `;
}

// ─── Styles (dark theme, scoped under .admin-page) ───
const ADMIN_STYLES = `
.admin-page {
  --ad-bg: #050505;
  --ad-bg-card: #0a0a0a;
  --ad-bg-hover: #111111;
  --ad-border: #1f1f1f;
  --ad-fg: #f5f5f7;
  --ad-muted: #888888;
  --ad-disabled: #555555;
  --ad-green: #1a3c34;
  --ad-green-hl: #4ade80;
  --ad-green-soft: #0d1f1b;
  --ad-danger: #e5654a;
  background: var(--ad-bg);
  color: var(--ad-fg);
  min-height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}
.admin-page * { box-sizing: border-box; }
.admin-page a { color: var(--ad-green-hl); }
.admin-page .admin-layout { display: flex; min-height: 100vh; }
.admin-page .admin-sidebar {
  width: 220px; flex-shrink: 0;
  background: var(--ad-bg-card);
  border-right: 1px solid var(--ad-border);
  display: flex; flex-direction: column;
  position: sticky; top: 0; height: 100vh; overflow-y: auto;
}
.admin-page .admin-sidebar-header {
  padding: 1rem 1rem 0.75rem;
  border-bottom: 1px solid var(--ad-border);
  display: flex; flex-direction: column; gap: 0.15rem;
}
.admin-page .admin-sidebar-logo { font-size: 1rem; font-weight: 700; color: var(--ad-fg); letter-spacing: 0.02em; }
.admin-page .admin-sidebar-sub { font-size: 0.75rem; color: var(--ad-muted); }
.admin-page .admin-sidebar-nav { padding: 0.5rem 0; flex: 1; }
.admin-page .admin-sidebar-group { margin-bottom: 0.25rem; }
.admin-page .admin-sidebar-group-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 0.5rem 1rem; cursor: pointer;
  color: var(--ad-muted); font-size: 0.75rem;
  text-transform: uppercase; letter-spacing: 0.08em;
  user-select: none;
}
.admin-page .admin-sidebar-group-header:hover { color: var(--ad-fg); }
.admin-page .admin-sidebar-arrow { font-size: 0.85rem; }
.admin-page .admin-sidebar-items { display: flex; flex-direction: column; padding-bottom: 0.25rem; }
.admin-page .admin-nav-item {
  display: block; width: 100%; text-align: left;
  padding: 0.5rem 1rem 0.5rem 1.25rem;
  border: none; border-left: 3px solid transparent;
  background: transparent; color: var(--ad-fg);
  cursor: pointer; font-size: 0.875rem; font-family: inherit;
}
.admin-page .admin-nav-item:hover { background: var(--ad-bg-hover); }
.admin-page .admin-nav-item.active {
  background: var(--ad-green-soft);
  border-left-color: var(--ad-green);
  color: var(--ad-green-hl);
}
.admin-page .admin-main { flex: 1; display: flex; flex-direction: column; min-width: 0; }
.admin-page .admin-main-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 1rem 1.5rem; border-bottom: 1px solid var(--ad-border);
  background: var(--ad-bg-card);
}
.admin-page .admin-main-title { margin: 0; font-size: 1.15rem; font-weight: 600; color: var(--ad-fg); }
.admin-page .admin-main-actions { display: flex; gap: 0.5rem; }
.admin-page .admin-content { flex: 1; padding: 1.5rem; display: flex; flex-direction: column; gap: 1.25rem; overflow-x: auto; }
.admin-page .admin-feedback { padding: 0.75rem 1rem; border-radius: 6px; font-size: 0.875rem; }
.admin-page .admin-feedback-success { background: var(--ad-green-soft); color: var(--ad-green-hl); border: 1px solid var(--ad-green); }
.admin-page .admin-feedback-error { background: rgba(229,101,74,0.12); color: var(--ad-danger); border: 1px solid var(--ad-danger); }
.admin-page .admin-entity-section { background: var(--ad-bg-card); border: 1px solid var(--ad-border); border-radius: 8px; padding: 1rem; }
.admin-page .admin-entity-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem; }
.admin-page .admin-entity-title { font-size: 1rem; font-weight: 600; color: var(--ad-fg); margin: 0; }
.admin-page .admin-table-wrap { overflow-x: auto; }
.admin-page .admin-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
.admin-page .admin-table th, .admin-page .admin-table td {
  padding: 0.5rem 0.75rem; text-align: left;
  border-bottom: 1px solid var(--ad-border);
  color: var(--ad-fg); white-space: nowrap;
  max-width: 320px; overflow: hidden; text-overflow: ellipsis;
}
.admin-page .admin-table th { font-weight: 600; color: var(--ad-muted); }
.admin-page .admin-table td { vertical-align: top; }
.admin-page .admin-table tbody tr:hover { background: var(--ad-bg-hover); }
.admin-page .admin-actions { display: flex; gap: 0.4rem; white-space: nowrap; }
.admin-page .admin-actions-col { width: 1%; }
.admin-page .admin-empty { text-align: center; color: var(--ad-muted); padding: 1.5rem; }
.admin-page .admin-placeholder { padding: 3rem 1rem; text-align: center; color: var(--ad-muted); }
.admin-page .admin-loading { padding: 2rem; text-align: center; color: var(--ad-muted); }
.admin-page .admin-btn {
  padding: 0.4rem 0.85rem;
  border: 1px solid #333; background: transparent;
  color: var(--ad-fg); border-radius: 6px;
  cursor: pointer; font-size: 0.85rem; font-family: inherit;
}
.admin-page .admin-btn:hover { border-color: var(--ad-green-hl); color: var(--ad-green-hl); }
.admin-page .admin-btn-primary { background: var(--ad-green); color: var(--ad-green-hl); border-color: var(--ad-green); }
.admin-page .admin-btn-primary:hover { background: var(--ad-green-soft); color: var(--ad-green-hl); border-color: var(--ad-green-hl); }
.admin-page .admin-btn-danger { color: var(--ad-danger); border-color: #4a2a22; }
.admin-page .admin-btn-danger:hover { background: rgba(229,101,74,0.12); color: var(--ad-danger); border-color: var(--ad-danger); }
.admin-page .admin-btn-sm { padding: 0.25rem 0.55rem; font-size: 0.8rem; }
.admin-page .admin-btn-block { width: 100%; }
.admin-page .admin-form-row { display: flex; flex-direction: column; gap: 0.3rem; margin-bottom: 0.6rem; }
.admin-page .admin-form-label { font-size: 0.8rem; color: var(--ad-muted); }
.admin-page .admin-form-control input,
.admin-page .admin-form-control select,
.admin-page .admin-form-control textarea,
.admin-page .admin-md-textarea,
.admin-page .practice-form input,
.admin-page .practice-form select,
.admin-page .practice-form textarea,
.admin-page .theory-example-body select,
.admin-page .theory-example-body textarea,
.admin-page .theory-example-body input,
.admin-page #theory-content {
  width: 100%; padding: 0.45rem 0.6rem;
  border: 1px solid var(--ad-border); background: var(--ad-bg);
  color: var(--ad-fg); border-radius: 6px;
  font-size: 0.875rem; font-family: inherit;
}
.admin-page .admin-md-textarea { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; resize: vertical; line-height: 1.5; }
.admin-page .practice-form input:focus,
.admin-page .practice-form select:focus,
.admin-page .practice-form textarea:focus,
.admin-page .theory-example-body input:focus,
.admin-page .theory-example-body select:focus,
.admin-page .theory-example-body textarea:focus,
.admin-page #theory-content:focus,
.admin-page .admin-form-control input:focus,
.admin-page .admin-form-control select:focus,
.admin-page .admin-form-control textarea:focus {
  outline: none; border-color: var(--ad-green-hl);
}
.admin-page .practice-form input:disabled,
.admin-page .practice-form select:disabled,
.admin-page .practice-form textarea:disabled { opacity: 0.55; cursor: not-allowed; }
/* Modal */
.admin-page .admin-modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.7);
  z-index: 100; display: flex; align-items: center; justify-content: center; padding: 1rem;
}
.admin-page .admin-modal { background: var(--ad-bg-card); border: 1px solid var(--ad-border); border-radius: 10px; max-width: 640px; width: 100%; max-height: 90vh; overflow-y: auto; }
.admin-page .admin-modal-header { display: flex; align-items: center; justify-content: space-between; padding: 1rem 1.25rem; border-bottom: 1px solid var(--ad-border); position: sticky; top: 0; background: var(--ad-bg-card); }
.admin-page .admin-modal-header h3 { margin: 0; font-size: 1rem; color: var(--ad-fg); }
.admin-page .admin-modal-close { background: none; border: none; color: var(--ad-muted); font-size: 1.5rem; cursor: pointer; line-height: 1; padding: 0; }
.admin-page .admin-modal-close:hover { color: var(--ad-fg); }
.admin-page .admin-modal-body { padding: 1.25rem; display: flex; flex-direction: column; gap: 0.85rem; }
.admin-page .admin-modal-footer { padding: 1rem 1.25rem; border-top: 1px solid var(--ad-border); display: flex; justify-content: flex-end; gap: 0.5rem; position: sticky; bottom: 0; background: var(--ad-bg-card); }
/* Theory editor */
.admin-page .admin-editor { display: flex; gap: 1rem; min-height: 480px; }
.admin-page .admin-editor-theory { flex-direction: row; }
.admin-page .theory-left, .admin-page .theory-right { flex: 1; display: flex; flex-direction: column; gap: 1rem; min-width: 0; }
.admin-page .theory-section { display: flex; flex-direction: column; gap: 0.4rem; }
.admin-page .theory-examples-header { display: flex; align-items: center; justify-content: space-between; }
.admin-page .theory-examples { display: flex; flex-direction: column; gap: 0.5rem; }
.admin-page .theory-example { border: 1px solid var(--ad-border); border-radius: 6px; background: var(--ad-bg-card); overflow: hidden; }
.admin-page .theory-example-header { display: flex; align-items: center; justify-content: space-between; padding: 0.5rem 0.75rem; cursor: pointer; background: var(--ad-bg-hover); font-size: 0.85rem; color: var(--ad-fg); user-select: none; }
.admin-page .theory-example-header:hover { color: var(--ad-green-hl); }
.admin-page .theory-example-toggle { color: var(--ad-muted); }
.admin-page .theory-example-body { padding: 0.75rem; display: flex; flex-direction: column; gap: 0.4rem; }
.admin-page .admin-preview { background: var(--ad-bg-card); border: 1px solid var(--ad-border); border-radius: 8px; padding: 1rem; flex: 1; overflow-y: auto; font-size: 0.9rem; line-height: 1.6; color: var(--ad-fg); }
.admin-page .admin-preview h1, .admin-page .admin-preview h2, .admin-page .admin-preview h3, .admin-page .admin-preview h4 { color: var(--ad-fg); margin: 0.6em 0 0.3em; }
.admin-page .admin-preview p { margin: 0.4em 0; }
.admin-page .admin-preview code { background: var(--ad-bg-hover); padding: 0.1em 0.35em; border-radius: 3px; font-family: ui-monospace, Menlo, Consolas, monospace; font-size: 0.85em; }
.admin-page .admin-preview pre { background: var(--ad-bg-hover); padding: 0.6rem; border-radius: 6px; overflow-x: auto; }
.admin-page .admin-preview pre code { background: transparent; padding: 0; }
.admin-page .admin-preview hr { border: none; border-top: 1px solid var(--ad-border); margin: 0.8rem 0; }
.admin-page .preview-example { margin-bottom: 0.75rem; padding-bottom: 0.6rem; border-bottom: 1px dashed var(--ad-border); }
.admin-page .preview-example:last-child { border-bottom: none; }
.admin-page .preview-correct { color: var(--ad-green-hl); font-weight: 600; }
.admin-page .preview-solution, .admin-page .preview-answer { margin-top: 0.4rem; color: var(--ad-muted); font-size: 0.85rem; }
/* Practice editor */
.admin-page .admin-editor-practice { flex-direction: row; }
.admin-page .practice-list { width: 200px; flex-shrink: 0; display: flex; flex-direction: column; gap: 0.5rem; background: var(--ad-bg-card); border: 1px solid var(--ad-border); border-radius: 8px; padding: 0.6rem; }
.admin-page .practice-list-header { display: flex; align-items: center; justify-content: space-between; }
.admin-page .practice-list-items { display: flex; flex-direction: column; gap: 0.25rem; max-height: 60vh; overflow-y: auto; }
.admin-page .practice-list-item { display: flex; align-items: center; gap: 0.4rem; padding: 0.4rem 0.5rem; border: 1px solid var(--ad-border); border-radius: 6px; cursor: pointer; font-size: 0.8rem; color: var(--ad-fg); background: var(--ad-bg); }
.admin-page .practice-list-item:hover { background: var(--ad-bg-hover); }
.admin-page .practice-list-item.selected { border-color: var(--ad-green); background: var(--ad-green-soft); color: var(--ad-green-hl); }
.admin-page .practice-list-num { font-weight: 600; min-width: 1.4rem; }
.admin-page .practice-list-type { flex: 1; color: var(--ad-muted); font-size: 0.75rem; }
.admin-page .practice-list-item.selected .practice-list-type { color: var(--ad-green-hl); }
.admin-page .practice-list-del { margin-left: auto; background: none; border: none; color: var(--ad-muted); cursor: pointer; font-size: 1rem; line-height: 1; padding: 0 0.25rem; }
.admin-page .practice-list-del:hover { color: var(--ad-danger); }
.admin-page .practice-edit { flex: 1; min-width: 0; background: var(--ad-bg-card); border: 1px solid var(--ad-border); border-radius: 8px; padding: 1rem; overflow-y: auto; }
.admin-page .practice-form { display: flex; flex-direction: column; gap: 0.2rem; }
.admin-page .practice-type-selector { display: flex; gap: 0.4rem; flex-wrap: wrap; }
.admin-page .practice-type-btn { padding: 0.3rem 0.7rem; border: 1px solid var(--ad-border); background: transparent; color: var(--ad-fg); border-radius: 6px; cursor: pointer; font-size: 0.8rem; font-family: inherit; }
.admin-page .practice-type-btn:hover { border-color: var(--ad-green-hl); }
.admin-page .practice-type-btn.active { background: var(--ad-green-soft); border-color: var(--ad-green); color: var(--ad-green-hl); }
.admin-page .practice-move-row { display: flex; gap: 0.5rem; margin-top: 0.5rem; }
.admin-page .practice-multi-answer { display: flex; gap: 0.6rem; flex-wrap: wrap; }
.admin-page .practice-multi-option { display: flex; align-items: center; gap: 0.3rem; padding: 0.3rem 0.6rem; border: 1px solid var(--ad-border); border-radius: 6px; cursor: pointer; color: var(--ad-fg); font-size: 0.85rem; }
.admin-page .practice-multi-option input { margin: 0; cursor: pointer; }
.admin-page .practice-multi-option:has(input:checked) { border-color: var(--ad-green); background: var(--ad-green-soft); color: var(--ad-green-hl); }
.admin-page .practice-preview { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 0.4rem; }
.admin-page .practice-preview .admin-preview { flex: 1; }
.admin-page .admin-denied { text-align: center; padding: 4rem 1rem; color: var(--ad-muted); }
.admin-page .admin-denied h2 { color: var(--ad-fg); margin-bottom: 0.5rem; }
@media (max-width: 900px) {
  .admin-page .admin-editor { flex-direction: column; }
  .admin-page .practice-list { width: 100%; }
}
`;

// ─── Render: page ───
export function renderAdminPage() {
  if (!isAdmin()) {
    return `
      <div class="admin-page">
        <style>${ADMIN_STYLES}</style>
        <div class="admin-denied">
          <h2>无权访问</h2>
          <p>此页面仅管理员可用。</p>
          <p><a href="/">返回首页</a></p>
        </div>
      </div>
    `;
  }
  return `
    <div class="admin-page">
      <style>${ADMIN_STYLES}</style>
      <div class="admin-layout">
        ${renderSidebar()}
        <div class="admin-main">
          <header class="admin-main-header">
            <h1 class="admin-main-title">${escapeHtml(SECTION_TITLES[adminState.section] || '管理后台')}</h1>
            <div class="admin-main-actions">
              ${(adminState.theoryEditor || adminState.practiceEditor) ? `
                <button type="button" class="admin-btn" data-action="admin-back-list">返回列表</button>
                ${adminState.theoryEditor ? `<button type="button" class="admin-btn admin-btn-primary" data-action="admin-save-theory">保存</button>` : ''}
                ${adminState.practiceEditor ? `<button type="button" class="admin-btn admin-btn-primary" data-action="admin-save-practice">保存全部</button>` : ''}
              ` : `
                <button type="button" class="admin-btn" data-action="admin-refresh">刷新</button>
              `}
            </div>
          </header>
          ${renderFeedback()}
          <main class="admin-content" id="admin-content">${renderContent()}</main>
        </div>
      </div>
      ${renderModal()}
    </div>
  `;
}

// ─── Mount / rerender ───
function initEasyMDE(textareaId) {
  const el = document.getElementById(textareaId);
  if (!el) return null;
  const editor = new EasyMDE({
    element: el,
    autoDownloadFontAwesome: false,
    spellChecker: false,
    status: false,
    toolbar: [
      'bold', 'italic', 'heading', '|',
      'quote', 'code', 'unordered-list', 'ordered-list', '|',
      'link', 'image', '|',
      'preview', 'side-by-side', 'fullscreen', '|',
      'guide'
    ],
    initialValue: el.value,
    minHeight: textareaId === 'theory-content' ? '280px' : '120px'
  });
  editor.codemirror.on('change', () => {
    if (textareaId === 'theory-content') {
      syncTheoryFormToState();
      updateTheoryPreview();
    } else {
      syncPracticeFormToState();
      updatePracticePreview();
    }
  });
  adminState.editorInstances.easyMDEs.push(editor);
  return editor;
}

function initEditors() {
  if (adminState.theoryEditor) {
    initEasyMDE('theory-content');
    (adminState.theoryEditor.examples || []).forEach((_, idx) => {
      initEasyMDE(`theory-ex-${idx}-text`);
      initEasyMDE(`theory-ex-${idx}-solution`);
      [0, 1, 2, 3].forEach(i => initEasyMDE(`theory-ex-${idx}-opt-${i}`));
    });
  } else if (adminState.practiceEditor && adminState.practiceEditor.selectedIndex >= 0) {
    initEasyMDE('pq-content');
    initEasyMDE('pq-solution');
  }
}

function initSplits() {
  const theoryEditor = document.getElementById('theory-editor');
  if (theoryEditor) {
    const left = theoryEditor.querySelector('.theory-left');
    const right = theoryEditor.querySelector('.theory-right');
    if (left && right) {
      const inst = Split([left, right], {
        sizes: [50, 50],
        minSize: 280,
        gutterSize: 8,
        direction: 'horizontal'
      });
      adminState.editorInstances.splits.push(inst);
    }
    return;
  }
  const practiceEditor = document.getElementById('practice-editor');
  if (practiceEditor) {
    const list = practiceEditor.querySelector('.practice-list');
    const edit = practiceEditor.querySelector('.practice-edit');
    const preview = practiceEditor.querySelector('.practice-preview');
    if (list && edit && preview) {
      const inst = Split([list, edit, preview], {
        sizes: [20, 40, 40],
        minSize: [180, 280, 280],
        gutterSize: 8,
        direction: 'horizontal'
      });
      adminState.editorInstances.splits.push(inst);
    }
  }
}

function initSortable() {
  const container = document.querySelector('.practice-list-items');
  if (!container || adminState.editorInstances.sortable) return;
  adminState.editorInstances.sortable = Sortable.create(container, {
    handle: '.practice-list-drag',
    animation: 150,
    onEnd: evt => {
      if (evt.oldIndex === evt.newIndex) return;
      practiceReorder(evt.oldIndex, evt.newIndex);
    }
  });
}

function mountAdmin() {
  // 实时预览：在稳定的 #main 上挂一次 input 监听，用 flag 防重复
  const main = document.getElementById('main');
  if (main && !adminState.previewListenerAttached) {
    main.addEventListener('input', () => {
      if (adminState.theoryEditor) updateTheoryPreview();
      else if (adminState.practiceEditor) updatePracticePreview();
    });
    adminState.previewListenerAttached = true;
  }
  // 首次挂载后渲染一次预览
  if (adminState.theoryEditor) updateTheoryPreview();
  else if (adminState.practiceEditor) updatePracticePreview();
  // 挂载编辑器增强组件
  initEditors();
  initSplits();
  initSortable();
}

function cleanupEditors() {
  const { editorInstances } = adminState;
  editorInstances.easyMDEs.forEach(e => {
    try { e.toTextArea(); } catch (_) {}
  });
  editorInstances.easyMDEs = [];
  editorInstances.splits.forEach(s => {
    try { s.destroy(); } catch (_) {}
  });
  editorInstances.splits = [];
  if (editorInstances.sortable) {
    try { editorInstances.sortable.destroy(); } catch (_) {}
    editorInstances.sortable = null;
  }
}

function rerender() {
  const main = document.getElementById('main');
  if (!main) return;
  cleanupEditors();
  main.innerHTML = renderAdminPage();
  mountAdmin();
}

function openModal(entity, row, isNew) {
  adminState.editing = { entity, row: row || {}, isNew };
  rerender();
}

function closeModal() {
  adminState.editing = null;
  rerender();
}

function collectFormValues(entity) {
  const form = document.getElementById('admin-modal-form');
  if (!form) return {};
  const values = {};
  const fields = ENTITY_FIELDS[entity];
  fields.forEach(f => {
    const input = form.querySelector(`[data-field="${f.name}"]`);
    if (!input) return;
    let v = input.value;
    if (f.type === 'number') {
      v = v === '' ? null : Number(v);
    } else if (f.json) {
      v = parseJsonField(v);
    }
    values[f.name] = v;
  });
  return values;
}

// ─── Section data loading ───
async function loadSectionData(section) {
  adminState.loading = true;
  adminState.feedback = null;
  adminState.theoryEditor = null;
  adminState.practiceEditor = null;
  rerender();
  try {
    if (section === 'users') {
      adminState.data.users = await adminApi.listUsers();
    } else if (section === 'courses') {
      adminState.data.courses = await adminApi.listCourses();
    } else if (section === 'modules') {
      const [modules, items, theoryContents] = await Promise.all([
        adminApi.listModules(),
        adminApi.listItems(),
        adminApi.listTheoryContents()
      ]);
      adminState.data.modules = modules;
      adminState.data.theoryContents = theoryContents;
      const theoryMap = new Map(theoryContents.map(t => [t.item_id, t]));
      adminState.data.items = items.map(it => {
        const t = theoryMap.get(it.id);
        if (!t || it.type !== 'theory') return it;
        return {
          ...it,
          content: t.content || it.content || '',
          examples: Array.isArray(t.examples) ? t.examples : []
        };
      });
    } else if (section === 'questions') {
      adminState.data.questions = await adminApi.listQuestions();
    } else if (section === 'exams') {
      const [papers, sections, questions] = await Promise.all([
        adminApi.listExamPapers(),
        adminApi.listExamSections(),
        adminApi.listExamQuestions()
      ]);
      adminState.data.examPapers = papers;
      adminState.data.examSections = sections;
      adminState.data.examQuestions = questions;
    } else if (section === 'theory-editor' || section === 'training-editor' || section === 'test-editor') {
      adminState.data.items = await adminApi.listItems();
    }
  } catch (e) {
    adminState.feedback = { type: 'error', message: `加载失败: ${e.message}` };
  } finally {
    adminState.loading = false;
    rerender();
  }
}

// ─── Save / Delete (modal CRUD) ───
async function handleSave(entity, id) {
  try {
    const values = collectFormValues(entity);

    if (entity === 'user') {
      const updates = {};
      if (values.role !== undefined) updates.role = values.role;
      if (values.display_name !== undefined) updates.display_name = values.display_name;
      if (values.avatar_url !== undefined) updates.avatar_url = values.avatar_url;
      await adminApi.updateUserProfileAdmin(id, updates);
    } else if (entity === 'course') {
      if (id) {
        const { id: _omit, ...updates } = values;
        await adminApi.updateCourse(id, updates);
      } else {
        await adminApi.createCourse(values);
      }
    } else if (entity === 'module') {
      const { course_id, module_id, ...rest } = values;
      if (id) {
        await adminApi.updateModule(course_id, module_id, rest);
      } else {
        await adminApi.createModule(values);
      }
    } else if (entity === 'item') {
      const { examples, ...itemUpdates } = values;
      if (id) {
        await adminApi.updateItem(id, itemUpdates);
      } else {
        await adminApi.createItem(values);
      }
      // theory 小节同步写入 theory_contents，保持内容表与 items 一致
      if (values.type === 'theory') {
        await adminApi.upsertTheoryContent({
          item_id: id || values.id,
          course_id: values.course_id,
          module_id: values.module_id,
          content: itemUpdates.content || '',
          examples: Array.isArray(examples) ? examples : []
        });
      }
    } else if (entity === 'question') {
      if (id) {
        const { id: _omit, ...updates } = values;
        await adminApi.updateQuestion(id, updates);
      } else {
        await adminApi.createQuestion(values);
      }
    } else if (entity === 'exam_paper') {
      if (id) {
        const { id: _omit, ...updates } = values;
        await adminApi.updateExamPaper(id, updates);
      } else {
        await adminApi.createExamPaper(values);
      }
    } else if (entity === 'exam_section') {
      if (id) {
        const { id: _omit, ...updates } = values;
        await adminApi.updateExamSection(id, updates);
      } else {
        await adminApi.createExamSection(values);
      }
    } else if (entity === 'exam_question') {
      if (id) {
        const { id: _omit, ...updates } = values;
        await adminApi.updateExamQuestion(id, updates);
      } else {
        await adminApi.createExamQuestion(values);
      }
    }

    adminState.editing = null;
    adminState.feedback = { type: 'success', message: '保存成功' };
    await loadSectionData(adminState.section);
  } catch (e) {
    adminState.feedback = { type: 'error', message: `保存失败: ${e.message}` };
    rerender();
  }
}

async function handleDelete(entity, id) {
  const label = ENTITY_LABELS[entity] || entity;
  if (!confirm(`确认删除此${label}？此操作不可撤销。`)) return;

  try {
    if (entity === 'user') {
      await adminApi.deleteUser(id);
    } else if (entity === 'course') {
      await adminApi.deleteCourse(id);
    } else if (entity === 'module') {
      const { course_id, module_id } = parseModuleId(id);
      await adminApi.deleteModule(course_id, module_id);
    } else if (entity === 'item') {
      await adminApi.deleteItem(id);
    } else if (entity === 'question') {
      await adminApi.deleteQuestion(id);
    } else if (entity === 'exam_paper') {
      await adminApi.deleteExamPaper(id);
    } else if (entity === 'exam_section') {
      await adminApi.deleteExamSection(id);
    } else if (entity === 'exam_question') {
      await adminApi.deleteExamQuestion(id);
    }

    adminState.feedback = { type: 'success', message: '删除成功' };
    await loadSectionData(adminState.section);
  } catch (e) {
    adminState.feedback = { type: 'error', message: `删除失败: ${e.message}` };
    rerender();
  }
}

// ─── Theory editor ───
async function normalizeTheoryExamples(itemId, rawExamples) {
  if (!Array.isArray(rawExamples) || rawExamples.length === 0) return [];
  // 旧格式：元素为字符串 ID → 拉取题目转内联对象
  if (typeof rawExamples[0] === 'string') {
    try {
      const questions = await adminApi.listQuestions({ itemId });
      const qMap = new Map(questions.map(q => [q.id, q]));
      return rawExamples
        .map(qid => qMap.get(qid))
        .filter(Boolean)
        .map(q => ({
          text: q.content || q.title || '',
          options: padOptions(q.options),
          answer: parseInt(q.answer, 10) || 0,
          solution: q.solution || ''
        }));
    } catch (e) {
      return [];
    }
  }
  // 已是内联对象
  return rawExamples.map(ex => ({
    text: ex.text || '',
    options: padOptions(ex.options),
    answer: typeof ex.answer === 'number' ? ex.answer : 0,
    solution: ex.solution || ''
  }));
}

function padOptions(opts) {
  const arr = Array.isArray(opts) ? opts.slice(0, 4) : [];
  while (arr.length < 4) arr.push('');
  return arr;
}

async function openTheoryEditor(itemId) {
  try {
    const item = adminState.data.items.find(it => it.id === itemId);
    if (!item) throw new Error('未找到小节');

    let theory = await adminApi.getTheoryContent(itemId);
    let content = '';
    let examples = [];
    if (theory) {
      content = theory.content || '';
      examples = Array.isArray(theory.examples) ? theory.examples : [];
    }
    examples = await normalizeTheoryExamples(itemId, examples);

    adminState.theoryEditor = {
      itemId,
      title: item.title || '',
      course_id: item.course_id || '',
      module_id: item.module_id || '',
      content,
      examples,
      collapsed: {}
    };
    rerender();
  } catch (e) {
    adminState.feedback = { type: 'error', message: `打开理论编辑器失败: ${e.message}` };
    rerender();
  }
}

function syncTheoryFormToState() {
  const ed = adminState.theoryEditor;
  if (!ed) return;
  const contentEl = document.getElementById('theory-content');
  if (contentEl) ed.content = contentEl.value;
  ed.examples = ed.examples.map((ex, idx) => {
    const text = document.getElementById(`theory-ex-${idx}-text`);
    const image = document.getElementById(`theory-ex-${idx}-image`);
    const answer = document.getElementById(`theory-ex-${idx}-answer`);
    const solution = document.getElementById(`theory-ex-${idx}-solution`);
    const opts = [0, 1, 2, 3].map(i => document.getElementById(`theory-ex-${idx}-opt-${i}`));
    return {
      text: text ? text.value : ex.text,
      image: image ? image.value.trim() : (ex.image || ''),
      options: opts.map((el, i) => el ? el.value : (ex.options[i] || '')),
      answer: answer ? parseInt(answer.value, 10) : ex.answer,
      solution: solution ? solution.value : (ex.solution || '')
    };
  });
}

function updateTheoryPreview() {
  const ed = adminState.theoryEditor;
  if (!ed) return;
  syncTheoryFormToState();
  const preview = document.getElementById('theory-preview');
  if (!preview) return;
  let html = renderMd(ed.content || '*无内容*');
  if (ed.examples.length > 0) {
    html += '<hr><h4>例题</h4>';
    ed.examples.forEach((ex, idx) => {
      html += `<div class="preview-example">`;
      html += `<p><strong>例 ${idx + 1}.</strong> ${renderMd(ex.text || '')}</p>`;
      if (ex.image) html += `<div class="preview-image"><img src="${escapeHtml(ex.image)}" alt="题图" style="max-width:100%;max-height:240px;border-radius:8px;"></div>`;
      html += '<ol type="A">';
      (ex.options || []).forEach((opt, i) => {
        const isAns = ex.answer === i;
        html += `<li class="${isAns ? 'preview-correct' : ''}">${renderMd(opt || '')}</li>`;
      });
      html += '</ol>';
      if (ex.solution) {
        html += `<div class="preview-solution"><strong>解析:</strong> ${renderMd(ex.solution)}</div>`;
      }
      html += `</div>`;
    });
  }
  preview.innerHTML = html;
  typeset(preview);
}

function addTheoryExample() {
  syncTheoryFormToState();
  const ed = adminState.theoryEditor;
  ed.examples.push({ text: '', options: ['', '', '', ''], answer: 0, solution: '' });
  // 新增的例题默认展开
  ed.collapsed[ed.examples.length - 1] = false;
  rerender();
}

function removeTheoryExample(idx) {
  syncTheoryFormToState();
  const ed = adminState.theoryEditor;
  ed.examples.splice(idx, 1);
  // 重建 collapsed 映射，避免索引错位
  const newCollapsed = {};
  Object.keys(ed.collapsed).forEach(k => {
    const kNum = Number(k);
    if (kNum < idx) newCollapsed[kNum] = ed.collapsed[k];
    else if (kNum > idx) newCollapsed[kNum - 1] = ed.collapsed[k];
  });
  ed.collapsed = newCollapsed;
  rerender();
}

function toggleTheoryExample(idx) {
  syncTheoryFormToState();
  const ed = adminState.theoryEditor;
  ed.collapsed[idx] = !ed.collapsed[idx];
  rerender();
}

async function saveTheory() {
  try {
    syncTheoryFormToState();
    const ed = adminState.theoryEditor;
    await adminApi.upsertTheoryContent({
      item_id: ed.itemId,
      course_id: ed.course_id,
      module_id: ed.module_id,
      content: ed.content,
      examples: ed.examples
    });
    // 同步 items.content，保持列表展示一致
    try { await adminApi.updateItem(ed.itemId, { content: ed.content }); } catch (_) { /* ignore */ }
    adminState.feedback = { type: 'success', message: '理论内容已保存' };
    adminState.theoryEditor = null;
    await loadSectionData(adminState.section);
  } catch (e) {
    adminState.feedback = { type: 'error', message: `保存失败: ${e.message}` };
    rerender();
  }
}

// ─── Practice editor ───
function createEmptyQuestion(itemId) {
  const item = adminState.data.items.find(it => it.id === itemId);
  return {
    id: null,
    item_id: itemId,
    course_id: item?.course_id || '',
    module_id: item?.module_id || '',
    question_type: 0,
    title: '',
    content: '',
    options: ['', '', '', ''],
    answer: '0',
    answers: [],
    blanks: 1,
    solution: '',
    difficulty: 1,
    image: '',
    tags: []
  };
}

async function openPracticeEditor(itemId, itemType) {
  try {
    const item = adminState.data.items.find(it => it.id === itemId);
    if (!item) throw new Error('未找到小节');
    const questions = await adminApi.listQuestions({ itemId });
    const normalized = questions.map(q => ({
      ...q,
      options: padOptions(q.options),
      answer: q.answer != null ? String(q.answer) : '0',
      answers: Array.isArray(q.answers) ? q.answers.map(String) : [],
      blanks: q.blanks || 1,
      solution: q.solution || '',
      image: q.image || '',
      tags: Array.isArray(q.tags) ? q.tags : []
    }));
    adminState.practiceEditor = {
      itemId,
      itemType: itemType || item.type,
      title: item.title || '',
      questions: normalized,
      selectedIndex: normalized.length > 0 ? 0 : -1
    };
    rerender();
  } catch (e) {
    adminState.feedback = { type: 'error', message: `打开编辑器失败: ${e.message}` };
    rerender();
  }
}

function syncPracticeFormToState() {
  const ed = adminState.practiceEditor;
  if (!ed || ed.selectedIndex < 0) return;
  const q = ed.questions[ed.selectedIndex];
  if (!q) return;
  const get = id => { const el = document.getElementById(id); return el ? el.value : null; };
  const title = get('pq-title');
  const content = get('pq-content');
  const solution = get('pq-solution');
  const difficulty = get('pq-difficulty');
  const image = get('pq-image');
  if (title != null) q.title = title;
  if (content != null) q.content = content;
  if (solution != null) q.solution = solution;
  if (difficulty != null) q.difficulty = Number(difficulty);
  if (image != null) q.image = image.trim();
  if (q.question_type === 0 || q.question_type === 1) {
    q.options = [0, 1, 2, 3].map(i => {
      const el = document.getElementById(`pq-opt-${i}`);
      return el ? el.value : (q.options[i] || '');
    });
    if (q.question_type === 1) {
      q.answers = [0, 1, 2, 3].filter(i => {
        const el = document.getElementById(`pq-answer-${i}`);
        return el && el.checked;
      }).map(String);
    } else {
      const ans = get('pq-answer');
      if (ans != null) q.answer = String(ans);
    }
  } else if (q.question_type === 2) {
    const ans = get('pq-answer');
    if (ans != null) q.answer = ans;
    const bl = get('pq-blanks');
    if (bl != null) q.blanks = Number(bl);
  } else {
    const ans = get('pq-answer');
    if (ans != null) q.answer = ans;
  }
}

function updatePracticePreview() {
  const ed = adminState.practiceEditor;
  if (!ed || ed.selectedIndex < 0) return;
  syncPracticeFormToState();
  const q = ed.questions[ed.selectedIndex];
  if (!q) return;
  const preview = document.getElementById('practice-preview');
  if (!preview) return;
  let html = '';
  if (q.title) html += `<h4>${escapeHtml(q.title)}</h4>`;
  if (q.image) html += `<div class="preview-image"><img src="${escapeHtml(q.image)}" alt="题图" style="max-width:100%;max-height:240px;border-radius:8px;"></div>`;
  html += renderMd(q.content || '*无题干*');
  if (q.question_type === 0 || q.question_type === 1) {
    html += '<ol type="A">';
    const ansSet = new Set(q.question_type === 1 ? (q.answers || []) : [String(q.answer)]);
    (q.options || []).forEach((opt, i) => {
      const isAns = ansSet.has(String(i));
      html += `<li class="${isAns ? 'preview-correct' : ''}">${renderMd(opt || '')}</li>`;
    });
    html += '</ol>';
    if (q.question_type === 1) {
      html += `<div class="preview-answer"><strong>正确答案:</strong> ${escapeHtml((q.answers || []).map(a => String.fromCharCode(65 + Number(a))).join(', '))}</div>`;
    }
  } else if (q.question_type === 2) {
    html += `<div class="preview-answer"><strong>答案:</strong> ${escapeHtml(q.answer || '')}</div>`;
    html += `<div class="preview-answer"><strong>空数:</strong> ${escapeHtml(String(q.blanks ?? 1))}</div>`;
  } else {
    html += `<div class="preview-answer"><strong>答案:</strong> ${escapeHtml(q.answer || '')}</div>`;
  }
  if (q.solution) {
    html += `<div class="preview-solution"><strong>解析:</strong> ${renderMd(q.solution)}</div>`;
  }
  preview.innerHTML = html;
  typeset(preview);
}

function practiceSelect(idx) {
  syncPracticeFormToState();
  adminState.practiceEditor.selectedIndex = idx;
  rerender();
}

function practiceAdd() {
  syncPracticeFormToState();
  const ed = adminState.practiceEditor;
  ed.questions.push(createEmptyQuestion(ed.itemId));
  ed.selectedIndex = ed.questions.length - 1;
  rerender();
}

function practiceRemove(idx) {
  const ed = adminState.practiceEditor;
  ed.questions.splice(idx, 1);
  if (ed.selectedIndex >= ed.questions.length) {
    ed.selectedIndex = ed.questions.length - 1;
  }
  rerender();
}

function practiceMove(idx, dir) {
  syncPracticeFormToState();
  const ed = adminState.practiceEditor;
  const newIdx = idx + dir;
  if (newIdx < 0 || newIdx >= ed.questions.length) return;
  const [q] = ed.questions.splice(idx, 1);
  ed.questions.splice(newIdx, 0, q);
  ed.selectedIndex = newIdx;
  rerender();
}

function practiceReorder(oldIndex, newIndex) {
  const ed = adminState.practiceEditor;
  if (!ed) return;
  syncPracticeFormToState();
  const [q] = ed.questions.splice(oldIndex, 1);
  const insertAt = newIndex < oldIndex ? newIndex : newIndex;
  ed.questions.splice(insertAt, 0, q);
  ed.selectedIndex = insertAt;
  rerender();
}

function practiceTypeChange(value) {
  syncPracticeFormToState();
  const ed = adminState.practiceEditor;
  if (ed.selectedIndex < 0) return;
  const q = ed.questions[ed.selectedIndex];
  q.question_type = Number(value);
  // 切换题型时重置题型相关字段
  if (q.question_type === 0 || q.question_type === 1) {
    if (!Array.isArray(q.options) || q.options.length < 4) q.options = padOptions(q.options);
    if (q.question_type === 0) {
      q.answer = '0';
      delete q.answers;
    } else {
      q.answers = [];
      delete q.answer;
    }
  } else if (q.question_type === 2) {
    q.answer = '';
    q.blanks = 1;
    delete q.options;
    delete q.answers;
  } else {
    q.answer = '';
    delete q.options;
    delete q.answers;
  }
  rerender();
}

async function savePractice() {
  try {
    syncPracticeFormToState();
    const ed = adminState.practiceEditor;
    const itemId = ed.itemId;
    for (let i = 0; i < ed.questions.length; i++) {
      const q = ed.questions[i];
      const payload = { ...q };
      if (!Array.isArray(payload.tags)) payload.tags = [];
      if (payload.question_type === 0 || payload.question_type === 1) {
        payload.options = (payload.options || []).slice(0, 4);
        while (payload.options.length < 4) payload.options.push('');
        if (payload.question_type === 1) {
          payload.answers = Array.isArray(payload.answers) ? payload.answers.map(String) : [];
          delete payload.answer;
        } else {
          payload.answer = String(payload.answer ?? '0');
          delete payload.answers;
        }
      } else {
        // 非选择不存 options / answers
        delete payload.options;
        delete payload.answers;
      }
      if (payload.id) {
        const { id, ...updates } = payload;
        await adminApi.updateQuestion(id, updates);
      } else {
        // 新题：客户端生成唯一 ID
        payload.id = `${itemId}-q${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
        await adminApi.createQuestion(payload);
      }
    }
    adminState.feedback = { type: 'success', message: '题目已保存' };
    adminState.practiceEditor = null;
    await loadSectionData(adminState.section);
  } catch (e) {
    adminState.feedback = { type: 'error', message: `保存失败: ${e.message}` };
    rerender();
  }
}

// ─── Init / Action dispatch ───
export async function initAdminPage() {
  if (!isAdmin()) return;
  await loadSectionData(adminState.section);
}

export async function handleAdminAction(action, el) {
  if (!isAdmin()) return;

  switch (action) {
    case 'admin-section': {
      const section = el.dataset.section;
      if (!section) return;
      adminState.section = section;
      adminState.theoryEditor = null;
      adminState.practiceEditor = null;
      await loadSectionData(section);
      break;
    }
    case 'admin-toggle-group': {
      const group = el.dataset.group;
      if (!group) return;
      adminState.collapsedGroups[group] = !adminState.collapsedGroups[group];
      rerender();
      break;
    }
    case 'admin-refresh': {
      await loadSectionData(adminState.section);
      break;
    }
    case 'admin-add': {
      const entity = el.dataset.entity;
      if (!entity || !ENTITY_FIELDS[entity]) return;
      openModal(entity, null, true);
      break;
    }
    case 'admin-edit': {
      const entity = el.dataset.entity;
      const id = el.dataset.id;
      if (!entity || !id) return;
      const row = findRow(entity, id);
      if (!row) {
        adminState.feedback = { type: 'error', message: '未找到记录，可能已被删除' };
        rerender();
        return;
      }
      openModal(entity, row, false);
      break;
    }
    case 'admin-delete': {
      const entity = el.dataset.entity;
      const id = el.dataset.id;
      if (!entity || !id) return;
      await handleDelete(entity, id);
      break;
    }
    case 'admin-modal-close': {
      closeModal();
      break;
    }
    case 'admin-modal-noop': {
      break;
    }
    case 'admin-modal-save': {
      const entity = el.dataset.entity;
      const id = el.dataset.id;
      if (!entity) return;
      await handleSave(entity, id);
      break;
    }
    case 'admin-edit-theory': {
      const itemId = el.dataset.itemId;
      if (!itemId) return;
      await openTheoryEditor(itemId);
      break;
    }
    case 'admin-edit-practice': {
      const itemId = el.dataset.itemId;
      const itemType = el.dataset.itemType;
      if (!itemId) return;
      await openPracticeEditor(itemId, itemType);
      break;
    }
    case 'admin-back-list': {
      adminState.theoryEditor = null;
      adminState.practiceEditor = null;
      rerender();
      break;
    }
    case 'admin-add-example': {
      addTheoryExample();
      break;
    }
    case 'admin-remove-example': {
      const idx = Number(el.dataset.idx);
      if (Number.isNaN(idx)) return;
      removeTheoryExample(idx);
      break;
    }
    case 'admin-toggle-example': {
      const idx = Number(el.dataset.idx);
      if (Number.isNaN(idx)) return;
      toggleTheoryExample(idx);
      break;
    }
    case 'admin-save-theory': {
      await saveTheory();
      break;
    }
    case 'admin-practice-select': {
      const idx = Number(el.dataset.idx);
      if (Number.isNaN(idx)) return;
      practiceSelect(idx);
      break;
    }
    case 'admin-practice-add': {
      practiceAdd();
      break;
    }
    case 'admin-practice-remove': {
      const idx = Number(el.dataset.idx);
      if (Number.isNaN(idx)) return;
      practiceRemove(idx);
      break;
    }
    case 'admin-practice-move-up': {
      const idx = Number(el.dataset.idx);
      if (Number.isNaN(idx)) return;
      practiceMove(idx, -1);
      break;
    }
    case 'admin-practice-move-down': {
      const idx = Number(el.dataset.idx);
      if (Number.isNaN(idx)) return;
      practiceMove(idx, 1);
      break;
    }
    case 'admin-practice-type': {
      const value = el.dataset.value;
      if (value === undefined || value === '') return;
      practiceTypeChange(value);
      break;
    }
    case 'admin-save-practice': {
      await savePractice();
      break;
    }
    default: break;
  }
}
