// Updated Player.jsx with fixes
import React, { useRef, useEffect, useState } from 'react';
import './Player.css';
import { GLOBAL_ENDPOINT } from '../constants';

const MusicPlayer = ({ currentSong, isPlaying, onPlayPause, nextSong, prevSong, playlist }) => {
  const progressRef = useRef(null);
  const audioRef = useRef(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [canPlay, setCanPlay] = useState(false);
  const preloadedAudioRef = useRef([]);


  useEffect(() => {
  const storedVolume = localStorage.getItem("volume");
  if (storedVolume) setVolume(parseFloat(storedVolume));
}, []);

useEffect(() => {
  localStorage.setItem("volume", volume);
}, [volume]);

const preloadClips = async (clipIds) => {
  try {
    const response = await fetch(`${GLOBAL_ENDPOINT}/preload-clips/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clip_ids: clipIds })
    });
    const data = await response.json();
    if (data.success) {
      // Just store in memory if needed; or rely on browser caching
      console.log("Clips preloaded:", data.preloaded_count);
    }
  } catch (err) {
    console.error("Preload clips error:", err);
  }
};

  const preloadSongs = async (songIds) => {
  try {
    const response = await fetch(`${GLOBAL_ENDPOINT}/preload-songs/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ song_ids: songIds }),
    });

    const data = await response.json();

    if (data.success) {
      // Store preloaded audio elements in a ref
      preloadedAudioRef.current = data.songs.map(song => {
        const audio = new Audio();
        audio.preload = 'auto';
        audio.src = song.audio_file;
        return audio;
      });
    }
  } catch (error) {
    console.error('Preload error:', error);
  }
};




  // Preload audio when song changes
  useEffect(() => {
  if (currentSong?.audio_file && audioRef.current) {
    setIsLoading(true);
    setCanPlay(false);
    setCurrentTime(0);
    setDuration(0);
    
    const audio = audioRef.current;
    
    // Reset audio element
    audio.pause();
    audio.removeAttribute('src');
    audio.currentTime = 0;
    
    // Set new source and load
    audio.src = currentSong.audio_file;
    audio.preload = 'auto';
    audio.load();
  }
}, [currentSong]);

useEffect(() => {
  if (audioRef.current && currentSong?.audio_file) {
    const audio = audioRef.current;

    const onLoadedMetadata = () => {
      const fullDuration = audio.duration || 0;

      if (currentSong.clipStart !== undefined && currentSong.clipEnd !== undefined) {
        audio.currentTime = currentSong.clipStart; // ✅ Seek now that metadata is available
        setDuration(currentSong.clipEnd - currentSong.clipStart);
      } else if (typeof currentSong.duration === 'number') {
        setDuration(currentSong.duration);
      } else {
        setDuration(fullDuration);
      }

      setCurrentTime(0);
      setCanPlay(true);
      setIsLoading(false);
    };

    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    return () => {
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
    };
  }
}, [currentSong]);



  // Handle play/pause after audio is ready
  useEffect(() => {
  if (audioRef.current && canPlay) {
    audioRef.current.volume = volume;
    if (isPlaying) {
      audioRef.current.play().catch(err => {
        if (err.name !== "AbortError") {
          console.error("Playback error:", err);
        }
      });
    } else {
      audioRef.current.pause();
    }
  }
}, [isPlaying, canPlay, volume]);

useEffect(() => {
  // Preload current playlist (only for regular songs, not clips)
  if (playlist.length > 0) {
    const songIds = playlist
      .filter(song => !song.clipStart && !song.clipEnd) // Only regular songs
      .map(song => song.id);
    
    const clipIds = playlist
      .filter(song => song.clipStart !== undefined && song.clipEnd !== undefined)
      .map(song => song.id);

    if (songIds.length > 0) {
      preloadSongs(songIds);
    }

    if (clipIds.length > 0) {
      preloadClips(clipIds); // NEW
    }
  }
}, [playlist]);




  const formatTime = (seconds) => {
  if (!seconds || !isFinite(seconds) || seconds < 0) return '0:00';
  const totalSeconds = Math.floor(seconds);
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const handleTimeUpdate = () => {
  if (!isDragging && audioRef.current) {
    const current = audioRef.current.currentTime;
    
    // For clips, handle end time
    if (currentSong?.clipEnd !== undefined && current >= currentSong.clipEnd) {
      audioRef.current.pause();
      onPlayPause(); // Use the prop function to update parent state
      return;
    }

    // Calculate display time
    if (currentSong?.clipStart !== undefined) {
      // For clips, show time relative to clip start
      const effectiveCurrent = Math.max(0, current - currentSong.clipStart);
      setCurrentTime(effectiveCurrent);
    } else {
      // For regular songs
      setCurrentTime(current);
    }
  }
};


  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration || 0);
      setCurrentTime(0);
    }
  };

