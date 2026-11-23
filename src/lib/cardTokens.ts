export interface CardWallet {
  points: number;
  balance: number;
  cardIds: string[];
}

export function telegramRewardHeaders() {
  const initData = (window as any).Telegram?.WebApp?.initData;
  return initData ? { 'x-telegram-init-data': String(initData) } : null;
}

export async function fetchCardWallet(): Promise<CardWallet> {
  const headers = telegramRewardHeaders();
  if (!headers) throw new Error('Открой игру в Telegram.');
  const response = await fetch('/api/score?wallet=cards', { headers, cache: 'no-store' });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error);
  return data;
}
