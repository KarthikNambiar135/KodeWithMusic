#app/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('api/home/', views.home_data, name='home_data'),
    path('api/quick-access/', views.QuickAccessPlaylistsView.as_view(), name='quick_access'),
    path('api/library/', views.library_data, name='library_data'),
    path('api/playlist/<int:playlist_id>/songs/', views.playlist_songs, name='playlist_songs'),
    path('api/playlists/', views.get_playlists, name='get_playlists'),
    path('api/recommended/', views.RecommendedPlaylistsView.as_view(), name='recommended'),
    path('api/recent-songs/', views.RecentSongsView.as_view(), name='recent_songs'),
    path('api/track-play/', views.track_song_play, name='track_play'),
    path('api/search/', views.search_data, name='search_data'),
    # Song customization endpoints
    path('api/songs/', views.get_all_songs, name='get_all_songs'),
    path('api/playlists/', views.get_playlists, name='get_playlists'),
    
    # Custom clip endpoints
    path('api/create-clip/', views.create_clip, name='create_clip'),
    path('api/custom-clips/', views.get_custom_clips, name='get_custom_clips'),
    path('api/clips/<int:clip_id>/delete/', views.delete_clip, name='delete_clip'),
    
    # Mix endpoints
    path('api/create-mix/', views.create_mix, name='create_mix'),
    path('api/mixes/', views.get_user_mixes, name='get_user_mixes'),
    path('api/mixes/<int:mix_id>/delete/', views.delete_mix, name='delete_mix'),
    path('api/preload-songs/', views.preload_songs, name='preload_songs'),
    path('api/preload-clips/', views.preload_clips, name='preload_clips'),
    path('api/update-playlist-order/', views.update_playlist_order, name='update_playlist_order'),
    path('api/playlist/<int:playlist_id>/add-song/', views.add_song_to_playlist),
    path('api/playlist/<int:playlist_id>/add-clip/', views.add_clip_to_playlist),
]
