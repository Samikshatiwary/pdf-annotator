// Applies the theme by toggling a `dark` class on <html> and persisting the choice.
export const applyTheme = (theme) => {
  const isDark = theme === 'dark';
  document.documentElement.classList.toggle('dark', isDark);
  try {
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  } catch {
    /* ignore storage errors */
  }
};

// Reads the persisted theme on app start and applies it.
export const initTheme = () => {
  let theme = 'light';
  try {
    theme = localStorage.getItem('theme') || 'light';
  } catch {
    /* ignore */
  }
  document.documentElement.classList.toggle('dark', theme === 'dark');
  return theme;
};
