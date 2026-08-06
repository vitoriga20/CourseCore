// 刷题板块数据服务 + 缓存层
// 从 BFF /api/v1 读取 exam_papers/sections/questions，内存 Map + localStorage 双层缓存
// TTL 1 小时，BFF 不可用时 fallback 到静态 examPapers.js

import { apiGet } from './apiClient.js';
import { EXAM_PAPERS } from '../data/examPapers.js';

const CACHE_KEY = 'cc-practice-exam-papers-v2';
const CACHE_TTL = 60 * 60 * 1000; // 1 小时

let memCache = null;
let memCacheTime = null;
let fetching = null; // 防止并发重复请求

// ============================================================
// Supabase 查询
// ============================================================

/**
 * 将 Supabase 返回的 snake_case 题目字段统一补充 camelCase，
 * 与静态 examPapers.js 保持一致。
 */
function normalizeQuestion(q) {
  return {
    ...q,
    questionType: q.question_type,
    orderIndex: q.order_index,
    testString: q.test_string,
    answerReveal: q.answer_reveal,
  };
}

async function fetchExamPapersFromBff() {
  try {
    // 过渡期：刷题需客户端判分，带 includeAnswer=true 取答案列；
    // Phase 2 判分服务端化后移除该参数。
    const pageSize = 100;
    const all = [];
    let page = 1;
    for (;;) {
      const { data, meta } = await apiGet('/papers', {
        includeQuestions: 'true',
        includeAnswer: 'true',
        pageSize,
        page,
      });
      const rows = data ?? [];
      all.push(...rows);
      const total = meta?.total ?? (rows.length === 0 ? all.length : all.length + 1);
      if (rows.length === 0 || all.length >= total || pageSize * page >= total) break;
      page++;
    }

    if (all.length === 0) return null;

    // 组装成嵌套结构（与 examPapers.js 一致）
    return all.map(paper => ({
      id: paper.id,
      school: paper.school,
      college: paper.college,
      subject: paper.subject,
      term: paper.term,
      duration: paper.duration,
      sections: (paper.sections || [])
        .sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
        .map(sec => ({
          id: sec.id,
          examId: sec.exam_id,
          title: sec.title,
          orderIndex: sec.order_index,
          questions: (sec.exam_questions || [])
            .sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
            .map(normalizeQuestion)
        }))
    }));
  } catch (e) {
    console.warn('[practice-data] BFF 拉取失败，使用静态数据:', e?.message || e);
    return null;
  }
}

// ============================================================
// 缓存读写
// ============================================================
function readLocalCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.time > CACHE_TTL) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

function writeLocalCache(data) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ time: Date.now(), data }));
  } catch {
    // localStorage 满或不可用，忽略
  }
}

// ============================================================
// 对外 API
// ============================================================

/**
 * 获取所有试卷（含 sections + questions）
 * 优先级: 内存缓存 → localStorage → Supabase → 静态 examPapers.js
 */
export async function getExamPapers() {
  // 1. 内存缓存
  if (memCache && Date.now() - memCacheTime < CACHE_TTL) {
    return memCache;
  }

  // 2. localStorage 缓存
  const localData = readLocalCache();
  if (localData) {
    memCache = localData;
    memCacheTime = Date.now();
    return localData;
  }

  // 3. BFF（防止并发重复请求）
  if (!fetching) {
    fetching = fetchExamPapersFromBff();
  }
  const remoteData = await fetching;
  fetching = null;

  if (remoteData) {
    memCache = remoteData;
    memCacheTime = Date.now();
    writeLocalCache(remoteData);
    return remoteData;
  }

  // 4. 静态 fallback
  return EXAM_PAPERS;
}

/**
 * 获取单个试卷
 */
export async function getExamPaper(id) {
  const papers = await getExamPapers();
  return papers.find(p => p.id === id) || null;
}

/**
 * 按学科分组试卷
 */
export async function getExamPapersBySubject() {
  const papers = await getExamPapers();
  const grouped = {};
  for (const paper of papers) {
    const subject = paper.subject || '其他';
    if (!grouped[subject]) grouped[subject] = [];
    grouped[subject].push(paper);
  }
  return grouped;
}

/**
 * 获取所有学科列表
 */
export async function getSubjects() {
  const papers = await getExamPapers();
  return [...new Set(papers.map(p => p.subject).filter(Boolean))];
}

/**
 * 按学科 + 题型筛选题目（跨卷抽题）
 * @param {string} subject - 学科名（高数/线代/大物）
 * @param {number} questionType - 题型 (0=单选 1=多选 2=填空 3=计算 4=证明 5=判断)
 */
export async function getQuestionsByType(subject, questionType) {
  const papers = await getExamPapers();
  const result = [];
  for (const paper of papers) {
    if (paper.subject !== subject) continue;
    for (const sec of paper.sections || []) {
      for (const q of sec.questions || []) {
        if (q.questionType === questionType) {
          result.push({
            ...q,
            sourceExamId: paper.id,
            sourceExamName: `${paper.subject}·${paper.term || ''}`
          });
        }
      }
    }
  }
  return result;
}

/**
 * 获取题量统计（按学科 + 题型）
 */
export async function getQuestionTypeStats() {
  const papers = await getExamPapers();
  const stats = {};
  for (const paper of papers) {
    const subject = paper.subject || '其他';
    if (!stats[subject]) stats[subject] = {};
    for (const sec of paper.sections || []) {
      for (const q of sec.questions || []) {
        const type = q.questionType;
        if (!stats[subject][type]) stats[subject][type] = 0;
        stats[subject][type]++;
      }
    }
  }
  return stats;
}

/**
 * 清除题库缓存（数据更新后调用）
 */
export function invalidateExamPapers() {
  memCache = null;
  memCacheTime = null;
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch {
    // ignore
  }
}

/**
 * 预热缓存（应用启动时调用）
 */
export async function warmupCache() {
  try {
    await getExamPapers();
  } catch (e) {
    console.warn('[practice-data] warmup 失败:', e);
  }
}
