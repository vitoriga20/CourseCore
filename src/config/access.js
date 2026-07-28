import { COURSES } from '../data/courses.js';

// 免费规则：每个课程的第一个模块前 4 个 item 对游客开放
const FREE_ITEMS_PER_COURSE = 4;

function computeFreeItemIds() {
  const ids = new Set();
  for (const course of COURSES) {
    const firstModule = course.modules[0];
    if (!firstModule) continue;
    for (let i = 0; i < Math.min(FREE_ITEMS_PER_COURSE, firstModule.items.length); i++) {
      ids.add(firstModule.items[i].id);
    }
  }
  return ids;
}

export const FREE_ITEM_IDS = computeFreeItemIds();

export function isItemFree(itemId) {
  return FREE_ITEM_IDS.has(itemId);
}
