import React, { useState, useEffect, useRef } from "react";
import "./customize.css";
import { GLOBAL_ENDPOINT } from "../constants";

function Customize({onSongClick}) {
  const [songs, setSongs] = useState([]);
  const [selectedSong, setSelectedSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [clipName, setClipName] = useState("");
  const [selectedPlaylist, setSelectedPlaylist] = useState("");
  const [playlists, setPlaylists] = useState([]);
  const [customClips, setCustomClips] = useState([]);
  const [mixSongs, setMixSongs] = useState([]);
  const [mixName, setMixName] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("edit");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState({
    songs: [],
    playlists: []
  });
  const [searchLoading, setSearchLoading] = useState(false);
  const [showingPlaylistSongs, setShowingPlaylistSongs] = useState(false);
  const [currentPlaylist, setCurrentPlaylist] = useState(null);
  const [startTimeInput, setStartTimeInput] = useState("0:00");
  const [endTimeInput, setEndTimeInput] = useState("0:00");
  const [userMixes, setUserMixes] = useState([]);

  const audioRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    fetchSongs();
    fetchPlaylists();
    fetchCustomClips();
    fetchUserMixes();
  }, []);

  const fetchSongs = async () => {
    try {
      const response = await fetch(`${GLOBAL_ENDPOINT}/songs/`);
      const data = await response.json();
      setSongs(data.songs || []);
    } catch (error) {
      console.error("Error fetching songs:", error);
    }
  };

  const fetchUserMixes = async () => {
  try {
    const res = await fetch(`${GLOBAL_ENDPOINT}/mixes/`);
    const data = await res.json();
    if (data.success) {
      setUserMixes(data.mixes);
    }
  } catch (e) {
    console.error("Error fetching mixes:", e);
  }
};


  const fetchPlaylists = async () => {
    try {
      const response = await fetch(`${GLOBAL_ENDPOINT}/playlists/`);
      const data = await response.json();
      setPlaylists(data.playlists || []);
    } catch (error) {
      console.error("Error fetching playlists:", error);
    }
  };

  const fetchCustomClips = async () => {
    try {
      const response = await fetch(`${GLOBAL_ENDPOINT}/custom-clips/`);
      const data = await response.json();
      setCustomClips(data.clips || []);
    } catch (error) {
      console.error("Error fetching custom clips:", error);
    }
  };

  const handleSongSelect = (song) => {
  setSelectedSong(song);
  setStartTime(0);
  setEndTime(0);
  setCurrentTime(0);
  setStartTimeInput("0:00");
  setEndTimeInput("0:00");
  setClipName(`${song.title} - Custom Clip`);
  
  if (audioRef.current) {
    audioRef.current.src = song.audio_file;
    audioRef.current.load();
    audioRef.current.addEventListener('canplaythrough', () => {
      console.log('Audio preloaded successfully');
      // Update end time input when duration is available
      if (audioRef.current.duration) {
        const defaultEndTime = Math.min(30, Math.floor(audioRef.current.duration));
        setEndTime(defaultEndTime);
        setEndTimeInput(secondsToTime(defaultEndTime));
      }
    }, { once: true });
  }
};
  const togglePlayback = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      setDuration(audioRef.current.duration || 0);
      
      // Stop at end time if set
      if (endTime > 0 && audioRef.current.currentTime >= endTime) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  const handleSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newTime = (clickX / rect.width) * duration;
    
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const setClipStart = () => {
  const newStartTime = Math.floor(currentTime);
  setStartTime(newStartTime);
  setStartTimeInput(secondsToTime(newStartTime));
  
  if (endTime === 0 || endTime <= newStartTime) {
    const newEndTime = Math.min(newStartTime + 30, Math.floor(duration));
    setEndTime(newEndTime);
    setEndTimeInput(secondsToTime(newEndTime));
  }
};

  const setClipEnd = () => {
  const newEndTime = Math.floor(currentTime);
  setEndTime(newEndTime);
  setEndTimeInput(secondsToTime(newEndTime));
  
  if (startTime >= newEndTime) {
    const newStartTime = Math.max(0, newEndTime - 30);
    setStartTime(newStartTime);
    setStartTimeInput(secondsToTime(newStartTime));
  }
};

  const playClip = () => {
    if (audioRef.current && startTime < endTime) {
      audioRef.current.currentTime = startTime;
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

const saveClip = async () => {
  console.log("🔥 saveClip ran", { startTime, endTime, selectedSong, clipName });
  
  // Validate inputs
  if (!selectedSong || !clipName.trim()) {
    alert("Please select a song and provide a clip name");
    return;
  }
  
  // Ensure times are valid numbers
  const validStartTime = Math.floor(Number(startTime) || 0);
  const validEndTime = Math.floor(Number(endTime) || 0);
  
  if (validStartTime >= validEndTime) {
    alert("End time must be greater than start time");
    return;
  }
  
  if (validEndTime > duration) {
    alert("End time cannot exceed song duration");
    return;
  }
  
  if (validEndTime - validStartTime < 1) {
    alert("Clip must be at least 1 second long");
    return;
  }

  setLoading(true);
  try {
    const requestBody = {
      song_id: selectedSong.id,
      name: clipName.trim(),
      start_time: validStartTime,
      end_time: validEndTime,
      playlist_id: selectedPlaylist || null,
    };

    console.log("Request body:", requestBody);
    
    const response = await fetch(`${GLOBAL_ENDPOINT}/create-clip/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });
    
    const data = await response.json();
    console.log("Response:", data);
    
    if (response.ok && data.success) {
      alert("Clip saved successfully!");
      fetchCustomClips();
      setClipName("");
      setStartTime(0);
      setEndTime(0);
      setStartTimeInput("0:00");
      setEndTimeInput("0:00");
    } else {
      alert(data.error || "Error saving clip");
    }
  } catch (error) {
    console.error("Error saving clip:", error);
    alert("Error saving clip");
  }
  setLoading(false);
};

  const addToMix = (clip) => {
    if (!mixSongs.find(s => s.id === clip.id)) {
      setMixSongs([...mixSongs, clip]);
    }
  };

  const removeFromMix = (clipId) => {
    setMixSongs(mixSongs.filter(s => s.id !== clipId));
  };

 const saveMix = async () => {
  if (!mixName || mixSongs.length === 0) {
    alert("Please provide a mix name and add some clips");
    return;
  }

  setLoading(true);
  try {
    const response = await fetch(`${GLOBAL_ENDPOINT}/create-mix/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: mixName,
        clips: mixSongs.map(clip => clip.id),
      }),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      alert("Mix saved successfully!");
      setMixName("");
      setMixSongs([]);
    } else {
      alert(data.error || "Error saving mix");
    }
  } catch (error) {
    console.error("Error saving mix:", error);
    alert("Error saving mix");
  }
  setLoading(false);
};

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const performSearch = async (query) => {
  if (!query.trim()) {
    setSearchResults({ songs: [], playlists: [] });
    return;
  }

  setSearchLoading(true);
  try {
    const response = await fetch(
      `${GLOBAL_ENDPOINT}/search/?q=${encodeURIComponent(query.trim())}`
    );
    const data = await response.json();
    
    if (data.success) {
      setSearchResults({
        songs: data.songs || [],
        playlists: data.playlists || []
      });
    }
  } catch (error) {
    console.error('Search error:', error);
  } finally {
    setSearchLoading(false);
  }
};

