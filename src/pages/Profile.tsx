export default function Profile() {
  return (
    <div className="pixel-page">
      <h2>Профиль</h2>
      <div className="pixel-card">
        <p>Telegram-аккаунт не подключён</p>
        <p>Очки за сезон: —</p>
        <p>Место: —</p>
        <p>Коллекция: 0 / 8</p>
      </div>
      <p style={{ fontSize: '0.7rem', color: '#8888aa' }}>Профиль читает данные из GameStore и RewardStore (localStorage). Демо-режим доступен.</p>
    </div>
  );
}
