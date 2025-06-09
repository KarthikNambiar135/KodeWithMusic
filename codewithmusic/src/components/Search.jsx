import React, { useState, useEffect, useCallback } from "react";
import "./search.css";
import { GLOBAL_ENDPOINT } from "../constants";

function Search({ onSongClick, onPlaylistClick }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState({
    songs: [],
    artists: [],
    playlists: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [totalResults, setTotalResults] = useState({
    songs: 0,
    artists: 0,
    playlists: 0
  });

  // Debounced search function
  const performSearch = useCallback(async (query) => {
    if (!query.trim()) {
      setSearchResults({ songs: [], artists: [], playlists: [] });
      setHasSearched(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${GLOBAL_ENDPOINT}/search/?q=${encodeURIComponent(query.trim())}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setSearchResults({
          songs: data.songs || [],
          artists: data.artists || [],
          playlists: data.playlists || []
        });
        setTotalResults(data.total_results || { songs: 0, artists: 0, playlists: 0 });
        setHasSearched(true);
      } else {
        throw new Error(data.error || 'Search failed');
      }
    } catch (error) {
      console.error('Search error:', error);
      setError(error.message);
      setSearchResults({ songs: [], artists: [], playlists: [] });
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounce search input
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch(searchQuery);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, performSearch]);

  const handleInputChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleSongPlay = (song, index) => {
    onSongClick(song, index, searchResults.songs);
  };

  const getTotalResultsCount = () => {
    return totalResults.songs + totalResults.artists + totalResults.playlists;
  };

  return (
    <main className="main-content">
      <header className="page-header">
        <h1 className="app-title">
          <span className="k-mirrored">K</span><span className="gradient-text">odeWithMusic</span>
        </h1>
      </header>

      <div className="search-container">
        <div className="search-input-container">
          <div className="search-input-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="21 21l-4.35-4.35"/>
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search for songs, artists, or playlists..."
            value={searchQuery}
            onChange={handleInputChange}
            className="search-input"
            autoFocus
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="clear-search"
              aria-label="Clear search"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          )}
        </div>

        {loading && (
          <div className="loading-spinner">
            <div className="spinner"></div>
            <div>Searching...</div>
          </div>
        )}

        {error && (
          <div className="search-error">
            <p>Error: {error}</p>
            <button onClick={() => performSearch(searchQuery)} className="retry-button">
              Try Again
            </button>
          </div>
        )}

        {!loading && !error && hasSearched && searchQuery && (
          <div className="search-results">
            <div className="results-summary">
              <h2>Search Results for "{searchQuery}"</h2>
              <p>{getTotalResultsCount()} results found</p>
            </div>

            {/* Songs Section */}
            {searchResults.songs.length > 0 && (
              <section className="search-section">
                <h3>Songs ({totalResults.songs})</h3>
                <div className="songs-grid">
                  {searchResults.songs.map((song, index) => (
                    <div 
                      key={song.id} 
                      className="song-item search-song-item" 
                      onClick={() => handleSongPlay(song, index)}
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <img src={song.cover} alt={song.title} />
                      <div className="song-info">
                        <h4>{song.title}</h4>
                        <p>{song.artist.name}</p>
                      </div>
                      <span className="duration">{song.duration}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Artists Section */}
            {searchResults.artists.length > 0 && (
              <section className="search-section">
                <h3>Artists ({totalResults.artists})</h3>
                <div className="artists-grid">
                  {searchResults.artists.map((artist, index) => (
                    <div 
                      key={artist.id} 
                      className="artist-item"
                      style={{ animationDelay: `${(searchResults.songs.length + index) * 0.1}s` }}
                    >
                      <div className="artist-image">
                        <img 
                          src={artist.image || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop'} 
                          alt={artist.name} 
                        />
                      </div>
                      <div className="artist-info">
                        <h4>{artist.name}</h4>
                        <p>Artist</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Playlists Section */}
            {searchResults.playlists.length > 0 && (
              <section className="search-section">
                <h3>Playlists ({totalResults.playlists})</h3>
                <div className="tiles-grid playlist-tiles">
                  {searchResults.playlists.map((playlist, index) => (
                    <div 
                      key={playlist.id} 
                      className="tile playlist-tile" 
                      onClick={() => onPlaylistClick(playlist)}
                      style={{ animationDelay: `${(searchResults.songs.length + searchResults.artists.length + index) * 0.1}s` }}
                    >
                      <img src={playlist.cover} alt={playlist.title} />
                      <div className="tile-info">
                        <h3>{playlist.title}</h3>
                        <p>{playlist.count}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* No Results */}
            {getTotalResultsCount() === 0 && (
              <div className="no-results">
                <div className="no-results-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8"/>
                    <path d="21 21l-4.35-4.35"/>
                  </svg>
                </div>
                <h3>No results found</h3>
                <p>Try searching with different keywords</p>
              </div>
            )}
          </div>
        )}

        {/* Default Search State */}
        {!hasSearched && !loading && !searchQuery && (
          <div className="search-placeholder">
            <div className="search-placeholder-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/>
                <path d="21 21l-4.35-4.35"/>
              </svg>
            </div>
            <h3>Search KodeWithMusic</h3>
            <p>Find your favorite songs, artists, and playlists</p>
          </div>
        )}
      </div>
    </main>
  );
}

export default Search;