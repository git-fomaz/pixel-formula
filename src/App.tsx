import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import Home from './pages/Home';
import League from './pages/League';
import Leaderboard from './pages/Leaderboard';
import Predict from './pages/Predict';
import Collection from './pages/Collection';
import Calendar from './pages/Calendar';
import Profile from './pages/Profile';
import Reward from './pages/Reward';
import { applyTheme, loadTheme, saveTheme, type ThemeMode } from './lib/theme';
import './App.css';

function App() {
  const [theme, setTheme] = useState<ThemeMode>(loadTheme);

  useEffect(() => {
    applyTheme(theme);
    saveTheme(theme);
  }, [theme]);

  useEffect(() => {
    const isTelegram = !!(window as any).Telegram?.WebApp;
    if (isTelegram) {
      try {
        import('@tma.js/sdk-react').then(({ init, miniApp, themeParams, viewport }) => {
          try {
            init();
            miniApp.ready();
            themeParams.bindCssVars();
            viewport.expand();
          } catch (e) {
            console.log('Telegram SDK init failed', e);
          }
        });
      } catch (e) {
        console.log('Not running inside Telegram');
      }
    }
  }, []);

  return (
    <BrowserRouter>
      <div className="app">
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/predict" element={<Predict />} />
            <Route path="/reward" element={<Reward />} />
            <Route path="/league" element={<League />} />
            <Route path="/collection" element={<Collection />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/profile" element={<Profile theme={theme} onThemeChange={setTheme} />} />
          </Routes>
        </main>

        <nav className="tab-bar">
          <NavLink to="/" end>
            <img src="/icons/home.jpg" alt="" className="tab-icon" />
            Home
          </NavLink>
          <NavLink to="/predict">
            <img src="/icons/predict.jpg" alt="" className="tab-icon" />
            Прогноз
          </NavLink>
          <NavLink to="/reward">
            <img src="/icons/reward.jpg" alt="" className="tab-icon" />
            Награда
          </NavLink>
          <NavLink to="/collection">
            <img src="/icons/cards.jpg" alt="" className="tab-icon" />
            Карты
          </NavLink>
          <NavLink to="/leaderboard">
            <img src="/icons/leaderboard.jpg" alt="" className="tab-icon" />
            Таблица
          </NavLink>
          <NavLink to="/profile">
            <img src="/icons/profile.jpg" alt="" className="tab-icon" />
            Профиль
          </NavLink>
        </nav>
      </div>
    </BrowserRouter>
  );
}

export default App;
