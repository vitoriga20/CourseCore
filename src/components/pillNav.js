function layoutCircles(container) {
  const circles = container.querySelectorAll('.pill-nav-circle');
  circles.forEach(circle => {
    const pill = circle.closest('.pill-nav-link');
    if (!pill) return;
    const rect = pill.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    const R = ((w * w) / 4 + h * h) / (2 * Math.max(h, 1));
    const D = Math.ceil(2 * R) + 2;
    const delta = Math.ceil(R - Math.sqrt(Math.max(0, R * R - (w * w) / 4))) + 1;
    const originY = D - delta;

    circle.style.width = `${D}px`;
    circle.style.height = `${D}px`;
    circle.style.bottom = `-${delta}px`;
    circle.style.transformOrigin = `50% ${originY}px`;
  });
}

export function renderPillNav(items, activeIndex = 0) {
  const liHtml = items.map((item, i) => `
    <li class="${i === activeIndex ? 'active' : ''}" data-index="${i}">
      <a
        href="${item.href || '#'}"
        data-index="${i}"
        data-value="${item.value || item.label}"
        class="pill-nav-link"
        role="tab"
        aria-selected="${i === activeIndex ? 'true' : 'false'}"
      >
        <span class="pill-nav-circle" aria-hidden="true"></span>
        <span class="pill-nav-stack">
          <span class="pill-nav-label">${item.label}</span>
          <span class="pill-nav-label-hover" aria-hidden="true">${item.label}</span>
        </span>
      </a>
    </li>
  `).join('');

  return `
    <nav class="pill-nav" data-pill-nav aria-label="首页板块">
      <ul class="pill-nav-list" role="tablist">
        ${liHtml}
      </ul>
    </nav>
  `;
}

export function initPillNav(container, options = {}) {
  const { onChange } = options;
  const links = Array.from(container.querySelectorAll('a[data-index]'));
  if (links.length === 0) return;

  let activeIndex = links.findIndex(link =>
    link.parentElement.classList.contains('active')
  );
  if (activeIndex < 0) activeIndex = 0;

  const updateActive = (index) => {
    links.forEach((link, i) => {
      const li = link.parentElement;
      const isActive = i === index;
      li.classList.toggle('active', isActive);
      link.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });
  };

  const activate = (index) => {
    if (index === activeIndex) return;
    activeIndex = index;
    updateActive(index);
    if (typeof onChange === 'function') {
      onChange(index, links[index]?.parentElement?.dataset);
    }
  };

  const handleClick = (e) => {
    const link = e.target.closest('a[data-index]');
    if (!link) return;
    e.preventDefault();
    const index = parseInt(link.dataset.index, 10);
    if (Number.isNaN(index)) return;
    activate(index);
  };

  const handleKeyDown = (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const link = e.target.closest('a[data-index]');
    if (!link) return;
    e.preventDefault();
    const index = parseInt(link.dataset.index, 10);
    if (Number.isNaN(index)) return;
    activate(index);
  };

  const handleResize = () => layoutCircles(container);

  container.addEventListener('click', handleClick);
  container.addEventListener('keydown', handleKeyDown);
  window.addEventListener('resize', handleResize);

  if (document.fonts?.ready) {
    document.fonts.ready.then(() => layoutCircles(container)).catch(() => {});
  }
  layoutCircles(container);
  updateActive(activeIndex);

  return {
    destroy() {
      container.removeEventListener('click', handleClick);
      container.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleResize);
    },
    activate
  };
}
