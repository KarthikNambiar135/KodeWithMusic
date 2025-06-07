import React, { useState, useEffect } from "react";
import "./PlaylistView.css";

function PlaylistView({ playlist, onSongClick, onBack }) {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (playlist && playlist.id) {
      fetch(`https://kodewithmusic-backend.onrender.com/api/playlist/${playlist.id}/songs/`)
        .then(res => {
          if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
          }
          return res.json();
        })
        .then(data => {
          console.log('Playlist songs:', data);
          setSongs(data.songs || []);
          setLoading(false);
        })
        .catch(error => {
          console.error('Fetch error:', error);
          setError(error.message);
          setLoading(false);
        });
    }
  }, [playlist]);

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
      <header className="playlist-header">
        <button className="back-button" onClick={onBack}>
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
          </svg>
          Back
        </button>
        
        <div className="playlist-info">
          <img src={playlist.cover} alt={playlist.title} className="playlist-cover" />
          <div className="playlist-details">
            <h1>{playlist.title}</h1>
            <p className="playlist-meta">{playlist.count}</p>
            {playlist.description && (
              <p className="playlist-description">{playlist.description}</p>
            )}
          </div>
        </div>
      </header>

      <section className="playlist-songs">
        <div className="songs-list">
          {songs.map((song, index) => (
            <div 
              key={song.id} 
              className="song-row" 
              style={{ animationDelay: `${index * 0.05}s` }}
              onClick={() => onSongClick(song, index, songs)}
            >
              <div className="song-number">{index + 1}</div>
              <img src={song.cover} alt={song.title} className="song-cover" />
              <div className="song-details">
                <h4 className="song-title">{song.title}</h4>
                <p className="song-artist">{song.artist.name}</p>
              </div>
              <div className="song-duration">{song.duration}</div>
              <div className="song-actions">
                <button className="play-btn">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>

        {songs.length === 0 && (
          <div className="empty-playlist">
            <p>This playlist is empty.</p>
          </div>
        )}
      </section>
    </main>
  );
}

export default PlaylistView;