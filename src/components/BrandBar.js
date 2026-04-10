import React from "react";
import { Link, useLocation } from "react-router-dom";
import nimbus_logo from "../images/Nimbus copy.png";
import ojas_logo from "../images/orangered copy.png";

const BrandBar = () => {
  const location = useLocation();
  const isHome = location.pathname === "/";

  return (
    <div className="brand-bar">
      <Link to="/" className="brand-link">
        <img src={nimbus_logo} alt="Nimbus logo" className="brand-logo" />
      </Link>
      <div className="brand-center">
        <span className="brand-title">Team OJAS</span>
        {!isHome && (
          <span className="brand-subtitle">Cryptic Hunt</span>
        )}
      </div>
      <Link to="/" className="brand-link">
        <img src={ojas_logo} alt="OJAS logo" className="brand-logo" />
      </Link>
    </div>
  );
};

export default BrandBar;
