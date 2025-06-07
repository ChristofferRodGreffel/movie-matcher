import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";

import Home from "./pages/Home";
import JoinSession from "./pages/JoinSession";
import Session from "./pages/Session";
import MatchFound from "./pages/MatchFound";
import NotFound from "./pages/NotFound";
import NavigationSetup from "./components/NavigationSetup";
import ConfigureSession from "./pages/ConfigureSession";
import Dashboard from "./pages/Dashboard";
import Lobby from "./pages/Lobby";
import Header from "./components/Header";

export default function AppRouter() {
  return (
    <Router>
      <Header />
      <NavigationSetup />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/join" element={<JoinSession />} />
        <Route path="/lobby/:sessionId" element={<Lobby />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/configure/:sessionId" element={<ConfigureSession />} />
        <Route path="/session/:sessionId" element={<Session />} />
        <Route path="/match/:sessionId" element={<MatchFound />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}
