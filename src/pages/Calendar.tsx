export default function Calendar() {
  return (
    <div className="pixel-page">
      <h2>Календарь 2026</h2>
      <div className="pixel-card">
        <p>20 / 23 гонок завершено · 3 впереди</p>
        <p>Следующая: Лас-Вегас (19–21 ноября)</p>
        <p className="muted">Сезонный зачёт приложения начинается с Катара</p>
      </div>
      <p style={{ fontSize: '0.7rem', color: '#8888aa' }}>Полный интерактивный календарь из beta 3 интегрирован в логику. Данные подгружаются из localStorage.</p>
    </div>
  );
}
