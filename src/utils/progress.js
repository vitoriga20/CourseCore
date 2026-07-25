const STORAGE_KEY = 'coursecore-state';
const LEGACY_KEYS = ['coursecore-progress', 'coursecore-questions', 'coursecore-theme'];

export function getStoredState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse stored state', e);
  }
  return null;
}

export function storeState(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to store state', e);
  }
}

export function migrateLegacyState() {
  const migrated = {};

  try {
    const progressRaw = localStorage.getItem('coursecore-progress');
    if (progressRaw) {
      migrated.progress = JSON.parse(progressRaw);
    }
  } catch (e) {
    console.error('Failed to migrate progress', e);
  }

  try {
    const qRaw = localStorage.getItem('coursecore-questions');
    if (qRaw) {
      const oldCompleted = JSON.parse(qRaw);
      migrated.completedQuestions = migrateCompletedQuestions(oldCompleted);
    }
  } catch (e) {
    console.error('Failed to migrate completed questions', e);
  }

  try {
    const themeRaw = localStorage.getItem('coursecore-theme');
    if (themeRaw) {
      migrated.theme = themeRaw;
    }
  } catch (e) {
    console.error('Failed to migrate theme', e);
  }

  return migrated;
}

export function migrateCompletedQuestions(oldCompleted) {
  const migrated = {};
  for (const [qid, record] of Object.entries(oldCompleted || {})) {
    if (record && typeof record === 'object') {
      migrated[qid] = {
        passed: record.correct === true ? true : record.correct === false ? false : null,
        attempts: record.attempts ?? 1,
        lastAnswer: record.lastAnswer ?? null,
        lastAt: record.at ?? record.lastAt ?? Date.now()
      };
    } else {
      migrated[qid] = {
        passed: Boolean(record),
        attempts: 1,
        lastAnswer: null,
        lastAt: Date.now()
      };
    }
  }
  return migrated;
}

export function clearLegacyKeys() {
  for (const key of LEGACY_KEYS) {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.error(`Failed to remove legacy key ${key}`, e);
    }
  }
}

export function loadPersistedData() {
  const stored = getStoredState();
  if (stored) {
    return stored;
  }

  const migrated = migrateLegacyState();
  if (Object.keys(migrated).length > 0) {
    storeState(migrated);
    clearLegacyKeys();
  }
  return migrated;
}
