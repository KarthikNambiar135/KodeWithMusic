import React, { useRef, useEffect, useState } from 'react';
import './Player.css';

const MusicPlayer = ({ currentSong, isPlaying, onPlayPause, nextSong, prevSong }) => {
  const audioRef = useRef(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7); //Default 70%
  const [isDragging, setIsDragging] = useState(false);


  useEffect(() => { 
    if (audioRef.current) {
      audioRef.current.volume = volume;
      if (isPlaying) {
        audioRef.current.play().catch(console.error);
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentSong]);

  const formatTime = (seconds) => {
    if (!seconds || !isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  const handleTimeUpdate = () => {
    if (!isDragging && audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      setDuration(audioRef.current.duration || 0);
    }
  };

  const handleSeek = (e) => {
  if (!audioRef.current || !duration || isNaN(duration) || duration <= 0) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, offsetX / rect.width));
    const newTime = percentage * duration;

    if (!isFinite(newTime) || newTime < 0) return;

    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleMouseDown = (e) => {
    if (duration && isFinite(duration) && duration > 0) {
      setIsDragging(true);
      handleSeek(e);
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      handleSeek(e);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  //Global mouse up listener when dragging
  useEffect(() => {
    if (isDragging) {
      const handleGlobalMouseUp = () => setIsDragging(false);
      document.addEventListener('mouseup', handleGlobalMouseUp);
      return () => document.removeEventListener('mouseup', handleGlobalMouseUp);
    }
  }, [isDragging]);

  const handleVolumeChange = (e) => {
    const vol = parseFloat(e.target.value) / 100;
    setVolume(vol);
    if (audioRef.current) {
      audioRef.current.volume = vol;
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration || 0);
      setCurrentTime(0);
    }
  };  

  if (!currentSong || !currentSong.cover || !currentSong.artist) return null;
  
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
          <button className="control-btn shuffle" >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/>
            </svg>
          </button>
          <button className="control-btn prev" onClick={prevSong}>
            <svg viewBox="0 0 24 24" fill="currentColor" >
              <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
            </svg>
          </button>
          <button className="control-btn play" onClick={onPlayPause}>
            {isPlaying ? (
              //Pause icon
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              </svg>
            ) : (
              //Play icon
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
            <input type="range" min="0" max="100" value={volume*100} onChange={handleVolumeChange}/>
          </div>
        </div>
      </div>
      
      <div className="progress-bar">
        <span className="time">{formatTime(currentTime)}</span>
       <div 
          className="progress" 
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          style={{ cursor: 'pointer' }}
        >
          <div className="progress-fill" style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}></div>
        </div>
        <span className="time">{formatTime(duration)}</span>
      </div>
      <audio
        ref={audioRef}
        src={currentSong.audio_file}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        autoPlay
      />
    </div>

  );
};

export default MusicPlayer;