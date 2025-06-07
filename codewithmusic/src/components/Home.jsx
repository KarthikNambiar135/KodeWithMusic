  import React, { useState, useEffect } from "react";
  import "./Home.css";

  // const quickAccessPlaylists = [
  //   { id: 1, title: "Liked Songs", count: "142 songs", cover: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop" },
  //   { id: 2, title: "Recently Played", count: "28 songs", cover: "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=300&h=300&fit=crop" },
  //   { id: 3, title: "Discover Weekly", count: "30 songs", cover: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop" },
  //   { id: 4, title: "Your Mix", count: "50 songs", cover: "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=300&h=300&fit=crop" }
  // ];

  // const recommendedPlaylists = [
  //   { id: 5, title: "Chill Vibes", artist: "Spotify", cover: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop" },
  //   { id: 6, title: "Electronic Mix", artist: "DJ Mix", cover: "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=300&h=300&fit=crop" },
  //   { id: 7, title: "Rock Classics", artist: "Rock Radio", cover: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop" },
  //   { id: 8, title: "Pop Hits", artist: "Pop Central", cover: "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=300&h=300&fit=crop" },
  //   { id: 9, title: "Jazz Lounge", artist: "Smooth Jazz", cover: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop" },
  //   { id: 10, title: "Hip Hop Central", artist: "Urban Beats", cover: "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=300&h=300&fit=crop" }
  // ];

  // const recentSongs = [
  //   { id: 1, title: "Blinding Lights", artist: "The Weeknd", duration: "3:20", cover: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop" },
  //   { id: 2, title: "Watermelon Sugar", artist: "Harry Styles", duration: "2:54", cover: "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=300&h=300&fit=crop" },
  //   { id: 3, title: "Levitating", artist: "Dua Lipa", duration: "3:23", cover: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop" },
  //   { id: 4, title: "Good 4 U", artist: "Olivia Rodrigo", duration: "2:58", cover: "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=300&h=300&fit=crop" },
  //   { id: 5, title: "Stay", artist: "The Kid LAROI", duration: "2:21", cover: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop" },
  //   { id: 6, title: "Heat Waves", artist: "Glass Animals", duration: "3:58", cover: "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=300&h=300&fit=crop" }
  // ];

function Home({ onSongClick, onPlaylistClick }) {
  const [data, setData] = useState({
    quickAccess: [],
    recommended: [],
    recentSongs: []
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

const fetchData = () => {
  setLoading(true);
  setError(null);

    fetch('http://localhost:8000/api/home/')
          .then(res => {
            if (!res.ok) {
              throw new Error(`HTTP error! status: ${res.status}`);
            }
            return res.json();
          })
          .then(data => {
            console.log('API Response:', data); //Debug log
            setData({
              quickAccess: data.quick_access || [],
              recommended: data.recommended || [],
              recentSongs: data.recent_songs || []
            });
            setLoading(false);
          })
          .catch(error => {
            console.error('Fetch error:', error);
            setError(error.message);
            setLoading(false);
          });
};

useEffect(() => {
  fetchData();
}, []);


  if (loading) {
    return (
      <main className="main-content">
        <div className="loading-spinner" role="status" aria-live="polite">
         <div className="spinner"></div>
         <div className="loading">Loading...</div>
         </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="main-content">
        <div className="error">
        <p>Error: {error}  This issue is most likely caused due to the Free-Tier Backend still waking up. Please Try again after 20 seconds.</p>
        <button onClick={fetchData} className="retry-button">
          Try Again
        </button>
      </div>
      </main>
    );
  }

  return (
    <>
    <main className="main-content">
      <header className="page-header">
        <h1 className="app-title">
          <span className="k-mirrored">K</span><span className="gradient-text">odeWithMusic</span>
        </h1>
      </header>

      <section className="quick-access">
        <h2>Quick Access</h2>
        <div className="tiles-grid quick-tiles">
          {data.quickAccess.map((playlist, index) => (
            <div key={playlist.id} className="tile" style={{ animationDelay: `${index * 0.1}s` }} onClick={() => onPlaylistClick(playlist)}>
              <img src={playlist.cover} alt={playlist.title} />
              <div className="tile-info">
                <h3>{playlist.title}</h3>
                <p>{playlist.count}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="recommended">
        <h2>Recommended for You</h2>
        <div className="tiles-grid recommended-tiles">
          {data.recommended.map((playlist, index) => (
            <div key={playlist.id} className="tile" style={{ animationDelay: `${(index + 4) * 0.1}s` }} onClick={() => onPlaylistClick(playlist)}>
              <img src={playlist.cover} alt={playlist.title} />
              <div className="tile-info">
                <h3>{playlist.title}</h3>
                <p>{playlist.artist}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="recent-songs">
        <h2>Recently Played</h2>
        <div className="songs-grid">
          {data.recentSongs.map((song, index) => (
            <div key={song.id} className="song-item" style={{ animationDelay: `${(index + 10) * 0.1}s` }} onClick={() => onSongClick(song, index)}>
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
    </main>
    </>
  );
}

export default Home;