const handlePlaylistClick = async (playlist) => {
  try {
    const response = await fetch(`${GLOBAL_ENDPOINT}/playlist/${playlist.id}/songs/`);
    const data = await response.json();
    setCurrentPlaylist(playlist);
    setSongs(data.songs || []);
    setShowingPlaylistSongs(true);
    setSearchQuery("");
    setSearchResults({ songs: [], playlists: [] });
  } catch (error) {
    console.error('Error fetching playlist songs:', error);
  }
};

const handleClipPlay = (clip) => {
  if (!clip.audio_file) {
    alert("Clip audio not available. Please try again.");
    return;
  }
  // Create a song object that matches the expected format for the player
  const songForPlayer = {
    id: clip.id,
    title: clip.name,
    artist: { name: clip.artist },
    cover: clip.cover,
    audio_file: clip.audio_file, // Make sure your backend provides this
    duration: clip.duration,
    clipStart: clip.start_time,
    clipEnd: clip.end_time
  };
  
  // Call the onSongClick prop to play the clip
  onSongClick(songForPlayer, 0, [songForPlayer]);
};

const showRecentSongs = () => {
  fetchSongs();
  setShowingPlaylistSongs(false);
  setCurrentPlaylist(null);
};

const timeToSeconds = (timeString) => {
  if (!timeString || typeof timeString !== 'string') return 0;
  
  const parts = timeString.split(':');
  if (parts.length !== 2) return 0;
  
  const minutes = parseInt(parts[0]) || 0;
  const seconds = parseInt(parts[1]) || 0;
  
  // Validate that seconds are not more than 59
  if (seconds >= 60) return 0;
  
  return minutes * 60 + seconds;
};

