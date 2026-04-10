import "./App.css";
import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import BrandBar from "./components/BrandBar";
import NavBar from "./components/NavBar";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import GameNotActivePage from "./pages/GameNotActivePage";
import ConnectTheDots from "./games/ConnectTheDots";
import CipherDecoder from "./games/CipherDecoder";
import MemoryMatch from "./games/MemoryMatch";
import WordScramble from "./games/WordScramble";
import SecretPuzzle from "./games/SecretPuzzle";
import Leaderboard from "./components/Leaderboard";
import { isLoggedIn } from "./utils/scoring";

const ProtectedRoute = ({ children }) => {
  if (!isLoggedIn()) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const AppContent = () => {
  const location = useLocation();
  const isLoginPage = location.pathname === "/login";

  return (
    <div className="app-shell">
      <div className="app-container">
        {!isLoginPage && <BrandBar />}
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
          <Route path="/dots" element={<ProtectedRoute><ConnectTheDots /></ProtectedRoute>} />
          <Route path="/cipher" element={<ProtectedRoute><CipherDecoder /></ProtectedRoute>} />
          <Route path="/memory" element={<ProtectedRoute><MemoryMatch /></ProtectedRoute>} />
          <Route path="/scramble" element={<ProtectedRoute><WordScramble /></ProtectedRoute>} />
          <Route path="/secret" element={<ProtectedRoute><SecretPuzzle /></ProtectedRoute>} />
          <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
        </Routes>
        {!isLoginPage && (
          <div className="app-footer">
            <span className="app-footer-text">
              Team OJAS -- Cryptic Hunt
            </span>
          </div>
        )}
      </div>
      {!isLoginPage && <NavBar />}
    </div>
  );
};

const App = () => {
  return (
    <Router>
      <GameNotActivePage>
        <AppContent />
      </GameNotActivePage>
    </Router>
  );
};

export default App;