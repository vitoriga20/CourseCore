export const ROUTES = {
  home: { path: '/', view: 'landing' },
  kb: { path: '/kb', view: 'knowledge' },
  bank: { path: '/bank', view: 'bank' },
  exams: { path: '/exams', view: 'exam' },
  // 刷题板块
  practice: { path: '/practice', view: 'practice-overview' },
  practiceExams: { path: '/practice/exams', view: 'practice-exams' },
  practiceTypes: { path: '/practice/types', view: 'practice-types' },
  practiceQuiz: { path: '/practice/quiz', view: 'practice-session' },
  practiceAddPaper: { path: '/practice/add', view: 'add-my-paper' },
  // 知识库细分（/kb 为统一 hub，/kb/review 为错题复盘会话）
  reviewSession: { path: '/kb/review', view: 'review-session' },
  // 社区
  community: { path: '/community', view: 'community' },
  // 注意：静态路径必须排在动态 :postId 之前，否则 /community/post 会被误匹配成文章详情
  communityNew: { path: '/community/post', view: 'post-new' },
  communityPost: { path: '/community/:postId', view: 'community-detail', params: ['postId'] },
  // 我的刷题记录
  userRecords: { path: '/user/records', view: 'user-records' },
  privacy: { path: '/privacy', view: 'privacy' },
  terms: { path: '/terms', view: 'terms' },
  user: { path: '/user', view: 'user' },
  download: { path: '/download', view: 'download' },
  admin: { path: '/admin', view: 'admin' },
  course: { path: '/course/:courseId', view: 'course', params: ['courseId'] },
  item: { path: '/item/:itemId', view: 'practice-list', params: ['itemId'] },
  question: { path: '/question/:qid', view: 'practice', params: ['qid'] },
  exam: { path: '/exams/:examId', view: 'exam-detail', params: ['examId'] },
  examQuestion: { path: '/exams/:examId/questions/:qid', view: 'practice', params: ['examId', 'qid'] }
};

const compiled = Object.entries(ROUTES).map(([name, cfg]) => {
  const paramNames = [];
  const regex = new RegExp('^' + cfg.path.replace(/:([^/]+)/g, (_, key) => {
    paramNames.push(key);
    return '([^/]+)';
  }) + '$');
  return { name, cfg, regex, paramNames };
});

export function matchRoute(path) {
  // 统一去掉尾斜杠（根路径除外），避免 Cloudflare 把 /admin 重定向成 /admin/ 后匹配失败
  if (path.length > 1 && path.endsWith('/')) path = path.slice(0, -1);
  for (const { name, cfg, regex, paramNames } of compiled) {
    const m = path.match(regex);
    if (!m) continue;
    const params = {};
    paramNames.forEach((key, i) => { params[key] = decodeURIComponent(m[i + 1]); });
    return { name, view: cfg.view, params };
  }
  return null;
}

export function isInternalPath(path) {
  return !!matchRoute(path);
}

export function buildPath(routeName, params = {}) {
  const cfg = ROUTES[routeName];
  if (!cfg) return '/';
  return cfg.path.replace(/:([^/]+)/g, (_, key) => {
    const value = params[key];
    return value === undefined ? `:${key}` : encodeURIComponent(value);
  });
}

export const href = buildPath;

export function getStaticPaths(courses, questions, examPapers) {
  const paths = [
    '/',
    '/kb',
    '/bank',
    '/exams',
    '/practice',
    '/practice/exams',
    '/practice/types',
    '/practice/quiz',
    '/practice/add',
    '/kb/review',
    '/community',
    '/community/post',
    '/user/records',
    '/privacy',
    '/terms',
    '/user',
    '/download',
    '/admin'
  ];

  for (const course of courses) {
    paths.push(buildPath('course', { courseId: course.id }));
    for (const module of course.modules) {
      for (const item of module.items) {
        paths.push(buildPath('item', { itemId: item.id }));
      }
    }
  }

  for (const q of questions) {
    paths.push(buildPath('question', { qid: q.id }));
  }

  for (const exam of examPapers) {
    paths.push(buildPath('exam', { examId: exam.id }));
    for (const sec of exam.sections) {
      for (const q of sec.questions) {
        paths.push(buildPath('examQuestion', { examId: exam.id, qid: q.id }));
      }
    }
  }

  return paths;
}