const secondsToTime = (seconds) => {
  if (isNaN(seconds) || seconds < 0) return "0:00";
  
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
};

const handleManualTimeChange = (type, value) => {
  const seconds = timeToSeconds(value);
  
  // Validate the time is within the song duration
  if (seconds > duration) {
    alert(`Time cannot exceed song duration (${formatTime(duration)})`);
    return;
  }
  
  if (type === 'start') {
    setStartTimeInput(value);
    setStartTime(seconds);
    
    // If end time is less than or equal to start time, adjust it
    if (endTime <= seconds) {
      const newEndTime = Math.min(seconds + 30, duration);
      setEndTime(newEndTime);
      setEndTimeInput(secondsToTime(newEndTime));
    }
  } else {
    setEndTimeInput(value);
    setEndTime(seconds);
    
    // If start time is greater than or equal to end time, adjust it
    if (startTime >= seconds) {
      const newStartTime = Math.max(0, seconds - 30);
      setStartTime(newStartTime);
      setStartTimeInput(secondsToTime(newStartTime));
    }
  }
};

const handleProgressBarClick = (e) => {
  if (!duration) return;
  
  const rect = e.currentTarget.getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  const newTime = (clickX / rect.width) * duration;
  
  if (audioRef.current) {
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
    if (isPlaying) {
      audioRef.current.play();
    }
  }
};

const handleMarkerDrag = (e, type) => {
  if (!duration) return;
  
  const rect = e.currentTarget.parentElement.getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  const newTime = Math.max(0, Math.min((clickX / rect.width) * duration, duration));
  
  if (type === 'start') {
    setStartTime(newTime);
    setStartTimeInput(secondsToTime(newTime));
  } else {
    setEndTime(newTime);
    setEndTimeInput(secondsToTime(newTime));
  }
};

