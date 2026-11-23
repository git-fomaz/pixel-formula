export type ThemeMode = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'pf:theme:v1';

export function loadTheme(): ThemeMode {
  try {
    return localStorage.getItem(THEME_STORAGE_KEY) === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

export function applyTheme(theme: ThemeMode) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;

  const backgroundColor = theme === 'dark' ? '#10141f' : '#f2f2f7';
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  metaThemeColor?.setAttribute('content', backgroundColor);

  try {
    const telegram = (window as any).Telegram?.WebApp;
    telegram?.setHeaderColor?.(backgroundColor);
    telegram?.setBackgroundColor?.(backgroundColor);
    telegram?.setBottomBarColor?.(backgroundColor);
  } catch {
    // The Telegram bridge may be unavailable in a regular browser.
  }
}

export function saveTheme(theme: ThemeMode) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Keep the selected theme active even if browser storage is disabled.
  }
}
