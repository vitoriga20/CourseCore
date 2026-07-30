export const ROUTES = {
  home: { path: '/', view: 'landing' },
  kb: { path: '/kb', view: 'knowledge' },
  bank: { path: '/bank', view: 'bank' },
  exams: { path: '/exams', view: 'exam' },
  privacy: { path: '/privacy', view: 'privacy' },
  terms: { path: '/terms', view: 'terms' },
  user: { path: '/user', view: 'user' },
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
    '/privacy',
    '/terms',
    '/user',
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
