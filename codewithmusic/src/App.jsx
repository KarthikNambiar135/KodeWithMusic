import React, { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import Home from "./components/Home";
import MusicPlayer from "./components/Player";
import Library from "./components/Library";
import PlaylistView from "./components/PlaylistView";
import Search from "./components/Search";
import Customize from "./components/Customize";
import "./App.css";

function App() {
  const [showLogo, setShowLogo] = useState(true);
  const [showApp, setShowApp] = useState(false);
  const [currentView, setCurrentView] = useState('home');
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [viewStack, setViewStack] = useState(['home']);

  //Music player state
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playlist, setPlaylist] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowLogo(false);
      setTimeout(() => {
        setShowApp(true);
      }, 500);
    }, 4000);
    return () => clearTimeout(timer);
  }, []);

  //Navigation handlers
  const handleNavClick = (view) => {
    if (view !== currentView) {
      setCurrentView(view);
      setSelectedPlaylist(null);
      setViewStack([view]);
    }
  };

  const handlePlaylistClick = (playlist) => {
    setSelectedPlaylist(playlist);
    setViewStack(prev => [...prev, 'playlist']);
  };

  const handleBackClick = () => {
    if (viewStack.length > 1) {
      const newStack = viewStack.slice(0, -1);
      setViewStack(newStack);
      
      if (newStack[newStack.length - 1] === 'playlist') {
        //Handle nested playlist navigation if needed
      } else {
        setSelectedPlaylist(null);
      }
    }
  };

  //Music player handlers
  const handleSongClick = (song, index, songsList = [song]) => {
    setIsPlaying(false);
    setTimeout(() => {
    setPlaylist(songsList); //we can also pass the full playlist here if needed
    setCurrentIndex(index);
    setCurrentSong(song); 
    setIsPlaying(true);
  }, 50); // slight delay to ensure state updates correctly
  };

  const handlePlayPause = () => {
    setIsPlaying(prev => !prev);
  };

  const handleNext = () => {
    if (playlist.length && currentIndex !== null) {
      const nextIndex = (currentIndex + 1) % playlist.length;
      setCurrentSong(playlist[nextIndex]);
      setCurrentIndex(nextIndex);
      setIsPlaying(true);
    }
  };

  const handlePrev = () => {
    if (playlist.length && currentIndex !== null) {
      const prevIndex = (currentIndex - 1 + playlist.length) % playlist.length;
      setCurrentSong(playlist[prevIndex]);
      setCurrentIndex(prevIndex);
      setIsPlaying(true);
    }
  };

  //Render current view
  const renderCurrentView = () => {
    const isPlaylist = viewStack[viewStack.length - 1] === 'playlist';
    
    if (isPlaylist && selectedPlaylist) {
      return (
        <PlaylistView 
          playlist={selectedPlaylist}
          onSongClick={handleSongClick}
          onBack={handleBackClick}
        />
      );
    }

    switch (currentView) {
      case 'home':
        return (
          <Home 
            onSongClick={handleSongClick}
            onPlaylistClick={handlePlaylistClick}
          />
        );
      case 'library':
        return (
          <Library 
            onPlaylistClick={handlePlaylistClick}
          />
        );
      case 'search':
        return (
        <Search 
          onSongClick={handleSongClick}
          onPlaylistClick={handlePlaylistClick}
        />
      );
      case 'customize':
        return (
          <Customize 
            onBack={handleBackClick}
            onSongClick={handleSongClick}
          />
        );
      case 'account':
        return (
          <div className="main-content">
            <header className="page-header">
              <h1 className="app-title">
                <span className="k-mirrored">K</span><span className="gradient-text">odeWithMusic</span>
              </h1>
            </header>
            <div className="coming-soon">
              <h2>Account</h2>
              <p>Account management coming soon...</p>
            </div>
          </div>
        );
      default:
        return (
          <Home 
            onSongClick={handleSongClick}
            onPlaylistClick={handlePlaylistClick}
            currentSong={currentSong}
            isPlaying={isPlaying}
            onPlayPause={handlePlayPause}
            onNext={handleNext}
            onPrev={handlePrev}
          />
        );
    }
  };

  if (showLogo) {
    return <LogoAnimation />;
  }

  return (
    <div className="app">
      <Navbar 
        currentView={currentView}
        onNavClick={handleNavClick}
      />
      <div className="content">
        {renderCurrentView()}
      </div>
      <MusicPlayer
        currentSong={currentSong}
        isPlaying={isPlaying}
        onPlayPause={handlePlayPause}
        nextSong={handleNext}
        prevSong={handlePrev}
        playlist={playlist}
      />
    </div>
  );
}


const LogoAnimation = () => {
  return (
    <div className="logo-container">
      <div className="logo-animation">
        <div className="letter-k">K</div>
        <div className="rest-letters">odeWithMusic</div>
      </div>
      <div className="neon-background"></div>
    </div>
  );
};

export default App;
