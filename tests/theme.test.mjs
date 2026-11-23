import assert from 'node:assert/strict';
import test from 'node:test';
import { applyTheme, loadTheme, saveTheme, THEME_STORAGE_KEY } from '../src/lib/theme.ts';

test('light is the default, and theme choice survives a reload', () => {
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  const values = new Map();
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: key => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, value),
    },
  });

  try {
    assert.equal(loadTheme(), 'light');
    saveTheme('dark');
    assert.equal(values.get(THEME_STORAGE_KEY), 'dark');
    assert.equal(loadTheme(), 'dark');
    saveTheme('light');
    assert.equal(loadTheme(), 'light');
    values.set(THEME_STORAGE_KEY, 'unexpected');
    assert.equal(loadTheme(), 'light');
  } finally {
    if (previous) Object.defineProperty(globalThis, 'localStorage', previous);
    else delete globalThis.localStorage;
  }
});

test('theme colors update the page and Telegram chrome', () => {
  const previousDocument = Object.getOwnPropertyDescriptor(globalThis, 'document');
  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
  const root = { dataset: {}, style: {} };
  const chrome = [];
  let metaColor;

  globalThis.document = {
    documentElement: root,
    querySelector: () => ({ setAttribute: (_name, color) => { metaColor = color; } }),
  };
  globalThis.window = { Telegram: { WebApp: {
    setHeaderColor: color => chrome.push(color),
    setBackgroundColor: color => chrome.push(color),
    setBottomBarColor: color => chrome.push(color),
  } } };

  try {
    applyTheme('dark');
    assert.equal(root.dataset.theme, 'dark');
    assert.equal(root.style.colorScheme, 'dark');
    assert.equal(metaColor, '#10141f');
    assert.deepEqual(chrome, ['#10141f', '#10141f', '#10141f']);
    applyTheme('light');
    assert.equal(root.dataset.theme, 'light');
    assert.equal(metaColor, '#f2f2f7');
  } finally {
    if (previousDocument) Object.defineProperty(globalThis, 'document', previousDocument);
    else delete globalThis.document;
    if (previousWindow) Object.defineProperty(globalThis, 'window', previousWindow);
    else delete globalThis.window;
  }
});
