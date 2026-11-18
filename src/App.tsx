import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import Home from './pages/Home';
import League from './pages/League';
import Leaderboard from './pages/Leaderboard';
import Predict from './pages/Predict';
import Collection from './pages/Collection';
import Calendar from './pages/Calendar';
import Profile from './pages/Profile';
import Reward from './pages/Reward';
import './App.css';

function App() {
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
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </main>

        <nav className="tab-bar">
          <NavLink to="/" end>
            <span className="icon">🏠</span>
            Home
          </NavLink>
          <NavLink to="/predict">
            <span className="icon">🏁</span>
            Прогноз
          </NavLink>
          <NavLink to="/reward">
            <span className="icon">🎁</span>
            Награда
          </NavLink>
          <NavLink to="/collection">
            <span className="icon">🃏</span>
            Карты
          </NavLink>
          <NavLink to="/leaderboard">
            <span className="icon">🏆</span>
            Таблица
          </NavLink>
          <NavLink to="/profile">
            <span className="icon">👤</span>
            Профиль
          </NavLink>
        </nav>
      </div>
    </BrowserRouter>
  );
}

export default App;
