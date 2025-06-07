import React from "react";
import "./Navbar.css";

function Navbar({ currentView, onNavClick }) {
  return (
    <nav className="navbar">
      <div className="nav-icons">
        <div className={`nav-icon home-icon ${currentView === 'home' ? 'active' : ''}`} onClick={() => onNavClick('home')}>
          <div className="diamond">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
            </svg>
          </div>
        </div>
        <div className={`nav-icon library-icon ${currentView === 'library' ? 'active' : ''}`}
          onClick={() => onNavClick('library')}
        >
          <div className="diamond">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-1 9H9V9h10v2zm-4 4H9v-2h6v2zm4-8H9V5h10v2z"/>
            </svg>
          </div>
        </div>
        <div className={`nav-icon search-icon ${currentView === 'search' ? 'active' : ''}`}
          onClick={() => onNavClick('search')}>
          <div className="diamond">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
            </svg>
          </div>
        </div>
        <div className={`nav-icon account-icon ${currentView === 'account' ? 'active' : ''}`}
          onClick={() => onNavClick('account')}
        >
          <div className="diamond">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
