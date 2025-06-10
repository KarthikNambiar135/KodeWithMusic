import React, { useState, useEffect } from "react";
import { DndContext, closestCenter } from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GLOBAL_ENDPOINT } from "../constants";
import "./Home.css";

function SortableTile({ playlist, index, onClick }) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: playlist.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    animationDelay: `${index * 0.1}s`,
  };


  return (
    <div
      ref={setNodeRef}
      {...attributes}
      className="tile playlist-tile"
      style={style}
      onClick={() => onClick(playlist)}
    >
      {/* Drag Handle */}
      <div className="drag-handle" {...listeners}>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="white">
          <circle cx="5" cy="5" r="2" />
          <circle cx="15" cy="5" r="2" />
          <circle cx="5" cy="15" r="2" />
          <circle cx="15" cy="15" r="2" />
        </svg>
      </div>
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
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function NewPlaylistModal({ onClose, onCreate }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [coverImage, setCoverImage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("title", title);
    formData.append("playlist_type", "user");
    formData.append("is_public", "true");
    formData.append("description", description);
    if (coverImage) {
      formData.append("cover_image", coverImage);
    }

    try {
      const response = await fetch(`${GLOBAL_ENDPOINT}/playlists/`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (response.ok && data.playlist) {
        onCreate(data.playlist);
        onClose();
      } else {
        alert("Failed to create playlist");
      }
    } catch (err) {
      console.error("Error creating playlist", err);
      alert("An error occurred.");
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>Create New Playlist</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Playlist title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <textarea
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setCoverImage(e.target.files[0])}
          />
          <div className="modal-actions">
            <button type="submit">Create</button>
            <button type="button" onClick={onClose} className="cancel-btn">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


function Library({ onPlaylistClick }) {
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);


  const handleCreatePlaylist = () => setShowModal(true);

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
        const sortedPlaylists = (data.playlists || []).sort((a, b) => a.sort_order - b.sort_order);
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

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = playlists.findIndex(p => p.id === active.id);
    const newIndex = playlists.findIndex(p => p.id === over.id);

    const reordered = arrayMove(playlists, oldIndex, newIndex);
    setPlaylists(reordered);

    fetch(`${GLOBAL_ENDPOINT}/update-playlist-order/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playlist_ids: reordered.map(p => p.id) })
    });
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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h2>Your Library</h2>
        <button onClick={handleCreatePlaylist} className="new-playlist-btn">
        + New Playlist
          </button>
          </div>
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={playlists.map(p => p.id)} strategy={verticalListSortingStrategy}>
            <div className="tiles-grid recommended-tiles">
              {playlists.map((playlist, index) => (
                <SortableTile
                  key={playlist.id}
                  playlist={playlist}
                  index={index}
                  onClick={handlePlaylistClick}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        {playlists.length === 0 && (
          <div className="empty-library">
            <p>No playlists found. Create your first playlist!</p>
          </div>
        )}
      </section>
      {showModal && (
  <NewPlaylistModal
    onClose={() => setShowModal(false)}
    onCreate={(newPlaylist) =>
      setPlaylists((prev) => [...prev, newPlaylist])
    }
  />
)}

    </main>
  );
}

export default Library;
