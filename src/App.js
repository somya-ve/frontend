import "./App.css";
import React from "react";
import Leaderboard from "./components/Leaderboard";

const App = () => {
  return (
    <div className="app-shell">
      <div className="app-container">
        <Leaderboard />
        <div className="app-footer">
          <span className="app-footer-text">
            Team OJAS -- Cryptic Hunt
          </span>
        </div>
      </div>
    </div>
  );
};

export default App;