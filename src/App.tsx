import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import Home from './pages/Home';
import League from './pages/League';
import Leaderboard from './pages/Leaderboard';
import Predict from './pages/Predict';
import Collection from './pages/Collection';
import Calendar from './pages/Calendar';
import Profile from './pages/Profile';
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
        <header className="pixel-header">
          <h1>PIXEL FORMULA</h1>
          <p>Fantasy F1 · Beta Merge</p>
        </header>
        <nav className="pixel-nav">
          <NavLink to="/" end>Home</NavLink>
          <NavLink to="/predict">Прогноз</NavLink>
          <NavLink to="/collection">Коллекция</NavLink>
          <NavLink to="/calendar">Календарь</NavLink>
          <NavLink to="/leaderboard">Таблица</NavLink>
          <NavLink to="/profile">Профиль</NavLink>
        </nav>
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/predict" element={<Predict />} />
            <Route path="/league" element={<League />} />
            <Route path="/collection" element={<Collection />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
