import "./App.css";
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import BrandBar from "./components/BrandBar";
import NavBar from "./components/NavBar";
import HomePage from "./pages/HomePage";
import ConnectTheDots from "./games/ConnectTheDots";
import CipherDecoder from "./games/CipherDecoder";
import MemoryMatch from "./games/MemoryMatch";
import WordScramble from "./games/WordScramble";
import Leaderboard from "./components/Leaderboard";

const App = () => {
  return (
    <Router>
      <div className="app-shell">
        <div className="app-container">
          <BrandBar />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/dots" element={<ConnectTheDots />} />
            <Route path="/cipher" element={<CipherDecoder />} />
            <Route path="/memory" element={<MemoryMatch />} />
            <Route path="/scramble" element={<WordScramble />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
          </Routes>
          <div className="app-footer">
            <span className="app-footer-text">
              Team OJAS -- Cryptic Hunt
            </span>
          </div>
        </div>
        <NavBar />
      </div>
    </Router>
  );
};

export default App;