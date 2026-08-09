// 管理后台页面：左侧分组折叠侧边栏 + 深色主题。
// 内容管理：内容树（课程→模块→小节→题目，分层耦合）/ 期末试卷
// 系统管理：用户 / 设置
// 表格 CRUD 沿用 modal 表单；理论/训练/测试编辑器为内置双栏/三栏布局，实时预览。
// 所有用户输入经 escapeHtml 转义后输出；事件通过 main.js 的 [data-action] 委托分发到 handleAdminAction。

import { isAdmin } from '../../services/auth.js';
import { escapeHtml } from '../../utils.js';
import EasyMDE from 'easymde';
import 'easymde/dist/easymde.min.css';
import Split from 'split.js';
import Sortable from 'sortablejs';
import * as adminApi from '../../services/admin.js';
import { renderMarkdownWithMath } from '../../utils/markdown.js';

// ─── Admin state ───
const adminState = {
  section: 'content-tree',
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
    examQuestions: [],
    knowledgePoints: []
  },
  tree: {
    expanded: {},        // { 'course:<id>': true, 'module:<courseId>|<moduleId>': true }
    selected: null,      // { type: 'course'|'module'|'item', id, courseId?, moduleId? }
    checked: new Set()   // 批量操作选中：key 形如 'course:<id>' / 'module:<courseId>|<moduleId>' / 'item:<id>'
  },
  editing: null, // { entity, row, isNew, context? } — modal 表单；context 用于树上下文预填
  theoryEditor: null, // { itemId, title, course_id, module_id, content, examples, collapsed }
  practiceEditor: null, // { itemId, itemType, title, questions, selectedIndex }
  paperEditor: null, // { id, name, school, college, subject, term, state, questions:[{id,score,source,question}], selectedIndex }
  poolOpen: false, // 期末试卷：从题库添加弹层
  poolSel: [], // 弹层中勾选的共享题库 id
  poolLoaded: false, // 平台题库题目是否已加载
  kpEditor: null, // { source, questionId, questionTitle, itemId, kps:[{kp_id,role,weight,kp}], availableKps:[{id,code,name}], loading, dirty }
  loading: false,
  feedback: null, // { type: 'success'|'error', message }
  previewListenerAttached: false,
  editorInstances: { easyMDEs: [], easyMDEMap: {}, splits: [], sortable: null, treeSortables: [], paperSortable: null }
};

// ─── Sidebar config ───
const SIDEBAR_GROUPS = [
  {
    id: 'content',
    label: '内容管理',
    items: [
      { id: 'content-tree', label: '内容树' },
      { id: 'exams', label: '期末试卷' },
      { id: 'kp', label: '考点' }
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
  'content-tree': '内容树',
  exams: '期末试卷',
  kp: '考点管理',
  users: '用户管理',
  settings: '设置'
};

const SECTION_ENTITIES = {
  exams: ['exam_paper', 'exam_section', 'exam_question'],
  kp: ['knowledge_point'],
  users: ['user']
};

// 小节类型标签：树节点显示用
const ITEM_TYPE_LABELS = {
  theory: '理论',
  quiz: '测验',
  training: '训练',
  review: '复习'
};

// 可在树中创建子项的小节类型（theory 进入理论编辑器，其余进入题集编辑器）
const PRACTICE_ITEM_TYPES = ['quiz', 'training'];

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
  exam_question: '试卷题目',
  knowledge_point: '考点'
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
    { name: 'type', label: '类型', type: 'select', options: ['theory', 'quiz', 'training', 'review'] },
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
    { name: 'name', label: '试卷名称', type: 'text' },
    { name: 'state', label: '状态', type: 'select', options: ['draft', 'published'] },
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
    { name: 'score', label: '分值', type: 'number' },
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
  ],
  knowledge_point: [
    { name: 'id', label: 'ID (UUID)', type: 'text', readOnly: true },
    { name: 'code', label: '代码 (唯一)', type: 'text', immutable: true },
    { name: 'name', label: '名称', type: 'text' },
    { name: 'source', label: '题库', type: 'select', options: ['platform', 'exam'] },
    { name: 'course_id', label: '课程 ID', type: 'text' },
    { name: 'item_id', label: '小节 ID (platform 必填, exam 留空)', type: 'text' },
    { name: 'parent_id', label: '父考点 ID (可选)', type: 'text' },
    { name: 'sort_order', label: '顺序', type: 'number' }
  ]
};

const ENTITY_COLUMNS = {
  user: ['id', 'email', 'role', 'display_name'],
  course: ['id', 'title', 'description'],
  module: ['course_id', 'module_id', 'title', 'order_index'],
  item: ['id', 'course_id', 'module_id', 'title', 'type', 'order_index'],
  question: ['id', 'item_id', 'question_type', 'title', 'difficulty'],
  exam_paper: ['id', 'name', 'state', 'school', 'subject', 'term'],
  exam_section: ['id', 'exam_id', 'title', 'order_index'],
  exam_question: ['id', 'section_id', 'question_type', 'score', 'title', 'order_index'],
  knowledge_point: ['code', 'name', 'source', 'course_id', 'item_id', 'sort_order']
};

