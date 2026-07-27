export function renderGooeyNav(items, activeIndex = 0) {
  const liHtml = items.map((item, i) => `
    <li class="${i === activeIndex ? 'active' : ''}" data-index="${i}">
      <a href="${item.href || '#'}" data-index="${i}" data-value="${item.value || item.label}">
        ${item.label}
      </a>
    </li>
  `).join('');

  return `
    <div class="gooey-nav-container" data-gooey-nav>
      <nav>
        <ul>
          ${liHtml}
        </ul>
      </nav>
      <span class="effect filter"></span>
      <span class="effect text"></span>
    </div>
  `;
}

export function initGooeyNav(container, options = {}) {
  const {
    animationTime = 600,
    particleCount = 15,
    particleDistances = [90, 10],
    particleR = 100,
    timeVariance = 300,
    colors = [1, 2, 3, 1, 2, 3, 1, 4],
    onChange
  } = options;

  const nav = container.querySelector('nav');
  const filter = container.querySelector('.effect.filter');
  const text = container.querySelector('.effect.text');
  const lis = Array.from(container.querySelectorAll('li'));
  if (!nav || !filter || !text || lis.length === 0) return;

  let activeIndex = lis.findIndex(li => li.classList.contains('active'));
  if (activeIndex < 0) activeIndex = 0;

  const noise = (n = 1) => n / 2 - Math.random() * n;

  const getXY = (distance, pointIndex, totalPoints) => {
    const angle = ((360 + noise(8)) / totalPoints) * pointIndex * (Math.PI / 180);
    return [distance * Math.cos(angle), distance * Math.sin(angle)];
  };

  const createParticle = (i, t, d, r) => {
    const rotate = noise(r / 10);
    return {
      start: getXY(d[0], particleCount - i, particleCount),
      end: getXY(d[1] + noise(7), particleCount - i, particleCount),
      time: t,
      scale: 1 + noise(0.2),
      color: colors[Math.floor(Math.random() * colors.length)],
      rotate: rotate > 0 ? (rotate + r / 20) * 10 : (rotate - r / 20) * 10
    };
  };

  const makeParticles = element => {
    const d = particleDistances;
    const r = particleR;
    const bubbleTime = animationTime * 2 + timeVariance;
    element.style.setProperty('--time', `${bubbleTime}ms`);

    for (let i = 0; i < particleCount; i++) {
      const t = animationTime * 2 + noise(timeVariance * 2);
      const p = createParticle(i, t, d, r);
      element.classList.remove('active');

      setTimeout(() => {
        const particle = document.createElement('span');
        const point = document.createElement('span');
        particle.classList.add('particle');
        particle.style.setProperty('--start-x', `${p.start[0]}px`);
        particle.style.setProperty('--start-y', `${p.start[1]}px`);
        particle.style.setProperty('--end-x', `${p.end[0]}px`);
        particle.style.setProperty('--end-y', `${p.end[1]}px`);
        particle.style.setProperty('--time', `${p.time}ms`);
        particle.style.setProperty('--scale', `${p.scale}`);
        particle.style.setProperty('--color', `var(--color-${p.color}, white)`);
        particle.style.setProperty('--rotate', `${p.rotate}deg`);

        point.classList.add('point');
        particle.appendChild(point);
        element.appendChild(particle);
        requestAnimationFrame(() => {
          element.classList.add('active');
        });
        setTimeout(() => {
          try {
            element.removeChild(particle);
          } catch {
            // ignore
          }
        }, t);
      }, 30);
    }
  };

  const updateEffectPosition = element => {
    const containerRect = container.getBoundingClientRect();
    const pos = element.getBoundingClientRect();

    const styles = {
      left: `${pos.x - containerRect.x}px`,
      top: `${pos.y - containerRect.y}px`,
      width: `${pos.width}px`,
      height: `${pos.height}px`
    };
    Object.assign(filter.style, styles);
    Object.assign(text.style, styles);
    text.innerText = element.innerText.trim();
  };

  const activate = (index) => {
    if (index === activeIndex) return;
    activeIndex = index;

    lis.forEach((li, i) => {
      li.classList.toggle('active', i === index);
    });

    const liEl = lis[index];
    if (!liEl) return;

    updateEffectPosition(liEl);

    const particles = filter.querySelectorAll('.particle');
    particles.forEach(p => {
      try {
        filter.removeChild(p);
      } catch {
        // ignore
      }
    });

    text.classList.remove('active');
    void text.offsetWidth;
    text.classList.add('active');

    makeParticles(filter);

    if (typeof onChange === 'function') {
      onChange(index, lis[index]?.dataset);
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

  container.addEventListener('click', handleClick);
  container.addEventListener('keydown', handleKeyDown);

  const initActive = () => {
    const activeLi = lis[activeIndex];
    if (activeLi) {
      updateEffectPosition(activeLi);
      text.classList.add('active');
    }
  };

  initActive();

  const resizeObserver = new ResizeObserver(() => {
    const currentActiveLi = lis[activeIndex];
    if (currentActiveLi) {
      updateEffectPosition(currentActiveLi);
    }
  });

  resizeObserver.observe(container);

  return {
    destroy() {
      container.removeEventListener('click', handleClick);
      container.removeEventListener('keydown', handleKeyDown);
      resizeObserver.disconnect();
    },
    activate
  };
}
