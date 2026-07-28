function svgData(svg) {
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

const PLACEHOLDER_SVGS = [
  // 0: 球面投影网格
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <rect width="100" height="100" fill="#111"/>
    <circle cx="50" cy="50" r="38" fill="none" stroke="#fff" stroke-width="0.6" opacity="0.35"/>
    <ellipse cx="50" cy="50" rx="38" ry="12" fill="none" stroke="#fff" stroke-width="0.5" opacity="0.3"/>
    <ellipse cx="50" cy="50" rx="12" ry="38" fill="none" stroke="#fff" stroke-width="0.5" opacity="0.3"/>
    <path d="M12 50h76M50 12v76" stroke="#fff" stroke-width="0.5" opacity="0.25"/>
    <circle cx="50" cy="50" r="3" fill="#fff"/>
  </svg>`,

  // 1: 蛇形螺旋
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <rect width="100" height="100" fill="#fff"/>
    <path d="M50 15c25 0 35 15 35 30 0 20-20 30-35 30-15 0-25-8-25-20 0-12 12-18 25-18 12 0 20 7 20 16 0 10-10 15-20 15" fill="none" stroke="#111" stroke-width="3.5" stroke-linecap="round"/>
    <circle cx="50" cy="15" r="4.5" fill="#111"/>
  </svg>`,

  // 2: 三角分布十字星
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <rect width="100" height="100" fill="#f5f5f7"/>
    <g fill="#111">
      <path d="M50 18l4.5 12h12l-9.5 7 3.5 12-10.5-7.5-10.5 7.5 3.5-12-9.5-7h12z"/>
      <path d="M22 62l3.2 9h9l-7.2 5 2.8 9-7.8-5.5-7.8 5.5 2.8-9-7.2-5h9z"/>
      <path d="M66 64l2.6 7.5h7.5l-6 4.3 2.3 7.5-6.4-4.3-6.4 4.3 2.3-7.5-6-4.3h7.5z"/>
    </g>
  </svg>`,

  // 3: 六边形蜂巢
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <rect width="100" height="100" fill="#111"/>
    <g stroke="#fff" stroke-width="1" fill="none" opacity="0.75">
      <path d="M25 20h15l7.5 13-7.5 13H25l-7.5-13z"/>
      <path d="M60 20h15l7.5 13-7.5 13H60l-7.5-13z"/>
      <path d="M42.5 46h15l7.5 13-7.5 13h-15l-7.5-13z"/>
    </g>
  </svg>`,

  // 4: 棋盘格
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <rect width="100" height="100" fill="#fff"/>
    <g fill="#111">
      <rect x="10" y="10" width="15" height="15"/>
      <rect x="40" y="10" width="15" height="15"/>
      <rect x="70" y="10" width="15" height="15"/>
      <rect x="25" y="25" width="15" height="15"/>
      <rect x="55" y="25" width="15" height="15"/>
      <rect x="85" y="25" width="15" height="15"/>
      <rect x="10" y="40" width="15" height="15"/>
      <rect x="40" y="40" width="15" height="15"/>
      <rect x="70" y="40" width="15" height="15"/>
      <rect x="25" y="55" width="15" height="15"/>
      <rect x="55" y="55" width="15" height="15"/>
      <rect x="85" y="55" width="15" height="15"/>
      <rect x="10" y="70" width="15" height="15"/>
      <rect x="40" y="70" width="15" height="15"/>
      <rect x="70" y="70" width="15" height="15"/>
    </g>
  </svg>`,

  // 5: 波浪线
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <rect width="100" height="100" fill="#111"/>
    <g stroke="#fff" stroke-width="2.5" fill="none" opacity="0.9">
      <path d="M10 32q20-18 40 0t40 0"/>
      <path d="M10 52q20-18 40 0t40 0"/>
      <path d="M10 72q20-18 40 0t40 0"/>
    </g>
  </svg>`,

  // 6: 同心圆
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <rect width="100" height="100" fill="#fff"/>
    <g fill="none" stroke="#111" stroke-width="2">
      <circle cx="50" cy="50" r="10"/>
      <circle cx="50" cy="50" r="20"/>
      <circle cx="50" cy="50" r="30"/>
      <circle cx="50" cy="50" r="40"/>
    </g>
  </svg>`,

  // 7: 斜条纹
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <rect width="100" height="100" fill="#111"/>
    <g stroke="#fff" stroke-width="5" opacity="0.8">
      <line x1="-10" y1="10" x2="10" y2="-10"/>
      <line x1="-10" y1="30" x2="30" y2="-10"/>
      <line x1="-10" y1="50" x2="50" y2="-10"/>
      <line x1="-10" y1="70" x2="70" y2="-10"/>
      <line x1="-10" y1="90" x2="90" y2="-10"/>
      <line x1="10" y1="110" x2="110" y2="10"/>
      <line x1="30" y1="110" x2="110" y2="30"/>
      <line x1="50" y1="110" x2="110" y2="50"/>
    </g>
  </svg>`
];

export const AVATAR_CHOICES = PLACEHOLDER_SVGS.map(svgData);

export function getDefaultAvatar(seed = 'Admin') {
  const str = String(seed);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }
  return AVATAR_CHOICES[hash % AVATAR_CHOICES.length];
}
