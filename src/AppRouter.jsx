import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";

import Home from "./pages/Home";
import JoinSession from "./pages/JoinSession";
import Session from "./pages/Session";
import MatchFound from "./pages/MatchFound";
import NotFound from "./pages/NotFound";
import NavigationSetup from "./components/NavigationSetup";
import ConfigureSession from "./pages/ConfigureSession";
import Dashboard from "./pages/Dashboard";

export default function AppRouter() {
  return (
    <Router>
      <NavigationSetup />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/configure" element={<ConfigureSession />} />
        <Route path="/join" element={<JoinSession />} />
        <Route path="/lobby/:sessionId" element={<Session />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/session/:sessionId" element={<Session />} />
        <Route path="/match/:sessionId" element={<MatchFound />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}