// ─── Helpers ───
function dataKeyFor(entity) {
  if (entity === 'exam_paper') return 'examPapers';
  if (entity === 'exam_section') return 'examSections';
  if (entity === 'exam_question') return 'examQuestions';
  if (entity === 'theory_content') return 'theoryContents';
  if (entity === 'knowledge_point') return 'knowledgePoints';
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
    const out = renderMarkdownWithMath(md);
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
                    ${(entity === 'question' || entity === 'exam_question') ? `
                    <button type="button" class="admin-btn admin-btn-sm"
                      data-action="admin-kp-edit"
                      data-source="${entity === 'question' ? 'platform' : 'exam'}"
                      data-id="${escapeHtml(row.id)}"
                      data-title="${escapeHtml(row.title || row.id)}"
                      ${entity === 'question' && row.item_id ? `data-item-id="${escapeHtml(row.item_id)}"` : ''}>考点</button>
                    ` : ''}
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

// ─── Render: editor item list (theory / training) ───
function editorItemFilter(section) {
  if (section === 'theory-editor') return it => it.type === 'theory';
  if (section === 'training-editor') return it => it.type === 'training';
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

// ─── Render: content tree (course → module → item) ───
function treeKey(type, node) {
  if (type === 'course') return `course:${node.id}`;
  if (type === 'module') return `module:${node.course_id}|${node.module_id}`;
  return `item:${node.id}`;
}

function isExpanded(key) {
  return !!adminState.tree.expanded[key];
}

function isSelected(type, node) {
  const sel = adminState.tree.selected;
  if (!sel || sel.type !== type) return false;
  if (type === 'course') return sel.id === node.id;
  if (type === 'module') return sel.courseId === node.course_id && sel.moduleId === node.module_id;
  if (type === 'item') return sel.id === node.id;
  return false;
}

// 批量勾选：key 与 treeKey 同构
function isChecked(type, node) {
  return adminState.tree.checked.has(treeKey(type, node));
}

// 解析 checked key 还原 entity + id（供批量删除用）
function parseCheckedKey(key) {
  const sep = key.indexOf(':');
  if (sep === -1) return null;
  const type = key.slice(0, sep);
  const raw = key.slice(sep + 1);
  if (type === 'course') return { entity: 'course', id: raw };
  if (type === 'module') return { entity: 'module', id: raw }; // raw 形如 courseId|moduleId
  if (type === 'item') return { entity: 'item', id: raw };
  return null;
}

function modulesOfCourse(courseId) {
  return (adminState.data.modules || [])
    .filter(m => m.course_id === courseId)
    .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
}

function itemsOfModule(courseId, moduleId) {
  return (adminState.data.items || [])
    .filter(it => it.course_id === courseId && it.module_id === moduleId)
    .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
}

function questionsOfItem(itemId) {
  return (adminState.data.questions || []).filter(q => q.item_id === itemId);
}

function renderTreePane() {
  const courses = (adminState.data.courses || []).slice();
  if (courses.length === 0) {
    return `<div class="admin-empty">暂无课程，点击右上角「新增课程」开始</div>`;
  }
  return courses.map(c => renderCourseNode(c)).join('');
}

function renderCourseNode(course) {
  const key = treeKey('course', course);
  const expanded = isExpanded(key);
  const selected = isSelected('course', course);
  const checked = isChecked('course', course);
  const modules = modulesOfCourse(course.id);
  const childCount = modules.length;
  return `
    <div class="tree-node tree-level-1 ${selected ? 'selected' : ''}">
      <div class="tree-node-row" data-action="admin-tree-select" data-tree-type="course" data-id="${escapeHtml(course.id)}">
        <input type="checkbox" class="tree-checkbox" data-action="admin-tree-check" data-tree-type="course" data-id="${escapeHtml(course.id)}" ${checked ? 'checked' : ''} title="勾选批量操作">
        <span class="tree-toggle" data-action="admin-tree-toggle" data-tree-type="course" data-id="${escapeHtml(course.id)}">${expanded ? '▾' : '▸'}</span>
        <span class="tree-icon">▶</span>
        <span class="tree-label">${escapeHtml(course.title || course.id)}</span>
        <span class="tree-meta">${childCount} 模块</span>
        <span class="tree-actions">
          <button type="button" class="tree-action-btn" data-action="admin-tree-add" data-tree-type="course" data-id="${escapeHtml(course.id)}" title="新增模块">+</button>
        </span>
      </div>
      ${expanded ? `<div class="tree-children" data-tree-children-of="course:${escapeHtml(course.id)}">${modules.map(m => renderModuleNode(m)).join('')}</div>` : ''}
    </div>
  `;
}

function renderModuleNode(module) {
  const key = treeKey('module', module);
  const expanded = isExpanded(key);
  const selected = isSelected('module', module);
  const checked = isChecked('module', module);
  const items = itemsOfModule(module.course_id, module.module_id);
  const childCount = items.length;
  return `
    <div class="tree-node tree-level-2 ${selected ? 'selected' : ''}" data-module-row="${escapeHtml(module.course_id)}|${escapeHtml(module.module_id)}">
      <div class="tree-node-row" data-action="admin-tree-select" data-tree-type="module" data-id="${escapeHtml(module.course_id)}" data-module-id="${escapeHtml(module.module_id)}">
        <input type="checkbox" class="tree-checkbox" data-action="admin-tree-check" data-tree-type="module" data-id="${escapeHtml(module.course_id)}" data-module-id="${escapeHtml(module.module_id)}" ${checked ? 'checked' : ''} title="勾选批量操作">
        <span class="tree-drag-handle" title="拖拽排序">⋮</span>
        <span class="tree-toggle" data-action="admin-tree-toggle" data-tree-type="module" data-id="${escapeHtml(module.course_id)}" data-module-id="${escapeHtml(module.module_id)}">${expanded ? '▾' : '▸'}</span>
        <span class="tree-icon">■</span>
        <span class="tree-label">${escapeHtml(module.title || module.module_id)}</span>
        <span class="tree-meta">${childCount} 小节</span>
        <span class="tree-actions">
          <button type="button" class="tree-action-btn" data-action="admin-tree-add" data-tree-type="module" data-id="${escapeHtml(module.course_id)}" data-module-id="${escapeHtml(module.module_id)}" title="新增小节">+</button>
        </span>
      </div>
      ${expanded ? `<div class="tree-children" data-tree-children-of="module:${escapeHtml(module.course_id)}|${escapeHtml(module.module_id)}">${items.map(it => renderItemNode(it)).join('')}</div>` : ''}
    </div>
  `;
}

function renderItemNode(item) {
  const selected = isSelected('item', item);
  const checked = isChecked('item', item);
  const typeLabel = ITEM_TYPE_LABELS[item.type] || item.type || '—';
  const isTheory = item.type === 'theory';
  const qCount = isTheory ? (Array.isArray(item.examples) ? item.examples.length : 0) : questionsOfItem(item.id).length;
  const countLabel = isTheory ? `${qCount} 例题` : `${qCount} 题`;
  return `
    <div class="tree-node tree-level-3 ${selected ? 'selected' : ''}" data-item-row="${escapeHtml(item.id)}">
      <div class="tree-node-row" data-action="admin-tree-select" data-tree-type="item" data-id="${escapeHtml(item.id)}">
        <input type="checkbox" class="tree-checkbox" data-action="admin-tree-check" data-tree-type="item" data-id="${escapeHtml(item.id)}" ${checked ? 'checked' : ''} title="勾选批量操作">
        <span class="tree-drag-handle" title="拖拽排序">⋮</span>
        <span class="tree-toggle tree-leaf">•</span>
        <span class="tree-icon tree-icon-${escapeHtml(item.type || 'default')}">${isTheory ? 'T' : 'Q'}</span>
        <span class="tree-label">${escapeHtml(item.title || item.id)}</span>
        <span class="tree-type-badge type-${escapeHtml(item.type || 'default')}">${escapeHtml(typeLabel)}</span>
        <span class="tree-meta">${countLabel}</span>
      </div>
    </div>
  `;
}

function renderTreeDetail() {
  const sel = adminState.tree.selected;
  if (!sel) {
    return `<div class="admin-placeholder">从左侧选择一个节点查看详情，或点击节点旁的 + 添加子项</div>`;
  }
  if (sel.type === 'course') return renderCourseDetail(sel.id);
  if (sel.type === 'module') return renderModuleDetail(sel.courseId, sel.moduleId);
  if (sel.type === 'item') return renderItemDetail(sel.id);
  return '';
}

function renderCourseDetail(courseId) {
  const course = (adminState.data.courses || []).find(c => c.id === courseId);
  if (!course) return `<div class="admin-placeholder">课程不存在</div>`;
  const modules = modulesOfCourse(courseId);
  return `
    <section class="admin-entity-section">
      <header class="admin-entity-header">
        <h3 class="admin-entity-title">课程：${escapeHtml(course.title || course.id)}</h3>
        <div class="admin-main-actions">
          <button type="button" class="admin-btn admin-btn-sm" data-action="admin-tree-add" data-tree-type="course" data-id="${escapeHtml(course.id)}">+ 模块</button>
          <button type="button" class="admin-btn admin-btn-sm" data-action="admin-edit" data-entity="course" data-id="${escapeHtml(course.id)}">编辑</button>
          <button type="button" class="admin-btn admin-btn-sm admin-btn-danger" data-action="admin-tree-delete" data-entity="course" data-id="${escapeHtml(course.id)}">删除</button>
        </div>
      </header>
      <div class="admin-tree-meta">
        <div><span class="admin-form-label">ID</span><code>${escapeHtml(course.id)}</code></div>
        <div><span class="admin-form-label">描述</span><span>${escapeHtml(course.description || '—')}</span></div>
      </div>
    </section>
    <section class="admin-entity-section">
      <header class="admin-entity-header">
        <h3 class="admin-entity-title">模块 (${modules.length})</h3>
      </header>
      <div class="admin-table-wrap">
        <table class="admin-table">
          <thead>
            <tr><th>模块 ID</th><th>标题</th><th>顺序</th><th>小节数</th><th class="admin-actions-col">操作</th></tr>
          </thead>
          <tbody>
            ${modules.length === 0
              ? `<tr><td colspan="5" class="admin-empty">暂无模块</td></tr>`
              : modules.map(m => {
                const cnt = itemsOfModule(m.course_id, m.module_id).length;
                const modEnc = `${m.course_id}|${m.module_id}`;
                return `
                  <tr>
                    <td>${escapeHtml(m.module_id)}</td>
                    <td>${escapeHtml(m.title || '')}</td>
                    <td>${escapeHtml(String(m.order_index ?? ''))}</td>
                    <td>${cnt}</td>
                    <td class="admin-actions">
                      <button type="button" class="admin-btn admin-btn-sm" data-action="admin-tree-select" data-tree-type="module" data-id="${escapeHtml(m.course_id)}" data-module-id="${escapeHtml(m.module_id)}">查看</button>
                      <button type="button" class="admin-btn admin-btn-sm" data-action="admin-edit" data-entity="module" data-id="${escapeHtml(modEnc)}">编辑</button>
                      <button type="button" class="admin-btn admin-btn-sm admin-btn-danger" data-action="admin-tree-delete" data-entity="module" data-id="${escapeHtml(modEnc)}">删除</button>
                    </td>
                  </tr>
                `;
              }).join('')}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function renderModuleDetail(courseId, moduleId) {
  const mod = (adminState.data.modules || []).find(m => m.course_id === courseId && m.module_id === moduleId);
  if (!mod) return `<div class="admin-placeholder">模块不存在</div>`;
  const items = itemsOfModule(courseId, moduleId);
  return `
    <section class="admin-entity-section">
      <header class="admin-entity-header">
        <h3 class="admin-entity-title">模块：${escapeHtml(mod.title || mod.module_id)}</h3>
        <div class="admin-main-actions">
          <button type="button" class="admin-btn admin-btn-sm" data-action="admin-tree-add" data-tree-type="module" data-id="${escapeHtml(courseId)}" data-module-id="${escapeHtml(moduleId)}">+ 小节</button>
          <button type="button" class="admin-btn admin-btn-sm" data-action="admin-edit" data-entity="module" data-id="${escapeHtml(`${courseId}|${moduleId}`)}">编辑</button>
          <button type="button" class="admin-btn admin-btn-sm admin-btn-danger" data-action="admin-tree-delete" data-entity="module" data-id="${escapeHtml(`${courseId}|${moduleId}`)}">删除</button>
        </div>
      </header>
      <div class="admin-tree-meta">
        <div><span class="admin-form-label">课程</span><code>${escapeHtml(courseId)}</code></div>
        <div><span class="admin-form-label">模块 ID</span><code>${escapeHtml(moduleId)}</code></div>
        <div><span class="admin-form-label">顺序</span><span>${escapeHtml(String(mod.order_index ?? ''))}</span></div>
      </div>
    </section>
    <section class="admin-entity-section">
      <header class="admin-entity-header">
        <h3 class="admin-entity-title">小节 (${items.length})</h3>
      </header>
      <div class="admin-table-wrap">
        <table class="admin-table">
          <thead>
            <tr><th>ID</th><th>标题</th><th>类型</th><th>题数</th><th class="admin-actions-col">操作</th></tr>
          </thead>
          <tbody>
            ${items.length === 0
              ? `<tr><td colspan="5" class="admin-empty">暂无小节</td></tr>`
              : items.map(it => {
                const isTheory = it.type === 'theory';
                const cnt = isTheory
                  ? (Array.isArray(it.examples) ? it.examples.length : 0)
                  : questionsOfItem(it.id).length;
                return `
                  <tr>
                    <td>${escapeHtml(it.id)}</td>
                    <td>${escapeHtml(it.title || '')}</td>
                    <td><span class="tree-type-badge type-${escapeHtml(it.type || 'default')}">${escapeHtml(ITEM_TYPE_LABELS[it.type] || it.type || '—')}</span></td>
                    <td>${cnt}</td>
                    <td class="admin-actions">
                      <button type="button" class="admin-btn admin-btn-sm" data-action="admin-tree-select" data-tree-type="item" data-id="${escapeHtml(it.id)}">打开</button>
                      <button type="button" class="admin-btn admin-btn-sm" data-action="admin-edit" data-entity="item" data-id="${escapeHtml(it.id)}">编辑</button>
                      <button type="button" class="admin-btn admin-btn-sm admin-btn-danger" data-action="admin-tree-delete" data-entity="item" data-id="${escapeHtml(it.id)}">删除</button>
                    </td>
                  </tr>
                `;
              }).join('')}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function renderItemDetail(itemId) {
  // 选中 item 节点：交给 openTheoryEditor / openPracticeEditor 在 mountAdmin 后跳转。
  // 此处仅返回占位，实际切换由 selectTreeNode 在 rerender 前完成。
  const item = (adminState.data.items || []).find(it => it.id === itemId);
  if (!item) return `<div class="admin-placeholder">小节不存在</div>`;
  return `<div class="admin-placeholder">正在打开「${escapeHtml(item.title || item.id)}」编辑器…</div>`;
}

function renderContentTree() {
  return `
    <div class="admin-tree-layout">
      <div class="admin-tree-pane">
        <div class="admin-tree-pane-header">
          <span class="admin-form-label">内容结构</span>
        </div>
        <div class="admin-tree-pane-body">${renderTreePane()}</div>
      </div>
      <div class="admin-tree-detail">${renderTreeDetail()}</div>
    </div>
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
          <div class="admin-form-label">选项（点击字母标记正确答案）</div>
          <div class="theory-opt-list">${[0, 1, 2, 3].map(i => `
            <div class="theory-opt-row">
              <span class="theory-opt-key ${answer === i ? 'checked' : ''}" data-action="admin-mark-example-opt" data-idx="${idx}" data-opt="${i}">${String.fromCharCode(65 + i)}</span>
              <input type="text" id="theory-ex-${idx}-opt-${i}" value="${escapeHtml(opts[i] || '')}" placeholder="选项 ${String.fromCharCode(65 + i)}">
            </div>
          `).join('')}</div>
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
        <div class="admin-form-label">选项（点击字母标记正确答案${isMulti ? '，可多选' : ''}）</div>
        <div class="theory-opt-list">${[0, 1, 2, 3].map(i => `
          <div class="theory-opt-row">
            <span class="theory-opt-key ${(isMulti ? answersArr.map(String).includes(String(i)) : answerStr === String(i)) ? 'checked' : ''}" data-action="admin-practice-mark" data-opt="${i}">${String.fromCharCode(65 + i)}</span>
            <textarea id="pq-opt-${i}" class="admin-md-textarea" rows="1" placeholder="选项 ${String.fromCharCode(65 + i)}">${escapeHtml(opts[i] || '')}</textarea>
          </div>
        `).join('')}</div>
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
  if (adminState.paperEditor) return renderPaperEditor();

  const section = adminState.section;
  if (section === 'settings') {
    return `<div class="admin-placeholder">设置功能开发中</div>`;
  }
  if (section === 'content-tree') {
    return renderContentTree();
  }
  if (section === 'exams') {
    return renderExams();
  }
  const entities = SECTION_ENTITIES[section];
  if (entities) return entities.map(renderTable).join('');
  return '';
}

function renderFeedback() {
  if (!adminState.feedback) return '';
  const { type, message } = adminState.feedback;
  const cls = type === 'success' ? 'admin-feedback-success' : 'admin-feedback-error';
  return `<div class="admin-feedback ${cls}">${escapeHtml(message)}</div>`;
}

function renderField(field, row, isNew) {
  const value = row ? row[field.name] : '';
  const fieldId = `admin-field-${field.name}`;
  const isEditing = !!row && !isNew;
  // 新增时若字段由树上下文提供（context），同样禁用
  const ctx = adminState.editing && adminState.editing.context || null;
  const fromContext = isNew && ctx && Object.prototype.hasOwnProperty.call(ctx, field.name);
  const disabled = field.readOnly || (isEditing && field.immutable) || fromContext;
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

  const hint = fromContext ? `<span class="admin-field-hint">由树上下文自动关联</span>` : '';
  return `
    <div class="admin-form-row">
      <label for="${fieldId}" class="admin-form-label">${escapeHtml(field.label)}${field.json ? ' (JSON)' : ''}</label>
      <div class="admin-form-control">${control}${hint}</div>
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
          ${fields.map(f => renderField(f, row, isNew)).join('')}
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

// 考点关联编辑器 (modal 风格, 独立于 adminState.editing)
function renderKpEditor() {
  if (!adminState.kpEditor) return '';
  const ed = adminState.kpEditor;

  const primaryKp = ed.kps.find(k => k.role === 'primary');
  const secondaryKps = ed.kps.filter(k => k.role === 'secondary');

  // 主考点下拉: 全部可选 kp (含当前 primary)
  const primaryOptions = ed.availableKps.map(kp => {
    const sel = primaryKp && primaryKp.kp_id === kp.id ? 'selected' : '';
    return `<option value="${escapeHtml(kp.id)}" ${sel}>${escapeHtml(kp.code)} · ${escapeHtml(kp.name)}</option>`;
  });

  // 次考点添加下拉: 排除已加入的 (primary + secondary)
  const usedIds = new Set(ed.kps.map(k => k.kp_id));
  const secondaryAddOptions = ed.availableKps
    .filter(kp => !usedIds.has(kp.id))
    .map(kp => `<option value="${escapeHtml(kp.id)}">${escapeHtml(kp.code)} · ${escapeHtml(kp.name)}</option>`);

  const body = ed.loading
    ? `<div class="admin-kp-loading">加载中...</div>`
    : `
      <div class="admin-kp-section">
        <h4 class="admin-kp-section-title">主考点 <span class="admin-kp-hint">(至多 1 个, 权重 1.0)</span></h4>
        <select id="admin-kp-primary" data-field="primary-kp" class="admin-kp-select">
          <option value="">— 未设置 —</option>
          ${primaryOptions.join('')}
        </select>
      </div>
      <div class="admin-kp-section">
        <h4 class="admin-kp-section-title">次考点 <span class="admin-kp-hint">(权重 0.5)</span></h4>
        <div class="admin-kp-secondary-list">
          ${secondaryKps.length === 0
            ? `<div class="admin-kp-empty">暂无次考点</div>`
            : secondaryKps.map(k => `
              <div class="admin-kp-chip-row">
                <span class="admin-kp-chip-name">${escapeHtml(k.kp?.code || '')} · ${escapeHtml(k.kp?.name || '未知')}</span>
                <button type="button" class="admin-btn admin-btn-sm admin-btn-danger"
                  data-action="admin-kp-remove"
                  data-kp-id="${escapeHtml(k.kp_id)}">移除</button>
              </div>
            `).join('')}
        </div>
        <div class="admin-kp-add-row">
          <select id="admin-kp-secondary-add" class="admin-kp-select">
            <option value="">— 选择考点添加 —</option>
            ${secondaryAddOptions.join('')}
          </select>
          <button type="button" class="admin-btn admin-btn-sm admin-btn-primary"
            data-action="admin-kp-add-secondary">+ 添加</button>
        </div>
      </div>
      ${ed.availableKps.length === 0 ? `
        <div class="admin-kp-warn">当前${ed.source === 'platform' ? '小节' : '学科'}下尚无考点, 请先到「考点管理」section 新建考点。</div>
      ` : ''}
    `;

  return `
    <div class="admin-modal-overlay" id="admin-kp-overlay" data-action="admin-kp-close">
      <div class="admin-modal" data-action="admin-modal-noop">
        <header class="admin-modal-header">
          <h3>考点关联 · ${escapeHtml(ed.questionTitle || ed.questionId)}</h3>
          <button type="button" class="admin-modal-close" data-action="admin-kp-close" aria-label="关闭">×</button>
        </header>
        <div class="admin-modal-body">
          ${body}
        </div>
        <footer class="admin-modal-footer">
          <button type="button" class="admin-btn" data-action="admin-kp-close">取消</button>
          <button type="button" class="admin-btn admin-btn-primary"
            data-action="admin-kp-save"
            ${ed.loading ? 'disabled' : ''}>保存</button>
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
  /* 全屏：宽度占满视口（突破 main-content 的 max-w-7xl 与 padding），高度 = 视口 - 顶部 header(64px)；不 fixed，不挡 header */
  width: 100vw;
  min-width: 100vw;
  margin-left: calc(50% - 50vw);
  margin-right: calc(50% - 50vw);
  box-sizing: border-box;
  min-height: calc(100vh - 64px);
  background: var(--ad-bg);
  color: var(--ad-fg);
  padding: 0.75rem 1rem 2rem;
  overflow-x: hidden;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}
/* admin 容器：消除 main-content 带来的 padding（main-content 把 admin-page 包在 py-8 px-4 lg:px-10 里，用负外边距拉满） */
.admin-page {
  margin-top: -2rem; /* 抵消 py-8 */
  padding-top: calc(2rem + 0.75rem);
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
/* 全局控件兜底：所有 admin-page 下的原生 input/textarea/select 全部暗底，防止白框 */
.admin-page input[type="text"],
.admin-page input[type="number"],
.admin-page input[type="password"],
.admin-page input[type="email"],
.admin-page input[type="search"],
.admin-page input:not([type]),
.admin-page textarea,
.admin-page select {
  background: var(--ad-bg);
  color: var(--ad-fg);
  border: 1px solid var(--ad-border);
  border-radius: 6px;
  padding: 0.4rem 0.6rem;
  font-size: 0.875rem;
  font-family: inherit;
  width: 100%;
  box-sizing: border-box;
  -webkit-appearance: none;
  appearance: none;
}
.admin-page input[type="text"]:focus,
.admin-page input[type="number"]:focus,
.admin-page input[type="password"]:focus,
.admin-page input[type="email"]:focus,
.admin-page input[type="search"]:focus,
.admin-page input:not([type]):focus,
.admin-page textarea:focus,
.admin-page select:focus {
  outline: none;
  border-color: var(--ad-green-hl);
  box-shadow: 0 0 0 1px rgba(74, 222, 128, 0.25);
}
/* 占位符颜色统一 */
.admin-page input::placeholder,
.admin-page textarea::placeholder {
  color: var(--ad-disabled);
  opacity: 1;
}
.admin-page .admin-form-row { display: flex; flex-direction: column; gap: 0.3rem; margin-bottom: 0.6rem; }
.admin-page .admin-form-label { font-size: 0.8rem; color: var(--ad-muted); }
.admin-page .admin-form-control input,
.admin-page .admin-form-control select,
.admin-page .admin-form-control textarea,
.admin-page .admin-md-textarea,
.admin-page .practice-form input,
.admin-page .practice-form select,
.admin-page .practice-form textarea,
.admin-page .paper-form input,
.admin-page .paper-form select,
.admin-page .paper-form textarea,
.admin-page .theory-example-body select,
.admin-page .theory-example-body textarea,
.admin-page .theory-example-body input,
.admin-page #theory-content {
  width: 100%; padding: 0.4rem 0.6rem;
  border: 1px solid var(--ad-border); background: var(--ad-bg);
  color: var(--ad-fg); border-radius: 6px;
  font-size: 0.875rem; font-family: inherit;
  box-sizing: border-box;
}
.admin-page .admin-md-textarea { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; resize: none; overflow: hidden; line-height: 1.5; }
.admin-page .practice-form input:focus,
.admin-page .practice-form select:focus,
.admin-page .practice-form textarea:focus,
.admin-page .paper-form input:focus,
.admin-page .paper-form select:focus,
.admin-page .paper-form textarea:focus,
.admin-page .theory-example-body input:focus,
.admin-page .theory-example-body select:focus,
.admin-page .theory-example-body textarea:focus,
.admin-page #theory-content:focus,
.admin-page .admin-form-control input:focus,
.admin-page .admin-form-control select:focus,
.admin-page .admin-form-control textarea:focus,
.admin-page input[type="text"]:focus,
.admin-page input[type="number"]:focus,
.admin-page input:not([type]):focus,
.admin-page textarea:focus,
.admin-page select:focus {
  outline: none; border-color: var(--ad-green-hl);
  box-shadow: 0 0 0 1px rgba(74, 222, 128, 0.25) !important;
}
/* EasyMDE dark theme override (fixes black-on-black invisible text) */
.admin-page .EasyMDEContainer .CodeMirror {
  background: var(--ad-bg);
  color: var(--ad-fg);
  border-color: var(--ad-border);
}
.admin-page .EasyMDEContainer .CodeMirror-scroll,
.admin-page .EasyMDEContainer .CodeMirror-gutters {
  background: var(--ad-bg);
}
.admin-page .EasyMDEContainer .CodeMirror-cursor { border-color: var(--ad-fg); }
.admin-page .EasyMDEContainer .CodeMirror-selected { background: rgba(74, 222, 128, 0.2) !important; }
.admin-page .EasyMDEContainer .cm-header { color: var(--ad-green-hl); }
.admin-page .EasyMDEContainer .cm-strong { color: var(--ad-fg); font-weight: 700; }
.admin-page .EasyMDEContainer .cm-em { color: var(--ad-fg); font-style: italic; }
.admin-page .EasyMDEContainer .cm-link,
.admin-page .EasyMDEContainer .cm-url { color: var(--ad-green-hl); }
.admin-page .EasyMDEContainer .cm-quote,
.admin-page .EasyMDEContainer .cm-comment { color: var(--ad-muted); }
.admin-page .EasyMDEContainer .cm-string,
.admin-page .EasyMDEContainer .cm-tag { color: var(--ad-green-hl); }
.admin-page .EasyMDEContainer .editor-toolbar {
  background: var(--ad-bg-card);
  border-color: var(--ad-border);
}
.admin-page .EasyMDEContainer .editor-toolbar button {
  color: var(--ad-fg) !important;
}
.admin-page .EasyMDEContainer .editor-toolbar button:hover,
.admin-page .EasyMDEContainer .editor-toolbar button.active {
  background: var(--ad-bg-hover);
  border-color: var(--ad-border);
}
.admin-page .EasyMDEContainer .editor-statusbar {
  background: var(--ad-bg-card);
  color: var(--ad-muted);
  border-color: var(--ad-border);
}
.admin-page .EasyMDEContainer .editor-preview,
.admin-page .EasyMDEContainer .editor-preview-side {
  background: var(--ad-bg-card);
  color: var(--ad-fg);
  border-color: var(--ad-border);
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
.admin-page .admin-kp-section { display: flex; flex-direction: column; gap: 0.5rem; }
.admin-page .admin-kp-section-title { font-size: 0.85rem; font-weight: 600; color: var(--ad-fg); margin: 0; }
.admin-page .admin-kp-hint { font-size: 0.7rem; font-weight: 400; color: var(--ad-muted); }
.admin-page .admin-kp-select { width: 100%; padding: 0.4rem 0.5rem; background: var(--ad-bg); border: 1px solid var(--ad-border); border-radius: 6px; color: var(--ad-fg); font-size: 0.85rem; }
.admin-page .admin-kp-secondary-list { display: flex; flex-direction: column; gap: 0.4rem; }
.admin-page .admin-kp-chip-row { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; padding: 0.35rem 0.6rem; background: var(--ad-green-soft); border: 1px solid var(--ad-border); border-radius: 6px; }
.admin-page .admin-kp-chip-name { font-size: 0.8rem; color: var(--ad-fg); }
.admin-page .admin-kp-empty { font-size: 0.8rem; color: var(--ad-muted); padding: 0.35rem 0; }
.admin-page .admin-kp-add-row { display: flex; gap: 0.5rem; margin-top: 0.4rem; }
.admin-page .admin-kp-add-row .admin-kp-select { flex: 1; }
.admin-page .admin-kp-warn { font-size: 0.75rem; color: var(--ad-danger); padding: 0.5rem; background: rgba(229,101,74,0.08); border: 1px solid rgba(229,101,74,0.3); border-radius: 6px; }
.admin-page .admin-kp-loading { padding: 2rem; text-align: center; color: var(--ad-muted); }
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
/* 紧凑选项：字母键 + 单行输入（理论例题 / 训练 / 期末试卷共用） */
.admin-page .theory-opt-list { display: flex; flex-direction: column; gap: 0; border: 1px solid var(--ad-border); border-radius: 6px; overflow: hidden; }
.admin-page .theory-opt-row { display: flex; gap: 0.5rem; align-items: center; padding: 0.35rem 0.5rem; border-bottom: 1px solid var(--ad-border); }
.admin-page .theory-opt-row:last-child { border-bottom: none; }
.admin-page .theory-opt-row:hover { background: var(--ad-bg-hover); }
.admin-page .theory-opt-key {
  width: 26px; height: 26px; border-radius: 7px;
  border: 1px solid var(--ad-border); background: var(--ad-bg-hover);
  display: grid; place-items: center; flex-shrink: 0;
  font-size: 0.75rem; font-weight: 700; color: var(--ad-muted);
  cursor: pointer; transition: 0.15s; user-select: none;
}
.admin-page .theory-opt-key:hover { border-color: var(--ad-green-hl); color: var(--ad-green-hl); }
.admin-page .theory-opt-key.checked { background: var(--ad-green-hl); color: #08231a; border-color: var(--ad-green-hl); }
.admin-page .theory-opt-row input, .admin-page .theory-opt-row textarea { flex: 1; min-width: 0; }
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
.admin-page .paper-editor .practice-list, .admin-page .paper-editor .paper-list { width: 280px; min-width: 0; }
.admin-page .paper-list .paper-meta { border-bottom: 1px dashed var(--ad-border); padding-bottom: 0.6rem; margin-bottom: 0.4rem; }
.admin-page .paper-list .paper-meta .row2, .admin-page .paper-list .paper-meta .row4 { grid-template-columns: 1fr; }
.admin-page .paper-source { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.6rem; }
.admin-page .paper-source .admin-form-label { margin: 0; }
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
/* Content tree */
.admin-page .admin-tree-layout { display: flex; gap: 1rem; min-height: 70vh; }
.admin-page .admin-tree-pane {
  width: 320px; flex-shrink: 0;
  background: var(--ad-bg-card); border: 1px solid var(--ad-border); border-radius: 8px;
  display: flex; flex-direction: column; overflow: hidden;
}
.admin-page .admin-tree-pane-header {
  padding: 0.6rem 0.75rem; border-bottom: 1px solid var(--ad-border);
  display: flex; align-items: center; justify-content: space-between;
}
.admin-page .admin-tree-pane-body { flex: 1; overflow-y: auto; padding: 0.4rem; }
.admin-page .admin-tree-detail { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 1rem; }
.admin-page .tree-node { display: flex; flex-direction: column; }
.admin-page .tree-node-row {
  display: flex; align-items: center; gap: 0.4rem;
  padding: 0.35rem 0.5rem; border-radius: 6px;
  cursor: pointer; font-size: 0.85rem; color: var(--ad-fg);
  user-select: none; position: relative;
}
.admin-page .tree-node-row:hover { background: var(--ad-bg-hover); }
.admin-page .tree-node.selected > .tree-node-row {
  background: var(--ad-green-soft); color: var(--ad-green-hl);
  box-shadow: inset 2px 0 0 var(--ad-green-hl);
}
.admin-page .tree-toggle {
  width: 1rem; text-align: center; color: var(--ad-muted);
  cursor: pointer; font-size: 0.7rem; flex-shrink: 0;
}
.admin-page .tree-toggle:hover { color: var(--ad-green-hl); }
.admin-page .tree-leaf { cursor: default; }
.admin-page .tree-checkbox {
  width: 0.95rem; height: 0.95rem; cursor: pointer; flex-shrink: 0;
  accent-color: var(--ad-green-hl, #2dd288);
  margin: 0;
}
.admin-page .tree-drag-handle {
  width: 0.9rem; text-align: center; color: var(--ad-muted);
  cursor: grab; font-size: 0.85rem; flex-shrink: 0; opacity: 0;
  transition: opacity 0.12s;
}
.admin-page .tree-node-row:hover .tree-drag-handle { opacity: 1; }
.admin-page .tree-drag-handle:active { cursor: grabbing; }
.admin-page .tree-drag-handle:hover { color: var(--ad-green-hl); }
.admin-page .tree-children > .tree-node.sortable-ghost { opacity: 0.4; }
.admin-page .tree-children > .tree-node.sortable-chosen { background: var(--ad-green-soft); border-radius: 6px; }
.admin-page .tree-icon {
  width: 1.2rem; height: 1.2rem; display: inline-flex; align-items: center; justify-content: center;
  font-size: 0.7rem; font-weight: 700; color: var(--ad-muted);
  border: 1px solid var(--ad-border); border-radius: 4px; flex-shrink: 0;
}
.admin-page .tree-icon-theory { color: #6ee7b7; border-color: #1a3c34; background: rgba(106,233,183,0.06); }
.admin-page .tree-icon-training { color: #93c5fd; border-color: #1e3a5f; background: rgba(147,197,253,0.06); }
.admin-page .tree-icon-quiz { color: #fbbf24; border-color: #4a3a1a; background: rgba(251,191,36,0.06); }
.admin-page .tree-label { flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.admin-page .tree-meta { font-size: 0.7rem; color: var(--ad-muted); flex-shrink: 0; }
.admin-page .tree-node.selected .tree-meta { color: var(--ad-green-hl); opacity: 0.8; }
.admin-page .tree-actions { display: none; gap: 0.2rem; flex-shrink: 0; }
.admin-page .tree-node-row:hover .tree-actions { display: flex; }
.admin-page .tree-action-btn {
  width: 1.4rem; height: 1.4rem; padding: 0;
  border: 1px solid var(--ad-border); background: var(--ad-bg);
  color: var(--ad-muted); border-radius: 4px;
  cursor: pointer; font-size: 0.85rem; line-height: 1; font-family: inherit;
}
.admin-page .tree-action-btn:hover { border-color: var(--ad-green-hl); color: var(--ad-green-hl); background: var(--ad-green-soft); }
.admin-page .tree-children { padding-left: 1rem; border-left: 1px dashed var(--ad-border); margin-left: 0.85rem; margin-top: 0.1rem; }
.admin-page .tree-type-badge {
  font-size: 0.65rem; padding: 0.1rem 0.4rem; border-radius: 3px;
  border: 1px solid var(--ad-border); color: var(--ad-muted); flex-shrink: 0;
}
.admin-page .tree-type-badge.type-theory { color: #6ee7b7; border-color: #1a3c34; }
.admin-page .tree-type-badge.type-training { color: #93c5fd; border-color: #1e3a5f; }
.admin-page .tree-type-badge.type-quiz { color: #fbbf24; border-color: #4a3a1a; }
.admin-page .admin-tree-meta { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 0.6rem; padding: 0.6rem 0; }
.admin-page .admin-tree-meta > div { display: flex; flex-direction: column; gap: 0.2rem; }
.admin-page .admin-tree-meta code { font-family: ui-monospace, Menlo, Consolas, monospace; font-size: 0.8rem; color: var(--ad-green-hl); word-break: break-all; }
.admin-page .admin-field-hint { display: block; font-size: 0.7rem; color: var(--ad-muted); margin-top: 0.2rem; font-style: italic; }
@media (max-width: 900px) {
  .admin-page .admin-editor { flex-direction: column; }
  .admin-page .practice-list { width: 100%; }
  .admin-page .admin-tree-layout { flex-direction: column; }
  .admin-page .admin-tree-pane { width: 100%; max-height: 40vh; }
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
              ${(adminState.theoryEditor || adminState.practiceEditor || adminState.paperEditor) ? `
                <button type="button" class="admin-btn" data-action="admin-back-list">返回列表</button>
                ${adminState.theoryEditor ? `<button type="button" class="admin-btn admin-btn-primary" data-action="admin-save-theory">保存</button>` : ''}
                ${adminState.practiceEditor ? `<button type="button" class="admin-btn admin-btn-primary" data-action="admin-save-practice">保存全部</button>` : ''}
                ${adminState.paperEditor ? `
                  <button type="button" class="admin-btn" data-action="admin-paper-preview-current">预览</button>
                  ${adminState.paperEditor.state === 'published'
                    ? `<button type="button" class="admin-btn admin-btn-danger" data-action="admin-paper-withdraw" data-id="${escapeHtml(adminState.paperEditor.id || '')}">撤回</button>`
                    : `<button type="button" class="admin-btn admin-btn-primary" data-action="admin-paper-publish-current">发布</button>`}
                  <button type="button" class="admin-btn admin-btn-primary" data-action="admin-save-paper">保存</button>
                ` : ''}
              ` : `
                ${adminState.section === 'content-tree' ? `
                  <button type="button" class="admin-btn admin-btn-primary" data-action="admin-add" data-entity="course">+ 新增课程</button>
                  <button type="button" class="admin-btn admin-btn-danger"
                    data-action="admin-tree-batch-delete"
                    ${adminState.tree.checked.size === 0 ? 'disabled' : ''}>
                    批量删除 (${adminState.tree.checked.size})
                  </button>
                  <button type="button" class="admin-btn"
                    data-action="admin-tree-clear-checks"
                    ${adminState.tree.checked.size === 0 ? 'disabled' : ''}>清空勾选</button>
                ` : ''}
                ${adminState.section === 'kp' ? `
                  <button type="button" class="admin-btn admin-btn-primary" data-action="admin-add" data-entity="knowledge_point">+ 新增考点</button>
                ` : ''}
                ${adminState.section === 'exams' ? `
                  <button type="button" class="admin-btn admin-btn-primary" data-action="admin-paper-new">+ 新建试卷</button>
                ` : ''}
                <button type="button" class="admin-btn" data-action="admin-refresh">刷新</button>
              `}
            </div>
          </header>
          ${renderFeedback()}
          <main class="admin-content" id="admin-content">${renderContent()}</main>
        </div>
      </div>
      ${renderModal()}
      ${renderKpEditor()}
      ${renderPoolOverlay()}
      ${renderPreviewOverlay()}
    </div>
  `;
}

// ─── Mount / rerender ───
function getEasyMDEValue(textareaId, fallbackEl) {
  const editor = adminState.editorInstances.easyMDEMap[textareaId];
  if (editor) return editor.value();
  return fallbackEl ? fallbackEl.value : '';
}

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
    } else if (textareaId.startsWith('theory-ex-')) {
      syncTheoryFormToState();
      updateTheoryPreview();
    } else {
      syncPracticeFormToState();
      updatePracticePreview();
    }
  });
  adminState.editorInstances.easyMDEs.push(editor);
  adminState.editorInstances.easyMDEMap[textareaId] = editor;
  return editor;
}

