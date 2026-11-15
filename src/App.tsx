import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import Home from './pages/Home';
import League from './pages/League';
import Team from './pages/Team';
import Leaderboard from './pages/Leaderboard';
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
    } else {
      console.log('Running in browser mode (not Telegram)');
    }
  }, []);

  return (
    <BrowserRouter>
      <div className="app">
        <header className="pixel-header">
          <h1>PIXEL FORMULA</h1>
          <p>Fantasy F1</p>
        </header>
        <nav className="pixel-nav">
          <NavLink to="/" end>Home</NavLink>
          <NavLink to="/league">Лига</NavLink>
          <NavLink to="/team">Команда</NavLink>
          <NavLink to="/leaderboard">Таблица</NavLink>
        </nav>
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/league" element={<League />} />
            <Route path="/team" element={<Team />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
