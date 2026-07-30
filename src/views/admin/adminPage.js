// 管理后台页面：5 个 Tab，对 users / courses / modules / items / questions /
// exam_papers / exam_sections / exam_questions 做 CRUD。所有用户输入经 escapeHtml
// 转义后输出，JSON 字段（options / answers / tags / requirements）以 textarea
// 编辑 JSON 字符串。事件通过 main.js 的 [data-action] 委托分发到 handleAdminAction。

import { isAdmin } from '../../services/auth.js';
import { escapeHtml } from '../../utils.js';
import * as adminApi from '../../services/admin.js';

// ─── Admin state ───
const adminState = {
  tab: 'users',
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
  editing: null, // { entity, row, isNew }
  loading: false,
  feedback: null // { type: 'success'|'error', message: string }
};

const TABS = [
  { id: 'users', label: 'Users' },
  { id: 'courses', label: 'Courses' },
  { id: 'modules-items', label: 'Modules & Items' },
  { id: 'questions', label: 'Questions' },
  { id: 'exam-papers', label: 'Exam Papers' }
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

const TAB_ENTITIES = {
  'users': ['user'],
  'courses': ['course'],
  'modules-items': ['module', 'item'],
  'questions': ['question'],
  'exam-papers': ['exam_paper', 'exam_section', 'exam_question']
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
  user: ['id', 'email', 'role', 'display_name', 'created_at'],
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

// ─── Render ───
function renderTabs() {
  return TABS.map(t => `
    <button type="button"
      class="admin-tab ${t.id === adminState.tab ? 'active' : ''}"
      data-action="admin-tab"
      data-tab="${t.id}">
      ${escapeHtml(t.label)}
    </button>
  `).join('');
}

function renderTable(entity) {
  const rows = adminState.data[dataKeyFor(entity)] || [];
  const columns = ENTITY_COLUMNS[entity];

  return `
    <section class="admin-entity-section">
      <header class="admin-entity-header">
        <h3 class="admin-entity-title">${escapeHtml(ENTITY_LABELS[entity])}</h3>
        <button type="button"
          class="admin-btn admin-btn-primary admin-btn-sm"
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

function renderContent() {
  if (adminState.loading) {
    return `<div class="admin-loading">加载中…</div>`;
  }
  const entities = TAB_ENTITIES[adminState.tab] || [];
  return entities.map(renderTable).join('');
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

const ADMIN_STYLES = `
.admin-page { max-width: 1200px; margin: 0 auto; padding: 1rem; }
.admin-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; }
.admin-title { font-size: 1.5rem; font-weight: 600; color: var(--fg); margin: 0; }
.admin-tabs { display: flex; gap: 0.25rem; border-bottom: 1px solid var(--line); margin-bottom: 1rem; flex-wrap: wrap; }
.admin-tab { padding: 0.5rem 1rem; border: none; background: transparent; color: var(--muted); cursor: pointer; border-bottom: 2px solid transparent; font-size: 0.95rem; }
.admin-tab:hover { color: var(--fg); }
.admin-tab.active { color: var(--fg); border-bottom-color: var(--accent); }
.admin-content { display: flex; flex-direction: column; gap: 1.5rem; }
.admin-entity-section { background: var(--card); border: 1px solid var(--line); border-radius: 8px; padding: 1rem; }
.admin-entity-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem; }
.admin-entity-title { font-size: 1.1rem; font-weight: 600; color: var(--fg); margin: 0; }
.admin-table-wrap { overflow-x: auto; }
.admin-table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
.admin-table th, .admin-table td { padding: 0.5rem 0.75rem; text-align: left; border-bottom: 1px solid var(--line); color: var(--fg); white-space: nowrap; max-width: 320px; overflow: hidden; text-overflow: ellipsis; }
.admin-table th { font-weight: 600; color: var(--muted); }
.admin-table td { vertical-align: top; }
.admin-actions { display: flex; gap: 0.4rem; white-space: nowrap; }
.admin-actions-col { width: 1%; }
.admin-empty { text-align: center; color: var(--muted); padding: 1.5rem; }
.admin-btn { padding: 0.4rem 0.85rem; border: 1px solid var(--line); background: var(--bg); color: var(--fg); border-radius: 6px; cursor: pointer; font-size: 0.85rem; }
.admin-btn:hover { border-color: var(--accent); }
.admin-btn-primary { background: var(--accent); color: var(--bg); border-color: var(--accent); }
.admin-btn-primary:hover { opacity: 0.85; border-color: var(--accent); }
.admin-btn-danger { color: #c0392b; border-color: #c0392b; }
.admin-btn-danger:hover { background: #c0392b; color: #fff; }
.admin-btn-sm { padding: 0.25rem 0.55rem; font-size: 0.8rem; }
.admin-loading { padding: 2rem; text-align: center; color: var(--muted); }
.admin-feedback { padding: 0.75rem 1rem; border-radius: 6px; margin-bottom: 1rem; font-size: 0.9rem; }
.admin-feedback-success { background: rgba(45, 210, 136, 0.15); color: #2dd288; border: 1px solid #2dd288; }
.admin-feedback-error { background: rgba(192, 57, 43, 0.15); color: #c0392b; border: 1px solid #c0392b; }
.admin-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 100; display: flex; align-items: center; justify-content: center; padding: 1rem; }
.admin-modal { background: var(--bg); border: 1px solid var(--line); border-radius: 10px; max-width: 640px; width: 100%; max-height: 90vh; overflow-y: auto; }
.admin-modal-header { display: flex; align-items: center; justify-content: space-between; padding: 1rem 1.25rem; border-bottom: 1px solid var(--line); }
.admin-modal-header h3 { margin: 0; font-size: 1.1rem; color: var(--fg); }
.admin-modal-close { background: none; border: none; color: var(--muted); font-size: 1.5rem; cursor: pointer; line-height: 1; padding: 0; }
.admin-modal-close:hover { color: var(--fg); }
.admin-modal-body { padding: 1.25rem; display: flex; flex-direction: column; gap: 0.85rem; }
.admin-form-row { display: flex; flex-direction: column; gap: 0.3rem; }
.admin-form-label { font-size: 0.85rem; color: var(--muted); }
.admin-form-control input, .admin-form-control select, .admin-form-control textarea { width: 100%; padding: 0.45rem 0.6rem; border: 1px solid var(--line); background: var(--bg); color: var(--fg); border-radius: 6px; font-size: 0.9rem; font-family: inherit; box-sizing: border-box; }
.admin-form-control input:focus, .admin-form-control select:focus, .admin-form-control textarea:focus { outline: none; border-color: var(--accent); }
.admin-form-control textarea { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; resize: vertical; }
.admin-form-control input:disabled, .admin-form-control select:disabled, .admin-form-control textarea:disabled { opacity: 0.55; cursor: not-allowed; }
.admin-modal-footer { padding: 1rem 1.25rem; border-top: 1px solid var(--line); display: flex; justify-content: flex-end; gap: 0.5rem; }
.admin-denied { text-align: center; padding: 4rem 1rem; color: var(--muted); }
.admin-denied h2 { color: var(--fg); margin-bottom: 0.5rem; }
.admin-denied a { color: var(--accent); }
`;

export function renderAdminPage() {
  if (!isAdmin()) {
    return `
      <div class="admin-denied">
        <h2>无权访问</h2>
        <p>此页面仅管理员可用。</p>
        <p><a href="/">返回首页</a></p>
      </div>
    `;
  }
  return `
    <div class="admin-page">
      <style>${ADMIN_STYLES}</style>
      <header class="admin-header">
        <h1 class="admin-title">管理后台</h1>
        <button type="button" class="admin-btn" data-action="admin-refresh">刷新当前 Tab</button>
      </header>
      <nav class="admin-tabs">${renderTabs()}</nav>
      ${renderFeedback()}
      <main class="admin-content" id="admin-content">${renderContent()}</main>
      ${renderModal()}
    </div>
  `;
}

// ─── Action handlers ───
function rerender() {
  const main = document.getElementById('main');
  if (main) main.innerHTML = renderAdminPage();
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

async function loadTabData(tab) {
  adminState.loading = true;
  adminState.feedback = null;
  rerender();
  try {
    if (tab === 'users') {
      adminState.data.users = await adminApi.listUsers();
    } else if (tab === 'courses') {
      adminState.data.courses = await adminApi.listCourses();
    } else if (tab === 'modules-items') {
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
    } else if (tab === 'questions') {
      adminState.data.questions = await adminApi.listQuestions();
    } else if (tab === 'exam-papers') {
      const [papers, sections, questions] = await Promise.all([
        adminApi.listExamPapers(),
        adminApi.listExamSections(),
        adminApi.listExamQuestions()
      ]);
      adminState.data.examPapers = papers;
      adminState.data.examSections = sections;
      adminState.data.examQuestions = questions;
    }
  } catch (e) {
    adminState.feedback = { type: 'error', message: `加载失败: ${e.message}` };
  } finally {
    adminState.loading = false;
    rerender();
  }
}

async function handleSave(entity, id) {
  try {
    const values = collectFormValues(entity);

    if (entity === 'user') {
      // 用户只能改 role / display_name / avatar_url，其余字段忽略
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
      // admin.js 未提供 updateExamSection，编辑态直接报错
      if (id) {
        throw new Error('大题暂不支持编辑，请删除后重建');
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
    await loadTabData(adminState.tab);
  } catch (e) {
    adminState.feedback = { type: 'error', message: `保存失败: ${e.message}` };
    rerender();
  }
}

async function handleDelete(entity, id) {
  const label = ENTITY_LABELS[entity] || entity;
  // 使用 confirm() 做删除确认，避免误删
  if (!confirm(`确认删除此${label}？此操作不可撤销。`)) return;

  try {
    if (entity === 'user') {
      // admin.js 未提供 deleteUser，引导到 Supabase Dashboard
      throw new Error('暂不支持在面板删除用户，请在 Supabase Dashboard → Authentication 处理');
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
    await loadTabData(adminState.tab);
  } catch (e) {
    adminState.feedback = { type: 'error', message: `删除失败: ${e.message}` };
    rerender();
  }
}

export async function initAdminPage() {
  if (!isAdmin()) return;
  await loadTabData(adminState.tab);
}

export async function handleAdminAction(action, el) {
  if (!isAdmin()) return;

  switch (action) {
    case 'admin-tab': {
      const tab = el.dataset.tab;
      if (!tab || tab === adminState.tab) return;
      adminState.tab = tab;
      await loadTabData(tab);
      break;
    }
    case 'admin-refresh': {
      await loadTabData(adminState.tab);
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
      // 点击 modal 内部时阻止冒泡到 overlay 触发关闭
      break;
    }
    case 'admin-modal-save': {
      const entity = el.dataset.entity;
      const id = el.dataset.id;
      if (!entity) return;
      await handleSave(entity, id);
      break;
    }
    default: break;
  }
}
