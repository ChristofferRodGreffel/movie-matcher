import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';

import Home from './pages/Home';
import CreateSession from './pages/CreateSession';
import JoinSession from './pages/JoinSession';
import Session from './pages/Session';
import MatchFound from './pages/MatchFound';
import NotFound from './pages/NotFound';
import NavigationSetup from './components/NavigationSetup';

export default function AppRouter() {
  return (
    <Router>
      <NavigationSetup />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/create" element={<CreateSession />} />
        <Route path="/join" element={<JoinSession />} />
        <Route path="/session/:sessionId" element={<Session />} />
        <Route path="/match/:sessionId" element={<MatchFound />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}
