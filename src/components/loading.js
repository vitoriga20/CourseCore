import { escapeHtml } from '../utils.js';

/**
 * CourseCore 原生加载组件集合
 * 参考 shadcn/ui 的 Spinner / Skeleton / Progress 语义，
 * 用 Tailwind CSS + 原生 JS 实现，匹配黑白几何/蛇元素品牌风格。
 */

export function renderSpinner({ size = 'md', label = '' } = {}) {
  const sizeMap = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-[3px]',
    lg: 'w-12 h-12 border-4',
    xl: 'w-16 h-16 border-4'
  };
  const cls = sizeMap[size] || sizeMap.md;
  return `
    <span class="cc-spinner ${cls}" role="status" aria-label="${escapeHtml(label || '加载中')}">
      <span class="sr-only">${escapeHtml(label || '加载中…')}</span>
    </span>
  `;
}

export function renderSpinnerCenter({ size = 'lg', label = '加载中…' } = {}) {
  return `
    <div class="cc-spinner-center">
      ${renderSpinner({ size, label })}
      ${label ? `<span class="cc-spinner-label">${escapeHtml(label)}</span>` : ''}
    </div>
  `;
}

export function renderSkeleton({ className = '', width, height, circle = false } = {}) {
  const style = [];
  if (width) style.push(`width:${width}`);
  if (height) style.push(`height:${height}`);
  const styleAttr = style.length ? ` style="${style.join(';')}"` : '';
  return `
    <div class="cc-skeleton ${circle ? 'cc-skeleton-circle' : 'cc-skeleton-pill'} ${className}"${styleAttr} aria-hidden="true"></div>
  `;
}

export function renderSkeletonCard({ lines = 3 } = {}) {
  return `
    <div class="cc-skeleton-card card" aria-hidden="true">
      <div class="flex items-start justify-between mb-4">
        ${renderSkeleton({ width: '2.5rem', height: '2.5rem', circle: true })}
        ${renderSkeleton({ width: '3rem', height: '1rem' })}
      </div>
      ${renderSkeleton({ width: '60%', height: '1.25rem', className: 'mb-3' })}
      ${renderSkeleton({ width: '100%', height: '0.875rem', className: 'mb-2' })}
      ${Array.from({ length: Math.max(0, lines - 1) }, () => renderSkeleton({ width: `${80 + Math.random() * 20}%`, height: '0.875rem', className: 'mb-2' })).join('')}
      ${renderSkeleton({ width: '100%', height: '0.375rem', className: 'mt-4' })}
    </div>
  `;
}

export function renderProgress({ value = 0, max = 100, className = '' } = {}) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  return `
    <div class="cc-progress ${className}" role="progressbar" aria-valuenow="${value}" aria-valuemin="0" aria-valuemax="${max}">
      <div class="cc-progress-track">
        <div class="cc-progress-fill" style="width: ${pct}%"></div>
      </div>
    </div>
  `;
}

export function renderPageLoader({ label = 'CourseCore' } = {}) {
  return `
    <div id="cc-page-loader" class="cc-page-loader" aria-live="polite">
      <div class="cc-page-loader-inner">
        <div class="cc-page-loader-mark">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
            <path d="M2 17l10 5 10-5"></path>
            <path d="M2 12l10 5 10-5"></path>
          </svg>
        </div>
        ${renderSpinner({ size: 'lg' })}
        <span class="cc-page-loader-label">${escapeHtml(label)}</span>
      </div>
    </div>
  `;
}

export function showPageLoader(label = '加载中…') {
  let el = document.getElementById('cc-page-loader');
  if (!el) {
    el = document.createElement('div');
    el.id = 'cc-page-loader';
    document.body.appendChild(el);
  }
  el.outerHTML = renderPageLoader({ label });
  el = document.getElementById('cc-page-loader');
  if (el) {
    el.classList.add('cc-page-loader--visible');
  }
}

export function hidePageLoader() {
  const el = document.getElementById('cc-page-loader');
  if (!el) return;
  el.classList.remove('cc-page-loader--visible');
  el.classList.add('cc-page-loader--hidden');
  setTimeout(() => {
    if (el.parentNode) el.parentNode.removeChild(el);
  }, 350);
}

export function renderImageWithLoader(src, alt = '题图') {
  const safeSrc = escapeHtml(src);
  const safeAlt = escapeHtml(alt);
  const uniqueId = `cc-img-${Math.random().toString(36).slice(2, 9)}`;
  return `
    <div class="cc-image-loader" id="${uniqueId}" data-src="${safeSrc}" data-alt="${safeAlt}">
      <div class="cc-image-loader__skeleton">
        ${renderSpinner({ size: 'md' })}
      </div>
      <img src="${safeSrc}" alt="${safeAlt}" class="cc-image-loader__img" loading="eager" decoding="async">
    </div>
  `;
}

function markImageLoaded(wrap, skeleton) {
  if (wrap.dataset.ccImageRevealed === 'true') return;
  wrap.dataset.ccImageRevealed = 'true';
  wrap.classList.add('cc-image-loader--loaded');
  if (skeleton) skeleton.style.opacity = '0';
}

function markImageError(wrap, skeleton) {
  if (wrap.dataset.ccImageRevealed === 'true') return;
  wrap.dataset.ccImageRevealed = 'true';
  wrap.classList.add('cc-image-loader--error');
  if (skeleton) skeleton.innerHTML = '<span class="text-xs">图片加载失败</span>';
}

function watchImageLoad(wrap, img, skeleton) {
  if (img.complete) {
    if (img.naturalWidth > 0) {
      markImageLoaded(wrap, skeleton);
    } else {
      markImageError(wrap, skeleton);
    }
    return;
  }

  const onLoad = () => markImageLoaded(wrap, skeleton);
  const onError = () => markImageError(wrap, skeleton);
  img.addEventListener('load', onLoad, { once: true });
  img.addEventListener('error', onError, { once: true });

  const maxChecks = 50;
  let checks = 0;
  const timer = window.setInterval(() => {
    checks += 1;
    const done = img.complete || checks >= maxChecks;
    if (done) {
      window.clearInterval(timer);
      if (img.naturalWidth > 0) {
        markImageLoaded(wrap, skeleton);
      } else {
        markImageError(wrap, skeleton);
      }
      img.removeEventListener('load', onLoad);
      img.removeEventListener('error', onError);
    }
  }, 100);
}

export function initImageLoaders(root = document) {
  const loaders = root.querySelectorAll('.cc-image-loader');
  loaders.forEach((wrap) => {
    const img = wrap.querySelector('img');
    const skeleton = wrap.querySelector('.cc-image-loader__skeleton');
    if (!img || wrap.dataset.ccImageWatched === 'true') return;
    wrap.dataset.ccImageWatched = 'true';
    watchImageLoad(wrap, img, skeleton);
  });
}

export function renderButtonLoader(label = '处理中…') {
  return `
    <span class="cc-btn-loader" aria-hidden="true">
      ${renderSpinner({ size: 'sm' })}
    </span>
    <span>${escapeHtml(label)}</span>
  `;
}

export function setButtonLoading(button, loading = true, originalHTML = null) {
  if (!button) return;
  if (loading) {
    if (!button.dataset.originalHtml) {
      button.dataset.originalHtml = originalHTML ?? button.innerHTML;
    }
    button.disabled = true;
    button.innerHTML = renderButtonLoader();
  } else {
    button.disabled = false;
    if (button.dataset.originalHtml) {
      button.innerHTML = button.dataset.originalHtml;
      delete button.dataset.originalHtml;
    }
  }
}
