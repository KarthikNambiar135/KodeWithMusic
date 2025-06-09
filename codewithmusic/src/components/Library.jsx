import React, { useState, useEffect } from "react";
import "./Home.css";
import { GLOBAL_ENDPOINT } from "../constants";

function Library({ onPlaylistClick }) {
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`${GLOBAL_ENDPOINT}/library/`)
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        console.log('Library API Response:', data);
        const sortedPlaylists = (data.playlists || []).sort((a, b) => a.title.localeCompare(b.title));
        setPlaylists(sortedPlaylists);
        setLoading(false);
      })
      .catch(error => {
        console.error('Fetch error:', error);
        setError(error.message);
        setLoading(false);
      });
  }, []);

  const handlePlaylistClick = (playlist) => {
    onPlaylistClick(playlist);
  };

  if (loading) {
    return (
      <main className="main-content">
        <div className="loading">Loading...</div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="main-content">
        <div className="error">Error: {error}</div>
      </main>
    );
  }

  return (
    <main className="main-content">
      <header className="page-header">
        <h1 className="app-title">
          <span className="k-mirrored">K</span><span className="gradient-text">odeWithMusic</span>
        </h1>
      </header>

      <section className="library-section">
        <h2>Your Library</h2>
        <div className="tiles-grid recommended-tiles">
          {playlists.map((playlist, index) => (
            <div 
              key={playlist.id} 
              className="tile playlist-tile" 
              style={{ animationDelay: `${index * 0.1}s` }}
              onClick={() => handlePlaylistClick(playlist)}
            >
              <img src={playlist.cover} alt={playlist.title} />
              <div className="tile-info">
                <h3>{playlist.title}</h3>
                <p>{playlist.count}</p>
                {playlist.description && (
                  <span className="playlist-description">{playlist.description}</span>
                )}
              </div>
              <div className="play-overlay">
                <div className="play-button">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                </div>
              </div>
            </div>
          ))}
        </div>

        {playlists.length === 0 && (
          <div className="empty-library">
            <p>No playlists found. Create your first playlist!</p>
          </div>
        )}
      </section>
    </main>
  );
}

export default Library;