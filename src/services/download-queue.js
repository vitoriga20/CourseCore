// 下载队列 store：跨页面持久化待下载项（localStorage）
// 结构：{ [key]: { key, type, title, addedAt, meta } }

const QUEUE_KEY = 'cc-download-queue-v1';

function read() {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function write(data) {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(data));
  } catch {
    // localStorage 满或不可用，忽略
  }
}

export function getQueue() {
  return Object.values(read());
}

export function isQueued(key) {
  return !!read()[key];
}

export function addToQueue(item) {
  const data = read();
  data[item.key] = { ...item, addedAt: Date.now() };
  write(data);
}

export function removeFromQueue(key) {
  const data = read();
  delete data[key];
  write(data);
}

export function toggleQueue(item) {
  if (isQueued(item.key)) removeFromQueue(item.key);
  else addToQueue(item);
}

export function clearQueue() {
  write({});
}