const handleCanPlay = () => {
  setIsLoading(false);
  setCanPlay(true);
  
  // if (audioRef.current) {
  //   // For clips, set the start time
  //   if (currentSong?.clipStart !== undefined) {
  //     audioRef.current.currentTime = currentSong.clipStart;
  //   }
  // }
};

  const handleLoadStart = () => {
    setIsLoading(true);
    setCanPlay(false);
  };

  const seekToPosition = (e) => {
  if (!progressRef.current || !duration || !canPlay || !audioRef.current) return;
  
  const rect = progressRef.current.getBoundingClientRect();
  const offsetX = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
  const percent = offsetX / rect.width;
  const newTime = percent * duration;

  if (isFinite(newTime) && newTime >= 0 && newTime <= duration) {
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  }
};

  const handleMouseDown = (e) => {
    if (!duration || !canPlay) return;
    setIsDragging(true);
    seekToPosition(e);
  };

  // Global mouse event handlers
  useEffect(() => {
    const handleGlobalMouseMove = (e) => {
      if (isDragging) {
        seekToPosition(e);
      }
    };

    const handleGlobalMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
      }
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, duration, canPlay]);

  const handleVolumeChange = (e) => {
    const vol = parseFloat(e.target.value) / 100;
    setVolume(vol);
    if (audioRef.current) {
      audioRef.current.volume = vol;
    }
  };

  if (!currentSong?.cover || !currentSong?.artist) return null;
  
  return (
    <div className="music-player">
      <div className="player-content">
        <div className="current-song">
          <img src={currentSong.cover} alt={currentSong.title} />
          <div className="song-details">
            <h4>{currentSong.title}</h4>
            <p>{currentSong.artist.name}</p>
          </div>
        </div>
        
        <div className="player-controls">
          <button className="control-btn shuffle">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/>
            </svg>
          </button>
          <button className="control-btn prev" onClick={prevSong}>
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
            </svg>
          </button>
          <button 
            className="control-btn play" 
            onClick={onPlayPause}
            disabled={!canPlay}
          >
            {isLoading ? (
              // Loading spinner
              <svg viewBox="0 0 24 24" fill="currentColor" className="loading-spinner">
                <path d="M12,4V2A10,10 0 0,0 2,12H4A8,8 0 0,1 12,4Z" />
              </svg>
            ) : isPlaying ? (
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}  
          </button>
          <button className="control-btn next" onClick={nextSong}>
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
            </svg>
          </button>
          <button className="control-btn repeat">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/>
            </svg>
          </button>
        </div>
        
        <div className="player-extras">
          <button className="control-btn volume">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
            </svg>
          </button>
          <div className="volume-slider">
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={volume * 100} 
              onChange={handleVolumeChange}
            />
          </div>
        </div>
      </div>
      
      <div className="progress-bar">
        <span className="time">{formatTime(currentTime)}</span>
        <div 
          className="progress" 
          ref={progressRef}
          onMouseDown={handleMouseDown}
          style={{ 
            cursor: canPlay && duration > 0 ? "pointer" : "not-allowed",
            opacity: canPlay ? 1 : 0.5
          }}
        >
          <div 
            className="progress-fill" 
            style={{ 
              width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` 
            }}
          />
        </div>
        <span className="time">{formatTime(duration)}</span>
      </div>
      
      <audio
        ref={audioRef}
        src={currentSong.audio_file}
        preload="auto"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onCanPlay={handleCanPlay}
        onLoadStart={handleLoadStart}
        onError={(e) => {
            console.error('Audio error:', e.target.error);
            setIsLoading(false);
            setCanPlay(false);
          }}
          onStalled={() => {
            console.log('Audio stalled, retrying...');
          }}
          onWaiting={() => {
            setIsLoading(true);
        }}
      />
    </div>
  );
};


export default MusicPlayer;