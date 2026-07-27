export function setTheme(theme) {
  const effectiveTheme = 'dark';
  document.documentElement.setAttribute("data-theme", effectiveTheme);
  localStorage.setItem("coursecore-theme", effectiveTheme);

  const icon = document.getElementById("theme-icon");
  if (icon) {
    icon.innerHTML = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>';
  }

  window.dispatchEvent(new CustomEvent('themechange', { detail: effectiveTheme }));
}

export function toggleTheme() {
  setTheme('dark');
}