function initEditors() {
  if (adminState.theoryEditor) {
    initEasyMDE('theory-content');
    (adminState.theoryEditor.examples || []).forEach((_, idx) => {
      initEasyMDE(`theory-ex-${idx}-text`);
      initEasyMDE(`theory-ex-${idx}-solution`);
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

// 方案 C：textarea 随内容自动长高（scrollHeight 技巧），解决解析/题干等长文本只能上下滑动的问题
function autoResizeTextarea(el) {
  if (!el) return;
  el.style.height = 'auto';
  el.style.height = el.scrollHeight + 'px';
}
function initAutoResize() {
  // 仅处理原生 textarea（EasyMDE 接管的 CodeMirror 不在此列，它们有自己的高度逻辑）
  document.querySelectorAll('.admin-page textarea').forEach(el => {
    if (el.dataset.autoResize) return;
    el.dataset.autoResize = '1';
    autoResizeTextarea(el);
    el.addEventListener('input', () => autoResizeTextarea(el));
  });
}

// 内容树拖拽排序：仅对展开的 .tree-children 容器挂载，handle 用 .tree-drag-handle
function initTreeSortables() {
  if (adminState.section !== 'content-tree') return;
  if (adminState.theoryEditor || adminState.practiceEditor) return;
  const containers = document.querySelectorAll('.tree-children');
  containers.forEach(container => {
    const childrenOf = container.dataset.treeChildrenOf;
    if (!childrenOf) return;
    const inst = Sortable.create(container, {
      handle: '.tree-drag-handle',
      animation: 150,
      onEnd: evt => {
        if (evt.oldIndex === evt.newIndex) return;
        // 收集拖后顺序：从 DOM 上读 data-module-row / data-item-row
        const rows = container.querySelectorAll(':scope > .tree-node');
        const orderedIds = [];
        rows.forEach(r => {
          if (childrenOf.startsWith('course:')) {
            const enc = r.dataset.moduleRow;
            if (enc) orderedIds.push(enc);
          } else if (childrenOf.startsWith('module:')) {
            const id = r.dataset.itemRow;
            if (id) orderedIds.push(id);
          }
        });
        if (orderedIds.length > 0) {
          handleTreeReorder(childrenOf, orderedIds);
        }
      }
    });
    adminState.editorInstances.treeSortables.push(inst);
  });
}

function mountAdmin() {
  // 实时预览：在稳定的 #main 上挂一次 input 监听，用 flag 防重复
  const main = document.getElementById('main');
  if (main && !adminState.previewListenerAttached) {
    main.addEventListener('input', () => {
      if (adminState.theoryEditor) updateTheoryPreview();
      else if (adminState.practiceEditor) updatePracticePreview();
      else if (adminState.paperEditor) { paperSyncMeta(); updatePaperPreview(); }
    });
    adminState.previewListenerAttached = true;
  }
  // 首次挂载后渲染一次预览
  if (adminState.theoryEditor) updateTheoryPreview();
  else if (adminState.practiceEditor) updatePracticePreview();
  else if (adminState.paperEditor) updatePaperPreview();
  // 挂载编辑器增强组件
  initEditors();
  initSplits();
  initAutoResize();
  initSortable();
  initTreeSortables();
  initPaperSortable();
}

function cleanupEditors() {
  const { editorInstances } = adminState;
  editorInstances.easyMDEs.forEach(e => {
    try { e.toTextArea(); } catch (_) {}
  });
  editorInstances.easyMDEs = [];
  editorInstances.easyMDEMap = {};
  editorInstances.splits.forEach(s => {
    try { s.destroy(); } catch (_) {}
  });
  editorInstances.splits = [];
  if (editorInstances.sortable) {
    try { editorInstances.sortable.destroy(); } catch (_) {}
    editorInstances.sortable = null;
  }
  if (editorInstances.paperSortable) {
    try { editorInstances.paperSortable.destroy(); } catch (_) {}
    editorInstances.paperSortable = null;
  }
  editorInstances.treeSortables.forEach(s => {
    try { s.destroy(); } catch (_) {}
  });
  editorInstances.treeSortables = [];
}

function rerender() {
  const main = document.getElementById('main');
  if (!main) return;
  cleanupEditors();
  main.innerHTML = renderAdminPage();
  mountAdmin();
}

function openModal(entity, row, isNew, context) {
  const baseRow = row || {};
  // 新增时合并 context 作为预填值
  const merged = isNew && context ? { ...context, ...baseRow } : baseRow;
  adminState.editing = { entity, row: merged, isNew, context: isNew && context ? context : null };
  rerender();
}

function closeModal() {
  adminState.editing = null;
  rerender();
}

// ─── Kp editor helpers ───
async function openKpEditor(source, questionId, questionTitle, itemId) {
  adminState.kpEditor = {
    source, questionId, questionTitle, itemId,
    kps: [], availableKps: [], loading: true
  };
  rerender();
  try {
    const [rawKps, availableKps] = await Promise.all([
      adminApi.listQuestionKps(questionId),
      adminApi.listKnowledgePoints(
        source === 'platform' ? { source: 'platform', itemId } : { source: 'exam' }
      )
    ]);
    // 归一化: listQuestionKps 返回 { kp_id, role, weight, knowledge_points: {...} }
    const kps = (rawKps || []).map(row => {
      const kp = Array.isArray(row.knowledge_points) ? row.knowledge_points[0] : row.knowledge_points;
      return { kp_id: row.kp_id, role: row.role, weight: row.weight, kp: kp || null };
    });
    adminState.kpEditor.kps = kps;
    adminState.kpEditor.availableKps = availableKps || [];
    adminState.kpEditor.loading = false;
  } catch (e) {
    adminState.feedback = { type: 'error', message: `加载考点失败: ${e.message || e}` };
    adminState.kpEditor = null;
  }
  rerender();
}

function addKpSecondary() {
  const ed = adminState.kpEditor;
  if (!ed || ed.loading) return;
  const sel = document.getElementById('admin-kp-secondary-add');
  if (!sel || !sel.value) return;
  const kp = ed.availableKps.find(k => k.id === sel.value);
  if (!kp) return;
  // 避免重复添加
  if (ed.kps.some(k => k.kp_id === kp.id)) return;
  ed.kps.push({ kp_id: kp.id, role: 'secondary', weight: 0.5, kp: { id: kp.id, code: kp.code, name: kp.name } });
  rerender();
}

function removeKp(kpId) {
  const ed = adminState.kpEditor;
  if (!ed) return;
  ed.kps = ed.kps.filter(k => k.kp_id !== kpId);
  rerender();
}

async function saveKpEditor() {
  const ed = adminState.kpEditor;
  if (!ed || ed.loading) return;
  // 读主考点下拉
  const primarySel = document.getElementById('admin-kp-primary');
  const primaryKpId = primarySel ? primarySel.value : '';
  // 构造 kps 数组
  const kps = [];
  if (primaryKpId) kps.push({ kp_id: primaryKpId, role: 'primary' });
  ed.kps.filter(k => k.role === 'secondary').forEach(k => {
    kps.push({ kp_id: k.kp_id, role: 'secondary' });
  });
  try {
    await adminApi.replaceQuestionKps(ed.questionId, kps);
    adminState.feedback = { type: 'success', message: '考点关联已保存' };
    adminState.kpEditor = null;
  } catch (e) {
    adminState.feedback = { type: 'error', message: `保存失败: ${e.message || e}` };
  }
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
  // 仅在切换 section 时清空编辑器；树形内部 select 不清空
  adminState.theoryEditor = null;
  adminState.practiceEditor = null;
  rerender();
  try {
    if (section === 'users') {
      adminState.data.users = await adminApi.listUsers();
    } else if (section === 'content-tree') {
      // 内容树需加载全部内容数据：courses/modules/items/理论例题/题库
      const [courses, modules, items, examplesMap, questions] = await Promise.all([
        adminApi.listCourses(),
        adminApi.listModules(),
        adminApi.listItems(),
        adminApi.listItemTheoryExamples(),
        adminApi.listQuestions()
      ]);
      adminState.data.courses = courses;
      adminState.data.modules = modules;
      adminState.data.questions = questions;
      // items 自带 content；例题从 item_questions(role='theory_example') 关联注入
      adminState.data.items = items.map(it => ({
        ...it,
        content: it.content || '',
        examples: examplesMap.get(it.id) || []
      }));
    } else if (section === 'exams') {
      // 扁平编辑：不再依赖 exam_sections（规避 RLS/权限空白问题）
      const [papers, questions] = await Promise.all([
        adminApi.listExamPapers(),
        adminApi.listExamQuestions()
      ]);
      adminState.data.examPapers = papers;
      adminState.data.examSections = [];
      adminState.data.examQuestions = questions;
    } else if (section === 'kp') {
      // 考点管理: 加载 kp 字典 + courses (供 course_id 上下文显示)
      const [kps, courses] = await Promise.all([
        adminApi.listKnowledgePoints(),
        adminApi.listCourses()
      ]);
      adminState.data.knowledgePoints = kps;
      adminState.data.courses = courses;
    }
  } catch (e) {
    adminState.feedback = { type: 'error', message: `加载失败: ${e.message}` };
  } finally {
    adminState.loading = false;
    rerender();
  }
}

// 内容树内部刷新（保留选中/展开状态，不清编辑器）
async function refreshTreeData() {
  try {
    const [courses, modules, items, examplesMap, questions] = await Promise.all([
      adminApi.listCourses(),
      adminApi.listModules(),
      adminApi.listItems(),
      adminApi.listItemTheoryExamples(),
      adminApi.listQuestions()
    ]);
    adminState.data.courses = courses;
    adminState.data.modules = modules;
    adminState.data.questions = questions;
    adminState.data.items = items.map(it => ({
      ...it,
      content: it.content || '',
      examples: examplesMap.get(it.id) || []
    }));
    rerender();
  } catch (e) {
    adminState.feedback = { type: 'error', message: `刷新失败: ${e.message}` };
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
      // 新模型：正文已存 items.content，例题经 item_questions(role='theory_example') 关联，无需 theory_contents
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
      // 试卷题经统一题库 + exam_paper_questions 关联，在三栏试卷编辑器内维护（无独立 modal）
    } else if (entity === 'knowledge_point') {
      // source='platform' 必须挂 item_id; exam 留空 item_id
      const payload = { ...values };
      if (payload.source === 'exam') payload.item_id = null;
      if (id) {
        const { id: _omit, ...updates } = payload;
        await adminApi.updateKnowledgePoint(id, updates);
      } else {
        await adminApi.createKnowledgePoint(payload);
      }
    }

    adminState.editing = null;
    adminState.feedback = { type: 'success', message: '保存成功' };
    // 内容树 section 用 refreshTreeData 保留展开/选中状态
    if (adminState.section === 'content-tree') {
      await refreshTreeData();
    } else {
      await loadSectionData(adminState.section);
    }
  } catch (e) {
    adminState.feedback = { type: 'error', message: `保存失败: ${e.message}` };
    rerender();
  }
}

async function handleDelete(entity, id) {
  const label = ENTITY_LABELS[entity] || entity;
  // 内容树下的 course/module/item 由 DB 外键级联删除子节点
  const isTreeEntity = entity === 'course' || entity === 'module' || entity === 'item';
  const cascadeHint = (adminState.section === 'content-tree' && isTreeEntity)
    ? '\n该节点下的所有子节点（模块/小节/题目/理论内容）将一并删除。'
    : '';
  if (!confirm(`确认删除此${label}？此操作不可撤销。${cascadeHint}`)) return;

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
    } else if (entity === 'knowledge_point') {
      await adminApi.deleteKnowledgePoint(id);
    }

    // 删除节点后清掉对应选中状态
    if (adminState.tree.selected) {
      const sel = adminState.tree.selected;
      const matches = (sel.type === 'course' && entity === 'course' && sel.id === id)
        || (sel.type === 'module' && entity === 'module' && `${sel.courseId}|${sel.moduleId}` === id)
        || (sel.type === 'item' && entity === 'item' && sel.id === id);
      if (matches) adminState.tree.selected = null;
    }

    adminState.feedback = { type: 'success', message: '删除成功' };
    if (adminState.section === 'content-tree') {
      await refreshTreeData();
    } else {
      await loadSectionData(adminState.section);
    }
  } catch (e) {
    adminState.feedback = { type: 'error', message: `删除失败: ${e.message}` };
    rerender();
  }
}

// ─── 批量删除 / 拖拽排序 ───
async function handleBatchDelete() {
  const keys = Array.from(adminState.tree.checked);
  if (keys.length === 0) return;
  if (!confirm(`确认删除选中的 ${keys.length} 个节点？\n所有子节点（模块/小节/题目/理论内容）将一并删除。此操作不可撤销。`)) return;

  adminState.loading = true;
  rerender();
  const failed = [];
  for (const key of keys) {
    const parsed = parseCheckedKey(key);
    if (!parsed) continue;
    try {
      if (parsed.entity === 'course') {
        await adminApi.deleteCourse(parsed.id);
      } else if (parsed.entity === 'module') {
        const { course_id, module_id } = parseModuleId(parsed.id);
        await adminApi.deleteModule(course_id, module_id);
      } else if (parsed.entity === 'item') {
        await adminApi.deleteItem(parsed.id);
      }
    } catch (e) {
      failed.push({ key, message: e.message });
    }
  }
  adminState.tree.checked.clear();
  // 删除后清掉对应选中状态
  if (adminState.tree.selected) {
    const sel = adminState.tree.selected;
    const stillExists = keys.every(k => {
      const p = parseCheckedKey(k);
      if (!p) return true;
      if (p.entity === 'course' && sel.type === 'course') return p.id !== sel.id;
      if (p.entity === 'module' && sel.type === 'module') return p.id !== `${sel.courseId}|${sel.moduleId}`;
      if (p.entity === 'item' && sel.type === 'item') return p.id !== sel.id;
      return true;
    });
    if (!stillExists) adminState.tree.selected = null;
  }
  adminState.loading = false;
  if (failed.length > 0) {
    adminState.feedback = { type: 'error', message: `${keys.length - failed.length} 项删除成功，${failed.length} 项失败：${failed[0].message}` };
  } else {
    adminState.feedback = { type: 'success', message: `${keys.length} 项删除成功` };
  }
  await refreshTreeData();
}

// 拖拽排序：根据容器 data-tree-children-of 与新顺序批量更新 order_index
async function handleTreeReorder(childrenOfKey, orderedIds) {
  try {
    if (childrenOfKey.startsWith('course:')) {
      // 课程下模块排序
      const courseId = childrenOfKey.slice('course:'.length);
      const updates = orderedIds.map((enc, idx) => {
        const { module_id } = parseModuleId(enc);
        return adminApi.updateModule(courseId, module_id, { order_index: idx });
      });
      await Promise.all(updates);
    } else if (childrenOfKey.startsWith('module:')) {
      // 模块下小节排序
      const orderedItems = orderedIds.map((id, idx) => adminApi.updateItem(id, { order_index: idx }));
      await Promise.all(orderedItems);
    }
    adminState.feedback = { type: 'success', message: '排序已保存' };
    await refreshTreeData();
  } catch (e) {
    adminState.feedback = { type: 'error', message: `排序保存失败: ${e.message}` };
    await refreshTreeData();
  }
}

// ─── Theory editor ───
// 把例题（统一题库 questions 行，或旧内联对象）归一化为编辑器对象，保留真实 question id
async function normalizeTheoryExamples(itemId, rawExamples) {
  if (!Array.isArray(rawExamples) || rawExamples.length === 0) return [];
  // 旧格式：元素为字符串 ID → 按 ID 查题目转编辑器对象
  if (typeof rawExamples[0] === 'string') {
    try {
      let questions = adminState.data.questions || [];
      if (questions.length === 0) {
        questions = await adminApi.listQuestions();
      }
      const qMap = new Map(questions.map(q => [q.id, q]));
      return rawExamples
        .map(qid => qMap.get(qid))
        .filter(Boolean)
        .map(q => ({
          id: q.id,
          text: q.content || q.title || '',
          image: q.image || '',
          options: padOptions(q.options),
          answer: parseInt(q.answer, 10) || 0,
          solution: q.solution || ''
        }));
    } catch (e) {
      return [];
    }
  }
  // 新模型：questions 行（含真实 id）或旧内联对象
  return rawExamples.map(ex => {
    const isQuestionRow = ex && typeof ex === 'object' && ('content' in ex || 'id' in ex);
    if (isQuestionRow) {
      return {
        id: ex.id || null,
        text: ex.content || ex.title || '',
        image: ex.image || '',
        options: padOptions(ex.options),
        answer: parseInt(ex.answer, 10) || 0,
        solution: ex.solution || ''
      };
    }
    return {
      id: ex && ex.id ? ex.id : null,
      text: (ex && ex.text) || '',
      image: (ex && ex.image) || '',
      options: padOptions(ex && ex.options),
      answer: (ex && typeof ex.answer === 'number') ? ex.answer : 0,
      solution: (ex && ex.solution) || ''
    };
  });
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

    // 新模型：正文在 items.content，例题经 getItemContent 关联读取
    const theory = await adminApi.getItemContent(itemId);
    let content = (theory && theory.content) || (item.content || '');
    let examples = (theory && theory.examples) || [];
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
  ed.content = getEasyMDEValue('theory-content', contentEl);
  ed.examples = ed.examples.map((ex, idx) => {
    const textEl = document.getElementById(`theory-ex-${idx}-text`);
    const imageEl = document.getElementById(`theory-ex-${idx}-image`);
    const answerEl = document.getElementById(`theory-ex-${idx}-answer`);
    const solutionEl = document.getElementById(`theory-ex-${idx}-solution`);
    const optEls = [0, 1, 2, 3].map(i => document.getElementById(`theory-ex-${idx}-opt-${i}`));
    return {
      id: ex.id || null, // 保留真实 question id，供差量保存
      text: getEasyMDEValue(`theory-ex-${idx}-text`, textEl),
      image: imageEl ? imageEl.value.trim() : (ex.image || ''),
      options: optEls.map((el, i) => getEasyMDEValue(`theory-ex-${idx}-opt-${i}`, el)),
      answer: answerEl ? parseInt(answerEl.value, 10) : ex.answer,
      solution: getEasyMDEValue(`theory-ex-${idx}-solution`, solutionEl)
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

function markTheoryExampleOpt(idx, opt) {
  const ed = adminState.theoryEditor;
  if (!ed || !ed.examples[idx]) return;
  syncTheoryFormToState();
  ed.examples[idx].answer = opt;
  rerender();
}

async function saveTheory() {
  try {
    syncTheoryFormToState();
    const ed = adminState.theoryEditor;
    if (!ed) {
      adminState.feedback = { type: 'error', message: '编辑器未打开，无法保存' };
      rerender();
      return;
    }
    // 新模型：正文入 items.content，例题差量同步 questions + item_questions(role='theory_example')
    await adminApi.saveTheoryContent({ itemId: ed.itemId, content: ed.content, examples: ed.examples });
    adminState.feedback = { type: 'success', message: '理论内容已保存' };
    adminState.theoryEditor = null;
    if (adminState.section === 'content-tree') {
      await refreshTreeData();
    } else {
      await loadSectionData(adminState.section);
    }
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
  const getMd = id => { const el = document.getElementById(id); return getEasyMDEValue(id, el); };
  const title = get('pq-title');
  const content = getMd('pq-content');
  const solution = getMd('pq-solution');
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
    // 答案由 admin-practice-mark 点击维护在 state 中，无需读 DOM
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

function practiceMark(opt) {
  syncPracticeFormToState();
  const ed = adminState.practiceEditor;
  if (ed.selectedIndex < 0) return;
  const q = ed.questions[ed.selectedIndex];
  if (!q) return;
  if (Number(q.question_type) === 1) {
    const s = q.answers || [];
    q.answers = s.includes(String(opt)) ? s.filter(x => x !== String(opt)) : [...s, String(opt)];
  } else {
    q.answer = String(opt);
    delete q.answers;
  }
  rerender();
}

async function savePractice() {
  try {
    syncPracticeFormToState();
    const ed = adminState.practiceEditor;
    if (!ed) {
      adminState.feedback = { type: 'error', message: '编辑器未打开，无法保存' };
      rerender();
      return;
    }
    const itemId = ed.itemId;
    // 差量同步：先记下当前小节已有关联的 practice 题 id，用于清理被移除题的关联
    const existingLinks = await adminApi.listQuestions({ itemId });
    const existingIds = new Set(existingLinks.map(x => x.id));
    const keepIds = new Set();
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
        keepIds.add(payload.id);
        const { id, ...updates } = payload;
        await adminApi.updateQuestion(id, updates);
      } else {
        // 新题：客户端生成唯一 ID + 建立训练题关联
        payload.id = `${itemId}-q${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
        await adminApi.createQuestion(payload);
        keepIds.add(payload.id);
        await adminApi.linkItemQuestion(itemId, payload.id, 'practice', i);
      }
    }
    // 清理被移除题的关联（不删 questions 本体，题库可能他处复用）
    for (const qid of existingIds) {
      if (!keepIds.has(qid)) {
        try {
          await adminApi.removeItemQuestion(itemId, qid, 'practice');
        } catch (_) {}
      }
    }
    adminState.feedback = { type: 'success', message: '题目已保存' };
    adminState.practiceEditor = null;
    if (adminState.section === 'content-tree') {
      await refreshTreeData();
    } else {
      await loadSectionData(adminState.section);
    }
  } catch (e) {
    adminState.feedback = { type: 'error', message: `保存失败: ${e.message}` };
    rerender();
  }
}

// ─── Exam (期末试卷) — 三栏编辑器 ───
function paperTotal(ed) {
  return (ed.questions || []).reduce((s, it) => s + (Number(it.score) || 0), 0);
}

function renderExams() {
  const papers = adminState.data.examPapers || [];
  return `
    <div class="exam-top">
      <div class="exam-hint">编辑题目（共享题库可入卷，打来源标记）→ 设分 → 预览 → 发布。</div>
      <button type="button" class="admin-btn admin-btn-primary" data-action="admin-paper-new">+ 新建试卷</button>
    </div>
    <div class="exam-list">
      ${papers.length === 0
        ? `<div class="admin-empty">暂无试卷</div>`
        : papers.map(p => {
            const qs = (adminState.data.examQuestions || []).filter(q => q.exam_id === p.id);
            const total = qs.reduce((s, q) => s + (Number(q.score) || 0), 0);
            const pub = p.state === 'published';
            return `
              <div class="exam-card">
                <div class="exam-card-body">
                  <div class="exam-card-title">${escapeHtml(p.name || p.id)}</div>
                  <div class="exam-card-sub">
                    <span class="badge ${pub ? 'on' : 'off'}">${pub ? '已发布' : '草稿'}</span>
                    <span>${qs.length} 题 · 总分 ${total}</span>
                  </div>
                  <div class="exam-card-sub">
                    <span class="badge">${escapeHtml(p.school || '')}</span>
                    <span class="badge">${escapeHtml(p.college || '')}</span>
                    <span class="badge">${escapeHtml(p.subject || '')}</span>
                    <span class="badge">${escapeHtml(p.term || '')}</span>
                  </div>
                </div>
                <div class="admin-actions">
                  <button type="button" class="admin-btn admin-btn-sm" data-action="admin-paper-preview" data-id="${escapeHtml(p.id)}">预览</button>
                  <button type="button" class="admin-btn admin-btn-sm" data-action="admin-paper-open" data-id="${escapeHtml(p.id)}">编辑</button>
                  ${pub
                    ? `<button type="button" class="admin-btn admin-btn-sm admin-btn-danger" data-action="admin-paper-withdraw" data-id="${escapeHtml(p.id)}">撤回</button>`
                    : `<button type="button" class="admin-btn admin-btn-sm admin-btn-primary" data-action="admin-paper-publish" data-id="${escapeHtml(p.id)}">发布</button>`}
                  <button type="button" class="admin-btn admin-btn-sm admin-btn-danger" data-action="admin-paper-delete" data-id="${escapeHtml(p.id)}">删除</button>
                </div>
              </div>`;
          }).join('')}
    </div>`;
}

async function openPaper(id) {
  const p = id ? (adminState.data.examPapers || []).find(x => x.id === id) : null;
  let questions = [];
  if (p) {
    // 扁平编辑：不再读取 exam_sections
    questions = await adminApi.listExamQuestions(p.id);
  }
  // 新建时自动填充：取最近的非空试卷；若无可选项则用众数；仍无再用兜底常量
  const papers = adminState.data.examPapers || [];
  const fallback = { subject: '大学物理B', term: '2025-2026-2', school: '长沙理工大学', college: '' };
  function pickBest(fn) {
    const latest = papers.find(x => fn(x) && String(fn(x)).trim() !== '');
    if (latest) return fn(latest);
    const counts = {};
    papers.forEach(x => { const v = fn(x); if (v) counts[v] = (counts[v] || 0) + 1; });
    let best = null, bestN = 0;
    Object.entries(counts).forEach(([v, n]) => { if (n > bestN) { best = v; bestN = n; } });
    return best;
  }
  const subject = p ? (p.subject || '') : (pickBest(x => x.subject) || fallback.subject);
  const term = p ? (p.term || '') : (pickBest(x => x.term) || fallback.term);
  const school = p ? (p.school || '') : (pickBest(x => x.school) || fallback.school);
  const college = p ? (p.college || '') : (pickBest(x => x.college) || fallback.college);
  const name = p ? (p.name || '') : `${subject} · ${term} · 期末试卷`;
  adminState.paperEditor = {
    id: p ? p.id : null,
    name,
    school,
    college,
    subject,
    term,
    state: p ? (p.state || 'draft') : 'draft',
    questions: questions.map(q => {
      // listExamQuestions 已展平：q.id=关联行id(linkId)，q.question_id=统一题库题id
      const qid = q.question_id;
      return {
        id: q.id, // 关联行 id，用于删除/排序
        score: Number(q.score) || 5,
        source: q.source || '本卷新增',
        question: {
          ...q,
          id: qid,
          options: padOptions(q.options),
          answer: q.answer != null ? String(q.answer) : '0',
          answers: Array.isArray(q.answers) ? q.answers.map(String) : [],
          blanks: q.blanks || 1,
          solution: q.solution || '',
          difficulty: q.difficulty || 1
        }
      };
    }),
    selectedIndex: questions.length > 0 ? 0 : -1
  };
  rerender();
}

function paperMetaForm() {
  const ed = adminState.paperEditor;
  return `
    <div class="paper-meta">
      <div class="row2">
        <div class="admin-form-row"><label class="admin-form-label">试卷名称 *</label><input id="pe-name" value="${escapeHtml(ed.name)}"></div>
        <div class="admin-form-row"><label class="admin-form-label">科目</label><input id="pe-subject" value="${escapeHtml(ed.subject)}"></div>
      </div>
      <div class="row4">
        <div class="admin-form-row"><label class="admin-form-label">学校</label><input id="pe-school" value="${escapeHtml(ed.school)}"></div>
        <div class="admin-form-row"><label class="admin-form-label">学院</label><input id="pe-college" value="${escapeHtml(ed.college)}"></div>
        <div class="admin-form-row"><label class="admin-form-label">学期</label><input id="pe-term" value="${escapeHtml(ed.term)}"></div>
        <div class="admin-form-row"><label class="admin-form-label">状态</label><span class="badge ${ed.state === 'published' ? 'on' : 'off'}">${ed.state === 'published' ? '已发布' : '草稿'}</span></div>
      </div>
    </div>`;
}

function renderPaperEditor() {
  const ed = adminState.paperEditor;
  const sel = ed.selectedIndex;
  const total = paperTotal(ed);
  return `
    <div class="admin-editor paper-editor">
      <div class="practice-list paper-list">
        ${paperMetaForm()}
        <div class="practice-list-header"><span class="admin-form-label">题目 (${ed.questions.length}) · 总分 ${total}</span></div>
        <div class="practice-list-items" id="paperListItems">
          ${ed.questions.length === 0
            ? `<div class="admin-empty">暂无题目</div>`
            : ed.questions.map((it, i) => `
              <div class="practice-list-item ${i === sel ? 'selected' : ''}" data-action="admin-paper-select" data-idx="${i}">
                <span class="practice-list-num">${i + 1}</span>
                <span class="practice-list-type">${escapeHtml(questionTypeLabel(it.question.question_type))}</span>
                <button type="button" class="practice-list-del" data-action="admin-paper-remove" data-idx="${i}" title="删除">×</button>
              </div>`).join('')}
        </div>
        <button type="button" class="admin-btn admin-btn-sm" data-action="admin-paper-open-pool">+ 从题库添加</button>
        <button type="button" class="admin-btn admin-btn-sm admin-btn-primary" data-action="admin-paper-add">+ 添加题目</button>
      </div>
      <div class="practice-edit">${sel >= 0 && ed.questions[sel] ? paperForm(ed.questions[sel], sel) : `<div class="admin-empty">请选择或添加题目</div>`}</div>
      <div class="practice-preview"><span class="admin-form-label">预览</span><div class="admin-preview" id="paper-preview"></div></div>
    </div>`;
}

function paperForm(it, sel) {
  const q = it.question;
  const t = Number(q.question_type);
  const isMulti = t === 1;
  const hasKpBtn = !!(it.question && it.question.id); // 需真实 question_id 才能关联考点
  return `
    <div class="paper-form">
      <div class="paper-source"><span class="admin-form-label">来源</span><span class="badge" style="color:var(--ad-green-hl);border-color:var(--ad-green)">${escapeHtml(it.source)}</span></div>
      <div class="admin-form-row"><label class="admin-form-label" for="pq-score">分值</label><input type="number" id="pq-score" min="1" value="${escapeHtml(String(it.score))}"></div>
      <div class="admin-form-row"><label class="admin-form-label">题型</label><div class="practice-type-selector">${[{ v: 0, l: '单选' }, { v: 1, l: '多选' }, { v: 2, l: '填空' }, { v: 4, l: '解答' }].map(x => `<button type="button" class="practice-type-btn ${t === x.v ? 'active' : ''}" data-action="admin-paper-type" data-value="${x.v}">${x.l}</button>`).join('')}</div></div>
      <div class="admin-form-row">
        <label class="admin-form-label">考点 ${hasKpBtn ? '' : '<span class="admin-kp-hint">（保存后可设置）</span>'}</label>
        ${hasKpBtn
          ? `<button type="button" class="admin-btn admin-btn-sm" data-action="admin-kp-edit" data-source="exam" data-id="${escapeHtml(it.question.id)}" data-title="${escapeHtml(q.title || q.content || it.question.id)}">设置考点</button>`
          : `<span class="admin-kp-hint">尚未保存，无法关联考点</span>`}
      </div>
      <div class="admin-form-row"><label class="admin-form-label" for="pq-content">题干 (Markdown)</label><textarea id="pq-content" class="admin-md-textarea" rows="4">${escapeHtml(q.content || '')}</textarea></div>
      ${t === 0 || isMulti ? `
        <div class="admin-form-row"><label class="admin-form-label">选项（点击字母标记正确答案${isMulti ? '，可多选' : ''}）</label>
          <div class="theory-opt-list">${[0, 1, 2, 3].map(i => `
            <div class="theory-opt-row">
              <span class="theory-opt-key ${(isMulti ? (q.answers || []).includes(String(i)) : String(q.answer) === String(i)) ? 'checked' : ''}" data-action="admin-paper-mark" data-idx="${i}">${String.fromCharCode(65 + i)}</span>
              <input type="text" id="pq-opt-${i}" value="${escapeHtml((q.options || [])[i] || '')}">
            </div>`).join('')}
          </div>
        </div>` : ''}
      ${t === 2 ? `
        <div class="admin-form-row"><label class="admin-form-label" for="pq-answer">答案</label><input type="text" id="pq-answer" value="${escapeHtml(q.answer || '')}"></div>
        <div class="admin-form-row"><label class="admin-form-label" for="pq-blanks">空数</label><input type="number" id="pq-blanks" value="${escapeHtml(String(q.blanks ?? 1))}"></div>` : ''}
      ${t === 4 ? `
        <div class="admin-form-row"><label class="admin-form-label" for="pq-answer">答案</label><input type="text" id="pq-answer" value="${escapeHtml(q.answer || '')}"></div>` : ''}
      <div class="admin-form-row"><label class="admin-form-label" for="pq-solution">解析 (Markdown)</label><textarea id="pq-solution" class="admin-md-textarea" rows="3">${escapeHtml(q.solution || '')}</textarea></div>
      <div class="admin-form-row"><label class="admin-form-label" for="pq-difficulty">难度</label><input type="number" id="pq-difficulty" value="${escapeHtml(String(q.difficulty ?? 1))}"></div>
    </div>`;
}

function paperSyncMeta() {
  const ed = adminState.paperEditor;
  if (!ed) return;
  const g = id => { const el = document.getElementById(id); return el ? el.value : null; };
  if (g('pe-name') != null) ed.name = document.getElementById('pe-name').value;
  if (g('pe-subject') != null) ed.subject = document.getElementById('pe-subject').value;
  if (g('pe-school') != null) ed.school = document.getElementById('pe-school').value;
  if (g('pe-college') != null) ed.college = document.getElementById('pe-college').value;
  if (g('pe-term') != null) ed.term = document.getElementById('pe-term').value;
}

function paperCurrent() {
  const ed = adminState.paperEditor;
  if (!ed || ed.selectedIndex < 0) return null;
  return ed.questions[ed.selectedIndex];
}

function paperSyncCurrent() {
  const it = paperCurrent();
  if (!it) return;
  const q = it.question;
  const g = id => { const el = document.getElementById(id); return el ? el.value : null; };
  if (g('pq-score') != null) it.score = Number(document.getElementById('pq-score').value) || 5;
  if (g('pq-content') != null) q.content = document.getElementById('pq-content').value;
  if (g('pq-solution') != null) q.solution = document.getElementById('pq-solution').value;
  if (g('pq-difficulty') != null) q.difficulty = Number(document.getElementById('pq-difficulty').value);
  const t = Number(q.question_type);
  if (t === 0 || t === 1) {
    q.options = [0, 1, 2, 3].map(i => g(`pq-opt-${i}`) || '');
  } else if (t === 2 || t === 4) {
    q.answer = g('pq-answer') || '';
    if (t === 2) q.blanks = Number(g('pq-blanks')) || 1;
  }
}

function updatePaperPreview() {
  const it = paperCurrent();
  if (!it) return;
  paperSyncCurrent();
  const q = it.question;
  const preview = document.getElementById('paper-preview');
  if (!preview) return;
  let html = '';
  if (it.score) html += `<div class="preview-answer"><strong>分值:</strong> ${escapeHtml(String(it.score))} 分</div>`;
  html += renderMd(q.content || '*无题干*');
  const t = Number(q.question_type);
  if (t === 0 || t === 1) {
    html += '<ol type="A">';
    const ans = new Set(t === 1 ? (q.answers || []) : [String(q.answer)]);
    (q.options || []).forEach((o, i) => {
      const isAns = ans.has(String(i));
      html += `<li class="${isAns ? 'preview-correct' : ''}">${renderMd(o)}</li>`;
    });
    html += '</ol>';
    if (t === 1) html += `<div class="preview-answer"><strong>正确答案:</strong> ${escapeHtml((q.answers || []).map(a => String.fromCharCode(65 + Number(a))).join(', '))}</div>`;
  } else if (t === 2 || t === 4) {
    html += `<div class="preview-answer"><strong>答案:</strong> ${escapeHtml(q.answer || '')}</div>`;
  }
  if (q.solution) html += `<div class="preview-solution"><strong>解析:</strong> ${renderMd(q.solution)}</div>`;
  preview.innerHTML = html;
  typeset(preview);
}

function paperSelect(i) {
  paperSyncCurrent();
  adminState.paperEditor.selectedIndex = i;
  rerender();
}

function paperAdd() {
  paperSyncCurrent();
  const ed = adminState.paperEditor;
  ed.questions.push({ id: null, score: 5, source: '本卷新增', question: { id: null, question_type: 0, title: '', content: '', options: ['', '', '', ''], answer: '0', answers: [], blanks: 1, solution: '', difficulty: 1 } });
  ed.selectedIndex = ed.questions.length - 1;
  rerender();
}

function paperRemove(i) {
  adminState.paperEditor.questions.splice(i, 1);
  if (adminState.paperEditor.selectedIndex >= adminState.paperEditor.questions.length) {
    adminState.paperEditor.selectedIndex = adminState.paperEditor.questions.length - 1;
  }
  rerender();
}

function paperTypeChange(v) {
  paperSyncCurrent();
  const it = paperCurrent();
  if (!it) return;
  const q = it.question;
  q.question_type = Number(v);
  if (q.question_type === 0) { q.options = padOptions(q.options); q.answer = '0'; q.answers = []; }
  else if (q.question_type === 1) { q.options = padOptions(q.options); q.answers = []; q.answer = undefined; }
  else if (q.question_type === 2) { q.answer = ''; q.blanks = 1; q.options = ['', '', '', '']; }
  else { q.answer = ''; q.options = ['', '', '', '']; }
  rerender();
}

function paperMark(i) {
  const it = paperCurrent();
  if (!it) return;
  paperSyncCurrent();
  const q = it.question;
  if (Number(q.question_type) === 1) {
    const s = q.answers || [];
    q.answers = s.includes(String(i)) ? s.filter(x => x !== String(i)) : [...s, String(i)];
  } else {
    q.answer = String(i);
    q.answers = [];
  }
  rerender();
}

function paperReorder(oldIndex, newIndex) {
  const ed = adminState.paperEditor;
  if (!ed) return;
  paperSyncCurrent();
  const [moved] = ed.questions.splice(oldIndex, 1);
  ed.questions.splice(newIndex, 0, moved);
  ed.selectedIndex = newIndex;
  rerender();
}

async function savePaper() {
  try {
    paperSyncCurrent();
    const ed = adminState.paperEditor;
    if (!ed) return;
    if (!ed.name.trim()) { adminState.feedback = { type: 'error', message: '试卷名称不能为空' }; rerender(); return; }
    if (!ed.questions.length) { adminState.feedback = { type: 'error', message: '至少添加 1 道题' }; rerender(); return; }

    let paperId = ed.id;
    const meta = { name: ed.name, school: ed.school, college: ed.college, subject: ed.subject, term: ed.term, state: ed.state };
    if (paperId) {
      await adminApi.updateExamPaper(paperId, meta);
    } else {
      paperId = `pe${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
      await adminApi.createExamPaper({ id: paperId, ...meta });
      ed.id = paperId;
    }

    // 新模型：复用统一题库，经 exam_paper_questions 关联；差量同步
    const existing = await adminApi.listExamQuestions(paperId);
    for (const eq of existing) {
      // eq.question_id 为该行题目 id；列表中存在则保留，否则移除该关联
      if (!ed.questions.some(it => it.question && it.question.id === eq.question_id)) {
        try { await adminApi.removeExamQuestion(eq.id); } catch (_) {}
      }
    }
    for (let i = 0; i < ed.questions.length; i++) {
      const it = ed.questions[i];
      const q = { ...it.question };
      const body = {
        question_type: Number(q.question_type) || 0,
        title: q.title || '',
        content: q.content || '',
        options: (q.question_type === 0 || q.question_type === 1) ? (q.options || []).slice(0, 4) : [],
        answer: (q.question_type === 0) ? String(q.answer ?? '0') : ((q.question_type === 2 || q.question_type === 4) ? (q.answer || '') : null),
        answers: (q.question_type === 1) ? (Array.isArray(q.answers) ? q.answers.map(String) : []) : [],
        blanks: q.question_type === 2 ? (q.blanks || 1) : null,
        solution: q.solution || '',
        difficulty: q.difficulty || 1,
        source: it.source || '本卷新增'
      };
      const res = await adminApi.saveExamQuestion({
        examId: paperId,
        sectionId: null,
        question: { id: q.id || null, ...body },
        score: it.score || 5,
        orderIndex: i
      });
      it.id = res.linkId;
      if (q.id !== res.questionId) it.question.id = res.questionId;
    }

    adminState.feedback = { type: 'success', message: '试卷已保存' };
    adminState.paperEditor = null;
    await loadSectionData('exams');
  } catch (e) {
    adminState.feedback = { type: 'error', message: `保存失败: ${e.message}` };
    rerender();
  }
}

async function publishPaper(id) {
  try {
    await adminApi.updateExamPaper(id, { state: 'published' });
    adminState.feedback = { type: 'success', message: '试卷已发布，前台立即可刷' };
    await loadSectionData('exams');
  } catch (e) {
    adminState.feedback = { type: 'error', message: `发布失败: ${e.message}` };
    rerender();
  }
}

async function withdrawPaper(id) {
  if (!confirm('前台将立即下架该试卷，已产生刷题记录保留。确定撤回？')) return;
  try {
    await adminApi.updateExamPaper(id, { state: 'draft' });
    adminState.feedback = { type: 'success', message: '试卷已撤回为草稿' };
    await loadSectionData('exams');
  } catch (e) {
    adminState.feedback = { type: 'error', message: `撤回失败: ${e.message}` };
    rerender();
  }
}

async function deletePaper(id) {
  if (!confirm('删除后不可恢复，历史刷题记录解绑。确定删除？')) return;
  try {
    await adminApi.deleteExamPaper(id);
    adminState.feedback = { type: 'success', message: '已删除试卷' };
    await loadSectionData('exams');
  } catch (e) {
    adminState.feedback = { type: 'error', message: `删除失败: ${e.message}` };
    rerender();
  }
}

// ─── Exam: 从题库添加弹层 ───
async function ensurePoolLoaded() {
  if (adminState.poolLoaded) return;
  adminState.data.questions = await adminApi.listQuestions();
  adminState.poolLoaded = true;
}

function renderPool() {
  const container = document.getElementById('bPool');
  if (!container) return;
  const questions = adminState.data.questions || [];
  container.innerHTML = questions.map(q => {
    const key = String(q.id);
    const on = adminState.poolSel.includes(key);
    return `
      <div class="b-card ${on ? 'in-quiz' : ''}" data-action="admin-pool-toggle" data-id="${escapeHtml(q.id)}">
        <span class="pick ${on ? 'on' : ''}">✓</span>
        <div class="b-card-body">
          <div class="b-card-title">${escapeHtml(q.content || q.title || '')}</div>
          <div class="b-card-sub"><span class="badge">#${escapeHtml(String(q.difficulty ?? 1))} 难度</span><span class="badge">${escapeHtml(questionTypeLabel(q.question_type))}</span></div>
        </div>
      </div>`;
  }).join('') || '<div class="admin-empty">暂无可用题库题目</div>';
  const cnt = document.getElementById('bCnt');
  if (cnt) cnt.textContent = adminState.poolSel.length;
}

function poolToggle(id) {
  const key = String(id);
  const i = adminState.poolSel.indexOf(key);
  if (i >= 0) adminState.poolSel.splice(i, 1);
  else adminState.poolSel.push(key);
  renderPool();
}

async function openPool() {
  await ensurePoolLoaded();
  adminState.poolSel = [];
  adminState.poolOpen = true;
  rerender();
  renderPool();
  const mask = document.getElementById('pMask');
  const drawer = document.getElementById('pDrawer');
  if (mask) mask.classList.add('open');
  if (drawer) drawer.classList.add('open');
}

function closePool() {
  adminState.poolOpen = false;
  const mask = document.getElementById('pMask');
  const drawer = document.getElementById('pDrawer');
  if (mask) mask.classList.remove('open');
  if (drawer) drawer.classList.remove('open');
}

async function addPoolToPaper() {
  if (!adminState.poolSel.length) { adminState.feedback = { type: 'error', message: '请先勾选要添加的题目' }; rerender(); return; }
  paperSyncCurrent();
  const ed = adminState.paperEditor;
  const questions = adminState.data.questions || [];
  const added = adminState.poolSel.length;
  adminState.poolSel.forEach(key => {
    const q = questions.find(x => String(x.id) === key);
    if (!q) return;
    ed.questions.push({
      id: null,
      score: 5,
      source: '题库',
      question: {
        id: q.id, // 复用题库题：保留真实 id，保存时仅建关联，不重复建题
        question_type: q.question_type || 0,
        title: q.title || '',
        content: q.content || '',
        options: padOptions(q.options),
        answer: q.answer != null ? String(q.answer) : '0',
        answers: Array.isArray(q.answers) ? q.answers.map(String) : [],
        blanks: q.blanks || 1,
        solution: q.solution || '',
        difficulty: q.difficulty || 1
      }
    });
  });
  ed.selectedIndex = ed.questions.length - 1;
  closePool();
  adminState.poolSel = [];
  adminState.feedback = { type: 'success', message: `已添加 ${added} 题` };
  rerender();
}

// ─── Exam: 预览弹层 ───
function paperPreviewHtml(items) {
  return items.map((it, i) => {
    const q = it.question;
    const stem = q ? (q.content || q.title || '') : '';
    const type = q ? questionTypeLabel(q.question_type) : '';
    const ans = q ? ((q.answer != null && q.answer !== '') ? String.fromCharCode(65 + Number(q.answer)) : (Array.isArray(q.answers) && q.answers.length ? q.answers.map(a => String.fromCharCode(65 + Number(a))).join(', ') : '')) : '';
    return `<div class="p-q"><div class="qn">${i + 1}. [${escapeHtml(type)}] 来源 ${escapeHtml(it.source || '')} · ${escapeHtml(String(it.score || 0))}分</div><div class="qt">${escapeHtml(stem)}</div>${q && q.options && q.options.length ? `<div class="p-opts">${(q.options || []).map((o, k) => `${String.fromCharCode(65 + k)}. ${escapeHtml(o || '')}`).join('　')}</div>${ans ? `<span class="ans-s">答案：${escapeHtml(ans)}</span>` : ''}` : (ans ? `<span class="ans-s">答案：${escapeHtml(ans)}</span>` : '')}</div>`;
  }).join('');
}

function openPreviewModal(title, metaHtml, bodyHtml) {
  const titleEl = document.getElementById('pvTitle');
  const metaEl = document.getElementById('pvMeta');
  const bodyEl = document.getElementById('pvBody');
  if (titleEl) titleEl.textContent = title;
  if (metaEl) metaEl.innerHTML = metaHtml;
  if (bodyEl) bodyEl.innerHTML = bodyHtml;
  const mask = document.getElementById('pvMask');
  const box = document.getElementById('pvBox');
  if (mask) mask.classList.add('open');
  if (box) box.classList.add('open');
}

function closePreview() {
  const mask = document.getElementById('pvMask');
  const box = document.getElementById('pvBox');
  if (mask) mask.classList.remove('open');
  if (box) box.classList.remove('open');
}

function previewUnsaved() {
  paperSyncCurrent();
  const ed = adminState.paperEditor;
  if (!ed) return;
  if (!ed.name.trim()) { adminState.feedback = { type: 'error', message: '试卷名称不能为空' }; rerender(); return; }
  const items = ed.questions;
  const total = paperTotal(ed);
  const meta = `<span class="badge">${escapeHtml(ed.school)}</span><span class="badge">${escapeHtml(ed.college)}</span><span class="badge">${escapeHtml(ed.subject)}</span><span class="badge">${escapeHtml(ed.term)}</span><span class="badge">${items.length} 题 · ${total} 分</span>`;
  openPreviewModal(ed.name + ' · 预览（未保存）', meta, paperPreviewHtml(items));
}

function previewPaperId(id) {
  const p = (adminState.data.examPapers || []).find(x => x.id === id);
  if (!p) return;
  const qs = (adminState.data.examQuestions || []).filter(q => q.exam_id === id);
  const total = qs.reduce((s, q) => s + (Number(q.score) || 0), 0);
  const items = qs.map(q => ({ score: Number(q.score) || 0, source: q.source || '', question: q }));
  const meta = `<span class="badge">${escapeHtml(p.school || '')}</span><span class="badge">${escapeHtml(p.college || '')}</span><span class="badge">${escapeHtml(p.subject || '')}</span><span class="badge">${escapeHtml(p.term || '')}</span><span class="badge">${qs.length} 题 · ${total} 分</span>`;
  openPreviewModal((p.name || p.id) + ' · 预览', meta, paperPreviewHtml(items));
}

function initPaperSortable() {
  const el = document.getElementById('paperListItems');
  if (!el) return;
  if (adminState.editorInstances.paperSortable) { try { adminState.editorInstances.paperSortable.destroy(); } catch (_) {} adminState.editorInstances.paperSortable = null; }
  adminState.editorInstances.paperSortable = Sortable.create(el, {
    animation: 150,
    ghostClass: 'practice-ghost',
    onEnd: evt => {
      if (evt.oldIndex === evt.newIndex) return;
      paperReorder(evt.oldIndex, evt.newIndex);
    }
  });
}

function renderPoolOverlay() {
  return `
    <div class="drawer-mask" id="pMask" data-action="admin-pool-close"></div>
    <div class="drawer" id="pDrawer">
      <div class="d-head"><h2>从题库添加</h2><span class="d-step">共享题库</span></div>
      <div class="d-body">
        <div class="d-tip">共享题库题目可勾选入卷；入卷后为独立副本，可编辑但打上来源标记。</div>
        <div class="b-pool" id="bPool"></div>
        <div class="d-foot"><span class="d-total">已选 <span id="bCnt">0</span> 题</span><button type="button" class="admin-btn" data-action="admin-pool-close">取消</button><button type="button" class="admin-btn admin-btn-primary" data-action="admin-pool-add">添加选中</button></div>
      </div>
    </div>`;
}

function renderPreviewOverlay() {
  return `
    <div class="preview-mask" id="pvMask" data-action="admin-preview-close"></div>
    <div class="preview-modal" id="pvBox">
      <div class="p-head"><h3 id="pvTitle">试卷预览</h3><button type="button" class="close" data-action="admin-preview-close" aria-label="关闭">×</button></div>
      <div class="p-meta" id="pvMeta"></div>
      <div id="pvBody"></div>
    </div>`;
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
      adminState.paperEditor = null;
      adminState.poolOpen = false;
      adminState.kpEditor = null;
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
      if (adminState.section === 'content-tree') {
        await refreshTreeData();
      } else {
        await loadSectionData(adminState.section);
      }
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
    case 'admin-kp-edit': {
      const source = el.dataset.source;
      const questionId = el.dataset.id;
      const questionTitle = el.dataset.title;
      const itemId = el.dataset.itemId || null;
      if (!source || !questionId) return;
      await openKpEditor(source, questionId, questionTitle, itemId);
      break;
    }
    case 'admin-kp-close': {
      adminState.kpEditor = null;
      rerender();
      break;
    }
    case 'admin-kp-add-secondary': {
      addKpSecondary();
      break;
    }
    case 'admin-kp-remove': {
      const kpId = el.dataset.kpId;
      if (!kpId) return;
      removeKp(kpId);
      break;
    }
    case 'admin-kp-save': {
      await saveKpEditor();
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
      adminState.paperEditor = null;
      // 内容树模式下返回时清掉 item 选中，避免立即重新打开编辑器
      if (adminState.section === 'content-tree' && adminState.tree.selected?.type === 'item') {
        adminState.tree.selected = null;
      }
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
    case 'admin-mark-example-opt': {
      const idx = Number(el.dataset.idx);
      const opt = Number(el.dataset.opt);
      if (Number.isNaN(idx) || Number.isNaN(opt)) return;
      markTheoryExampleOpt(idx, opt);
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
    case 'admin-practice-mark': {
      const value = el.dataset.opt;
      if (value === undefined || value === '') return;
      practiceMark(Number(value));
      break;
    }
    case 'admin-save-practice': {
      await savePractice();
      break;
    }
    // ─── 内容树 actions ───
    case 'admin-tree-toggle': {
      const t = el.dataset.treeType;
      if (t === 'course') {
        const key = `course:${el.dataset.id}`;
        adminState.tree.expanded[key] = !adminState.tree.expanded[key];
      } else if (t === 'module') {
        const key = `module:${el.dataset.id}|${el.dataset.moduleId}`;
        adminState.tree.expanded[key] = !adminState.tree.expanded[key];
      }
      rerender();
      break;
    }
    case 'admin-tree-select': {
      const t = el.dataset.treeType;
      if (t === 'course') {
        const id = el.dataset.id;
        adminState.tree.selected = { type: 'course', id };
        // 选中即展开
        adminState.tree.expanded[`course:${id}`] = true;
        rerender();
      } else if (t === 'module') {
        const courseId = el.dataset.id;
        const moduleId = el.dataset.moduleId;
        adminState.tree.selected = { type: 'module', courseId, moduleId };
        adminState.tree.expanded[`module:${courseId}|${moduleId}`] = true;
        // 确保父课程也展开
        adminState.tree.expanded[`course:${courseId}`] = true;
        rerender();
      } else if (t === 'item') {
        const itemId = el.dataset.id;
        const item = (adminState.data.items || []).find(it => it.id === itemId);
        if (!item) return;
        adminState.tree.selected = { type: 'item', id: itemId };
        // 切换小节时立即清空旧编辑器，避免加载期间仍显示旧保存按钮
        adminState.theoryEditor = null;
        adminState.practiceEditor = null;
        // 展开父链
        adminState.tree.expanded[`course:${item.course_id}`] = true;
        adminState.tree.expanded[`module:${item.course_id}|${item.module_id}`] = true;
        rerender();
        // 根据类型打开编辑器
        if (item.type === 'theory') {
          await openTheoryEditor(itemId);
        } else if (PRACTICE_ITEM_TYPES.includes(item.type)) {
          await openPracticeEditor(itemId, item.type);
        } else {
          // 未知类型仅刷新右侧详情
          rerender();
        }
      }
      break;
    }
    case 'admin-tree-add': {
      const t = el.dataset.treeType;
      if (t === 'course') {
        // 在该课程下新增模块
        const courseId = el.dataset.id;
        openModal('module', null, true, { course_id: courseId });
      } else if (t === 'module') {
        // 在该模块下新增小节
        const courseId = el.dataset.id;
        const moduleId = el.dataset.moduleId;
        openModal('item', null, true, { course_id: courseId, module_id: moduleId });
      }
      break;
    }
    case 'admin-tree-delete': {
      const entity = el.dataset.entity;
      const id = el.dataset.id;
      if (!entity || !id) return;
      await handleDelete(entity, id);
      break;
    }
    case 'admin-tree-check': {
      const t = el.dataset.treeType;
      let key = null;
      if (t === 'course') {
        key = `course:${el.dataset.id}`;
      } else if (t === 'module') {
        key = `module:${el.dataset.id}|${el.dataset.moduleId}`;
      } else if (t === 'item') {
        key = `item:${el.dataset.id}`;
      }
      if (!key) return;
      if (adminState.tree.checked.has(key)) {
        adminState.tree.checked.delete(key);
      } else {
        adminState.tree.checked.add(key);
      }
      rerender();
      break;
    }
    case 'admin-tree-clear-checks': {
      adminState.tree.checked.clear();
      rerender();
      break;
    }
    case 'admin-tree-batch-delete': {
      await handleBatchDelete();
      break;
    }
    // ─── Exam / 期末试卷 actions ───
    case 'admin-paper-new': {
      await openPaper(null);
      break;
    }
    case 'admin-paper-open': {
      const id = el.dataset.id;
      if (!id) break;
      await openPaper(id);
      break;
    }
    case 'admin-save-paper': {
      await savePaper();
      break;
    }
    case 'admin-paper-preview': {
      const id = el.dataset.id;
      if (!id) break;
      previewPaperId(id);
      break;
    }
    case 'admin-paper-preview-current': {
      previewUnsaved();
      break;
    }
    case 'admin-paper-publish': {
      const id = el.dataset.id;
      if (!id) break;
      await publishPaper(id);
      break;
    }
    case 'admin-paper-publish-current': {
      const ed = adminState.paperEditor;
      if (!ed) break;
      if (!ed.id) {
        // 先保存再发布（savePaper 成功后会 loadSectionData，这里在保存前捕获 name+term 定位）
        adminState.feedback = { type: 'error', message: '请先保存试卷后再发布' };
        rerender();
        break;
      }
      await publishPaper(ed.id);
      break;
    }
    case 'admin-paper-withdraw': {
      const id = el.dataset.id;
      if (!id) break;
      await withdrawPaper(id);
      break;
    }
    case 'admin-paper-delete': {
      const id = el.dataset.id;
      if (!id) break;
      await deletePaper(id);
      break;
    }
    case 'admin-paper-select': {
      const idx = Number(el.dataset.idx);
      if (Number.isNaN(idx)) break;
      paperSelect(idx);
      break;
    }
    case 'admin-paper-add': {
      paperAdd();
      break;
    }
    case 'admin-paper-remove': {
      const idx = Number(el.dataset.idx);
      if (Number.isNaN(idx)) break;
      paperRemove(idx);
      break;
    }
    case 'admin-paper-type': {
      const value = el.dataset.value;
      if (value === undefined || value === '') break;
      paperTypeChange(value);
      break;
    }
    case 'admin-paper-mark': {
      const idx = Number(el.dataset.idx);
      if (Number.isNaN(idx)) break;
      paperMark(idx);
      break;
    }
    case 'admin-paper-open-pool': {
      await openPool();
      break;
    }
    case 'admin-pool-toggle': {
      const id = el.dataset.id;
      if (!id) break;
      poolToggle(id);
      break;
    }
    case 'admin-pool-close': {
      closePool();
      break;
    }
    case 'admin-pool-add': {
      await addPoolToPaper();
      break;
    }
    case 'admin-preview-close': {
      closePreview();
      break;
    }
    default: break;
  }
}
