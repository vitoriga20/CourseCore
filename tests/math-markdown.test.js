import test from 'node:test';
import assert from 'node:assert/strict';
import { renderMarkdownWithMath } from '../src/utils/markdown.js';

test('preserves LaTeX subscripts while rendering surrounding Markdown', () => {
  const source = '已知 $z = f(\\ln y - \\sin x)$，求 $\\left.\\frac{dz}{dx}\\right|_{x=0}, \\left.\\frac{d^2z}{dx^2}\\right|_{x=0}$。';

  const html = renderMarkdownWithMath(source);

  assert.match(html, /\\left\.\\frac\{dz\}\{dx\}\\right\|_\{x=0\}/);
  assert.match(html, /\\left\.\\frac\{d\^2z\}\{dx\^2\}\\right\|_\{x=0\}/);
  assert.doesNotMatch(html, /<em>\{x=0\}.*<\/em>/);
});