const moveTrack = (fromIndex, direction) => {
  const toIndex = fromIndex + direction;
  if (toIndex < 0 || toIndex >= mixSongs.length) return;
  
  const newMixSongs = [...mixSongs];
  const [movedTrack] = newMixSongs.splice(fromIndex, 1);
  newMixSongs.splice(toIndex, 0, movedTrack);
  setMixSongs(newMixSongs);
};


  return (
    <main className="main-content">
      <header className="page-header">
        <h1 className="app-title">
          <span className="k-mirrored">K</span><span className="gradient-text">ustomize</span>
        </h1>
      </header>

      <div className="customize-tabs">
        <button 
          className={`tab-button ${activeTab === 'edit' ? 'active' : ''}`}
          onClick={() => setActiveTab('edit')}
        >
          Edit Songs
        </button>
        <button 
          className={`tab-button ${activeTab === 'clips' ? 'active' : ''}`}
          onClick={() => setActiveTab('clips')}
        >
          My Clips
        </button>
        <button 
          className={`tab-button ${activeTab === 'mix' ? 'active' : ''}`}
          onClick={() => setActiveTab('mix')}
        >
          Create Mix
        </button>
      </div>

      {activeTab === 'edit' && (
  <section className="edit-section">
    <div className="songs-list">
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px' }}>
        <h2>{showingPlaylistSongs ? `${currentPlaylist?.title} Songs` : 'Recently Played Songs'}</h2>
        {showingPlaylistSongs && (
          <button onClick={showRecentSongs} className="control-button">
            Back to Recent Songs
          </button>
        )}
      </div>
      
      {/* Search Bar */}
      <div className="search-input-container" style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Search songs and playlists..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            performSearch(e.target.value);
          }}
          className="search-input"
          style={{
            width: '100%',
            padding: '12px',
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '8px',
            color: 'white'
          }}
        />
      </div>

      {/* Search Results */}
      {searchQuery && (
        <div style={{ marginBottom: '20px' }}>
          {searchResults.playlists.length > 0 && (
            <div style={{ marginBottom: '15px' }}>
              <h3 style={{ color: 'rgba(255, 255, 255, 0.8)', marginBottom: '10px' }}>Playlists</h3>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {searchResults.playlists.map((playlist) => (
                  <div 
                    key={playlist.id}
                    onClick={() => handlePlaylistClick(playlist)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '8px 12px',
                      background: 'rgba(220, 50, 70, 0.2)',
                      border: '1px solid #dc3246',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      gap: '8px'
                    }}
                  >
                    <img src={playlist.cover} alt={playlist.title} style={{ width: '30px', height: '30px', borderRadius: '4px' }} />
                    <span style={{ color: 'white', fontSize: '0.9rem' }}>{playlist.title}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {searchResults.songs.length > 0 && (
            <div>
              <h3 style={{ color: 'rgba(255, 255, 255, 0.8)', marginBottom: '10px' }}>Songs</h3>
            </div>
          )}
        </div>
      )}

      {/* Songs Grid */}
      <div className="songs-grid">
        {(showingPlaylistSongs || !searchQuery ? songs : searchResults.songs).map((song) => (
          <div 
            key={song.id} 
            className={`song-item ${selectedSong?.id === song.id ? 'selected' : ''}`}
            onClick={() => handleSongSelect(song)}
          >
            <img src={song.cover} alt={song.title} />
            <div className="song-info">
              <h4>{song.title}</h4>
              <p>{song.artist.name}</p>
            </div>
          </div>
        ))}
      </div>
    </div>

    {selectedSong && (
      <div className="editor-panel">
        <h2>Edit: {selectedSong.title}</h2>
        
        <div className="audio-controls">
          <button onClick={togglePlayback} className="play-button">
            {isPlaying ? '⏸️' : '▶️'}
          </button>
          <div className="time-display">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
        </div>

        <div className="waveform-container">
          <div className="progress-bar" onClick={handleProgressBarClick}>
            <div 
              className="progress-fill" 
              style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
            ></div>
            {startTime > 0 && duration > 0 && (
              <div 
                className="clip-marker start-marker" 
                style={{ left: `${(startTime / duration) * 100}%` }}
                onMouseDown={(e) => {
                  const handleMouseMove = (e) => handleMarkerDrag(e, 'start');
                  const handleMouseUp = () => {
                    document.removeEventListener('mousemove', handleMouseMove);
                    document.removeEventListener('mouseup', handleMouseUp);
                  };
                  document.addEventListener('mousemove', handleMouseMove);
                  document.addEventListener('mouseup', handleMouseUp);
                }}
              ></div>
            )}
            {endTime > 0 && duration > 0 && (
              <div 
                className="clip-marker end-marker" 
                style={{ left: `${(endTime / duration) * 100}%` }}
                onMouseDown={(e) => {
                  const handleMouseMove = (e) => handleMarkerDrag(e, 'end');
                  const handleMouseUp = () => {
                    document.removeEventListener('mousemove', handleMouseMove);
                    document.removeEventListener('mouseup', handleMouseUp);
                  };
                  document.addEventListener('mousemove', handleMouseMove);
                  document.addEventListener('mouseup', handleMouseUp);
                }}
              ></div>
            )}
            {startTime > 0 && endTime > 0 && duration > 0 && (
              <div 
                className="clip-range" 
                style={{ 
                  left: `${(startTime / duration) * 100}%`,
                  width: `${((endTime - startTime) / duration) * 100}%`
                }}
              ></div>
            )}
          </div>
        </div>

        {/* Manual Time Inputs */}
        <div style={{ display: 'flex', gap: '15px', margin: '15px 0' }}>
          <div>
            <label style={{ display: 'block', color: 'rgba(255, 255, 255, 0.8)', marginBottom: '5px' }}>Start Time</label>
            <input
              type="text"
              value={startTimeInput}
              onChange={(e) => handleManualTimeChange('start', e.target.value)}
              placeholder="0:00"
              style={{
                padding: '8px',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '4px',
                color: 'white',
                width: '60px'
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', color: 'rgba(255, 255, 255, 0.8)', marginBottom: '5px' }}>End Time</label>
            <input
              type="text"
              value={endTimeInput}
              onChange={(e) => handleManualTimeChange('end', e.target.value)}
              placeholder="0:00"
              style={{
                padding: '8px',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '4px',
                color: 'white',
                width: '60px'
              }}
            />
          </div>
        </div>

        <div className="clip-controls">
          <button onClick={setClipStart} className="control-button">
            Set Start ({formatTime(startTime)})
          </button>
          <button onClick={setClipEnd} className="control-button">
            Set End ({formatTime(endTime)})
          </button>
          <button onClick={playClip} className="control-button">
            Play Clip
          </button>
        </div>

        <div className="save-clip">
          <input
            type="text"
            placeholder="Clip name"
            value={clipName}
            onChange={(e) => setClipName(e.target.value)}
            className="clip-name-input"
          />
          <select 
              value={selectedPlaylist} 
              onChange={(e) => setSelectedPlaylist(e.target.value)}
              className="playlist-select-dropdown"
            >
              <option value="">Select Playlist (Optional)</option>
              {playlists.map(playlist => (
                <option key={playlist.id} value={playlist.id}>
                  {playlist.title}
                </option>
              ))}
            </select>
          <button onClick={saveClip} disabled={loading} className="save-button">
            {loading ? 'Saving...' : 'Save Clip'}
          </button>
        </div>

        <audio
          ref={audioRef}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleTimeUpdate}
          onEnded={() => setIsPlaying(false)}
          preload="auto"
        />
      </div>
    )}
  </section>
)}
{activeTab === 'clips' && (
  <section className="clips-section">
    <h2>My Custom Clips</h2>
    <div className="clips-grid">
      {customClips.map((clip) => (
        <div key={clip.id} className="clip-item">
          <img src={clip.cover} alt={clip.name} />
          <div className="clip-info">
            <h4>{clip.name}</h4>
            <p>{clip.original_song} - {clip.artist}</p>
            <p>Duration: {formatTime(clip.duration)}</p>
          </div>
          <div className="clip-actions">
            <button 
              onClick={() => handleClipPlay(clip)}
              className="control-button play-clip-btn"
            >
              ▶Play
            </button>
            <button 
              onClick={() => addToMix(clip)}
              className="control-button"
              disabled={mixSongs.find(s => s.id === clip.id)}
            >
              {mixSongs.find(s => s.id === clip.id) ? 'Added' : 'Add to Mix'}
            </button>
            <button 
              onClick={async () => {
                if (window.confirm("Are you sure you want to delete this clip?")) {
                  try {
                    const res = await fetch(`${GLOBAL_ENDPOINT}/clips/${clip.id}/delete/`, {
                      method: 'DELETE'
                    });
                    const data = await res.json();
                    if (data.success) {
                      alert("Clip deleted successfully");
                      fetchCustomClips();
                    } else {
                      alert(data.error || "Error deleting clip");
                    }
                  } catch (e) {
                    console.error("Delete error:", e);
                    alert("Error deleting clip");
                  }
                }
              }}
              className="control-button delete-btn"
            >
              Delete
            </button> 
          </div>
        </div>
      ))}
    </div>
    {customClips.length === 0 && (
      <p style={{ textAlign: 'center', color: 'rgba(255, 255, 255, 0.6)' }}>
        No custom clips yet. Create some in the Edit Songs tab!
      </p>
    )}
  </section>
)}

{activeTab === 'mix' && (
  <section className="mix-section">
    <h2>Create Your Mix</h2>
    
    <div className="mix-builder">
      <input
        type="text"
        placeholder="Mix name"
        value={mixName}
        onChange={(e) => setMixName(e.target.value)}
        className="mix-name-input"
        style={{
          width: '100%',
          padding: '12px',
          background: 'rgba(255, 255, 255, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '8px',
          color: 'white',
          marginBottom: '20px'
        }}
      />

      <div style={{ marginTop: '30px' }}>
        <h3>Your Mixes</h3>
        <ul>
          {userMixes.map((mix) => (
            <li key={mix.id} style={{ color: 'white', marginBottom: '10px' }}>
              🎵 {mix.name} — {mix.track_count} clips ({formatTime(mix.total_duration)})
            </li>
          ))}
        </ul>
      </div>


      <div className="mix-content" style={{ display: 'flex', gap: '30px' }}>
        {/* Available Clips */}
        <div style={{ flex: 1 }}>
          <h3>Available Clips ({customClips.length})</h3>
          <div className="available-clips" style={{ 
            maxHeight: '400px', 
            overflowY: 'auto',
            background: 'rgba(255, 255, 255, 0.05)',
            padding: '15px',
            borderRadius: '8px'
          }}>
            {customClips.map((clip) => (
              <div key={clip.id} className="clip-row" style={{
                display: 'flex',
                alignItems: 'center',
                padding: '10px',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '6px',
                marginBottom: '8px',
                gap: '12px'
              }}>
                <img src={clip.cover} alt={clip.name} style={{ width: '40px', height: '40px', borderRadius: '4px' }} />
                <div style={{ flex: 1 }}>
                  <h5 style={{ margin: 0, color: 'white' }}>{clip.name}</h5>
                  <p style={{ margin: 0, color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.8rem' }}>
                    {clip.original_song} - {formatTime(clip.duration)}
                  </p>
                </div>
                <button 
                  onClick={() => addToMix(clip)}
                  disabled={mixSongs.find(s => s.id === clip.id)}
                  className="control-button"
                  style={{ minWidth: '80px' }}
                >
                  {mixSongs.find(s => s.id === clip.id) ? 'Added' : 'Add'}
                </button>
              </div>
            ))}
            {customClips.length === 0 && (
              <p style={{ textAlign: 'center', color: 'rgba(255, 255, 255, 0.6)' }}>
                No clips available. Create some clips first!
              </p>
            )}
          </div>
        </div>

        {/* Mix Tracks */}
        <div style={{ flex: 1 }}>
          <h3>Mix Tracks ({mixSongs.length})</h3>
          <div className="mix-tracks" style={{ 
            maxHeight: '400px', 
            overflowY: 'auto',
            background: 'rgba(255, 255, 255, 0.05)',
            padding: '15px',
            borderRadius: '8px'
          }}>
            {mixSongs.map((clip, index) => (
              <div key={`${clip.id}-${index}`} className="mix-track" style={{
                display: 'flex',
                alignItems: 'center',
                padding: '10px',
                background: 'rgba(220, 50, 70, 0.2)',
                border: '1px solid #dc3246',
                borderRadius: '6px',
                marginBottom: '8px',
                gap: '12px'
              }}>
                <span style={{ 
                  minWidth: '20px', 
                  color: 'white', 
                  fontWeight: 'bold' 
                }}>{index + 1}.</span>
                <img src={clip.cover} alt={clip.name} style={{ width: '40px', height: '40px', borderRadius: '4px' }} />
                <div style={{ flex: 1 }}>
                  <h5 style={{ margin: 0, color: 'white' }}>{clip.name}</h5>
                  <p style={{ margin: 0, color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.8rem' }}>
                    {clip.original_song} - {formatTime(clip.duration)}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {/* Move Up */}
                  <button 
                    onClick={() => moveTrack(index, -1)}
                    disabled={index === 0}
                    className="control-button"
                    style={{ padding: '5px 8px', fontSize: '0.8rem' }}
                  >
                    ↑
                  </button>
                  {/* Move Down */}
                  <button 
                    onClick={() => moveTrack(index, 1)}
                    disabled={index === mixSongs.length - 1}
                    className="control-button"
                    style={{ padding: '5px 8px', fontSize: '0.8rem' }}
                  >
                    ↓
                  </button>
                  {/* Remove */}
                  <button 
                    onClick={() => removeFromMix(clip.id)}
                    className="control-button"
                    style={{ padding: '5px 8px', fontSize: '0.8rem', background: '#dc3545' }}
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
            {mixSongs.length === 0 && (
              <p style={{ textAlign: 'center', color: 'rgba(255, 255, 255, 0.6)' }}>
                Add clips to create your mix
              </p>
            )}
          </div>
        </div>
      </div>

      <button 
        onClick={saveMix} 
        disabled={loading || !mixName || mixSongs.length === 0}
        className="save-mix-button"
        style={{
          width: '100%',
          padding: '15px',
          background: mixName && mixSongs.length > 0 ? 'linear-gradient(135deg, #dc3246, #e91e63)' : 'rgba(255, 255, 255, 0.1)',
          border: 'none',
          borderRadius: '8px',
          color: 'white',
          fontSize: '1.1rem',
          fontWeight: 'bold',
          marginTop: '20px',
          cursor: mixName && mixSongs.length > 0 ? 'pointer' : 'not-allowed'
        }}
      >
        {loading ? 'Saving Mix...' : 'Save Mix'}
      </button>
    </div>
  </section>)}
    </main>
  );
}

export default Customize;