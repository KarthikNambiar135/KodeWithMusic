import React, { useState, useEffect } from "react";
import "./PlaylistView.css";
import { GLOBAL_ENDPOINT } from "../constants";

function ClipPickerModal({ onClose, onAdd, currentClips }) {
  const [clips, setClips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetch(`${GLOBAL_ENDPOINT}/custom-clips/`)
      .then(res => res.json())
      .then(data => {
        setClips(data.clips || []);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error loading clips:", err);
        setLoading(false);
      });
  }, []);

  const filteredClips = clips
    .filter(c => !currentClips.find(existing => existing.id === c.id))
    .filter(c =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.original_song.toLowerCase().includes(searchTerm.toLowerCase())
    );

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h2>Select Clips</h2>
          <button className="modal-close-btn" onClick={onClose}>×</button>
        </div>
        
        <input
          type="text"
          placeholder="Search clips..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="modal-search"
        />
        
        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="modal-song-list">
            {filteredClips.map(clip => (
              <div key={clip.id} className="modal-song-item">
                <img src={clip.cover} alt={clip.name} />
                <div className="song-info">
                  <h4>{clip.name}</h4>
                  <p>{clip.original_song}</p>
                </div>
                <button onClick={() => onAdd(clip)}>Add</button>
              </div>
            ))}
            
            {filteredClips.length === 0 && !loading && (
              <p>No clips found.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}


function SongPickerModal({ onClose, onAdd, currentSongs }) {
  const [allSongs, setAllSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const PAGE_SIZE = 10;

  // Load initial songs
  useEffect(() => {
    loadSongs(1, true);
  }, []);

  const loadSongs = async (pageNum, reset = false) => {
    try {
      if (pageNum === 1) {
        setLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      const response = await fetch(`${GLOBAL_ENDPOINT}/songs/?page=${pageNum}&limit=${PAGE_SIZE}`);
      const data = await response.json();

      if (reset) {
        setAllSongs(data.results || []);
      } else {
        setAllSongs(prev => [...prev, ...(data.results || [])]);
      }

      setHasMore(!!data.next);
      setPage(pageNum);
    } catch (error) {
      console.error("Error loading songs:", error);
    } finally {
      setLoading(false);
      setIsLoadingMore(false);
    }
  };

  const loadMoreSongs = () => {
    if (hasMore && !isLoadingMore) {
      loadSongs(page + 1);
    }
  };

  const filteredSongs = allSongs
    .filter(song => !currentSongs.find(s => s.id === song.id))
    .filter(song => {
      const term = searchTerm.toLowerCase();
      return (
        song.title.toLowerCase().includes(term) ||
        song.artist.name.toLowerCase().includes(term)
      );
    });

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h2>Select Songs</h2>
          <button className="modal-close-btn" onClick={onClose}>×</button>
        </div>
        
        <input
          type="text"
          placeholder="Search songs..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="modal-search"
        />

        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="modal-song-list">
            {filteredSongs.map(song => (
              <div key={song.id} className="modal-song-item">
                <img src={song.cover} alt={song.title} />
                <div className="song-info">
                  <h4>{song.title}</h4>
                  <p>{song.artist.name}</p>
                </div>
                <button onClick={() => onAdd(song)}>Add</button>
              </div>
            ))}
            
            {filteredSongs.length === 0 && !loading && (
              <p>No songs found.</p>
            )}

            {/* Load More Button - only show if we have more pages and not searching */}
            {hasMore && !searchTerm && (
              <div className="load-more-container">
                <button 
                  className="load-more-btn" 
                  onClick={loadMoreSongs}
                  disabled={isLoadingMore}
                >
                  {isLoadingMore ? 'Loading...' : 'Load More Songs'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function PlaylistView({ playlist, onSongClick, onBack }) {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [clips, setClips] = useState([]);
  const [showSongPicker, setShowSongPicker] = useState(false);
  const [showClipPicker, setShowClipPicker] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    if (playlist && playlist.id) {
      fetch(`${GLOBAL_ENDPOINT}/playlist/${playlist.id}/songs/`)
        .then(res => {
          if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
          }
          return res.json();
        })
        .then(data => {
          console.log('Playlist songs:', data);
          setSongs(data.songs || []);
          setClips(data.clips || []);
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
            <button className="add-songs-btn" onClick={() => setShowSongPicker(true)}>
              + Add Songs
            </button>
            <button className="add-songs-btn" onClick={() => setShowClipPicker(true)}>
              + Add Clips
            </button>
            <h1>{playlist.title}</h1>
            <p className="playlist-meta">
               {playlist.song_count} songs{playlist.clip_count > 0 ? ` • ${playlist.clip_count} clips` : ''}
            </p>
            {playlist.description && (
              <p className="playlist-description">{playlist.description}</p>
            )}
          </div>
        </div>
      </header>

       {showSongPicker && (
  <SongPickerModal
    currentSongs={songs}
    onClose={() => setShowSongPicker(false)}
    onAdd={(song) => {
      fetch(`${GLOBAL_ENDPOINT}/playlist/${playlist.id}/add-song/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ song_id: song.id })
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setSongs(prev => [...prev, song]);
          } else {
            alert("Failed to add song");
          }
        });
    }}
  />
)}

{showClipPicker && (
  <ClipPickerModal
    currentClips={clips}
    onClose={() => setShowClipPicker(false)}
    onAdd={(clip) => {
      fetch(`${GLOBAL_ENDPOINT}/playlist/${playlist.id}/add-clip/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clip_id: clip.id })
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setClips(prev => [...prev, clip]);
          } else {
            alert("Failed to add clip");
          }
        });
    }}
  />
)}


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

        {clips.length > 0 && (
  <div className="clips-list" style={{ marginTop: '40px' }}>
    <h3 style={{ color: 'white', marginBottom: '10px' }}>Clips in this Playlist</h3>
    {clips.map((clip, index) => (
      <div 
        key={clip.id} 
        className="song-row" 
        style={{ animationDelay: `${index * 0.05}s` }}
        onClick={() => {
          const parentSong = songs.find(s => s.title === clip.original_song);
          if (!parentSong) {
            alert("Original song not found");
            return;
          }

          const songForPlayer = {
            id: clip.id,
            title: clip.name,
            artist: { name: clip.artist },
            cover: clip.cover,
            audio_file: parentSong.audio_file,
            duration: clip.duration,
            clipStart: clip.start_time,
            clipEnd: clip.end_time
          };

          onSongClick(songForPlayer, 0, [songForPlayer]);
        }}
      >
        <div className="song-number">{songs.length + index + 1}</div>
        <img src={clip.cover} alt={clip.name} className="song-cover" />
        <div className="song-details">
          <h4 className="song-title">{clip.name}</h4>
          <p className="song-artist">{clip.original_song} — clip</p>
        </div>
        <div className="song-duration">{clip.duration}</div>
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
)}  
       

      </section>
    </main>
  );
}

export default PlaylistView;